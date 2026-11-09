/**
 * Workspace context — Host half.
 *
 * Gives every registered Workspace an optional description, a system prompt,
 * and a list of files or folders that ride along as model context. It also
 * keeps per-Session context folders added from the composer's `+` menu.
 *
 * The browser half (`client.js`) talks to this module over a same-origin HTTP
 * route. Config lives in `$DSH_HOME/workspace-context/context.json` (mode
 * `0600`) because it is plugin-owned data, not profile configuration.
 *
 * Model injection: each live Agent gets one scoped prompt section that renders
 * the Workspace context plus the Session's own folders on every assembly.
 *
 * @module @local/workspace-context
 */

import { randomBytes } from 'node:crypto'
import {
  chmodSync,
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

/** Services this plugin cannot work without. */
export const inject = ['webServer', 'agents']

/** Same-origin route prefix used by the browser half. */
const ROUTE = '/dsh-workspace-context'

/** Custom header that forces a CORS preflight for cross-origin callers. */
const HEADER = 'x-dsh-workspace-context'

/** Request body ceiling for the settings route. */
const MAX_BODY_BYTES = 8 * 1024 * 1024

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

/**
 * Resolve the plugin's durable directory.
 * @returns Absolute directory path.
 */
export function storeDirectory() {
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'workspace-context')
}

/** @returns The persisted document path. */
export function storeFile() {
  return join(storeDirectory(), 'context.json')
}

/**
 * Build an error carrying a stable code the browser half localizes.
 * @param {string} code Stable error code.
 * @param {string} [detail] Optional human detail (a path or file name).
 * @param {number} [status] HTTP status.
 * @returns {Error & { code: string, detail?: string, status?: number }} The error.
 */
function fail(code, detail, status = 400) {
  const error = new Error(code)
  error.code = code
  if (detail !== undefined) error.detail = detail
  error.status = status
  return error
}

/**
 * Read the current store document, tolerating a missing or malformed file.
 * @param {string} file Document path.
 * @returns {{ version: number, workspaces: Record<string, object>, sessions: Record<string, object> }} Empty state on failure.
 */
function readDocument(file) {
  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch {
    return { version: 1, workspaces: {}, sessions: {} }
  }
  try {
    const parsed = JSON.parse(text)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { version: 1, workspaces: {}, sessions: {} }
    }
    const workspaces = typeof parsed.workspaces === 'object' && parsed.workspaces !== null && !Array.isArray(parsed.workspaces)
      ? parsed.workspaces
      : {}
    const sessions = typeof parsed.sessions === 'object' && parsed.sessions !== null && !Array.isArray(parsed.sessions)
      ? parsed.sessions
      : {}
    return { version: 1, workspaces, sessions }
  } catch {
    return { version: 1, workspaces: {}, sessions: {} }
  }
}

/**
 * Write the document durably: private permissions, temp file then rename.
 * @param {string} file Document path.
 * @param {{ version: number, workspaces: Record<string, object>, sessions: Record<string, object> }} state State to persist.
 */
function writeDocument(file, state) {
  mkdirSync(storeDirectory(), { recursive: true, mode: 0o700 })
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
    throw fail('folder-missing', value.trim())
  }
  let stat
  try {
    stat = statSync(canonical)
  } catch {
    throw fail('folder-missing', canonical)
  }
  if (!stat.isDirectory()) throw fail('folder-not-directory', canonical)
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
 * Normalize an untrusted Workspace patch.
 * @param {object} input Untrusted patch.
 * @param {object} previous Previous Workspace record.
 * @returns {{ description: string, systemPrompt: string, entries: object[] }} Normalized record.
 */
export function normalizeWorkspacePatch(input, previous = { entries: [] }) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw fail('invalid-patch')
  const description = typeof input.description === 'string' ? input.description.slice(0, MAX_DESCRIPTION) : ''
  const systemPrompt = typeof input.systemPrompt === 'string' ? input.systemPrompt.slice(0, MAX_SYSTEM_PROMPT) : ''
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
    if (bytes > MAX_FILE_BYTES) throw fail('file-too-large', String(raw.name ?? known?.name ?? ''))
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
  return { description, systemPrompt, entries }
}

/**
 * Durable Workspace and Session context store.
 */
export class WorkspaceContextStore {
  /**
   * @param {{ file?: string }} [options] Override the document path (tests).
   */
  constructor(options = {}) {
    this.file = options.file ?? storeFile()
    this.state = undefined
  }

  /** @returns {{ version: number, workspaces: Record<string, object>, sessions: Record<string, object> }} Loaded state. */
  load() {
    if (this.state === undefined) this.state = readDocument(this.file)
    return this.state
  }

  /** Persist the current state and drop folder reads. */
  persist() {
    writeDocument(this.file, this.load())
    clearFolderCache()
  }

  /**
   * Read one Workspace record with defaults. The id is authoritative, but a
   * record saved under an older id for the same canonical path is found too,
   * so re-creating a Workspace does not orphan its context.
   * @param {string} workspaceId Workspace id.
   * @param {string} [workspacePath] Canonical Workspace path.
   * @returns {{ description: string, systemPrompt: string, entries: object[] }} Record.
   */
  workspace(workspaceId, workspacePath) {
    const state = this.load()
    let record = state.workspaces[workspaceId]
    if (!isWorkspaceRecord(record) && typeof workspacePath === 'string') {
      record = Object.values(state.workspaces).find(candidate => isWorkspaceRecord(candidate)
        && typeof candidate.path === 'string'
        && sameWorkspacePath(candidate.path, workspacePath))
    }
    if (!isWorkspaceRecord(record)) return { description: '', systemPrompt: '', entries: [] }
    return {
      description: typeof record.description === 'string' ? record.description : '',
      systemPrompt: typeof record.systemPrompt === 'string' ? record.systemPrompt : '',
      entries: Array.isArray(record.entries) ? record.entries.filter(isStoredEntry) : [],
    }
  }

  /**
   * Read one Workspace record as the browser sees it.
   * @param {string} workspaceId Workspace id.
   * @param {string} [workspacePath] Canonical Workspace path.
   * @returns {{ description: string, systemPrompt: string, entries: object[] }} Public record.
   */
  publicWorkspace(workspaceId, workspacePath) {
    const record = this.workspace(workspaceId, workspacePath)
    return {
      description: record.description,
      systemPrompt: record.systemPrompt,
      entries: record.entries.map(publicEntry),
    }
  }

  /**
   * Save one Workspace patch. The record carries its canonical path so a later
   * Workspace re-creation with a new id still finds the same context.
   * @param {string} workspaceId Workspace id.
   * @param {object} input Untrusted patch.
   * @param {{ path?: string, title?: string }} [meta] Workspace identity.
   * @returns {{ description: string, systemPrompt: string, entries: object[] }} Public record.
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
    if (size > MAX_BODY_BYTES) throw fail('body-too-large', undefined, 413)
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
 * Answer one request from the browser half.
 * @param {WorkspaceContextStore} store Context store.
 * @param {(workspaceId: string) => (object | undefined)} lookupWorkspace Workspace resolver.
 * @param {import('node:http').IncomingMessage} request Incoming request.
 * @param {import('node:http').ServerResponse} response Outgoing response.
 * @returns {Promise<void>} Resolves when the response ends.
 */
export async function handleRequest(store, lookupWorkspace, lookupWorkspaceForSession, request, response) {
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
    const segments = path.split('/').filter(segment => segment.length > 0)
    const method = request.method ?? 'GET'

    if (segments[0] === 'health' && method === 'GET') {
      reply(200, { ok: true, data: store.stats() })
      return
    }

    if (segments[0] === 'state' && method === 'GET') {
      const workspaceId = url.searchParams.get('workspaceId') ?? ''
      const workspace = lookupWorkspace(workspaceId)
      if (workspace === undefined) throw fail('workspace-unknown', workspaceId, 404)
      reply(200, {
        ok: true,
        data: {
          workspace: { workspaceId: workspace.id, title: workspace.title, path: workspace.path },
          config: store.publicWorkspace(workspaceId, workspace.path),
        },
      })
      return
    }

    if (segments[0] === 'workspace' && segments.length === 1 && method === 'POST') {
      const body = await readJsonBody(request)
      const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId : ''
      const workspace = lookupWorkspace(workspaceId)
      if (workspace === undefined) throw fail('workspace-unknown', workspaceId, 404)
      const config = store.saveWorkspace(workspaceId, body, { path: workspace.path, title: workspace.title })
      reply(200, { ok: true, data: { config } })
      return
    }

    if (segments[0] === 'session' && segments[1] === 'context' && segments.length === 2 && method === 'GET') {
      const sessionId = url.searchParams.get('sessionId') ?? ''
      if (sessionId === '') throw fail('invalid-session')
      const requestedId = url.searchParams.get('workspaceId') ?? ''
      let workspace = requestedId !== '' ? lookupWorkspace(requestedId) : undefined
      if (workspace === undefined) workspace = lookupWorkspaceForSession(sessionId)
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

    if (segments[0] === 'session' && segments.length === 1 && method === 'GET') {
      const sessionId = url.searchParams.get('sessionId') ?? ''
      if (sessionId === '') throw fail('invalid-session')
      reply(200, { ok: true, data: { entries: store.sessionEntries(sessionId) } })
      return
    }

    if (segments[0] === 'session' && segments[1] === 'entries' && segments.length === 2 && method === 'POST') {
      const body = await readJsonBody(request)
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
      if (sessionId === '') throw fail('invalid-session')
      const entries = store.addSessionFolder(sessionId, body.path)
      reply(200, { ok: true, data: { entries } })
      return
    }

    if (segments[0] === 'session' && segments[1] === 'entries' && segments[2] === 'remove' && method === 'POST') {
      const body = await readJsonBody(request)
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
      const entryId = typeof body.entryId === 'string' ? body.entryId : ''
      if (sessionId === '' || entryId === '') throw fail('invalid-session')
      const entries = store.removeSessionEntry(sessionId, entryId)
      reply(200, { ok: true, data: { entries } })
      return
    }

    reply(404, { ok: false, error: 'not-found' })
  } catch (error) {
    const status = typeof error?.status === 'number' ? error.status : 400
    try {
      reply(status, {
        ok: false,
        error: typeof error?.code === 'string' ? error.code : 'request-failed',
        ...(typeof error?.detail === 'string' ? { detail: error.detail } : {}),
      })
    } catch {
      // The connection may already be gone.
    }
  }
}

/**
 * Mount the store, its route, and the per-Agent prompt sections.
 * @param {import('@deepseek-ai/cordis').Context} ctx Plugin context.
 */
export function apply(ctx) {
  const store = new WorkspaceContextStore()
  const services = {
    get workspaceRegistry() {
      return ctx.get('workspaceRegistry')
    },
    get workingDirectory() {
      return ctx.get('workingDirectory')
    },
  }
  const lookupWorkspace = (workspaceId) => {
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
  // Backfill the canonical path on records created before it was stored, so a
  // later Workspace re-creation with a new id can still find its context.
  try {
    const registry = ctx.get('workspaceRegistry')
    const state = store.load()
    let changed = false
    for (const workspace of registry?.list?.() ?? []) {
      const record = state.workspaces[workspace.id]
      if (!isWorkspaceRecord(record)) continue
      if (record.path !== workspace.path || record.title !== workspace.title) {
        record.path = workspace.path
        record.title = workspace.title
        changed = true
      }
    }
    if (changed) store.persist()
  } catch (error) {
    ctx.logger?.warn?.(`workspace-context: cannot backfill workspace paths: ${error instanceof Error ? error.message : String(error)}`)
  }

  const lookupWorkspaceForSession = (sessionId) => {
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

  ctx.effect(() => {
    const disposeRoute = ctx.webServer.register({
      kind: 'prefix',
      path: ROUTE,
      handler: (request, response) => {
        void handleRequest(store, lookupWorkspace, lookupWorkspaceForSession, request, response)
      },
    })
    return () => disposeRoute()
  }, 'workspace-context route')

  const disposers = new Map()
  const attach = (agent) => {
    if (agent === undefined || agent === null || disposers.has(agent.id)) return
    try {
      const dispose = agent.ctx.effect(() => {
        const prompt = agent.ctx.get('systemPrompt')
        if (prompt === undefined) return () => {}
        return prompt.section({
          name: 'workspace-context',
          order: 950,
          text: () => {
            try {
              return renderContextForAgent(store, agent, services)
            } catch (error) {
              ctx.logger?.warn?.(`workspace-context: ${error instanceof Error ? error.message : String(error)}`)
              return ''
            }
          },
        })
      }, 'workspace-context: agent prompt')
      disposers.set(agent.id, dispose)
    } catch (error) {
      ctx.logger?.warn?.(`workspace-context: cannot attach agent ${agent.id}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  try {
    for (const agent of ctx.agents.list()) attach(agent)
  } catch (error) {
    ctx.logger?.warn?.(`workspace-context: cannot list agents: ${error instanceof Error ? error.message : String(error)}`)
  }
  ctx.on('agent/created', ({ agent }) => attach(agent))
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
  }, 'workspace-context: detach agents')
}
