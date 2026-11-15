/**
 * Retro AI OS — Host half.
 *
 * Persists the visual preferences (enabled, style, companion, animations and
 * the optional custom brand) in `$DSH_HOME/retro-ai-os/preferences.json`,
 * stores uploaded brand logos under `$DSH_HOME/retro-ai-os/brand/`, and serves
 * the preference route, the bundled brand typefaces and the uploaded logo over
 * same-origin HTTP. The palette and the brand artwork themselves are applied by
 * the Client half, so switching everything off restores the host theme and the
 * stock DeepSeek marks exactly.
 *
 * @module @local/retro-ai-os
 */

import { createHash, randomBytes } from 'node:crypto'
import {
  chmodSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Services this plugin cannot work without. */
export const inject = ['webServer']

/** Same-origin route prefix used by the browser half. */
const ROUTE = '/dsh-retro-ai-os'

/** Custom header that forces a CORS preflight for cross-origin callers. */
const HEADER = 'x-dsh-retro-ai-os'

/** Request body ceiling (a logo upload arrives as a base64 data URL). */
const MAX_BODY_BYTES = 720 * 1024

/** Largest decoded logo accepted. */
const MAX_ASSET_BYTES = 400 * 1024

/** Style ids the Client half can render. */
const STYLES = new Set(['classic', 'amber', 'vapor', 'cobalt', 'matrix'])

/** Brand mark placements. */
const BRAND_MARKS = new Set(['default', 'custom', 'none'])

/** Typeface ids bundled with the plugin (kept in sync with client.js). */
const BRAND_FONTS = new Set([
  'system', 'arcade', 'terminal', 'orbitron', 'neon', 'roman', 'editorial', 'syne', 'bebas', 'bungee', 'mono',
])

/** Bundled WOFF2 files served under /fonts/. */
const FONT_FILES = new Map([
  ['press-start-2p.woff2', 'arcade'],
  ['vt323.woff2', 'terminal'],
  ['orbitron.woff2', 'orbitron'],
  ['monoton.woff2', 'neon'],
  ['cinzel.woff2', 'roman'],
  ['bricolage-grotesque.woff2', 'editorial'],
  ['syne.woff2', 'syne'],
  ['bebas-neue.woff2', 'bebas'],
  ['bungee.woff2', 'bungee'],
  ['ibm-plex-mono.woff2', 'mono'],
])

/** Uploaded logo file names: content hash plus a known image extension. */
const ASSET_NAME = /^brand-[a-f0-9]{16}\.(png|jpg|webp|gif|svg)$/

/** Media types the logo endpoint can produce. */
const ASSET_TYPES = Object.freeze({
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
})

/** Folder holding the bundled typefaces. */
const FONT_DIRECTORY = fileURLToPath(new URL('./fonts/', import.meta.url))

/** Persisted brand defaults. */
const BRAND_DEFAULTS = Object.freeze({
  on: false,
  seeded: false,
  sidebarText: '',
  heroText: '',
  sidebarMark: 'default',
  heroMark: 'default',
  markScale: 1,
  font: 'system',
  badge: true,
  asset: null,
})

/** Persisted defaults. */
const DEFAULTS = Object.freeze({
  version: 2,
  enabled: false,
  style: 'classic',
  mascot: true,
  animation: true,
  brand: BRAND_DEFAULTS,
})

/**
 * Resolve the plugin's durable directory.
 * @returns {string} Absolute directory path.
 */
export function storeDirectory() {
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'retro-ai-os')
}

/** @returns {string} The persisted document path. */
export function storeFile() {
  return join(storeDirectory(), 'preferences.json')
}

/** @returns {string} The directory holding uploaded brand logos. */
export function assetDirectory() {
  return join(storeDirectory(), 'brand')
}

/**
 * Build an error carrying a stable code the browser half can report.
 * @param {string} code Stable error code.
 * @param {number} [status] HTTP status.
 * @returns {Error & { code: string, status?: number }} The error.
 */
function fail(code, status = 400) {
  const error = new Error(code)
  error.code = code
  error.status = status
  return error
}

/**
 * Validate one optional boolean preference.
 * @param {unknown} value Submitted value.
 * @param {string} code Error code for a wrong type.
 * @param {boolean} fallback Default when absent.
 * @returns {boolean} The value or the default.
 */
function booleanOf(value, code, fallback) {
  if (value === undefined) return fallback
  if (typeof value !== 'boolean') throw fail(code)
  return value
}

/**
 * Validate one optional short text preference.
 * @param {unknown} value Submitted value.
 * @param {string} code Error code for a wrong type.
 * @param {number} maximum Longest accepted string.
 * @param {string} fallback Default when absent.
 * @returns {string} The cleaned value.
 */
function textOf(value, code, maximum, fallback = '') {
  if (value === undefined) return fallback
  if (typeof value !== 'string') throw fail(code)
  // Brand strings are single-line UI copy: fold control characters.
  return value.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, maximum)
}

/**
 * Validate one stored logo reference.
 * @param {unknown} value Submitted value.
 * @returns {{ url: string, label: string } | null} The reference or null.
 */
function assetOf(value) {
  if (value === null || value === undefined) return null
  if (typeof value !== 'object' || Array.isArray(value)) throw fail('invalid-brand-asset')
  const url = value.url
  if (typeof url !== 'string' || !url.startsWith(ROUTE + '/assets/')) throw fail('invalid-brand-asset')
  const name = url.slice((ROUTE + '/assets/').length)
  if (!ASSET_NAME.test(name)) throw fail('invalid-brand-asset')
  const label = typeof value.label === 'string' ? value.label.slice(0, 80) : ''
  return { url, label }
}

/** Smallest and largest logo scale the Client half offers. */
const MARK_SCALE_MIN = 0.5
const MARK_SCALE_MAX = 1.5

/**
 * Validate the shared logo scale, clamping it to the supported range.
 * @param {unknown} value Submitted value.
 * @returns {number} A scale between 0.5 and 1.5, two decimals at most.
 */
function scaleOf(value) {
  if (value === undefined) return BRAND_DEFAULTS.markScale
  if (typeof value !== 'number' || !Number.isFinite(value)) throw fail('invalid-brand-scale')
  const clamped = Math.min(MARK_SCALE_MAX, Math.max(MARK_SCALE_MIN, value))
  return Math.round(clamped * 100) / 100
}

/**
 * Validate the custom-brand block, filling omitted fields with defaults.
 * @param {unknown} input Submitted value.
 * @returns {typeof BRAND_DEFAULTS} Valid brand preferences.
 */
function sanitizeBrand(input) {
  if (input === undefined) return { ...BRAND_DEFAULTS }
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw fail('invalid-brand')
  const sidebarMark = input.sidebarMark
  const heroMark = input.heroMark
  const font = input.font
  if (sidebarMark !== undefined && !BRAND_MARKS.has(sidebarMark)) throw fail('invalid-brand-mark')
  if (heroMark !== undefined && !BRAND_MARKS.has(heroMark)) throw fail('invalid-brand-mark')
  if (font !== undefined && !BRAND_FONTS.has(font)) throw fail('invalid-brand-font')
  return {
    on: booleanOf(input.on, 'invalid-brand-on', BRAND_DEFAULTS.on),
    seeded: booleanOf(input.seeded, 'invalid-brand-seeded', BRAND_DEFAULTS.seeded),
    sidebarText: textOf(input.sidebarText, 'invalid-brand-text', 48),
    heroText: textOf(input.heroText, 'invalid-brand-text', 48),
    sidebarMark: sidebarMark ?? BRAND_DEFAULTS.sidebarMark,
    heroMark: heroMark ?? BRAND_DEFAULTS.heroMark,
    font: font ?? BRAND_DEFAULTS.font,
    markScale: scaleOf(input.markScale),
    badge: booleanOf(input.badge, 'invalid-brand-badge', BRAND_DEFAULTS.badge),
    asset: assetOf(input.asset),
  }
}

/**
 * Narrow one stored or submitted preference document.
 * @param {unknown} input Untrusted value.
 * @returns {{ version: number, enabled: boolean, style: string, mascot: boolean, animation: boolean, brand: typeof BRAND_DEFAULTS }} Valid preferences.
 */
function sanitize(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw fail('invalid-preferences')
  const enabled = input.enabled
  const mascot = input.mascot
  const animation = input.animation
  const style = input.style
  if (enabled !== undefined && typeof enabled !== 'boolean') throw fail('invalid-enabled')
  if (mascot !== undefined && typeof mascot !== 'boolean') throw fail('invalid-mascot')
  if (animation !== undefined && typeof animation !== 'boolean') throw fail('invalid-animation')
  if (style !== undefined && !STYLES.has(style)) throw fail('invalid-style')
  return {
    version: 2,
    enabled: enabled ?? DEFAULTS.enabled,
    style: style ?? DEFAULTS.style,
    mascot: mascot ?? DEFAULTS.mascot,
    animation: animation ?? DEFAULTS.animation,
    brand: sanitizeBrand(input.brand),
  }
}

/**
 * Read the stored preferences, tolerating a missing or malformed file.
 * @returns {{ version: number, enabled: boolean, style: string, mascot: boolean, animation: boolean, brand: typeof BRAND_DEFAULTS }} Valid preferences.
 */
export function readPreferences() {
  let text
  try {
    text = readFileSync(storeFile(), 'utf8')
  } catch {
    return { ...DEFAULTS, brand: { ...BRAND_DEFAULTS } }
  }
  try {
    return sanitize(JSON.parse(text))
  } catch {
    return { ...DEFAULTS, brand: { ...BRAND_DEFAULTS } }
  }
}

/**
 * Write the preferences durably: private permissions, temp file then rename.
 * @param {Record<string, unknown>} preferences Valid preferences.
 * @returns {ReturnType<typeof sanitize>} The stored document.
 */
export function writePreferences(preferences) {
  const document = sanitize(preferences)
  mkdirSync(storeDirectory(), { recursive: true, mode: 0o700 })
  const file = storeFile()
  const temporary = file + '.' + randomBytes(4).toString('hex') + '.tmp'
  writeFileSync(temporary, JSON.stringify(document, undefined, 2) + '\n', { mode: 0o600 })
  try {
    chmodSync(temporary, 0o600)
  } catch {
    // Non-POSIX filesystems keep their default mode.
  }
  renameSync(temporary, file)
  return document
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
    if (size > MAX_BODY_BYTES) throw fail('body-too-large', 413)
    chunks.push(chunk)
  }
  if (size === 0) return {}
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    if (typeof value !== 'object' || value === null || Array.isArray(value)) throw fail('invalid-json')
    return value
  } catch (error) {
    if (error?.code === 'invalid-json') throw error
    throw fail('invalid-json')
  }
}

/**
 * Identify the real image format behind a submitted data URL.
 * @param {string} mime Declared media type.
 * @param {Buffer} buffer Decoded bytes.
 * @returns {'png' | 'jpg' | 'webp' | 'gif' | 'svg'} Extension to store.
 */
function extensionOf(mime, buffer) {
  const starts = (...bytes) => bytes.every((byte, index) => buffer[index] === byte)
  if (mime === 'image/png' && starts(0x89, 0x50, 0x4e, 0x47)) return 'png'
  if (mime === 'image/jpeg' && starts(0xff, 0xd8, 0xff)) return 'jpg'
  if (mime === 'image/gif' && buffer.subarray(0, 3).toString('latin1') === 'GIF') return 'gif'
  if (mime === 'image/webp' && buffer.subarray(0, 4).toString('latin1') === 'RIFF'
    && buffer.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp'
  if (mime === 'image/svg+xml') {
    const head = buffer.subarray(0, 4096).toString('utf8').trimStart()
    if (head.startsWith('<') && head.includes('<svg')) return 'svg'
  }
  throw fail('invalid-asset')
}

/** @returns {string[]} Every stored logo file name. */
function storedAssets() {
  try {
    return readdirSync(assetDirectory()).filter((name) => ASSET_NAME.test(name))
  } catch {
    return []
  }
}

/**
 * Store one uploaded data URL as the current brand logo, replacing the rest.
 * @param {string} dataUrl Base64 image data URL.
 * @param {string} label Original file name.
 * @returns {{ url: string, label: string }} The stored logo reference.
 */
function storeAsset(dataUrl, label) {
  if (typeof dataUrl !== 'string') throw fail('invalid-asset')
  const match = /^data:(image\/(?:png|jpeg|webp|gif|svg\+xml));base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl)
  if (!match) throw fail('invalid-asset')
  const buffer = Buffer.from(match[2], 'base64')
  if (buffer.length === 0) throw fail('invalid-asset')
  if (buffer.length > MAX_ASSET_BYTES) throw fail('asset-too-large', 413)
  const extension = extensionOf(match[1], buffer)
  const name = 'brand-' + createHash('sha256').update(buffer).digest('hex').slice(0, 16) + '.' + extension
  const directory = assetDirectory()
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  const file = join(directory, name)
  writeFileSync(file, buffer, { mode: 0o600 })
  try {
    chmodSync(file, 0o600)
  } catch {
    // Non-POSIX filesystems keep their default mode.
  }
  for (const existing of storedAssets()) {
    if (existing === name) continue
    try {
      rmSync(join(directory, existing), { force: true })
    } catch {
      // A leftover file is harmless; the preferences point at the new one.
    }
  }
  return { url: ROUTE + '/assets/' + name, label: typeof label === 'string' ? label.slice(0, 80) : '' }
}

/**
 * Remove every uploaded logo.
 * @returns {number} Files removed.
 */
function clearAssets() {
  let removed = 0
  for (const name of storedAssets()) {
    try {
      rmSync(join(assetDirectory(), name), { force: true })
      removed += 1
    } catch {
      // Ignore files that disappeared concurrently.
    }
  }
  return removed
}

/**
 * Send one file with a fixed content type.
 * @param {import('node:http').ServerResponse} response Outgoing response.
 * @param {string} file Absolute path.
 * @param {string} type Media type.
 * @param {string} cache Cache-Control value.
 * @returns {void}
 */
function sendFile(response, file, type, cache) {
  let data
  try {
    data = readFileSync(file)
  } catch {
    const body = JSON.stringify({ ok: false, error: 'not-found' })
    response.writeHead(404, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'content-length': Buffer.byteLength(body),
    })
    response.end(body)
    return
  }
  response.writeHead(200, {
    'content-type': type,
    'content-length': data.length,
    'cache-control': cache,
    'x-content-type-options': 'nosniff',
  })
  response.end(data)
}

/**
 * Answer one request from the browser half.
 * @param {import('node:http').IncomingMessage} request Incoming request.
 * @param {import('node:http').ServerResponse} response Outgoing response.
 * @returns {Promise<void>} Resolves when the response ends.
 */
export async function handleRequest(request, response) {
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
    const url = new URL(request.url ?? ROUTE, 'http://' + (request.headers.host ?? 'localhost'))
    const path = url.pathname.startsWith(ROUTE) ? url.pathname.slice(ROUTE.length) : url.pathname
    const method = request.method ?? 'GET'

    // Font and logo reads come from <img>/@font-face, which cannot send the
    // custom header; they are read-only and strictly name-checked.
    const isStatic = method === 'GET' && (path.startsWith('/fonts/') || path.startsWith('/assets/'))
    if (!isStatic && request.headers[HEADER] !== '1') {
      reply(403, { ok: false, error: 'unauthorized' })
      return
    }

    if (isStatic && path.startsWith('/fonts/')) {
      const name = path.slice('/fonts/'.length)
      if (!FONT_FILES.has(name)) {
        reply(404, { ok: false, error: 'not-found' })
        return
      }
      sendFile(response, join(FONT_DIRECTORY, name), 'font/woff2', 'public, max-age=604800')
      return
    }

    if (isStatic && path.startsWith('/assets/')) {
      const name = path.slice('/assets/'.length)
      if (!ASSET_NAME.test(name)) {
        reply(404, { ok: false, error: 'not-found' })
        return
      }
      sendFile(response, join(assetDirectory(), name), ASSET_TYPES[extname(name).slice(1)], 'public, max-age=31536000, immutable')
      return
    }

    if (path === '/preferences' && method === 'GET') {
      reply(200, { ok: true, data: readPreferences() })
      return
    }

    if (path === '/preferences' && method === 'POST') {
      const body = await readJsonBody(request)
      const current = readPreferences()
      const nestedBrand = body.brand
      // The brand block merges field by field; a non-object reaches sanitize
      // unchanged so the request still fails with its stable error code.
      const brand = nestedBrand !== null && typeof nestedBrand === 'object' && !Array.isArray(nestedBrand)
        ? { ...current.brand, ...nestedBrand }
        : nestedBrand
      reply(200, { ok: true, data: writePreferences({ ...current, ...body, brand: brand === undefined ? current.brand : brand }) })
      return
    }

    if (path === '/brand-asset' && method === 'POST') {
      const body = await readJsonBody(request)
      reply(200, { ok: true, data: storeAsset(body.dataUrl, body.name) })
      return
    }

    if (path === '/brand-asset' && method === 'DELETE') {
      reply(200, { ok: true, data: { removed: clearAssets() } })
      return
    }

    reply(404, { ok: false, error: 'not-found' })
  } catch (error) {
    const status = typeof error?.status === 'number' ? error.status : 500
    reply(status, { ok: false, error: typeof error?.code === 'string' ? error.code : 'request-failed' })
  }
}

/**
 * Install the preferences, logo and typeface routes.
 * @param {import('@deepseek-ai/cordis').Context} ctx Host context.
 * @returns {void}
 */
export function apply(ctx) {
  ctx.effect(() => {
    const disposeRoute = ctx.webServer.register({
      kind: 'prefix',
      path: ROUTE,
      handler: (request, response) => {
        void handleRequest(request, response)
      },
    })
    return () => disposeRoute()
  }, 'retro-ai-os preferences route')
}

export { FONT_FILES, BRAND_FONTS }
