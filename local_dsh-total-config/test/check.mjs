/**
 * Checks for DHS Total Config.
 *
 * Validates the bundle manifest, the composition patch, the display resources,
 * both halves' syntax, and the Host behaviors that do not need a live Harness:
 * the settings document, the previous DSH Config migration, the workspace store,
 * every feature gate on the routes, and the Plugin Manager bridge used by the
 * "Hide DeepSeek defaults" switch.
 */

import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root = new URL('../', import.meta.url)
const rootPath = root.pathname

let failures = 0
function check(name, condition) {
  if (condition) {
    console.log(`  ok  ${name}`)
    return
  }
  failures += 1
  console.error(`  FAIL ${name}`)
}

// ---------------------------------------------------------------------------
// Manifest, patch, locale and icon
// ---------------------------------------------------------------------------

const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'))
check('manifest installs a bundle patch', manifest.dsh?.bundle?.patch === './cordis.patch.yml')
check('manifest declares the client half', manifest.dsh?.client?.platform === 'web')
check('manifest exports the client', manifest.exports?.['./client'] === './client.js')
check('manifest exports the locale files', manifest.exports?.['./locale/*.json'] === './locale/*.json')
check('manifest exports the icon', manifest.exports?.['./icon'] === './icon.svg')
for (const file of ['index.js', 'github.js', 'client.js', 'cordis.patch.yml', 'icon.svg', 'README.md']) {
  check(`files lists ${file}`, Array.isArray(manifest.files) && manifest.files.includes(file))
}
check('client injects the Settings UI', manifest.dsh?.client?.inject?.includes('@deepseek-ai/dsh-client-ui-settings'))
check('client injects the workspace UI', manifest.dsh?.client?.inject?.includes('@deepseek-ai/dsh-client-ui-workspace'))

const patch = await readFile(new URL('cordis.patch.yml', root), 'utf8')
for (const row of ['llm-deepseek', 'llm-deepseek-account', 'ui-settings-account']) {
  const disabled = new RegExp(`(?:^|\\n)- id: ${row}\\n\\s+disabled: true(?:\\n|$)`)
  check(`patch disables ${row}`, disabled.test(patch))
}
check('patch inserts the plugin row', /- insert:\s*\n\s+- id: dsh-total-config\s*\n\s+name: '@local\/dsh-total-config'/.test(patch))

for (const locale of ['en', 'es']) {
  const document = JSON.parse(await readFile(new URL(`locale/${locale}.json`, root), 'utf8'))
  for (const field of ['title', 'description']) {
    check(`locale/${locale}.json has meta.${field}`, typeof document.meta?.[field] === 'string' && document.meta[field].length > 0)
  }
}

const icon = await readFile(new URL('icon.svg', root), 'utf8')
check('icon.svg is an SVG document', icon.includes('<svg') && icon.includes('</svg>') && icon.includes('viewBox'))

// ---------------------------------------------------------------------------
// Syntax of both halves
// ---------------------------------------------------------------------------

const { promisify } = await import('node:util')
const run = promisify(execFile)
for (const file of ['index.js', 'client.js', 'github.js']) {
  let parsed = true
  try {
    await run(process.execPath, ['--check', join(rootPath, file)])
  } catch {
    parsed = false
  }
  check(`${file} parses`, parsed)
}
const clientSource = await readFile(new URL('client.js', root), 'utf8')
check('client registers the bundled module id', clientSource.includes("id: '@local/dsh-total-config'"))
check('client registers the DHS Total Config page', clientSource.includes("id: 'dsh-total-config'"))
check('client has no leftover workspace-context module id', !clientSource.includes("'@local/workspace-context'"))
check('client has no leftover dsh-config module id', !clientSource.includes("'@local/dsh-config'"))
check('client declares the session selection feature', clientSource.includes('sessionMultiSelect: true'))

// ---------------------------------------------------------------------------
// Host behavior in an isolated DSH_HOME
// ---------------------------------------------------------------------------

const home = await mkdtemp(join(tmpdir(), 'dsh-total-config-'))
const previousHome = process.env.DSH_HOME
process.env.DSH_HOME = home

try {
  const host = await import('../index.js')
  check('exports the expected services', Array.isArray(host.inject) && host.inject.includes('webServer'))
  check('features start enabled', Object.values(host.FEATURES).every((value) => value === true))
  check('ten switches are declared', Object.keys(host.FEATURES).length === 10)

  const fresh = host.readSettings()
  check('a missing document reads as defaults', fresh.settingsOrder.length === 0 && fresh.features.workspaceContext === true)
  check('the store lives under dsh-total-config', host.storeFile().startsWith(join(home, 'dsh-total-config')))

  // The previous DSH Config document seeds the order and the three shared switches.
  await mkdir(join(home, 'dsh-config'), { recursive: true })
  await writeFile(join(home, 'dsh-config', 'settings.json'), JSON.stringify({
    version: 1,
    settingsOrder: ['models', 'general'],
    features: { reorderSections: false, githubFolders: true, hideDefaultEffort: false },
  }))
  const migrated = host.readSettings()
  check('the previous order is migrated', migrated.settingsOrder.join(',') === 'models,general')
  check('the previous shared switches are migrated', migrated.features.reorderSections === false && migrated.features.hideDefaultEffort === false)
  check('the new switches keep their defaults', migrated.features.workspaceContext === true && migrated.features.defaultModel === true && migrated.features.sessionMultiSelect === true)

  const stored = host.writeSettings({ features: { ...migrated.features, hideUpdates: false } })
  check('writeSettings persists the switch', stored.features.hideUpdates === false)
  check('readSettings returns the stored document', host.readSettings().features.hideUpdates === false)
  check('settings are written with owner-only mode', (await readFile(host.storeFile(), 'utf8')).includes('"version": 1'))

  let rejected = false
  try {
    host.writeSettings({ features: { ...stored.features, hideUpdates: 'yes' } })
  } catch (error) {
    rejected = error.code === 'invalid-feature'
  }
  check('a non-boolean switch is rejected', rejected)

  const ignored = host.writeSettings({ features: { ...stored.features, unknownSwitch: true } })
  check('an unknown switch is ignored', !('unknownSwitch' in ignored.features))

  let invalidOrder = false
  try {
    host.writeSettings({ settingsOrder: [42] })
  } catch (error) {
    invalidOrder = error.code === 'invalid-order-entry'
  }
  check('an invalid category order is rejected', invalidOrder)

  // -------------------------------------------------------------------------
  // Workspace store
  // -------------------------------------------------------------------------
  const folder = realpathSync(home)
  const store = new host.WorkspaceContextStore()
  const saved = store.saveWorkspace('workspace-1', {
    description: 'Project notes',
    systemPrompt: 'Answer briefly.',
    color: '#112233',
    icon: 'code',
    entries: [{ kind: 'folder', path: folder, name: 'home' }],
  }, { path: folder, title: 'Home' })
  check('a workspace record round-trips', saved.description === 'Project notes' && saved.entries.length === 1)
  check('appearance is normalized', saved.color === '#112233' && saved.icon === 'code')
  check('the workspace document is written', (await readFile(host.workspaceFile(), 'utf8')).includes('workspace-1'))

  let missingFolder = false
  try {
    store.saveWorkspace('workspace-1', {
      description: '',
      systemPrompt: '',
      entries: [{ kind: 'folder', path: join(home, 'does-not-exist'), name: 'gone' }],
    }, { path: folder, title: 'Home' })
  } catch (error) {
    missingFolder = error.code === 'folder-missing'
  }
  check('a missing context folder is refused', missingFolder)

  const sessionEntries = store.addSessionFolder('session-1', folder)
  check('a session folder is added', sessionEntries.length === 1)
  check('the session folder is removable', store.removeSessionEntry('session-1', sessionEntries[0].id).length === 0)
  check('stats counts the saved records', store.stats().workspaces === 1)

  // -------------------------------------------------------------------------
  // Routes
  // -------------------------------------------------------------------------
  const makeRequest = (url, method = 'GET', body, authorized = true) => {
    const chunks = body === undefined ? [] : [Buffer.from(JSON.stringify(body))]
    return {
      headers: { host: 'localhost', ...(authorized ? { 'x-dsh-total-config': '1' } : {}) },
      method,
      url,
      async *[Symbol.asyncIterator]() {
        for (const chunk of chunks) yield chunk
      },
    }
  }
  const makeResponse = () => {
    const result = { status: 0, body: '', headers: null }
    return {
      writeHead(status, headers) {
        result.status = status
        result.headers = headers
      },
      end(body) {
        result.body = body ?? ''
      },
      result,
    }
  }
  const call = async (url, method = 'GET', body, ctx = { get: () => undefined, logger: { warn: () => {} } }) => {
    const response = makeResponse()
    await host.handleRequest(ctx, { pinned: undefined }, store, makeRequest(url, method, body), response)
    let payload = null
    try {
      payload = JSON.parse(response.result.body)
    } catch {
      payload = null
    }
    return { status: response.result.status, payload }
  }

  const unauthorized = makeResponse()
  await host.handleRequest({ get: () => undefined }, { pinned: undefined }, store, makeRequest('/settings', 'GET', undefined, false), unauthorized)
  check('a request without the header is refused', unauthorized.result.status === 403)

  const readRoute = await call('/settings')
  check('GET /settings answers the stored document', readRoute.status === 200 && readRoute.payload.data.features.hideUpdates === false)

  const writeRoute = await call('/settings', 'POST', { features: { workspaceContext: false } })
  check('POST /settings updates the switch', writeRoute.status === 200 && host.readSettings().features.workspaceContext === false)

  const gatedWorkspace = await call('/workspace/state?workspaceId=workspace-1')
  check('workspace routes respect the switch', gatedWorkspace.status === 403 && gatedWorkspace.payload.error === 'feature-disabled')

  await call('/settings', 'POST', { features: { workspaceContext: true, githubFolders: false } })
  const gatedGithub = await call('/github', 'POST', { url: 'https://github.com/owner/repo/tree/main/folder' })
  check('GitHub installs respect the switch', gatedGithub.status === 403 && gatedGithub.payload.error === 'feature-disabled')

  await call('/settings', 'POST', { features: { defaultModel: false } })
  const gatedModel = await call('/model/state')
  check('default-model routes respect the switch', gatedModel.status === 403)
  await call('/settings', 'POST', { features: { defaultModel: true } })

  const deepseekRoute = await call('/deepseek')
  check('DeepSeek state degrades without the Plugin Manager', deepseekRoute.status === 200 && deepseekRoute.payload.data.available === false)

  const legacyRoute = await call('/legacy')
  check('legacy state degrades without the Plugin Manager', legacyRoute.status === 200 && legacyRoute.payload.data.available === false)

  // -------------------------------------------------------------------------
  // Plugin Manager bridge, with a fake manager
  // -------------------------------------------------------------------------
  const rows = host.DEEPSEEK_ROWS.map((row) => ({
    entryId: row.id,
    moduleName: row.module,
    enabled: true,
  }))
  const calls = []
  const manager = {
    async listPlugins() {
      return rows.map((row) => ({ ...row }))
    },
    async setPluginEnabled(entryId, enabled) {
      calls.push([entryId, enabled])
      const row = rows.find((candidate) => candidate.entryId === entryId)
      if (row !== undefined) row.enabled = enabled
      return { changed: true, application: 'applied' }
    },
    async listBundles() {
      return [
        { name: '@local/dsh-config', enabled: true },
        { name: '@local/default-model', enabled: false },
        { name: '@local/workspace-context', enabled: true },
      ]
    },
    async setBundleEnabled(name, enabled) {
      calls.push([name, enabled])
      return { changed: true, application: 'applied' }
    },
  }
  const managerContext = { get: (key) => (key === 'pluginManager' ? manager : undefined), logger: { warn: () => {} } }

  const before = await host.deepseekState(managerContext)
  check('the bridge reports the visible rows', before.available === true && before.hidden === false && before.rows.length === 3)

  const hidden = await host.setDeepseekHidden(managerContext, false)
  check('hiding calls the manager for every row', calls.filter(([id]) => id.startsWith('llm-') || id === 'ui-settings-account').length === 3)
  check('hiding reports the rows as hidden', hidden.hidden === true && hidden.reload === true)
  check('hiding reports one changed row per provider', hidden.results.every((result) => result.status === 'changed'))

  const legacy = await host.legacyState(managerContext)
  check('the legacy card lists the installed replaced bundles', legacy.bundles.length === 3 && legacy.bundles.some((bundle) => bundle.enabled === false))
  const disabled = await host.disableLegacy(managerContext, legacy.bundles.map((bundle) => bundle.name))
  check('the enabled legacy bundles are turned off', disabled.results.filter((result) => result.status === 'changed').length === 2)
} finally {
  if (previousHome === undefined) delete process.env.DSH_HOME
  else process.env.DSH_HOME = previousHome
  await rm(home, { recursive: true, force: true })
}

console.log(`\n${failures === 0 ? 'dsh-total-config: ok' : `dsh-total-config: ${failures} failure(s)`}`)
if (failures > 0) process.exit(1)
