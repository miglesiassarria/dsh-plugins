/**
 * Backups — Host half.
 *
 * Builds and applies portable backup archives for the two things a DeepSeek
 * Harness setup is made of: the session logs (chats) and the profile
 * configuration together with the local plugin packages it links.
 *
 * A backup is a plain ZIP file, so the already-compressed session frames are
 * stored byte for byte instead of being inflated by base64, text files are
 * deflated, and the archive opens in Finder or Explorer. Older `.json`
 * backups written by the first version are still accepted.
 *
 * The browser half (`client.js`) talks to this module over a same-origin HTTP
 * route, so the Settings page needs no generated Remote namespace.
 *
 * @module @local/dsh-backups
 */

import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import {
  constants as zlibConstants,
  deflateRawSync,
  inflateRawSync,
  zstdCompressSync,
  zstdDecompressSync,
} from 'node:zlib'

/** Services this plugin cannot work without. */
export const inject = ['webServer']

/** Route prefix served to the Settings page. */
const ROUTE = '/dsh-backups'

/** Backup identity: `dsh-backup` v2 is a ZIP; v1 is the legacy JSON document. */
const FORMAT = 'dsh-backup'
const VERSION = 2
const LEGACY_VERSION = 1

/** Request ceiling for one uploaded backup file. */
const MAX_BODY_BYTES = 256 * 1024 * 1024

/** Per-file and per-part ceilings, so one huge blob cannot exhaust memory. */
const MAX_SINGLE_FILE_BYTES = 32 * 1024 * 1024
const MAX_PART_BYTES = 512 * 1024 * 1024

/** Directory entries never copied into a backup. */
const SKIP_NAMES = new Set(['node_modules', '.git', '.DS_Store', '.idea', '.vscode'])

/**
 * Profile files that describe the configuration; every top-level YAML joins
 * them. The pnpm lockfile is deliberately absent: it pins absolute `link:`
 * paths and package versions of the machine it was written on, so pnpm
 * regenerates it after a restore instead of receiving a stale copy.
 */
const PROFILE_FILES = [
  'cordis.patch.yml',
  'cordis.yml',
  'package.json',
  'pnpm-workspace.yaml',
]

/** Derived profile files that never travel inside a backup. */
const SKIP_PROFILE_FILES = new Set(['pnpm-lock.yaml'])

/** Plugin-owned data inside the Harness home that belongs to "plugins" too. */
const STORE_FILES = ['mcp-tools/servers.json']

/** Zstandard frame magic, little-endian 0xFD2FB528. */
const ZSTD_MAGIC = 0xfd2fb528

/** Level used when a stored session log is re-encoded for the archive. */
const ZSTD_LEVEL = 19

/** Archive entry names. */
const MANIFEST_ENTRY = 'manifest.json'
const SESSIONS_PREFIX = 'sessions/'
const CONFIG_PREFIX = 'config/'
const PLUGINS_PREFIX = 'plugins/'
const STORES_PREFIX = 'stores/'

/** One failed backup or restore step; `code` is stable for the page to translate. */
export class BackupError extends Error {
  /**
   * @param {string} code Stable machine-readable reason.
   * @param {string} detail Human-readable detail, already final.
   */
  constructor(code, detail) {
    super(detail ?? code)
    this.name = 'BackupError'
    this.code = code
    this.detail = detail ?? code
  }
}

// ---------------------------------------------------------------------------
// ZIP container
// ---------------------------------------------------------------------------

/** CRC-32 lookup table, built once. */
let crcTable = null

/**
 * CRC-32 of one buffer.
 * @param {Buffer} buffer Bytes.
 * @returns {number} Unsigned checksum.
 */
function crc32(buffer) {
  if (crcTable === null) {
    crcTable = new Uint32Array(256)
    for (let index = 0; index < 256; index += 1) {
      let value = index
      for (let bit = 0; bit < 8; bit += 1) {
        value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
      }
      crcTable[index] = value >>> 0
    }
  }
  let crc = 0xffffffff
  for (let index = 0; index < buffer.length; index += 1) {
    crc = crcTable[(crc ^ buffer[index]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

/**
 * MS-DOS date and time fields for one moment.
 * @param {Date} date Timestamp.
 * @returns {{time: number, day: number}} Packed fields.
 */
function dosDateTime(date) {
  const time = ((date.getHours() & 0x1f) << 11)
    | ((date.getMinutes() & 0x3f) << 5)
    | ((Math.floor(date.getSeconds() / 2)) & 0x1f)
  const day = (((date.getFullYear() - 1980) & 0x7f) << 9)
    | (((date.getMonth() + 1) & 0x0f) << 5)
    | (date.getDate() & 0x1f)
  return { time, day }
}

/**
 * Build a ZIP archive; each entry is deflated only when that actually helps.
 * @param {Array<{name: string, data: Buffer}>} entries Files in archive order.
 * @param {Date} [createdAt] Archive timestamp.
 * @returns {Buffer} ZIP bytes.
 */
function createZip(entries, createdAt = new Date()) {
  const chunks = []
  const central = []
  const { time, day } = dosDateTime(createdAt)
  let offset = 0

  for (const entry of entries) {
    const nameBytes = Buffer.from(entry.name, 'utf8')
    const raw = entry.data
    const deflated = deflateRawSync(raw)
    const useDeflate = deflated.length < raw.length
    const payload = useDeflate ? deflated : raw
    const checksum = crc32(raw)

    const header = Buffer.alloc(30)
    header.writeUInt32LE(0x04034b50, 0)
    header.writeUInt16LE(20, 4)
    header.writeUInt16LE(0x0800, 6)
    header.writeUInt16LE(useDeflate ? 8 : 0, 8)
    header.writeUInt16LE(time, 10)
    header.writeUInt16LE(day, 12)
    header.writeUInt32LE(checksum, 14)
    header.writeUInt32LE(payload.length, 18)
    header.writeUInt32LE(raw.length, 22)
    header.writeUInt16LE(nameBytes.length, 26)
    header.writeUInt16LE(0, 28)

    chunks.push(header, nameBytes, payload)
    central.push({
      nameBytes,
      checksum,
      compressed: payload.length,
      uncompressed: raw.length,
      method: useDeflate ? 8 : 0,
      offset,
      time,
      day,
    })
    offset += header.length + nameBytes.length + payload.length
  }

  const centralStart = offset
  for (const item of central) {
    const header = Buffer.alloc(46)
    header.writeUInt32LE(0x02014b50, 0)
    header.writeUInt16LE(20, 4)
    header.writeUInt16LE(20, 6)
    header.writeUInt16LE(0x0800, 8)
    header.writeUInt16LE(item.method, 10)
    header.writeUInt16LE(item.time, 12)
    header.writeUInt16LE(item.day, 14)
    header.writeUInt32LE(item.checksum, 16)
    header.writeUInt32LE(item.compressed, 20)
    header.writeUInt32LE(item.uncompressed, 24)
    header.writeUInt16LE(item.nameBytes.length, 28)
    header.writeUInt16LE(0, 30)
    header.writeUInt16LE(0, 32)
    header.writeUInt16LE(0, 34)
    header.writeUInt16LE(0, 36)
    header.writeUInt32LE((0o100644 << 16) >>> 0, 38)
    header.writeUInt32LE(item.offset, 42)
    chunks.push(header, item.nameBytes)
    offset += header.length + item.nameBytes.length
  }

  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(central.length, 8)
  end.writeUInt16LE(central.length, 10)
  end.writeUInt32LE(offset - centralStart, 12)
  end.writeUInt32LE(centralStart, 16)
  end.writeUInt16LE(0, 20)
  chunks.push(end)

  return Buffer.concat(chunks)
}

/**
 * Read every file of a ZIP archive into memory.
 * @param {Buffer} buffer ZIP bytes.
 * @returns {Map<string, Buffer>} Entry name to contents.
 */
function readZip(buffer) {
  let end = -1
  const floor = Math.max(0, buffer.length - 22 - 0xffff)
  for (let index = buffer.length - 22; index >= floor; index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      end = index
      break
    }
  }
  if (end < 0) throw new BackupError('invalid-backup', 'El ZIP no tiene directorio central; el archivo está dañado.')

  const count = buffer.readUInt16LE(end + 10)
  const centralStart = buffer.readUInt32LE(end + 16)
  if (count === 0 || centralStart >= buffer.length) {
    throw new BackupError('invalid-backup', 'La copia de seguridad está vacía.')
  }

  const files = new Map()
  let pointer = centralStart
  for (let index = 0; index < count; index += 1) {
    if (pointer + 46 > buffer.length || buffer.readUInt32LE(pointer) !== 0x02014b50) {
      throw new BackupError('invalid-backup', 'El directorio central del ZIP está dañado.')
    }
    const method = buffer.readUInt16LE(pointer + 10)
    const compressedSize = buffer.readUInt32LE(pointer + 20)
    const uncompressedSize = buffer.readUInt32LE(pointer + 24)
    const nameLength = buffer.readUInt16LE(pointer + 28)
    const extraLength = buffer.readUInt16LE(pointer + 30)
    const commentLength = buffer.readUInt16LE(pointer + 32)
    const localOffset = buffer.readUInt32LE(pointer + 42)
    const name = buffer.subarray(pointer + 46, pointer + 46 + nameLength).toString('utf8')
    pointer += 46 + nameLength + extraLength + commentLength

    if (localOffset + 30 > buffer.length || buffer.readUInt32LE(localOffset) !== 0x04034b50) {
      throw new BackupError('invalid-backup', `La entrada «${name}» del ZIP está dañada.`)
    }
    const localNameLength = buffer.readUInt16LE(localOffset + 26)
    const localExtraLength = buffer.readUInt16LE(localOffset + 28)
    const start = localOffset + 30 + localNameLength + localExtraLength
    const payload = buffer.subarray(start, start + compressedSize)
    let data
    try {
      data = method === 8 ? inflateRawSync(payload) : Buffer.from(payload)
    } catch {
      throw new BackupError('invalid-backup', `No se pudo descomprimir «${name}».`)
    }
    if (data.length !== uncompressedSize) {
      throw new BackupError('invalid-backup', `La entrada «${name}» no tiene el tamaño esperado.`)
    }
    files.set(name, data)
  }
  return files
}

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

/** @returns The Harness home directory. */
function dshHome() {
  return process.env.DSH_HOME ?? join(homedir(), '.dsh')
}

/**
 * The active profile directory, where configuration lives. The live
 * `profileContext` service is authoritative; the environment is only a
 * fallback for shells and tests.
 * @param {import('@deepseek-ai/cordis').Context} [ctx] Plugin context.
 * @returns {string} Absolute profile directory.
 */
function profileDirectory(ctx) {
  const profile = ctx?.get?.('profileContext')
  if (profile !== undefined && typeof profile.dir === 'string' && profile.dir.length > 0) {
    return profile.dir
  }
  if (process.env.DSH_PROFILE_DIR !== undefined) return process.env.DSH_PROFILE_DIR
  return join(dshHome(), 'profiles', process.env.DSH_PROFILE ?? 'default')
}

/**
 * The command that opens a directory in the platform's file manager.
 * @param {string} platform Node platform id.
 * @param {string} directory Absolute directory.
 * @returns {{command: string, args: string[]}} Command and its arguments.
 */
function folderCommand(platform, directory) {
  if (platform === 'darwin') return { command: 'open', args: [directory] }
  if (platform === 'win32') return { command: 'explorer.exe', args: [directory] }
  return { command: 'xdg-open', args: [directory] }
}

/**
 * Start a detached GUI process and resolve once it actually launched.
 * @param {string} command Executable.
 * @param {string[]} args Arguments.
 * @returns {Promise<void>} Resolves after spawn; rejects when it cannot start.
 */
function launch(command, args) {
  return new Promise((resolveLaunch, rejectLaunch) => {
    let child
    try {
      child = spawn(command, args, { detached: true, stdio: 'ignore' })
    } catch (error) {
      rejectLaunch(error)
      return
    }
    const finish = (error) => {
      clearTimeout(timer)
      child.removeListener('error', onError)
      child.removeListener('spawn', onSpawn)
      if (error !== undefined) {
        rejectLaunch(error)
        return
      }
      child.unref()
      resolveLaunch()
    }
    const timer = setTimeout(() => finish(), 1500)
    const onError = (error) => finish(error)
    const onSpawn = () => finish()
    child.once('error', onError)
    child.once('spawn', onSpawn)
  })
}

/** @returns The folder backups are written to. */
function backupDirectory() {
  const override = process.env.DSH_BACKUPS_DIR
  if (override !== undefined && override.trim() !== '') return resolve(override)
  const documents = join(homedir(), 'Documents')
  return join(existsSync(documents) ? documents : homedir(), 'DeepSeek Harness', 'Backups')
}

/** @returns A filesystem-safe local timestamp: `2026-11-08-201530`. */
function stamp() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
  ].join('-') + '-' + [pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join('')
}

/**
 * Resolve a backup-relative path inside a root directory, refusing escapes.
 * @param {string} root Absolute directory.
 * @param {string} rel Relative path from the backup.
 * @returns {string} Absolute target path.
 */
function safeResolve(root, rel) {
  const target = resolve(root, rel)
  const prefix = root.endsWith(sep) ? root : root + sep
  if (target !== root && !target.startsWith(prefix)) {
    throw new BackupError('unsafe-path', `Ruta fuera del destino permitido: ${rel}`)
  }
  return target
}

/**
 * Read a directory, returning an empty list when it does not exist.
 * @param {string} directory Absolute directory.
 * @returns {Promise<import('node:fs').Dirent[]>} Entries.
 */
async function safeReaddir(directory) {
  try {
    return await readdir(directory, { withFileTypes: true })
  } catch {
    return []
  }
}

/**
 * Read a file as a Buffer, or `null` when it is absent or unreadable.
 * @param {string} path Absolute path.
 * @returns {Promise<Buffer | null>} Contents.
 */
async function readIfExists(path) {
  try {
    return await readFile(path)
  } catch {
    return null
  }
}

/**
 * Copy one directory tree into archive entries.
 * @param {string} root Absolute directory to copy.
 * @returns {Promise<{files: Array<{path: string, data: Buffer}>, bytes: number, skipped: string[]}>} Flat tree.
 */
async function collectTree(root) {
  const files = []
  const skipped = []
  let bytes = 0

  /** @param {string} directory Absolute directory. */
  async function visit(directory) {
    for (const entry of await safeReaddir(directory)) {
      if (SKIP_NAMES.has(entry.name)) continue
      const absolute = join(directory, entry.name)
      if (entry.isSymbolicLink()) continue
      if (entry.isDirectory()) {
        await visit(absolute)
        continue
      }
      if (!entry.isFile()) continue
      const info = await stat(absolute)
      if (info.size > MAX_SINGLE_FILE_BYTES) {
        skipped.push(relative(root, absolute))
        continue
      }
      if (bytes + info.size > MAX_PART_BYTES) {
        skipped.push(relative(root, absolute))
        continue
      }
      const data = await readFile(absolute)
      bytes += data.length
      files.push({ path: relative(root, absolute).split(sep).join('/'), data })
    }
  }

  await visit(root)
  return { files, bytes, skipped }
}

/**
 * The profile name recorded inside a backup.
 * @param {import('@deepseek-ai/cordis').Context} ctx Plugin context.
 * @returns {string | null} Profile name.
 */
function profileName(ctx) {
  const profile = ctx?.get?.('profileContext')
  if (profile !== undefined && typeof profile.dir === 'string' && profile.dir.length > 0) {
    return basename(profile.dir)
  }
  return process.env.DSH_PROFILE ?? null
}

// ---------------------------------------------------------------------------
// Collecting a backup
// ---------------------------------------------------------------------------

/**
 * Project the legacy workspace registry file when the live service is absent.
 * @returns {Array<{path: string, title: string, sessionIds: string[]}>} Stored workspaces.
 */
function readWorkspaceFile() {
  try {
    const text = readFileSync(join(dshHome(), 'storages', 'workspace.json'), 'utf8')
    const parsed = JSON.parse(text)
    const table = parsed?.tables?.workspaces ?? {}
    return Object.values(table)
      .filter((record) => typeof record?.path === 'string')
      .map((record) => ({
        path: record.path,
        title: typeof record.title === 'string' ? record.title : basename(record.path),
        sessionIds: Array.isArray(record.sessionIds) ? record.sessionIds.slice() : [],
      }))
  } catch {
    return []
  }
}

/**
 * Offset of the next Zstandard frame start at or after `from`.
 * @param {Buffer} buffer Bytes.
 * @param {number} from First offset to inspect.
 * @returns {number} Offset, or the buffer length when none is left.
 */
function nextFrame(buffer, from) {
  for (let index = from; index + 4 <= buffer.length; index += 1) {
    if (buffer.readUInt32LE(index) === ZSTD_MAGIC) return index
  }
  return buffer.length
}

/**
 * Decode every Zstandard frame of a stored log.
 *
 * A stored log is a concatenation of independent frames, so the decoder walks
 * frame starts and merges candidate boundaries that do not decode on their own.
 * @param {Buffer} buffer Stored log.
 * @returns {Buffer | null} Logical bytes, or null when the frames cannot be read.
 */
function decodeStoredLog(buffer) {
  if (typeof zstdDecompressSync !== 'function') return null
  if (buffer.length < 4 || buffer.readUInt32LE(0) !== ZSTD_MAGIC) return null
  const output = []
  let start = 0
  while (start < buffer.length) {
    let end = nextFrame(buffer, start + 4)
    let decoded = null
    for (;;) {
      try {
        decoded = zstdDecompressSync(buffer.subarray(start, end))
        break
      } catch {
        if (end >= buffer.length) return null
        end = nextFrame(buffer, end + 4)
      }
    }
    output.push(decoded)
    start = end
  }
  return Buffer.concat(output)
}

/**
 * Re-encode one stored log with a stronger level and one solid body frame.
 *
 * The backend requires the first frame to hold exactly the header line; every
 * following record may share a single frame. The result is verified to decode
 * back to the original logical bytes before it is used.
 * @param {Buffer} raw Original file bytes.
 * @returns {Buffer | null} Smaller equivalent, or null to keep the original.
 */
function recompressStoredLog(raw) {
  if (typeof zstdCompressSync !== 'function') return null
  if (raw.length < 1024) return null
  const logical = decodeStoredLog(raw)
  if (logical === null || logical.length === 0) return null
  const newline = logical.indexOf(0x0a)
  if (newline < 0) return null
  const header = logical.subarray(0, newline + 1)
  const body = logical.subarray(newline + 1)
  let parsed
  try {
    parsed = JSON.parse(header.toString('utf8'))
  } catch {
    return null
  }
  if (parsed?.type !== 'session' || typeof parsed.version !== 'number') return null

  const params = { [zlibConstants.ZSTD_c_compressionLevel]: ZSTD_LEVEL }
  const frames = [zstdCompressSync(header, { params })]
  if (body.length > 0) frames.push(zstdCompressSync(body, { params }))
  const rebuilt = Buffer.concat(frames)
  if (rebuilt.length >= raw.length) return null

  // Never ship a re-encoding that does not reproduce the original log.
  const check = decodeStoredLog(rebuilt)
  if (check === null || !check.equals(logical)) return null
  return rebuilt
}

/**
 * Collect the chats and sessions part of a backup.
 * @param {import('@deepseek-ai/cordis').Context} ctx Plugin context.
 * @returns {Promise<object>} Sessions part.
 */
async function collectSessions(ctx) {
  const root = join(dshHome(), 'sessions')
  const files = []
  let bytes = 0
  let sessionCount = 0

  for (const project of await safeReaddir(root)) {
    if (!project.isDirectory()) continue
    const projectDirectory = join(root, project.name)
    for (const session of await safeReaddir(projectDirectory)) {
      if (!session.isDirectory()) continue
      const sessionDirectory = join(projectDirectory, session.name)
      let counted = false
      for (const entry of await safeReaddir(sessionDirectory)) {
        if (!entry.isFile()) continue
        // The lock is process state, not history.
        if (entry.name === 'session.lock') continue
        const absolute = join(sessionDirectory, entry.name)
        const raw = await readFile(absolute)
        let data = raw
        let recompressed = false
        if (entry.name.endsWith('.zstd')) {
          const smaller = recompressStoredLog(raw)
          if (smaller !== null) {
            data = smaller
            recompressed = true
          }
        }
        bytes += raw.length
        files.push({
          path: `${project.name}/${session.name}/${entry.name}`,
          data,
          recompressed,
        })
        counted = true
      }
      if (counted) sessionCount += 1
    }
  }

  const registry = ctx.get('workspaceRegistry')
  const workspaces = registry === undefined
    ? readWorkspaceFile()
    : registry.list().map((workspace) => ({
      path: workspace.path,
      title: workspace.title,
      sessionIds: [...workspace.sessionIds],
    }))
  const archivedSessionIds = registry === undefined ? [] : [...registry.archivedSessionIds]

  return { workspaces, archivedSessionIds, sessionCount, bytes, files }
}

/**
 * Collect the configuration and plugins part of a backup.
 * @param {import('@deepseek-ai/cordis').Context} ctx Plugin context.
 * @returns {Promise<object>} Configuration part.
 */
async function collectConfiguration(ctx) {
  const profile = profileDirectory(ctx)
  const profileFiles = []
  let bytes = 0

  const names = new Set(PROFILE_FILES)
  for (const entry of await safeReaddir(profile)) {
    if (!entry.isFile()) continue
    if (SKIP_PROFILE_FILES.has(entry.name)) continue
    if (entry.name.endsWith('.yml') || entry.name.endsWith('.yaml')) names.add(entry.name)
  }
  for (const name of names) {
    const data = await readIfExists(join(profile, name))
    if (data === null) continue
    bytes += data.length
    profileFiles.push({ name, data })
  }

  const manifest = await readProfileManifest(profile)
  const plugins = []
  for (const name of await localPluginNames(profile, manifest)) {
    const source = await resolveInstalledPlugin(profile, name)
    if (source === null) continue
    const tree = await collectTree(source)
    bytes += tree.bytes
    plugins.push({ name, directory: safePluginDirectory(name), files: tree.files, skipped: tree.skipped })
  }

  const stores = []
  for (const rel of STORE_FILES) {
    const data = await readIfExists(join(dshHome(), rel))
    if (data === null) continue
    bytes += data.length
    stores.push({ path: rel, data })
  }

  return { profile: { files: profileFiles }, plugins, stores, bytes }
}

/**
 * Parse the profile manifest, tolerating a missing or malformed document.
 * @param {string} profile Profile directory.
 * @returns {Promise<object | null>} Parsed manifest.
 */
async function readProfileManifest(profile) {
  const data = await readIfExists(join(profile, 'package.json'))
  if (data === null) return null
  try {
    return JSON.parse(data.toString('utf8'))
  } catch {
    return null
  }
}

/**
 * Names of the locally linked plugin packages a profile depends on.
 * @param {string} profile Profile directory.
 * @param {object | null} manifest Parsed profile manifest.
 * @returns {Promise<string[]>} Package names.
 */
async function localPluginNames(profile, manifest) {
  const names = new Set()
  for (const [name, spec] of Object.entries(manifest?.dependencies ?? {})) {
    if (typeof spec === 'string' && spec.startsWith('link:')) names.add(name)
  }
  for (const entry of await safeReaddir(join(profile, 'node_modules', '@local'))) {
    if (entry.isSymbolicLink() || entry.isDirectory()) names.add(`@local/${entry.name}`)
  }
  return [...names].sort()
}

/**
 * Resolve one linked plugin package to the directory it actually points at.
 * @param {string} profile Profile directory.
 * @param {string} name Package name.
 * @returns {Promise<string | null>} Real directory, or null when unknown.
 */
async function resolveInstalledPlugin(profile, name) {
  const candidate = join(profile, 'node_modules', name)
  try {
    return await realpath(candidate)
  } catch {
    return null
  }
}

/**
 * Turn a package name into one safe directory segment.
 * @param {string} name Package name such as `@local/tools-mcp-servers`.
 * @returns {string} Filesystem-safe name.
 */
function safePluginDirectory(name) {
  return name.replace(/^@/, '').replace(/[^a-zA-Z0-9._-]+/g, '_')
}

/**
 * Build one backup: its manifest and the archive entries it describes.
 * @param {import('@deepseek-ai/cordis').Context} ctx Plugin context.
 * @param {{sessions: boolean, configuration: boolean}} options Selected parts.
 * @returns {Promise<{manifest: object, entries: Array<{name: string, data: Buffer}>}>} Backup.
 */
async function buildBackup(ctx, options) {
  if (!options.sessions && !options.configuration) {
    throw new BackupError('empty-selection', 'Selecciona al menos una parte para la copia de seguridad.')
  }
  const createdAt = new Date().toISOString()
  /** @type {Record<string, unknown>} */
  const parts = {}
  /** @type {Array<{name: string, data: Buffer}>} */
  const entries = []

  if (options.sessions) {
    const collected = await collectSessions(ctx)
    parts.sessions = {
      sessionCount: collected.sessionCount,
      workspaces: collected.workspaces,
      archivedSessionIds: collected.archivedSessionIds,
      bytes: collected.bytes,
      files: collected.files.map((file) => {
        const entry = SESSIONS_PREFIX + file.path
        entries.push({ name: entry, data: file.data })
        return { path: file.path, size: file.data.length, recompressed: file.recompressed === true }
      }),
    }
  }

  if (options.configuration) {
    const collected = await collectConfiguration(ctx)
    parts.configuration = {
      bytes: collected.bytes,
      profile: {
        files: collected.profile.files.map((file) => {
          const entry = CONFIG_PREFIX + file.name
          entries.push({ name: entry, data: file.data })
          return { name: file.name, size: file.data.length }
        }),
      },
      plugins: collected.plugins.map((plugin) => ({
        name: plugin.name,
        directory: plugin.directory,
        skipped: plugin.skipped,
        files: plugin.files.map((file) => {
          const entry = `${PLUGINS_PREFIX}${plugin.directory}/${file.path}`
          entries.push({ name: entry, data: file.data })
          return { path: file.path, size: file.data.length }
        }),
      })),
      stores: collected.stores.map((store) => {
        const entry = STORES_PREFIX + store.path
        entries.push({ name: entry, data: store.data })
        return { path: store.path, size: store.data.length }
      }),
    }
  }

  const manifest = {
    kind: FORMAT,
    version: VERSION,
    createdAt,
    app: { profile: profileName(ctx), platform: process.platform },
    parts,
  }
  entries.unshift({
    name: MANIFEST_ENTRY,
    data: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8'),
  })
  return { manifest, entries }
}

/**
 * Create a backup and write it to the backups folder.
 * @param {import('@deepseek-ai/cordis').Context} ctx Plugin context.
 * @param {{sessions: boolean, configuration: boolean}} options Selected parts.
 * @returns {Promise<object>} Result for the page.
 */
async function createBackup(ctx, options) {
  const { manifest, entries } = await buildBackup(ctx, options)
  const directory = backupDirectory()
  await mkdir(directory, { recursive: true })
  const name = `dsh-backup-${stamp()}.zip`
  const path = join(directory, name)
  const archive = createZip(entries, new Date(manifest.createdAt))
  await writeFile(path, archive, { mode: 0o600 })
  return {
    name,
    path,
    bytes: archive.length,
    createdAt: manifest.createdAt,
    parts: summarizeManifest(manifest),
  }
}

/**
 * Describe a manifest without its payloads.
 * @param {object} manifest Backup manifest.
 * @returns {object} Summary shown before restoring.
 */
function summarizeManifest(manifest) {
  const parts = manifest?.parts ?? {}
  const summary = {}
  if (parts.sessions !== undefined) {
    summary.sessions = {
      sessionCount: parts.sessions.sessionCount ?? 0,
      workspaces: (parts.sessions.workspaces ?? []).map((workspace) => ({
        title: workspace.title ?? basename(String(workspace.path ?? '')),
        path: workspace.path ?? '',
        count: Array.isArray(workspace.sessionIds) ? workspace.sessionIds.length : 0,
      })),
      bytes: parts.sessions.bytes ?? 0,
    }
  }
  if (parts.configuration !== undefined) {
    summary.configuration = {
      plugins: (parts.configuration.plugins ?? []).map((plugin) => plugin.name),
      files: (parts.configuration.profile?.files ?? []).length,
      stores: (parts.configuration.stores ?? []).map((store) => store.path),
      bytes: parts.configuration.bytes ?? 0,
    }
  }
  return summary
}

// ---------------------------------------------------------------------------
// Reading a backup (ZIP v2 and legacy JSON v1)
// ---------------------------------------------------------------------------

/**
 * Load either archive generation into one normalized backup.
 * @param {Buffer} buffer File bytes.
 * @returns {{createdAt: string | null, app: object | null, sessions?: object, configuration?: object, version: number}} Backup.
 */
function loadBackup(buffer) {
  if (buffer.length >= 4 && buffer.readUInt32LE(0) === 0x04034b50) return loadZipBackup(buffer)
  return loadLegacyBackup(buffer)
}

/**
 * Load the ZIP generation.
 * @param {Buffer} buffer File bytes.
 * @returns {object} Normalized backup.
 */
function loadZipBackup(buffer) {
  const files = readZip(buffer)
  const raw = files.get(MANIFEST_ENTRY)
  if (raw === undefined) throw new BackupError('invalid-backup', 'El archivo no es una copia de seguridad de DeepSeek Harness.')

  let manifest
  try {
    manifest = JSON.parse(raw.toString('utf8'))
  } catch {
    throw new BackupError('invalid-backup', 'El manifiesto de la copia está dañado.')
  }
  if (manifest === null || typeof manifest !== 'object' || manifest.kind !== FORMAT) {
    throw new BackupError('invalid-backup', 'El archivo no es una copia de seguridad de DeepSeek Harness.')
  }
  if (manifest.version !== VERSION && manifest.version !== LEGACY_VERSION) {
    throw new BackupError('unsupported-version', `Versión de copia no soportada: ${String(manifest.version)}.`)
  }

  const backup = {
    version: VERSION,
    createdAt: typeof manifest.createdAt === 'string' ? manifest.createdAt : null,
    app: manifest.app ?? null,
  }

  const sessions = manifest.parts?.sessions
  if (sessions !== undefined) {
    backup.sessions = {
      sessionCount: sessions.sessionCount ?? 0,
      workspaces: Array.isArray(sessions.workspaces) ? sessions.workspaces : [],
      archivedSessionIds: Array.isArray(sessions.archivedSessionIds) ? sessions.archivedSessionIds : [],
      files: (sessions.files ?? []).map((file) => ({
        path: String(file.path),
        data: requireEntry(files, SESSIONS_PREFIX + file.path),
      })),
    }
  }

  const configuration = manifest.parts?.configuration
  if (configuration !== undefined) {
    backup.configuration = {
      profile: (configuration.profile?.files ?? []).map((file) => ({
        name: String(file.name),
        data: requireEntry(files, CONFIG_PREFIX + file.name),
      })),
      plugins: (configuration.plugins ?? []).map((plugin) => ({
        name: String(plugin.name),
        files: (plugin.files ?? []).map((file) => ({
          path: String(file.path),
          data: requireEntry(files, `${PLUGINS_PREFIX}${plugin.directory}/${file.path}`),
        })),
      })),
      stores: (configuration.stores ?? []).map((store) => ({
        path: String(store.path),
        data: requireEntry(files, STORES_PREFIX + store.path),
      })),
    }
  }

  return backup
}

/**
 * Read one archive entry the manifest promised.
 * @param {Map<string, Buffer>} files Archive entries.
 * @param {string} name Entry name.
 * @returns {Buffer} Contents.
 */
function requireEntry(files, name) {
  const data = files.get(name)
  if (data === undefined) throw new BackupError('invalid-backup', `Falta «${name}» dentro de la copia.`)
  return data
}

/**
 * Load the first JSON generation, which stored every file as base64.
 * @param {Buffer} buffer File bytes.
 * @returns {object} Normalized backup.
 */
function loadLegacyBackup(buffer) {
  let document
  try {
    document = JSON.parse(buffer.toString('utf8'))
  } catch {
    throw new BackupError('invalid-backup', 'El archivo no es una copia de seguridad válida.')
  }
  if (document === null || typeof document !== 'object' || document.kind !== FORMAT) {
    throw new BackupError('invalid-backup', 'El archivo no es una copia de seguridad de DeepSeek Harness.')
  }
  if (document.version !== LEGACY_VERSION) {
    throw new BackupError('unsupported-version', `Versión de copia no soportada: ${String(document.version)}.`)
  }
  if (document.parts === null || typeof document.parts !== 'object') {
    throw new BackupError('invalid-backup', 'La copia de seguridad está vacía.')
  }

  const backup = {
    version: LEGACY_VERSION,
    createdAt: typeof document.createdAt === 'string' ? document.createdAt : null,
    app: document.app ?? null,
  }
  const sessions = document.parts.sessions
  if (sessions !== undefined) {
    backup.sessions = {
      sessionCount: sessions.sessionCount ?? 0,
      workspaces: Array.isArray(sessions.workspaces) ? sessions.workspaces : [],
      archivedSessionIds: Array.isArray(sessions.archivedSessionIds) ? sessions.archivedSessionIds : [],
      files: (sessions.files ?? []).map((file) => ({
        path: String(file.path),
        data: Buffer.from(String(file.data ?? ''), 'base64'),
      })),
    }
  }
  const configuration = document.parts.configuration
  if (configuration !== undefined) {
    backup.configuration = {
      profile: (configuration.profile?.files ?? []).map((file) => ({
        name: String(file.name),
        data: Buffer.from(String(file.data ?? ''), 'base64'),
      })),
      plugins: (configuration.plugins ?? []).map((plugin) => ({
        name: String(plugin.name),
        files: (plugin.files ?? []).map((file) => ({
          path: String(file.path),
          data: Buffer.from(String(file.data ?? ''), 'base64'),
        })),
      })),
      stores: (configuration.stores ?? []).map((store) => ({
        path: String(store.path),
        data: Buffer.from(String(store.data ?? ''), 'base64'),
      })),
    }
  }
  return backup
}

/**
 * Validate and summarize an uploaded backup.
 * @param {Buffer} buffer File bytes.
 * @returns {object} Page-facing summary.
 */
function inspectBackup(buffer) {
  const backup = loadBackup(buffer)
  return {
    createdAt: backup.createdAt,
    app: backup.app,
    parts: summarizeManifest({
      parts: {
        ...(backup.sessions === undefined ? {} : { sessions: backup.sessions }),
        ...(backup.configuration === undefined
          ? {}
          : {
            configuration: {
              bytes: backup.configuration.profile.reduce((total, file) => total + file.data.length, 0),
              profile: { files: backup.configuration.profile },
              plugins: backup.configuration.plugins,
              stores: backup.configuration.stores,
            },
          }),
      },
    }),
  }
}

// ---------------------------------------------------------------------------
// Restoring a backup
// ---------------------------------------------------------------------------

/**
 * Restore the sessions part of a backup.
 * @param {import('@deepseek-ai/cordis').Context} ctx Plugin context.
 * @param {object} part Sessions part.
 * @returns {Promise<object>} Restore counters.
 */
async function restoreSessions(ctx, part) {
  const root = join(dshHome(), 'sessions')
  const restoredDirectories = new Set()
  const restoredIds = new Set()
  let written = 0
  let unchanged = 0
  let conflicts = 0

  for (const file of part.files ?? []) {
    const target = safeResolve(root, file.path)
    const existing = await stat(target).catch(() => null)
    if (existing !== null) {
      if (existing.size === file.data.length) unchanged += 1
      else conflicts += 1
      continue
    }
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, file.data)
    written += 1
    restoredDirectories.add(dirname(target))
  }

  let grouped = 0
  let ungrouped = 0
  let archived = 0
  const persistence = ctx.get('sessionPersistence')
  const registry = ctx.get('workspaceRegistry')
  if (persistence !== undefined && registry !== undefined && restoredDirectories.size > 0) {
    /** @type {Map<string, {id: string, cwd?: string}>} */
    const byDirectory = new Map()
    try {
      for (const snapshot of await persistence.list()) {
        const path = snapshot?.location?.path
        if (typeof path !== 'string') continue
        byDirectory.set(dirname(path), snapshot.header)
      }
    } catch (error) {
      ctx.logger?.warn?.(`dsh-backups: no se pudieron leer las sesiones guardadas: ${String(error)}`)
    }
    for (const directory of restoredDirectories) {
      const header = byDirectory.get(directory)
      if (header === undefined) {
        ungrouped += 1
        continue
      }
      restoredIds.add(header.id)
      const cwd = header.cwd
      if (typeof cwd !== 'string' || !existsSync(cwd)) {
        ungrouped += 1
        continue
      }
      try {
        let workspace = await registry.resolveByPath(cwd)
        if (workspace === undefined) workspace = await registry.create(cwd)
        await workspace.attachSession(header.id)
        grouped += 1
      } catch (error) {
        ungrouped += 1
        ctx.logger?.warn?.(`dsh-backups: no se pudo agrupar la sesión '${header.id}': ${String(error)}`)
      }
    }
    for (const id of part.archivedSessionIds ?? []) {
      if (!restoredIds.has(id)) continue
      try {
        await registry.archiveSession(id)
        archived += 1
      } catch {
        // An archived id that no longer resolves is not worth failing the restore.
      }
    }
  } else if (restoredDirectories.size > 0) {
    ungrouped = restoredDirectories.size
  }

  return { written, unchanged, conflicts, grouped, ungrouped, archived }
}

/**
 * Restore the configuration and plugins part of a backup.
 * @param {import('@deepseek-ai/cordis').Context} ctx Plugin context.
 * @param {object} part Configuration part.
 * @param {string[]} warnings Collected non-fatal problems.
 * @returns {Promise<object>} Restore counters.
 */
async function restoreConfiguration(ctx, part, warnings) {
  const profile = profileDirectory(ctx)
  const backupStamp = stamp()
  let files = 0
  for (const file of part.profile ?? []) {
    const name = basename(file.name)
    if (name.length === 0) continue
    const target = join(profile, name)
    const existing = await readIfExists(target)
    if (existing !== null && !existing.equals(file.data)) {
      await rename(target, `${target}.bak-${backupStamp}`)
    }
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, file.data, { mode: 0o600 })
    files += 1
  }

  const base = join(dshHome(), 'local-plugins')
  const locations = new Map()
  for (const plugin of part.plugins ?? []) {
    const name = String(plugin?.name ?? '')
    if (name.length === 0) continue
    const destination = join(base, safePluginDirectory(name))
    await rm(destination, { recursive: true, force: true })
    await mkdir(destination, { recursive: true })
    for (const file of plugin.files ?? []) {
      const target = safeResolve(destination, String(file.path))
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, file.data)
    }
    locations.set(name, destination)
  }

  if (locations.size > 0) {
    const manifestPath = join(profile, 'package.json')
    const raw = await readIfExists(manifestPath)
    if (raw === null) {
      warnings.push('La copia no incluye package.json del perfil; los plugins no quedaron enlazados.')
    } else {
      try {
        const manifest = JSON.parse(raw.toString('utf8'))
        let changed = false
        for (const [name, destination] of locations) {
          if (typeof manifest.dependencies?.[name] === 'string') {
            manifest.dependencies[name] = `link:${destination}`
            changed = true
          }
        }
        if (changed) await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 })
      } catch {
        warnings.push('No se pudo reescribir package.json del perfil para apuntar a los plugins restaurados.')
      }
    }

    for (const [name, destination] of locations) {
      const linkPath = join(profile, 'node_modules', name)
      await mkdir(dirname(linkPath), { recursive: true })
      const current = await lstat(linkPath).catch(() => null)
      if (current !== null) {
        if (!current.isSymbolicLink()) {
          warnings.push(`«${name}» ya existe como carpeta en node_modules y no se enlazó.`)
          continue
        }
        await rm(linkPath, { force: true })
      }
      try {
        await symlink(destination, linkPath, 'dir')
      } catch (error) {
        warnings.push(`No se pudo enlazar «${name}»: ${String(error)}`)
      }
    }
  }

  let stores = 0
  for (const store of part.stores ?? []) {
    const rel = String(store?.path ?? '')
    if (rel.length === 0) continue
    const target = safeResolve(dshHome(), rel)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, store.data, { mode: 0o600 })
    stores += 1
  }

  return { files, plugins: locations.size, stores, requiresRestart: locations.size > 0 || files > 0 }
}

/**
 * Apply a loaded backup.
 * @param {import('@deepseek-ai/cordis').Context} ctx Plugin context.
 * @param {object} backup Normalized backup.
 * @param {{sessions: boolean, configuration: boolean}} options Selected parts.
 * @returns {Promise<object>} Restore summary.
 */
async function applyBackup(ctx, backup, options) {
  if (options.sessions && backup.sessions === undefined) {
    throw new BackupError('missing-part', 'Esta copia no incluye chats ni sesiones.')
  }
  if (options.configuration && backup.configuration === undefined) {
    throw new BackupError('missing-part', 'Esta copia no incluye configuración ni plugins.')
  }
  if (!options.sessions && !options.configuration) {
    throw new BackupError('empty-selection', 'Selecciona al menos una parte para restaurar.')
  }
  const warnings = []
  const summary = {}
  if (options.sessions) summary.sessions = await restoreSessions(ctx, backup.sessions)
  if (options.configuration) summary.configuration = await restoreConfiguration(ctx, backup.configuration, warnings)
  return { summary, warnings }
}

// ---------------------------------------------------------------------------
// Status, listing and the HTTP route
// ---------------------------------------------------------------------------

/**
 * List backups already saved on this computer.
 * @returns {Promise<Array<{name: string, path: string, bytes: number, createdAt: string}>>} Files, newest first.
 */
async function listBackups() {
  const directory = backupDirectory()
  const entries = []
  for (const entry of await safeReaddir(directory)) {
    if (!entry.isFile()) continue
    if (!entry.name.startsWith('dsh-backup-')) continue
    if (!entry.name.endsWith('.zip') && !entry.name.endsWith('.json')) continue
    const path = join(directory, entry.name)
    const info = await stat(path).catch(() => null)
    if (info === null) continue
    entries.push({ name: entry.name, path, bytes: info.size, createdAt: info.mtime.toISOString() })
  }
  entries.sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  return entries
}

/**
 * Open the backups folder in the platform file manager.
 * @returns {Promise<{path: string, command: string}>} What was opened.
 */
async function openFolder() {
  const directory = backupDirectory()
  await mkdir(directory, { recursive: true })
  const { command, args } = folderCommand(process.platform, directory)
  try {
    await launch(command, args)
  } catch (error) {
    throw new BackupError('open-failed', `No se pudo abrir la carpeta: ${String(error?.message ?? error)}`)
  }
  return { path: directory, command }
}

/**
 * Everything the page shows before the user acts.
 * @param {import('@deepseek-ai/cordis').Context} ctx Plugin context.
 * @returns {Promise<object>} Status payload.
 */
async function status(ctx) {
  const sessionsRoot = join(dshHome(), 'sessions')
  let sessionCount = 0
  let sessionBytes = 0
  for (const project of await safeReaddir(sessionsRoot)) {
    if (!project.isDirectory()) continue
    for (const session of await safeReaddir(join(sessionsRoot, project.name))) {
      if (!session.isDirectory()) continue
      let counted = false
      for (const entry of await safeReaddir(join(sessionsRoot, project.name, session.name))) {
        if (!entry.isFile() || entry.name === 'session.lock') continue
        const info = await stat(join(sessionsRoot, project.name, session.name, entry.name)).catch(() => null)
        if (info !== null) sessionBytes += info.size
        counted = true
      }
      if (counted) sessionCount += 1
    }
  }

  const profile = profileDirectory(ctx)
  let profileFiles = 0
  let configurationBytes = 0
  for (const entry of await safeReaddir(profile)) {
    if (!entry.isFile()) continue
    if (SKIP_PROFILE_FILES.has(entry.name)) continue
    if (!PROFILE_FILES.includes(entry.name) && !entry.name.endsWith('.yml') && !entry.name.endsWith('.yaml')) continue
    const info = await stat(join(profile, entry.name)).catch(() => null)
    if (info === null) continue
    profileFiles += 1
    configurationBytes += info.size
  }
  const manifest = await readProfileManifest(profile)
  const plugins = await localPluginNames(profile, manifest)
  const registry = ctx.get('workspaceRegistry')

  return {
    destination: backupDirectory(),
    sessions: {
      count: sessionCount,
      bytes: sessionBytes,
      workspaces: registry === undefined ? 0 : registry.list().length,
    },
    configuration: {
      files: profileFiles,
      plugins,
      bytes: configurationBytes,
    },
    backups: await listBackups(),
  }
}

/**
 * Read the whole request body.
 * @param {import('node:http').IncomingMessage} request Incoming request.
 * @returns {Promise<Buffer>} Body bytes.
 */
async function readBody(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) {
      throw new BackupError('too-large', 'El archivo es demasiado grande para restaurarlo desde la página.')
    }
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

/**
 * Read a JSON request body.
 * @param {import('node:http').IncomingMessage} request Incoming request.
 * @returns {Promise<any>} Parsed body.
 */
async function readJsonBody(request) {
  const buffer = await readBody(request)
  if (buffer.length === 0) return {}
  try {
    return JSON.parse(buffer.toString('utf8'))
  } catch {
    throw new BackupError('invalid-json', 'El cuerpo de la petición no es JSON válido.')
  }
}

/**
 * Whether a name is one plain backup file inside the backups folder.
 * @param {string} name Candidate file name.
 * @returns {boolean} True when it cannot escape the folder.
 */
function safeBackupName(name) {
  return /^[A-Za-z0-9._-]+\.(json|zip)$/.test(name) && !name.includes('..')
}

/**
 * Answer one request from the Settings page.
 * @param {import('@deepseek-ai/cordis').Context} ctx Plugin context.
 * @param {import('node:http').IncomingMessage} request Incoming request.
 * @param {import('node:http').ServerResponse} response Outgoing response.
 * @param {{isBusy: () => boolean, setBusy: (value: boolean) => void}} guard Re-entrancy guard.
 * @returns {Promise<void>} Resolves when the response ended.
 */
async function handleRequest(ctx, request, response, guard) {
  const reply = (statusCode, payload) => {
    const body = JSON.stringify(payload)
    response.writeHead(statusCode, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'content-length': Buffer.byteLength(body),
    })
    response.end(body)
  }
  const ok = (data) => reply(200, { ok: true, data })
  const fail = (error) => {
    const code = error instanceof BackupError ? error.code : 'internal-error'
    const detail = error instanceof BackupError ? error.detail : String(error?.message ?? error)
    ctx.logger?.warn?.(`dsh-backups: ${code}: ${detail}`)
    reply(400, { ok: false, code, error: detail })
  }

  try {
    // Same-origin only: a custom header forces a CORS preflight for any
    // cross-origin caller, and this route never answers one.
    if (request.headers['x-dsh-backups'] !== '1') {
      reply(403, { ok: false, code: 'forbidden', error: 'Petición no autorizada' })
      return
    }
    const method = request.method ?? 'GET'
    const url = new URL(request.url ?? ROUTE, `http://${request.headers.host ?? 'localhost'}`)
    const segments = url.pathname.split('/').filter((segment) => segment.length > 0)
    const action = segments[1]

    if (action === undefined && method === 'GET') {
      ok(await status(ctx))
      return
    }

    if (guard.isBusy()) {
      throw new BackupError('busy', 'Ya hay una copia de seguridad en curso.')
    }

    if (action === 'open' && method === 'POST') {
      ok(await openFolder())
      return
    }

    if (action === 'create' && method === 'POST') {
      const body = await readJsonBody(request)
      guard.setBusy(true)
      try {
        ok(await createBackup(ctx, {
          sessions: body?.sessions === true,
          configuration: body?.configuration === true,
        }))
      } finally {
        guard.setBusy(false)
      }
      return
    }

    if (action === 'inspect' && method === 'POST') {
      const buffer = await readBody(request)
      if (buffer.length === 0) throw new BackupError('invalid-backup', 'No se recibió el archivo.')
      ok(inspectBackup(buffer))
      return
    }

    if (action === 'inspect-file' && method === 'POST') {
      const body = await readJsonBody(request)
      const name = String(body?.name ?? '')
      if (!safeBackupName(name)) throw new BackupError('invalid-backup', 'Nombre de archivo no válido.')
      const data = await readIfExists(join(backupDirectory(), name))
      if (data === null) throw new BackupError('missing-file', 'La copia ya no existe en esta carpeta.')
      ok({ name, ...inspectBackup(data) })
      return
    }

    if (action === 'restore' && method === 'POST') {
      const buffer = await readBody(request)
      if (buffer.length === 0) throw new BackupError('invalid-backup', 'No se recibió el archivo.')
      const backup = loadBackup(buffer)
      guard.setBusy(true)
      try {
        ok(await applyBackup(ctx, backup, {
          sessions: url.searchParams.get('sessions') === '1',
          configuration: url.searchParams.get('configuration') === '1',
        }))
      } finally {
        guard.setBusy(false)
      }
      return
    }

    if (action === 'restore-file' && method === 'POST') {
      const body = await readJsonBody(request)
      const name = String(body?.name ?? '')
      if (!safeBackupName(name)) throw new BackupError('invalid-backup', 'Nombre de archivo no válido.')
      const data = await readIfExists(join(backupDirectory(), name))
      if (data === null) throw new BackupError('missing-file', 'La copia ya no existe en esta carpeta.')
      const backup = loadBackup(data)
      guard.setBusy(true)
      try {
        ok(await applyBackup(ctx, backup, {
          sessions: body?.sessions === true,
          configuration: body?.configuration === true,
        }))
      } finally {
        guard.setBusy(false)
      }
      return
    }

    reply(404, { ok: false, code: 'unknown-route', error: 'Ruta desconocida' })
  } catch (error) {
    try {
      fail(error)
    } catch {
      // The connection may already be gone.
    }
  }
}

/**
 * Mount the backups route.
 * @param {import('@deepseek-ai/cordis').Context} ctx Plugin context.
 */
export function apply(ctx) {
  const guard = {
    busy: false,
    isBusy() {
      return this.busy
    },
    setBusy(value) {
      this.busy = value
    },
  }

  ctx.effect(() => {
    const disposeRoute = ctx.webServer.register({
      kind: 'prefix',
      path: ROUTE,
      handler: (request, response) => {
        void handleRequest(ctx, request, response, guard)
      },
    })
    return () => {
      disposeRoute()
    }
  }, 'dsh-backups route')
}

/** Test seam: the operations above, without the HTTP layer. */
export const __test = {
  apply,
  buildBackup,
  createBackup,
  inspectBackup,
  loadBackup,
  applyBackup,
  status,
  listBackups,
  openFolder,
  folderCommand,
  handleRequest,
  createZip,
  readZip,
  decodeStoredLog,
  recompressStoredLog,
  backupDirectory,
  profileDirectory,
  dshHome,
}
