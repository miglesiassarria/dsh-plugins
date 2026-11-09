/**
 * DSH Config — Host half.
 *
 * Owns the durable preferences of the plugin. The first one is the order of the
 * categories shown in the left rail of the Settings panel: the browser half
 * edits that order by dragging the categories, and this half stores it in
 * `$DSH_HOME/dsh-config/settings.json` so it survives page reloads, profile
 * edits and Harness restarts. The document is served over a same-origin route;
 * it holds no secrets.
 *
 * @module @local/dsh-config
 */

import { randomBytes } from 'node:crypto'
import { chmodSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

/** Services this plugin cannot work without. */
export const inject = ['webServer']

/** Same-origin route prefix used by the browser half. */
const ROUTE = '/dsh-config'

/** Custom header that forces a CORS preflight for cross-origin callers. */
const HEADER = 'x-dsh-config'

/** Request body ceiling for the settings route. */
const MAX_BODY_BYTES = 16 * 1024

/** Maximum number of retained category ids. */
const MAX_ORDER_ENTRIES = 128

/** Maximum length of one category id. */
const MAX_ID_LENGTH = 200

/** Persisted document defaults. */
const DEFAULTS = Object.freeze({
  version: 1,
  settingsOrder: [],
})

/**
 * Resolve the plugin's durable directory.
 * @returns {string} Absolute directory path.
 */
export function storeDirectory() {
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'dsh-config')
}

/**
 * @returns {string} The persisted document path.
 */
export function storeFile() {
  return join(storeDirectory(), 'settings.json')
}

/**
 * Build an error carrying a stable code the browser half can report.
 * @param {string} code Stable error code.
 * @param {number} [status] HTTP status.
 * @returns {Error & { code: string, status?: number }} The error.
 */
function fail(code, status = 400) {
  const error = new Error(code)
  error.code = code
  error.status = status
  return error
}

/**
 * Narrow a submitted category order.
 * @param {unknown} input Untrusted value.
 * @returns {string[]} Unique, non-empty category ids in the submitted order.
 */
function sanitizeOrder(input) {
  if (!Array.isArray(input)) throw fail('invalid-order')
  if (input.length > MAX_ORDER_ENTRIES) throw fail('order-too-long')
  const seen = new Set()
  const order = []
  for (const id of input) {
    if (typeof id !== 'string' || id.length === 0 || id.length > MAX_ID_LENGTH) {
      throw fail('invalid-order-entry')
    }
    if (seen.has(id)) continue
    seen.add(id)
    order.push(id)
  }
  return order
}

/**
 * Narrow a stored or submitted settings document.
 * @param {unknown} input Untrusted value.
 * @returns {{ version: number, settingsOrder: string[] }} Valid settings.
 */
function sanitize(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw fail('invalid-settings')
  const order = input.settingsOrder === undefined ? DEFAULTS.settingsOrder : sanitizeOrder(input.settingsOrder)
  return { version: DEFAULTS.version, settingsOrder: order }
}

/**
 * Read the stored settings, tolerating a missing or malformed file.
 * @returns {{ version: number, settingsOrder: string[] }} Valid settings.
 */
export function readSettings() {
  let text
  try {
    text = readFileSync(storeFile(), 'utf8')
  } catch {
    return { version: DEFAULTS.version, settingsOrder: [...DEFAULTS.settingsOrder] }
  }
  try {
    return sanitize(JSON.parse(text))
  } catch {
    return { version: DEFAULTS.version, settingsOrder: [...DEFAULTS.settingsOrder] }
  }
}

/**
 * Write the settings durably: private permissions, temporary file then rename.
 * @param {{ settingsOrder?: string[] }} patch Fields to replace.
 * @returns {{ version: number, settingsOrder: string[] }} The stored document.
 */
export function writeSettings(patch) {
  const next = sanitize({
    version: DEFAULTS.version,
    settingsOrder: patch?.settingsOrder ?? readSettings().settingsOrder,
  })
  mkdirSync(storeDirectory(), { recursive: true, mode: 0o700 })
  const file = storeFile()
  const temporary = `${file}.${randomBytes(4).toString('hex')}.tmp`
  writeFileSync(temporary, `${JSON.stringify(next, undefined, 2)}\n`, { mode: 0o600 })
  try {
    chmodSync(temporary, 0o600)
  } catch {
    // Non-POSIX filesystems keep their default mode.
  }
  renameSync(temporary, file)
  return next
}

/**
 * Read a JSON request body with a size ceiling.
 * @param {import('node:http').IncomingMessage} request Incoming request.
 * @returns {Promise<Record<string, unknown>>} Parsed body.
 */
async function readJsonBody(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw fail('body-too-large', 413)
    chunks.push(chunk)
  }
  if (size === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw fail('invalid-json')
  }
}

/**
 * Answer one request from the browser half.
 * @param {import('node:http').IncomingMessage} request Incoming request.
 * @param {import('node:http').ServerResponse} response Outgoing response.
 * @returns {Promise<void>} Resolves when the response ends.
 */
export async function handleRequest(request, response) {
  const reply = (status, payload) => {
    const body = JSON.stringify(payload)
    response.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'content-length': Buffer.byteLength(body),
    })
    response.end(body)
  }
  try {
    if (request.headers[HEADER] !== '1') {
      reply(403, { ok: false, error: 'unauthorized' })
      return
    }
    const url = new URL(request.url ?? ROUTE, `http://${request.headers.host ?? 'localhost'}`)
    const path = url.pathname.startsWith(ROUTE) ? url.pathname.slice(ROUTE.length) : url.pathname
    const method = request.method ?? 'GET'

    if (path === '/settings' && method === 'GET') {
      reply(200, { ok: true, data: readSettings() })
      return
    }

    if (path === '/settings' && method === 'POST') {
      const body = await readJsonBody(request)
      const patch = {
        ...(body.settingsOrder === undefined ? {} : { settingsOrder: sanitizeOrder(body.settingsOrder) }),
      }
      reply(200, { ok: true, data: writeSettings(patch) })
      return
    }

    reply(404, { ok: false, error: 'not-found' })
  } catch (error) {
    const status = typeof error?.status === 'number' ? error.status : 500
    reply(status, { ok: false, error: typeof error?.code === 'string' ? error.code : 'request-failed' })
  }
}

/**
 * Install the settings route.
 * @param {import('@deepseek-ai/cordis').Context} ctx Host context.
 * @returns {void}
 */
export function apply(ctx) {
  ctx.effect(() => {
    const disposeRoute = ctx.webServer.register({
      kind: 'prefix',
      path: ROUTE,
      handler: (request, response) => {
        void handleRequest(request, response)
      },
    })
    return () => disposeRoute()
  }, 'dsh-config settings route')
}
