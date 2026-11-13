/**
 * Render check for the Groq dictation client half.
 *
 * Runs `client.js` inside a VM with a minimal React-compatible renderer. It
 * covers both registrations, the General settings row (load, save, clear), and
 * the composer microphone (record, transcribe, insert, and two failures)
 * against a stubbed Host route.
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
      pendingEffects.push({ key, fn, deps })
      return
    }
    const previous = effectDeps.get(key)
    const changed = previous === undefined || previous.length !== deps.length || deps.some((value, index) => !Object.is(value, previous[index]))
    if (!changed) return
    effectDeps.set(key, deps)
    pendingEffects.push({ key, fn, deps })
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

const settings = {
  configured: false,
  hostMic: true,
  model: 'whisper-large-v3-turbo',
  models: ['whisper-large-v3-turbo', 'whisper-large-v3', 'distil-whisper-large-v3-en'],
  apiKeyHint: '',
}

const fetchCalls = []
const insertions = []
const drafts = []
let transcribeStatus = 200
let transcribeBody = { text: '  Hola mundo.  ' }
let microphoneError = null
let hostMicProbe = { available: true, device: 'Micrófono del test' }
let hostTranscript = '  Texto del ordenador.  '
const hostCalls = []

function response(data, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => (ok ? { ok: true, data } : { ok: false, ...data }),
  }
}

function translate(key, params) {
  const table = {
    'settings.title': 'Dictado con Groq',
    'settings.desc': 'Graba con el botón de micrófono del compositor y deja que Whisper escriba lo que dices.',
    'settings.configured': 'Clave guardada ···· {hint}',
    'settings.loading': 'Cargando…',
    'settings.loadError': 'No se pudo leer la configuración del dictado.',
    'settings.apiKeyLabel': 'Clave API de Groq',
    'settings.apiKeyPlaceholder': 'gsk_…',
    'settings.apiKeyPlaceholderSaved': 'Escribe una clave nueva para sustituir la guardada',
    'settings.modelLabel': 'Modelo de Whisper',
    'settings.save': 'Guardar',
    'settings.saving': 'Guardando…',
    'settings.clear': 'Borrar clave',
    'settings.saved': 'Guardado.',
    'settings.clearDone': 'Clave borrada.',
    'settings.needKey': 'Introduce una clave para activar el dictado.',
    'settings.hostMicLabel': 'Micrófono del ordenador',
    'settings.hostMicDesc': 'Cuando el navegador no puede grabar, el dictado graba con el micrófono de este ordenador.',
    'settings.hostMicOn': 'Permitido como alternativa',
    'settings.hostMicOff': 'No usarlo nunca',
    'settings.hostMicAvailable': 'Disponible: {device}',
    'settings.hostMicUnavailable': 'Este ordenador no tiene un micrófono que el dictado pueda usar.',
    'settings.privacy': 'El audio solo se envía a Groq cuando detienes la grabación.',
    'model.whisper-large-v3-turbo': 'Whisper Large v3 Turbo · el más rápido',
    'model.whisper-large-v3': 'Whisper Large v3 · el más preciso',
    'model.distil-whisper-large-v3-en': 'Distil Whisper Large v3 · solo inglés',
    'mic.idle': 'Dictar con Groq',
    'mic.idleHost': 'Dictar con el micrófono del ordenador',
    'mic.recording': 'Detener dictado (Enter)',
    'mic.recordingHost': 'Detener dictado (micrófono del ordenador)',
    'mic.startingHost': 'Abriendo el micrófono del ordenador…',
    'mic.recordingAriaHost': 'Grabando con el micrófono del ordenador, {time}. Pulsa Enter para terminar.',
    'mic.hostTag': 'ordenador',
    'mic.requesting': 'Pidiendo permiso al micrófono…',
    'mic.transcribing': 'Transcribiendo…',
    'mic.notConfigured': 'Añade tu clave API de Groq en Ajustes → General para usar el dictado.',
    'mic.recordingAria': 'Grabando, {time}. Pulsa Enter para terminar.',
    'error.generic': 'La petición de dictado falló.',
    'error.invalid-key': 'Groq ha rechazado la clave API. Revísala en Ajustes → General.',
    'error.not-configured': 'Añade tu clave API de Groq en Ajustes → General para usar el dictado.',
    'error.microphone-denied': 'Se ha denegado el acceso al micrófono. Permítelo en el navegador y vuelve a intentarlo.',
    'error.microphone-missing': 'No se ha encontrado ningún micrófono.',
    'error.microphone-insecure': 'El micrófono necesita HTTPS. Abre la app con el enlace del túnel, no con la dirección de la red local.',
    'error.microphone-unsupported': 'Este navegador no expone ningún micrófono a la página.',
    'error.microphone-busy': 'El micrófono está ocupado por otra app o llamada. Ciérrala y vuelve a intentarlo.',
    'error.microphone-failed': 'No se pudo abrir el micrófono.',
    'error.recorder-unavailable': 'Este navegador no puede grabar audio.',
    'error.recording-failed': 'La grabación falló. Inténtalo de nuevo.',
    'error.empty-audio': 'La grabación está vacía.',
    'error.empty-transcript': 'No se ha detectado voz en la grabación.',
  }
  let text = table[key] ?? key
  if (params !== undefined) text = text.replace(/\{(\w+)\}/gu, (match, name) => (name in params ? String(params[name]) : match))
  return text
}

const stream = { getTracks: () => [{ stop() {} }] }

class FakeMediaRecorder {
  static isTypeSupported(type) {
    return type === 'audio/webm' || type === 'audio/webm;codecs=opus'
  }
  constructor(_stream, options) {
    if (options?.mimeType !== undefined && FakeMediaRecorder.failWithOptions > 0) {
      FakeMediaRecorder.failWithOptions -= 1
      throw Object.assign(new Error('unsupported container'), { name: 'NotSupportedError' })
    }
    this.mimeType = options?.mimeType ?? 'audio/webm'
    this.state = 'inactive'
    this.ondataavailable = null
    this.onerror = null
    this.onstop = null
  }
  start() {
    this.state = 'recording'
  }
  stop() {
    this.state = 'inactive'
    if (FakeMediaRecorder.lateChunk) {
      // WebKit can deliver the last chunk after the stop event.
      if (this.onstop !== null) this.onstop()
      setTimeout(() => {
        if (this.ondataavailable !== null) this.ondataavailable({ data: new Blob(['audio'], { type: 'audio/webm' }) })
      }, 60)
      return
    }
    if (this.ondataavailable !== null) this.ondataavailable({ data: new Blob(['audio'], { type: 'audio/webm' }) })
    if (this.onstop !== null) this.onstop()
  }
}
FakeMediaRecorder.failWithOptions = 0
FakeMediaRecorder.lateChunk = false

const windowListeners = new Set()
const activeIntervals = new Set()
const focusCalls = { root: 0, editor: 0 }
const editorRoot = {
  focus() { focusCalls.root += 1 },
  __lexicalEditor: {
    focus() { focusCalls.editor += 1 },
  },
}
const warnings = []
const sandbox = {
  console: { ...console, warn: (...args) => warnings.push(args) },
  document: { querySelector: (selector) => (selector === '[contenteditable="true"]' ? editorRoot : null), body: null, head: { appendChild() {} } },
  window: {
    addEventListener(type, listener) {
      if (type === 'keydown') windowListeners.add(listener)
    },
    removeEventListener(type, listener) {
      if (type === 'keydown') windowListeners.delete(listener)
    },
  },
  navigator: {
    mediaDevices: {
      async getUserMedia() {
        if (microphoneError !== null) throw microphoneError
        return stream
      },
    },
  },
  MediaRecorder: FakeMediaRecorder,
  Blob,
  FormData,
  setTimeout,
  clearTimeout,
  setInterval: (fn, ms) => {
    const id = setInterval(fn, ms)
    activeIntervals.add(id)
    return id
  },
  clearInterval: (id) => {
    activeIntervals.delete(id)
    clearInterval(id)
  },
  fetch: async (url, options = {}) => {
    const target = String(url)
    fetchCalls.push({ url: target, options })
    if (target === '/dsh-groq-dictation/settings' && options.method === 'GET') return response(settings)
    if (target === '/dsh-groq-dictation/settings' && options.method === 'POST') {
      const body = JSON.parse(options.body)
      if (body.apiKey !== undefined) {
        settings.configured = body.apiKey !== ''
        settings.apiKeyHint = body.apiKey === '' ? '' : body.apiKey.slice(-4)
      }
      if (body.model !== undefined) settings.model = body.model
      if (body.hostMic !== undefined) settings.hostMic = body.hostMic
      return response({ ...settings })
    }
    if (target === '/dsh-groq-dictation/host-mic' && options.method === 'GET') {
      return response({ enabled: settings.hostMic !== false, available: hostMicProbe.available, device: hostMicProbe.device, maxSeconds: 600 })
    }
    if (target === '/dsh-groq-dictation/host-mic/start' && options.method === 'POST') {
      hostCalls.push('start')
      return response({ started: true, device: hostMicProbe.device, maxSeconds: 600 })
    }
    if (target === '/dsh-groq-dictation/host-mic/stop' && options.method === 'POST') {
      hostCalls.push('stop')
      return response({ text: hostTranscript, model: settings.model, seconds: 2 })
    }
    if (target === '/dsh-groq-dictation/host-mic/cancel' && options.method === 'POST') {
      hostCalls.push('cancel')
      return response({ cancelled: true })
    }
    if (target === '/dsh-groq-dictation/transcribe') {
      if (transcribeStatus !== 200) return response({ code: 'invalid-key', error: 'Invalid API Key' }, false, transcribeStatus)
      return response(transcribeBody)
    }
    throw new Error(`unexpected fetch ${target}`)
  },
}
sandbox.window.__ModuleLoader__ = { load: (definition) => loaderCalls.push(definition) }
vm.createContext(sandbox)
vm.runInContext(source, sandbox)

if (loaderCalls.length !== 1) throw new Error(`expected one module registration, got ${loaderCalls.length}`)
const moduleDefinition = loaderCalls[0]
if (moduleDefinition.id !== '@local/groq-dictation') throw new Error(`unexpected module id ${moduleDefinition.id}`)

const plugin = moduleDefinition.factory((name) => {
  if (name === 'react') return React
  throw new Error(`unexpected module import: ${name}`)
})

const registrations = []
const dicts = new Map()
const fakeContext = {
  locale: {
    register(namespace, locale, dict) {
      const table = dicts.get(namespace) ?? {}
      table[locale] = dict
      dicts.set(namespace, table)
      return () => {}
    },
    bind(namespace) {
      const table = dicts.get(namespace) ?? {}
      const dict = table.es ?? table.en ?? {}
      return (key, params) => {
        // The real runtime indexes dictionaries by dotted key, not by nesting.
        const template = dict[key] ?? key
        if (params === undefined) return template
        return template.replace(/\{(\w+)\}/gu, (match, name) => (name in params ? String(params[name]) : match))
      }
    },
  },
  slots: {
    inject(_key, callback) {
      callback()
      return () => {}
    },
    register(options, component) {
      registrations.push({ options, component })
      return () => {}
    },
  },
  effect(callback) {
    callback()
    return () => {}
  },
}

plugin.apply(fakeContext)

const settingsRegistration = registrations.find(entry => entry.options.name === 'settings.general.item' && entry.options.id === 'groq-dictation')
const micRegistration = registrations.find(entry => entry.options.name === 'conversation.input.activity')
if (settingsRegistration === undefined) throw new Error('the plugin registered no General settings row')
if (micRegistration === undefined) throw new Error('the plugin registered no composer microphone')
if (settingsRegistration.options.locale !== 'groq-dictation') throw new Error('the settings row has no locale binding')
if (micRegistration.options.locale !== 'groq-dictation') throw new Error('the microphone has no locale binding')

const pluginDicts = dicts.get('groq-dictation')
if (pluginDicts === undefined) throw new Error('the plugin registered no dictionaries')
for (const locale of ['es', 'en']) {
  const table = pluginDicts[locale]
  if (table === undefined) throw new Error(`the plugin registered no ${locale} dictionary`)
  for (const key of ['settings.title', 'mic.idle', 'error.microphone-failed', 'error.microphone-insecure']) {
    if (typeof table[key] !== 'string') throw new Error(`the ${locale} dictionary does not resolve "${key}" (dotted keys are required)`)
  }
}
if (pluginDicts.es['settings.title'] !== 'Dictado con Groq') throw new Error('the Spanish dictionary was not flattened')

// The client dictionaries and the package locale files must not drift apart.
function flatten(source, prefix = '') {
  const out = {}
  for (const [key, value] of Object.entries(source)) {
    const name = prefix === '' ? key : `${prefix}.${key}`
    if (typeof value === 'string') out[name] = value
    else if (value !== null && typeof value === 'object') Object.assign(out, flatten(value, name))
  }
  return out
}
for (const locale of ['es', 'en']) {
  const packageText = flatten(JSON.parse(readFileSync(join(here, '..', 'locale', `${locale}.json`), 'utf8')))
  for (const [key, value] of Object.entries(packageText)) {
    if (key.startsWith('meta.')) continue
    if (pluginDicts[locale][key] !== value) {
      throw new Error(`locale/${locale}.json and client.js disagree about "${key}"`)
    }
  }
  for (const key of Object.keys(pluginDicts[locale])) {
    if (packageText[key] === undefined) throw new Error(`client.js has "${key}" but locale/${locale}.json does not`)
  }
}

function labelOf(node) {
  const children = node.props?.children
  return Array.isArray(children) ? children.join('') : String(children ?? '')
}

let text = ''

/** Render one component and flush its effects. */
async function settle(component, props, path) {
  for (let pass = 0; pass < 16; pass += 1) {
    collected.length = 0
    const output = []
    renderNode(React.createElement(component, props), path, output)
    text = output.join(' | ')
    const effects = pendingEffects.filter(entry => !effectKeys.has(entry.key))
    pendingEffects.length = 0
    for (const entry of effects) {
      if (entry.deps === undefined) effectKeys.add(entry.key)
      entry.fn()
    }
    await new Promise(resolve => setTimeout(resolve, 0))
    if (effects.length === 0 && !dirty) break
    dirty = false
  }
  return text
}

const settingsRow = settingsRegistration.component
text = await settle(settingsRow, { t: translate }, 'settings')
for (const fragment of ['Dictado con Groq', 'Clave API de Groq', 'Modelo de Whisper', 'Introduce una clave']) {
  if (!text.includes(fragment)) throw new Error(`settings row is missing "${fragment}": ${text}`)
}
const keyInput = collected.find(node => node.type === 'input')
if (keyInput === undefined) throw new Error('settings row has no key input')
keyInput.props.onChange({ target: { value: 'gsk_test_key_1234567890' } })
dirty = false
text = await settle(settingsRow, { t: translate }, 'settings')
const saveButton = collected.find(node => node.type === 'button' && labelOf(node) === 'Guardar')
if (saveButton === undefined) throw new Error('settings row has no save button')
saveButton.props.onClick()
text = await settle(settingsRow, { t: translate }, 'settings')
const post = fetchCalls.find(call => call.url === '/dsh-groq-dictation/settings' && call.options.method === 'POST')
if (post === undefined) throw new Error('saving the key made no request')
if (!String(post.options.body).includes('gsk_test_key_1234567890')) throw new Error('the key was not sent to the Host')
if (settings.configured !== true) throw new Error('the Host did not record the key')
if (!text.includes('Clave guardada ···· 7890')) throw new Error(`the saved badge is missing: ${text}`)
if (!text.includes('Guardado.')) throw new Error(`the saved notice is missing: ${text}`)

const modelSelect = collected.find(node => node.type === 'select')
if (modelSelect === undefined) throw new Error('settings row has no model select')
if (modelSelect.props.children.length !== 3) throw new Error('the model select does not list three models')
modelSelect.props.onChange({ target: { value: 'whisper-large-v3' } })
dirty = false
text = await settle(settingsRow, { t: translate }, 'settings')
const saveAgain = collected.find(node => node.type === 'button' && labelOf(node) === 'Guardar')
saveAgain.props.onClick()
text = await settle(settingsRow, { t: translate }, 'settings')
if (settings.model !== 'whisper-large-v3') throw new Error('the selected model was not saved')

const clearButton = collected.find(node => node.type === 'button' && labelOf(node) === 'Borrar clave')
if (clearButton === undefined) throw new Error('settings row has no clear button')
clearButton.props.onClick()
text = await settle(settingsRow, { t: translate }, 'settings')
if (settings.configured !== false) throw new Error('clearing the key made no change')
if (!text.includes('Clave borrada.')) throw new Error(`the clear notice is missing: ${text}`)

// Turn it back on through the row so the shared client store follows.
const keyAgain = collected.find(node => node.type === 'input')
keyAgain.props.onChange({ target: { value: 'gsk_test_key_1234567890' } })
dirty = false
text = await settle(settingsRow, { t: translate }, 'settings')
const saveThird = collected.find(node => node.type === 'button' && labelOf(node) === 'Guardar')
saveThird.props.onClick()
text = await settle(settingsRow, { t: translate }, 'settings')
if (settings.configured !== true) throw new Error('the key could not be saved again')
const modelAgain = collected.find(node => node.type === 'select')
modelAgain.props.onChange({ target: { value: 'whisper-large-v3-turbo' } })
dirty = false
text = await settle(settingsRow, { t: translate }, 'settings')
const saveFourth = collected.find(node => node.type === 'button' && labelOf(node) === 'Guardar')
saveFourth.props.onClick()
text = await settle(settingsRow, { t: translate }, 'settings')

const inputActions = {
  captureInsertion() {
    return { start: 4, end: 4, draftRev: 1 }
  },
  insertText(value, span) {
    insertions.push({ value, span })
    return true
  },
  setDraft(value) {
    drafts.push(value)
  },
}
const micProps = {
  t: translate,
  sessionId: 's1',
  useInput: (selector) => selector({ draft: 'Hola' }),
  inputActions,
}
const mic = micRegistration.component

// Without an injected translator the component falls back to the plugin
// namespace: the composer label must read in Spanish, not as a raw key.
text = await settle(mic, { ...micProps, t: undefined }, 'mic')
const boundButton = collected.find(node => node.type === 'button' && String(node.props.className).includes('grd-mic'))
if (boundButton === undefined) throw new Error('the plugin-bound microphone button is missing')
if (boundButton.props['aria-label'] !== 'Dictar con Groq') {
  throw new Error(`the plugin dictionary is not resolving: ${JSON.stringify(boundButton.props['aria-label'])}`)
}

text = await settle(mic, micProps, 'mic')
let micButton = collected.find(node => node.type === 'button' && String(node.props.className).includes('grd-mic'))
if (micButton === undefined) throw new Error('the composer microphone button is missing')
if (micButton.props['aria-label'] !== 'Dictar con Groq') throw new Error(`unexpected microphone label: ${micButton.props['aria-label']}`)
micButton.props.onClick()
text = await settle(mic, micProps, 'mic')
micButton = collected.find(node => node.type === 'button' && String(node.props.className).includes('grd-mic'))
if (micButton.props['aria-pressed'] !== true) throw new Error('the microphone did not enter the recording state')
if (!String(micButton.props['aria-label']).includes('Pulsa Enter')) throw new Error('the recording label does not mention Enter')
if (!text.includes('0:00')) throw new Error(`the recording timer is missing: ${text}`)
if (windowListeners.size !== 1) throw new Error(`expected one Enter listener, got ${windowListeners.size}`)
const enter = {
  key: 'Enter',
  code: 'Enter',
  keyCode: 13,
  isComposing: false,
  defaultPrevented: false,
  propagationStopped: false,
  preventDefault() { this.defaultPrevented = true },
  stopPropagation() { this.propagationStopped = true },
  stopImmediatePropagation() {},
}
for (const listener of [...windowListeners]) listener(enter)
if (!enter.defaultPrevented) throw new Error('Enter was not intercepted while recording')
if (!enter.propagationStopped) throw new Error('Enter was not stopped from reaching the composer')
text = await settle(mic, micProps, 'mic')
if (insertions.length !== 1) throw new Error(`expected one transcript insertion, got ${insertions.length}`)
if (insertions[0].value !== ' Hola mundo. ') throw new Error(`unexpected inserted text: ${JSON.stringify(insertions[0].value)}`)
if (insertions[0].span.start !== 4 || insertions[0].span.draftRev !== 1) throw new Error('the insertion span was not reused')
if (focusCalls.root !== 1) throw new Error(`expected the composer to regain focus, got ${focusCalls.root} focus calls`)
if (focusCalls.editor !== 1) throw new Error(`expected the Lexical editor to regain focus, got ${focusCalls.editor} focus calls`)
if (text.includes('La petición de dictado falló')) throw new Error('a successful transcript showed an error')

// A rejected key becomes a localized notice and leaves the draft untouched.
transcribeStatus = 401
micButton = collected.find(node => node.type === 'button' && String(node.props.className).includes('grd-mic'))
micButton.props.onClick()
text = await settle(mic, micProps, 'mic')
micButton = collected.find(node => node.type === 'button' && String(node.props.className).includes('grd-mic'))
micButton.props.onClick()
text = await settle(mic, micProps, 'mic')
if (insertions.length !== 1) throw new Error('a failed transcript was inserted')
if (!text.includes('Groq ha rechazado la clave API')) throw new Error(`the rejected-key notice is missing: ${text}`)

// A denied microphone permission is reported instead of continuing.
transcribeStatus = 200
microphoneError = Object.assign(new Error('denied'), { name: 'NotAllowedError' })
micButton = collected.find(node => node.type === 'button' && String(node.props.className).includes('grd-mic'))
micButton.props.onClick()
text = await settle(mic, micProps, 'mic')
if (!text.includes('Se ha denegado el acceso al micrófono')) throw new Error(`the permission notice is missing: ${text}`)

microphoneError = null

// A browser that hides mediaDevices reads as unsupported, not as a failure.
const mediaDevices = sandbox.navigator.mediaDevices
delete sandbox.navigator.mediaDevices
micButton.props.onClick()
text = await settle(mic, micProps, 'mic')
if (!text.includes('no expone ningún micrófono')) throw new Error(`the unsupported-browser notice is missing: ${text}`)
sandbox.navigator.mediaDevices = mediaDevices

// A microphone held by another app is reported as busy.
microphoneError = Object.assign(new Error('busy'), { name: 'NotReadableError' })
micButton.props.onClick()
text = await settle(mic, micProps, 'mic')
if (!text.includes('ocupado por otra app')) throw new Error(`the busy-microphone notice is missing: ${text}`)
microphoneError = null

// A refused container still records: the recorder is retried without options.
FakeMediaRecorder.failWithOptions = 1
const beforeRetry = insertions.length
micButton.props.onClick()
text = await settle(mic, micProps, 'mic')
micButton = collected.find(node => node.type === 'button' && String(node.props.className).includes('grd-mic'))
if (micButton.props['aria-pressed'] !== true) throw new Error('the recorder was not retried without the refused container')
micButton.props.onClick()
await new Promise(resolve => setTimeout(resolve, 600))
text = await settle(mic, micProps, 'mic')
if (insertions.length !== beforeRetry + 1) throw new Error('a retried recorder produced no transcript')

// A clip whose last chunk arrives after stop() is still transcribed (WebKit).
FakeMediaRecorder.lateChunk = true
const beforeLate = insertions.length
micButton = collected.find(node => node.type === 'button' && String(node.props.className).includes('grd-mic'))
micButton.props.onClick()
text = await settle(mic, micProps, 'mic')
micButton = collected.find(node => node.type === 'button' && String(node.props.className).includes('grd-mic'))
if (micButton.props['aria-pressed'] !== true) throw new Error('the late-chunk recording did not start')
micButton.props.onClick()
await new Promise(resolve => setTimeout(resolve, 900))
text = await settle(mic, micProps, 'mic')
if (insertions.length !== beforeLate + 1) throw new Error('a late final chunk was dropped')
FakeMediaRecorder.lateChunk = false

// A page Safari refuses a microphone to records with the computer microphone.
sandbox.window.isSecureContext = false
micButton = collected.find(node => node.type === 'button' && String(node.props.className).includes('grd-mic'))
const beforeHost = insertions.length
micButton.props.onClick()
await new Promise(resolve => setTimeout(resolve, 50))
text = await settle(mic, micProps, 'mic')
micButton = collected.find(node => node.type === 'button' && String(node.props.className).includes('grd-mic'))
if (micButton.props['aria-pressed'] !== true) throw new Error('the computer microphone did not start recording')
if (!String(micButton.props['aria-label']).includes('micrófono del ordenador')) {
  throw new Error(`the recording label does not name the computer microphone: ${micButton.props['aria-label']}`)
}
micButton.props.onClick()
await new Promise(resolve => setTimeout(resolve, 50))
text = await settle(mic, micProps, 'mic')
if (hostCalls.join(',') !== 'start,stop') throw new Error(`unexpected computer-microphone calls: ${hostCalls.join(',')}`)
micButton = collected.find(node => node.type === 'button' && String(node.props.className).includes('grd-mic'))
if (micButton.props['aria-label'] !== 'Dictar con el micrófono del ordenador') {
  throw new Error(`the idle label does not offer the computer microphone: ${micButton.props['aria-label']}`)
}
if (insertions.length !== beforeHost + 1) throw new Error('the computer transcript was not inserted')
if (insertions[insertions.length - 1].value !== ' Texto del ordenador. ') {
  throw new Error(`unexpected computer transcript: ${JSON.stringify(insertions[insertions.length - 1].value)}`)
}

// Refusing the fallback brings back the HTTPS guidance.
text = await settle(settingsRow, { t: translate }, 'settings')
const hostCheckbox = collected.find(node => node.type === 'input' && node.props.type === 'checkbox')
if (hostCheckbox === undefined) throw new Error('the settings row has no computer-microphone checkbox')
hostCheckbox.props.onChange({ target: { checked: false } })
dirty = false
text = await settle(settingsRow, { t: translate }, 'settings')
const saveHost = collected.find(node => node.type === 'button' && labelOf(node) === 'Guardar')
saveHost.props.onClick()
text = await settle(settingsRow, { t: translate }, 'settings')
if (settings.hostMic !== false) throw new Error('the computer-microphone preference was not saved')
text = await settle(mic, micProps, 'mic')
micButton = collected.find(node => node.type === 'button' && String(node.props.className).includes('grd-mic'))
micButton.props.onClick()
text = await settle(mic, micProps, 'mic')
if (!text.includes('necesita HTTPS')) throw new Error(`the HTTPS notice is missing with the fallback off: ${text}`)
sandbox.window.isSecureContext = true

// The original platform failure stays visible in the console for support.
if (!warnings.some(args => String(args[1]?.name) === 'NotAllowedError')) throw new Error('the denied-microphone failure was not logged')
if (!warnings.some(args => String(args[1]?.name) === 'NotReadableError')) throw new Error('the busy-microphone failure was not logged')

for (const id of activeIntervals) clearInterval(id)
console.log('Render check OK:', registrations.map(entry => entry.options.name).join(', '))
