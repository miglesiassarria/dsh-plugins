import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { apply } from '../index.js'

const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'demo-mcp-server.mjs')

/** In-memory stand-in for the DSH tool registry; duplicates fail like the real one. */
function createRegistry() {
  const active = new Map()
  return {
    active,
    register(definition) {
      if (active.has(definition.name)) throw new Error('tool "' + definition.name + '" is already registered')
      active.set(definition.name, definition)
      return () => {
        if (active.get(definition.name) === definition) active.delete(definition.name)
      }
    },
  }
}

/** Minimal host context: only the seams this plugin consumes. */
function createHost() {
  const registry = createRegistry()
  const hooks = new Map()
  let route
  const host = {
    registry,
    hooks,
    logger: { info() {}, warn() {}, error() {} },
    tools: registry,
    effect(run) {
      const cleanup = run()
      return () => cleanup?.()
    },
    on(event, listener) {
      hooks.set(event, listener)
      return () => hooks.delete(event)
    },
    webServer: {
      register(spec) {
        route = spec.handler
        return () => { route = undefined }
      },
    },
  }
  host.route = () => route
  return host
}

/** Drive the settings route the way the page does and wait for its reply. */
async function settingsCall(host, method, path, body) {
  const chunks = body === undefined ? [] : [Buffer.from(JSON.stringify(body))]
  const request = {
    method,
    url: '/dsh-tools-mcp' + path,
    headers: { 'x-dsh-tools': '1', host: 'localhost' },
    [Symbol.asyncIterator]: async function* () {
      for (const chunk of chunks) yield chunk
    },
  }
  let status
  let payload
  let finish
  const done = new Promise(resolve => { finish = resolve })
  const response = {
    writeHead(value) { status = value },
    end(text) { payload = JSON.parse(text); finish() },
  }
  await host.route()(request, response)
  await Promise.race([done, new Promise(resolve => setTimeout(resolve, 5_000))])
  if (status === undefined) throw new Error('the settings route did not answer')
  return { status, payload }
}

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

async function waitFor(check, label, timeout = 20_000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const value = check()
    if (value) return value
    await sleep(50)
  }
  throw new Error('timed out waiting for ' + label)
}

let home
let host

before(() => {
  home = mkdtempSync(join(tmpdir(), 'dsh-tools-mcp-'))
  process.env.DSH_HOME = home
  mkdirSync(join(home, 'mcp-tools'), { recursive: true })
  writeFileSync(join(home, 'mcp-tools', 'servers.json'), JSON.stringify({
    version: 1,
    servers: [{
      id: 'demo',
      name: 'Demo',
      transport: 'stdio',
      autoConnect: true,
      command: process.execPath,
      args: [fixture],
      env: {},
      url: '',
      auth: 'none',
      token: '',
      permissions: { echo: 'deny', add: 'ask', server_info: 'allow' },
      groupPolicies: {},
    }],
  }, undefined, 2))
  host = createHost()
  apply(host)
})

after(async () => {
  // Stop the MCP child so the test process can exit on its own.
  try {
    await settingsCall(host, 'POST', '/servers/demo/disconnect')
  } catch {
    // The server may already be gone.
  }
})

test('deny hides exactly one tool while ask and allow stay registered', async () => {
  await waitFor(() => host.registry.active.has('mcp__Demo__add'), 'the first tool generation')
  assert.equal(host.registry.active.has('mcp__Demo__echo'), false)
  assert.equal(host.registry.active.has('mcp__Demo__add'), true)
  assert.equal(host.registry.active.has('mcp__Demo__server_info'), true)
})

test('ask upgrades an allow decision at the pre-execute gate', async () => {
  const gate = host.hooks.get('tools/pre-execute')
  assert.equal(typeof gate, 'function')
  const asked = await gate({ name: 'mcp__Demo__add' }, async () => ({ kind: 'allow' }))
  assert.equal(asked.kind, 'ask')
  assert.match(asked.reason, /requiere aprobación/)
  const allowed = await gate({ name: 'mcp__Demo__server_info' }, async () => ({ kind: 'allow' }))
  assert.equal(allowed.kind, 'allow')
})

test('a block policy denies the whole block and survives the refresh', async () => {
  const stale = host.registry.active.get('mcp__Demo__add')
  const updated = await settingsCall(host, 'PUT', '/servers/demo/permissions', {
    permissions: { echo: 'deny', server_info: 'allow' },
    groupPolicies: { write: 'deny' },
  })
  assert.equal(updated.status, 200)
  assert.deepEqual(updated.payload.data.server.groupPolicies, { write: 'deny' })
  // The refresh must retire the old generation before inserting the next one;
  // otherwise the surviving read tool fails to re-register as a duplicate.
  assert.equal(host.registry.active.has('mcp__Demo__add'), false)
  assert.equal(host.registry.active.has('mcp__Demo__server_info'), true)
  await assert.rejects(() => stale.execute({ a: 1, b: 2 }, { signal: new AbortController().signal }), /denegada/)
  const persisted = JSON.parse(readFileSync(join(home, 'mcp-tools', 'servers.json'), 'utf8'))
  assert.deepEqual(persisted.servers[0].groupPolicies, { write: 'deny' })
})
