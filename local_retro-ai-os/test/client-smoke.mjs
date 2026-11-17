import assert from 'node:assert/strict'

/**
 * Headless smoke test for the browser half: a tiny React stand-in, a fake DOM
 * node for the home headline, and stubbed slots/locale/theme services. It
 * exercises the brand registrations, the headline patch and the settings card
 * without a browser.
 */

const warnings = []
const tokenLayers = []
const registered = []
const registeredKeys = []

const React = {
  createElement(type, props, ...children) {
    return {
      type,
      props: props || {},
      children: children.length === 0 ? [] : children,
    }
  },
  Fragment: Symbol('Fragment'),
  useState(initial) {
    return [typeof initial === 'function' ? initial() : initial, () => {}]
  },
  useEffect() {},
  useLayoutEffect() {},
  useMemo(factory) { return factory() },
  useCallback(fn) { return fn },
  useRef(value) { return { current: value === undefined ? null : value } },
  useSyncExternalStore(_subscribe, getSnapshot) { return getSnapshot() },
}

const titleNode = {
  textContent: 'Hacia lo desconocido',
  attributes: new Map(),
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null },
  setAttribute(name, value) { this.attributes.set(name, String(value)) },
  removeAttribute(name) { this.attributes.delete(name) },
  toggleAttribute(name, force) {
    if (force === undefined) {
      if (this.attributes.has(name)) { this.attributes.delete(name); return false }
      this.attributes.set(name, '')
      return true
    }
    if (force) { this.attributes.set(name, ''); return true }
    this.attributes.delete(name)
    return false
  },
  hasAttribute(name) { return this.attributes.has(name) },
}

const groupNode = {
  attributes: new Map(),
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null },
  setAttribute(name, value) { this.attributes.set(name, String(value)) },
  removeAttribute(name) { this.attributes.delete(name) },
  toggleAttribute(name, force) {
    if (force === undefined) {
      if (this.attributes.has(name)) { this.attributes.delete(name); return false }
      this.attributes.set(name, '')
      return true
    }
    if (force) { this.attributes.set(name, ''); return true }
    this.attributes.delete(name)
    return false
  },
  hasAttribute(name) { return this.attributes.has(name) },
  querySelector(selector) {
    return selector === ':scope > span:first-child' ? titleNode : null
  },
}

const rootProperties = new Map()
const appendedStyles = []
const documentStub = {
  documentElement: {
    style: {
      setProperty(name, value) { rootProperties.set(name, value) },
      removeProperty(name) { rootProperties.delete(name) },
    },
  },
  body: { nodeType: 1 },
  head: { appendChild(element) { appendedStyles.push(element) } },
  createElement() { return { dataset: {}, textContent: '', remove() {} } },
  querySelector(selector) {
    return selector === '[class*="_titleGroup"]' ? groupNode : null
  },
}

globalThis.window = { __ModuleLoader__: { load(definition) { globalThis.__retroPlugin = definition } } }
globalThis.document = documentStub
globalThis.MutationObserver = class {
  observe() {}
  disconnect() {}
}
globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0)
globalThis.cancelAnimationFrame = (id) => clearTimeout(id)

let preferences = {
  version: 2,
  enabled: true,
  style: 'classic',
  mascot: true,
  animation: true,
  brand: {
    on: true,
    seeded: true,
    sidebarText: 'Retro Lab',
    heroText: 'Hola, mundo',
    sidebarMark: 'custom',
    heroMark: 'custom',
    markScale: 1.25,
    font: 'neon',
    badge: false,
    asset: { url: '/dsh-retro-ai-os/assets/brand-2bf9748bd98b4061.png', label: 'logo.png' },
  },
}

globalThis.fetch = async (url, options = {}) => {
  const method = options.method || 'GET'
  if (url.endsWith('/preferences') && method === 'GET') {
    return { ok: true, json: async () => ({ ok: true, data: preferences }) }
  }
  if (url.endsWith('/preferences') && method === 'POST') {
    preferences = { ...preferences, ...JSON.parse(options.body) }
    return { ok: true, json: async () => ({ ok: true, data: preferences }) }
  }
  throw new Error('unexpected fetch: ' + method + ' ' + url)
}

const ctx = {
  effect(callback) {
    const dispose = callback()
    return () => { if (typeof dispose === 'function') dispose() }
  },
  locale: {
    register() { return () => {} },
    bind() { return (key) => key },
  },
  theme: { overrideTokens(_source, tokens) { tokenLayers.push(tokens); return () => {} } },
  logger: { warn(message) { warnings.push(message) } },
  slots: {
    inject(key, callback) {
      registeredKeys.push(key)
      const dispose = callback()
      return () => { if (typeof dispose === 'function') dispose() }
    },
    register(options, component) {
      registered.push({ options, component })
      return () => {
        const index = registered.findIndex((entry) => entry.component === component)
        if (index >= 0) registered.splice(index, 1)
      }
    },
  },
}

const clientPath = new URL('../client.js', import.meta.url).href
await import(clientPath + '?smoke=' + Date.now())
assert.ok(globalThis.__retroPlugin, 'the module loader received the definition')

const plugin = globalThis.__retroPlugin.factory((id) => {
  if (id === 'react') return React
  if (id === '@deepseek-ai/dsh-client-ui-primitives') {
    return { FishLogo: (props) => React.createElement('svg', { ...props, 'data-fish': '' }) }
  }
  throw new Error('unexpected module: ' + id)
})
assert.deepEqual(plugin.inject, ['slots', 'theme', 'locale'])
plugin.apply(ctx)

const flush = async () => {
  for (let i = 0; i < 6; i += 1) await new Promise((resolve) => setTimeout(resolve, 0))
}

const settle = async () => {
  await new Promise((resolve) => setTimeout(resolve, 600))
  await flush()
}
await flush()

// The token layer keeps labels readable on bright accent fills: paper on the
// dark-brand light palettes, ink on the light-brand dark palettes.
const tokenLayer = tokenLayers[0]
assert.ok(tokenLayer, 'token layer installed')
assert.deepEqual(tokenLayer['--dsw-alias-label-primary-foreground'], { light: '#f4f2df', dark: '#06120c' })
assert.deepEqual(tokenLayer['--dsw-alias-button-primary-fill'], tokenLayer['--dsw-alias-brand-primary'])

// The stylesheet ships the Matrix-only visibility boost for the green marker.
const stylesheet = appendedStyles.map((element) => element.textContent).join('\n')
assert.match(stylesheet, /\[data-row-key\^="session:"\] \[data-state="done"\]::after\{inset:8%;box-shadow:0 0 0 1px rgba\(3,11,6,\.85\),0 0 7px currentColor\}/)

// Slots: the two marks and the name are registered because the brand is on and
// both surfaces point at the uploaded image.
const names = registered.map((entry) => entry.options.name)
assert.ok(names.includes('sidebar.brand.mark'), 'sidebar mark registered')
assert.ok(names.includes('sidebar.brand.name'), 'sidebar name registered')
assert.ok(names.includes('conversation.hero.brand.mark'), 'hero mark registered')

const byName = (name) => registered.find((entry) => entry.options.name === name).component

// The name occupant renders the custom text in the chosen typeface.
const nameTree = byName('sidebar.brand.name')({})
assert.equal(nameTree.type, 'span')
assert.equal(nameTree.children[0], 'Retro Lab')
assert.match(nameTree.props.style.fontFamily, /Monoton/)

// The custom image is scaled by the shared 125% factor.
const sidebarMark = byName('sidebar.brand.mark')({ size: 24 })
assert.equal(sidebarMark.type, 'img')
assert.equal(sidebarMark.props.width, 30)
assert.equal(sidebarMark.props.height, 30)
const heroMark = byName('conversation.hero.brand.mark')({ size: 34, className: 'fish' })
assert.equal(heroMark.type, 'img')
assert.equal(heroMark.props.width, 43)
assert.match(heroMark.props.className, /retro-brand-logo fish/)

// The headline patch replaced the host copy, hid the badge and set the font.
assert.equal(titleNode.textContent, 'Hola, mundo')
assert.equal(titleNode.getAttribute('data-retro-brand-text'), '')
assert.equal(titleNode.getAttribute('data-retro-original-text'), 'Hacia lo desconocido')
assert.ok(groupNode.hasAttribute('data-retro-hide-badge'))
assert.equal(groupNode.hasAttribute('data-retro-hide-text'), false)
assert.match(rootProperties.get('--retro-brand-font'), /Monoton/)
assert.equal(rootProperties.get('--retro-brand-scale'), '0.96')

// Find and expand the settings page, then the brand card inside it.
const settings = registered.find((entry) => entry.options.name === 'settings.section')
assert.ok(settings, 'settings page registered')

function expand(node) {
  if (node === null || node === undefined || node === false || node === true) return null
  if (Array.isArray(node)) return node.map(expand)
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (typeof node.type === 'function') return expand(node.type({ ...node.props, children: node.children }))
  return {
    type: typeof node.type === 'symbol' ? 'Fragment' : String(node.type),
    props: node.props,
    children: node.children.map(expand),
  }
}

function textOf(tree) {
  if (tree === null || tree === undefined) return ''
  if (typeof tree === 'string') return tree
  if (Array.isArray(tree)) return tree.map(textOf).join(' ')
  return textOf(tree.children)
}

function findBy(tree, predicate, found = []) {
  if (tree === null || tree === undefined) return found
  if (Array.isArray(tree)) { for (const child of tree) findBy(child, predicate, found); return found }
  if (typeof tree === 'string') return found
  if (predicate(tree)) found.push(tree)
  for (const child of tree.children) findBy(child, predicate, found)
  return found
}

const page = expand(settings.component({}))
assert.match(textOf(page), /Hola, mundo/)
assert.match(textOf(page), /Retro Lab/)
assert.match(textOf(page), /brandCard/)
assert.match(textOf(page), /brand.font.neon/)
assert.match(textOf(page), /brand.mark.custom/)

const inputs = findBy(page, (node) => node.props && node.props.className === 'retro-input')
assert.equal(inputs.length, 2)
const heroInput = inputs[1]
assert.equal(heroInput.props.value, 'Hola, mundo')
heroInput.props.onChange({ target: { value: 'Nueva portada' } })
await flush()
assert.equal(titleNode.textContent, 'Nueva portada')

// Clearing the sidebar text hides the wordmark but keeps the occupant
// registered, so the stock brand never comes back on its own.
const pageEmptySidebar = expand(settings.component({}))
const sidebarInput = findBy(pageEmptySidebar, (node) => node.props && node.props.className === 'retro-input')[0]
sidebarInput.props.onChange({ target: { value: '' } })
await settle()
assert.ok(registered.some((entry) => entry.options.name === 'sidebar.brand.name'))
assert.equal(byName('sidebar.brand.name')({}), null)

// Hiding the headline text toggles the host rule attribute.
const pageWithNewText = expand(settings.component({}))
const refreshedInputs = findBy(pageWithNewText, (node) => node.props && node.props.className === 'retro-input')
refreshedInputs[1].props.onChange({ target: { value: '' } })
await settle()
assert.ok(groupNode.hasAttribute('data-retro-hide-text'))
assert.equal(preferences.brand.heroText, '')

// The logo slider resizes both custom marks and persists the new factor.
const pageWithSlider = expand(settings.component({}))
const sliders = findBy(pageWithSlider, (node) => node.type === 'input' && node.props && node.props.type === 'range')
assert.equal(sliders.length, 1)
assert.equal(sliders[0].props.value, 125)
assert.equal(sliders[0].props['aria-valuetext'], '125 %')
sliders[0].props.onChange({ target: { value: '80' } })
await settle()
assert.equal(preferences.brand.markScale, 0.8)
assert.equal(byName('sidebar.brand.mark')({ size: 24 }).props.width, 19)
assert.equal(byName('conversation.hero.brand.mark')({ size: 34 }).props.width, 27)

// The badge switch brings the host badge back.
const pageHidden = expand(settings.component({}))
const switches = findBy(pageHidden, (node) => node.props && node.props.role === 'switch')
assert.ok(switches.length >= 4)
const badgeSwitch = switches.find((node) => node.props['aria-label'] === 'brand.badge.label')
assert.ok(badgeSwitch, 'badge switch found')
badgeSwitch.props.onClick()
await settle()
assert.equal(groupNode.hasAttribute('data-retro-hide-badge'), false)

// Turning the brand off restores the host headline and drops the slots.
const pageOff = expand(settings.component({}))
const brandSwitch = findBy(pageOff, (node) => node.props && node.props.role === 'switch' && node.props['aria-label'] === 'brand.on.label')[0]
brandSwitch.props.onClick()
await settle()
assert.equal(titleNode.textContent, 'Hacia lo desconocido')
assert.equal(titleNode.getAttribute('data-retro-brand-text'), null)
assert.equal(groupNode.hasAttribute('data-retro-hide-text'), false)
assert.equal(registered.some((entry) => entry.options.name === 'sidebar.brand.name'), false)
assert.equal(rootProperties.has('--retro-brand-font'), false)

assert.deepEqual(warnings, [])
console.log('Client smoke OK')
