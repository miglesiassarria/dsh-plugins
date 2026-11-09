/**
 * Render check for the workspace context client half.
 *
 * Runs `client.js` inside a VM with a minimal React-compatible renderer. It
 * exercises the Workspace menu action, the configuration dialog, the `+` menu
 * folder command, and the Session context rail against a stubbed Host route.
 *
 * Usage: node test/render-check.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const here = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(join(here, '..', 'client.js'), 'utf8')

const loaderCalls = []
const collected = []
const pendingEffects = []
const effectKeys = new Set()
const stateStore = new Map()
const refStore = new Map()
const fetchCalls = []
let hooksIndex = 0
let currentPath = ''
let dirty = false

const React = {
  createElement(type, props, ...children) {
    const flat = children.flat(Infinity).filter(child => child !== undefined)
    const nextProps = { ...(props || {}) }
    if (flat.length > 0) nextProps.children = flat
    return { type, props: nextProps }
  },
  useState(initial) {
    const key = `${currentPath}#${hooksIndex++}`
    if (!stateStore.has(key)) stateStore.set(key, typeof initial === 'function' ? initial() : initial)
    return [stateStore.get(key), (next) => {
      const value = typeof next === 'function' ? next(stateStore.get(key)) : next
      if (!Object.is(value, stateStore.get(key))) {
        stateStore.set(key, value)
        dirty = true
      }
    }]
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
    const rendered = node.type(node.props ?? {})
    currentPath = previousPath
    renderNode(rendered, path, output)
    return
  }
  throw new Error(`unsupported element type: ${String(node.type)}`)
}

let overlayComponent = null
let dockComponent = null

/** Build a stubbed Host response. */
function response(data, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => (ok ? { ok: true, data } : { ok: false, ...data }),
  }
}

const workspaceState = {
  workspace: { workspaceId: 'ws-1', title: 'Docs project', path: '/tmp/project' },
  config: {
    description: 'Product documentation workspace.',
    systemPrompt: 'Prefer TypeScript.',
    entries: [
      { id: 'folder-1', kind: 'folder', name: 'project', path: '/tmp/project' },
    ],
  },
}

const folderPicker = { value: '/tmp/context-folder' }

const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  TextDecoder,
  Uint8Array,
  fetch: async (url, options = {}) => {
    fetchCalls.push({ url: String(url), options })
    if (String(url).startsWith('/dsh-workspace-context/state')) return response(workspaceState)
    if (String(url).startsWith('/dsh-workspace-context/session?sessionId=s1')) {
      return response({ entries: [{ id: 'session-folder-1', kind: 'folder', name: 'notes', path: '/tmp/notes' }] })
    }
    if (String(url).endsWith('/session/entries')) return response({ entries: [] })
    if (String(url).endsWith('/session/entries/remove')) return response({ entries: [] })
    if (String(url).endsWith('/workspace')) return response({ config: workspaceState.config })
    return response({})
  },
  window: {},
}
sandbox.window.__ModuleLoader__ = { load: (definition) => loaderCalls.push(definition) }
vm.createContext(sandbox)
vm.runInContext(source, sandbox)

if (loaderCalls.length !== 1) throw new Error(`expected one module registration, got ${loaderCalls.length}`)
const moduleDefinition = loaderCalls[0]
if (moduleDefinition.id !== '@local/workspace-context') throw new Error(`unexpected module id ${moduleDefinition.id}`)

const plugin = moduleDefinition.factory((name) => {
  if (name === 'react') return React
  throw new Error(`unexpected module import: ${name}`)
})

const registrations = []
const dicts = new Map()
const menuRegistrations = []
const commandRegistrations = []
const notices = []

const fakeContext = {
  locale: {
    register(namespace, dictionaries) {
      dicts.set(namespace, dictionaries)
      return () => dicts.delete(namespace)
    },
    bind(namespace) {
      const dictionaries = dicts.get(namespace) ?? {}
      const table = dictionaries.es ?? dictionaries.en ?? {}
      return (key, params) => {
        const template = table[key] ?? key
        if (params === undefined) return template
        return template.replace(/\{(\w+)\}/gu, (match, name) => (name in params ? String(params[name]) : match))
      }
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
  contextMenus: {
    register(options) {
      menuRegistrations.push(options)
      return () => {}
    },
    notify(text, success) {
      notices.push({ text, success })
    },
  },
  commandUi: {
    register(contribution) {
      commandRegistrations.push(contribution)
      return () => {}
    },
  },
  uiWorkspace: {
    async pickDirectory() {
      return folderPicker.value
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

// ---- Registration inventory --------------------------------------------------
const menu = menuRegistrations.find(entry => entry.id === 'workspace-context.configure')
if (menu === undefined) throw new Error('the plugin registered no workspace context menu action')
if (menu.target !== 'workspace') throw new Error(`unexpected menu target ${menu.target}`)
if (menu.order !== 150) throw new Error(`unexpected menu order ${menu.order}`)

overlayComponent = registrations.find(entry => entry.options.name === 'shell.overlay')?.component
dockComponent = registrations.find(entry => entry.options.name === 'conversation.input.dock')?.component
const iconRegistration = registrations.find(entry => entry.options.name === 'contextMenu.icon')
if (overlayComponent === undefined) throw new Error('the plugin registered no shell.overlay dialog')
if (dockComponent === undefined) throw new Error('the plugin registered no conversation.input.dock rail')
if (iconRegistration === undefined || iconRegistration.options.key !== 'workspace-context.settings') {
  throw new Error('the plugin registered no context menu icon')
}
const folderCommand = commandRegistrations.find(entry => entry.name === 'folder')
if (folderCommand === undefined) throw new Error('the plugin registered no folder command')
if (folderCommand.label() !== 'Carpeta') throw new Error(`unexpected folder label ${folderCommand.label()}`)

// ---- Dialog ------------------------------------------------------------------
let output = []
let text = ''

/** Render the overlay. */
function renderOverlay() {
  collected.length = 0
  output = []
  renderNode(React.createElement(overlayComponent, {}), 'overlay', output)
  return output.join(' | ')
}

/** Flush pending effects, await their promises, and re-render. */
async function settleOverlay() {
  text = renderOverlay()
  for (let pass = 0; pass < 6; pass += 1) {
    const effects = pendingEffects.filter(entry => !effectKeys.has(entry.key))
    if (effects.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 0))
      if (!dirty) break
    }
    for (const entry of effects) {
      effectKeys.add(entry.key)
      entry.fn()
    }
    pendingEffects.length = 0
    await new Promise(resolve => setTimeout(resolve, 0))
    dirty = false
    text = renderOverlay()
  }
  return text
}

const menuActions = menu.resolve({ workspaceId: 'ws-1', path: '/tmp/project', displayTitle: 'Docs project' })
if (menuActions.length !== 1) throw new Error(`expected one workspace action, got ${menuActions.length}`)
if (menuActions[0].label !== 'Configurar espacio') throw new Error(`unexpected menu label ${menuActions[0].label}`)
menuActions[0].run()
text = await settleOverlay()

for (const fragment of [
  'Configurar espacio',
  'Espacio de trabajo',
  'Docs project',
  '/tmp/project',
  'Descripción',
  'Prompt del sistema',
  'Archivos y carpetas de contexto',
  'Añadir carpeta',
  'Añadir archivos',
  'Cancelar',
  'Guardar',
]) {
  if (!text.includes(fragment)) {
    console.error('Rendered dialog:\n' + text)
    throw new Error(`dialog is missing ${fragment}`)
  }
}

const textareas = collected.filter(node => node.props?.className === 'wsc-textarea')
if (textareas.length !== 2) throw new Error(`expected two textareas, got ${textareas.length}`)
textareas[0].props.onChange({ target: { value: 'Updated description' } })
textareas[1].props.onChange({ target: { value: 'Updated system prompt' } })
text = renderOverlay()

// Add one text file through the file input.
const fileInput = collected.find(node => node.type === 'input' && node.props?.type === 'file')
if (fileInput === undefined) throw new Error('the dialog rendered no file input')
const bytes = new TextEncoder().encode('# Notes\n\nNew context.\n')
await fileInput.props.onChange({
  target: {
    files: [{ name: 'notes.md', size: bytes.length, arrayBuffer: async () => bytes.buffer }],
    value: '',
  },
})
await new Promise(resolve => setTimeout(resolve, 0))
text = renderOverlay()
if (!text.includes('notes.md')) throw new Error('the added file did not appear in the entry list')

const form = collected.find(node => node.type === 'form' && node.props?.className === 'wsc-dialog')
if (form === undefined) throw new Error('the dialog rendered no form')
await form.props.onSubmit({ preventDefault() {} })
await new Promise(resolve => setTimeout(resolve, 0))

const saveCall = fetchCalls.find(call => call.url.endsWith('/workspace') && call.options.method === 'POST')
if (saveCall === undefined) throw new Error('saving the dialog sent no POST')
const saveBody = JSON.parse(saveCall.options.body)
if (saveBody.description !== 'Updated description') throw new Error(`unexpected description ${saveBody.description}`)
if (saveBody.systemPrompt !== 'Updated system prompt') throw new Error(`unexpected prompt ${saveBody.systemPrompt}`)
if (!saveBody.entries.some(entry => entry.kind === 'file' && entry.name === 'notes.md' && entry.text.includes('New context'))) {
  throw new Error('the saved entries did not carry the added file text')
}
if (!notices.some(notice => notice.text === 'Espacio guardado.' && notice.success === true)) {
  throw new Error('saving the dialog showed no success notice')
}

// ---- Session dock ------------------------------------------------------------
/** Render the dock and flush its fetch. */
async function renderDock() {
  collected.length = 0
  output = []
  renderNode(React.createElement(dockComponent, { sessionId: 's1' }), 'dock', output)
  for (let pass = 0; pass < 4; pass += 1) {
    const effects = pendingEffects.filter(entry => !effectKeys.has(entry.key))
    if (effects.length === 0) break
    for (const entry of effects) {
      effectKeys.add(entry.key)
      entry.fn()
    }
    pendingEffects.length = 0
    await new Promise(resolve => setTimeout(resolve, 0))
    collected.length = 0
    output = []
    renderNode(React.createElement(dockComponent, { sessionId: 's1' }), 'dock', output)
  }
  return output.join(' | ')
}

text = await renderDock()
if (!text.includes('Contexto de sesión')) throw new Error(`dock missing label: ${text}`)
if (!text.includes('notes')) throw new Error(`dock missing folder chip: ${text}`)
const chip = collected.find(node => node.props?.className === 'wsc-chip')
if (chip === undefined) throw new Error('the dock rendered no chip')
const removeButton = collected.find(node => node.props?.className === 'wsc-chip-remove')
if (removeButton === undefined) throw new Error('the chip rendered no remove button')
removeButton.props.onClick()
await new Promise(resolve => setTimeout(resolve, 0))
const removeCall = fetchCalls.find(call => call.url.endsWith('/session/entries/remove') && call.options.method === 'POST')
if (removeCall === undefined) throw new Error('removing the chip sent no POST')
const removeBody = JSON.parse(removeCall.options.body)
if (removeBody.sessionId !== 's1' || removeBody.entryId !== 'session-folder-1') {
  throw new Error(`unexpected remove body ${removeCall.options.body}`)
}

// ---- "+" menu folder command -------------------------------------------------
await folderCommand.ui.run({ sessionId: 's2' })
await new Promise(resolve => setTimeout(resolve, 0))
const addCall = fetchCalls.find(call => call.url.endsWith('/session/entries') && call.options.method === 'POST')
if (addCall === undefined) throw new Error('the folder command sent no POST')
const addBody = JSON.parse(addCall.options.body)
if (addBody.sessionId !== 's2' || addBody.path !== '/tmp/context-folder') {
  throw new Error(`unexpected folder command body ${addCall.options.body}`)
}
if (!notices.some(notice => notice.text.includes('context-folder') && notice.success === true)) {
  throw new Error('the folder command showed no success notice')
}

console.log('render check passed:', {
  dialogEntries: saveBody.entries.length,
  dock: 'ok',
  command: folderCommand.name,
})
