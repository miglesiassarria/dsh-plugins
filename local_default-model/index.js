/**
 * Default model — Host half.
 *
 * Owns one durable choice: the model every *new* chat starts with. The choice
 * lives in `$DSH_HOME/default-model/settings.json` (owner-only permissions) so
 * it survives profile edits, configuration drift, and Harness restarts.
 *
 * Two mechanisms keep that promise:
 *
 * 1. Settings changes apply to the live blank sessions the GUI reuses as new
 *    chats, so the next conversation starts on the chosen model even though no
 *    new Agent is created.
 * 2. Every new root Agent gets a durable `model/selection` event with the
 *    pinned choice. The shipped session controller treats a per-session model
 *    change as the new deployment default; this plugin leaves that behavior
 *    alone for non-blank sessions, but the pinned choice still wins for chats
 *    that have not started a turn.
 *
 * The browser talks to this module through a same-origin route only. The pinned
 * document holds no secrets: provider and model ids are the same strings the
 * Models settings page already displays.
 *
 * @module @local/default-model
 */

import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

/** Services this plugin needs to expose the page and keep the pin in effect. */
export const inject = ['agents', 'agentDefaultModel', 'llm', 'webServer']

/** Same-origin route prefix used by the browser half. */
export const ROUTE = '/dsh-default-model'

/** Custom header that forces a CORS preflight for cross-origin callers. */
const HEADER = 'x-dsh-default-model'

/** Request body ceiling for one selection save. */
const MAX_BODY_BYTES = 16 * 1024

/** Longest accepted provider or model id. */
const MAX_ID_LENGTH = 200

/** Persisted document version. */
const VERSION = 1

/** One failed operation; `code` is stable for the browser to translate. */
export class DefaultModelError extends Error {
  /**
   * @param {string} code Stable machine-readable reason.
   * @param {number} status HTTP status the route should use.
   * @param {string} [detail] Human-readable detail.
   */
  constructor(code, status, detail) {
    super(detail ?? code)
    this.name = 'DefaultModelError'
    this.code = code
    this.status = status
    this.detail = detail ?? code
  }
}

/**
 * Build a failure with the route's status.
 * @param {string} code Stable reason.
 * @param {number} [status] HTTP status.
 * @param {string} [detail] Optional detail.
 * @returns {DefaultModelError} The failure.
 */
function fail(code, status = 400, detail) {
  return new DefaultModelError(code, status, detail)
}

/** @param {unknown} error @returns {string} A readable message. */
function messageOf(error) {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Resolve the plugin's durable directory.
 * @returns {string} Absolute directory path.
 */
export function storeDirectory() {
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'default-model')
}

/** @returns {string} The persisted document path. */
export function storeFile() {
  return join(storeDirectory(), 'settings.json')
}

/**
 * Narrow one selection submitted by the page or read from disk.
 * @param {unknown} input Candidate selection.
 * @returns {{ provider: string, model: string, reasoningEffort?: string }} A detached selection.
 */
export function normalizeSelection(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw fail('invalid-selection')
  const provider = typeof input.provider === 'string' ? input.provider.trim() : ''
  const model = typeof input.model === 'string' ? input.model.trim() : ''
  if (provider === '' || provider.length > MAX_ID_LENGTH) throw fail('invalid-selection')
  if (model === '' || model.length > MAX_ID_LENGTH) throw fail('invalid-selection')
  const reasoningEffort = input.reasoningEffort
  if (reasoningEffort === undefined) return { provider, model }
  if (typeof reasoningEffort !== 'string') throw fail('invalid-selection')
  const effort = reasoningEffort.trim()
  if (effort === '' || effort.length > MAX_ID_LENGTH) throw fail('invalid-selection')
  return { provider, model, reasoningEffort: effort }
}

/**
 * Compare complete selections, treating an absent effort as its own value.
 * @param {{ provider: string, model: string, reasoningEffort?: string } | undefined} left First selection.
 * @param {{ provider: string, model: string, reasoningEffort?: string } | undefined} right Second selection.
 * @returns {boolean} Whether both name the same route and effort.
 */
export function sameSelection(left, right) {
  if (left === undefined || right === undefined) return left === right
  return left.provider === right.provider && left.model === right.model && left.reasoningEffort === right.reasoningEffort
}

/**
 * Read the pinned selection, tolerating a missing or damaged document.
 * @returns {{ provider: string, model: string, reasoningEffort?: string } | undefined} The pinned selection.
 */
export function readPinnedSelection() {
  const file = storeFile()
  if (!existsSync(file)) return undefined
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'))
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return undefined
    if (parsed.version !== VERSION) return undefined
    return normalizeSelection(parsed.selection)
  } catch {
    return undefined
  }
}

/**
 * Persist one pinned selection atomically with owner-only permissions.
 * @param {{ provider: string, model: string, reasoningEffort?: string }} selection Selection to store.
 * @returns {void}
 */
export function writePinnedSelection(selection) {
  const directory = storeDirectory()
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  try {
    chmodSync(directory, 0o700)
  } catch {
    // The directory may be on a file system without POSIX modes.
  }
  const document = JSON.stringify({ version: VERSION, selection }, null, 2) + '\n'
  const temporary = `${storeFile()}.tmp`
  writeFileSync(temporary, document, { mode: 0o600 })
  renameSync(temporary, storeFile())
  try {
    chmodSync(storeFile(), 0o600)
  } catch {
    // Best effort; the write mode already requested owner-only permissions.
  }
}

/**
 * Adopt the live deployment default when no pin exists yet.
 * @param {import('@deepseek-ai/cordis').Context} ctx Host context.
 * @returns {{ provider: string, model: string, reasoningEffort?: string } | undefined} The adopted selection.
 */
export function adoptCurrentSelection(ctx) {
  try {
    const current = normalizeSelection(ctx.agentDefaultModel.currentSelection())
    try {
      writePinnedSelection(current)
    } catch (error) {
      ctx.logger?.warn?.(`default-model: the pinned document could not be written: ${messageOf(error)}`)
    }
    return current
  } catch (error) {
    ctx.logger?.warn?.(`default-model: the deployment default could not be read: ${messageOf(error)}`)
    return undefined
  }
}

/**
 * Project the live LLM registry into the grouped catalog the page selects from.
 * @param {import('@deepseek-ai/cordis').Context['llm']} llm Live LLM registry.
 * @returns {Promise<{ groups: Array<{ id: string, name: string, models: Array<{ id: string, name: string }> }>, failures: Array<{ id: string, name: string, message: string }> }>} Catalog.
 */
export async function buildCatalog(llm) {
  const groups = []
  const failures = []
  for (const provider of llm.listProviders()) {
    try {
      const models = await llm.listModels(provider.id)
      const entries = models.map((model) => ({
        id: model.id,
        name: typeof model.name === 'string' && model.name !== '' ? model.name : model.id,
      }))
      if (entries.length > 0) groups.push({ id: provider.id, name: provider.name ?? provider.id, models: entries })
    } catch (error) {
      failures.push({ id: provider.id, name: provider.name ?? provider.id, message: messageOf(error) })
    }
  }
  return { groups, failures }
}

/**
 * Whether a selection names a currently advertised model.
 * @param {{ groups: Array<{ id: string, models: Array<{ id: string }> }> }} catalog Catalog.
 * @param {{ provider: string, model: string }} selection Candidate.
 * @returns {boolean} Availability.
 */
export function selectionAvailable(catalog, selection) {
  return catalog.groups.some((group) => group.id === selection.provider && group.models.some((model) => model.id === selection.model))
}

/**
 * Whether a live Agent is an ordinary, unstarted chat this pin may prepare.
 * @param {{ session?: { header?: { parentSession?: string, origin?: string, isSeeded?: boolean }, inheritedEventCount?: number, events?: Array<{ type?: string }> } }} agent Candidate Agent.
 * @param {string} source Creation source reported by the Host.
 * @returns {boolean} Eligibility.
 */
export function isEligibleBlank(agent, source) {
  const session = agent?.session
  const header = session?.header
  if (header === undefined) return false
  if (header.parentSession !== undefined) return false
  if (header.origin === 'subagent') return false
  if (header.isSeeded === true) return false
  if ((session.inheritedEventCount ?? 0) > 0) return false
  if (source !== 'startup' && source !== 'resume') return false
  if (!Array.isArray(session.events)) return false
  return !session.events.some((event) => event?.type === 'turn/start')
}

/**
 * Record the pinned selection on one eligible Agent.
 * @param {{ model?: { current?: () => unknown, select?: (selection: object) => void }, session?: object }} agent Eligible Agent.
 * @param {{ provider: string, model: string, reasoningEffort?: string }} pinned Pinned selection.
 * @returns {boolean} Whether a selection was recorded.
 */
export function applyPinnedToAgent(agent, pinned) {
  if (typeof agent?.model?.select !== 'function') return false
  const current = typeof agent.model.current === 'function' ? agent.model.current() : undefined
  if (sameSelection(current, pinned)) return false
  agent.model.select({ ...pinned })
  return true
}

/**
 * Keep every live blank Agent on the pinned model. The GUI reuses one of these
 * as the next new chat without creating another Agent, so saving the default
 * has to reach them directly.
 * @param {import('@deepseek-ai/cordis').Context} ctx Host context.
 * @param {{ provider: string, model: string, reasoningEffort?: string }} pinned Pinned selection.
 * @returns {number} How many sessions were updated.
 */
export function syncBlankSessions(ctx, pinned) {
  let updated = 0
  for (const agent of ctx.agents.list()) {
    try {
      if (!isEligibleBlank(agent, 'resume')) continue
      if (applyPinnedToAgent(agent, pinned)) updated += 1
    } catch (error) {
      ctx.logger?.warn?.(`default-model: a blank session could not be updated: ${messageOf(error)}`)
    }
  }
  return updated
}

/**
 * Read one request body with a byte ceiling.
 * @param {import('node:http').IncomingMessage} request Incoming request.
 * @param {number} limit Maximum accepted bytes.
 * @returns {Promise<Buffer>} Body bytes.
 */
async function readBody(request, limit) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > limit) throw fail('too-large', 413)
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

/**
 * Read and parse one JSON request body.
 * @param {import('node:http').IncomingMessage} request Incoming request.
 * @returns {Promise<unknown>} Parsed value.
 */
async function readJsonBody(request) {
  const buffer = await readBody(request, MAX_BODY_BYTES)
  if (buffer.length === 0) throw fail('invalid-json')
  try {
    return JSON.parse(buffer.toString('utf8'))
  } catch {
    throw fail('invalid-json')
  }
}

/**
 * Build the page snapshot: the pinned selection plus the live catalog.
 * @param {import('@deepseek-ai/cordis').Context} ctx Host context.
 * @param {{ pinned?: object }} state The route's shared pin fallback.
 * @returns {Promise<object>} Snapshot.
 */
async function snapshotOf(ctx, state) {
  const catalog = await buildCatalog(ctx.llm)
  const pinned = readPinnedSelection() ?? state.pinned ?? adoptCurrentSelection(ctx)
  return {
    selection: pinned ?? null,
    available: pinned === undefined ? false : selectionAvailable(catalog, pinned),
    groups: catalog.groups,
    failures: catalog.failures,
  }
}

/**
 * Answer one request from the browser half.
 * @param {import('@deepseek-ai/cordis').Context} ctx Host context.
 * @param {{ pinned?: object }} state The route's shared pin fallback.
 * @param {import('node:http').IncomingMessage} request Incoming request.
 * @param {import('node:http').ServerResponse} response Outgoing response.
 * @returns {Promise<void>} Resolves when the response ended.
 */
export async function handleRequest(ctx, state, request, response) {
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
    // Same-origin only: a custom header forces a CORS preflight for any
    // cross-origin caller, and this route never answers one.
    if (request.headers[HEADER] !== '1') {
      reply(403, { ok: false, code: 'forbidden', error: 'Petición no autorizada' })
      return
    }

    const method = request.method ?? 'GET'
    const url = new URL(request.url ?? ROUTE, `http://${request.headers.host ?? 'localhost'}`)
    const path = url.pathname.startsWith(ROUTE) ? url.pathname.slice(ROUTE.length) : url.pathname

    if (path === '/state' && method === 'GET') {
      reply(200, { ok: true, data: await snapshotOf(ctx, state) })
      return
    }

    if (path === '/selection' && method === 'POST') {
      const body = await readJsonBody(request)
      const selection = normalizeSelection(body)
      const catalog = await buildCatalog(ctx.llm)
      if (!selectionAvailable(catalog, selection)) {
        throw fail('invalid-model', 400, `provider "${selection.provider}" does not advertise model "${selection.model}"`)
      }
      writePinnedSelection(selection)
      state.pinned = selection
      // Keep the shipped deployment default aligned with the explicit choice.
      // A rejected profile write does not undo the pin itself.
      try {
        await ctx.agentDefaultModel.saveSelection(selection)
      } catch (error) {
        ctx.logger?.warn?.(`default-model: the deployment default was not saved: ${messageOf(error)}`)
      }
      const updated = syncBlankSessions(ctx, selection)
      reply(200, {
        ok: true,
        data: {
          selection,
          available: true,
          groups: catalog.groups,
          failures: catalog.failures,
          updated,
        },
      })
      return
    }

    reply(404, { ok: false, code: 'unknown-route', error: 'Ruta desconocida' })
  } catch (error) {
    const status = error instanceof DefaultModelError ? error.status : 500
    const code = error instanceof DefaultModelError ? error.code : 'internal-error'
    const detail = error instanceof DefaultModelError ? error.detail : messageOf(error)
    if (response.headersSent) {
      response.end()
      return
    }
    reply(status, { ok: false, code, error: detail })
  }
}

/**
 * Mount the default-model route and creation policy.
 * @param {import('@deepseek-ai/cordis').Context} ctx Plugin context.
 * @returns {void}
 */
export function apply(ctx) {
  const state = { pinned: readPinnedSelection() ?? adoptCurrentSelection(ctx) }
  if (state.pinned !== undefined) {
    try {
      syncBlankSessions(ctx, state.pinned)
    } catch (error) {
      ctx.logger?.warn?.(`default-model: blank sessions were not synchronized at startup: ${messageOf(error)}`)
    }
  }

  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: ROUTE,
    handler: (request, response) => {
      void handleRequest(ctx, state, request, response)
    },
  }), 'default-model route')

  ctx.on('agent/created', ({ agent, source }) => {
    try {
      const pinned = readPinnedSelection() ?? state.pinned
      if (pinned === undefined) return
      if (!isEligibleBlank(agent, source)) return
      applyPinnedToAgent(agent, pinned)
    } catch (error) {
      ctx.logger?.warn?.(`default-model: a new session was not prepared: ${messageOf(error)}`)
    }
  })
}

/** Test seam: the operations above, without the Loader wiring. */
export const __test = {
  apply,
  applyPinnedToAgent,
  adoptCurrentSelection,
  buildCatalog,
  handleRequest,
  isEligibleBlank,
  normalizeSelection,
  readPinnedSelection,
  sameSelection,
  selectionAvailable,
  storeDirectory,
  storeFile,
  syncBlankSessions,
  writePinnedSelection,
}
