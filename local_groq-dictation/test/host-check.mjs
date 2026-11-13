import assert from 'node:assert/strict'
import { chmodSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'

const home = mkdtempSync(join(tmpdir(), 'groq-dictation-'))
process.env.DSH_HOME = home

// A stand-in for ffmpeg: it lists one audio device, says it is recording, and
// writes a short silent WAV when the Host asks it to stop.
const stub = join(home, 'ffmpeg-stub.cjs')
writeFileSync(stub, `#!/usr/bin/env node
const { writeFileSync } = require('node:fs')
const argv = process.argv.slice(2)
if (argv.includes('-version')) { process.stdout.write('ffmpeg version stub\\n'); process.exit(0) }
if (argv.includes('-list_devices')) {
  process.stderr.write('[AVFoundation indev @ 0x0] AVFoundation video devices:\\n')
  process.stderr.write('[AVFoundation indev @ 0x0] [0] Stub Camera\\n')
  process.stderr.write('[AVFoundation indev @ 0x0] AVFoundation audio devices:\\n')
  process.stderr.write('[AVFoundation indev @ 0x0] [0] Stub Microphone\\n')
  process.exit(0)
}
const file = argv[argv.length - 1]
process.stderr.write('Press [q] to stop, [?] for help\\n')
let done = false
const finish = () => {
  if (done) return
  done = true
  const samples = 3200
  const rate = 16000
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + samples, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(rate, 24)
  header.writeUInt32LE(rate * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(samples, 40)
  writeFileSync(file, Buffer.concat([header, Buffer.alloc(samples)]))
  process.exit(0)
}
process.stdin.on('data', chunk => { if (String(chunk).includes('q')) finish() })
process.stdin.on('end', finish)
setTimeout(finish, 4000)
`)
chmodSync(stub, 0o755)
process.env.DSH_GROQ_DICTATION_FFMPEG = stub

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

  // The bytes decide the container: Safari can declare an empty or wrong type.
  function mp4Bytes(brand = 'isom') {
    return Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x18]),
      Buffer.from('ftyp'),
      Buffer.from(brand.padEnd(4, ' ')),
      Buffer.from([0x00, 0x00, 0x02, 0x00]),
      Buffer.from('isomiso2'),
    ])
  }

  let forwarded = null
  function mockGroq() {
    forwarded = null
    globalThis.fetch = async (_url, init) => {
      const file = init.body.get('file')
      forwarded = { type: file.type, name: file.name, size: file.size }
      return new Response(JSON.stringify({ text: 'Hola mundo.' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }
  }

  mockGroq()
  const mp4 = mp4Bytes()
  const unlabelled = response()
  await handleRequest(request('POST', '/dsh-groq-dictation/transcribe', mp4, {
    ...HEADER,
    'content-type': 'application/octet-stream',
  }), unlabelled)
  assert.equal(unlabelled.status, 200)
  assert.deepEqual(forwarded, { type: 'audio/mp4', name: 'dictation.mp4', size: mp4.length })

  mockGroq()
  const mislabelled = response()
  await handleRequest(request('POST', '/dsh-groq-dictation/transcribe', mp4, {
    ...HEADER,
    'content-type': 'audio/webm',
  }), mislabelled)
  assert.equal(mislabelled.status, 200)
  assert.equal(forwarded.name, 'dictation.mp4')

  mockGroq()
  const m4a = mp4Bytes('M4A')
  const appleVoiceMemo = response()
  await handleRequest(request('POST', '/dsh-groq-dictation/transcribe', m4a, {
    ...HEADER,
    'content-type': 'application/octet-stream',
  }), appleVoiceMemo)
  assert.equal(appleVoiceMemo.status, 200)
  assert.deepEqual(forwarded, { type: 'audio/m4a', name: 'dictation.m4a', size: m4a.length })

  mockGroq()
  const unknownAudio = response()
  await handleRequest(request('POST', '/dsh-groq-dictation/transcribe', Buffer.from('not really audio'), {
    ...HEADER,
    'content-type': 'application/octet-stream',
  }), unknownAudio)
  assert.equal(unknownAudio.status, 415)
  assert.equal(unknownAudio.payload.code, 'unsupported-audio')
  assert.equal(forwarded, null)

  // The computer microphone records with the local ffmpeg helper.
  const probe = response()
  await handleRequest(request('GET', '/dsh-groq-dictation/host-mic'), probe)
  assert.equal(probe.status, 200)
  assert.equal(probe.payload.data.available, true)
  assert.equal(probe.payload.data.device, 'Stub Microphone')
  assert.equal(probe.payload.data.enabled, true)

  let hostAudioSeen = null
  globalThis.fetch = async (_url, init) => {
    const file = init.body.get('file')
    hostAudioSeen = { type: file.type, name: file.name }
    return new Response(JSON.stringify({ text: 'Desde el ordenador.' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  const start = response()
  await handleRequest(request('POST', '/dsh-groq-dictation/host-mic/start'), start)
  assert.equal(start.status, 200)
  assert.equal(start.payload.data.started, true)
  assert.equal(start.payload.data.device, 'Stub Microphone')

  const busy = response()
  await handleRequest(request('POST', '/dsh-groq-dictation/host-mic/start'), busy)
  assert.equal(busy.status, 409)
  assert.equal(busy.payload.code, 'host-mic-busy')

  const stopped = response()
  await handleRequest(request('POST', '/dsh-groq-dictation/host-mic/stop'), stopped)
  assert.equal(stopped.status, 200)
  assert.equal(stopped.payload.data.text, 'Desde el ordenador.')
  assert.ok(stopped.payload.data.seconds >= 1)
  assert.deepEqual(hostAudioSeen, { type: 'audio/wav', name: 'dictation.wav' })

  const stopAgain = response()
  await handleRequest(request('POST', '/dsh-groq-dictation/host-mic/stop'), stopAgain)
  assert.equal(stopAgain.status, 409)
  assert.equal(stopAgain.payload.code, 'not-recording')

  // Cancelling discards the clip without calling Groq.
  globalThis.fetch = async () => {
    throw new Error('Groq must not be called when cancelling')
  }
  const startCancel = response()
  await handleRequest(request('POST', '/dsh-groq-dictation/host-mic/start'), startCancel)
  assert.equal(startCancel.status, 200)
  const cancelled = response()
  await handleRequest(request('POST', '/dsh-groq-dictation/host-mic/cancel'), cancelled)
  assert.equal(cancelled.status, 200)
  assert.equal(cancelled.payload.data.cancelled, true)

  // Turning the fallback off refuses to record.
  writeSettings({ hostMic: false })
  const disabled = response()
  await handleRequest(request('POST', '/dsh-groq-dictation/host-mic/start'), disabled)
  assert.equal(disabled.status, 403)
  assert.equal(disabled.payload.code, 'host-mic-disabled')
  writeSettings({ hostMic: true })

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
