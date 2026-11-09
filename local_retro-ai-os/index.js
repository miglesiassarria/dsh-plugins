/**
 * Retro AI OS — Host half.
 *
 * Persists the visual preferences (enabled, style, companion, animations) in
 * `$DSH_HOME/retro-ai-os/preferences.json` and serves them to the browser half
 * over a same-origin HTTP route. The palette itself is applied by the Client
 * half as a reversible token layer, so switching off restores the host theme
 * exactly.
 *
 * @module @local/retro-ai-os
 */

import { randomBytes } from 'node:crypto'
import { chmodSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

/** Services this plugin cannot work without. */
export const inject = ['webServer']

/** Same-origin route prefix used by the browser half. */
const ROUTE = '/dsh-retro-ai-os'

/** Custom header that forces a CORS preflight for cross-origin callers. */
const HEADER = 'x-dsh-retro-ai-os'

/** Request body ceiling for the preferences route. */
const MAX_BODY_BYTES = 16 * 1024

/** Style ids the Client half can render. */
const STYLES = new Set(['classic', 'amber', 'vapor', 'cobalt'])

/** Persisted defaults. */
const DEFAULTS = Object.freeze({
  version: 1,
  enabled: false,
  style: 'classic',
  mascot: true,
  animation: true,
})

/**
 * Resolve the plugin's durable directory.
 * @returns {string} Absolute directory path.
 */
export function storeDirectory() {
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'retro-ai-os')
}

/** @returns {string} The persisted document path. */
export function storeFile() {
  return join(storeDirectory(), 'preferences.json')
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
 * Narrow one stored or submitted preference document.
 * @param {unknown} input Untrusted value.
 * @returns {{ version: number, enabled: boolean, style: string, mascot: boolean, animation: boolean }} Valid preferences.
 */
function sanitize(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw fail('invalid-preferences')
  const enabled = input.enabled
  const mascot = input.mascot
  const animation = input.animation
  const style = input.style
  if (enabled !== undefined && typeof enabled !== 'boolean') throw fail('invalid-enabled')
  if (mascot !== undefined && typeof mascot !== 'boolean') throw fail('invalid-mascot')
  if (animation !== undefined && typeof animation !== 'boolean') throw fail('invalid-animation')
  if (style !== undefined && !STYLES.has(style)) throw fail('invalid-style')
  return {
    version: 1,
    enabled: enabled ?? DEFAULTS.enabled,
    style: style ?? DEFAULTS.style,
    mascot: mascot ?? DEFAULTS.mascot,
    animation: animation ?? DEFAULTS.animation,
  }
}

/**
 * Read the stored preferences, tolerating a missing or malformed file.
 * @returns {{ version: number, enabled: boolean, style: string, mascot: boolean, animation: boolean }} Valid preferences.
 */
export function readPreferences() {
  let text
  try {
    text = readFileSync(storeFile(), 'utf8')
  } catch {
    return { ...DEFAULTS }
  }
  try {
    return sanitize(JSON.parse(text))
  } catch {
    return { ...DEFAULTS }
  }
}

/**
 * Write the preferences durably: private permissions, temp file then rename.
 * @param {{ version: number, enabled: boolean, style: string, mascot: boolean, animation: boolean }} preferences Valid preferences.
 * @returns {typeof preferences} The stored document.
 */
export function writePreferences(preferences) {
  const document = sanitize(preferences)
  mkdirSync(storeDirectory(), { recursive: true, mode: 0o700 })
  const file = storeFile()
  const temporary = `${file}.${randomBytes(4).toString('hex')}.tmp`
  writeFileSync(temporary, `${JSON.stringify(document, undefined, 2)}\n`, { mode: 0o600 })
  try {
    chmodSync(temporary, 0o600)
  } catch {
    // Non-POSIX filesystems keep their default mode.
  }
  renameSync(temporary, file)
  return document
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

    if (path === '/preferences' && method === 'GET') {
      reply(200, { ok: true, data: readPreferences() })
      return
    }

    if (path === '/preferences' && method === 'POST') {
      const body = await readJsonBody(request)
      reply(200, { ok: true, data: writePreferences({ ...readPreferences(), ...body }) })
      return
    }

    reply(404, { ok: false, error: 'not-found' })
  } catch (error) {
    const status = typeof error?.status === 'number' ? error.status : 500
    reply(status, { ok: false, error: typeof error?.code === 'string' ? error.code : 'request-failed' })
  }
}

/**
 * Install the preferences route.
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
  }, 'retro-ai-os preferences route')
}
