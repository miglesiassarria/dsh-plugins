/**
 * Render check for the Backups settings page.
 *
 * Runs `client.js` inside a VM with a minimal React-compatible renderer, so the
 * component tree is actually executed: hooks, effects, state updates and the
 * requests the page makes to the Host route.
 *
 * Usage: node test/render-check.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import vm from 'node:vm'

const here = fileURLToPath(new URL('.', import.meta.url))
const source = readFileSync(join(here, '..', 'client.js'), 'utf8')

const loaderCalls = []

const STATUS = {
  destination: '/Users/demo/Documents/DeepSeek Harness/Backups',
  sessions: { count: 9, bytes: 2831155, workspaces: 1 },
  configuration: { files: 4, plugins: ['@local/tools-mcp-servers'], bytes: 2048 },
  backups: [{ name: 'dsh-backup-2026-11-08-190000.zip', bytes: 3891200, createdAt: '2026-11-08T18:00:00.000Z' }],
}

const CREATED = {
  name: 'dsh-backup-2026-11-08-201500.zip',
  path: '/Users/demo/Documents/DeepSeek Harness/Backups/dsh-backup-2026-11-08-201500.zip',
  bytes: 3891200,
  createdAt: '2026-11-08T19:15:00.000Z',
  parts: { sessions: { sessionCount: 9, workspaces: [] }, configuration: { plugins: [], files: 4, stores: [] } },
}

const SUMMARY = {
  createdAt: '2026-11-07T10:00:00.000Z',
  app: { profile: 'desktop', platform: 'darwin' },
  parts: {
    sessions: { sessionCount: 9, workspaces: [{ title: 'default-workspace', path: '/demo', count: 9 }], bytes: 100 },
    configuration: { plugins: ['@local/tools-mcp-servers'], files: 4, stores: ['mcp-tools/servers.json'], bytes: 100 },
  },
}

const RESTORED = {
  summary: {
    sessions: { written: 9, unchanged: 0, conflicts: 0, grouped: 8, ungrouped: 1, archived: 0 },
    configuration: { files: 4, plugins: 1, stores: 1, requiresRestart: true },
  },
  warnings: [],
}

let brokenFile = null

const collected = []
const fetchCalls = []
let pendingEffects = []
let effectKeys = new Set()
let dirty = false
const stateStore = new Map()
const refStore = new Map()
let hooksIndex = 0
let currentPath = ''

const React = {
  createElement(type, props, ...children) {
    const flat = children.flat(Infinity).filter(child => child !== undefined && child !== null)
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
  document: { hidden: true },
  fetch: async (url, options) => {
    fetchCalls.push({ url, options })
    const isJson = Boolean(options && options.headers && options.headers['content-type'] === 'application/json')
    const body = isJson && options.body ? JSON.parse(options.body) : undefined
    if (url === '/dsh-backups' && options && options.method === 'GET') {
      return { ok: true, status: 200, text: async () => JSON.stringify({ ok: true, data: STATUS }) }
    }
    if (url === '/dsh-backups/create') {
      return { ok: true, status: 200, text: async () => JSON.stringify({ ok: true, data: CREATED }) }
    }
    if (url === '/dsh-backups/inspect') {
      if (options.body === brokenFile) {
        return { ok: false, status: 400, text: async () => JSON.stringify({ ok: false, code: 'invalid-backup', error: 'bad file' }) }
      }
      return { ok: true, status: 200, text: async () => JSON.stringify({ ok: true, data: SUMMARY }) }
    }
    if (url === '/dsh-backups/open') {
      return { ok: true, status: 200, text: async () => JSON.stringify({ ok: true, data: { path: STATUS.destination, command: 'open' } }) }
    }
    if (String(url).startsWith('/dsh-backups/restore')) {
      return { ok: true, status: 200, text: async () => JSON.stringify({ ok: true, data: RESTORED }) }
    }
    return { ok: false, status: 404, text: async () => JSON.stringify({ ok: false, code: 'unknown', error: 'unknown route' }) }
  },
  window: {},
}
sandbox.window.__ModuleLoader__ = { load: (definition) => loaderCalls.push(definition) }
vm.createContext(sandbox)
vm.runInContext(source, sandbox)
if (loaderCalls.length !== 1) throw new Error(`expected one module registration, got ${loaderCalls.length}`)

const moduleDefinition = loaderCalls[0]
if (moduleDefinition.id !== '@local/dsh-backups') throw new Error(`unexpected module id ${moduleDefinition.id}`)

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
if (section.options.id !== 'backups') throw new Error(`unexpected section id ${section.options.id}`)
if (section.options.label() !== 'Copias de seguridad') throw new Error(`unexpected nav label ${section.options.label()}`)

let output = []
let text = ''

/** Render the section and return its text content. */
function render() {
  collected.length = 0
  output = []
  renderNode(React.createElement(section.component, {}), 'root', output)
  return output.join(' | ')
}

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

/** Find a button by its visible label. */
function findButton(label) {
  return findNode(node => node.type === 'button' && node.props
    && String(node.props.children ?? '').includes(label)
    && String(node.props.className || '').includes('bkp-btn'))
}

text = render()

for (let pass = 0; pass < 6; pass += 1) {
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
  'Copias de seguridad',
  'Guarda tu configuración, tus plugins y tus chats',
  'Crear copia de seguridad',
  'Chats y sesiones',
  'Configuración y plugins',
  '9 sesiones',
  '2.7 MB',
  '4 archivos de configuración',
  'Copiar ruta',
  'Restaurar copia de seguridad',
  'Elegir archivo',
  'Copias en este ordenador',
  'dsh-backup-2026-11-08-190000.zip',
  'Restaurar',
]
const missing = expected.filter(fragment => !text.includes(fragment))
if (missing.length > 0) {
  console.error('Rendered text:\n' + text)
  throw new Error(`missing rendered fragments: ${missing.join(', ')}`)
}

// Both parts start selected.
const checkboxes = collected.filter(node => node.type === 'input' && node.props.type === 'checkbox')
if (checkboxes.length !== 2) throw new Error(`expected two part checkboxes on create, got ${checkboxes.length}`)
if (!checkboxes.every(node => node.props.checked === true)) throw new Error('both parts must start preselected')

// ---- Open folder ---------------------------------------------------------
await findButton('Abrir carpeta').props.onClick()
await settle()
const openCall = fetchCalls.find(call => call.url === '/dsh-backups/open')
if (openCall === undefined) throw new Error('the open folder button called no route')
if (openCall.options.method !== 'POST') throw new Error('the open folder action must POST')

// ---- Create --------------------------------------------------------------
await findButton('Crear copia de seguridad').props.onClick()
text = await settle()
let createCall = fetchCalls.find(call => call.url === '/dsh-backups/create')
if (createCall === undefined) throw new Error('the create action called no route')
const createBody = JSON.parse(createCall.options.body)
if (createBody.sessions !== true || createBody.configuration !== true) {
  throw new Error(`unexpected create body ${createCall.options.body}`)
}
if (!text.includes('Copia creada')) throw new Error('the created banner did not render')
if (!text.includes('dsh-backup-2026-11-08-201500.zip')) throw new Error('the created file name did not render')

// Unchecking the chats keeps the same request shape.
const sessionsBox = collected.find(node => node.type === 'input' && node.props.id === 'bkp-part-sessions')
sessionsBox.props.onChange()
render()
createCall = fetchCalls.filter(call => call.url === '/dsh-backups/create').at(-1)
await findButton('Crear copia de seguridad').props.onClick()
await settle()
const secondBody = JSON.parse(fetchCalls.filter(call => call.url === '/dsh-backups/create').at(-1).options.body)
if (secondBody.sessions !== false) throw new Error('the chats checkbox was not forwarded')
if (secondBody.configuration !== true) throw new Error('the configuration checkbox was lost')
// Put it back for the restore flow.
const sessionsBoxAgain = collected.find(node => node.type === 'input' && node.props.id === 'bkp-part-sessions')
sessionsBoxAgain.props.onChange()
render()

// ---- Pick a file ---------------------------------------------------------
const fileInput = findNode(node => node.type === 'input' && node.props.type === 'file')
const fakeFile = { name: 'dsh-backup-2026-11-07-100000.zip' }
await fileInput.props.onChange({ target: { value: 'C:\\fakepath\\dsh-backup.zip', files: [fakeFile] } })
text = await settle()

if (!text.includes('dsh-backup-2026-11-07-100000.zip')) throw new Error('the selected file name did not render')
if (!text.includes('Esta copia contiene')) throw new Error('the backup summary did not render')
if (!text.includes('9 sesiones · 1 espacio de trabajo')) throw new Error('the summary did not report its sessions')
if (!text.includes('1 plugin')) throw new Error('the summary did not report its plugins')
const restoreBoxes = collected.filter(node => node.type === 'input' && node.props.type === 'checkbox'
  && String(node.props.id || '').startsWith('bkp-restore-'))
if (restoreBoxes.length !== 2 || !restoreBoxes.every(node => node.props.checked === true)) {
  throw new Error('restore parts must start preselected')
}

// ---- Restore -------------------------------------------------------------
await findButton('Restaurar copia').props.onClick()
text = await settle()
const restoreCall = fetchCalls.find(call => String(call.url).startsWith('/dsh-backups/restore'))
if (restoreCall === undefined) throw new Error('the restore action called no route')
if (restoreCall.options.body !== fakeFile) throw new Error('the restore did not forward the archive itself')
if (!String(restoreCall.url).includes('?sessions=1&configuration=1')) {
  throw new Error(`the restore did not carry its part selection: ${restoreCall.url}`)
}
for (const fragment of ['Restauración terminada', '9 sesiones restauradas', '8 agrupadas', '1 sin agrupar', '4 archivos de configuración restaurados', 'Reinicia DeepSeek Harness']) {
  if (!text.includes(fragment)) {
    console.error('Rendered text:\n' + text)
    throw new Error(`restore result is missing ${fragment}`)
  }
}

// ---- Rejections ----------------------------------------------------------
brokenFile = { name: 'broken.zip' }
await fileInput.props.onChange({ target: { value: '', files: [brokenFile] } })
text = await settle()
if (!text.includes('no es una copia de seguridad válida')) {
  console.error('Rendered text:\n' + text)
  throw new Error('an invalid backup did not surface its error')
}

// ---- Style discipline ----------------------------------------------------
const tokens = [...source.matchAll(/var\(\s*(--[\w-]+)/g)].map(match => match[1])
const foreign = [...new Set(tokens.filter(token => !token.startsWith('--dsw-alias-')))]
if (foreign.length > 0) throw new Error(`styles use non-theme tokens: ${foreign.join(', ')}`)
if (/@deepseek-ai\/dsh-client/.test(source)) throw new Error('the client imports a Harness Client package')
if (/\brequire\(['"](?!react['"])/.test(source)) throw new Error('the client requires a module other than react')

console.log('render check passed')
console.log('sections:', registrations.map(entry => `${entry.options.name}:${entry.options.id}`).join(', '))
console.log('rendered fragments:', text.slice(0, 300))
