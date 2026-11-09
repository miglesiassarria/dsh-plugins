/**
 * Groq dictation — Host half.
 *
 * Keeps the Groq API key out of the browser and turns the same-origin settings
 * and transcription routes into the only network boundary the composer needs.
 * The browser records a short clip with `MediaRecorder`, posts the raw audio to
 * `/dsh-groq-dictation/transcribe`, and this module forwards it to Groq's
 * Whisper endpoint with a server-held key.
 *
 * The key lives in `$DSH_HOME/groq-dictation/settings.json` with owner-only
 * permissions. It is never returned to the page; the settings route exposes
 * only whether a key exists and its last four characters.
 *
 * @module @local/groq-dictation
 */

import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

/** Services this plugin cannot work without. */
export const inject = ['webServer']

/** Same-origin route prefix used by the browser half. */
const ROUTE = '/dsh-groq-dictation'

/** Custom header that forces a CORS preflight for cross-origin callers. */
const HEADER = 'x-dsh-groq-dictation'

/** Groq speech-to-text endpoint. */
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/audio/transcriptions'

/** Request body ceiling for the settings route. */
const MAX_SETTINGS_BODY_BYTES = 16 * 1024

/** Request body ceiling for one audio upload (Groq accepts at most 25 MB). */
const MAX_AUDIO_BODY_BYTES = 24 * 1024 * 1024

/** Upstream request ceiling, so a stalled connection cannot hold the route. */
const UPSTREAM_TIMEOUT_MS = 120_000

/** Whisper models the settings page can select. */
export const MODELS = Object.freeze([
  'whisper-large-v3-turbo',
  'whisper-large-v3',
  'distil-whisper-large-v3-en',
])

/** Persisted defaults. */
const DEFAULTS = Object.freeze({
  version: 1,
  apiKey: '',
  model: MODELS[0],
})

/** Accepted upload media types and the file name each is forwarded with. */
const AUDIO_TYPES = Object.freeze({
  'audio/webm': 'dictation.webm',
  'audio/ogg': 'dictation.ogg',
  'audio/mp4': 'dictation.mp4',
  'audio/m4a': 'dictation.m4a',
  'audio/x-m4a': 'dictation.m4a',
  'audio/mpeg': 'dictation.mp3',
  'audio/mp3': 'dictation.mp3',
  'audio/wav': 'dictation.wav',
  'audio/x-wav': 'dictation.wav',
  'audio/wave': 'dictation.wav',
  'audio/flac': 'dictation.flac',
  'audio/x-flac': 'dictation.flac',
})

/** One failed operation; `code` is stable for the browser to translate. */
export class DictationError extends Error {
  /**
   * @param {string} code Stable machine-readable reason.
   * @param {number} status HTTP status the route should use.
   * @param {string} [detail] Human-readable detail.
   */
  constructor(code, status, detail) {
    super(detail ?? code)
    this.name = 'DictationError'
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
 * @returns {DictationError} The failure.
 */
function fail(code, status = 400, detail) {
  return new DictationError(code, status, detail)
}

/**
 * Resolve the plugin's durable directory.
 * @returns {string} Absolute directory path.
 */
export function storeDirectory() {
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'groq-dictation')
}

/** @returns {string} The persisted document path. */
export function storeFile() {
  return join(storeDirectory(), 'settings.json')
}

/**
 * Narrow one persisted or submitted model id.
 * @param {unknown} value Candidate model.
 * @returns {string} A supported model id.
 */
function normalizeModel(value) {
  if (typeof value !== 'string' || !MODELS.includes(value)) throw fail('invalid-model')
  return value
}

/**
 * Narrow one submitted key. An empty string deliberately clears the stored key.
 * @param {unknown} value Candidate key.
 * @returns {string} Trimmed key, or an empty string.
 */
function normalizeApiKey(value) {
  if (typeof value !== 'string') throw fail('invalid-api-key')
  const key = value.trim()
  if (key === '') return ''
  if (key.length < 20 || key.length > 512 || /\s/u.test(key)) throw fail('invalid-api-key')
  return key
}

/**
 * Read the persisted settings, falling back to defaults when the file is absent.
 * @returns {{ version: number, apiKey: string, model: string }} Stored settings.
 */
export function readSettings() {
  const file = storeFile()
  if (!existsSync(file)) return { ...DEFAULTS }
  let parsed
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return { ...DEFAULTS }
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ...DEFAULTS }
  }
  return {
    version: 1,
    apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey.trim() : '',
    model: MODELS.includes(parsed.model) ? parsed.model : DEFAULTS.model,
  }
}

/**
 * Merge one settings patch into the persisted document.
 * @param {unknown} input Untrusted patch.
 * @returns {{ version: number, apiKey: string, model: string }} Saved settings.
 */
export function writeSettings(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw fail('invalid-settings')
  const previous = readSettings()
  const next = {
    version: 1,
    apiKey: input.apiKey === undefined ? previous.apiKey : normalizeApiKey(input.apiKey),
    model: input.model === undefined ? previous.model : normalizeModel(input.model),
  }
  const directory = storeDirectory()
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  try {
    chmodSync(directory, 0o700)
  } catch {
    // The directory may be on a file system without POSIX modes.
  }
  const temporary = `${storeFile()}.tmp`
  writeFileSync(temporary, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 })
  renameSync(temporary, storeFile())
  try {
    chmodSync(storeFile(), 0o600)
  } catch {
    // Best effort; the write mode already requested owner-only permissions.
  }
  return next
}

/**
 * Strip the secret from the settings document before sending it to the page.
 * @param {{ apiKey: string, model: string }} settings Stored settings.
 * @returns {{ configured: boolean, model: string, models: string[], apiKeyHint: string }} Public view.
 */
export function publicSettings(settings) {
  return {
    configured: settings.apiKey !== '',
    model: settings.model,
    models: [...MODELS],
    apiKeyHint: settings.apiKey === '' ? '' : settings.apiKey.slice(-4),
  }
}

/**
 * Read a request body with a byte ceiling.
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
 * Read and parse a JSON request body.
 * @param {import('node:http').IncomingMessage} request Incoming request.
 * @returns {Promise<any>} Parsed value.
 */
async function readJsonBody(request) {
  const buffer = await readBody(request, MAX_SETTINGS_BODY_BYTES)
  if (buffer.length === 0) return {}
  try {
    return JSON.parse(buffer.toString('utf8'))
  } catch {
    throw fail('invalid-json')
  }
}

/**
 * Normalize one audio content type and resolve its forward filename.
 * @param {unknown} value Raw Content-Type header.
 * @returns {{ type: string, filename: string } | null} Audio identity.
 */
function audioIdentity(value) {
  const type = String(value ?? '').split(';')[0].trim().toLowerCase()
  const filename = AUDIO_TYPES[type]
  return filename === undefined ? null : { type, filename }
}

/**
 * Forward one clip to Groq and return its transcript.
 * @param {Buffer} audio Raw audio bytes.
 * @param {unknown} contentType Raw Content-Type header.
 * @returns {Promise<{ text: string, model: string }>} Transcript.
 */
async function transcribe(audio, contentType) {
  if (audio.length === 0) throw fail('empty-audio')
  const settings = readSettings()
  if (settings.apiKey === '') throw fail('missing-api-key')
  const identity = audioIdentity(contentType)
  if (identity === null) throw fail('unsupported-audio', 415)

  const form = new FormData()
  form.append('model', settings.model)
  form.append('file', new Blob([audio], { type: identity.type }), identity.filename)
  form.append('response_format', 'json')
  form.append('temperature', '0')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)
  let response
  try {
    response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: { authorization: `Bearer ${settings.apiKey}` },
      body: form,
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw fail('timeout', 504)
    throw fail('network-error', 502)
  } finally {
    clearTimeout(timer)
  }

  const raw = await response.text()
  let payload = null
  try {
    payload = JSON.parse(raw)
  } catch {
    payload = null
  }

  if (!response.ok) {
    const detail = typeof payload?.error?.message === 'string' ? payload.error.message.slice(0, 300) : `HTTP ${response.status}`
    if (response.status === 401 || response.status === 403) throw fail('invalid-key', 401, detail)
    if (response.status === 429) throw fail('rate-limited', 429, detail)
    if (response.status === 413) throw fail('audio-too-large', 413, detail)
    if (response.status === 400) throw fail('bad-request', 400, detail)
    throw fail('upstream-error', 502, detail)
  }

  const text = typeof payload?.text === 'string' ? payload.text.trim() : ''
  if (text === '') throw fail('empty-transcript', 422)
  return { text, model: settings.model }
}

/**
 * Answer one request from the browser half.
 * @param {import('node:http').IncomingMessage} request Incoming request.
 * @param {import('node:http').ServerResponse} response Outgoing response.
 * @returns {Promise<void>} Resolves when the response ended.
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
    // Same-origin only: a custom header forces a CORS preflight for any
    // cross-origin caller, and this route never answers one.
    if (request.headers[HEADER] !== '1') {
      reply(403, { ok: false, code: 'forbidden', error: 'Petición no autorizada' })
      return
    }

    const method = request.method ?? 'GET'
    const url = new URL(request.url ?? ROUTE, `http://${request.headers.host ?? 'localhost'}`)
    const path = url.pathname.startsWith(ROUTE) ? url.pathname.slice(ROUTE.length) : url.pathname
    const segments = path.split('/').filter((segment) => segment.length > 0)
    const action = segments[0]

    if (action === 'settings' && segments.length === 1) {
      if (method === 'GET') {
        reply(200, { ok: true, data: publicSettings(readSettings()) })
        return
      }
      if (method === 'POST') {
        const body = await readJsonBody(request)
        reply(200, { ok: true, data: publicSettings(writeSettings(body)) })
        return
      }
    }

    if (action === 'transcribe' && segments.length === 1 && method === 'POST') {
      const audio = await readBody(request, MAX_AUDIO_BODY_BYTES)
      reply(200, { ok: true, data: await transcribe(audio, request.headers['content-type']) })
      return
    }

    reply(404, { ok: false, code: 'unknown-route', error: 'Ruta desconocida' })
  } catch (error) {
    const status = error instanceof DictationError ? error.status : 500
    const code = error instanceof DictationError ? error.code : 'internal-error'
    const detail = error instanceof DictationError ? error.detail : String(error?.message ?? error)
    if (response.headersSent) {
      response.end()
      return
    }
    reply(status, { ok: false, code, error: detail })
  }
}

/**
 * Mount the dictation route.
 * @param {import('@deepseek-ai/cordis').Context} ctx Plugin context.
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
  }, 'groq-dictation route')
}

/** Test seam: the operations above, without the HTTP layer. */
export const __test = {
  apply,
  handleRequest,
  readSettings,
  writeSettings,
  publicSettings,
  transcribe,
  storeDirectory,
  storeFile,
  MODELS,
}
