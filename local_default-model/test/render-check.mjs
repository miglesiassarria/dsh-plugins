/**
 * Render check for the default-model client half.
 *
 * Runs `client.js` inside a VM with a minimal React-compatible renderer. It
 * covers the two slot registrations, the Models-only visibility gate, the
 * grouped model select, saving a selection, and the retry path after a failed
 * load.
 *
 * Usage: node test/render-check.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const here = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(join(here, '..', 'client.js'), 'utf8')

/** One isolated module instance with its own stores and fetch stub. */
function createHarness({ failFirstGet = false } = {}) {
  const loaderCalls = []
  const collected = []
  const pendingEffects = []
  const effectKeys = new Set()
  const effectDeps = new Map()
  const cleanups = new Map()
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
        pendingEffects.push({ key, fn })
        return
      }
      const previous = effectDeps.get(key)
      const changed = previous === undefined
        || previous.length !== deps.length
        || deps.some((value, index) => !Object.is(value, previous[index]))
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

  /** Render one element tree, executing function components. */
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

  const groups = [
    {
      id: 'nexo',
      name: 'Nexo',
      models: [
        { id: 'openai/gpt-6-luna', name: 'GPT-6 Luna' },
        { id: 'openai/gpt-6.1-sol', name: 'GPT-6.1 Sol' },
      ],
    },
    {
      id: 'opencode-go',
      name: 'opencode-go',
      models: [{ id: 'deepseek-v4.1-flash', name: 'DeepSeek V4.1 Flash' }],
    },
  ]
  let selection = { provider: 'nexo', model: 'openai/gpt-6-luna' }
  let getCount = 0
  const fetchCalls = []
  const posts = []

  function response(data, ok = true, status = 200) {
    return {
      ok,
      status,
      json: async () => (ok ? { ok: true, data } : { ok: false, ...data }),
    }
  }

  const sandbox = {
    console,
    document: { querySelector: () => null, head: { appendChild() {} } },
    window: {},
    setTimeout: () => 0,
    clearTimeout: () => {},
    fetch: async (url, options = {}) => {
      const target = String(url)
      fetchCalls.push({ url: target, options })
      if (target === '/dsh-default-model/state') {
        getCount += 1
        if (failFirstGet && getCount === 1) {
          return response({ code: 'network-error', error: 'offline' }, false, 500)
        }
        return response({ selection, available: true, groups, failures: [] })
      }
      if (target === '/dsh-default-model/selection' && options.method === 'POST') {
        const body = JSON.parse(options.body)
        posts.push(body)
        selection = { provider: body.provider, model: body.model }
        return response({ selection, available: true, groups, failures: [], updated: 1 })
      }
      throw new Error(`unexpected fetch ${target}`)
    },
  }
  sandbox.window.__ModuleLoader__ = { load: (definition) => loaderCalls.push(definition) }
  vm.createContext(sandbox)
  vm.runInContext(source, sandbox)

  if (loaderCalls.length !== 1) throw new Error(`expected one module registration, got ${loaderCalls.length}`)
  const definition = loaderCalls[0]
  if (definition.id !== '@local/default-model') throw new Error(`unexpected module id ${definition.id}`)

  const plugin = definition.factory((name) => {
    if (name === 'react') return React
    throw new Error(`unexpected module import: ${name}`)
  })

  const registrations = []
  const dictionaries = {}
  const fakeContext = {
    locale: {
      register(namespace, dicts) {
        dictionaries[namespace] = { ...(dictionaries[namespace] || {}), ...dicts }
        return () => {}
      },
      bind(namespace) {
        const dict = dictionaries[namespace]?.es ?? dictionaries[namespace]?.en ?? {}
        return (key) => dict[key] ?? key
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

  const action = registrations.find(entry => entry.options.name === 'settings.action')
  const probe = registrations.find(entry => entry.options.name === 'settings.models.footer')
  if (action === undefined) throw new Error('the plugin registered no settings.action entry')
  if (probe === undefined) throw new Error('the plugin registered no settings.models.footer probe')
  if (action.options.locale !== 'default-model') throw new Error('the action has no locale binding')

  /**
   * Render every mounted component until effects and state settle.
   * @param {Array<{ component: Function, props: object, path: string }>} mounted Components to render.
   * @returns {Promise<string>} The concatenated text.
   */
  async function settle(mounted) {
    let text = ''
    for (let pass = 0; pass < 24; pass += 1) {
      collected.length = 0
      const output = []
      for (const entry of mounted) renderNode(React.createElement(entry.component, entry.props), entry.path, output)
      text = output.join(' | ')
      const effects = pendingEffects.splice(0)
      for (const entry of effects) {
        const previous = cleanups.get(entry.key)
        if (typeof previous === 'function') previous()
        const cleanup = entry.fn()
        if (typeof cleanup === 'function') cleanups.set(entry.key, cleanup)
        else cleanups.delete(entry.key)
      }
      await new Promise(resolve => setTimeout(resolve, 0))
      if (effects.length === 0 && !dirty) break
      dirty = false
    }
    return text
  }

  return {
    action,
    probe,
    settle,
    collected: () => collected,
    posts,
    fetchCalls,
    translate: fakeContext.locale.bind('default-model'),
    /** Run every recorded cleanup once, as an unmount would. */
    unmount() {
      for (const cleanup of cleanups.values()) cleanup()
      cleanups.clear()
    },
    /** Run the cleanups owned by one component path, as that component's unmount would. */
    unmountPath(path) {
      for (const [key, cleanup] of [...cleanups]) {
        if (!key.startsWith(path + '#')) continue
        cleanup()
        cleanups.delete(key)
      }
    },
  }
}

function labelOf(node) {
  const children = node.props?.children
  return Array.isArray(children) ? children.join('') : String(children ?? '')
}

// Scenario 1: the action stays hidden until the Models page mounts.
{
  const harness = createHarness()
  const actionEntry = { component: harness.action.component, props: { t: harness.translate }, path: 'action' }
  const probeEntry = { component: harness.probe.component, props: {}, path: 'probe' }

  let text = await harness.settle([actionEntry])
  if (text !== '') throw new Error(`the action rendered outside the Models page: ${text}`)

  text = await harness.settle([actionEntry, probeEntry])
  for (const fragment of ['Predeterminado', 'GPT-6 Luna', 'DeepSeek V4.1 Flash']) {
    if (!text.includes(fragment)) throw new Error(`the header control is missing "${fragment}": ${text}`)
  }

  const select = harness.collected().find(node => node.type === 'select')
  if (select === undefined) throw new Error('the header control has no select')
  if (select.props.value !== '0') throw new Error(`unexpected initial selection: ${select.props.value}`)
  const optionGroups = select.props.children.filter(child => child && child.type === 'optgroup')
  if (optionGroups.length !== 2) throw new Error(`expected two provider groups, got ${optionGroups.length}`)
  if (optionGroups[1].props.label !== 'opencode-go') throw new Error('the second group is not labelled by its provider')

  select.props.onChange({ target: { value: '2' } })
  text = await harness.settle([actionEntry, probeEntry])
  if (harness.posts.length !== 1) throw new Error(`expected one selection save, got ${harness.posts.length}`)
  if (harness.posts[0].provider !== 'opencode-go' || harness.posts[0].model !== 'deepseek-v4.1-flash') {
    throw new Error(`unexpected saved selection: ${JSON.stringify(harness.posts[0])}`)
  }
  if (!text.includes('Modelo predeterminado actualizado.')) throw new Error(`the saved notice is missing: ${text}`)
  const selected = harness.collected().find(node => node.type === 'select')
  if (selected.props.value !== '2') throw new Error(`the control did not move to the new selection: ${selected.props.value}`)

  harness.unmountPath('probe')
  text = await harness.settle([actionEntry])
  if (text !== '') throw new Error(`the action stayed visible after the Models page unmounted: ${text}`)

  console.log('Render scenario OK: visibility, grouped select, save')
}

// Scenario 2: a failed load offers a retry that recovers.
{
  const harness = createHarness({ failFirstGet: true })
  const actionEntry = { component: harness.action.component, props: { t: harness.translate }, path: 'action' }
  const probeEntry = { component: harness.probe.component, props: {}, path: 'probe' }

  let text = await harness.settle([actionEntry, probeEntry])
  if (!text.includes('Reintentar')) throw new Error(`the load failure offered no retry: ${text}`)
  const retry = harness.collected().find(node => node.type === 'button' && labelOf(node) === 'Reintentar')
  if (retry === undefined) throw new Error('the retry control is missing')
  retry.props.onClick()
  text = await harness.settle([actionEntry, probeEntry])
  if (!text.includes('GPT-6 Luna')) throw new Error(`retrying did not load the catalog: ${text}`)

  console.log('Render scenario OK: retry after a failed load')
}

console.log('Render check OK')
