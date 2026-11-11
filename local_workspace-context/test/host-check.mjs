/**
 * Host check for the workspace context plugin.
 *
 * Exercises the durable store, the model-facing renderer, folder ingestion
 * limits, and the same-origin HTTP route without booting a Harness.
 *
 * Usage: node test/host-check.mjs
 */
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'

const home = mkdtempSync(join(tmpdir(), 'dsh-workspace-context-'))
process.env.DSH_HOME = home

const plugin = await import('../index.js')

const project = join(home, 'project')
mkdirSync(join(project, 'src'), { recursive: true })
mkdirSync(join(project, 'node_modules', 'pkg'), { recursive: true })
mkdirSync(join(project, '.git'), { recursive: true })
const docs = join(home, 'docs')
mkdirSync(docs, { recursive: true })
writeFileSync(join(docs, 'guide.md'), '# Guide\n\nRead the guide.\n')
writeFileSync(join(project, 'README.md'), '# Project\n\nA sample project.\n')
writeFileSync(join(project, 'src', 'app.js'), 'export const answer = 42\n')
writeFileSync(join(project, 'node_modules', 'pkg', 'index.js'), 'module.exports = 1\n')
writeFileSync(join(project, '.env'), 'SECRET_TOKEN=do-not-leak\n')
writeFileSync(join(project, 'credentials.pem'), '-----BEGIN PRIVATE KEY-----\n')
writeFileSync(join(project, 'binary.bin'), Buffer.from([0, 1, 2, 3, 0, 255]))
writeFileSync(join(project, '.gitignore'), 'node_modules\n')
writeFileSync(join(project, 'package-lock.json'), '{"lockfileVersion": 3}\n')

const store = new plugin.WorkspaceContextStore({ file: join(home, 'workspace-context', 'context.json') })

// ---- Workspace configuration ------------------------------------------------
const saved = store.saveWorkspace('ws-1', {
  description: 'Product documentation workspace.',
  systemPrompt: 'Prefer TypeScript and explain tradeoffs.',
  color: '#FF8800',
  icon: 'code',
  entries: [
    { kind: 'folder', path: project },
    { kind: 'file', name: 'notes.md', text: '# Notes\n\nShip it.\n' },
  ],
})
assert.equal(saved.description, 'Product documentation workspace.')
assert.equal(saved.systemPrompt, 'Prefer TypeScript and explain tradeoffs.')
assert.equal(saved.entries.length, 2)
assert.equal(saved.color, '#ff8800')
assert.equal(saved.icon, 'code')
assert.ok(saved.entries.every(entry => entry.kind === 'folder' || entry.text === undefined))

const publicConfig = store.publicWorkspace('ws-1')
assert.equal(publicConfig.entries[0].path, realpathSync(project))
assert.equal(publicConfig.entries[0].text, undefined)
assert.equal(publicConfig.entries[1].bytes, Buffer.byteLength('# Notes\n\nShip it.\n'))

// Saving the public shape again must retain stored file text.
store.saveWorkspace('ws-1', {
  description: publicConfig.description,
  systemPrompt: publicConfig.systemPrompt,
  entries: publicConfig.entries,
})
assert.equal(store.workspace('ws-1').entries[1].text, '# Notes\n\nShip it.\n')
assert.equal(store.workspace('ws-1').color, '#ff8800')
assert.equal(store.workspace('ws-1').icon, 'code')

// Appearance validation: colors are lowercase hex, preset ids are finite, and
// custom icons are bounded raster data URLs.
const appearanceStore = new plugin.WorkspaceContextStore({ file: join(home, 'workspace-context', 'appearance.json') })
const invalidAppearance = appearanceStore.saveWorkspace('style', { color: 'orange', icon: 'not-an-icon' })
assert.equal(invalidAppearance.color, '')
assert.equal(invalidAppearance.icon, '')
const customIcon = 'data:image/png;base64,iVBORw0KGgo='
const withIcon = appearanceStore.saveWorkspace('style', { icon: customIcon, color: '#123abc' })
assert.equal(withIcon.icon, customIcon)
assert.equal(withIcon.color, '#123abc')
const oversizedIcon = appearanceStore.saveWorkspace('style', { icon: 'data:image/png;base64,' + 'A'.repeat(200_001) })
assert.equal(oversizedIcon.icon, '')

// ---- Stable workspace path ---------------------------------------------------
const legacy = join(home, 'legacy-project')
mkdirSync(legacy, { recursive: true })
writeFileSync(join(legacy, 'legacy.md'), '# Legacy\n')
store.saveWorkspace('legacy-old', {
  description: 'Legacy workspace',
  entries: [{ kind: 'folder', path: legacy }],
}, { path: legacy, title: 'Legacy' })
assert.equal(store.workspace('legacy-new', legacy).description, 'Legacy workspace')
store.saveWorkspace('legacy-new', {
  description: 'Legacy workspace',
  entries: [{ kind: 'folder', path: legacy }],
}, { path: legacy, title: 'Legacy' })
assert.equal(store.load().workspaces['legacy-old'], undefined, 'the old id must migrate to the new one')

// ---- Model context -----------------------------------------------------------
const workspaceRegistry = {
  list: () => [{ id: 'ws-1', path: project, title: 'Docs project', sessionIds: ['session-1'] }],
}
const workingDirectory = { get: () => project }
const agent = { id: 'session-1', session: {} }
const services = { workspaceRegistry, workingDirectory }

const alias = join(home, 'project-link')
symlinkSync(project, alias)
const aliasWorkspace = plugin.resolveAgentWorkspace(
  { id: 'session-alias', session: {} },
  { workspaceRegistry, workingDirectory: { get: () => alias } },
)
assert.equal(aliasWorkspace.workspace?.id, 'ws-1', 'a symlinked cwd must inherit its workspace')

let context = plugin.renderContextForAgent(store, agent, services)
for (const fragment of [
  'Workspace: Docs project',
  'Product documentation workspace.',
  'Prefer TypeScript and explain tradeoffs.',
  'README.md',
  'A sample project.',
  'src/app.js',
  'export const answer = 42',
  'notes.md',
  'Ship it.',
]) {
  assert.ok(context.includes(fragment), `missing context fragment: ${fragment}`)
}
for (const fragment of ['node_modules', 'SECRET_TOKEN', 'PRIVATE KEY', 'binary.bin', '.gitignore', 'lockfileVersion']) {
  assert.ok(!context.includes(fragment), `leaked skipped content: ${fragment}`)
}
assert.ok(context.startsWith('<workspace_context>'))
assert.ok(context.endsWith('</workspace_context>'))

// Session folders join the same section and disappear when removed.
const added = store.addSessionFolder('session-1', docs)
assert.equal(added.length, 1)
assert.equal(added[0].name, 'docs')
context = plugin.renderContextForAgent(store, agent, services)
assert.ok(context.includes('Folders added to this session'))
assert.ok(context.includes('Read the guide.'))

store.addSessionFolder('session-1', docs)
assert.equal(store.sessionEntries('session-1').length, 1, 'the same folder must not be added twice')

const removed = store.removeSessionEntry('session-1', added[0].id)
assert.equal(removed.length, 0)
context = plugin.renderContextForAgent(store, agent, services)
assert.ok(!context.includes('Read the guide.'))

// A session without a workspace still renders its own folders.
store.addSessionFolder('session-2', docs)
const orphan = { id: 'session-2', session: {} }
const orphanContext = plugin.renderContextForAgent(store, orphan, { ...services, workingDirectory: { get: () => docs } })
assert.ok(orphanContext.includes('Read the guide.'))
assert.ok(!orphanContext.includes('Workspace:'))

// No configuration means no model-visible section at all.
const emptyAgent = { id: 'session-3', session: {} }
assert.equal(plugin.renderContextForAgent(store, emptyAgent, { workspaceRegistry: { list: () => [] }, workingDirectory: { get: () => docs } }), '')

// ---- Validation --------------------------------------------------------------
await assert.rejects(
  async () => store.saveWorkspace('ws-1', { entries: [{ kind: 'folder', path: join(home, 'missing') }] }),
  (error) => error.code === 'folder-missing',
)
writeFileSync(join(home, 'plain.txt'), 'hello')
await assert.rejects(
  async () => store.saveWorkspace('ws-1', { entries: [{ kind: 'folder', path: join(home, 'plain.txt') }] }),
  (error) => error.code === 'folder-not-directory',
)
await assert.rejects(
  async () => store.saveWorkspace('ws-1', { entries: [{ kind: 'file', name: 'huge.txt', text: 'x'.repeat(129 * 1024) }] }),
  (error) => error.code === 'file-too-large',
)
await assert.rejects(
  async () => store.addSessionFolder('session-1', join(home, 'missing')),
  (error) => error.code === 'folder-missing',
)

// ---- HTTP route --------------------------------------------------------------
const workspace = { id: 'ws-1', path: project, title: 'Docs project' }
const lookup = (id) => (id === 'ws-1' ? workspace : undefined)
const lookupForSession = (id) => (typeof id === 'string' && id.length > 0 ? workspace : undefined)

/** Build a minimal request/response pair for handleRequest. */
function requestPair({ method = 'GET', url = '/dsh-workspace-context/health', headers = {}, body } = {}) {
  const payload = body === undefined ? [] : [Buffer.from(JSON.stringify(body))]
  const request = Readable.from(payload)
  request.method = method
  request.url = url
  request.headers = { host: 'localhost', ...headers }
  const result = { status: 0, headers: {}, body: '' }
  const response = {
    writeHead(status, responseHeaders) {
      result.status = status
      result.headers = responseHeaders
    },
    end(text) {
      result.body = text
    },
  }
  return { request, response, result }
}

let pair = requestPair()
await plugin.handleRequest(store, lookup, lookupForSession, pair.request, pair.response)
assert.equal(pair.result.status, 403)
assert.deepEqual(JSON.parse(pair.result.body), { ok: false, error: 'unauthorized' })

pair = requestPair({ headers: { 'x-dsh-workspace-context': '1' } })
await plugin.handleRequest(store, lookup, lookupForSession, pair.request, pair.response)
assert.equal(pair.result.status, 200)
assert.deepEqual(JSON.parse(pair.result.body).data, { workspaces: 2, sessions: 1, entries: 4 })

pair = requestPair({
  url: '/dsh-workspace-context/state?workspaceId=ws-1',
  headers: { 'x-dsh-workspace-context': '1' },
})
await plugin.handleRequest(store, lookup, lookupForSession, pair.request, pair.response)
assert.equal(pair.result.status, 200)
const state = JSON.parse(pair.result.body).data
assert.equal(state.workspace.title, 'Docs project')
assert.equal(state.config.entries[1].text, undefined)
assert.equal(state.config.color, '#ff8800')
assert.equal(state.config.icon, 'code')

pair = requestPair({
  url: '/dsh-workspace-context/presentation',
  headers: { 'x-dsh-workspace-context': '1' },
})
await plugin.handleRequest(store, lookup, lookupForSession, pair.request, pair.response, () => [workspace])
assert.equal(pair.result.status, 200)
assert.deepEqual(JSON.parse(pair.result.body).data.workspaces, [{
  workspaceId: 'ws-1',
  title: 'Docs project',
  path: project,
  color: '#ff8800',
  icon: 'code',
}])

pair = requestPair({
  method: 'POST',
  url: '/dsh-workspace-context/workspace',
  headers: { 'x-dsh-workspace-context': '1' },
  body: { workspaceId: 'ws-1', description: 'Updated', systemPrompt: '', entries: [{ kind: 'folder', path: docs }] },
})
await plugin.handleRequest(store, lookup, lookupForSession, pair.request, pair.response)
assert.equal(pair.result.status, 200)
assert.equal(JSON.parse(pair.result.body).data.config.description, 'Updated')
assert.equal(JSON.parse(pair.result.body).data.config.entries[0].path, realpathSync(docs))

pair = requestPair({
  url: '/dsh-workspace-context/session/context?sessionId=session-1&workspaceId=ws-1',
  headers: { 'x-dsh-workspace-context': '1' },
})
await plugin.handleRequest(store, lookup, lookupForSession, pair.request, pair.response)
assert.equal(pair.result.status, 200)
const mergedOne = JSON.parse(pair.result.body).data
assert.equal(mergedOne.workspace.title, 'Docs project')
assert.equal(mergedOne.workspaceEntries.length, 1)
assert.equal(mergedOne.sessionEntries.length, 0)
assert.equal(mergedOne.merged.length, 1)
assert.equal(mergedOne.merged[0].source, 'workspace')

pair = requestPair({
  method: 'POST',
  url: '/dsh-workspace-context/session/entries',
  headers: { 'x-dsh-workspace-context': '1' },
  body: { sessionId: 'session-9', path: docs },
})
await plugin.handleRequest(store, lookup, lookupForSession, pair.request, pair.response)
assert.equal(pair.result.status, 200)
const sessionData = JSON.parse(pair.result.body).data
assert.equal(sessionData.entries.length, 1)
assert.equal(sessionData.entries[0].path, realpathSync(docs))

pair = requestPair({
  url: '/dsh-workspace-context/session/context?sessionId=session-9',
  headers: { 'x-dsh-workspace-context': '1' },
})
await plugin.handleRequest(store, lookup, lookupForSession, pair.request, pair.response)
assert.equal(pair.result.status, 200)
const mergedTwo = JSON.parse(pair.result.body).data
assert.equal(mergedTwo.workspaceEntries.length, 1)
assert.equal(mergedTwo.sessionEntries.length, 1)
assert.equal(mergedTwo.merged.length, 2)
assert.deepEqual(mergedTwo.merged.map(entry => entry.source), ['workspace', 'session'])

pair = requestPair({
  method: 'POST',
  url: '/dsh-workspace-context/session/entries/remove',
  headers: { 'x-dsh-workspace-context': '1' },
  body: { sessionId: 'session-9', entryId: sessionData.entries[0].id },
})
await plugin.handleRequest(store, lookup, lookupForSession, pair.request, pair.response)
assert.equal(pair.result.status, 200)
assert.deepEqual(JSON.parse(pair.result.body).data.entries, [])

pair = requestPair({
  url: '/dsh-workspace-context/state?workspaceId=missing',
  headers: { 'x-dsh-workspace-context': '1' },
})
await plugin.handleRequest(store, lookup, lookupForSession, pair.request, pair.response)
assert.equal(pair.result.status, 404)
assert.equal(JSON.parse(pair.result.body).error, 'workspace-unknown')

// ---- Persistence -------------------------------------------------------------
const persisted = JSON.parse(readFileSync(join(home, 'workspace-context', 'context.json'), 'utf8'))
assert.equal(persisted.version, 1)
assert.equal(persisted.workspaces['ws-1'].description, 'Updated')
assert.equal(persisted.workspaces['ws-1'].color, '#ff8800')
assert.equal(persisted.workspaces['ws-1'].icon, 'code')

console.log('host check passed:', {
  contextCharacters: context.length,
  workspaces: store.stats().workspaces,
  route: 'ok',
})
