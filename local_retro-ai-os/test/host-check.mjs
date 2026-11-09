import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'

const home = mkdtempSync(join(tmpdir(), 'retro-ai-os-'))
process.env.DSH_HOME = home

const host = await import('../index.js')
const { handleRequest, readPreferences, writePreferences, storeFile } = host

function request(method, url, body, headers = { 'x-dsh-retro-ai-os': '1' }) {
  const stream = Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))])
  stream.method = method
  stream.url = url
  stream.headers = headers
  return stream
}

function response() {
  return {
    status: 0,
    payload: undefined,
    writeHead(status) { this.status = status },
    end(text) { this.payload = JSON.parse(text) },
  }
}

try {
  assert.equal(readPreferences().style, 'classic')
  const saved = writePreferences({ enabled: true, style: 'amber', mascot: false, animation: false })
  assert.deepEqual(saved, { version: 1, enabled: true, style: 'amber', mascot: false, animation: false })
  assert.deepEqual(readPreferences(), saved)

  const get = response()
  await handleRequest(request('GET', '/dsh-retro-ai-os/preferences'), get)
  assert.equal(get.status, 200)
  assert.equal(get.payload.ok, true)
  assert.equal(get.payload.data.style, 'amber')

  const post = response()
  await handleRequest(request('POST', '/dsh-retro-ai-os/preferences', { enabled: false, style: 'vapor' }), post)
  assert.equal(post.status, 200)
  assert.equal(post.payload.data.style, 'vapor')
  assert.equal(post.payload.data.enabled, false)
  assert.equal(post.payload.data.mascot, false)
  assert.equal(readPreferences().style, 'vapor')

  const bad = response()
  await handleRequest(request('POST', '/dsh-retro-ai-os/preferences', { style: 'unknown' }), bad)
  assert.equal(bad.status, 400)
  assert.equal(bad.payload.ok, false)

  const denied = response()
  await handleRequest(request('GET', '/dsh-retro-ai-os/preferences', undefined, {}), denied)
  assert.equal(denied.status, 403)

  console.log('Host check OK:', storeFile())
} finally {
  rmSync(home, { recursive: true, force: true })
}
