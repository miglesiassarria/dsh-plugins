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

import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { homedir, tmpdir } from 'node:os'
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
  hostMic: true,
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
    hostMic: parsed.hostMic === undefined ? DEFAULTS.hostMic : parsed.hostMic === true,
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
    hostMic: input.hostMic === undefined ? previous.hostMic : input.hostMic === true,
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
    hostMic: settings.hostMic !== false,
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
 * Read the first bytes of a clip to name its container. Safari reports an empty
 * MIME type often enough, and a clip labelled `.webm` that is really MP4 is
 * rejected upstream even though Groq accepts both.
 * @param {Buffer} audio Raw audio bytes.
 * @returns {string | null} A supported media type, or null when unrecognized.
 */
export function sniffAudio(audio) {
  if (audio.length < 4) return null
  if (audio[0] === 0x1a && audio[1] === 0x45 && audio[2] === 0xdf && audio[3] === 0xa3) return 'audio/webm'
  const magic = audio.subarray(0, 4).toString('latin1')
  if (magic === 'OggS') return 'audio/ogg'
  if (magic === 'fLaC') return 'audio/flac'
  if (magic === 'RIFF' && audio.length >= 12 && audio.subarray(8, 12).toString('latin1') === 'WAVE') return 'audio/wav'
  if (audio.length >= 12 && audio.subarray(4, 8).toString('latin1') === 'ftyp') {
    const brand = audio.subarray(8, 12).toString('latin1').trim().toLowerCase()
    return brand === 'm4a' || brand === 'm4b' || brand === 'm4p' ? 'audio/m4a' : 'audio/mp4'
  }
  if (magic.slice(0, 3) === 'ID3') return 'audio/mpeg'
  if (audio[0] === 0xff && (audio[1] & 0xe0) === 0xe0) return 'audio/mpeg'
  return null
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
  // The bytes win over the header: some browsers declare a container they did
  // not produce.
  const identity = audioIdentity(sniffAudio(audio) ?? contentType)
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

/* ---------------------------------------------------------------------- *
 * Computer microphone fallback
 *
 * Safari, and therefore every browser on iOS, exposes the microphone only on
 * secure origins. A GUI opened over plain HTTP on the LAN cannot record, so
 * the page can ask this Host to record from the computer's own microphone
 * instead: same Whisper round trip, no HTTPS and no tunnel. The audio is
 * captured with ffmpeg, kept in a temporary directory, and deleted as soon as
 * it has been transcribed or discarded.
 * ---------------------------------------------------------------------- */

/** Longest clip the computer records; matches the browser cap. */
const HOST_MIC_MAX_SECONDS = 600

/** How long a probe, a device open, and a graceful stop may take. */
const PROBE_TIMEOUT_MS = 8_000
const START_TIMEOUT_MS = 8_000
const STOP_TIMEOUT_MS = 6_000

/** Candidate ffmpeg binaries, in order. */
const FFMPEG_CANDIDATES = Object.freeze([
  process.env.DSH_GROQ_DICTATION_FFMPEG,
  process.env.FFMPEG_PATH,
  'ffmpeg',
  '/opt/homebrew/bin/ffmpeg',
  '/usr/local/bin/ffmpeg',
  '/usr/bin/ffmpeg',
].filter((candidate) => typeof candidate === 'string' && candidate !== ''))

/** One running computer-microphone capture. */
let hostRecording = null

/** Cached device probe: `undefined` until probed, `null` when unavailable. */
let hostDevice

/**
 * Run one short-lived helper and collect its output.
 * @param {string} command Binary to run.
 * @param {string[]} args Arguments.
 * @param {number} timeoutMs Kill deadline.
 * @returns {Promise<{ code: number, stdout: string, stderr: string }>} Result.
 */
function run(command, args, timeoutMs) {
  return new Promise((resolve) => {
    let child
    try {
      child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    } catch (error) {
      resolve({ code: -1, stdout: '', stderr: String(error?.message ?? error) })
      return
    }
    let stdout = ''
    let stderr = ''
    let settled = false
    const finish = (code) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ code, stdout, stderr })
    }
    const timer = setTimeout(() => {
      try {
        child.kill('SIGKILL')
      } catch {
        // The helper may already have exited.
      }
    }, timeoutMs)
    child.stdout?.on('data', (chunk) => {
      if (stdout.length < 65536) stdout += chunk
    })
    child.stderr?.on('data', (chunk) => {
      if (stderr.length < 65536) stderr += chunk
    })
    child.on('error', (error) => {
      if (stderr.length < 65536) stderr += String(error?.message ?? error)
      finish(-1)
    })
    child.on('close', (code) => finish(code ?? -1))
  })
}

/**
 * Pick the first ffmpeg binary that answers.
 * @returns {Promise<string | null>} Binary path or bare name.
 */
async function resolveFfmpeg() {
  for (const candidate of FFMPEG_CANDIDATES) {
    const result = await run(candidate, ['-hide_banner', '-version'], PROBE_TIMEOUT_MS)
    if (result.code === 0) return candidate
  }
  return null
}

/**
 * Read the audio devices listed by one ffmpeg `-list_devices` run.
 * @param {string} text Captured stderr.
 * @param {RegExp} marker Line that opens the audio section.
 * @param {RegExp} entry Pattern whose first group is the device id or name.
 * @returns {{ id: string, label: string }[]} Devices found.
 */
function audioDevices(text, marker, entry) {
  const devices = []
  let inSection = false
  for (const line of String(text).split(/\r?\n/u)) {
    if (marker.test(line)) {
      inSection = true
      continue
    }
    if (!inSection) continue
    if (/\bdevices:/iu.test(line)) {
      if (devices.length > 0) break
      continue
    }
    const match = entry.exec(line)
    if (match !== null) devices.push({ id: match[1], label: match[2] ?? match[1] })
  }
  return devices
}

/**
 * Find an input the local ffmpeg can record from.
 * @returns {Promise<{ binary: string, label: string, input: string[] } | null>} Device.
 */
export async function detectHostMicrophone() {
  if (hostDevice !== undefined) return hostDevice
  const binary = await resolveFfmpeg()
  if (binary === null) {
    hostDevice = null
    return null
  }
  let device = null
  if (process.platform === 'darwin') {
    const probe = await run(binary, ['-hide_banner', '-f', 'avfoundation', '-list_devices', 'true', '-i', ''], PROBE_TIMEOUT_MS)
    const [first] = audioDevices(probe.stderr, /AVFoundation audio devices:/iu, /^\[.*?\]\s*\[(\d+)\]\s+(.+)$/u)
    if (first !== undefined) device = { binary, label: first.label, input: ['-f', 'avfoundation', '-i', `:${first.id}`] }
  } else if (process.platform === 'win32') {
    const probe = await run(binary, ['-hide_banner', '-f', 'dshow', '-list_devices', 'true', '-i', 'dummy'], PROBE_TIMEOUT_MS)
    const [first] = audioDevices(probe.stderr, /DirectShow audio devices/iu, /^\[.*?\]\s*"([^"]+)"/u)
    if (first !== undefined) device = { binary, label: first.label, input: ['-f', 'dshow', '-i', `audio=${first.id}`] }
  } else {
    // Linux: use PulseAudio when ffmpeg was built with it, ALSA otherwise.
    const probe = await run(binary, ['-hide_banner', '-devices'], PROBE_TIMEOUT_MS)
    const format = /\bpulse\b/iu.test(`${probe.stdout}\n${probe.stderr}`) ? 'pulse' : 'alsa'
    device = { binary, label: `${format} default`, input: ['-f', format, '-i', 'default'] }
  }
  hostDevice = device
  return device
}

/**
 * Forget a cached probe, so the next call re-detects the device.
 * @returns {void}
 */
function forgetHostDevice() {
  hostDevice = undefined
}

/**
 * Start capturing from the computer's microphone.
 * @returns {Promise<{ started: boolean, device: string, maxSeconds: number }>} Start report.
 */
export async function startHostRecording() {
  if (hostRecording !== null) {
    if (hostRecording.finished !== true) throw fail('host-mic-busy', 409)
    discardHostRecording(hostRecording)
    hostRecording = null
  }
  if (readSettings().hostMic !== true) throw fail('host-mic-disabled', 403)
  const device = await detectHostMicrophone()
  if (device === null) throw fail('host-mic-unavailable', 501)

  const directory = mkdtempSync(join(tmpdir(), 'dsh-dictation-'))
  const file = join(directory, 'recording.wav')
  const args = [
    '-hide_banner', '-nostats', '-loglevel', 'info',
    ...device.input,
    '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le',
    '-t', String(HOST_MIC_MAX_SECONDS), '-y', file,
  ]
  let child
  try {
    child = spawn(device.binary, args, { stdio: ['pipe', 'ignore', 'pipe'] })
  } catch (error) {
    rmSync(directory, { recursive: true, force: true })
    forgetHostDevice()
    throw fail('host-mic-failed', 502, String(error?.message ?? error))
  }
  const state = { child, directory, file, startedAt: Date.now(), finished: false, output: '' }
  hostRecording = state

  const opened = await new Promise((resolve) => {
    let settled = false
    const settle = (value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(value)
    }
    const timer = setTimeout(() => settle({ ok: false, reason: 'timeout' }), START_TIMEOUT_MS)
    child.stderr?.on('data', (chunk) => {
      state.output = (state.output + String(chunk)).slice(-8192)
      if (/Press \[q\] to stop/u.test(state.output)) settle({ ok: true })
    })
    child.on('error', (error) => settle({ ok: false, reason: String(error?.message ?? error) }))
    child.on('close', (code) => {
      state.finished = true
      // A page that vanished mid-recording must not leave audio behind: the
      // hard cap ends ffmpeg, and this sweep removes the clip a minute later.
      const sweep = setTimeout(() => {
        if (hostRecording !== state) return
        hostRecording = null
        discardHostRecording(state)
      }, 60_000)
      if (typeof sweep.unref === 'function') sweep.unref()
      settle({ ok: false, reason: `ffmpeg exited with ${code}` })
    })
  })

  if (opened.ok !== true) {
    hostRecording = null
    rmSync(directory, { recursive: true, force: true })
    forgetHostDevice()
    throw fail('host-mic-failed', 502, `${opened.reason}: ${state.output.slice(-200)}`)
  }
  return { started: true, device: device.label, maxSeconds: HOST_MIC_MAX_SECONDS }
}

/**
 * Delete one recording's temporary directory.
 * @param {{ directory: string }} state Recording state.
 * @returns {void}
 */
function discardHostRecording(state) {
  try {
    rmSync(state.directory, { recursive: true, force: true })
  } catch {
    // The directory may already be gone.
  }
}

/**
 * Stop the capture, transcribe it, and remove the audio.
 * @param {{ transcribe?: boolean }} [options] Set `transcribe` to false to discard.
 * @returns {Promise<{ text: string, model: string, seconds: number }>} Transcript.
 */
export async function stopHostRecording(options = {}) {
  const state = hostRecording
  if (state === null) throw fail('not-recording', 409)
  hostRecording = null
  const seconds = Math.max(1, Math.round((Date.now() - state.startedAt) / 1000))
  if (state.finished !== true) {
    try {
      state.child.stdin.write('q\n')
    } catch {
      // The helper may already be gone; the kill below still applies.
    }
    await new Promise((resolve) => {
      let done = false
      const finish = () => {
        if (done) return
        done = true
        clearTimeout(timer)
        resolve()
      }
      const timer = setTimeout(() => {
        try {
          state.child.kill('SIGKILL')
        } catch {
          // Already exited.
        }
        finish()
      }, STOP_TIMEOUT_MS)
      state.child.once('close', finish)
      state.child.once('exit', finish)
    })
  }
  let audio = Buffer.alloc(0)
  try {
    if (existsSync(state.file)) audio = readFileSync(state.file)
  } catch {
    audio = Buffer.alloc(0)
  }
  try {
    if (options.transcribe === false) return { text: '', model: readSettings().model, seconds }
    // 44 bytes is the WAV header alone: no audio at all.
    if (audio.length <= 44) throw fail('empty-audio', 422)
    return { ...(await transcribe(audio, 'audio/wav')), seconds }
  } finally {
    discardHostRecording(state)
  }
}

/**
 * Stop and discard a capture, tolerating "nothing was recording".
 * @returns {Promise<{ cancelled: boolean }>} Report.
 */
export async function cancelHostRecording() {
  if (hostRecording === null) return { cancelled: false }
  try {
    await stopHostRecording({ transcribe: false })
  } catch {
    // A failed stop leaves nothing worth reporting to a closing page.
  }
  return { cancelled: true }
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

    if (action === 'host-mic' && segments.length === 1 && method === 'GET') {
      const device = await detectHostMicrophone()
      reply(200, {
        ok: true,
        data: {
          enabled: readSettings().hostMic,
          available: device !== null,
          device: device?.label ?? '',
          maxSeconds: HOST_MIC_MAX_SECONDS,
        },
      })
      return
    }

    if (action === 'host-mic' && segments.length === 2 && method === 'POST') {
      if (segments[1] === 'start') {
        reply(200, { ok: true, data: await startHostRecording() })
        return
      }
      if (segments[1] === 'stop') {
        reply(200, { ok: true, data: await stopHostRecording() })
        return
      }
      if (segments[1] === 'cancel') {
        reply(200, { ok: true, data: await cancelHostRecording() })
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
    return () => {
      disposeRoute()
      void cancelHostRecording()
    }
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
  sniffAudio,
  detectHostMicrophone,
  startHostRecording,
  stopHostRecording,
  cancelHostRecording,
  storeDirectory,
  storeFile,
  MODELS,
}
