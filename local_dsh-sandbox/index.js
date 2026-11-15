/**
 * DSH Sandbox — Host half.
 *
 * A per-session cage: while it is on, the session's agent runs on the native
 * tool executor (no run_code), shell/desktop tools are denied, and filesystem
 * tools may only touch the session workspace or folders the operator granted.
 * Writes are additionally confined by the Harness file sandbox.
 *
 * State lives in $DSH_HOME/dsh-sandbox/state.json (0600).
 *
 * @module @local/dsh-sandbox
 */

import { randomBytes } from 'node:crypto'
import {
  chmodSync, existsSync, mkdirSync, readFileSync, realpathSync, renameSync, statSync, writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, isAbsolute, join, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Native executor class, loaded lazily so the plugin still loads on a
 * composition that does not route bare installation packages. The profile
 * resolver covers the browser/worker path but not always the Host module, so
 * the fallback imports the copy shipped inside the running application.
 */
let NativeToolExecutor
let nativeExecutorSource = 'none'
let nativeExecutorError

/** Candidate absolute paths of the executor inside the packaged application. */
function applicationExecutorCandidates() {
  const candidates = []
  const resources = typeof process.resourcesPath === 'string' ? process.resourcesPath : undefined
  const relative = ['app.asar', 'dsh', 'node_modules', '@deepseek-ai', 'dsh-tool-executor-native', 'lib', 'index.js']
  if (resources !== undefined) {
    candidates.push(join(resources, ...relative))
    candidates.push(join(resources, 'app.asar.unpacked', ...relative.slice(1)))
    candidates.push(join(resources, 'app', 'node_modules', '@deepseek-ai', 'dsh-tool-executor-native', 'lib', 'index.js'))
  }
  if (typeof process.execPath === 'string' && process.execPath.length > 0) {
    const contents = dirname(dirname(process.execPath))
    candidates.push(join(contents, 'Resources', ...relative))
    candidates.push(join(contents, 'Resources', 'app', 'node_modules', '@deepseek-ai', 'dsh-tool-executor-native', 'lib', 'index.js'))
  }
  return [...new Set(candidates)]
}

/** Load the first available NativeToolExecutor and remember where it came from. */
async function loadNativeExecutor() {
  try {
    const module = await import('@deepseek-ai/dsh-tool-executor-native')
    if (typeof module.NativeToolExecutor === 'function') {
      NativeToolExecutor = module.NativeToolExecutor
      nativeExecutorSource = 'profile'
      nativeExecutorError = undefined
      return
    }
    nativeExecutorError = 'el paquete no exporta NativeToolExecutor'
  } catch (error) {
    nativeExecutorError = error instanceof Error ? error.message : String(error)
  }
  for (const candidate of applicationExecutorCandidates()) {
    try {
      const module = await import(pathToFileURL(candidate).href)
      if (typeof module.NativeToolExecutor === 'function') {
        NativeToolExecutor = module.NativeToolExecutor
        nativeExecutorSource = 'application'
        nativeExecutorError = undefined
        return
      }
    } catch (error) {
      nativeExecutorError = (nativeExecutorError === undefined ? '' : nativeExecutorError + '; ') + (error instanceof Error ? error.message : String(error))
    }
  }
}
await loadNativeExecutor()

/**
 * Fail-closed executor: when the native one cannot be loaded the agent gets no
 * tools at all instead of keeping run_code and its raw process access.
 */
class EmptyToolExecutor {
  describe() {
    return { schemas: [] }
  }

  async execute(input) {
    return {
      results: (input?.calls ?? []).map((call) => ({
        id: call.id,
        result: { isError: true, error: { message: 'DSH Sandbox: el executor nativo no está disponible y la jaula ha bloqueado todas las herramientas.' } },
      })),
    }
  }
}

/** Services this plugin cannot work without. */
export const inject = ['webServer', 'tools', 'agents', 'sandboxPolicy']

/** Same-origin route prefix used by the browser half. */
const ROUTE = '/dsh-sandbox'

/** Custom header that forces a CORS preflight for cross-origin callers. */
const HEADER = 'x-dsh-sandbox'

/** Request body ceiling. */
const MAX_BODY_BYTES = 32 * 1024

/**
 * Tools that execute commands, drive the desktop, change the workspace root or
 * delegate to another agent/session. None of them is available in the cage:
 * any of them would be a way around the file boundary.
 */
const BLOCKED_TOOLS = Object.freeze([
  'bash',
  'job_list',
  'job_output',
  'job_kill',
  'cua',
  'subagent',
  'subagent_fork',
  'send_message',
  'schedule_create',
  'schedule_edit',
  'working_directory',
  'office_convert',
  'office_recalculate',
  'office_render',
  'team_task_create',
  'team_task_update',
])

/** Blocked tools that are global and therefore accepted by tools.restrict(). */
const RESTRICT_TOOLS = Object.freeze(BLOCKED_TOOLS.filter((name) => name !== 'cua'))

/** Filesystem tools and the argument that names the path they touch. */
const FS_PATH_ARGS = Object.freeze({
  read: 'file_path',
  read_image: 'file_path',
  write: 'file_path',
  edit: 'file_path',
  glob: 'path',
  grep: 'path',
})

/** Denial text the model sees when it reaches outside the cage. */
const DENIED = 'DSH Sandbox: esta sesión está enjaulada; solo puede usar herramientas y tocar el espacio de trabajo o las carpetas autorizadas.'

/** Active manager for diagnostics and tests. */
let currentManager

/** @returns {Record<string, unknown> | undefined} Live manager diagnostics. */
export function sandboxState() {
  return currentManager?.debug()
}

/** @returns {{ source: string, error: string | undefined }} Native executor load diagnostics. */
export function nativeExecutorInfo() {
  return { source: nativeExecutorSource, error: nativeExecutorError }
}

/**
 * @returns {string} Absolute plugin data directory.
 */
function storeDirectory() {
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'dsh-sandbox')
}

/** @returns {string} Absolute state file path. */
export function storeFile() {
  return join(storeDirectory(), 'state.json')
}

/**
 * One absolute directory, canonicalized.
 * @param {string} path Candidate.
 * @returns {string} Physical absolute directory.
 */
function validateGrant(path) {
  if (typeof path !== 'string' || path.trim().length === 0 || !isAbsolute(path)) {
    throw Object.assign(new Error('invalid-path'), { status: 400 })
  }
  let physical
  try {
    physical = realpathSync.native(path)
  } catch {
    throw Object.assign(new Error('missing-path'), { status: 400 })
  }
  if (!statSync(physical).isDirectory()) throw Object.assign(new Error('not-directory'), { status: 400 })
  return physical
}

/**
 * Canonicalize a path that may not exist yet by resolving its nearest existing
 * ancestor and re-appending the missing tail. Symlink escapes are resolved at
 * that ancestor, which is the security-relevant part.
 * @param {string} path Absolute path.
 * @returns {string} Canonical path.
 */
export function canonicalTarget(path) {
  let current = path
  const tail = []
  for (let depth = 0; depth < 64; depth += 1) {
    try {
      const real = realpathSync.native(current)
      return tail.length === 0 ? real : join(real, ...tail)
    } catch {
      const parent = dirname(current)
      if (parent === current) break
      tail.unshift(basename(current))
      current = parent
    }
  }
  return resolve(path)
}

/**
 * Whether a target is the root or lives below it.
 * @param {string} root Directory.
 * @param {string} target Canonical path.
 * @returns {boolean} Contained.
 */
export function isInside(root, target) {
  const base = root.endsWith(sep) ? root : root + sep
  return target === root || target.startsWith(base)
}

/**
 * Read and normalize the durable document.
 * @returns {{ version: number, sessions: Record<string, boolean>, grants: string[] }} State.
 */
export function readState() {
  let text
  try {
    text = readFileSync(storeFile(), 'utf8')
  } catch {
    return { version: 1, sessions: {}, grants: [] }
  }
  try {
    const parsed = JSON.parse(text)
    const sessions = {}
    if (typeof parsed?.sessions === 'object' && parsed.sessions !== null && !Array.isArray(parsed.sessions)) {
      for (const [id, value] of Object.entries(parsed.sessions)) {
        if (typeof id === 'string' && id.length > 0 && (value === true || value === false)) sessions[id] = value
      }
    }
    const grants = Array.isArray(parsed?.grants)
      ? [...new Set(parsed.grants.filter((entry) => typeof entry === 'string' && isAbsolute(entry)))]
      : []
    return { version: 1, sessions, grants }
  } catch {
    return { version: 1, sessions: {}, grants: [] }
  }
}

/**
 * Persist the durable document atomically with private permissions.
 * @param {{ sessions: Record<string, boolean>, grants: string[] }} state State.
 */
export function writeState(state) {
  const directory = storeDirectory()
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  const target = storeFile()
  const temporary = target + '.' + randomBytes(4).toString('hex') + '.tmp'
  writeFileSync(temporary, JSON.stringify({ version: 1, sessions: state.sessions, grants: state.grants }, undefined, 2) + '\n', { mode: 0o600 })
  try {
    chmodSync(temporary, 0o600)
  } catch {
    // Non-POSIX filesystems keep their default mode.
  }
  renameSync(temporary, target)
}

/**
 * Read one JSON request body with a size ceiling.
 * @param {import('node:http').IncomingMessage} request Incoming request.
 * @returns {Promise<Record<string, unknown>>} Parsed body.
 */
async function readJsonBody(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error('body-too-large'), { status: 413 })
    chunks.push(chunk)
  }
  if (size === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw Object.assign(new Error('invalid-json'), { status: 400 })
  }
}

/**
 * Per-session cage state, tool guards and filesystem policy.
 */
class SandboxManager {
  /** @param {import('@deepseek-ai/cordis').Context} ctx Plugin context. */
  constructor(ctx) {
    this.ctx = ctx
    const state = readState()
    this.states = new Map(Object.entries(state.sessions).filter(([, value]) => value === true || value === false))
    this.grants = state.grants
    /** @type {Map<Record<string, any>, { disposeExecutor: () => void, disposeRestrictions: () => void, previous: Record<string, any> | undefined }>} */
    this.records = new Map()
    /** Sessions currently covered, including children that inherit from a caged parent. */
    this.effective = new Set()
    /** Sessions whose native executor could not be loaded and run with no tools. */
    this.degraded = new Set()
    /** @type {(() => void) | undefined} */
    this.guardDispose = undefined
    /** @type {Array<() => void>} */
    this.listenerDisposers = []
    /** Agent id -> native executor used by the selection override. */
    this.nativeByAgent = new Map()
    /** Agent id -> fail-closed executor used while activation is pending. */
    this.emptyByAgent = new Map()
    this.originalSelectExecutor = undefined
    this.wrappedSelectExecutor = undefined
    this.selectTarget = undefined
    this.selectDescriptor = undefined
    this.selectHadOwn = undefined
    /** @type {(() => void) | undefined} */
    this.originalResolve = undefined
    this.wrappedResolve = undefined
    this.lastError = undefined
  }

  /**
   * @param {string} sessionId Session id.
   * @returns {boolean} The operator opened this session's cage.
   */
  isOpen(sessionId) {
    return this.states.get(sessionId) === false
  }

  /**
   * @param {string} sessionId Session id.
   * @returns {boolean} Caged (the default for every session).
   */
  isCaged(sessionId) {
    return !this.isOpen(sessionId)
  }

  /**
   * @param {any} scope Agent or agent scope.
   * @returns {string | undefined} Agent/session id.
   */
  agentIdOf(scope) {
    const id = scope?.id ?? scope?.session?.id
    return typeof id === 'string' ? id : undefined
  }

  /**
   * Force the selected executor for caged agents. The PTC agent preset can set
   * its own scoped executor after agent/created, so listening to the event is
   * not enough: the selection itself must be overridden on every step.
   */
  wrapSelectExecutor() {
    const service = this.ctx.tools
    // ctx.tools is a scoped proxy; the service instance behind it owns the real
    // method. Patch the instance so the system-prompt callback and execute()
    // both see the override, regardless of which scope proxy they use.
    const originalSymbol = Object.getOwnPropertySymbols(service).find((symbol) => String(symbol).includes('original'))
    const target = originalSymbol === undefined ? service : service[originalSymbol]
    const original = target.selectExecutor
    if (typeof original !== 'function') {
      this.lastError = 'no se pudo interceptar selectExecutor'
      this.ctx.logger?.warn?.('dsh-sandbox: ' + this.lastError)
      return
    }
    const wrapped = function selectExecutor(scope) {
      const id = thisManager.agentIdOf(scope)
      if (id !== undefined && thisManager.isCaged(id)) {
        let native = thisManager.nativeByAgent.get(id)
        if (native === undefined && NativeToolExecutor !== undefined && scope?.ctx?.tools !== undefined) {
          try {
            native = new NativeToolExecutor(scope.ctx)
            thisManager.nativeByAgent.set(id, native)
          } catch {
            native = undefined
          }
        }
        if (native !== undefined) return native
        let empty = thisManager.emptyByAgent.get(id)
        if (empty === undefined) {
          empty = new EmptyToolExecutor()
          thisManager.emptyByAgent.set(id, empty)
        }
        return empty
      }
      return original.call(target, scope)
    }
    const thisManager = this
    this.selectTarget = target
    this.selectHadOwn = Object.prototype.hasOwnProperty.call(target, 'selectExecutor')
    this.selectDescriptor = this.selectHadOwn ? Object.getOwnPropertyDescriptor(target, 'selectExecutor') : undefined
    this.originalSelectExecutor = original
    this.wrappedSelectExecutor = wrapped
    Object.defineProperty(target, 'selectExecutor', { value: wrapped, configurable: true, writable: true })
  }

  /** Restore the original executor selection. */
  unwrapSelectExecutor() {
    if (this.selectTarget !== undefined && this.wrappedSelectExecutor !== undefined) {
      if (this.selectHadOwn === true && this.selectDescriptor !== undefined) {
        Object.defineProperty(this.selectTarget, 'selectExecutor', this.selectDescriptor)
      } else {
        try {
          delete this.selectTarget.selectExecutor
        } catch {
          // A non-configurable own property would have prevented the patch.
        }
      }
    }
    this.selectTarget = undefined
    this.selectDescriptor = undefined
    this.selectHadOwn = undefined
    this.originalSelectExecutor = undefined
    this.wrappedSelectExecutor = undefined
  }

  /** Wrap the sandbox policy so a caged session always resolves to the workspace mode plus grants. */
  wrapPolicy() {
    const service = this.ctx.sandboxPolicy
    const original = service.resolve.bind(service)
    this.originalResolve = original
    const wrapped = (request = {}) => {
      const resolved = original(request)
      const id = request?.session?.id
      if (id === undefined || !this.isCaged(id)) return resolved
      const mode = resolved.mode === 'danger-full-access' ? 'workspace-write' : resolved.mode
      if (mode !== 'workspace-write' || this.grants.length === 0) return { ...resolved, mode }
      return {
        ...resolved,
        mode,
        additionalWritableRoots: [...new Set([...(resolved.additionalWritableRoots ?? []), ...this.grants])],
      }
    }
    this.wrappedResolve = wrapped
    service.resolve = wrapped
  }

  /** Register the monotonic guard and lifecycle listeners, then apply to live agents. */
  start() {
    this.wrapPolicy()
    this.wrapSelectExecutor()
    this.guardDispose = this.ctx.tools.guard((exec) => this.check(exec))
    // Agent events are emitted on the agents service context with the agent as
    // the scope carrier; a listener on the profile root does not see them.
    const emitters = [this.ctx]
    const serviceCtx = this.ctx.agents?.ctx
    if (serviceCtx !== undefined && serviceCtx !== this.ctx) emitters.push(serviceCtx)
    for (const emitter of emitters) {
      this.listenerDisposers.push(emitter.on('agent/created', ({ agent }) => this.syncAgent(agent)))
      this.listenerDisposers.push(emitter.on('agent/disposed', ({ agent }) => {
        this.records.delete(agent)
        this.effective.delete(String(agent?.id))
        this.degraded.delete(String(agent?.id))
      }))
    }
    this.syncAll()
  }

  /**
   * Activate or leave one agent based on its own session and its parent.
   * @param {Record<string, any>} agent Live agent.
   */
  syncAgent(agent) {
    const id = String(agent?.id)
    if (this.isOpen(id)) this.deactivate(agent)
    else this.activate(agent)
  }

  /** Recompute every live agent, parents before children, from the explicit session set. */
  syncAll() {
    for (const agent of [...this.records.keys()]) this.deactivate(agent)
    for (const agent of this.ctx.agents.list()) {
      if (!this.isOpen(String(agent.id))) this.activate(agent)
    }
  }

  /**
   * Switch one agent to native tools and deny the CLI.
   * @param {Record<string, any>} agent Live agent.
   */
  activate(agent) {
    if (this.records.has(agent)) return
    const id = String(agent?.id)
    let disposeExecutor = () => {}
    let executorOk = false
    // Disposing a scope executor leaves an empty selection record that shadows
    // the root one, so remember what the agent used and restore it on exit.
    let previous
    try {
      previous = this.originalSelectExecutor === undefined ? agent.ctx.tools.selectExecutor(agent) : this.originalSelectExecutor.call(this.selectTarget ?? this.ctx.tools, agent)
    } catch {
      previous = undefined
    }
    try {
      if (NativeToolExecutor === undefined) {
        this.degraded.add(id)
        this.lastError = 'executor nativo no disponible: ' + (nativeExecutorError ?? 'desconocido')
        this.ctx.logger?.warn?.('dsh-sandbox: ' + this.lastError)
      }
      let executor = this.nativeByAgent.get(id)
      if (executor === undefined) {
        executor = NativeToolExecutor === undefined ? new EmptyToolExecutor() : new NativeToolExecutor(agent.ctx)
        if (NativeToolExecutor !== undefined) this.nativeByAgent.set(id, executor)
      }
      disposeExecutor = agent.ctx.tools.setExecutor(executor)
      executorOk = true
    } catch (error) {
      // A preset can install its own scoped executor before agent/created. The
      // selection override still returns the native executor, so this conflict
      // is not a degradation; it only means there is no record to restore.
      if (this.nativeByAgent.has(id)) {
        executorOk = true
        this.ctx.logger?.debug?.('dsh-sandbox: executor del preset conservado para ' + id + ': ' + (error instanceof Error ? error.message : String(error)))
      } else {
        this.lastError = 'executor: ' + (error instanceof Error ? error.message : String(error))
        this.ctx.logger?.warn?.('dsh-sandbox: ' + this.lastError)
      }
    }
    // Hide the CLI/desktop tools from this agent as well as denying them at the
    // guard. Names are read from the agent's own view and denied one by one.
    const disposers = []
    try {
      const known = new Set(agent.ctx.tools.definitions(agent).map((definition) => definition.name))
      for (const name of RESTRICT_TOOLS) {
        if (!known.has(name)) continue
        try {
          disposers.push(agent.ctx.tools.restrict({ deny: [name] }))
        } catch (error) {
          // A scoped-only tool can be rejected by the global restrict API; the
          // monotonic guard still denies it by name.
          this.ctx.logger?.debug?.('dsh-sandbox: no se pudo ocultar ' + name + ': ' + (error instanceof Error ? error.message : String(error)))
        }
      }
    } catch (error) {
      this.lastError = 'definitions: ' + (error instanceof Error ? error.message : String(error))
    }
    const disposeRestrictions = () => {
      for (const dispose of disposers) {
        try {
          dispose()
        } catch {
          // The agent scope may already be gone.
        }
      }
    }
    this.records.set(agent, { disposeExecutor, disposeRestrictions, previous })
    this.effective.add(id)
    if (!executorOk && this.lastError === undefined) {
      this.lastError = 'executor no disponible para ' + id
      this.ctx.logger?.warn?.('dsh-sandbox: ' + this.lastError)
    }
  }

  /**
   * Lift one agent's cage records.
   * @param {Record<string, any>} agent Live agent.
   */
  deactivate(agent) {
    const record = this.records.get(agent)
    if (record === undefined) return
    this.disposeRecord(record)
    this.records.delete(agent)
    this.effective.delete(String(agent?.id))
    this.degraded.delete(String(agent?.id))
    this.nativeByAgent.delete(String(agent?.id))
    this.emptyByAgent.delete(String(agent?.id))
    if (record.previous !== undefined) {
      try {
        agent.ctx.tools.setExecutor(record.previous)
      } catch (error) {
        this.ctx.logger?.debug?.('dsh-sandbox: no se pudo restaurar el executor de ' + String(agent?.id) + ': ' + (error instanceof Error ? error.message : String(error)))
      }
    }
  }

  /** @param {{ disposeExecutor: () => void, disposeRestrictions: () => void }} record Records. */
  disposeRecord(record) {
    try {
      record.disposeRestrictions()
    } catch {
      // Already disposed.
    }
    try {
      record.disposeExecutor()
    } catch {
      // Already disposed.
    }
  }

  /**
   * Monotonic guard run after every policy decision.
   * @param {Record<string, any>} exec Tool execution.
   * @returns {string | undefined} Denial reason.
   */
  check(exec) {
    const id = exec?.agent?.session?.id ?? exec?.agent?.id
    if (id === undefined || !this.isCaged(String(id))) return undefined
    const name = exec?.name
    if (typeof name !== 'string') return undefined
    if (BLOCKED_TOOLS.includes(name)) return DENIED
    const key = FS_PATH_ARGS[name]
    if (key !== undefined) return this.checkPath(exec, name, key)
    if (name === 'present' && Array.isArray(exec?.arguments?.files)) {
      for (const file of exec.arguments.files) {
        if (typeof file?.path !== 'string') continue
        const denial = this.pathDenial(exec, file.path)
        if (denial !== undefined) return denial
      }
    }
    return undefined
  }

  /**
   * Check one filesystem tool call.
   * @param {Record<string, any>} exec Execution.
   * @param {string} name Tool name.
   * @param {string} key Argument name.
   * @returns {string | undefined} Denial reason.
   */
  checkPath(exec, name, key) {
    const args = exec?.arguments ?? {}
    if (name === 'glob' || name === 'grep') {
      const pattern = args.pattern
      if (typeof pattern === 'string' && /(^|[\\/])\.\.([\\/]|$)/.test(pattern)) return DENIED
    }
    const raw = args[key]
    if (raw === undefined) return undefined
    if (typeof raw !== 'string' || raw.length === 0) return DENIED
    return this.pathDenial(exec, raw)
  }

  /**
   * @param {Record<string, any>} exec Execution.
   * @param {string} raw Requested path.
   * @returns {string | undefined} Denial reason.
   */
  pathDenial(exec, raw) {
    const cwd = exec?.agent?.session?.header?.cwd
    const absolute = isAbsolute(raw) ? raw : cwd === undefined ? undefined : join(cwd, raw)
    if (absolute === undefined) return DENIED
    const target = canonicalTarget(absolute)
    const roots = this.allowedRoots(cwd)
    for (const root of roots) if (isInside(root, target)) return undefined
    return DENIED
  }

  /**
   * @param {string | undefined} cwd Session workspace.
   * @returns {string[]} Canonical roots allowed for reads and writes.
   */
  allowedRoots(cwd) {
    const roots = []
    if (typeof cwd === 'string' && isAbsolute(cwd)) roots.push(canonicalTarget(cwd))
    for (const grant of this.grants) roots.push(canonicalTarget(grant))
    return roots
  }

  /**
   * Toggle one session's cage.
   * @param {string} sessionId Session id.
   * @param {boolean} on New state.
   */
  toggle(sessionId, on) {
    // On is the default; only the explicit open state needs to be stored.
    if (on) this.states.delete(sessionId)
    else this.states.set(sessionId, false)
    this.persist()
    this.syncAll()
  }

  /** Persist the explicit session set and the grants. */
  persist() {
    const sessions = {}
    for (const [id, value] of this.states) {
      if (value === false) sessions[id] = false
    }
    writeState({ sessions, grants: [...this.grants] })
  }

  /**
   * Add or remove a granted folder.
   * @param {'add' | 'remove'} action Operation.
   * @param {string} path Folder.
   * @returns {string[]} Current grants.
   */
  grant(action, path) {
    if (action === 'add') {
      const physical = validateGrant(path)
      if (!this.grants.includes(physical)) this.grants = [...this.grants, physical]
    } else if (action === 'remove') {
      const physical = canonicalTarget(path)
      this.grants = this.grants.filter((entry) => canonicalTarget(entry) !== physical)
    } else {
      throw Object.assign(new Error('invalid-action'), { status: 400 })
    }
    this.persist()
    return [...this.grants]
  }

  /**
   * @param {string | undefined} sessionId Session id.
   * @returns {Record<string, unknown>} Wire view.
   */
  /** @returns {Record<string, unknown>} Diagnostics for tests and bug reports. */
  debug() {
    return {
      open: [...this.states.entries()].filter(([, value]) => value === false).map(([id]) => id),
      effective: [...this.effective],
      native: [...this.nativeByAgent.keys()],
      wrapped: this.selectTarget !== undefined,
      lastError: this.lastError,
    }
  }

  view(sessionId) {
    return {
      enabled: sessionId === undefined ? false : this.isCaged(sessionId),
      effective: sessionId === undefined ? false : this.isCaged(sessionId),
      sessions: [...this.states.entries()].filter(([, value]) => value === false).map(([id]) => id),
      open: [...this.states.entries()].filter(([, value]) => value === false).map(([id]) => id),
      grants: [...this.grants],
      cached: [...this.effective],
      degraded: [...this.degraded],
      executor: { source: nativeExecutorSource, error: nativeExecutorError },
      lastError: this.lastError,
    }
  }

  /** Restore the policy and drop the guard/listeners. */
  dispose() {
    for (const agent of [...this.records.keys()]) this.deactivate(agent)
    this.effective.clear()
    try {
      this.guardDispose?.()
    } catch {
      // Already disposed.
    }
    this.guardDispose = undefined
    this.unwrapSelectExecutor()
    this.nativeByAgent.clear()
    this.emptyByAgent.clear()
    for (const dispose of this.listenerDisposers.splice(0)) {
      try {
        dispose()
      } catch {
        // Already disposed.
      }
    }
    const service = this.ctx.sandboxPolicy
    if (service.resolve === this.wrappedResolve && this.originalResolve !== undefined) {
      service.resolve = this.originalResolve
    }
    this.originalResolve = undefined
    this.wrappedResolve = undefined
  }
}

/**
 * Answer one request from the browser half.
 * @param {SandboxManager} manager Manager.
 * @param {import('node:http').IncomingMessage} request Request.
 * @param {import('node:http').ServerResponse} response Response.
 * @returns {Promise<void>} Resolves when the answer ends.
 */
async function handleRequest(manager, request, response) {
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
    const url = new URL(request.url ?? ROUTE, 'http://' + (request.headers.host ?? 'localhost'))
    const path = url.pathname.startsWith(ROUTE) ? url.pathname.slice(ROUTE.length) : url.pathname
    const method = request.method ?? 'GET'

    if (path === '/health' && method === 'GET') {
      reply(200, { ok: true, data: { version: 1 } })
      return
    }
    if (path === '/state' && method === 'GET') {
      const sessionId = url.searchParams.get('sessionId') ?? undefined
      reply(200, { ok: true, data: manager.view(sessionId) })
      return
    }
    if (path === '/state' && method === 'POST') {
      const body = await readJsonBody(request)
      if (typeof body.sessionId !== 'string' || body.sessionId.length === 0 || body.sessionId.length > 200) {
        throw Object.assign(new Error('invalid-session'), { status: 400 })
      }
      if (typeof body.enabled !== 'boolean') throw Object.assign(new Error('invalid-enabled'), { status: 400 })
      manager.toggle(body.sessionId, body.enabled)
      reply(200, { ok: true, data: manager.view(body.sessionId) })
      return
    }
    if (path === '/grants' && method === 'GET') {
      reply(200, { ok: true, data: { grants: manager.grants } })
      return
    }
    if (path === '/grants' && method === 'POST') {
      const body = await readJsonBody(request)
      const action = body.action === 'remove' ? 'remove' : body.action === 'add' ? 'add' : undefined
      if (action === undefined) throw Object.assign(new Error('invalid-action'), { status: 400 })
      const grants = manager.grant(action, body.path)
      reply(200, { ok: true, data: { grants } })
      return
    }
    reply(404, { ok: false, error: 'not-found' })
  } catch (error) {
    try {
      const status = typeof error?.status === 'number' ? error.status : 500
      reply(status, { ok: false, error: error instanceof Error ? error.message : String(error) })
    } catch {
      // The socket may already be gone.
    }
  }
}

/**
 * Mount the manager, its route and the cage lifecycle.
 * @param {import('@deepseek-ai/cordis').Context} ctx Plugin context.
 */
export function apply(ctx) {
  const manager = new SandboxManager(ctx)
  currentManager = manager
  ctx.effect(() => {
    const disposeRoute = ctx.webServer.register({
      kind: 'prefix',
      path: ROUTE,
      handler: (request, response) => {
        void handleRequest(manager, request, response)
      },
    })
    return () => disposeRoute()
  }, 'dsh-sandbox route')
  ctx.effect(() => {
    manager.start()
    return () => manager.dispose()
  }, 'dsh-sandbox cage')
}

export { handleRequest, SandboxManager }
