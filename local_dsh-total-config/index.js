/**
 * DHS Total Config — Host half.
 *
 * One plugin that owns every durable preference of the capabilities that used
 * to live in five separate bundles: the Settings category order, one switch per
 * behavior, the default model new chats start with, the workspace and session
 * context that rides along as model context, and the bridges that hide or
 * restore the built-in DeepSeek provider rows through the Plugin Manager.
 *
 * The browser half edits all of it over same-origin routes under
 * `/dsh-total-config`; this half stores the preferences in
 * `$DSH_HOME/dsh-total-config/` so they survive page reloads, profile edits and
 * Harness restarts. The documents hold no secrets: they name the same provider,
 * model and workspace ids the GUI already displays.
 *
 * @module @local/dsh-total-config
 */

import { randomBytes, randomUUID } from 'node:crypto'
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { basename, join, relative, sep } from 'node:path'

import { GithubError, resolveGithubFolder } from './github.js'

/** Services this plugin cannot work without. */
export const inject = ['agents', 'agentDefaultModel', 'llm', 'webServer']

/** Same-origin route prefix used by the browser half. */
export const ROUTE = '/dsh-total-config'

/** Custom header that forces a CORS preflight for cross-origin callers. */
const HEADER = 'x-dsh-total-config'

/** Request body ceiling; workspace saves carry file text, so this is generous. */
const MAX_BODY_BYTES = 8 * 1024 * 1024

/** Maximum number of retained Settings category ids. */
const MAX_ORDER_ENTRIES = 128

/** Maximum length of one category id. */
const MAX_ID_LENGTH = 200

/** Longest accepted provider or model id. */
const MAX_ID_LENGTH_MODEL = 200

/** Persisted settings document version. */
const SETTINGS_VERSION = 1

/** Persisted model selection document version. */
const MODEL_VERSION = 1

/** One switch per behavior; every behavior starts enabled. */
export const FEATURES = Object.freeze({
  reorderSections: true,
  githubFolders: true,
  hideDefaultEffort: true,
  defaultModel: true,
  hideUpdates: true,
  hideDeepseekDefaults: true,
  workspaceContext: true,
  workspaceAppearance: true,
  workspaceProjectPage: true,
})

/** The provider rows the "Hide DeepSeek defaults" switch owns, by module name. */
export const DEEPSEEK_ROWS = Object.freeze([
  { id: 'llm-deepseek', module: '@deepseek-ai/dsh-llm-deepseek-api-key' },
  { id: 'llm-deepseek-account', module: '@deepseek-ai/dsh-llm-deepseek-account' },
  { id: 'ui-settings-account', module: '@deepseek-ai/dsh-client-ui-settings-account' },
])

/** Bundles this plugin replaces; the migration card offers to turn them off. */
export const LEGACY_BUNDLES = Object.freeze([
  '@local/dsh-config',
  '@local/default-model',
  '@local/hide-deepseek-defaults',
  '@local/hide-updates',
  '@local/workspace-context',
])

// ---------------------------------------------------------------------------
// Workspace context limits and filters
// ---------------------------------------------------------------------------

/** Text stored for one file entry. */
const MAX_FILE_BYTES = 128 * 1024

/** Total file text stored per Workspace. */
const MAX_WORKSPACE_FILE_BYTES = 3 * 1024 * 1024

/** Entries accepted per Workspace. */
const MAX_ENTRIES = 40

/** Folders accepted per Session context. */
const MAX_SESSION_ENTRIES = 20

/** Characters accepted in the description. */
const MAX_DESCRIPTION = 8_000

/** Characters accepted in the Workspace system prompt. */
const MAX_SYSTEM_PROMPT = 40_000

/** Largest custom icon data URL accepted. */
const MAX_ICON_CHARS = 200_000

/** Shipped workspace icon ids accepted from the browser. */
const PRESET_ICON_IDS = new Set([
  'briefcase',
  'code',
  'book',
  'rocket',
  'star',
  'heart',
  'bolt',
  'globe',
  'flask',
  'terminal',
  'palette',
  'chat',
  'music',
  'camera',
  'lightbulb',
  'flag',
])

/** Model context budget for one assembled section. */
const MAX_CONTEXT_CHARS = 120_000

/** Files read from one folder. */
const MAX_FOLDER_FILES = 80

/** Largest text file read from a folder. */
const MAX_FOLDER_FILE_BYTES = 256 * 1024

/** Folder recursion limit. */
const MAX_FOLDER_DEPTH = 8

/** How long one folder read stays warm. */
const FOLDER_CACHE_MS = 5_000

/** Most Session records retained in the plugin store. */
const MAX_SESSION_RECORDS = 200

/** Directories that never carry useful context and can be huge. */
const SKIP_DIRECTORIES = new Set([
  '.git', '.hg', '.svn', '.cache', '.next', '.nuxt', '.output', '.turbo',
  '.venv', 'venv', 'node_modules', 'bower_components', 'vendor', 'Pods',
  'dist', 'build', 'out', 'coverage', 'target', 'obj', '__pycache__',
  '.idea', '.vscode', '.gradle', '.mvn', '.pnpm-store',
])

/** File names and suffixes that commonly carry credentials. */
const SECRET_FILE = /(^|\.)(env|npmrc|pypirc|netrc|htpasswd|credentials|secrets?)$|\.(pem|key|p12|pfx|jks|keystore|kdbx|asc|gpg)$/i

/** Generated or dependency files that rarely help and can flood the budget. */
const SKIP_FILE = /(^package-lock\.json$|^pnpm-lock\.yaml$|^yarn\.lock$|^bun\.lockb?$|^Cargo\.lock$|^poetry\.lock$|^composer\.lock$|^go\.sum$|^Gemfile\.lock$|\.lock$|\.min\.(?:js|css)$|\.map$|\.snap$|^node_modules$|^package-lock\.json$)/i

/** Inline text decoder that rejects invalid UTF-8. */
const UTF8 = new TextDecoder('utf-8', { fatal: true })

// ---------------------------------------------------------------------------
// Durable paths
// ---------------------------------------------------------------------------

/**
 * Resolve the plugin's durable directory.
 * @returns {string} Absolute directory path.
 */
export function storeDirectory() {
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'dsh-total-config')
}

/**
 * @returns {string} The persisted settings document path.
 */
export function storeFile() {
  return join(storeDirectory(), 'settings.json')
}

/**
 * @returns {string} The persisted workspace context document path.
 */
export function workspaceFile() {
  return join(storeDirectory(), 'workspace.json')
}

/**
 * @returns {string} The persisted default-model document path.
 */
export function modelFile() {
  return join(storeDirectory(), 'default-model.json')
}

/** @returns {string} The previous DSH Config switches, used to seed this plugin once. */
function legacySettingsFile() {
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'dsh-config', 'settings.json')
}

/** @returns {string} The previous workspace context document, used until this plugin saves. */
function legacyWorkspaceFile() {
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'workspace-context', 'context.json')
}

/** @returns {string} The previous default-model document, used until this plugin saves. */
function legacyModelFile() {
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'default-model', 'settings.json')
}

/**
 * Build an error carrying a stable code the browser half can report.
 * @param {string} code Stable error code.
 * @param {number} [status] HTTP status.
 * @param {string} [detail] Optional human detail.
 * @returns {Error & { code: string, status?: number, detail?: string }} The error.
 */
function fail(code, status = 400, detail) {
  const error = new Error(code)
  error.code = code
  error.status = status
  if (detail !== undefined) error.detail = detail
  return error
}

/** @param {unknown} error @returns {string} A readable message. */
function messageOf(error) {
  return error instanceof Error ? error.message : String(error)
}

// ---------------------------------------------------------------------------
// Settings: category order and one switch per behavior
// ---------------------------------------------------------------------------

/**
 * Narrow a submitted category order.
 * @param {unknown} input Untrusted value.
 * @returns {string[]} Unique, non-empty category ids in the submitted order.
 */
function sanitizeOrder(input) {
  if (!Array.isArray(input)) throw fail('invalid-order')
  if (input.length > MAX_ORDER_ENTRIES) throw fail('order-too-long')
  const seen = new Set()
  const order = []
  for (const id of input) {
    if (typeof id !== 'string' || id.length === 0 || id.length > MAX_ID_LENGTH) {
      throw fail('invalid-order-entry')
    }
    if (seen.has(id)) continue
    seen.add(id)
    order.push(id)
  }
  return order
}

/**
 * Narrow the switches of a stored or submitted settings document. Unknown keys
 * are ignored so a newer document stays readable; known keys must be booleans.
 * @param {unknown} input Untrusted value.
 * @returns {Record<string, boolean>} Valid switches.
 */
function sanitizeFeatures(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw fail('invalid-features')
  const features = { ...FEATURES }
  for (const key of Object.keys(FEATURES)) {
    if (input[key] === undefined) continue
    if (typeof input[key] !== 'boolean') throw fail('invalid-feature')
    features[key] = input[key]
  }
  return features
}

/**
 * Narrow a stored or submitted settings document.
 * @param {unknown} input Untrusted value.
 * @returns {{ version: number, settingsOrder: string[], features: Record<string, boolean> }} Valid settings.
 */
function sanitize(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw fail('invalid-settings')
  const order = input.settingsOrder === undefined ? [] : sanitizeOrder(input.settingsOrder)
  const features = input.features === undefined ? { ...FEATURES } : sanitizeFeatures(input.features)
  return { version: SETTINGS_VERSION, settingsOrder: order, features }
}

/**
 * @param {unknown} value Parsed document.
 * @returns {boolean} Whether the document carries the shape this module reads.
 */
function isSettings(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * @returns {{ version: number, settingsOrder: string[], features: Record<string, boolean> }} A fresh default document.
 */
function defaultSettings() {
  return { version: SETTINGS_VERSION, settingsOrder: [], features: { ...FEATURES } }
}

/**
 * Seed this plugin's switches from the previous DSH Config document, so an
 * upgrade keeps the order and the three behaviors the user already chose.
 * @returns {{ version: number, settingsOrder: string[], features: Record<string, boolean> } | undefined} Migrated settings.
 */
function migratedSettings() {
  let parsed
  try {
    parsed = JSON.parse(readFileSync(legacySettingsFile(), 'utf8'))
  } catch {
    return undefined
  }
  if (!isSettings(parsed)) return undefined
  const features = { ...FEATURES }
  if (typeof parsed.features === 'object' && parsed.features !== null && !Array.isArray(parsed.features)) {
    for (const key of ['reorderSections', 'githubFolders', 'hideDefaultEffort']) {
      if (typeof parsed.features[key] === 'boolean') features[key] = parsed.features[key]
    }
  }
  let order = []
  try {
    order = Array.isArray(parsed.settingsOrder) ? sanitizeOrder(parsed.settingsOrder) : []
  } catch {
    order = []
  }
  return { version: SETTINGS_VERSION, settingsOrder: order, features }
}

/**
 * Read the stored settings, tolerating a missing or malformed file.
 * @returns {{ version: number, settingsOrder: string[], features: Record<string, boolean> }} Valid settings.
 */
export function readSettings() {
  let text
  try {
    text = readFileSync(storeFile(), 'utf8')
  } catch {
    return migratedSettings() ?? defaultSettings()
  }
  try {
    return sanitize(JSON.parse(text))
  } catch {
    return defaultSettings()
  }
}

/**
 * Read just the switches, which every feature gate consults per operation.
 * @returns {Record<string, boolean>} Current switches.
 */
export function readFeatures() {
  return readSettings().features
}

/**
 * Write the settings durably: private permissions, temporary file then rename.
 * @param {{ settingsOrder?: string[], features?: Record<string, boolean> }} patch Fields to replace.
 * @returns {{ version: number, settingsOrder: string[], features: Record<string, boolean> }} The stored document.
 */
export function writeSettings(patch) {
  const current = readSettings()
  const next = sanitize({
    version: SETTINGS_VERSION,
    settingsOrder: patch?.settingsOrder ?? current.settingsOrder,
    features: patch?.features ?? current.features,
  })
  mkdirSync(storeDirectory(), { recursive: true, mode: 0o700 })
  const file = storeFile()
  const temporary = `${file}.${randomBytes(4).toString('hex')}.tmp`
  writeFileSync(temporary, `${JSON.stringify(next, undefined, 2)}\n`, { mode: 0o600 })
  try {
    chmodSync(temporary, 0o600)
  } catch {
    // Non-POSIX filesystems keep their default mode.
  }
  renameSync(temporary, file)
  return next
}

// ---------------------------------------------------------------------------
// Default model: one durable selection for chats that have not started a turn
// ---------------------------------------------------------------------------

/**
 * Narrow one selection submitted by the page or read from disk.
 * @param {unknown} input Candidate selection.
 * @returns {{ provider: string, model: string, reasoningEffort?: string }} A detached selection.
 */
export function normalizeSelection(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw fail('invalid-selection')
  const provider = typeof input.provider === 'string' ? input.provider.trim() : ''
  const model = typeof input.model === 'string' ? input.model.trim() : ''
  if (provider === '' || provider.length > MAX_ID_LENGTH_MODEL) throw fail('invalid-selection')
  if (model === '' || model.length > MAX_ID_LENGTH_MODEL) throw fail('invalid-selection')
  const reasoningEffort = input.reasoningEffort
  if (reasoningEffort === undefined) return { provider, model }
  if (typeof reasoningEffort !== 'string') throw fail('invalid-selection')
  const effort = reasoningEffort.trim()
  if (effort === '' || effort.length > MAX_ID_LENGTH_MODEL) throw fail('invalid-selection')
  return { provider, model, reasoningEffort: effort }
}

/**
 * Compare complete selections, treating an absent effort as its own value.
 * @param {{ provider: string, model: string, reasoningEffort?: string } | undefined} left First selection.
 * @param {{ provider: string, model: string, reasoningEffort?: string } | undefined} right Second selection.
 * @returns {boolean} Whether both name the same route and effort.
 */
export function sameSelection(left, right) {
  if (left === undefined || right === undefined) return left === right
  return left.provider === right.provider && left.model === right.model && left.reasoningEffort === right.reasoningEffort
}

/**
 * Parse a stored selection document.
 * @param {string} file Document path.
 * @returns {{ provider: string, model: string, reasoningEffort?: string } | undefined} The stored selection.
 */
function readSelectionFile(file) {
  if (!existsSync(file)) return undefined
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'))
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return undefined
    if (parsed.version !== MODEL_VERSION) return undefined
    return normalizeSelection(parsed.selection)
  } catch {
    return undefined
  }
}

/**
 * Read the pinned selection, tolerating a missing or damaged document and
 * falling back to the previous plugin's document until this plugin saves.
 * @returns {{ provider: string, model: string, reasoningEffort?: string } | undefined} The pinned selection.
 */
export function readPinnedSelection() {
  return readSelectionFile(modelFile()) ?? readSelectionFile(legacyModelFile())
}

/**
 * Persist one pinned selection atomically with owner-only permissions.
 * @param {{ provider: string, model: string, reasoningEffort?: string }} selection Selection to store.
 * @returns {void}
 */
export function writePinnedSelection(selection) {
  const directory = storeDirectory()
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  try {
    chmodSync(directory, 0o700)
  } catch {
    // The directory may be on a file system without POSIX modes.
  }
  const document = JSON.stringify({ version: MODEL_VERSION, selection }, null, 2) + '\n'
  const temporary = `${modelFile()}.${randomBytes(4).toString('hex')}.tmp`
  writeFileSync(temporary, document, { mode: 0o600 })
  renameSync(temporary, modelFile())
  try {
    chmodSync(modelFile(), 0o600)
  } catch {
    // Best effort; the write mode already requested owner-only permissions.
  }
}

/**
 * Adopt the live deployment default when no pin exists yet.
 * @param {import('@deepseek-ai/cordis').Context} ctx Host context.
 * @returns {{ provider: string, model: string, reasoningEffort?: string } | undefined} The adopted selection.
 */
export function adoptCurrentSelection(ctx) {
  try {
    const current = normalizeSelection(ctx.agentDefaultModel.currentSelection())
    try {
      writePinnedSelection(current)
    } catch (error) {
      ctx.logger?.warn?.(`dsh-total-config: the pinned model could not be written: ${messageOf(error)}`)
    }
    return current
  } catch (error) {
    ctx.logger?.warn?.(`dsh-total-config: the deployment default could not be read: ${messageOf(error)}`)
    return undefined
  }
}

/**
 * Project the live LLM registry into the grouped catalog the page selects from.
 * @param {import('@deepseek-ai/cordis').Context['llm']} llm Live LLM registry.
 * @returns {Promise<{ groups: Array<{ id: string, name: string, models: Array<{ id: string, name: string }> }>, failures: Array<{ id: string, name: string, message: string }> }>} Catalog.
 */
export async function buildCatalog(llm) {
  const groups = []
  const failures = []
  for (const provider of llm.listProviders()) {
    try {
      const models = await llm.listModels(provider.id)
      const entries = models.map((model) => ({
        id: model.id,
        name: typeof model.name === 'string' && model.name !== '' ? model.name : model.id,
      }))
      if (entries.length > 0) groups.push({ id: provider.id, name: provider.name ?? provider.id, models: entries })
    } catch (error) {
      failures.push({ id: provider.id, name: provider.name ?? provider.id, message: messageOf(error) })
    }
  }
  return { groups, failures }
}

/**
 * Whether a selection names a currently advertised model.
 * @param {{ groups: Array<{ id: string, models: Array<{ id: string }> }> }} catalog Catalog.
 * @param {{ provider: string, model: string }} selection Candidate.
 * @returns {boolean} Availability.
 */
export function selectionAvailable(catalog, selection) {
  return catalog.groups.some((group) => group.id === selection.provider && group.models.some((model) => model.id === selection.model))
}

/**
 * Whether a live Agent is an ordinary, unstarted chat this pin may prepare.
 * @param {{ session?: { header?: { parentSession?: string, origin?: string, isSeeded?: boolean }, inheritedEventCount?: number, events?: Array<{ type?: string }> } }} agent Candidate Agent.
 * @param {string} source Creation source reported by the Host.
 * @returns {boolean} Eligibility.
 */
export function isEligibleBlank(agent, source) {
  const session = agent?.session
  const header = session?.header
  if (header === undefined) return false
  if (header.parentSession !== undefined) return false
  if (header.origin === 'subagent') return false
  if (header.isSeeded === true) return false
  if ((session.inheritedEventCount ?? 0) > 0) return false
  if (source !== 'startup' && source !== 'resume') return false
  if (!Array.isArray(session.events)) return false
  return !session.events.some((event) => event?.type === 'turn/start')
}

/**
 * Record the pinned selection on one eligible Agent.
 * @param {{ model?: { current?: () => unknown, select?: (selection: object) => void }, session?: object }} agent Eligible Agent.
 * @param {{ provider: string, model: string, reasoningEffort?: string }} pinned Pinned selection.
 * @returns {boolean} Whether a selection was recorded.
 */
export function applyPinnedToAgent(agent, pinned) {
  if (typeof agent?.model?.select !== 'function') return false
  const current = typeof agent.model.current === 'function' ? agent.model.current() : undefined
  if (sameSelection(current, pinned)) return false
  agent.model.select({ ...pinned })
  return true
}

/**
 * Keep every live blank Agent on the pinned model. The GUI reuses one of these
 * as the next new chat without creating another Agent, so saving the default
 * has to reach them directly.
 * @param {import('@deepseek-ai/cordis').Context} ctx Host context.
 * @param {{ provider: string, model: string, reasoningEffort?: string }} pinned Pinned selection.
 * @returns {number} How many sessions were updated.
 */
export function syncBlankSessions(ctx, pinned) {
  let updated = 0
  for (const agent of ctx.agents.list()) {
    try {
      if (!isEligibleBlank(agent, 'resume')) continue
      if (applyPinnedToAgent(agent, pinned)) updated += 1
    } catch (error) {
      ctx.logger?.warn?.(`dsh-total-config: a blank session could not be updated: ${messageOf(error)}`)
    }
  }
  return updated
}

/**
 * Build the default-model page snapshot: the pinned selection plus the live catalog.
 * @param {import('@deepseek-ai/cordis').Context} ctx Host context.
 * @param {{ pinned?: object }} state The route's shared pin fallback.
 * @returns {Promise<object>} Snapshot.
 */
async function modelSnapshot(ctx, state) {
  const catalog = await buildCatalog(ctx.llm)
  const pinned = readPinnedSelection() ?? state.pinned ?? adoptCurrentSelection(ctx)
  return {
    selection: pinned ?? null,
    available: pinned === undefined ? false : selectionAvailable(catalog, pinned),
    groups: catalog.groups,
    failures: catalog.failures,
  }
}

// ---------------------------------------------------------------------------
// Workspace context: durable Workspace and Session context
// ---------------------------------------------------------------------------

/**
 * Read one stored document, tolerating a missing or malformed file.
 * @param {string} file Document path.
 * @returns {{ version: number, workspaces: Record<string, object>, sessions: Record<string, object> } | undefined} Parsed state.
 */
function readStoredDocument(file) {
  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch {
    return undefined
  }
  try {
    const parsed = JSON.parse(text)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return undefined
    const workspaces = typeof parsed.workspaces === 'object' && parsed.workspaces !== null && !Array.isArray(parsed.workspaces)
      ? parsed.workspaces
      : {}
    const sessions = typeof parsed.sessions === 'object' && parsed.sessions !== null && !Array.isArray(parsed.sessions)
      ? parsed.sessions
      : {}
    return { version: 1, workspaces, sessions }
  } catch {
    return undefined
  }
}

/**
 * Read the workspace store, falling back to the previous plugin's document
 * until this plugin saves its own copy.
 * @returns {{ version: number, workspaces: Record<string, object>, sessions: Record<string, object> }} State.
 */
function readWorkspaceDocument() {
  return readStoredDocument(workspaceFile())
    ?? readStoredDocument(legacyWorkspaceFile())
    ?? { version: 1, workspaces: {}, sessions: {} }
}

/**
 * Write the workspace document durably: private permissions, temp file then rename.
 * @param {{ version: number, workspaces: Record<string, object>, sessions: Record<string, object> }} state State to persist.
 */
function writeWorkspaceDocument(state) {
  mkdirSync(storeDirectory(), { recursive: true, mode: 0o700 })
  const file = workspaceFile()
  const temporary = `${file}.${randomBytes(4).toString('hex')}.tmp`
  writeFileSync(temporary, `${JSON.stringify(state, undefined, 2)}\n`, { mode: 0o600 })
  try {
    chmodSync(temporary, 0o600)
  } catch {
    // Non-POSIX filesystems keep their default mode.
  }
  renameSync(temporary, file)
}

/**
 * Canonicalize one folder path and require an existing directory.
 * @param {unknown} value Untrusted path.
 * @returns {{ path: string, name: string }} Canonical folder facts.
 */
function canonicalFolder(value) {
  if (typeof value !== 'string' || value.trim() === '') throw fail('folder-missing')
  let canonical
  try {
    canonical = realpathSync(value.trim())
  } catch {
    throw fail('folder-missing', 400, value.trim())
  }
  let stat
  try {
    stat = statSync(canonical)
  } catch {
    throw fail('folder-missing', 400, canonical)
  }
  if (!stat.isDirectory()) throw fail('folder-not-directory', 400, canonical)
  return { path: canonical, name: basename(canonical) || canonical }
}

/**
 * Normalize one stored entry for the browser without leaking file text.
 * @param {object} entry Stored entry.
 * @returns {object} Public entry.
 */
export function publicEntry(entry) {
  if (entry.kind === 'folder') {
    return { id: entry.id, kind: 'folder', name: entry.name, path: entry.path }
  }
  return { id: entry.id, kind: 'file', name: entry.name, bytes: entry.bytes }
}

/**
 * Normalize one accent color.
 * @param {unknown} value Untrusted color.
 * @returns {string} `#rrggbb`, or an empty string for automatic.
 */
export function normalizeWorkspaceColor(value) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : ''
}

/**
 * Normalize one workspace icon: a shipped icon id, a small raster data URL, or
 * an empty string for the default folder.
 * @param {unknown} value Untrusted icon.
 * @returns {string} Normalized icon.
 */
export function normalizeWorkspaceIcon(value) {
  if (typeof value !== 'string' || value === '') return ''
  if (PRESET_ICON_IDS.has(value)) return value
  if (value.length > MAX_ICON_CHARS) return ''
  return /^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(value) ? value : ''
}

/**
 * Normalize an untrusted Workspace patch.
 * @param {object} input Untrusted patch.
 * @param {object} previous Previous Workspace record.
 * @returns {{ description: string, systemPrompt: string, entries: object[], color: string, icon: string }} Normalized record.
 */
export function normalizeWorkspacePatch(input, previous = { entries: [] }) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw fail('invalid-patch')
  const description = typeof input.description === 'string' ? input.description.slice(0, MAX_DESCRIPTION) : ''
  const systemPrompt = typeof input.systemPrompt === 'string' ? input.systemPrompt.slice(0, MAX_SYSTEM_PROMPT) : ''
  const color = normalizeWorkspaceColor(input.color === undefined ? previous.color : input.color)
  const icon = normalizeWorkspaceIcon(input.icon === undefined ? previous.icon : input.icon)
  const rawEntries = input.entries === undefined ? previous.entries ?? [] : input.entries
  if (!Array.isArray(rawEntries)) throw fail('invalid-patch')
  const previousById = new Map((previous.entries ?? []).map(entry => [entry.id, entry]))
  const entries = []
  const seen = new Set()
  let totalFileBytes = 0
  for (const raw of rawEntries.slice(0, MAX_ENTRIES)) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw fail('invalid-entry')
    if (raw.kind === 'folder') {
      const folder = canonicalFolder(raw.path)
      const key = `folder:${folder.path}`
      if (seen.has(key)) continue
      seen.add(key)
      const known = typeof raw.id === 'string' ? previousById.get(raw.id) : undefined
      entries.push({
        id: typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : randomBytes(8).toString('hex'),
        kind: 'folder',
        path: folder.path,
        name: folder.name,
        addedAt: typeof known?.addedAt === 'string' ? known.addedAt : new Date().toISOString(),
      })
      continue
    }
    if (raw.kind !== 'file') throw fail('invalid-entry')
    const known = typeof raw.id === 'string' ? previousById.get(raw.id) : undefined
    let text = typeof raw.text === 'string' ? raw.text : undefined
    if (text === undefined && known?.kind === 'file') text = known.text
    if (typeof text !== 'string') throw fail('invalid-entry')
    const bytes = Buffer.byteLength(text, 'utf8')
    if (bytes > MAX_FILE_BYTES) throw fail('file-too-large', 400, String(raw.name ?? known?.name ?? ''))
    totalFileBytes += bytes
    if (totalFileBytes > MAX_WORKSPACE_FILE_BYTES) throw fail('workspace-too-large')
    const name = basename(String(raw.name ?? known?.name ?? '').trim()).slice(0, 200)
    if (name === '' || name === '.' || name === '..') throw fail('invalid-entry')
    const key = `file:${name}`
    if (seen.has(key)) continue
    seen.add(key)
    entries.push({
      id: typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : randomBytes(8).toString('hex'),
      kind: 'file',
      name,
      text,
      bytes,
      addedAt: typeof known?.addedAt === 'string' ? known.addedAt : new Date().toISOString(),
    })
  }
  return { description, systemPrompt, entries, color, icon }
}

/**
 * Durable Workspace and Session context store.
 */
export class WorkspaceContextStore {
  constructor() {
    this.state = undefined
  }

  /** @returns {{ version: number, workspaces: Record<string, object>, sessions: Record<string, object> }} Loaded state. */
  load() {
    if (this.state === undefined) this.state = readWorkspaceDocument()
    return this.state
  }

  /** Persist the current state and drop folder reads. */
  persist() {
    writeWorkspaceDocument(this.load())
    clearFolderCache()
  }

  /**
   * Read one Workspace record with defaults. The id is authoritative, but a
   * record saved under an older id for the same canonical path is found too,
   * so re-creating a Workspace does not orphan its context.
   * @param {string} workspaceId Workspace id.
   * @param {string} [workspacePath] Canonical Workspace path.
   * @returns {{ description: string, systemPrompt: string, entries: object[], color: string, icon: string }} Record.
   */
  workspace(workspaceId, workspacePath) {
    const state = this.load()
    let record = state.workspaces[workspaceId]
    if (!isWorkspaceRecord(record) && typeof workspacePath === 'string') {
      record = Object.values(state.workspaces).find(candidate => isWorkspaceRecord(candidate)
        && typeof candidate.path === 'string'
        && sameWorkspacePath(candidate.path, workspacePath))
    }
    if (!isWorkspaceRecord(record)) return { description: '', systemPrompt: '', entries: [], color: '', icon: '' }
    return {
      description: typeof record.description === 'string' ? record.description : '',
      systemPrompt: typeof record.systemPrompt === 'string' ? record.systemPrompt : '',
      entries: Array.isArray(record.entries) ? record.entries.filter(isStoredEntry) : [],
      color: normalizeWorkspaceColor(record.color),
      icon: normalizeWorkspaceIcon(record.icon),
    }
  }

  /**
   * Read one Workspace record as the browser sees it.
   * @param {string} workspaceId Workspace id.
   * @param {string} [workspacePath] Canonical Workspace path.
   * @returns {{ description: string, systemPrompt: string, entries: object[], color: string, icon: string }} Public record.
   */
  publicWorkspace(workspaceId, workspacePath) {
    const record = this.workspace(workspaceId, workspacePath)
    return {
      description: record.description,
      systemPrompt: record.systemPrompt,
      entries: record.entries.map(publicEntry),
      color: record.color,
      icon: record.icon,
    }
  }

  /**
   * Save one Workspace patch. The record carries its canonical path so a later
   * Workspace re-creation with a new id still finds the same context.
   * @param {string} workspaceId Workspace id.
   * @param {object} input Untrusted patch.
   * @param {{ path?: string, title?: string }} [meta] Workspace identity.
   * @returns {{ description: string, systemPrompt: string, entries: object[], color: string, icon: string }} Public record.
   */
  saveWorkspace(workspaceId, input, meta = {}) {
    const state = this.load()
    const previous = this.workspace(workspaceId, meta.path)
    const record = normalizeWorkspacePatch(input, previous)
    if (typeof meta.path === 'string' && meta.path !== '') record.path = meta.path
    if (typeof meta.title === 'string' && meta.title !== '') record.title = meta.title
    if (typeof record.path === 'string' && record.path !== '') {
      for (const [id, candidate] of Object.entries(state.workspaces)) {
        if (id === workspaceId) continue
        if (isWorkspaceRecord(candidate) && typeof candidate.path === 'string' && sameWorkspacePath(candidate.path, record.path)) {
          delete state.workspaces[id]
        }
      }
    }
    state.workspaces[workspaceId] = record
    this.persist()
    return this.publicWorkspace(workspaceId, meta.path)
  }

  /**
   * Read the context folders attached to one Session.
   * @param {string} sessionId Session id.
   * @returns {object[]} Public folder entries.
   */
  sessionEntries(sessionId) {
    const record = this.load().sessions[sessionId]
    if (typeof record !== 'object' || record === null || !Array.isArray(record.entries)) return []
    return record.entries.filter(isStoredEntry).map(publicEntry)
  }

  /**
   * Add one folder to a Session's context.
   * @param {string} sessionId Session id.
   * @param {unknown} path Untrusted folder path.
   * @returns {object[]} Updated public entries.
   */
  addSessionFolder(sessionId, path) {
    const folder = canonicalFolder(path)
    const state = this.load()
    const record = state.sessions[sessionId]
    const entries = Array.isArray(record?.entries) ? record.entries.filter(isStoredEntry) : []
    if (!entries.some(entry => entry.kind === 'folder' && entry.path === folder.path)) {
      if (entries.length >= MAX_SESSION_ENTRIES) throw fail('too-many-session-entries')
      entries.push({
        id: randomBytes(8).toString('hex'),
        kind: 'folder',
        path: folder.path,
        name: folder.name,
        addedAt: new Date().toISOString(),
      })
    }
    state.sessions[sessionId] = { entries, updatedAt: new Date().toISOString() }
    pruneSessions(state.sessions)
    this.persist()
    return this.sessionEntries(sessionId)
  }

  /**
   * Remove one entry from a Session's context.
   * @param {string} sessionId Session id.
   * @param {string} entryId Entry id.
   * @returns {object[]} Updated public entries.
   */
  removeSessionEntry(sessionId, entryId) {
    const state = this.load()
    const record = state.sessions[sessionId]
    if (typeof record !== 'object' || record === null || !Array.isArray(record.entries)) return []
    const entries = record.entries.filter(entry => isStoredEntry(entry) && entry.id !== entryId)
    if (entries.length === 0) delete state.sessions[sessionId]
    else state.sessions[sessionId] = { entries, updatedAt: new Date().toISOString() }
    this.persist()
    return this.sessionEntries(sessionId)
  }

  /** @returns {{ workspaces: number, sessions: number, entries: number }} Counts for the health route. */
  stats() {
    const state = this.load()
    const workspaces = Object.values(state.workspaces).filter(value => typeof value === 'object' && value !== null)
    const sessions = Object.values(state.sessions).filter(value => typeof value === 'object' && value !== null)
    const entries = workspaces.reduce((sum, record) => sum + (Array.isArray(record.entries) ? record.entries.length : 0), 0)
      + sessions.reduce((sum, record) => sum + (Array.isArray(record.entries) ? record.entries.length : 0), 0)
    return { workspaces: workspaces.length, sessions: sessions.length, entries }
  }
}

/**
 * Whether a stored Workspace record carries the minimum shape this module reads.
 * @param {unknown} record Candidate record.
 * @returns {boolean} True for a usable record.
 */
function isWorkspaceRecord(record) {
  return typeof record === 'object' && record !== null && !Array.isArray(record)
}

/**
 * Whether a stored entry carries the minimum shape this module reads.
 * @param {unknown} entry Candidate entry.
 * @returns {boolean} True for a usable entry.
 */
function isStoredEntry(entry) {
  if (typeof entry !== 'object' || entry === null) return false
  if (typeof entry.id !== 'string' || typeof entry.name !== 'string') return false
  if (entry.kind === 'folder') return typeof entry.path === 'string'
  return entry.kind === 'file' && typeof entry.text === 'string'
}

/**
 * Keep the Session record set bounded.
 * @param {Record<string, object>} sessions Session records.
 */
function pruneSessions(sessions) {
  const ids = Object.keys(sessions)
  if (ids.length <= MAX_SESSION_RECORDS) return
  const ordered = ids
    .map(id => ({ id, updatedAt: typeof sessions[id]?.updatedAt === 'string' ? sessions[id].updatedAt : '' }))
    .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt))
  for (const entry of ordered.slice(0, ids.length - MAX_SESSION_RECORDS)) delete sessions[entry.id]
}

/** Folder reads cached for a few seconds so prompt assembly stays cheap. */
let folderCache = new Map()

/** Drop every cached folder read. */
function clearFolderCache() {
  folderCache = new Map()
}

/**
 * Clamp one chunk of context to a character budget.
 * @param {string} text Text to clamp.
 * @param {number} budget Remaining characters.
 * @returns {string} Clamped text.
 */
function clampText(text, budget) {
  if (budget <= 0) return ''
  if (text.length <= budget) return text
  return `${text.slice(0, Math.max(0, budget - 48))}\n[... context truncated at ${budget} characters ...]`
}

/**
 * Read the text of a folder into one context block.
 * @param {string} folderPath Canonical folder path.
 * @returns {string} Folder context text.
 */
function readFolderText(folderPath) {
  const chunks = []
  let files = 0
  let characters = 0
  let omitted = 0
  const visit = (directory, depth) => {
    if (depth > MAX_FOLDER_DEPTH || files >= MAX_FOLDER_FILES || characters >= MAX_CONTEXT_CHARS) return
    let children
    try {
      children = readdirSync(directory, { withFileTypes: true })
    } catch {
      return
    }
    children.sort((left, right) => left.name.localeCompare(right.name))
    for (const child of children) {
      if (files >= MAX_FOLDER_FILES || characters >= MAX_CONTEXT_CHARS) return
      if (child.name.startsWith('.') || SECRET_FILE.test(child.name) || SKIP_FILE.test(child.name)) continue
      if (child.isDirectory() && SKIP_DIRECTORIES.has(child.name)) continue
      const full = join(directory, child.name)
      let stat
      try {
        stat = lstatSync(full)
      } catch {
        continue
      }
      if (stat.isSymbolicLink()) continue
      if (stat.isDirectory()) {
        visit(full, depth + 1)
        continue
      }
      if (!stat.isFile() || stat.size > MAX_FOLDER_FILE_BYTES) {
        if (stat.isFile()) omitted += 1
        continue
      }
      let buffer
      try {
        buffer = readFileSync(full)
      } catch {
        continue
      }
      if (buffer.includes(0)) {
        omitted += 1
        continue
      }
      let text
      try {
        text = UTF8.decode(buffer)
      } catch {
        omitted += 1
        continue
      }
      const relativePath = relative(folderPath, full).split(sep).join('/')
      const block = `--- ${relativePath} (${stat.size} bytes) ---\n${text.replace(/\r\n?/gu, '\n')}\n`
      chunks.push(block)
      characters += block.length
      files += 1
    }
  }
  visit(folderPath, 0)
  if (chunks.length === 0) return '(no readable text files)'
  const tail = omitted > 0 || files >= MAX_FOLDER_FILES || characters >= MAX_CONTEXT_CHARS
    ? `\n[... ${omitted > 0 ? `${omitted} file(s) skipped as binary, secret-shaped, or too large; ` : ''}folder context is capped at ${MAX_FOLDER_FILES} files and ${MAX_CONTEXT_CHARS} characters ...]`
    : ''
  return `${chunks.join('\n')}${tail}`
}

/**
 * Read one folder, using the warm cache when possible.
 * @param {string} folderPath Canonical folder path.
 * @param {number} budget Remaining characters.
 * @returns {string} Clamped folder context.
 */
function folderContext(folderPath, budget) {
  const cached = folderCache.get(folderPath)
  let text
  if (cached !== undefined && Date.now() - cached.at < FOLDER_CACHE_MS) {
    text = cached.text
  } else {
    text = readFolderText(folderPath)
    folderCache.set(folderPath, { at: Date.now(), text })
  }
  return clampText(text, budget)
}

/**
 * Render every entry into the model context string.
 * @param {object[]} entries Workspace entries.
 * @param {number} budget Remaining characters.
 * @param {Set<string>} seen Folder and file keys already rendered.
 * @returns {string} Rendered entries.
 */
function renderEntries(entries, budget, seen) {
  const parts = []
  let remaining = budget
  for (const entry of entries) {
    if (remaining <= 0) {
      parts.push('[... remaining context entries omitted ...]')
      break
    }
    if (entry.kind === 'folder') {
      const key = `folder:${entry.path}`
      if (seen.has(key)) continue
      seen.add(key)
      const body = folderContext(entry.path, Math.min(remaining, MAX_CONTEXT_CHARS) - 256)
      if (body === '') continue
      const block = `#### Folder \`${entry.path}\`\n${body}`
      parts.push(block)
      remaining -= block.length
      continue
    }
    if (entry.kind === 'file') {
      const key = `file:${entry.id}`
      if (seen.has(key)) continue
      seen.add(key)
      const body = clampText(String(entry.text ?? ''), Math.max(0, remaining - 256))
      if (body === '') continue
      const block = `#### File \`${entry.name}\`\n${body}`
      parts.push(block)
      remaining -= block.length
    }
  }
  return parts.join('\n\n')
}

/**
 * Locate the Workspace that owns one Agent.
 * @param {object} agent Live Agent.
 * @param {object} [services] Optional workspace services.
 * @returns {{ workspace?: object, cwd?: string }} Owning Workspace and directory.
 */
export function resolveAgentWorkspace(agent, services = {}) {
  let cwd
  try {
    cwd = services.workingDirectory?.get?.(agent.session)
  } catch {
    cwd = undefined
  }
  if (typeof cwd !== 'string') cwd = agent.session?.header?.cwd
  let workspaces = []
  try {
    workspaces = services.workspaceRegistry?.list?.() ?? []
  } catch {
    workspaces = []
  }
  const bySession = workspaces.find(workspace => Array.isArray(workspace.sessionIds) && workspace.sessionIds.includes(agent.id))
  const byPath = bySession === undefined && typeof cwd === 'string'
    ? workspaces.find(workspace => sameWorkspacePath(workspace.path, cwd))
    : undefined
  return { workspace: bySession ?? byPath, cwd }
}

/**
 * Compare two workspace paths after resolving symlinks, so a session whose
 * directory is spelled through a symlink still inherits its workspace.
 * @param {unknown} left Workspace path.
 * @param {unknown} right Session directory.
 * @returns {boolean} True when both name the same directory.
 */
function sameWorkspacePath(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false
  if (left === right) return true
  try {
    return realpathSync(left) === realpathSync(right)
  } catch {
    return false
  }
}

/**
 * Render the complete model-facing context for one Agent.
 * @param {WorkspaceContextStore} store Context store.
 * @param {object} agent Live Agent.
 * @param {object} [services] Optional workspace services.
 * @returns {string} Prompt section text (empty when nothing is configured).
 */
export function renderContextForAgent(store, agent, services = {}) {
  const { workspace } = resolveAgentWorkspace(agent, services)
  const sessionEntries = store.sessionEntries(agent.id)
  const config = workspace === undefined ? undefined : store.workspace(workspace.id, workspace.path)
  const hasWorkspaceContent = config !== undefined
    && (config.description !== '' || config.systemPrompt !== '' || config.entries.length > 0)
  if (!hasWorkspaceContent && sessionEntries.length === 0) return ''
  const parts = []
  if (workspace !== undefined) {
    parts.push(`Workspace: ${workspace.title} (${workspace.path})`)
  }
  if (config?.description) parts.push(`#### Workspace description\n${config.description}`)
  if (config?.systemPrompt) parts.push(`#### Workspace instructions\n${config.systemPrompt}`)
  const seen = new Set()
  if (config !== undefined && config.entries.length > 0) {
    const rendered = renderEntries(config.entries, MAX_CONTEXT_CHARS, seen)
    if (rendered !== '') parts.push(`#### Workspace context files and folders\n${rendered}`)
  }
  if (sessionEntries.length > 0) {
    const rendered = renderEntries(sessionEntries, MAX_CONTEXT_CHARS, seen)
    if (rendered !== '') parts.push(`#### Folders added to this session\n${rendered}`)
  }
  if (parts.length === 0) return ''
  return `<workspace_context>\n${parts.join('\n\n')}\n</workspace_context>`
}

// ---------------------------------------------------------------------------
// Plugin Manager bridges: DeepSeek rows and the bundles this plugin replaces
// ---------------------------------------------------------------------------

/**
 * Read the live state of the DeepSeek provider rows.
 * @param {import('@deepseek-ai/cordis').Context} ctx Host context.
 * @returns {Promise<{ available: boolean, hidden: boolean | null, rows: Array<object> }>} Row state.
 */
export async function deepseekState(ctx) {
  const manager = ctx.get('pluginManager')
  if (manager === undefined || manager === null) return { available: false, hidden: null, rows: [] }
  let listed
  try {
    listed = await manager.listPlugins()
  } catch (error) {
    return { available: false, hidden: null, rows: [], message: messageOf(error) }
  }
  const rows = DEEPSEEK_ROWS.map(({ id, module }) => {
    const row = listed.find(candidate => candidate.moduleName === module)
      ?? listed.find(candidate => candidate.entryId === id)
    if (row === undefined) return { id, present: false, enabled: null, patchable: false }
    return {
      id,
      present: true,
      entryId: row.entryId,
      enabled: row.enabled === true,
      patchable: row.readOnlyReason === undefined,
      ...(row.readOnlyReason === undefined ? {} : { reason: row.readOnlyReason }),
    }
  })
  const present = rows.filter(row => row.present)
  return { available: true, hidden: present.length > 0 && present.every(row => row.enabled === false), rows }
}

/**
 * Show or hide the built-in DeepSeek rows through the Plugin Manager, which
 * persists the override in the profile patch and reloads the live rows.
 * @param {import('@deepseek-ai/cordis').Context} ctx Host context.
 * @param {boolean} enabled True restores the rows, false hides them.
 * @returns {Promise<object>} What changed and the resulting state.
 */
export async function setDeepseekHidden(ctx, enabled) {
  const manager = ctx.get('pluginManager')
  if (manager === undefined || manager === null) throw fail('plugins-unavailable', 503)
  const before = await deepseekState(ctx)
  if (!before.available) throw fail('plugins-unavailable', 503)
  const results = []
  for (const row of before.rows) {
    if (!row.present) {
      results.push({ id: row.id, status: 'absent' })
      continue
    }
    if (row.enabled === enabled) {
      results.push({ id: row.id, status: 'unchanged' })
      continue
    }
    if (!row.patchable) {
      results.push({ id: row.id, status: 'read-only', reason: row.reason ?? 'unaddressable' })
      continue
    }
    try {
      const result = await manager.setPluginEnabled(row.entryId, enabled)
      results.push({
        id: row.id,
        status: result.application === 'failed' ? 'failed' : 'changed',
        application: result.application,
        ...(result.error === undefined ? {} : { error: result.error.code ?? 'error' }),
      })
    } catch (error) {
      results.push({ id: row.id, status: 'failed', error: String(error?.code ?? error?.message ?? error) })
    }
  }
  const after = await deepseekState(ctx)
  return {
    enabled: after.hidden !== true,
    hidden: after.hidden,
    rows: after.rows,
    results,
    reload: results.some(result => result.status === 'changed'),
  }
}

/**
 * Read which bundles this plugin replaces and whether they are still on.
 * @param {import('@deepseek-ai/cordis').Context} ctx Host context.
 * @returns {Promise<{ available: boolean, bundles: Array<{ name: string, enabled: boolean, removable: boolean }> }>} Legacy state.
 */
export async function legacyState(ctx) {
  const manager = ctx.get('pluginManager')
  if (manager === undefined || manager === null) return { available: false, bundles: [] }
  let listed
  try {
    listed = await manager.listBundles()
  } catch (error) {
    return { available: false, bundles: [], message: messageOf(error) }
  }
  const bundles = []
  for (const name of LEGACY_BUNDLES) {
    const bundle = listed.find(candidate => candidate.name === name)
    if (bundle === undefined) continue
    bundles.push({
      name,
      enabled: bundle.enabled === true,
      removable: bundle.removable !== false && bundle.readOnlyReason === undefined,
    })
  }
  return { available: true, bundles }
}

/**
 * Turn the bundles this plugin replaces off, leaving them installed so they
 * can be restored from Settings → Plugins.
 * @param {import('@deepseek-ai/cordis').Context} ctx Host context.
 * @param {string[]} names Bundle names to disable.
 * @returns {Promise<{ results: Array<object>, reload: boolean }>} Per-bundle outcome.
 */
export async function disableLegacy(ctx, names) {
  const manager = ctx.get('pluginManager')
  if (manager === undefined || manager === null) throw fail('plugins-unavailable', 503)
  const results = []
  for (const name of LEGACY_BUNDLES) {
    if (!names.includes(name)) continue
    try {
      const bundle = (await manager.listBundles()).find(candidate => candidate.name === name)
      if (bundle === undefined) {
        results.push({ name, status: 'absent' })
        continue
      }
      if (bundle.enabled !== true) {
        results.push({ name, status: 'unchanged' })
        continue
      }
      const result = await manager.setBundleEnabled(name, false)
      results.push({
        name,
        status: result.application === 'failed' ? 'failed' : 'changed',
        application: result.application,
      })
    } catch (error) {
      results.push({ name, status: 'failed', error: String(error?.code ?? error?.message ?? error) })
    }
  }
  return { results, reload: results.some(result => result.status === 'changed') }
}

// ---------------------------------------------------------------------------
// HTTP transport
// ---------------------------------------------------------------------------

/**
 * Read a JSON request body with a size ceiling.
 * @param {import('node:http').IncomingMessage} request Incoming request.
 * @returns {Promise<Record<string, unknown>>} Parsed body.
 */
async function readJsonBody(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw fail('body-too-large', 413)
    chunks.push(chunk)
  }
  if (size === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw fail('invalid-json')
  }
}

/**
 * Resolve one Workspace in the shape this module reports.
 * @param {import('@deepseek-ai/cordis').Context} ctx Host context.
 * @param {string} workspaceId Workspace id.
 * @returns {{ id: string, path: string, title: string } | undefined} Workspace facts.
 */
function lookupWorkspace(ctx, workspaceId) {
  if (typeof workspaceId !== 'string' || workspaceId === '') return undefined
  try {
    const workspace = ctx.get('workspaceRegistry')?.get?.(workspaceId)
    return workspace === undefined
      ? undefined
      : { id: workspace.id, path: workspace.path, title: workspace.title }
  } catch {
    return undefined
  }
}

/**
 * Resolve the Workspace that owns one Session, matching the registry's own
 * membership list.
 * @param {import('@deepseek-ai/cordis').Context} ctx Host context.
 * @param {string} sessionId Session id.
 * @returns {{ id: string, path: string, title: string } | undefined} Workspace facts.
 */
function lookupWorkspaceForSession(ctx, sessionId) {
  if (typeof sessionId !== 'string' || sessionId === '') return undefined
  try {
    const workspace = ctx.get('workspaceRegistry')?.list?.()
      ?.find(candidate => Array.isArray(candidate.sessionIds) && candidate.sessionIds.includes(sessionId))
    return workspace === undefined
      ? undefined
      : { id: workspace.id, path: workspace.path, title: workspace.title }
  } catch {
    return undefined
  }
}

/**
 * List every registered Workspace in the shape this module reports.
 * @param {import('@deepseek-ai/cordis').Context} ctx Host context.
 * @returns {Array<{ id: string, path: string, title: string }>} Workspaces.
 */
function lookupWorkspaces(ctx) {
  try {
    return (ctx.get('workspaceRegistry')?.list?.() ?? [])
      .filter(workspace => typeof workspace?.id === 'string' && workspace.id !== '')
      .map(workspace => ({ id: workspace.id, path: workspace.path, title: workspace.title }))
  } catch {
    return []
  }
}

/**
 * Answer one request from the browser half.
 * @param {import('@deepseek-ai/cordis').Context} ctx Host context.
 * @param {object} state Route state.
 * @param {WorkspaceContextStore} store Context store.
 * @param {import('node:http').IncomingMessage} request Incoming request.
 * @param {import('node:http').ServerResponse} response Outgoing response.
 * @returns {Promise<void>} Resolves when the response ends.
 */
export async function handleRequest(ctx, state, store, request, response) {
  const reply = (status, payload) => {
    const body = JSON.stringify(payload)
    response.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'content-length': Buffer.byteLength(body),
    })
    response.end(body)
  }
  try {
    if (request.headers[HEADER] !== '1') {
      reply(403, { ok: false, error: 'unauthorized' })
      return
    }
    const url = new URL(request.url ?? ROUTE, `http://${request.headers.host ?? 'localhost'}`)
    const path = url.pathname.startsWith(ROUTE) ? url.pathname.slice(ROUTE.length) : url.pathname
    const method = request.method ?? 'GET'
    const features = readFeatures()

    if (path === '/settings' && method === 'GET') {
      reply(200, { ok: true, data: readSettings() })
      return
    }

    if (path === '/settings' && method === 'POST') {
      const body = await readJsonBody(request)
      const patch = {}
      if (body.settingsOrder !== undefined) patch.settingsOrder = sanitizeOrder(body.settingsOrder)
      if (body.features !== undefined) {
        if (typeof body.features !== 'object' || body.features === null || Array.isArray(body.features)) {
          throw fail('invalid-features')
        }
        patch.features = sanitizeFeatures({ ...readSettings().features, ...body.features })
      }
      reply(200, { ok: true, data: writeSettings(patch) })
      return
    }

    if (path === '/github' && method === 'POST') {
      if (!features.githubFolders) throw fail('feature-disabled', 403)
      const body = await readJsonBody(request)
      if (typeof body.url !== 'string' || body.url.trim() === '') {
        throw new GithubError('invalid-url', 400, 'The GitHub folder URL is required.')
      }
      const folder = await resolveGithubFolder({
        url: body.url,
        cacheRoot: join(storeDirectory(), 'github'),
      })
      reply(200, { ok: true, data: folder })
      return
    }

    if (path === '/model/state' && method === 'GET') {
      if (!features.defaultModel) throw fail('feature-disabled', 403)
      reply(200, { ok: true, data: await modelSnapshot(ctx, state) })
      return
    }

    if (path === '/model/selection' && method === 'POST') {
      if (!features.defaultModel) throw fail('feature-disabled', 403)
      const body = await readJsonBody(request)
      const selection = normalizeSelection(body)
      const catalog = await buildCatalog(ctx.llm)
      if (!selectionAvailable(catalog, selection)) {
        throw fail('invalid-model', 400, `provider "${selection.provider}" does not advertise model "${selection.model}"`)
      }
      writePinnedSelection(selection)
      state.pinned = selection
      try {
        await ctx.agentDefaultModel.saveSelection(selection)
      } catch (error) {
        ctx.logger?.warn?.(`dsh-total-config: the deployment default was not saved: ${messageOf(error)}`)
      }
      const updated = syncBlankSessions(ctx, selection)
      reply(200, {
        ok: true,
        data: {
          selection,
          available: true,
          groups: catalog.groups,
          failures: catalog.failures,
          updated,
        },
      })
      return
    }

    if (path === '/workspaces/health' && method === 'GET') {
      if (!features.workspaceContext) throw fail('feature-disabled', 403)
      reply(200, { ok: true, data: store.stats() })
      return
    }

    if (path === '/workspaces/presentation' && method === 'GET') {
      if (!features.workspaceContext) throw fail('feature-disabled', 403)
      const workspaces = []
      for (const workspace of lookupWorkspaces(ctx)) {
        const record = store.workspace(workspace.id, workspace.path)
        if (record.color === '' && record.icon === '') continue
        workspaces.push({
          workspaceId: workspace.id,
          title: typeof workspace.title === 'string' ? workspace.title : '',
          path: typeof workspace.path === 'string' ? workspace.path : '',
          color: record.color,
          icon: record.icon,
        })
      }
      reply(200, { ok: true, data: { workspaces } })
      return
    }

    if (path === '/workspace/state' && method === 'GET') {
      if (!features.workspaceContext) throw fail('feature-disabled', 403)
      const workspaceId = url.searchParams.get('workspaceId') ?? ''
      const workspace = lookupWorkspace(ctx, workspaceId)
      if (workspace === undefined) throw fail('workspace-unknown', 404, workspaceId)
      reply(200, {
        ok: true,
        data: {
          workspace: { workspaceId: workspace.id, title: workspace.title, path: workspace.path },
          config: store.publicWorkspace(workspaceId, workspace.path),
        },
      })
      return
    }

    if (path === '/workspace/save' && method === 'POST') {
      if (!features.workspaceContext) throw fail('feature-disabled', 403)
      const body = await readJsonBody(request)
      const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId : ''
      const workspace = lookupWorkspace(ctx, workspaceId)
      if (workspace === undefined) throw fail('workspace-unknown', 404, workspaceId)
      const config = store.saveWorkspace(workspaceId, body, { path: workspace.path, title: workspace.title })
      reply(200, { ok: true, data: { config } })
      return
    }

    if (path === '/session/context' && method === 'GET') {
      if (!features.workspaceContext) throw fail('feature-disabled', 403)
      const sessionId = url.searchParams.get('sessionId') ?? ''
      if (sessionId === '') throw fail('invalid-session')
      const requestedId = url.searchParams.get('workspaceId') ?? ''
      let workspace = requestedId !== '' ? lookupWorkspace(ctx, requestedId) : undefined
      if (workspace === undefined) workspace = lookupWorkspaceForSession(ctx, sessionId)
      const config = workspace === undefined ? undefined : store.publicWorkspace(workspace.id, workspace.path)
      const workspaceEntries = config?.entries ?? []
      const sessionEntries = store.sessionEntries(sessionId)
      const merged = [
        ...workspaceEntries.map(entry => ({ ...entry, source: 'workspace' })),
        ...sessionEntries.map(entry => ({ ...entry, source: 'session' })),
      ]
      reply(200, {
        ok: true,
        data: {
          workspace: workspace === undefined
            ? null
            : { workspaceId: workspace.id, title: workspace.title, path: workspace.path },
          workspaceEntries,
          sessionEntries,
          merged,
        },
      })
      return
    }

    if (path === '/session' && method === 'GET') {
      if (!features.workspaceContext) throw fail('feature-disabled', 403)
      const sessionId = url.searchParams.get('sessionId') ?? ''
      if (sessionId === '') throw fail('invalid-session')
      reply(200, { ok: true, data: { entries: store.sessionEntries(sessionId) } })
      return
    }

    if (path === '/session/entries' && method === 'POST') {
      if (!features.workspaceContext) throw fail('feature-disabled', 403)
      const body = await readJsonBody(request)
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
      if (sessionId === '') throw fail('invalid-session')
      const entries = store.addSessionFolder(sessionId, body.path)
      reply(200, { ok: true, data: { entries } })
      return
    }

    if (path === '/session/entries/remove' && method === 'POST') {
      if (!features.workspaceContext) throw fail('feature-disabled', 403)
      const body = await readJsonBody(request)
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
      const entryId = typeof body.entryId === 'string' ? body.entryId : ''
      if (sessionId === '' || entryId === '') throw fail('invalid-session')
      const entries = store.removeSessionEntry(sessionId, entryId)
      reply(200, { ok: true, data: { entries } })
      return
    }

    if (path === '/deepseek' && method === 'GET') {
      reply(200, { ok: true, data: await deepseekState(ctx) })
      return
    }

    if (path === '/deepseek' && method === 'POST') {
      const body = await readJsonBody(request)
      if (typeof body.enabled !== 'boolean') throw fail('invalid-request')
      const result = await setDeepseekHidden(ctx, body.enabled)
      reply(200, { ok: true, data: result })
      return
    }

    if (path === '/legacy' && method === 'GET') {
      reply(200, { ok: true, data: await legacyState(ctx) })
      return
    }

    if (path === '/legacy' && method === 'POST') {
      const body = await readJsonBody(request)
      const names = Array.isArray(body.names)
        ? body.names.filter(name => typeof name === 'string' && LEGACY_BUNDLES.includes(name))
        : [...LEGACY_BUNDLES]
      const result = await disableLegacy(ctx, names)
      reply(200, { ok: true, data: result })
      return
    }

    reply(404, { ok: false, error: 'not-found' })
  } catch (error) {
    const status = typeof error?.status === 'number' ? error.status : 500
    try {
      reply(status, {
        ok: false,
        error: typeof error?.code === 'string' ? error.code : 'request-failed',
        ...(typeof error?.detail === 'string' ? { detail: error.detail } : {}),
        ...(typeof error?.message === 'string' && typeof error?.code !== 'string' ? { detail: error.message } : {}),
      })
    } catch {
      // The connection may already be gone.
    }
  }
}

// ---------------------------------------------------------------------------
// Plugin entry
// ---------------------------------------------------------------------------

/**
 * Mount the routes, the workspace prompt section, and the default-model pin.
 * @param {import('@deepseek-ai/cordis').Context} ctx Plugin context.
 * @returns {void}
 */
export function apply(ctx) {
  const store = new WorkspaceContextStore()
  const state = { pinned: undefined }

  if (readFeatures().defaultModel) {
    state.pinned = readPinnedSelection() ?? adoptCurrentSelection(ctx)
    if (state.pinned !== undefined) {
      try {
        syncBlankSessions(ctx, state.pinned)
      } catch (error) {
        ctx.logger?.warn?.(`dsh-total-config: blank sessions were not synchronized at startup: ${messageOf(error)}`)
      }
    }
  }

  // Backfill the canonical path on workspace records created before it was
  // stored, so a later Workspace re-creation with a new id still finds it.
  try {
    const registry = ctx.get('workspaceRegistry')
    const document = store.load()
    let changed = false
    for (const workspace of registry?.list?.() ?? []) {
      const record = document.workspaces[workspace.id]
      if (!isWorkspaceRecord(record)) continue
      if (record.path !== workspace.path || record.title !== workspace.title) {
        record.path = workspace.path
        record.title = workspace.title
        changed = true
      }
    }
    if (changed) store.persist()
  } catch (error) {
    ctx.logger?.warn?.(`dsh-total-config: cannot backfill workspace paths: ${messageOf(error)}`)
  }

  ctx.effect(() => {
    const disposeRoute = ctx.webServer.register({
      kind: 'prefix',
      path: ROUTE,
      handler: (request, response) => {
        void handleRequest(ctx, state, store, request, response)
      },
    })
    return () => disposeRoute()
  }, 'dsh-total-config settings route')

  const promptServices = {
    get workspaceRegistry() {
      return ctx.get('workspaceRegistry')
    },
    get workingDirectory() {
      return ctx.get('workingDirectory')
    },
  }
  const disposers = new Map()
  const attach = (agent) => {
    if (agent === undefined || agent === null || disposers.has(agent.id)) return
    try {
      const dispose = agent.ctx.effect(() => {
        const prompt = agent.ctx.get('systemPrompt')
        if (prompt === undefined) return () => {}
        return prompt.section({
          name: 'dsh-total-workspace-context',
          order: 950,
          text: () => {
            if (!readFeatures().workspaceContext) return ''
            try {
              return renderContextForAgent(store, agent, promptServices)
            } catch (error) {
              ctx.logger?.warn?.(`dsh-total-config: ${messageOf(error)}`)
              return ''
            }
          },
        })
      }, 'dsh-total-config: agent prompt')
      disposers.set(agent.id, dispose)
    } catch (error) {
      ctx.logger?.warn?.(`dsh-total-config: cannot attach agent ${agent.id}: ${messageOf(error)}`)
    }
  }

  try {
    for (const agent of ctx.agents.list()) attach(agent)
  } catch (error) {
    ctx.logger?.warn?.(`dsh-total-config: cannot list agents: ${messageOf(error)}`)
  }
  ctx.on('agent/created', ({ agent, source }) => {
    attach(agent)
    try {
      if (!readFeatures().defaultModel) return
      const pinned = readPinnedSelection() ?? state.pinned
      if (pinned === undefined) return
      if (!isEligibleBlank(agent, source)) return
      applyPinnedToAgent(agent, pinned)
    } catch (error) {
      ctx.logger?.warn?.(`dsh-total-config: a new session was not prepared: ${messageOf(error)}`)
    }
  })
  ctx.on('agent/disposed', ({ agent }) => {
    const dispose = disposers.get(agent.id)
    if (dispose === undefined) return
    disposers.delete(agent.id)
    try {
      dispose()
    } catch {
      // The agent scope may already have unwound the registration.
    }
  })
  ctx.effect(() => () => {
    for (const dispose of disposers.values()) {
      try {
        dispose()
      } catch {
        // Ignore already-unwound scopes.
      }
    }
    disposers.clear()
  }, 'dsh-total-config: detach agents')
}

/** Test seam: the operations above, without the Loader wiring. */
export const __test = {
  DEEPSEEK_ROWS,
  FEATURES,
  LEGACY_BUNDLES,
  WorkspaceContextStore,
  applyPinnedToAgent,
  buildCatalog,
  deepseekState,
  disableLegacy,
  handleRequest,
  isEligibleBlank,
  legacyState,
  modelSnapshot,
  normalizeSelection,
  readFeatures,
  readPinnedSelection,
  readSettings,
  sameSelection,
  sanitize,
  sanitizeFeatures,
  sanitizeOrder,
  setDeepseekHidden,
  storeDirectory,
  storeFile,
  syncBlankSessions,
  workspaceFile,
  writePinnedSelection,
  writeSettings,
  modelFile,
}
