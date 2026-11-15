/**
 * Live-composition integration check.
 *
 * Runs inside the Electron application process (so the app.asar is readable)
 * and uses the same @deepseek-ai packages the running Host uses. It proves the
 * plugin's application-bundled fallback, the agent-scoped native executor, the
 * global guard and the policy wrapper against the real tools service.
 */
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const APP = '/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai'
const imp = (path) => import(pathToFileURL(APP + '/' + path).href)
const { Context } = await imp('cordis/lib/index.js')
const { default: ToolsService } = await imp('dsh-tools/lib/index.js')
const { createScope } = await imp('dsh-scope/lib/index.js')
const rootExecutor = await imp('dsh-tool-executor-native/lib/index.js')

const home = mkdtempSync(join(tmpdir(), 'dsh-sandbox-live-home-'))
const cwd = mkdtempSync(join(tmpdir(), 'dsh-sandbox-live-ws-'))
const grant = mkdtempSync(join(tmpdir(), 'dsh-sandbox-live-grant-'))
const outside = mkdtempSync(join(tmpdir(), 'dsh-sandbox-live-out-'))
process.env.DSH_HOME = home
mkdirSync(join(home, 'dsh-sandbox'), { recursive: true })
writeFileSync(join(home, 'dsh-sandbox', 'state.json'), JSON.stringify({ version: 1, sessions: { a1: true, a2: false }, grants: [grant] }))
writeFileSync(join(cwd, 'inside.txt'), 'inside')
writeFileSync(join(grant, 'granted.txt'), 'granted')
writeFileSync(join(outside, 'secret.txt'), 'secret')

const ctx = new Context()
const promptCallbacks = []
ctx.provide('systemPrompt', { tools: (callback) => { promptCallbacks.push(callback); return () => {} }, section: () => () => {} })
ctx.plugin(ToolsService)
ctx.plugin(rootExecutor)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
for (let i = 0; i < 100 && !ctx.get('tools'); i += 1) await sleep(50)
const tools = ctx.get('tools')
const def = (name) => ({
  name,
  description: name,
  parameters: { type: 'object', properties: {}, additionalProperties: true },
  output: { schema: { type: 'object', properties: {}, additionalProperties: true }, render: () => [] },
  execute: async () => ({ ok: name }),
})
for (const name of ['bash', 'job_list', 'job_output', 'job_kill', 'cua', 'mcp__x__y', 'read', 'write', 'glob', 'grep']) tools.register(def(name))

async function makeAgent(id, parent) {
  const agent = { id, parent: parent ?? null, session: { id, header: { cwd } } }
  await new Promise((resolve) => {
    ctx.inject(['tools'], (scoped) => {
      agent.ctx = createScope(scoped, agent).ctx
      resolve()
    })
    setTimeout(resolve, 1000)
  })
  return agent
}
const a1 = await makeAgent('a1')
const a2 = await makeAgent('a2')
const a3 = await makeAgent('a3')
class FakePtc {
  describe() { return { schemas: [{ name: 'run_code', description: 'ptc', parameters: { type: 'object', properties: {} } }] } }
  async execute(input) { return { results: (input?.calls ?? []).map((call) => ({ id: call.id, result: { isError: false, value: { ptc: true } } })) } }
}
const fakePtc = new FakePtc()
a1.ctx.tools.setExecutor(fakePtc)
const agents = [a1, a2, a3]
ctx.provide('agents', {
  list: () => agents,
  isOwnedBy: (id, owner) => agents.some((agent) => agent.id === id && agent.parent === owner),
})
ctx.provide('sandboxPolicy', {
  resolve: () => ({ mode: 'danger-full-access', workspaceRoot: cwd }),
})
let routeHandler
ctx.provide('webServer', { register: (spec) => { routeHandler = spec.handler; return () => {} } })

const plugin = await import('../index.js?live=' + Date.now())
assert.equal(plugin.nativeExecutorInfo().source, 'application')
assert.equal(plugin.nativeExecutorInfo().error, undefined)
ctx.plugin(plugin)
await sleep(300)
console.log('DEBUG', plugin.sandboxState())

const promptDescription = promptCallbacks[0]({ scope: a1 })
const symbols = await imp('cordis/lib/index.js')
const target = tools[symbols.symbols.original]
console.log('PROMPT', promptDescription.schemas.map((schema) => schema.name))
console.log('DEFS', tools.definitions(a1).map((definition) => definition.name))
console.log('PROXY SELECT', tools.selectExecutor(a1)?.constructor?.name, tools.selectExecutor(a1) === fakePtc)
console.log('TARGET SELECT', target.selectExecutor(a1)?.constructor?.name, target.selectExecutor(a1) === fakePtc)
console.log('TARGET OWN', Object.prototype.hasOwnProperty.call(target, 'selectExecutor'), String(target.selectExecutor).slice(0, 60))
assert.equal(promptDescription.schemas.some((schema) => schema.name === 'run_code'), false, 'the model tool list must not include run_code')
assert.equal(tools.definitions(a1).some((d) => d.name === 'bash'), false)
assert.equal(tools.definitions(a1).some((d) => d.name === 'bash'), false)
assert.equal(tools.definitions(a1).some((d) => d.name === 'mcp__x__y'), true)
console.log('PASS native executor loaded from the application and CLI hidden')

const mcp = await tools.execute({ calls: [{ id: '1', name: 'mcp__x__y', arguments: '{}' }], agent: a1, signal: new AbortController().signal })
assert.equal(mcp.results[0].result.isError, false)
assert.equal(mcp.results[0].result.value.ok, 'mcp__x__y', 'execution must use the native executor, not the preset PTC executor')
const bash = await tools.execute({ calls: [{ id: '2', name: 'bash', arguments: '{"command":"echo x"}' }], agent: a1, signal: new AbortController().signal })
assert.equal(bash.results[0].result.isError, true)
const cua = await tools.execute({ calls: [{ id: '2b', name: 'cua', arguments: '{}' }], agent: a1, signal: new AbortController().signal })
assert.equal(cua.results[0].result.isError, true)
console.log('PASS MCP works and bash is denied')

const inside = await tools.execute({ calls: [{ id: '3', name: 'read', arguments: JSON.stringify({ file_path: join(cwd, 'inside.txt') }) }], agent: a1, signal: new AbortController().signal })
assert.equal(inside.results[0].result.isError, false)
const granted = await tools.execute({ calls: [{ id: '4', name: 'read', arguments: JSON.stringify({ file_path: join(grant, 'granted.txt') }) }], agent: a1, signal: new AbortController().signal })
assert.equal(granted.results[0].result.isError, false)
const secret = await tools.execute({ calls: [{ id: '5', name: 'read', arguments: JSON.stringify({ file_path: join(outside, 'secret.txt') }) }], agent: a1, signal: new AbortController().signal })
assert.equal(secret.results[0].result.isError, true)
console.log('PASS reads confined to workspace and grants')

const policy = ctx.get('sandboxPolicy')
assert.equal(policy.resolve({ session: a1.session }).mode, 'workspace-write')
assert.ok(policy.resolve({ session: a1.session }).additionalWritableRoots.includes(grant))
assert.equal(policy.resolve({ session: a2.session }).mode, 'danger-full-access')
console.log('PASS policy wrapper')

function request(method, url, body) {
  const chunks = body === undefined ? [] : [Buffer.from(JSON.stringify(body))]
  const stream = Readable.from(chunks)
  stream.method = method
  stream.url = url
  stream.headers = { 'x-dsh-sandbox': '1' }
  return stream
}
import { Readable } from 'node:stream'
function response() {
  return { status: 0, payload: undefined, writeHead(status) { this.status = status }, end(text) { this.payload = JSON.parse(text) } }
}
const child = await makeAgent('child', a1)
agents.push(child)
ctx.emit('agent/created', { agent: child })
await sleep(50)
assert.ok(tools.selectExecutor(child))
assert.equal(tools.definitions(child).some((d) => d.name === 'bash'), false)
console.log('PASS child inheritance')

const off = response()
routeHandler(request('POST', '/dsh-sandbox/state', { sessionId: 'a1', enabled: false }), off)
await sleep(100)
assert.equal(off.status, 200)
assert.equal(tools.definitions(a1).some((d) => d.name === 'bash'), true)
assert.equal(tools.selectExecutor(a1), fakePtc)
console.log('PASS disabling restores the root executor')

console.log('LIVE SANDBOX CHECKS PASSED')
