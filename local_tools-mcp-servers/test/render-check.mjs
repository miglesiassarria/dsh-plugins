/**
 * Render check for the Tools settings page.
 *
 * Runs `client.js` inside a VM with a minimal React-compatible renderer, so the
 * component tree is actually executed: hooks, effects, state updates, and the
 * populated list produced by the stubbed settings route.
 *
 * Usage: node test/render-check.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import vm from 'node:vm'

const here = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(join(here, '..', 'client.js'), 'utf8')

const loaderCalls = []

const SERVERS = [
  {
    id: 'demo',
    name: 'Demo',
    slug: 'Demo',
    transport: 'stdio',
    command: 'node',
    args: ['/tmp/demo-mcp-server.mjs'],
    env: {},
    url: '',
    auth: 'none',
    hasToken: false,
    autoConnect: true,
    status: 'connected',
    protocolVersion: '2025-06-18',
    serverInfo: { name: 'dsh-demo-tools', version: '1.0.0' },
    toolCount: 3,
    permissions: {},
    tools: [
      { name: 'echo', description: 'Echoes back the provided text.', readOnly: false, destructive: false },
      { name: 'add', description: 'Adds two numbers and returns the sum.', readOnly: false, destructive: false },
      { name: 'server_info', description: 'Reports the host process facts.', readOnly: true, destructive: false },
    ],
    error: undefined,
    target: 'node /tmp/demo-mcp-server.mjs',
  },
  {
    id: 'grafana',
    name: 'Grafana',
    slug: 'Grafana',
    transport: 'http',
    command: '',
    args: [],
    env: {},
    url: 'http://localhost:3000/mcp',
    auth: 'none',
    hasToken: false,
    autoConnect: false,
    status: 'error',
    protocolVersion: undefined,
    serverInfo: undefined,
    toolCount: 0,
    permissions: {},
    tools: [],
    error: 'El servidor respondió 401',
    target: 'http://localhost:3000/mcp',
  },
]

const collected = []
const fetchCalls = []
let pendingEffects = []
let effectKeys = new Set()
let rendering = false
let dirty = false
const stateStore = new Map()
const refStore = new Map()
let hooksIndex = 0
let currentPath = ''

const React = {
  createElement(type, props, ...children) {
    const flat = children.flat(Infinity).filter(child => child !== undefined)
    const nextProps = { ...(props || {}) }
    if (flat.length > 0) nextProps.children = flat
    return { type, props: nextProps }
  },
  useState(initial) {
    const key = `${currentPath}#${hooksIndex++}`
    if (!stateStore.has(key)) {
      stateStore.set(key, typeof initial === 'function' ? initial() : initial)
    }
    return [stateStore.get(key), (next) => {
      const value = typeof next === 'function' ? next(stateStore.get(key)) : next
      if (!Object.is(value, stateStore.get(key))) {
        stateStore.set(key, value)
        dirty = true
      }
    }]
  },
  useCallback(fn) {
    hooksIndex += 1
    return fn
  },
  useEffect(fn) {
    const key = `${currentPath}#${hooksIndex++}`
    pendingEffects.push({ key, fn })
  },
  useRef(initial) {
    const key = `${currentPath}#${hooksIndex++}`
    if (!refStore.has(key)) refStore.set(key, { current: initial })
    return refStore.get(key)
  },
  Component: class Component {
    constructor(props) {
      this.props = props
      this.state = {}
    }
    setState(update) {
      this.state = { ...this.state, ...(typeof update === 'function' ? update(this.state) : update) }
      dirty = true
    }
  },
}

/** Render one element tree to text, executing function components. */
function renderNode(node, path, output) {
  if (node === null || node === undefined || node === false || node === true) return
  if (typeof node === 'string' || typeof node === 'number') {
    output.push(String(node))
    return
  }
  if (Array.isArray(node)) {
    node.forEach((child, index) => renderNode(child, `${path}.${String(index)}`, output))
    return
  }
  if (typeof node !== 'object' || node.type === undefined) return
  if (node.type === 'style') return
  collected.push(node)
  if (typeof node.type === 'string') {
    const children = node.props?.children ?? []
    const list = Array.isArray(children) ? children : [children]
    list.forEach((child, index) => renderNode(child, `${path}.${String(index)}`, output))
    return
  }
  if (typeof node.type === 'function') {
    const previousPath = currentPath
    currentPath = path
    hooksIndex = 0
    let rendered
    if (node.type.prototype && typeof node.type.prototype.render === 'function') {
      const instance = new node.type(node.props)
      rendered = instance.render()
    } else {
      rendered = node.type(node.props ?? {})
    }
    currentPath = previousPath
    renderNode(rendered, path, output)
    return
  }
  throw new Error(`unsupported element type: ${String(node.type)}`)
}

const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  setInterval: () => 1,
  clearInterval: () => {},
  document: { hidden: true },
  fetch: async (url, options) => {
    fetchCalls.push({ url, options })
    let servers = SERVERS
    if (typeof url === 'string' && url.endsWith('/permissions') && options && options.body !== undefined) {
      const sent = JSON.parse(options.body).permissions
      const id = decodeURIComponent(url.split('/servers/')[1].split('/permissions')[0])
      servers = SERVERS.map((server) => (server.id === id ? { ...server, permissions: sent } : server))
    }
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true, data: { servers } }),
    }
  },
  window: {},
}
sandbox.window.__ModuleLoader__ = { load: (definition) => loaderCalls.push(definition) }
vm.createContext(sandbox)
vm.runInContext(source, sandbox)
if (loaderCalls.length !== 1) throw new Error(`expected one module registration, got ${loaderCalls.length}`)

const moduleDefinition = loaderCalls[0]
if (moduleDefinition.id !== '@local/tools-mcp-servers') throw new Error(`unexpected module id ${moduleDefinition.id}`)

const plugin = moduleDefinition.factory(name => {
  if (name === 'react') return React
  throw new Error(`unexpected module import: ${name}`)
})

const registrations = []
const dicts = new Map()
const fakeContext = {
  locale: {
    register(namespace, dictionaries) {
      dicts.set(namespace, dictionaries)
      return () => dicts.delete(namespace)
    },
    bind(namespace) {
      const dictionaries = dicts.get(namespace) ?? {}
      const table = dictionaries.es ?? dictionaries.en ?? {}
      return key => table[key] ?? key
    },
  },
  slots: {
    inject(key, callback) {
      callback()
      return () => {}
    },
    register(options, component) {
      registrations.push({ options, component })
      return () => {}
    },
  },
  effect(callback) {
    const dispose = callback()
    return () => {
      if (typeof dispose === 'function') dispose()
    }
  },
}

plugin.apply(fakeContext)

const section = registrations.find(entry => entry.options.name === 'settings.section')
const icon = registrations.find(entry => entry.options.name === 'settings.section.icon')
if (section === undefined) throw new Error('the plugin registered no settings.section')
if (icon === undefined) throw new Error('the plugin registered no settings.section.icon')
if (section.options.id !== 'tools') throw new Error(`unexpected section id ${section.options.id}`)
if (section.options.label() !== 'Herramientas') throw new Error(`unexpected nav label ${section.options.label()}`)

let output = []
let text = ''

/** Render the section and return its text content. */
function render() {
  collected.length = 0
  output = []
  renderNode(React.createElement(section.component, {}), 'root', output)
  return output.join(' | ')
}

text = render()

// Flush effects (the initial data read), then render the updated tree.
for (let pass = 0; pass < 4; pass += 1) {
  const effects = pendingEffects.filter(entry => !effectKeys.has(entry.key))
  if (effects.length === 0) break
  for (const entry of effects) {
    effectKeys.add(entry.key)
    entry.fn()
  }
  pendingEffects = pendingEffects.filter(entry => !effectKeys.has(entry.key))
  await new Promise(resolve => setTimeout(resolve, 0))
  text = render()
}

const expected = [
  'Servidores de herramientas',
  'Da a tus agentes capacidades extra mediante servidores MCP.',
  'Demo',
  'MCP 2025-06-18',
  'Conectado · 3 herramientas',
  'node /tmp/demo-mcp-server.mjs',
  'echo',
  'add',
  'server_info',
  'Grafana',
  'Error',
  'El servidor respondió 401',
  'Añadir',
]

const missing = expected.filter(fragment => !text.includes(fragment))
if (missing.length > 0) {
  console.error('Rendered text:\n' + text)
  throw new Error(`missing rendered fragments: ${missing.join(', ')}`)
}

// Exercise the add form: open it, fill it, and submit it.
const addButton = collected.find(node => node.props && node.props.className === 'tms-add')
if (addButton === undefined) throw new Error('the list view rendered no Add button')
addButton.props.onClick()
let formText = render()
for (const fragment of ['Nuevo servidor', 'Nombre', 'Transporte', 'Comando', 'Argumentos', 'Entorno', 'Conectar al iniciar']) {
  if (!formText.includes(fragment)) throw new Error(`form is missing ${fragment}`)
}

const byPlaceholder = value => collected.find(node => node.props && node.props.placeholder === value)
const nameInput = byPlaceholder('p. ej. Filesystem')
const commandInput = byPlaceholder('p. ej. npx')
const argsInput = byPlaceholder('-y @modelcontextprotocol/server-filesystem /ruta')
if (nameInput === undefined || commandInput === undefined || argsInput === undefined) {
  throw new Error('the form did not render the expected inputs')
}
nameInput.props.onChange({ target: { value: 'Filesystem' } })
commandInput.props.onChange({ target: { value: 'npx' } })
argsInput.props.onChange({ target: { value: '-y @modelcontextprotocol/server-filesystem /tmp' } })
formText = render()

const form = collected.find(node => node.type === 'form')
if (form === undefined) throw new Error('the form element was not rendered')
await form.props.onSubmit({ preventDefault() {} })
await new Promise(resolve => setTimeout(resolve, 0))
text = render()

const post = fetchCalls.find(call => call.options && call.options.method === 'POST')
if (post === undefined) throw new Error('submitting the form sent no POST')
if (post.url !== '/dsh-tools-mcp/servers') throw new Error(`unexpected POST url ${post.url}`)
const body = JSON.parse(post.options.body)
if (body.name !== 'Filesystem' || body.command !== 'npx' || body.transport !== 'stdio') {
  throw new Error(`unexpected POST body ${post.options.body}`)
}
if (body.args !== '-y @modelcontextprotocol/server-filesystem /tmp') {
  throw new Error(`unexpected arguments ${JSON.stringify(body.args)}`)
}
if (body.autoConnect !== true) throw new Error('autoConnect was not forwarded')
if (!text.includes('Servidores de herramientas')) throw new Error('the form did not return to the list after saving')

console.log('form check passed:', post.options.body)

/** Re-render after an interaction settled its state update. */
async function settle() {
  await new Promise(resolve => setTimeout(resolve, 0))
  return render()
}

/** Find one collected element by predicate. */
function findNode(predicate) {
  const found = collected.find(predicate)
  if (found === undefined) throw new Error('expected element was not rendered')
  return found
}

// ---- Reveal values -------------------------------------------------------
const addAgain = findNode(node => node.props && node.props.className === 'tms-add')
addAgain.props.onClick()
render()
const addVar = findNode(node => node.props && node.props.className === 'tms-pill'
  && Array.isArray(node.props.children) && node.props.children.includes('Añadir variable'))
addVar.props.onClick()
render()
let envValue = findNode(node => node.type === 'input' && String(node.props.className).includes('tms-envvalue'))
if (envValue.props.type !== 'password') throw new Error('environment values must start masked')
const reveal = findNode(node => node.props && node.props.className === 'tms-reveal')
if (!String(reveal.props.children).length) throw new Error('the reveal button rendered no label')
reveal.props.onClick()
let formAfterReveal = render()
envValue = findNode(node => node.type === 'input' && String(node.props.className).includes('tms-envvalue'))
if (envValue.props.type !== 'text') throw new Error('reveal did not unmask environment values')
if (!formAfterReveal.includes('Ocultar valores')) throw new Error('the reveal toggle did not flip its label')
const cancelButton = findNode(node => node.props && node.props.className === 'tms-btn tms-btn-ghost'
  && Array.isArray(node.props.children) && node.props.children.includes('Cancelar'))
cancelButton.props.onClick()
await settle()

// ---- Tool permissions ----------------------------------------------------
const namelink = findNode(node => node.props && node.props.className === 'tms-namelink')
namelink.props.onClick()
const permissionText = render()
for (const fragment of ['Permisos de herramientas', 'Herramientas de solo lectura', 'Herramientas de escritura/eliminación', 'Otras herramientas', 'Echo', 'Server info', 'Permitir siempre']) {
  if (!permissionText.includes(fragment)) throw new Error(`permissions view is missing ${fragment}`)
}

const echoGroup = findNode(node => node.props && node.props.role === 'radiogroup' && node.props['aria-label'] === 'Echo')
if (echoGroup.props.children.length !== 3) throw new Error('the permission control must offer three choices')
echoGroup.props.children[2].props.onClick()
await settle()
const denyCall = fetchCalls.find(call => call.options && call.options.method === 'PUT' && String(call.url).endsWith('/permissions'))
if (denyCall === undefined) throw new Error('changing a tool permission sent no PUT')
let permissionBody = JSON.parse(denyCall.options.body)
if (permissionBody.permissions.echo !== 'deny') throw new Error(`unexpected permission body ${denyCall.options.body}`)

const echoGroupAfter = findNode(node => node.props && node.props.role === 'radiogroup' && node.props['aria-label'] === 'Echo')
if (!String(echoGroupAfter.props.children[2].props.className).includes('is-active')) {
  throw new Error('the denied choice is not marked active')
}

const groupSelect = findNode(node => node.props && node.props.className === 'tms-groupsel')
groupSelect.props.onChange({ target: { value: 'ask' } })
await settle()
const groupCall = fetchCalls.filter(call => call.options && call.options.method === 'PUT' && String(call.url).endsWith('/permissions')).at(-1)
permissionBody = JSON.parse(groupCall.options.body)
if (permissionBody.permissions.server_info !== 'ask') throw new Error(`the block choice missed its tools: ${groupCall.options.body}`)

const backLink = findNode(node => node.props && node.props.className === 'tms-backlink')
backLink.props.onClick()
const backText = await settle()
if (!backText.includes('Servidores de herramientas')) throw new Error('the back link did not return to the list')

console.log('reveal + permissions checks passed')

console.log('render check passed')
console.log('sections:', registrations.map(entry => `${entry.options.name}:${entry.options.id}`).join(', '))
console.log('rendered fragments:', text.slice(0, 600))
