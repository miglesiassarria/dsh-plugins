import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'

const home = mkdtempSync(join(tmpdir(), 'groq-dictation-'))
process.env.DSH_HOME = home

const host = await import('../index.js')
const { handleRequest, readSettings, writeSettings, publicSettings, storeFile, MODELS } = host

const KEY = 'gsk_test_key_1234567890'
const HEADER = { 'x-dsh-groq-dictation': '1' }

/**
 * Build one incoming request.
 * @param {string} method HTTP method.
 * @param {string} url Request URL.
 * @param {object|Buffer} [body] JSON value or raw bytes.
 * @param {object} [headers] Request headers.
 * @returns {Readable} Request stream.
 */
function request(method, url, body, headers = HEADER) {
  const chunks = body === undefined
    ? []
    : [Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body))]
  const stream = Readable.from(chunks)
  stream.method = method
  stream.url = url
  stream.headers = headers
  return stream
}

/** @returns {object} A response recorder. */
function response() {
  return {
    status: 0,
    payload: undefined,
    headers: undefined,
    headersSent: false,
    writeHead(status, headers) {
      this.status = status
      this.headers = headers
      this.headersSent = true
    },
    end(text) {
      this.payload = text === undefined ? undefined : JSON.parse(text)
    },
  }
}

const originalFetch = globalThis.fetch
let fetchCalls = 0

try {
  const defaults = readSettings()
  assert.equal(defaults.apiKey, '')
  assert.equal(defaults.model, MODELS[0])

  const saved = writeSettings({ apiKey: KEY, model: 'whisper-large-v3' })
  assert.equal(saved.apiKey, KEY)
  assert.equal(saved.model, 'whisper-large-v3')
  assert.equal(statSync(storeFile()).mode & 0o777, 0o600)

  const publicView = publicSettings(saved)
  assert.equal(publicView.configured, true)
  assert.equal(publicView.apiKeyHint, '7890')
  assert.equal(JSON.stringify(publicView).includes(KEY), false)
  assert.deepEqual(publicView.models, [...MODELS])

  const get = response()
  await handleRequest(request('GET', '/dsh-groq-dictation/settings'), get)
  assert.equal(get.status, 200)
  assert.equal(get.payload.ok, true)
  assert.equal(get.payload.data.configured, true)
  assert.equal(get.payload.data.model, 'whisper-large-v3')
  assert.equal(JSON.stringify(get.payload).includes(KEY), false)

  const keepKey = response()
  await handleRequest(request('POST', '/dsh-groq-dictation/settings', { model: 'whisper-large-v3-turbo' }), keepKey)
  assert.equal(keepKey.status, 200)
  assert.equal(keepKey.payload.data.model, 'whisper-large-v3-turbo')
  assert.equal(readSettings().apiKey, KEY)

  const badModel = response()
  await handleRequest(request('POST', '/dsh-groq-dictation/settings', { model: 'unknown' }), badModel)
  assert.equal(badModel.status, 400)
  assert.equal(badModel.payload.code, 'invalid-model')

  const badKey = response()
  await handleRequest(request('POST', '/dsh-groq-dictation/settings', { apiKey: 'short' }), badKey)
  assert.equal(badKey.status, 400)
  assert.equal(badKey.payload.code, 'invalid-api-key')

  const denied = response()
  await handleRequest(request('GET', '/dsh-groq-dictation/settings', undefined, {}), denied)
  assert.equal(denied.status, 403)

  const missing = response()
  await handleRequest(request('GET', '/dsh-groq-dictation/nope'), missing)
  assert.equal(missing.status, 404)

  const clear = response()
  await handleRequest(request('POST', '/dsh-groq-dictation/settings', { apiKey: '' }), clear)
  assert.equal(clear.status, 200)
  assert.equal(clear.payload.data.configured, false)
  assert.equal(readSettings().apiKey, '')

  const noKey = response()
  await handleRequest(request('POST', '/dsh-groq-dictation/transcribe', Buffer.from('audio'), {
    ...HEADER,
    'content-type': 'audio/webm;codecs=opus',
  }), noKey)
  assert.equal(noKey.status, 400)
  assert.equal(noKey.payload.code, 'missing-api-key')

  writeSettings({ apiKey: KEY, model: 'whisper-large-v3-turbo' })
  const audio = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x01, 0x02, 0x03])
  globalThis.fetch = async (url, init) => {
    fetchCalls += 1
    assert.equal(url, 'https://api.groq.com/openai/v1/audio/transcriptions')
    assert.equal(init.method, 'POST')
    assert.equal(init.headers.authorization, `Bearer ${KEY}`)
    assert.ok(init.body instanceof FormData)
    assert.equal(init.body.get('model'), 'whisper-large-v3-turbo')
    assert.equal(init.body.get('response_format'), 'json')
    assert.equal(init.body.get('temperature'), '0')
    const file = init.body.get('file')
    assert.ok(file instanceof Blob)
    assert.equal(file.type, 'audio/webm')
    assert.equal(file.name, 'dictation.webm')
    assert.equal(file.size, audio.length)
    return new Response(JSON.stringify({ text: '  Hola mundo.  ' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  const transcription = response()
  await handleRequest(request('POST', '/dsh-groq-dictation/transcribe', audio, {
    ...HEADER,
    'content-type': 'audio/webm;codecs=opus',
  }), transcription)
  assert.equal(transcription.status, 200)
  assert.equal(transcription.payload.data.text, 'Hola mundo.')
  assert.equal(transcription.payload.data.model, 'whisper-large-v3-turbo')
  assert.equal(fetchCalls, 1)

  globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: 'Invalid API Key' } }), {
    status: 401,
    headers: { 'content-type': 'application/json' },
  })
  const rejected = response()
  await handleRequest(request('POST', '/dsh-groq-dictation/transcribe', audio, {
    ...HEADER,
    'content-type': 'audio/webm',
  }), rejected)
  assert.equal(rejected.status, 401)
  assert.equal(rejected.payload.code, 'invalid-key')
  assert.equal(JSON.stringify(rejected.payload).includes(KEY), false)

  globalThis.fetch = async () => {
    throw new TypeError('offline')
  }
  const offline = response()
  await handleRequest(request('POST', '/dsh-groq-dictation/transcribe', audio, {
    ...HEADER,
    'content-type': 'audio/webm',
  }), offline)
  assert.equal(offline.status, 502)
  assert.equal(offline.payload.code, 'network-error')

  globalThis.fetch = async () => new Response(JSON.stringify({ text: '' }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
  const empty = response()
  await handleRequest(request('POST', '/dsh-groq-dictation/transcribe', audio, {
    ...HEADER,
    'content-type': 'audio/webm',
  }), empty)
  assert.equal(empty.status, 422)
  assert.equal(empty.payload.code, 'empty-transcript')

  console.log('Host check OK:', storeFile())
} finally {
  globalThis.fetch = originalFetch
  rmSync(home, { recursive: true, force: true })
}
