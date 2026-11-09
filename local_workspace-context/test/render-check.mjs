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
const effectDeps = new Map()
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
  useEffect(fn, deps) {
    const key = `${currentPath}#${hooksIndex++}`
    if (deps === undefined) {
      if (effectKeys.has(key)) return
      effectKeys.add(key)
      pendingEffects.push({ key, fn })
      return
    }
    const previous = effectDeps.get(key)
    const changed = previous === undefined || previous.length !== deps.length || deps.some((value, index) => !Object.is(value, previous[index]))
    if (!changed) return
    effectDeps.set(key, deps)
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
let sidebarComponent = null

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

const clickListeners = new Set()
const selectedPanels = []
const startedSessions = []
const connectedWorkspaces = []
const openedSessions = []
const sentPrompts = []
const modelSelections = []
const agentPresetSelections = []
const permissionCommands = []
let permissionValue = 'workspace-write'
const modelSubscribers = new Set()
let modelSnapshot = {
  current: null,
  routable: null,
  groups: [{ id: 'provider-a', name: 'Provider A', models: [{ id: 'model-1', name: 'Model One' }, { id: 'model-2', name: 'Model Two' }] }],
  failures: [],
  status: 'ready',
  pending: null,
  error: null,
}
const modelDirectory = {
  store: {
    getSnapshot: () => modelSnapshot,
    subscribe(listener) {
      modelSubscribers.add(listener)
      return () => modelSubscribers.delete(listener)
    },
  },
  async load() {
    modelSnapshot = { ...modelSnapshot, status: 'ready' }
    for (const listener of modelSubscribers) listener()
    return modelSnapshot
  },
  async select(selection) {
    modelSelections.push(selection)
    modelSnapshot = { ...modelSnapshot, current: selection }
    for (const listener of modelSubscribers) listener()
    return { ok: true }
  },
}
const fakeSession = {
  getSnapshot: () => ({ openState: 'open' }),
  projections: {
    faceOf(name) {
      return name === 'permissions' ? { getSnapshot: () => ({ currentValue: permissionValue }) } : undefined
    },
  },
  async command(command) {
    permissionCommands.push(command)
    if (command.startsWith('/permission ')) permissionValue = command.slice('/permission '.length)
    return { ok: true, value: { matched: true } }
  },
}
const injectedStyles = []
const fakeDocument = {
  head: {
    appendChild(node) {
      injectedStyles.push(node)
    },
  },
  createElement(tagName) {
    return {
      tagName,
      dataset: {},
      textContent: '',
      remove() {
        const index = injectedStyles.indexOf(this)
        if (index >= 0) injectedStyles.splice(index, 1)
      },
    }
  },
  addEventListener(type, listener, capture) {
    if (type === 'click' && capture === true) clickListeners.add(listener)
  },
  removeEventListener(type, listener) {
    if (type === 'click') clickListeners.delete(listener)
  },
}

const sandbox = {
  console,
  document: fakeDocument,
  setTimeout,
  clearTimeout,
  TextDecoder,
  Uint8Array,
  fetch: async (url, options = {}) => {
    fetchCalls.push({ url: String(url), options })
    if (String(url).startsWith('/dsh-workspace-context/state')) return response(workspaceState)
    if (String(url).startsWith('/dsh-workspace-context/session/context')) {
      return response({
        workspace: { workspaceId: 'ws-1', title: 'Docs project', path: '/tmp/project' },
        workspaceEntries: [{ id: 'folder-1', kind: 'folder', name: 'project', path: '/tmp/project' }],
        sessionEntries: [{ id: 'session-folder-1', kind: 'folder', name: 'notes', path: '/tmp/notes' }],
        merged: [
          { id: 'folder-1', kind: 'folder', name: 'project', path: '/tmp/project', source: 'workspace' },
          { id: 'session-folder-1', kind: 'folder', name: 'notes', path: '/tmp/notes', source: 'session' },
        ],
      })
    }
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
const tabDefinitions = []
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
      const result = callback()
      if (result !== undefined && result !== null && typeof result.next === 'function') {
        for (const _registration of result) {
          // Consume the generator so every yielded registration runs.
        }
      }
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
    startSession(workspaceId) {
      startedSessions.push(workspaceId)
    },
    connectWorkspace(workspaceId) {
      connectedWorkspaces.push(workspaceId)
      return Promise.resolve('s9')
    },
    openSession(sessionId) {
      openedSessions.push(sessionId)
    },
  },
  sessions: {
    list: {
      getSnapshot: () => ({ byId: { s9: { projectionValues: { agentPreset: 'standard' } } } }),
    },
    binding(sessionId) {
      return sessionId === 's9' ? { session: fakeSession } : undefined
    },
    retain(sessionId) {
      if (sessionId !== 's9') throw new Error(`unexpected retain ${sessionId}`)
      return {
        session: fakeSession,
        ready: Promise.resolve(),
        release() {},
      }
    },
  },
  conversation: {
    sendSession(session, text, attachments, mode) {
      sentPrompts.push({ text, attachments, mode })
      return Promise.resolve({ kind: 'success' })
    },
  },
  modelDirectories: {
    catalog: {
      async load() {},
      store: {
        getSnapshot: () => ({
          value: {
            default: { provider: 'provider-a', model: 'model-1' },
            groups: modelSnapshot.groups,
          },
        }),
      },
    },
    directoryFor(sessionId) {
      return sessionId === 's9' ? modelDirectory : undefined
    },
  },
  remote: {
    permissionPresets: {
      async catalog() {
        return {
          ok: true,
          value: {
            options: [
              { value: 'read-only', name: 'Read only' },
              { value: 'workspace-write', name: 'Workspace write' },
              { value: 'danger-full-access', name: 'Full access' },
            ],
          },
        }
      },
    },
    agentPresets: {
      async list() {
        return {
          ok: true,
          value: {
            presets: [
              { id: 'standard', isDefault: true },
              { id: 'ptc' },
              { id: 'minimal' },
              { id: 'cordis' },
            ],
          },
        }
      },
      async select(sessionId, presetId) {
        agentPresetSelections.push({ sessionId, presetId })
        return { ok: true, value: presetId }
      },
    },
  },
  layout: {
    selectPanel(panelId) {
      selectedPanels.push(panelId)
    },
  },
  sidebarRightTabs: {
    register(definition) {
      tabDefinitions.push(definition)
      return () => {}
    },
  },
  get(name) {
    return fakeContext[name]
  },
  effect(callback) {
    const dispose = callback()
    return () => {
      if (typeof dispose === 'function') dispose()
    }
  },
}

plugin.apply(fakeContext)

const sidebarStyle = injectedStyles.find(style => style.dataset?.workspaceContext === 'sidebar-chevron')
if (sidebarStyle === undefined || !sidebarStyle.textContent.includes('order:-1') || !sidebarStyle.textContent.includes('display:inline-flex !important')) {
  throw new Error('the plugin did not inject the persistent workspace chevron style')
}

// ---- Registration inventory --------------------------------------------------
const menu = menuRegistrations.find(entry => entry.id === 'workspace-context.configure')
if (menu === undefined) throw new Error('the plugin registered no workspace context menu action')
if (menu.target !== 'workspace') throw new Error(`unexpected menu target ${menu.target}`)
if (menu.order !== 150) throw new Error(`unexpected menu order ${menu.order}`)

overlayComponent = registrations.find(entry => entry.options.name === 'shell.overlay')?.component
const guideComponent = registrations.find(entry => entry.options.name === 'sidebar.right.tab.guide.entry')?.component
const tabComponent = registrations.find(entry => entry.options.name === 'sidebar.right.pane.tab')?.component
const overviewComponent = registrations.find(entry => entry.options.name === 'main' && entry.options.key === 'workspace-overview')?.component
const settingsIcon = registrations.find(entry => entry.options.name === 'contextMenu.icon' && entry.options.key === 'workspace-context.settings')
const openIcon = registrations.find(entry => entry.options.name === 'contextMenu.icon' && entry.options.key === 'workspace-context.open')
if (overlayComponent === undefined) throw new Error('the plugin registered no shell.overlay dialog')
if (guideComponent === undefined) throw new Error('the plugin registered no right sidebar guide card')
if (tabComponent === undefined) throw new Error('the plugin registered no right sidebar Context tab')
if (overviewComponent === undefined) throw new Error('the plugin registered no workspace overview main panel')
if (tabDefinitions.length !== 1) throw new Error(`expected one tab definition, got ${tabDefinitions.length}`)
if (tabDefinitions[0].kind !== 'workspace-context') throw new Error(`unexpected tab kind ${tabDefinitions[0].kind}`)
if (tabDefinitions[0].guide?.[0]?.id !== 'context') throw new Error('the tab definition has no Context guide entry')
if (settingsIcon === undefined || openIcon === undefined) {
  throw new Error('the plugin registered no context menu icons')
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

// ---- Right Sidebar guide card and tab -----------------------------------------
const useSessions = (selector) => selector({ byId: { s1: { id: 's1', cwd: '/tmp/project' } } })
const useWorkspaces = (selector) => selector({ items: [{ workspaceId: 'ws-1', title: 'Docs project', path: '/tmp/project', sessionIds: ['s1'] }] })
const translate = (key, params) => {
  const dictionaries = dicts.get('@local/workspace-context') ?? {}
  const table = dictionaries.es ?? dictionaries.en ?? {}
  const template = table[key] ?? key
  if (params === undefined) return template
  return template.replace(/\{(\w+)\}/gu, (match, name) => (name in params ? String(params[name]) : match))
}
const openedTabs = []
const useTabInfo = () => ({ tab: { actions: { openTab(kind, options) { openedTabs.push({ kind, options }) } } } })
const overviewBySessions = {
  byId: {
    s1: { id: 's1', title: 'First chat', cwd: '/tmp/project', updatedAt: 1700000000000 },
    s2: { id: 's2', title: 'Second chat', cwd: '/tmp/project', updatedAt: 1700000100000 },
    s3: { id: 's3', title: 'Subagent chat', cwd: '/tmp/project', origin: 'subagent', updatedAt: 1700000200000 },
    s4: { id: 's4', title: 'Blank chat', cwd: '/tmp/project', blank: true, updatedAt: 1700000300000 },
  },
}
const overviewUseSessions = (selector) => selector(overviewBySessions)
const overviewUseWorkspaces = (selector) => selector({
  items: [{ workspaceId: 'ws-1', title: 'Docs project', path: '/tmp/project', sessionIds: ['s1', 's2', 's3', 's4'] }],
  archivedSessionIds: [],
})

/** Render a component and flush its effects. */
async function renderWith(component, props, path) {
  collected.length = 0
  output = []
  renderNode(React.createElement(component, props), path, output)
  for (let pass = 0; pass < 5; pass += 1) {
    const effects = pendingEffects.slice()
    if (effects.length === 0) break
    pendingEffects.length = 0
    for (const entry of effects) entry.fn()
    await new Promise(resolve => setTimeout(resolve, 0))
    collected.length = 0
    output = []
    renderNode(React.createElement(component, props), path, output)
  }
  return output.join(' | ')
}

text = await renderWith(guideComponent, {
  title: 'Contexto',
  description: 'Contexto del espacio y de la sesión',
  kind: 'workspace-context',
  sessionId: 's1',
  useTabInfo,
  useSessions,
  useWorkspaces,
  t: translate,
}, 'guide')
for (const fragment of ['Contexto', 'project', 'notes', 'espacio', 'sesión']) {
  if (!text.includes(fragment)) {
    console.error('Rendered guide: ' + text)
    throw new Error(`guide card is missing ${fragment}`)
  }
}
const guideButton = collected.find(node => node.props?.className === 'wsc-guide')
if (guideButton === undefined) throw new Error('the guide card rendered no button')
guideButton.props.onClick()
if (openedTabs.length !== 1 || openedTabs[0].kind !== 'workspace-context' || openedTabs[0].options?.replaceTab !== true) {
  throw new Error(`the guide card opened no Context tab: ${JSON.stringify(openedTabs)}`)
}

text = await renderWith(tabComponent, { sessionId: 's1', useSessions, useWorkspaces, t: translate }, 'tab')
for (const fragment of ['Contexto', 'Docs project', 'project', 'notes', 'Sesión']) {
  if (!text.includes(fragment)) {
    console.error('Rendered tab: ' + text)
    throw new Error(`context tab is missing ${fragment}`)
  }
}
const removeButton = collected.find(node => node.props?.className === 'wsc-side-remove')
if (removeButton === undefined) throw new Error('the Context tab rendered no remove button')
removeButton.props.onClick()
await new Promise(resolve => setTimeout(resolve, 0))
const removeCall = fetchCalls.find(call => call.url.endsWith('/session/entries/remove') && call.options.method === 'POST')
if (removeCall === undefined) throw new Error('removing the context entry sent no POST')
const removeBody = JSON.parse(removeCall.options.body)
if (removeBody.sessionId !== 's1' || removeBody.entryId !== 'session-folder-1') {
  throw new Error(`unexpected remove body ${removeCall.options.body}`)
}

// ---- Workspace project page --------------------------------------------------
if (clickListeners.size !== 1) throw new Error(`expected one workspace click listener, got ${clickListeners.size}`)
const fakeRow = { getAttribute: (name) => (name === 'data-row-key' ? 'workspace:ws-1' : null) }
const fakeTarget = {
  closest(selector) {
    if (selector === '[data-row-key^="workspace:"]') return fakeRow
    return null
  },
}
const clickEvent = {
  button: 0,
  defaultPrevented: false,
  stopped: false,
  target: fakeTarget,
  preventDefault() { this.defaultPrevented = true },
  stopPropagation() { this.stopped = true },
}
;[...clickListeners][0](clickEvent)
if (selectedPanels[selectedPanels.length - 1] !== 'workspace-overview') {
  throw new Error(`workspace click selected ${selectedPanels[selectedPanels.length - 1]}`)
}
if (!clickEvent.defaultPrevented || !clickEvent.stopped) {
  throw new Error('workspace click did not stop the row toggle')
}

// The chevron must keep toggling and must not open the project page.
const beforeChevron = selectedPanels.length
const chevronEvent = {
  button: 0,
  defaultPrevented: false,
  stopped: false,
  target: {
    closest(selector) {
      if (selector === '[class*="_chevron"]') return {}
      if (selector === '[data-row-key^="workspace:"]') return fakeRow
      return null
    },
  },
  preventDefault() { this.defaultPrevented = true },
  stopPropagation() { this.stopped = true },
}
;[...clickListeners][0](chevronEvent)
if (selectedPanels.length !== beforeChevron || chevronEvent.defaultPrevented || chevronEvent.stopped) {
  throw new Error('chevron click must only toggle the row')
}

text = await renderWith(overviewComponent, {
  useWorkspaces: overviewUseWorkspaces,
  useSessions: overviewUseSessions,
  t: translate,
}, 'overview')
for (const fragment of [
  'Docs project',
  '/tmp/project',
  'Product documentation workspace.',
  'Prefer TypeScript.',
  'Contexto',
  'project',
  'First chat',
  'Second chat',
  'Model One',
  'Predeterminado',
]) {
  if (!text.includes(fragment)) {
    console.error('Rendered overview: ' + text)
    throw new Error(`workspace page is missing ${fragment}`)
  }
}
if (text.includes('Subagent chat') || text.includes('Blank chat')) {
  throw new Error('the workspace page listed a subagent or blank session')
}
const chatButtons = collected.filter(node => node.props?.className === 'wsc-project-chat')
if (chatButtons.length !== 2) throw new Error(`expected two chats, got ${chatButtons.length}`)
chatButtons[0].props.onClick()
if (openedSessions.length !== 1 || openedSessions[0] !== 's2') {
  throw new Error(`clicking a chat opened ${JSON.stringify(openedSessions)}`)
}
const newSessionButton = collected.find(node => node.props?.className === 'wsc-btn wsc-btn-primary')
if (newSessionButton === undefined) throw new Error('the workspace page rendered no New session button')
newSessionButton.props.onClick()
if (startedSessions.length !== 1 || startedSessions[0] !== 'ws-1') {
  throw new Error(`New session started ${JSON.stringify(startedSessions)}`)
}

// The mode menu lists the healthy host presets and applies the chosen one.
let triggers = collected.filter(node => node.props?.className === 'wsc-project-trigger')
if (triggers.length !== 3) throw new Error(`expected three composer triggers, got ${triggers.length}`)
await triggers[0].props.onClick()
text = await renderWith(overviewComponent, {
  useWorkspaces: overviewUseWorkspaces,
  useSessions: overviewUseSessions,
  t: translate,
}, 'overview')
let options = collected.filter(node => node.props?.className?.split(' ').includes('wsc-project-option'))
if (options.length !== 4) throw new Error(`expected four mode options, got ${options.length}`)
options[1].props.onClick()
await new Promise(resolve => setTimeout(resolve, 0))
if (agentPresetSelections.length !== 1 || agentPresetSelections[0].sessionId !== 's9' || agentPresetSelections[0].presetId !== 'ptc') {
  throw new Error(`mode selection was ${JSON.stringify(agentPresetSelections)}`)
}

// The permission menu reuses the draft session, lists the host presets and
// applies one through the session command.
text = await renderWith(overviewComponent, {
  useWorkspaces: overviewUseWorkspaces,
  useSessions: overviewUseSessions,
  t: translate,
}, 'overview')
triggers = collected.filter(node => node.props?.className === 'wsc-project-trigger')
if (triggers.length !== 3) throw new Error(`expected three composer triggers, got ${triggers.length}`)
await triggers[1].props.onClick()
text = await renderWith(overviewComponent, {
  useWorkspaces: overviewUseWorkspaces,
  useSessions: overviewUseSessions,
  t: translate,
}, 'overview')
options = collected.filter(node => node.props?.className?.split(' ').includes('wsc-project-option'))
if (options.length !== 3) throw new Error(`expected three permission options, got ${options.length}`)
options[0].props.onClick()
await new Promise(resolve => setTimeout(resolve, 0))
if (permissionCommands.length !== 1 || permissionCommands[0] !== '/permission read-only') {
  throw new Error(`permission command was ${JSON.stringify(permissionCommands)}`)
}

// The model menu reuses the same draft session and applies the chosen model.
text = await renderWith(overviewComponent, {
  useWorkspaces: overviewUseWorkspaces,
  useSessions: overviewUseSessions,
  t: translate,
}, 'overview')
triggers = collected.filter(node => node.props?.className === 'wsc-project-trigger')
if (triggers.length !== 3) throw new Error(`expected three composer triggers, got ${triggers.length}`)
await triggers[2].props.onClick()
text = await renderWith(overviewComponent, {
  useWorkspaces: overviewUseWorkspaces,
  useSessions: overviewUseSessions,
  t: translate,
}, 'overview')
options = collected.filter(node => node.props?.className?.split(' ').includes('wsc-project-option'))
if (options.length !== 2) throw new Error(`expected two model options, got ${options.length}`)
options[1].props.onClick()
await new Promise(resolve => setTimeout(resolve, 0))
if (modelSelections.length !== 1 || modelSelections[0].provider !== 'provider-a' || modelSelections[0].model !== 'model-2') {
  throw new Error(`model selection was ${JSON.stringify(modelSelections)}`)
}
if (!text.includes('Model One') || !text.includes('Provider A')) {
  throw new Error('the model menu did not render its provider group')
}

const composerInput = collected.find(node => node.props?.className === 'wsc-project-input')
if (composerInput === undefined) throw new Error('the workspace page rendered no chat composer')
composerInput.props.onChange({ target: { value: 'Hello project' } })
text = await renderWith(overviewComponent, {
  useWorkspaces: overviewUseWorkspaces,
  useSessions: overviewUseSessions,
  t: translate,
}, 'overview')
const composerForm = collected.find(node => node.props?.className === 'wsc-project-composer')
if (composerForm === undefined) throw new Error('the workspace page rendered no composer form')
await composerForm.props.onSubmit({ preventDefault() {} })
await new Promise(resolve => setTimeout(resolve, 0))
if (connectedWorkspaces.length !== 1 || connectedWorkspaces[0] !== 'ws-1') {
  throw new Error(`composer connected ${JSON.stringify(connectedWorkspaces)}`)
}
if (openedSessions[openedSessions.length - 1] !== 's9') {
  throw new Error(`composer did not open the new session: ${JSON.stringify(openedSessions)}`)
}
if (sentPrompts.length !== 1 || sentPrompts[0].text !== 'Hello project' || sentPrompts[0].mode !== 'queue') {
  throw new Error(`composer sent ${JSON.stringify(sentPrompts)}`)
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
  rightSidebar: 'ok',
  projectPage: 'ok',
  command: folderCommand.name,
})
