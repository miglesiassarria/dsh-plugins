import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'

const home = mkdtempSync(join(tmpdir(), 'default-model-'))
process.env.DSH_HOME = home

const host = await import('../index.js')
const {
  apply,
  handleRequest,
  readPinnedSelection,
  sameSelection,
  storeFile,
  syncBlankSessions,
} = host

const ROUTE = '/dsh-default-model'
const HEADER = { 'x-dsh-default-model': '1' }

/**
 * Build one incoming request.
 * @param {string} method HTTP method.
 * @param {string} path Route suffix.
 * @param {object|string} [body] JSON value or raw text.
 * @param {object} [headers] Request headers.
 * @returns {Readable} Request stream.
 */
function request(method, path, body, headers = HEADER) {
  const chunks = body === undefined ? [] : [Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))]
  const stream = Readable.from(chunks)
  stream.method = method
  stream.url = ROUTE + path
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

/** @returns {object} A fake Agent with the fields the pin policy reads. */
function makeAgent({ parentSession, origin, isSeeded, inherited = 0, events = [], recorded = null } = {}) {
  let selection = recorded
  const selected = []
  return {
    selected,
    session: {
      header: {
        ...(parentSession === undefined ? {} : { parentSession }),
        ...(origin === undefined ? {} : { origin }),
        ...(isSeeded === undefined ? {} : { isSeeded }),
      },
      inheritedEventCount: inherited,
      events,
    },
    model: {
      current: () => selection ?? { provider: 'nexo', model: 'openai/gpt-6-luna' },
      select(next) {
        selection = { ...next }
        selected.push({ ...next })
      },
    },
  }
}

const saved = []
let liveAgents = []
let currentSelection = { provider: 'nexo', model: 'openai/gpt-6-luna' }

const routes = []
const listeners = {}
const warnings = []
const ctx = {
  logger: { warn(message) { warnings.push(message) } },
  llm: {
    listProviders: () => [
      { id: 'nexo', name: 'Nexo' },
      { id: 'opencode-go', name: 'opencode-go' },
      { id: 'broken', name: 'Broken' },
    ],
    async listModels(provider) {
      if (provider === 'nexo') {
        return [
          { id: 'openai/gpt-6-luna', name: 'GPT-6 Luna' },
          { id: 'openai/gpt-6.1-sol', name: 'GPT-6.1 Sol' },
        ]
      }
      if (provider === 'opencode-go') return [{ id: 'deepseek-v4.1-flash', name: 'DeepSeek V4.1 Flash' }]
      throw new Error('endpoint down')
    },
  },
  agentDefaultModel: {
    currentSelection: () => ({ ...currentSelection }),
    async saveSelection(selection) {
      saved.push({ ...selection })
      currentSelection = { ...selection }
    },
  },
  agents: {
    list: () => liveAgents,
  },
  webServer: {
    register(route) {
      routes.push(route)
      return () => {}
    },
  },
  effect(callback) {
    callback()
    return () => {}
  },
  on(name, callback) {
    listeners[name] = callback
    return () => {}
  },
}

async function call(method, path, body, headers) {
  const res = response()
  await handleRequest(ctx, { pinned: readPinnedSelection() }, request(method, path, body, headers), res)
  return res
}

try {
  apply(ctx)

  assert.equal(routes.length, 1, 'the Host did not register the route')
  assert.equal(routes[0].kind, 'prefix')
  assert.equal(routes[0].path, ROUTE)
  assert.equal(typeof listeners['agent/created'], 'function', 'the Host did not subscribe to agent creation')

  const adopted = readPinnedSelection()
  assert.deepEqual(adopted, { provider: 'nexo', model: 'openai/gpt-6-luna' })
  assert.equal(statSync(storeFile()).mode & 0o777, 0o600)

  const state = await call('GET', '/state')
  assert.equal(state.status, 200)
  assert.equal(state.payload.ok, true)
  assert.deepEqual(state.payload.data.selection, adopted)
  assert.equal(state.payload.data.available, true)
  assert.deepEqual(state.payload.data.groups.map(group => group.id), ['nexo', 'opencode-go'])
  assert.deepEqual(state.payload.data.groups[0].models.map(model => model.name), ['GPT-6 Luna', 'GPT-6.1 Sol'])
  assert.deepEqual(state.payload.data.failures.map(failure => failure.id), ['broken'])

  const blank = makeAgent({ recorded: { provider: 'nexo', model: 'openai/gpt-6-luna' } })
  const subagent = makeAgent({ parentSession: 'parent', recorded: { provider: 'nexo', model: 'openai/gpt-6-luna' } })
  const started = makeAgent({ events: [{ type: 'turn/start' }], recorded: { provider: 'nexo', model: 'openai/gpt-6-luna' } })
  liveAgents = [blank, subagent, started]

  const save = await call('POST', '/selection', { provider: 'opencode-go', model: 'deepseek-v4.1-flash' })
  assert.equal(save.status, 200)
  assert.deepEqual(save.payload.data.selection, { provider: 'opencode-go', model: 'deepseek-v4.1-flash' })
  assert.equal(save.payload.data.updated, 1)
  assert.deepEqual(saved.at(-1), { provider: 'opencode-go', model: 'deepseek-v4.1-flash' })
  assert.deepEqual(readPinnedSelection(), { provider: 'opencode-go', model: 'deepseek-v4.1-flash' })
  assert.equal(blank.selected.length, 1)
  assert.equal(subagent.selected.length, 0)
  assert.equal(started.selected.length, 0)

  const invalid = await call('POST', '/selection', { provider: 'nexo', model: 'does-not-exist' })
  assert.equal(invalid.status, 400)
  assert.equal(invalid.payload.code, 'invalid-model')
  assert.deepEqual(readPinnedSelection(), { provider: 'opencode-go', model: 'deepseek-v4.1-flash' })

  const malformed = await call('POST', '/selection', '{not json')
  assert.equal(malformed.status, 400)
  assert.equal(malformed.payload.code, 'invalid-json')

  const forbidden = await call('GET', '/state', undefined, {})
  assert.equal(forbidden.status, 403)

  const unknown = await call('GET', '/nope')
  assert.equal(unknown.status, 404)

  // New root chats inherit the pin, whatever the deployment default says.
  currentSelection = { provider: 'nexo', model: 'openai/gpt-6.1-sol' }
  const created = makeAgent()
  listeners['agent/created']({ agent: created, source: 'startup' })
  assert.equal(created.selected.length, 1)
  assert.deepEqual(created.selected[0], { provider: 'opencode-go', model: 'deepseek-v4.1-flash' })

  const resumedBlank = makeAgent({ recorded: { provider: 'nexo', model: 'openai/gpt-6.1-sol' } })
  listeners['agent/created']({ agent: resumedBlank, source: 'resume' })
  assert.equal(resumedBlank.selected.length, 1)

  const resumedStarted = makeAgent({ events: [{ type: 'turn/start' }], recorded: { provider: 'nexo', model: 'openai/gpt-6.1-sol' } })
  listeners['agent/created']({ agent: resumedStarted, source: 'resume' })
  assert.equal(resumedStarted.selected.length, 0)

  const child = makeAgent({ parentSession: 'parent' })
  listeners['agent/created']({ agent: child, source: 'startup' })
  assert.equal(child.selected.length, 0)

  const forked = makeAgent({ isSeeded: true, events: [{ type: 'turn/start' }] })
  listeners['agent/created']({ agent: forked, source: 'startup' })
  assert.equal(forked.selected.length, 0)

  const inherited = makeAgent({ inherited: 3, events: [{ type: 'turn/start' }] })
  listeners['agent/created']({ agent: inherited, source: 'startup' })
  assert.equal(inherited.selected.length, 0)

  const alreadyPinned = makeAgent({ recorded: { provider: 'opencode-go', model: 'deepseek-v4.1-flash' } })
  listeners['agent/created']({ agent: alreadyPinned, source: 'startup' })
  assert.equal(alreadyPinned.selected.length, 0)

  // Reusing a blank session through sync keeps its model on the pin.
  const reused = makeAgent({ recorded: { provider: 'nexo', model: 'openai/gpt-6-luna' } })
  assert.equal(syncBlankSessions({ ...ctx, agents: { list: () => [reused] } }, readPinnedSelection()), 1)
  assert.equal(reused.selected.length, 1)

  // A damaged pin document is ignored and the deployment default is adopted again.
  writeFileSync(storeFile(), '{broken')
  assert.equal(readPinnedSelection(), undefined)
  currentSelection = { provider: 'nexo', model: 'openai/gpt-6.1-sol' }
  const recovered = await call('GET', '/state')
  assert.equal(recovered.status, 200)
  assert.deepEqual(recovered.payload.data.selection, { provider: 'nexo', model: 'openai/gpt-6.1-sol' })
  assert.deepEqual(readPinnedSelection(), { provider: 'nexo', model: 'openai/gpt-6.1-sol' })

  assert.equal(sameSelection(undefined, undefined), true)
  assert.equal(sameSelection({ provider: 'a', model: 'b' }, { provider: 'a', model: 'b' }), true)
  assert.equal(sameSelection({ provider: 'a', model: 'b' }, { provider: 'a', model: 'c' }), false)

  console.log('Host check OK:', storeFile(), 'warnings:', warnings.length)
} finally {
  rmSync(home, { recursive: true, force: true })
}
