import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'

const home = mkdtempSync(join(tmpdir(), 'dsh-sandbox-test-'))
process.env.DSH_HOME = home

const host = await import('../index.js')
const { canonicalTarget, isInside, readState, writeState, handleRequest, storeFile } = host

function request(method, url, body, headers = { 'x-dsh-sandbox': '1' }) {
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

const workspace = mkdtempSync(join(tmpdir(), 'dsh-sandbox-ws-'))
const childDir = join(workspace, 'nested')
mkdirSync(childDir)
writeFileSync(join(childDir, 'file.txt'), 'x')
const outside = mkdtempSync(join(tmpdir(), 'dsh-sandbox-out-'))
const link = join(workspace, 'escape')
symlinkSync(outside, link)

try {
  assert.deepEqual(readState(), { version: 1, sessions: {}, grants: [] })
  writeState({ sessions: { a: true }, grants: [workspace] })
  assert.deepEqual(readState(), { version: 1, sessions: { a: true }, grants: [workspace] })
  assert.equal(statSync(storeFile()).mode & 0o777, 0o600)
  assert.equal(statSync(storeFile()).size > 0, true)
  writeState({ sessions: {}, grants: [] })
  assert.deepEqual(readState(), { version: 1, sessions: {}, grants: [] })

  assert.equal(isInside(canonicalTarget(workspace), canonicalTarget(join(childDir, 'file.txt'))), true)
  assert.equal(isInside(canonicalTarget(workspace), canonicalTarget(outside)), false)
  assert.equal(isInside(canonicalTarget(workspace), canonicalTarget(join(link, 'missing.txt'))), false)

  const manager = {
    grants: [workspace],
    state: new Map(),
    view(sessionId) {
      return { enabled: sessionId === 'a' ? this.state.get('a') === true : false, grants: this.grants }
    },
    toggle(sessionId, enabled) {
      this.state.set(sessionId, enabled)
    },
    grant(action, path) {
      if (action === 'add') this.grants = [...this.grants, path]
      else this.grants = this.grants.filter((entry) => entry !== path)
      return this.grants
    },
  }

  const unauthorized = response()
  await handleRequest(manager, request('GET', '/dsh-sandbox/state', undefined, {}), unauthorized)
  assert.equal(unauthorized.status, 403)

  const state = response()
  await handleRequest(manager, request('GET', '/dsh-sandbox/state?sessionId=a'), state)
  assert.equal(state.status, 200)
  assert.equal(state.payload.data.enabled, false)

  const toggle = response()
  await handleRequest(manager, request('POST', '/dsh-sandbox/state', { sessionId: 'a', enabled: true }), toggle)
  assert.equal(toggle.status, 200)
  assert.equal(toggle.payload.data.enabled, true)

  const badToggle = response()
  await handleRequest(manager, request('POST', '/dsh-sandbox/state', { sessionId: 'a', enabled: 'yes' }), badToggle)
  assert.equal(badToggle.status, 400)
  assert.equal(badToggle.payload.error, 'invalid-enabled')

  const grants = response()
  await handleRequest(manager, request('GET', '/dsh-sandbox/grants'), grants)
  assert.deepEqual(grants.payload.data.grants, [workspace])

  const add = response()
  await handleRequest(manager, request('POST', '/dsh-sandbox/grants', { action: 'add', path: outside }), add)
  assert.equal(add.status, 200)
  assert.deepEqual(add.payload.data.grants, [workspace, outside])

  const remove = response()
  await handleRequest(manager, request('POST', '/dsh-sandbox/grants', { action: 'remove', path: outside }), remove)
  assert.deepEqual(remove.payload.data.grants, [workspace])

  const missing = response()
  await handleRequest(manager, request('GET', '/dsh-sandbox/nope'), missing)
  assert.equal(missing.status, 404)

  writeFileSync(storeFile(), '{ not json')
  assert.deepEqual(readState(), { version: 1, sessions: {}, grants: [] })
} finally {
  rmSync(home, { recursive: true, force: true })
  rmSync(workspace, { recursive: true, force: true })
  rmSync(outside, { recursive: true, force: true })
}

console.log('dsh-sandbox host check passed')
