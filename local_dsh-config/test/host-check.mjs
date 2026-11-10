import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'

const home = mkdtempSync(join(tmpdir(), 'dsh-config-'))
process.env.DSH_HOME = home

const host = await import('../index.js')
const { handleRequest, readSettings, storeFile, writeSettings } = host

const FEATURES = Object.freeze({
  reorderSections: true,
  githubFolders: true,
  hideDefaultEffort: true,
})
const DEFAULTS = Object.freeze({ version: 1, settingsOrder: [], features: FEATURES })

function request(method, url, body, headers = { 'x-dsh-config': '1' }) {
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
  assert.deepEqual(readSettings(), DEFAULTS)

  const saved = writeSettings({ settingsOrder: ['models', 'general'] })
  assert.deepEqual(saved, { version: 1, settingsOrder: ['models', 'general'], features: FEATURES })
  assert.deepEqual(readSettings(), saved)

  const get = response()
  await handleRequest(request('GET', '/dsh-config/settings'), get)
  assert.equal(get.status, 200)
  assert.equal(get.payload.ok, true)
  assert.deepEqual(get.payload.data.settingsOrder, ['models', 'general'])

  const post = response()
  await handleRequest(request('POST', '/dsh-config/settings', {
    settingsOrder: ['plugins', 'general', 'models', 'plugins'],
  }), post)
  assert.equal(post.status, 200)
  assert.deepEqual(post.payload.data.settingsOrder, ['plugins', 'general', 'models'])
  assert.deepEqual(readSettings().settingsOrder, ['plugins', 'general', 'models'])

  const featureWrite = writeSettings({ features: { githubFolders: false } })
  assert.deepEqual(featureWrite.settingsOrder, ['plugins', 'general', 'models'])
  assert.deepEqual(featureWrite.features, { ...FEATURES, githubFolders: false })

  const featurePost = response()
  await handleRequest(request('POST', '/dsh-config/settings', {
    features: { hideDefaultEffort: false },
  }), featurePost)
  assert.equal(featurePost.status, 200)
  assert.deepEqual(featurePost.payload.data.features, {
    reorderSections: true,
    githubFolders: false,
    hideDefaultEffort: false,
  })
  assert.deepEqual(featurePost.payload.data.settingsOrder, ['plugins', 'general', 'models'])

  const unauthorized = response()
  await handleRequest(request('GET', '/dsh-config/settings', undefined, {}), unauthorized)
  assert.equal(unauthorized.status, 403)
  assert.equal(unauthorized.payload.error, 'unauthorized')

  const invalid = response()
  await handleRequest(request('POST', '/dsh-config/settings', { settingsOrder: [3] }), invalid)
  assert.equal(invalid.status, 400)
  assert.equal(invalid.payload.error, 'invalid-order-entry')

  const invalidFeature = response()
  await handleRequest(request('POST', '/dsh-config/settings', {
    features: { reorderSections: 'yes' },
  }), invalidFeature)
  assert.equal(invalidFeature.status, 400)
  assert.equal(invalidFeature.payload.error, 'invalid-feature')

  const invalidFeatures = response()
  await handleRequest(request('POST', '/dsh-config/settings', { features: [] }), invalidFeatures)
  assert.equal(invalidFeatures.status, 400)
  assert.equal(invalidFeatures.payload.error, 'invalid-features')

  const missing = response()
  await handleRequest(request('GET', '/dsh-config/unknown'), missing)
  assert.equal(missing.status, 404)

  const permissions = statSync(storeFile()).mode & 0o777
  assert.equal(permissions, 0o600)
  assert.match(readFileSync(storeFile(), 'utf8'), /"features"/)

  writeFileSync(storeFile(), '{ not json')
  assert.deepEqual(readSettings(), DEFAULTS)
} finally {
  rmSync(home, { recursive: true, force: true })
}

console.log('dsh-config host check passed')
