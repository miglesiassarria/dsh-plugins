import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'

const home = mkdtempSync(join(tmpdir(), 'retro-ai-os-'))
process.env.DSH_HOME = home

const host = await import('../index.js')
const { FONT_FILES, assetDirectory, handleRequest, readPreferences, writePreferences, storeFile } = host

const BRAND_DEFAULTS = {
  on: false, seeded: false, sidebarText: '', heroText: '',
  sidebarMark: 'default', heroMark: 'default', markScale: 1, font: 'system', badge: true, asset: null,
}

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
    headers: {},
    payload: undefined,
    chunk: undefined,
    writeHead(status, headers = {}) { this.status = status; this.headers = headers },
    end(chunk) {
      this.chunk = chunk
      if (typeof chunk === 'string') {
        try { this.payload = JSON.parse(chunk) } catch { this.payload = chunk }
      }
    },
  }
}

try {
  assert.equal(readPreferences().style, 'classic')
  assert.deepEqual(readPreferences().brand, BRAND_DEFAULTS)

  const saved = writePreferences({ enabled: true, style: 'amber', mascot: false, animation: false })
  assert.deepEqual(saved, { version: 2, enabled: true, style: 'amber', mascot: false, animation: false, brand: BRAND_DEFAULTS })
  assert.deepEqual(readPreferences(), saved)

  const get = response()
  await handleRequest(request('GET', '/dsh-retro-ai-os/preferences'), get)
  assert.equal(get.status, 200)
  assert.equal(get.payload.ok, true)
  assert.equal(get.payload.data.style, 'amber')
  assert.deepEqual(get.payload.data.brand, BRAND_DEFAULTS)

  const post = response()
  await handleRequest(request('POST', '/dsh-retro-ai-os/preferences', { enabled: false, style: 'vapor' }), post)
  assert.equal(post.status, 200)
  assert.equal(post.payload.data.style, 'vapor')
  assert.equal(post.payload.data.enabled, false)
  assert.equal(post.payload.data.mascot, false)
  assert.equal(readPreferences().style, 'vapor')

  const matrix = response()
  await handleRequest(request('POST', '/dsh-retro-ai-os/preferences', { enabled: true, style: 'matrix' }), matrix)
  assert.equal(matrix.status, 200)
  assert.equal(readPreferences().style, 'matrix')

  const brand = {
    on: true,
    seeded: true,
    sidebarText: 'Retro Labs',
    heroText: 'Hacia la cueva',
    sidebarMark: 'custom',
    heroMark: 'none',
    markScale: 1.25,
    font: 'neon',
    badge: false,
    asset: null,
  }
  const branded = response()
  await handleRequest(request('POST', '/dsh-retro-ai-os/preferences', { brand }), branded)
  assert.equal(branded.status, 200)
  assert.deepEqual(branded.payload.data.brand, brand)
  assert.deepEqual(readPreferences().brand, brand)

  const partial = response()
  await handleRequest(request('POST', '/dsh-retro-ai-os/preferences', { brand: { font: 'mono' } }), partial)
  assert.equal(partial.status, 200)
  assert.equal(partial.payload.data.brand.font, 'mono')
  assert.equal(partial.payload.data.brand.sidebarText, brand.sidebarText)
  assert.equal(partial.payload.data.brand.heroMark, brand.heroMark)

  const grown = response()
  await handleRequest(request('POST', '/dsh-retro-ai-os/preferences', { brand: { ...brand, markScale: 4 } }), grown)
  assert.equal(grown.payload.data.brand.markScale, 1.5)
  const shrunk = response()
  await handleRequest(request('POST', '/dsh-retro-ai-os/preferences', { brand: { ...brand, markScale: 0.1 } }), shrunk)
  assert.equal(shrunk.payload.data.brand.markScale, 0.5)

  const cleaned = response()
  await handleRequest(request('POST', '/dsh-retro-ai-os/preferences', {
    brand: { ...brand, sidebarText: '  A\u0007B  ' },
  }), cleaned)
  assert.equal(cleaned.status, 200)
  assert.equal(cleaned.payload.data.brand.sidebarText, 'A B')

  for (const patch of [
    { brand: { ...brand, sidebarMark: 'shiny' } },
    { brand: { ...brand, heroMark: 'shiny' } },
    { brand: { ...brand, font: 'comic' } },
    { brand: { ...brand, markScale: 'big' } },
    { brand: { ...brand, markScale: Number.NaN } },
    { brand: { ...brand, on: 'yes' } },
    { brand: { ...brand, asset: { url: 'https://evil.example/logo.png' } } },
  ]) {
    const invalid = response()
    await handleRequest(request('POST', '/dsh-retro-ai-os/preferences', patch), invalid)
    assert.equal(invalid.status, 400, JSON.stringify(patch))
    assert.equal(invalid.payload.ok, false)
  }

  const bad = response()
  await handleRequest(request('POST', '/dsh-retro-ai-os/preferences', { style: 'unknown' }), bad)
  assert.equal(bad.status, 400)
  assert.equal(bad.payload.ok, false)

  const denied = response()
  await handleRequest(request('GET', '/dsh-retro-ai-os/preferences', undefined, {}), denied)
  assert.equal(denied.status, 403)

  // A 1x1 transparent PNG, uploaded through the same route the UI uses.
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  const upload = response()
  await handleRequest(request('POST', '/dsh-retro-ai-os/brand-asset', {
    dataUrl: 'data:image/png;base64,' + png,
    name: 'logo.png',
  }), upload)
  assert.equal(upload.status, 200, JSON.stringify(upload.payload))
  assert.equal(upload.payload.ok, true)
  assert.match(upload.payload.data.url, /^\/dsh-retro-ai-os\/assets\/brand-[a-f0-9]{16}\.png$/)
  assert.equal(upload.payload.data.label, 'logo.png')

  const serve = response()
  await handleRequest(request('GET', upload.payload.data.url, undefined, {}), serve)
  assert.equal(serve.status, 200)
  assert.equal(serve.headers['content-type'], 'image/png')
  assert.equal(serve.headers['x-content-type-options'], 'nosniff')
  assert.ok(Buffer.isBuffer(serve.chunk))
  assert.equal(serve.chunk.toString('base64'), png)

  const missingAsset = response()
  await handleRequest(request('GET', '/dsh-retro-ai-os/assets/brand-0000000000000000.png', undefined, {}), missingAsset)
  assert.equal(missingAsset.status, 404)

  const traversal = response()
  await handleRequest(request('GET', '/dsh-retro-ai-os/assets/..%2F..%2Fpreferences.json', undefined, {}), traversal)
  assert.equal(traversal.status, 404)

  const font = response()
  await handleRequest(request('GET', '/dsh-retro-ai-os/fonts/vt323.woff2', undefined, {}), font)
  assert.equal(font.status, 200)
  assert.equal(font.headers['content-type'], 'font/woff2')
  assert.ok(Buffer.isBuffer(font.chunk) && font.chunk.length > 1000)

  // Every typeface the browser half declares is bundled and served.
  const clientSource = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
  const declared = [...new Set([...clientSource.matchAll(/\/dsh-retro-ai-os\/fonts\/([a-z0-9.-]+\.woff2)/g)].map((match) => match[1]))]
  assert.equal(declared.length, 10)
  for (const name of declared) {
    assert.ok(FONT_FILES.has(name), 'font served: ' + name)
    const served = response()
    await handleRequest(request('GET', '/dsh-retro-ai-os/fonts/' + name, undefined, {}), served)
    assert.equal(served.status, 200, name)
    assert.equal(served.headers['content-type'], 'font/woff2')
    assert.ok(served.chunk.length > 2000, name)
  }

  const unknownFont = response()
  await handleRequest(request('GET', '/dsh-retro-ai-os/fonts/..%2Fpackage.json', undefined, {}), unknownFont)
  assert.equal(unknownFont.status, 404)

  // A path that normalizes out of the plugin prefix never reaches the route.
  const escapedFont = response()
  await handleRequest(request('GET', '/dsh-retro-ai-os/fonts/../../package.json', undefined, {}), escapedFont)
  assert.equal(escapedFont.status, 403)

  const storeWithAsset = response()
  await handleRequest(request('POST', '/dsh-retro-ai-os/preferences', {
    brand: { ...brand, asset: upload.payload.data },
  }), storeWithAsset)
  assert.equal(storeWithAsset.status, 200)
  assert.equal(storeWithAsset.payload.data.brand.asset.url, upload.payload.data.url)

  const removed = response()
  await handleRequest(request('DELETE', '/dsh-retro-ai-os/brand-asset'), removed)
  assert.equal(removed.status, 200)
  assert.equal(removed.payload.data.removed, 1)

  // A rejected data URL never reaches the disk.
  const rejected = response()
  await handleRequest(request('POST', '/dsh-retro-ai-os/brand-asset', {
    dataUrl: 'data:image/png;base64,bm90LWEtcG5n',
    name: 'fake.png',
  }), rejected)
  assert.equal(rejected.status, 400)
  assert.equal(rejected.payload.error, 'invalid-asset')

  console.log('Host check OK:', storeFile(), 'assets:', assetDirectory())
} finally {
  rmSync(home, { recursive: true, force: true })
}
