/**
 * Checks for the DSH Hide Updates bundle.
 *
 * Runs the Client half in a VM with a minimal `window`/`document` stub and
 * asserts that it owns exactly one stylesheet, hides both shipped update
 * affordances, and removes the stylesheet on disposal. It also validates the
 * bundle manifest, patch, display metadata, and icon without touching the
 * running Harness.
 *
 * Usage: node test/check.mjs
 */
import { readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const failures = []

/** Record one assertion. */
function check(condition, message) {
  if (!condition) failures.push(message)
}

/** Read text relative to the package root. */
function read(relative) {
  return readFileSync(join(root, relative), 'utf8')
}

// --- Manifest -------------------------------------------------------------

const manifest = JSON.parse(read('package.json'))
check(manifest.name === '@local/hide-updates', 'package name must be @local/hide-updates')
check(manifest.private === true, 'package must stay private')
check(manifest.type === 'module', 'package must be an ES module')
check(manifest.exports?.['.'] === './index.js', 'root export must point at index.js')
check(manifest.exports?.['./client'] === './client.js', 'client export must point at client.js')
check(manifest.exports?.['./icon'] === './icon.svg', 'icon export must point at icon.svg')
check(manifest.exports?.['./locale/*.json'] === './locale/*.json', 'locale export must expose locale JSON')
check(manifest.dsh?.bundle?.patch === './cordis.patch.yml', 'bundle patch must be declared')
check(manifest.dsh?.client?.platform === 'web', 'client platform must be web')
check(manifest.dsh?.client?.immediately === true, 'client half must load immediately')
check(
  Array.isArray(manifest.dsh?.client?.inject)
    && manifest.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-settings-general'),
  'client half must load after the settings shell that owns the update UI',
)
check(
  Array.isArray(manifest.files)
    && ['index.js', 'client.js', 'cordis.patch.yml', 'icon.svg'].every(file => manifest.files.includes(file)),
  'files must list every runtime asset',
)
const files = manifest.files ?? []
check(files.includes('locale/*.json'), 'files must include the locale dictionaries')
for (const entry of files) {
  if (entry.includes('*')) continue
  check(statSync(join(root, entry)).isFile(), `declared file is missing: ${entry}`)
}

// --- Patch ----------------------------------------------------------------

const patch = read('cordis.patch.yml')
check(/- insert:/.test(patch), 'patch must insert the bundle row')
check(/id: hide-updates/.test(patch), 'patch row id must be hide-updates')
check(/name: '@local\/hide-updates'/.test(patch), 'patch row must use the package name')

// --- Display metadata -----------------------------------------------------

for (const locale of ['en', 'es']) {
  const dict = JSON.parse(read(`locale/${locale}.json`))
  const title = dict.meta?.title
  const description = dict.meta?.description
  check(typeof title === 'string' && title.trim().length > 3, `${locale}: meta.title is missing`)
  check(typeof description === 'string' && description.trim().length > 20, `${locale}: meta.description is missing`)
  check(!/My decoration/i.test(`${title} ${description}`), `${locale}: template copy was left behind`)
}

// --- Icon -----------------------------------------------------------------

const icon = read('icon.svg')
check(/^<svg[\s>]/.test(icon.trim()), 'icon must be an SVG document')
check(icon.includes('viewBox='), 'icon must declare a viewBox')
check(statSync(join(root, 'icon.svg')).size <= 256 * 1024, 'icon must stay under 256 KiB')

// --- Client half ----------------------------------------------------------

const appended = []
const removed = []
const document = {
  head: {
    append(node) {
      appended.push(node)
    },
  },
  createElement(tag) {
    return {
      tagName: tag,
      id: '',
      textContent: '',
      remove() {
        removed.push(this)
      },
    }
  },
}
let definition
const context = {
  window: {
    __ModuleLoader__: {
      load(value) {
        definition = value
      },
    },
  },
  document,
  console,
}
vm.runInNewContext(read('client.js'), context, { filename: 'client.js' })

check(definition?.id === '@local/hide-updates', 'client module id must match the package name')
check(typeof definition?.factory === 'function', 'client module must expose a factory')
const plugin = definition.factory()
check(Array.isArray(plugin.inject), 'client plugin must declare inject')
check(typeof plugin.apply === 'function', 'client plugin must expose apply')

const effects = []
plugin.apply({
  effect(fn, label) {
    effects.push({ fn, label })
  },
})
check(effects.length === 1, 'client plugin must register exactly one effect')
check(/stylesheet/.test(effects[0].label ?? ''), 'effect must be labelled as the stylesheet')

const dispose = effects[0].fn()
check(appended.length === 1, 'effect must append exactly one stylesheet')
const style = appended[0]
check(style.tagName === 'style', 'appended node must be a style element')
check(style.id === 'dsh-hide-updates-style', 'stylesheet must carry the stable id')
const css = style.textContent

check(css.includes('[class*="_triggerRow"] button[class*="_indicator"][aria-disabled]'), 'CSS must hide the settings-row update button')
check(css.includes('[class*="_railRow"] button[class*="_indicator"][aria-disabled]'), 'CSS must hide the rail variant of the update button')
check(css.includes('[data-slot="sidebar.toggle.badge"] [role="img"]'), 'CSS must hide the collapsed-sidebar update badge glyph')
check(!css.includes('span[role="img"]'), 'CSS must not hide badges outside the update badge slot')
check(!css.includes('settings.section'), 'CSS must not touch Settings sections')
check(!css.includes('sidebar.footer.action'), 'CSS must not hide unrelated sidebar-foot actions')
check(!css.includes('connection'), 'CSS must not hide the connection indicator')
check((css.match(/display:\s*none\s*!important/g) ?? []).length >= 2, 'both affordances must be hidden')

check(typeof dispose === 'function', 'effect must return a disposer')
dispose()
check(removed.includes(style), 'disposer must remove the stylesheet')

// --- Report ---------------------------------------------------------------

if (failures.length > 0) {
  console.error(`hide-updates check: ${failures.length} failure(s)`)
  for (const failure of failures) console.error(` - ${failure}`)
  process.exit(1)
}
console.log('hide-updates check: ok (manifest, patch, locale, icon, client stylesheet)')
