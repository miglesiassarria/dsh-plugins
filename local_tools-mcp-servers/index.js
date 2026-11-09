/**
 * Tool servers — Host half.
 *
 * Owns the durable list of MCP servers configured from the Settings → Tools
 * page, keeps their connections alive, and registers every discovered tool on
 * `ctx.tools` under the stable `mcp__<server>__<tool>` name.
 *
 * The browser half (`client.js`) talks to this module over a same-origin HTTP
 * route, so the page needs no generated Remote namespace. Servers persist in
 * `$DSH_HOME/mcp-tools/servers.json`.
 *
 * Transports: `stdio` (newline-delimited JSON-RPC over a child process) and
 * `http` (MCP Streamable HTTP, JSON or SSE responses).
 *
 * @module @local/tools-mcp-servers
 */

import { spawn } from 'node:child_process'
import { createHash, randomBytes } from 'node:crypto'
import { chmodSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join } from 'node:path'

/** Services this plugin cannot work without. */
export const inject = ['tools', 'webServer']

/** Route prefix served to the Settings page. */
const ROUTE = '/dsh-tools-mcp'

/** MCP revision this client speaks first; a server may answer with its own. */
const PROTOCOL_VERSION = '2025-06-18'

/** Tool-call budget; MCP servers can be slow, the model still needs an answer. */
const TOOL_TIMEOUT_MS = 60_000

/** Connection budget for `initialize` and `tools/list`. */
const CONTROL_TIMEOUT_MS = 30_000

/** DeepSeek function-name contract: at most 64 characters. */
const MAX_PUBLIC_NAME = 64

/** Hex characters of the identity hash appended on lossy normalization. */
const HASH_LENGTH = 12

/** Request body ceiling for the settings route. */
const MAX_BODY_BYTES = 256 * 1024

/** How long a login-shell PATH probe may take. */
const PATH_PROBE_TIMEOUT_MS = 4_000

/**
 * Resolve the durable directory for this feature.
 * @returns Absolute directory path.
 */
function storeDirectory() {
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'mcp-tools')
}

/** @returns The persisted document path. */
function storeFile() {
  return join(storeDirectory(), 'servers.json')
}

/**
 * Drop credential-shaped and harness-owned ambient names before handing the
 * environment to a child process; explicit server values merge afterwards.
 * @param {NodeJS.ProcessEnv} ambient Ambient environment.
 * @returns A scrubbed copy.
 */
function scrubbedEnvironment(ambient) {
  const out = {}
  for (const [key, value] of Object.entries(ambient)) {
    if (value === undefined) continue
    if (/KEY|PASSWORD|SECRET|TOKEN/i.test(key)) continue
    if (key.startsWith('DSH_')) continue
    out[key] = value
  }
  return out
}

/**
 * Read the persisted servers, tolerating a missing or malformed document.
 * @returns {Array<Record<string, unknown>>} Stored server rows.
 */
function readStore() {
  let text
  try {
    text = readFileSync(storeFile(), 'utf8')
  } catch {
    return []
  }
  try {
    const parsed = JSON.parse(text)
    return Array.isArray(parsed?.servers) ? parsed.servers.filter(isStoredServer) : []
  } catch {
    return []
  }
}

/**
 * Whether a persisted row carries the minimum shape this module reads.
 * @param {unknown} value Candidate row.
 * @returns {boolean} True for a usable row.
 */
function isStoredServer(value) {
  return typeof value === 'object' && value !== null
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && (value.transport === 'stdio' || value.transport === 'http')
}

/**
 * Write the document durably: private permissions, temp file then rename.
 * @param {Array<Record<string, unknown>>} servers Rows to persist.
 */
function writeStore(servers) {
  const directory = storeDirectory()
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  const target = storeFile()
  const temporary = `${target}.${randomBytes(4).toString('hex')}.tmp`
  writeFileSync(temporary, `${JSON.stringify({ version: 1, servers }, undefined, 2)}\n`, { mode: 0o600 })
  try {
    chmodSync(temporary, 0o600)
  } catch {
    // Non-POSIX filesystems keep their default mode.
  }
  renameSync(temporary, target)
}

/**
 * Normalize a configured display name into an MCP namespace fragment.
 * @param {string} name Display name.
 * @returns A `[A-Za-z0-9_-]{1,32}` fragment.
 */
function slugify(name) {
  const slug = name.trim().replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32)
  return slug.length > 0 ? slug : 'server'
}

/**
 * Derive the model-facing name for one MCP tool. Mirrors the pinned DSH naming
 * contract so a name never changes while `(server, tool)` stays the same.
 * @param {string} slug Server namespace.
 * @param {string} rawName The server's own tool name.
 * @returns The public tool name.
 */
function publicToolName(slug, rawName) {
  const joined = `mcp__${slug}__${rawName}`
  const normalized = joined.replace(/[^A-Za-z0-9_-]/g, '_')
  if (normalized === joined && normalized.length <= MAX_PUBLIC_NAME) return normalized
  const hash = createHash('sha256').update(`${slug}\0${rawName}`).digest('hex').slice(0, HASH_LENGTH)
  return `${normalized.slice(0, MAX_PUBLIC_NAME - HASH_LENGTH - 1)}_${hash}`
}

/** Keywords the Harness JSON Schema subset enforces. */
const SCHEMA_KEYWORDS = new Set(['type', 'oneOf', 'properties', 'required', 'additionalProperties', 'items', 'enum', 'const'])
/** Keywords kept as annotations. */
const ANNOTATION_KEYWORDS = new Set(['description', 'title', 'default', 'examples'])
/** Types the subset accepts. */
const SCHEMA_TYPES = new Set(['object', 'array', 'string', 'number', 'integer', 'boolean', 'null'])

/**
 * Project an MCP input schema onto the Harness JSON Schema subset. Unsupported
 * vocabulary is dropped rather than rejected, so a server with a richer schema
 * still contributes a callable tool.
 * @param {unknown} value Upstream schema node.
 * @returns A supported schema object.
 */
function sanitizeSchema(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const out = {}
  for (const [key, node] of Object.entries(value)) {
    if (ANNOTATION_KEYWORDS.has(key)) {
      if (key === 'description' || key === 'title') {
        if (typeof node === 'string') out[key] = node
      }
      continue
    }
    if (!SCHEMA_KEYWORDS.has(key)) continue
    switch (key) {
      case 'type':
        if (typeof node === 'string' && SCHEMA_TYPES.has(node)) out.type = node
        break
      case 'enum':
        if (Array.isArray(node)) out.enum = node.filter(isJsonScalar)
        break
      case 'const':
        if (isJsonScalar(node)) out.const = node
        break
      case 'required':
        if (Array.isArray(node)) out.required = node.filter(entry => typeof entry === 'string')
        break
      case 'additionalProperties':
        if (typeof node === 'boolean') out.additionalProperties = node
        else {
          const nested = sanitizeSchema(node)
          if (nested !== undefined) out.additionalProperties = nested
        }
        break
      case 'items':
        if (Array.isArray(node)) {
          // Tuple form is outside the subset; the first item keeps the shape.
          const nested = sanitizeSchema(node[0])
          out.items = nested ?? {}
        } else {
          const nested = sanitizeSchema(node)
          out.items = nested ?? {}
        }
        break
      case 'properties':
        if (typeof node === 'object' && node !== null && !Array.isArray(node)) {
          const properties = {}
          for (const [property, schema] of Object.entries(node)) {
            const nested = sanitizeSchema(schema)
            properties[property] = nested ?? {}
          }
          out.properties = properties
        }
        break
      case 'oneOf':
        if (Array.isArray(node)) {
          const branches = node.map(sanitizeSchema).filter(branch => branch !== undefined)
          if (branches.length > 0) out.oneOf = branches
        }
        break
      default:
        break
    }
  }
  return out
}

/**
 * Whether a value is a JSON scalar the schema subset can enforce.
 * @param {unknown} value Candidate value.
 * @returns {boolean} True for string, number, boolean, or null.
 */
function isJsonScalar(value) {
  return value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

/**
 * Build the parameter schema handed to the tool registry.
 * @param {unknown} inputSchema The MCP tool's `inputSchema`.
 * @returns An object-rooted schema.
 */
function parameterSchema(inputSchema) {
  const sanitized = sanitizeSchema(inputSchema)
  if (sanitized === undefined) return { type: 'object', properties: {}, additionalProperties: true }
  if (sanitized.type !== 'object' && sanitized.oneOf === undefined) {
    return { type: 'object', properties: {}, additionalProperties: true }
  }
  return sanitized
}

/**
 * Flatten MCP content blocks into model-visible text, keeping unsupported
 * blocks visible as diagnostics instead of dropping them.
 * @param {unknown} content MCP content array.
 * @param {string} [fallbackName] Tool name used in the empty-result message.
 * @returns Plain text.
 */
function extractText(content, fallbackName = 'tool') {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) {
    return content === undefined || content === null ? '(sin contenido)' : safeJson(content)
  }
  const parts = []
  for (const block of content) {
    if (block === null || typeof block !== 'object') {
      parts.push(String(block))
      continue
    }
    switch (block.type) {
      case 'text':
        parts.push(typeof block.text === 'string' ? block.text : '')
        break
      case 'image':
        parts.push(`[imagen ${typeof block.mimeType === 'string' ? block.mimeType : 'desconocida'} no visible fuera de la conversación]`)
        break
      case 'audio':
        parts.push(`[audio ${typeof block.mimeType === 'string' ? block.mimeType : 'desconocido'} no soportado]`)
        break
      case 'resource':
        parts.push(`[recurso ${block.resource?.uri ?? 'sin uri'}]`)
        break
      case 'resource_link':
        parts.push(`[recurso ${block.name ?? block.uri ?? 'sin nombre'}]`)
        break
      default:
        parts.push(safeJson(block))
        break
    }
  }
  const text = parts.filter(part => part.length > 0).join('\n\n')
  return text.length > 0 ? text : `(${fallbackName} no devolvió contenido)`
}

/**
 * Serialize a value without throwing on cycles.
 * @param {unknown} value Value to serialize.
 * @returns JSON text or a string form.
 */
function safeJson(value) {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

/**
 * Reduce any thrown value to a short, page-safe message.
 * @param {unknown} error Thrown value.
 * @returns Message text.
 */
function errorMessage(error) {
  if (error instanceof Error) return error.message
  return typeof error === 'string' ? error : safeJson(error)
}

/**
 * A short human label for a server's target, shown under its name.
 * @param {Record<string, any>} server Stored server row.
 * @returns One line of target text.
 */
function targetOf(server) {
  if (server.transport === 'http') return String(server.url ?? '')
  const args = Array.isArray(server.args) ? server.args : []
  return [server.command, ...args].join(' ')
}

/** Logger facade safe to call before the plugin context has a logger. */
function log(ctx) {
  return {
    info: message => ctx.logger?.info?.(`tools-mcp: ${message}`),
    warn: message => ctx.logger?.warn?.(`tools-mcp: ${message}`),
    error: message => ctx.logger?.error?.(`tools-mcp: ${message}`),
  }
}

/**
 * Newline-delimited JSON-RPC transport over a child process (MCP stdio).
 */
class StdioConnection {
  /**
   * @param {Record<string, any>} server Stored server row.
   * @param {{ env: Record<string, string>, logger: ReturnType<typeof log> }} options Spawn inputs.
   */
  constructor(server, options) {
    this.server = server
    this.logger = options.logger
    this.env = options.env
    this.child = undefined
    this.buffer = ''
    this.stderr = ''
    this.pending = new Map()
    this.nextId = 1
    this.closed = false
    this.initResult = undefined
    this.onToolsChanged = undefined
    this.onClose = undefined
  }

  /** Spawn the server and complete the MCP handshake. */
  async start() {
    const command = String(this.server.command ?? '').trim()
    if (command.length === 0) throw new Error('Falta el comando del servidor')
    const args = Array.isArray(this.server.args) ? this.server.args.map(String) : []
    const cwd = typeof this.server.cwd === 'string' && this.server.cwd.length > 0 ? this.server.cwd : undefined

    const child = spawn(command, args, {
      cwd,
      env: this.env,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    })
    this.child = child
    child.on('error', error => {
      this.failAll(new Error(`No se pudo iniciar «${command}»: ${errorMessage(error)}`))
    })
    child.on('exit', (code, signal) => {
      const detail = this.stderr.trim().split(/\r?\n/).slice(-6).join('\n')
      const reason = detail.length > 0 ? detail : `el proceso terminó (${signal ?? `código ${code}`})`
      this.failAll(new Error(reason))
      this.closed = true
      this.onClose?.(reason)
    })
    child.stdout?.setEncoding('utf8')
    child.stdout?.on('data', chunk => this.feed(chunk))
    child.stderr?.setEncoding('utf8')
    child.stderr?.on('data', chunk => {
      this.stderr = `${this.stderr}${chunk}`.slice(-8_000)
    })

    await this.handshake()
    return this.initResult
  }

  /** Complete `initialize` and announce the client as initialized. */
  async handshake() {
    const result = await this.request('initialize', {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: 'dsh-tools-mcp', version: '1.0.0' },
    }, CONTROL_TIMEOUT_MS)
    this.initResult = result
    this.notify('notifications/initialized', {})
    return result
  }

  /**
   * Append stream bytes and dispatch every complete line.
   * @param {string} chunk Decoded stdout chunk.
   */
  feed(chunk) {
    this.buffer += chunk
    for (;;) {
      const index = this.buffer.indexOf('\n')
      if (index < 0) break
      const line = this.buffer.slice(0, index).trim()
      this.buffer = this.buffer.slice(index + 1)
      if (line.length === 0) continue
      let message
      try {
        message = JSON.parse(line)
      } catch {
        continue
      }
      this.dispatch(message)
    }
  }

  /**
   * Route one decoded JSON-RPC message.
   * @param {Record<string, any>} message Parsed message.
   */
  dispatch(message) {
    if (message === null || typeof message !== 'object') return
    if (typeof message.id === 'number' && (message.result !== undefined || message.error !== undefined)) {
      const entry = this.pending.get(message.id)
      if (entry === undefined) return
      this.pending.delete(message.id)
      entry.cleanup()
      if (message.error !== undefined) {
        entry.reject(new Error(message.error?.message ?? 'El servidor devolvió un error JSON-RPC'))
      } else {
        entry.resolve(message.result)
      }
      return
    }
    if (typeof message.method !== 'string') return
    if (message.id !== undefined) {
      this.answerServerRequest(message)
      return
    }
    if (message.method === 'notifications/tools/list_changed') {
      this.onToolsChanged?.()
      return
    }
    if (message.method === 'notifications/message') {
      this.logger.info(`notificación: ${safeJson(message.params)}`)
    }
  }

  /**
   * Reply to a server-initiated request with the small capability set we own.
   * @param {Record<string, any>} message Server request.
   */
  answerServerRequest(message) {
    if (message.method === 'ping') {
      this.send({ jsonrpc: '2.0', id: message.id, result: {} })
      return
    }
    this.send({
      jsonrpc: '2.0',
      id: message.id,
      error: { code: -32601, message: `El cliente no admite ${String(message.method)}` },
    })
  }

  /**
   * Write one JSON-RPC message.
   * @param {Record<string, any>} message Message to send.
   */
  send(message) {
    if (this.closed || this.child?.stdin === undefined || this.child.stdin.destroyed) return
    this.child.stdin.write(`${JSON.stringify(message)}\n`)
  }

  /**
   * Send a JSON-RPC request and await its result.
   * @param {string} method Method name.
   * @param {Record<string, any>} params Request parameters.
   * @param {number} timeoutMs Budget in milliseconds.
   * @param {AbortSignal} [signal] Caller cancellation.
   * @returns {Promise<any>} The result payload.
   */
  request(method, params, timeoutMs, signal) {
    if (this.closed) return Promise.reject(new Error('La conexión está cerrada'))
    const id = this.nextId++
    return new Promise((resolvePromise, rejectPromise) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        rejectPromise(new Error(`«${method}» no respondió en ${Math.round(timeoutMs / 1000)} s`))
      }, timeoutMs)
      const onAbort = () => {
        this.pending.delete(id)
        clearTimeout(timer)
        rejectPromise(new Error('La llamada se canceló'))
      }
      if (signal !== undefined) {
        if (signal.aborted) {
          clearTimeout(timer)
          rejectPromise(new Error('La llamada se canceló'))
          return
        }
        signal.addEventListener('abort', onAbort, { once: true })
      }
      const cleanup = () => {
        clearTimeout(timer)
        signal?.removeEventListener('abort', onAbort)
      }
      this.pending.set(id, { resolve: resolvePromise, reject: rejectPromise, cleanup })
      this.send({ jsonrpc: '2.0', id, method, params })
    })
  }

  /**
   * Send a JSON-RPC notification.
   * @param {string} method Method name.
   * @param {Record<string, any>} params Notification parameters.
   */
  notify(method, params) {
    this.send({ jsonrpc: '2.0', method, params })
  }

  /**
   * Reject every in-flight request.
   * @param {Error} error Reason.
   */
  failAll(error) {
    for (const entry of this.pending.values()) {
      entry.cleanup()
      entry.reject(error)
    }
    this.pending.clear()
  }

  /** Terminate the child process. */
  async close() {
    this.closed = true
    this.failAll(new Error('La conexión se cerró'))
    const child = this.child
    if (child === undefined) return
    try {
      child.stdin?.end()
    } catch {
      // The pipe may already be gone.
    }
    if (child.exitCode === null && child.signalCode === null) {
      try {
        child.kill('SIGTERM')
      } catch {
        // Process already reaped.
      }
      await new Promise(resolvePromise => {
        const timer = setTimeout(() => {
          try {
            child.kill('SIGKILL')
          } catch {
            // Process already reaped.
          }
          resolvePromise()
        }, 2_000)
        child.once('exit', () => {
          clearTimeout(timer)
          resolvePromise()
        })
      })
    }
  }
}

/**
 * MCP Streamable HTTP transport: POST one JSON-RPC message per request and read
 * either a JSON body or an SSE stream carrying the matching response.
 */
class HttpConnection {
  /**
   * @param {Record<string, any>} server Stored server row.
   * @param {{ logger: ReturnType<typeof log> }} options Diagnostics.
   */
  constructor(server, options) {
    this.server = server
    this.logger = options.logger
    this.url = String(server.url ?? '')
    this.sessionId = undefined
    this.nextId = 1
    this.closed = false
    this.initResult = undefined
    this.onToolsChanged = undefined
    this.onClose = undefined
  }

  /** Complete the MCP handshake over Streamable HTTP. */
  async start() {
    const parsed = new URL(this.url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('La URL debe usar http o https')
    }
    await this.handshake()
    return this.initResult
  }

  /** Complete `initialize` and announce the client as initialized. */
  async handshake() {
    const result = await this.request('initialize', {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: 'dsh-tools-mcp', version: '1.0.0' },
    }, CONTROL_TIMEOUT_MS)
    this.initResult = result
    await this.post({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} })
    return result
  }

  /** @returns Request headers, including authentication and session state. */
  headers() {
    const headers = {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    }
    if (this.sessionId !== undefined) headers['mcp-session-id'] = this.sessionId
    if (this.server.auth === 'bearer' && typeof this.server.token === 'string' && this.server.token.length > 0) {
      headers.authorization = `Bearer ${this.server.token}`
    }
    return headers
  }

  /**
   * POST one JSON-RPC message, returning its response message when it has one.
   * @param {Record<string, any>} message Outgoing message.
   * @param {AbortSignal} [signal] Caller cancellation.
   * @returns {Promise<Record<string, any> | undefined>} The response, if any.
   */
  async post(message, signal) {
    let response
    try {
      response = await fetch(this.url, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(message),
        signal,
      })
    } catch (error) {
      if (signal?.aborted === true) throw new Error('La llamada se canceló')
      throw new Error(`No se pudo conectar con ${this.url}: ${fetchFailure(error)}`)
    }
    const session = response.headers.get('mcp-session-id')
    if (session !== null && session.length > 0) this.sessionId = session
    if (response.status === 202 || response.status === 204) return undefined

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error(`El servidor respondió ${String(response.status)}${detail.length > 0 ? `: ${detail.slice(0, 300)}` : ''}`)
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('text/event-stream')) {
      return this.readSse(response, message.id, signal)
    }
    const text = await response.text()
    if (text.trim().length === 0) return undefined
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed.find(candidate => candidate?.id === message.id) ?? parsed.at(-1) : parsed
  }

  /**
   * Read an SSE body until the response carrying `id` arrives.
   * @param {Response} response Streaming response.
   * @param {number | undefined} id Request id to match.
   * @param {AbortSignal} [signal] Caller cancellation.
   * @returns {Promise<Record<string, any>>} The matching JSON-RPC response.
   */
  async readSse(response, id, signal) {
    if (response.body === null) throw new Error('El servidor devolvió una respuesta SSE vacía')
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let found
    try {
      for (;;) {
        if (signal?.aborted === true) throw new Error('La llamada se canceló')
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        let boundary = buffer.indexOf('\n\n')
        while (boundary >= 0) {
          const event = buffer.slice(0, boundary)
          buffer = buffer.slice(boundary + 2)
          boundary = buffer.indexOf('\n\n')
          const data = event
            .split(/\r?\n/)
            .filter(line => line.startsWith('data:'))
            .map(line => line.slice(5).trimStart())
            .join('\n')
          if (data.length === 0) continue
          let parsed
          try {
            parsed = JSON.parse(data)
          } catch {
            continue
          }
          if (parsed?.method === 'notifications/tools/list_changed') {
            this.onToolsChanged?.()
            continue
          }
          if (id !== undefined && parsed?.id === id) {
            found = parsed
            break
          }
        }
        if (found !== undefined) break
      }
    } finally {
      try {
        await reader.cancel()
      } catch {
        // Stream already closed.
      }
    }
    if (found === undefined) throw new Error('El flujo SSE terminó sin la respuesta esperada')
    return found
  }

  /**
   * Send a JSON-RPC request and await its result.
   * @param {string} method Method name.
   * @param {Record<string, any>} params Request parameters.
   * @param {number} timeoutMs Budget in milliseconds.
   * @param {AbortSignal} [signal] Caller cancellation.
   * @returns {Promise<any>} The result payload.
   */
  async request(method, params, timeoutMs, signal) {
    if (this.closed) throw new Error('La conexión está cerrada')
    const id = this.nextId++
    const timeout = AbortSignal.timeout(timeoutMs)
    const combined = signal === undefined
      ? timeout
      : typeof AbortSignal.any === 'function'
        ? AbortSignal.any([signal, timeout])
        : signal
    const message = await this.post({ jsonrpc: '2.0', id, method, params }, combined)
    if (message === undefined) throw new Error(`«${method}» no devolvió respuesta`)
    if (message.error !== undefined) {
      throw new Error(message.error?.message ?? 'El servidor devolvió un error JSON-RPC')
    }
    return message.result
  }

  /** Mark the connection closed; HTTP holds no socket of its own. */
  async close() {
    this.closed = true
    const session = this.sessionId
    this.sessionId = undefined
    if (session === undefined) return
    // Best-effort session termination, per the Streamable HTTP revision.
    try {
      await fetch(this.url, {
        method: 'DELETE',
        headers: {
          ...this.headers(),
          'mcp-session-id': session,
        },
        signal: AbortSignal.timeout(2_000),
      })
    } catch {
      // A server that does not implement DELETE simply keeps the session.
    }
  }
}

/**
 * Reduce a fetch rejection to its most specific cause.
 * @param {unknown} error Thrown fetch error.
 * @returns Short diagnostic.
 */
function fetchFailure(error) {
  const cause = error?.cause
  if (cause?.code !== undefined) return `${cause.code}${cause.syscall ? ` (${cause.syscall})` : ''}`
  if (typeof cause?.message === 'string' && cause.message.length > 0) return cause.message
  return errorMessage(error)
}

/**
 * Ensure a login-shell PATH is available for stdio commands, so `npx` and other
 * tools resolve the same way they do in the user's terminal.
 * @param {ReturnType<typeof log>} logger Diagnostics.
 * @returns {Promise<string | undefined>} A PATH value, or undefined when the probe failed.
 */
function loginPath(logger) {
  const shell = process.env.SHELL ?? '/bin/zsh'
  return new Promise(resolvePromise => {
    let settled = false
    const finish = value => {
      if (settled) return
      settled = true
      resolvePromise(value)
    }
    let child
    try {
      child = spawn(shell, ['-ilc', 'printf "__DSH_PATH__%s" "$PATH"'], {
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: PATH_PROBE_TIMEOUT_MS,
      })
    } catch (error) {
      logger.warn(`no se pudo probar el PATH del intérprete: ${errorMessage(error)}`)
      finish(undefined)
      return
    }
    let output = ''
    child.stdout?.setEncoding('utf8')
    child.stdout?.on('data', chunk => {
      output += chunk
    })
    child.on('error', () => finish(undefined))
    child.on('exit', () => {
      const marker = output.lastIndexOf('__DSH_PATH__')
      const path = marker >= 0 ? output.slice(marker + '__DSH_PATH__'.length).trim() : ''
      finish(path.length > 0 ? path : undefined)
    })
    setTimeout(() => {
      try {
        child.kill('SIGKILL')
      } catch {
        // Already exited.
      }
      finish(undefined)
    }, PATH_PROBE_TIMEOUT_MS + 500).unref?.()
  })
}

/**
 * Host-side manager for the configured MCP servers.
 */
class ToolServerManager {
  /**
   * @param {import('@deepseek-ai/cordis').Context} ctx Plugin context.
   */
  constructor(ctx) {
    this.ctx = ctx
    this.logger = log(ctx)
    this.servers = readStore().map(row => ({
      ...row,
      args: Array.isArray(row.args) ? row.args.map(String) : [],
      env: typeof row.env === 'object' && row.env !== null ? { ...row.env } : {},
      autoConnect: row.autoConnect !== false,
      permissions: normalizePermissions(row.permissions),
      runtime: {
        status: 'idle',
        tools: [],
        disposers: new Map(),
        publicNames: new Map(),
        connection: undefined,
        protocolVersion: undefined,
        serverInfo: undefined,
        error: undefined,
      },
    }))
    this.loginPath = undefined
    /** Public tool name -> owning server and raw tool name, for call policy. */
    this.toolIndex = new Map()
  }

  /** Assign stable namespace slugs, de-duplicating collisions. */
  normalizeSlugs() {
    const taken = new Set()
    for (const server of this.servers) {
      let base = slugify(String(server.name ?? 'server'))
      let slug = base
      let suffix = 2
      while (taken.has(slug)) {
        slug = `${base.slice(0, 30)}-${String(suffix++)}`
      }
      taken.add(slug)
      server.slug = slug
    }
  }

  /** Rebuild the public-name index from every server's current registration. */
  rebuildToolIndex() {
    const index = new Map()
    for (const server of this.servers) {
      for (const [rawName, publicName] of server.runtime.publicNames) {
        index.set(publicName, { serverId: server.id, rawName })
      }
    }
    this.toolIndex = index
  }

  /**
   * Effective permission for one tool of one server.
   * @param {Record<string, any>} server Server row.
   * @param {string} rawName The server's own tool name.
   * @returns {'allow' | 'ask' | 'deny'} Effective permission.
   */
  permissionFor(server, rawName) {
    const value = server.permissions?.[rawName]
    return value === 'ask' || value === 'deny' ? value : 'allow'
  }

  /**
   * Connect every server marked auto-connect, without delaying activation.
   * @returns {Promise<void>} Resolves when the attempts settle.
   */
  async startAutoConnect() {
    this.normalizeSlugs()
    const targets = this.servers.filter(server => server.autoConnect === true)
    await Promise.allSettled(targets.map(server => this.connect(server)))
  }

  /**
   * Find a server by id.
   * @param {string} id Server id.
   * @returns {Record<string, any> | undefined} The row.
   */
  find(id) {
    return this.servers.find(server => server.id === id)
  }

  /** Persist the durable fields of every server. */
  persist() {
    writeStore(this.servers.map(({ runtime, slug, ...row }) => row))
  }

  /**
   * Build the spawn environment for one stdio server.
   * @param {Record<string, string>} extra Explicit server environment.
   * @returns {Promise<Record<string, string>>} Environment for the child.
   */
  async environment(extra) {
    if (this.loginPath === undefined) this.loginPath = await loginPath(this.logger)
    const env = scrubbedEnvironment(process.env)
    if (this.loginPath !== undefined) env.PATH = this.loginPath
    return { ...env, ...extra }
  }

  /**
   * Open the server's connection and register its tools.
   * @param {Record<string, any>} server Server row.
   * @returns {Promise<void>} Resolves when connected or settled with an error.
   */
  async connect(server) {
    const runtime = server.runtime
    if (runtime.status === 'connected' || runtime.status === 'connecting') return
    runtime.status = 'connecting'
    runtime.error = undefined
    runtime.protocolVersion = undefined
    runtime.serverInfo = undefined

    let connection
    try {
      if (server.transport === 'http') {
        connection = new HttpConnection(server, { logger: this.logger })
      } else {
        const env = await this.environment(server.env ?? {})
        connection = new StdioConnection(server, { env, logger: this.logger })
      }
      runtime.connection = connection
      connection.onToolsChanged = () => {
        this.syncTools(server).catch(error => {
          this.logger.warn(`${server.name}: no se pudo refrescar la lista de herramientas: ${errorMessage(error)}`)
        })
      }
      connection.onClose = reason => {
        this.onConnectionClosed(server, reason)
      }
      const init = await connection.start()
      runtime.protocolVersion = typeof init?.protocolVersion === 'string' ? init.protocolVersion : undefined
      runtime.serverInfo = init?.serverInfo ?? undefined
      await this.syncTools(server)
      runtime.status = 'connected'
      this.logger.info(`${server.name}: conectado (${String(runtime.tools.length)} herramientas)`)
    } catch (error) {
      runtime.status = 'error'
      runtime.error = errorMessage(error)
      this.logger.warn(`${server.name}: ${runtime.error}`)
      await this.disposeConnection(server)
    }
  }

  /**
   * Refresh the tool generation of one connected server.
   * @param {Record<string, any>} server Server row.
   * @returns {Promise<void>} Resolves after the swap.
   */
  async syncTools(server) {
    const runtime = server.runtime
    const connection = runtime.connection
    if (connection === undefined) return
    const tools = []
    let cursor
    for (let page = 0; page < 50; page += 1) {
      const result = await connection.request('tools/list', cursor === undefined ? {} : { cursor }, CONTROL_TIMEOUT_MS)
      if (Array.isArray(result?.tools)) tools.push(...result.tools)
      cursor = result?.nextCursor
      if (typeof cursor !== 'string' || cursor.length === 0) break
    }

    const nextDisposers = new Map()
    const nextNames = new Map()
    for (const tool of tools) {
      if (typeof tool?.name !== 'string' || tool.name.length === 0) continue
      // A denied tool is never offered to the model: hiding it at registration
      // keeps the tool list honest instead of failing every call at execution.
      if (this.permissionFor(server, tool.name) === 'deny') continue
      const publicName = publicToolName(server.slug, tool.name)
      try {
        const dispose = this.ctx.tools.register(this.toolDefinition(server, tool, publicName))
        nextDisposers.set(tool.name, dispose)
        nextNames.set(tool.name, publicName)
      } catch (error) {
        this.logger.warn(`${server.name}/${tool.name}: no se pudo registrar la herramienta: ${errorMessage(error)}`)
      }
    }
    for (const dispose of runtime.disposers.values()) dispose()
    runtime.disposers = nextDisposers
    runtime.publicNames = nextNames
    runtime.tools = tools
      .filter(tool => typeof tool?.name === 'string')
      .map(tool => ({
        name: tool.name,
        description: typeof tool.description === 'string' ? tool.description : '',
        readOnly: tool.annotations?.readOnlyHint === true,
        destructive: tool.annotations?.destructiveHint === true,
      }))
    this.rebuildToolIndex()
  }

  /**
   * Adapt one MCP tool to a registry definition.
   * @param {Record<string, any>} server Server row.
   * @param {Record<string, any>} tool MCP tool descriptor.
   * @param {string} publicName Registry name.
   * @returns {Record<string, any>} Tool definition.
   */
  toolDefinition(server, tool, publicName) {
    const rawName = tool.name
    const description = typeof tool.description === 'string' && tool.description.trim().length > 0
      ? tool.description
      : `Herramienta «${rawName}» del servidor MCP ${server.name}.`
    return {
      name: publicName,
      description,
      parameters: parameterSchema(tool.inputSchema),
      timeoutMs: TOOL_TIMEOUT_MS,
      output: {
        schema: {
          type: 'object',
          properties: { content: { type: 'array', items: {} } },
          required: ['content'],
          additionalProperties: false,
        },
        render: (_args, value) => [{ type: 'text', text: extractText(value?.content, rawName) }],
      },
      execute: async (args, exec) => {
        const connection = server.runtime.connection
        if (connection === undefined || server.runtime.status !== 'connected') {
          throw new Error(`El servidor MCP ${server.name} no está conectado`)
        }
        const result = await connection.request(
          'tools/call',
          { name: rawName, arguments: typeof args === 'object' && args !== null ? args : {} },
          TOOL_TIMEOUT_MS,
          exec?.signal,
        )
        if (result?.isError === true) throw new Error(extractText(result.content, rawName))
        return { content: Array.isArray(result?.content) ? result.content : [] }
      },
    }
  }

  /**
   * Handle a lost connection: drop its tools, record the reason.
   * @param {Record<string, any>} server Server row.
   * @param {string} reason Failure text.
   */
  onConnectionClosed(server, reason) {
    const runtime = server.runtime
    if (runtime.status !== 'connected' && runtime.status !== 'connecting') return
    runtime.status = 'error'
    runtime.error = reason
    for (const dispose of runtime.disposers.values()) dispose()
    runtime.disposers = new Map()
    runtime.publicNames = new Map()
    runtime.connection = undefined
    this.rebuildToolIndex()
    this.logger.warn(`${server.name}: conexión perdida: ${reason}`)
  }

  /**
   * Close the runtime connection and unregister its tools.
   * @param {Record<string, any>} server Server row.
   * @returns {Promise<void>} Resolves after teardown.
   */
  async disposeConnection(server) {
    const runtime = server.runtime
    for (const dispose of runtime.disposers.values()) dispose()
    runtime.disposers = new Map()
    runtime.publicNames = new Map()
    this.rebuildToolIndex()
    const connection = runtime.connection
    runtime.connection = undefined
    if (connection !== undefined) {
      try {
        await connection.close()
      } catch (error) {
        this.logger.warn(`${server.name}: ${errorMessage(error)}`)
      }
    }
  }

  /**
   * Close one server's connection and mark it disconnected.
   * @param {Record<string, any>} server Server row.
   * @returns {Promise<void>} Resolves after teardown.
   */
  async disconnect(server) {
    await this.disposeConnection(server)
    server.runtime.status = 'idle'
    server.runtime.error = undefined
  }

  /**
   * Serialize one server for the Settings page.
   * @param {Record<string, any>} server Server row.
   * @returns {Record<string, any>} Wire view.
   */
  view(server) {
    const runtime = server.runtime
    return {
      id: server.id,
      name: server.name,
      slug: server.slug,
      transport: server.transport,
      command: server.command ?? '',
      args: Array.isArray(server.args) ? server.args : [],
      env: server.env ?? {},
      url: server.url ?? '',
      auth: server.auth === 'bearer' ? 'bearer' : 'none',
      hasToken: typeof server.token === 'string' && server.token.length > 0,
      autoConnect: server.autoConnect === true,
      permissions: server.permissions ?? {},
      status: runtime.status,
      protocolVersion: runtime.protocolVersion,
      serverInfo: runtime.serverInfo,
      toolCount: runtime.tools.length,
      tools: runtime.tools,
      error: runtime.error,
      target: targetOf(server),
    }
  }

  /** @returns The wire view of every server. */
  list() {
    return this.servers.map(server => this.view(server))
  }

  /**
   * Validate and normalize one server payload from the page.
   * @param {Record<string, any>} input Untrusted payload.
   * @param {Record<string, any>} [existing] Row being edited.
   * @returns {Record<string, any>} Normalized durable fields.
   */
  normalizeInput(input, existing) {
    if (typeof input !== 'object' || input === null) throw new Error('Datos del servidor no válidos')
    const name = typeof input.name === 'string' ? input.name.trim() : ''
    if (name.length === 0) throw new Error('El nombre es obligatorio')
    if (name.length > 80) throw new Error('El nombre no puede superar los 80 caracteres')

    const transport = input.transport === 'http' ? 'http' : 'stdio'
    const row = {
      name,
      transport,
      autoConnect: input.autoConnect !== false,
      command: '',
      args: [],
      env: {},
      url: '',
      auth: 'none',
      token: '',
    }

    if (transport === 'stdio') {
      const command = typeof input.command === 'string' ? input.command.trim() : ''
      if (command.length === 0) throw new Error('El comando es obligatorio')
      row.command = command
      row.args = Array.isArray(input.args)
        ? input.args.map(entry => String(entry)).filter(entry => entry.length > 0)
        : splitArguments(typeof input.args === 'string' ? input.args : '')
      row.env = normalizeEnvironment(input.env)
    } else {
      const url = typeof input.url === 'string' ? input.url.trim() : ''
      if (url.length === 0) throw new Error('La URL es obligatoria')
      let parsed
      try {
        parsed = new URL(url)
      } catch {
        throw new Error('La URL no es válida')
      }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('La URL debe usar http o https')
      row.url = url
      if (input.auth === 'bearer') {
        row.auth = 'bearer'
        const token = typeof input.token === 'string' && input.token.length > 0
          ? input.token
          : typeof existing?.token === 'string' ? existing.token : ''
        if (token.length === 0 && input.clearToken !== true) throw new Error('Falta el token de acceso')
        row.token = token
      }
    }

    if (existing?.id !== undefined) row.id = existing.id
    return row
  }
}

/**
 * Split a command-line argument string the way a shell would for quotes.
 * @param {string} text Raw argument text.
 * @returns {string[]} Argument tokens.
 */
function splitArguments(text) {
  const tokens = []
  let current = ''
  let quote = undefined
  let started = false
  for (const character of text) {
    if (quote !== undefined) {
      if (character === quote) {
        quote = undefined
      } else {
        current += character
      }
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      started = true
      continue
    }
    if (/\s/.test(character)) {
      if (started || current.length > 0) {
        tokens.push(current)
        current = ''
        started = false
      }
      continue
    }
    current += character
    started = true
  }
  if (started || current.length > 0) tokens.push(current)
  return tokens.filter(token => token.length > 0)
}

/**
 * Validate an environment map from the page.
 * @param {unknown} input Untrusted environment.
 * @returns {Record<string, string>} Normalized map.
 */
function normalizeEnvironment(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return {}
  const env = {}
  for (const [key, value] of Object.entries(input)) {
    const name = key.trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw new Error(`Nombre de variable no válido: ${name}`)
    env[name] = String(value ?? '')
  }
  return env
}

/**
 * Validate the per-tool permission map.
 * @param {unknown} input Untrusted map.
 * @returns {Record<string, 'allow' | 'ask' | 'deny'>} Normalized map.
 */
function normalizePermissions(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return {}
  const out = {}
  for (const [name, value] of Object.entries(input)) {
    if (typeof name !== 'string' || name.length === 0) continue
    if (value === 'allow' || value === 'ask' || value === 'deny') out[name] = value
  }
  return out
}

/**
 * Read a JSON request body with a size ceiling.
 * @param {import('node:http').IncomingMessage} request Incoming request.
 * @returns {Promise<Record<string, any>>} Parsed body.
 */
async function readJsonBody(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw new Error('El cuerpo de la petición es demasiado grande')
    chunks.push(chunk)
  }
  if (size === 0) return {}
  const text = Buffer.concat(chunks).toString('utf8')
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('El cuerpo de la petición no es JSON válido')
  }
}

/**
 * Answer one request from the Settings page.
 * @param {ToolServerManager} manager Server manager.
 * @param {import('node:http').IncomingMessage} request Incoming request.
 * @param {import('node:http').ServerResponse} response Outgoing response.
 * @returns {Promise<void>} Resolves when the response ends.
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
    // Same-origin only: a custom header forces a CORS preflight for any
    // cross-origin caller, and this route never answers one.
    if (request.headers['x-dsh-tools'] !== '1') {
      reply(403, { ok: false, error: 'Petición no autorizada' })
      return
    }
    const url = new URL(request.url ?? ROUTE, `http://${request.headers.host ?? 'localhost'}`)
    const path = url.pathname.startsWith(ROUTE) ? url.pathname.slice(ROUTE.length) : url.pathname
    const segments = path.split('/').filter(segment => segment.length > 0)
    const method = request.method ?? 'GET'

    if (segments[0] === 'health' && method === 'GET') {
      reply(200, { ok: true, data: { servers: manager.servers.length } })
      return
    }

    if (segments[0] === 'servers' && segments.length === 1) {
      if (method === 'GET') {
        reply(200, { ok: true, data: { servers: manager.list() } })
        return
      }
      if (method === 'POST') {
        const body = await readJsonBody(request)
        const fields = manager.normalizeInput(body)
        const server = {
          id: randomBytes(8).toString('hex'),
          ...fields,
          runtime: {
            status: 'idle',
            tools: [],
            disposers: new Map(),
            publicNames: new Map(),
            connection: undefined,
            protocolVersion: undefined,
            serverInfo: undefined,
            error: undefined,
          },
        }
        manager.servers.push(server)
        manager.normalizeSlugs()
        manager.persist()
        // Answer while the connection attempt runs; the page polls for the
        // settled status, so a slow server never blocks the form.
        const connecting = server.autoConnect ? manager.connect(server) : Promise.resolve()
        if (server.autoConnect) server.runtime.status = 'connecting'
        void connecting.catch(error => {
          manager.logger.warn(`${server.name}: ${errorMessage(error)}`)
        })
        reply(200, { ok: true, data: { server: manager.view(server), servers: manager.list() } })
        return
      }
      reply(405, { ok: false, error: 'Método no permitido' })
      return
    }

    if (segments[0] === 'servers' && segments.length >= 2) {
      const server = manager.find(segments[1])
      if (server === undefined) {
        reply(404, { ok: false, error: 'El servidor no existe' })
        return
      }
      const action = segments[2]

      if (action === 'permissions' && method === 'PUT') {
        const body = await readJsonBody(request)
        server.permissions = normalizePermissions(body?.permissions)
        manager.persist()
        if (server.runtime.status === 'connected') await manager.syncTools(server)
        reply(200, { ok: true, data: { server: manager.view(server), servers: manager.list() } })
        return
      }

      if (action === undefined && method === 'PUT') {
        const body = await readJsonBody(request)
        const fields = manager.normalizeInput(body, server)
        const wasConnected = server.runtime.status === 'connected'
        if (wasConnected) await manager.disconnect(server)
        Object.assign(server, fields)
        manager.normalizeSlugs()
        manager.persist()
        // A connected server keeps following its connection preference.
        if (wasConnected || (server.autoConnect && body.autoConnect !== false)) {
          await manager.connect(server)
        }
        reply(200, { ok: true, data: { server: manager.view(server), servers: manager.list() } })
        return
      }

      if (action === undefined && method === 'DELETE') {
        await manager.disconnect(server)
        manager.servers = manager.servers.filter(entry => entry.id !== server.id)
        manager.persist()
        reply(200, { ok: true, data: { servers: manager.list() } })
        return
      }

      if (action === 'connect' && method === 'POST') {
        await manager.connect(server)
        reply(200, { ok: true, data: { server: manager.view(server), servers: manager.list() } })
        return
      }

      if (action === 'disconnect' && method === 'POST') {
        await manager.disconnect(server)
        reply(200, { ok: true, data: { server: manager.view(server), servers: manager.list() } })
        return
      }

      reply(405, { ok: false, error: 'Método no permitido' })
      return
    }

    reply(404, { ok: false, error: 'Ruta desconocida' })
  } catch (error) {
    try {
      reply(400, { ok: false, error: errorMessage(error) })
    } catch {
      // The connection may already be gone.
    }
  }
}

/**
 * Mount the manager, its route, and the auto-connect pass.
 * @param {import('@deepseek-ai/cordis').Context} ctx Plugin context.
 */
export function apply(ctx) {
  const manager = new ToolServerManager(ctx)

  ctx.effect(() => {
    const disposeRoute = ctx.webServer.register({
      kind: 'prefix',
      path: ROUTE,
      handler: (request, response) => {
        void handleRequest(manager, request, response)
      },
    })
    return () => {
      disposeRoute()
    }
  }, 'tools-mcp route')

  ctx.effect(() => {
    const dispose = ctx.on('tools/pre-execute', async (exec, next) => {
      const decision = await next()
      const entry = manager.toolIndex.get(exec.name)
      if (entry === undefined) return decision
      const server = manager.find(entry.serverId)
      if (server === undefined) return decision
      if (manager.permissionFor(server, entry.rawName) !== 'ask') return decision
      // Never weaken a stronger decision taken further down the chain.
      if (decision?.kind !== 'allow') return decision
      return {
        kind: 'ask',
        reason: `La herramienta MCP «${entry.rawName}» del servidor ${server.name} requiere aprobación`,
        displayReason: `${server.name}: ${entry.rawName} requiere aprobación`,
      }
    })
    return () => {
      dispose()
    }
  }, 'tools-mcp approval policy')

  ctx.effect(() => {
    void manager.startAutoConnect().catch(error => {
      ctx.logger?.warn?.(`tools-mcp: ${errorMessage(error)}`)
    })
    return async () => {
      await Promise.allSettled(manager.servers.map(server => manager.disconnect(server)))
    }
  }, 'tools-mcp connections')
}
