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

/**
 * Native executor class. The import is dynamic so the plugin still loads (and
 * its settings/route stay usable) on a composition that does not route the
 * installation package; activation then reports the missing class instead of
 * taking the whole plugin down.
 */
let NativeToolExecutor
try {
  ({ NativeToolExecutor } = await import('@deepseek-ai/dsh-tool-executor-native'))
} catch (error) {
  NativeToolExecutor = undefined
}

/** Services this plugin cannot work without. */
export const inject = ['webServer', 'tools', 'agents', 'sandboxPolicy']

/** Same-origin route prefix used by the browser half. */
const ROUTE = '/dsh-sandbox'

/** Custom header that forces a CORS preflight for cross-origin callers. */
const HEADER = 'x-dsh-sandbox'

/** Request body ceiling. */
const MAX_BODY_BYTES = 32 * 1024

/** Tools that execute commands or drive the desktop; never available in the cage. */
const CLI_TOOLS = Object.freeze(['bash', 'job_list', 'job_output', 'job_kill', 'cua'])

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
        if (typeof id === 'string' && id.length > 0 && value === true) sessions[id] = true
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
    this.enabled = new Map(Object.entries(state.sessions).filter(([, value]) => value === true))
    this.grants = state.grants
    /** @type {Map<Record<string, any>, { disposeExecutor: () => void, disposeRestrictions: () => void, previous: Record<string, any> | undefined }>} */
    this.records = new Map()
    /** Sessions currently covered, including children that inherit from a caged parent. */
    this.effective = new Set()
    /** @type {(() => void) | undefined} */
    this.guardDispose = undefined
    /** @type {(() => void) | undefined} */
    this.originalResolve = undefined
    this.wrappedResolve = undefined
    this.lastError = undefined
  }

  /**
   * @param {string} sessionId Session id.
   * @returns {boolean} Explicitly caged.
   */
  explicit(sessionId) {
    return this.enabled.get(sessionId) === true
  }

  /**
   * @param {string} sessionId Session id.
   * @returns {boolean} Caged, explicitly or by inheritance.
   */
  isCaged(sessionId) {
    return this.explicit(sessionId) || this.effective.has(sessionId)
  }

  /**
   * @param {Record<string, any>} agent Live agent.
   * @returns {boolean} Owned by an already caged agent.
   */
  ownedByCaged(agent) {
    for (const parent of this.records.keys()) {
      try {
        if (this.ctx.agents.isOwnedBy(agent.id, parent)) return true
      } catch {
        // The child may have been unregistered in the meantime.
      }
    }
    return false
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
    this.guardDispose = this.ctx.tools.guard((exec) => this.check(exec))
    this.ctx.on('agent/created', ({ agent }) => this.syncAgent(agent))
    this.ctx.on('agent/disposed', ({ agent }) => {
      this.records.delete(agent)
      this.effective.delete(String(agent?.id))
    })
    this.syncAll()
  }

  /**
   * Activate or leave one agent based on its own session and its parent.
   * @param {Record<string, any>} agent Live agent.
   */
  syncAgent(agent) {
    const id = String(agent?.id)
    if (this.explicit(id) || this.ownedByCaged(agent)) this.activate(agent)
    else this.deactivate(agent)
  }

  /** Recompute every live agent, parents before children, from the explicit session set. */
  syncAll() {
    for (const agent of [...this.records.keys()]) this.deactivate(agent)
    for (const agent of this.ctx.agents.list()) {
      if (this.explicit(String(agent.id))) this.activate(agent)
    }
    // Children inherit from a caged parent; registration order is parents first,
    // but a second pass covers a child announced before its parent record.
    for (let pass = 0; pass < 3; pass += 1) {
      let changed = false
      for (const agent of this.ctx.agents.list()) {
        if (this.records.has(agent)) continue
        if (this.ownedByCaged(agent)) {
          this.activate(agent)
          changed = true
        }
      }
      if (!changed) break
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
      previous = agent.ctx.tools.selectExecutor(agent)
    } catch {
      previous = undefined
    }
    try {
      const executor = new NativeToolExecutor(agent.ctx)
      disposeExecutor = agent.ctx.tools.setExecutor(executor)
      executorOk = true
    } catch (error) {
      this.lastError = 'executor: ' + (error instanceof Error ? error.message : String(error))
      this.ctx.logger?.warn?.('dsh-sandbox: ' + this.lastError)
    }
    // Hide the CLI/desktop tools from this agent as well as denying them at the
    // guard. Names are read from the agent's own view and denied one by one.
    const disposers = []
    try {
      const known = new Set(agent.ctx.tools.definitions(agent).map((definition) => definition.name))
      for (const name of CLI_TOOLS) {
        if (!known.has(name)) continue
        try {
          disposers.push(agent.ctx.tools.restrict({ deny: [name] }))
        } catch (error) {
          this.lastError = 'restrict ' + name + ': ' + (error instanceof Error ? error.message : String(error))
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
    if (!executorOk) {
      // Without the native executor the agent would keep run_code; the guard
      // still denies CLI and filesystem tools, but the cage is degraded.
      this.lastError = 'native executor unavailable for ' + id
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
    if (record.previous !== undefined) {
      try {
        agent.ctx.tools.setExecutor(record.previous)
      } catch (error) {
        this.lastError = 'restore: ' + (error instanceof Error ? error.message : String(error))
        this.ctx.logger?.warn?.('dsh-sandbox: ' + this.lastError)
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
    if (CLI_TOOLS.includes(name)) return DENIED
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
    if (on) this.enabled.set(sessionId, true)
    else this.enabled.delete(sessionId)
    this.persist()
    this.syncAll()
  }

  /** Persist the explicit session set and the grants. */
  persist() {
    writeState({
      sessions: Object.fromEntries(this.enabled),
      grants: [...this.grants],
    })
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
  view(sessionId) {
    return {
      enabled: sessionId === undefined ? false : this.explicit(sessionId),
      effective: sessionId === undefined ? false : this.isCaged(sessionId),
      sessions: Object.keys(Object.fromEntries(this.enabled)),
      grants: [...this.grants],
      cached: [...this.effective],
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
