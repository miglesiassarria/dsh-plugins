/**
 * Host check for the Backups plugin.
 *
 * Builds a throwaway Harness home and profile, drives the real HTTP route
 * handlers, and asserts the ZIP archive and the restored files. Nothing
 * outside the temporary directory is touched.
 *
 * Usage: node test/host-check.mjs
 */
import { mkdtemp, mkdir, readFile, rm, writeFile, readdir, lstat, symlink, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const here = fileURLToPath(new URL('.', import.meta.url))
const root = await mkdtemp(join(tmpdir(), 'dsh-backups-test-'))
const home = join(root, 'home')
const profile = join(root, 'profile')
const backups = join(root, 'backups')
const pluginSource = join(root, 'source', 'demo-plugin')

process.env.DSH_HOME = home
process.env.DSH_PROFILE_DIR = profile
process.env.DSH_BACKUPS_DIR = backups

const { __test } = await import('../index.js')

let failures = 0
/** Assert one condition. */
function check(condition, message) {
  if (!condition) {
    failures += 1
    console.error('FAIL:', message)
  }
}

/** Build a fake streaming request. */
function makeRequest(method, url, body) {
  let payload = []
  if (body !== undefined) payload = [Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body))]
  return {
    method,
    url,
    headers: { host: '127.0.0.1:1', 'x-dsh-backups': '1' },
    async *[Symbol.asyncIterator]() {
      for (const chunk of payload) yield chunk
    },
  }
}

/** Build a fake response. */
function makeResponse() {
  return {
    statusCode: 0,
    body: '',
    writeHead(code) {
      this.statusCode = code
    },
    end(body) {
      this.body = body
    },
  }
}

/** Drive one route call and return the parsed envelope. */
async function call(method, path, body) {
  const response = makeResponse()
  await __test.handleRequest(fakeContext, makeRequest(method, path, body), response, {
    isBusy: () => false,
    setBusy: () => {},
  })
  return { status: response.statusCode, payload: JSON.parse(response.body) }
}

const fakeContext = {
  get: () => undefined,
  logger: { warn: () => {} },
  effect: (callback) => callback(),
  webServer: { register: () => () => {} },
}

// ---- Fixture -------------------------------------------------------------
await mkdir(join(home, 'sessions', '--demo-project--', 'session-1111'), { recursive: true })
// A stored log is one independent frame per batch; simulate that layout with
// one frame per line so the re-encoder has real work to do.
const sessionLines = [
  JSON.stringify({ type: 'session', version: 4, id: 'session-1111', createdAt: 0, cwd: '/tmp/demo-project' }),
  ...Array.from({ length: 150 }, (_, index) => JSON.stringify({
    type: 'user/message',
    seq: index,
    text: 'texto repetitivo de relleno '.repeat(12),
  })),
]
const sessionLogical = sessionLines.map((line) => `${line}\n`).join('')
const sessionRaw = Buffer.concat(sessionLines.map((line) => zlib.zstdCompressSync(Buffer.from(`${line}\n`))))
await writeFile(join(home, 'sessions', '--demo-project--', 'session-1111', 'session.v4.jsonl.zstd'), sessionRaw)
await writeFile(join(home, 'sessions', '--demo-project--', 'session-1111', 'session.lock'), '')
await mkdir(join(home, 'storages'), { recursive: true })
await writeFile(join(home, 'storages', 'workspace.json'), JSON.stringify({
  tables: {
    workspaces: {
      demo: {
        path: '/tmp/demo-project',
        title: 'demo-project',
        sessionIds: ['session-1111'],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    },
  },
}))
await mkdir(join(home, 'mcp-tools'), { recursive: true })
await writeFile(join(home, 'mcp-tools', 'servers.json'), '{"servers":[]}')

const bulky = 'a'.repeat(200000)
await mkdir(pluginSource, { recursive: true })
await writeFile(join(pluginSource, 'package.json'), JSON.stringify({ name: '@local/demo-plugin', type: 'module' }))
await writeFile(join(pluginSource, 'index.js'), 'export function apply() {}\n')
await writeFile(join(pluginSource, 'icon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>')
await writeFile(join(pluginSource, 'bulky.txt'), bulky)
await mkdir(join(pluginSource, 'locale'), { recursive: true })
await writeFile(join(pluginSource, 'locale', 'es.json'), '{"meta":{"title":"Demo"}}')
await mkdir(join(pluginSource, 'node_modules', 'junk'), { recursive: true })
await writeFile(join(pluginSource, 'node_modules', 'junk', 'index.js'), 'skip me')

await mkdir(join(profile, 'node_modules', '@local'), { recursive: true })
await symlink(pluginSource, join(profile, 'node_modules', '@local', 'demo-plugin'), 'dir')
await writeFile(join(profile, 'package.json'), JSON.stringify({
  name: 'dsh-profile-test',
  private: true,
  dependencies: { '@local/demo-plugin': `link:${pluginSource}` },
  dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', '@local/demo-plugin'] } },
}, null, 2))
await writeFile(join(profile, 'cordis.patch.yml'), '- id: demo\n')
await writeFile(join(profile, 'cordis.yml'), '[]\n')
await writeFile(join(profile, 'pnpm-workspace.yaml'), 'packages:\n  - .\n')
await writeFile(join(profile, 'pnpm-lock.yaml'), "lockfileVersion: '9.0'\n")

// ---- Status --------------------------------------------------------------
const initial = await call('GET', '/dsh-backups')
check(initial.status === 200, 'status responds 200')
check(initial.payload.ok === true, 'status envelope is ok')
check(initial.payload.data.sessions.count === 1, `status counts one session (got ${initial.payload.data.sessions.count})`)
check(initial.payload.data.configuration.plugins.includes('@local/demo-plugin'), 'status lists the local plugin')
check(initial.payload.data.destination === backups, 'status reports the configured destination')
check(Array.isArray(initial.payload.data.backups) && initial.payload.data.backups.length === 0, 'no backups yet')

// ---- Create --------------------------------------------------------------
const created = await call('POST', '/dsh-backups/create', { sessions: true, configuration: true })
check(created.status === 200 && created.payload.ok === true, `create responds ok (${JSON.stringify(created.payload)})`)
const file = created.payload.data
check(existsSync(file.path), 'create wrote the backup file')
check(/^dsh-backup-\d{4}-\d{2}-\d{2}-\d{6}\.zip$/.test(file.name), `backup name is a zip: ${file.name}`)
check(file.bytes > 0, 'backup has content')

const archiveBytes = await readFile(file.path)
check(archiveBytes.readUInt32LE(0) === 0x04034b50, 'the archive starts with a local file header')
const entries = __test.readZip(archiveBytes)
check(entries.has('manifest.json'), 'the archive carries a manifest')
const storedLog = entries.get('sessions/--demo-project--/session-1111/session.v4.jsonl.zstd')
check(storedLog !== undefined, 'the session log is archived')
check(storedLog.length < sessionRaw.length, `the session log is re-encoded smaller (${storedLog.length} < ${sessionRaw.length})`)
check(__test.decodeStoredLog(storedLog).toString('utf8') === sessionLogical, 'the re-encoded log reproduces the original content')
check(storedLog.readUInt32LE(0) === 0xfd2fb528, 'the re-encoded log is still a Zstandard file')
check(![...entries.keys()].some((name) => name.endsWith('session.lock')), 'the session lock is not archived')
check(entries.get('config/cordis.patch.yml').toString() === '- id: demo\n', 'profile files are archived')
check(entries.get('plugins/local_demo-plugin/index.js') !== undefined, 'plugin sources are archived')
check(![...entries.keys()].some((name) => name.includes('node_modules')), 'plugin node_modules is skipped')
check(entries.get('stores/mcp-tools/servers.json').toString() === '{"servers":[]}', 'plugin data is archived')

const manifest = JSON.parse(entries.get('manifest.json').toString('utf8'))
check(manifest.kind === 'dsh-backup' && manifest.version === 2, 'manifest identity is right')
check(manifest.parts.sessions.sessionCount === 1, 'manifest records the session')
check(manifest.parts.sessions.workspaces[0].path === '/tmp/demo-project', 'manifest records workspace membership')
const profileNames = manifest.parts.configuration.profile.files.map((entry) => entry.name)
check(!profileNames.includes('pnpm-lock.yaml'), 'manifest skips the pnpm lockfile')
check(profileNames.includes('pnpm-workspace.yaml'), 'manifest keeps the pnpm workspace file')

// The 200 KB text entry must shrink, and nothing may be base64-inflated.
check(archiveBytes.length < 100000, `deflate shrinks the bulky text (archive is ${archiveBytes.length} bytes)`)
const rawTotal = 200000 + 30 + 32 + 24 + 200
check(archiveBytes.length < rawTotal, 'the archive never inflates its payloads')

// ---- Inspect -------------------------------------------------------------
const inspected = await call('POST', '/dsh-backups/inspect', archiveBytes)
check(inspected.payload.ok === true, 'inspect responds ok')
check(inspected.payload.data.parts.sessions.sessionCount === 1, 'inspect reports the session count')
check(inspected.payload.data.parts.configuration.plugins.length === 1, 'inspect reports the plugin')
check(inspected.payload.data.createdAt === manifest.createdAt, 'inspect reports the creation time')

const broke = Buffer.from('PK\u0003\u0004not really')
const rejected = await call('POST', '/dsh-backups/inspect', broke)
check(rejected.status === 400 && rejected.payload.code === 'invalid-backup', 'inspect rejects a damaged archive')

// ---- Legacy JSON ---------------------------------------------------------
const legacy = {
  kind: 'dsh-backup',
  version: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  app: { profile: 'old', platform: 'darwin' },
  parts: {
    sessions: {
      sessionCount: 1,
      workspaces: [],
      archivedSessionIds: [],
      files: [{ path: '--demo-project--/session-1111/session.v4.jsonl.zstd', data: Buffer.from('fake-compressed-log').toString('base64') }],
    },
  },
}
const legacyInspect = await call('POST', '/dsh-backups/inspect', Buffer.from(JSON.stringify(legacy)))
check(legacyInspect.payload.ok === true, 'a v1 JSON backup is still readable')
check(legacyInspect.payload.data.parts.sessions.sessionCount === 1, 'the v1 backup reports its session')

// ---- Restore -------------------------------------------------------------
await rm(join(home, 'sessions'), { recursive: true, force: true })
await writeFile(join(profile, 'package.json'), JSON.stringify({
  name: 'dsh-profile-test',
  private: true,
  dependencies: { '@local/demo-plugin': `link:${join(root, 'old-place')}` },
  dsh: { profile: { bundles: ['@local/demo-plugin'] } },
}, null, 2))
await writeFile(join(profile, 'cordis.patch.yml'), 'changed-by-restore-guard: true\n')

const restoreCall = makeResponse()
await __test.handleRequest(fakeContext, makeRequest('POST', '/dsh-backups/restore?sessions=1&configuration=1', archiveBytes), restoreCall, {
  isBusy: () => false,
  setBusy: () => {},
})
const restored = JSON.parse(restoreCall.body)
check(restored.ok === true, `restore responds ok (${restoreCall.body})`)
const summary = restored.data.summary
check(summary.sessions.written === 1, `restore wrote one session (got ${summary.sessions.written})`)
check(summary.configuration.plugins === 1, 'restore wrote one plugin')
check(summary.configuration.files >= 2, 'restore wrote profile files')

const restoredLog = await readFile(join(home, 'sessions', '--demo-project--', 'session-1111', 'session.v4.jsonl.zstd'))
check(__test.decodeStoredLog(restoredLog).toString('utf8') === sessionLogical, 'restored session decodes to the original content')
check(!existsSync(join(home, 'sessions', '--demo-project--', 'session-1111', 'session.lock')), 'restore does not bring locks back')

const restoredPlugin = join(home, 'local-plugins', 'local_demo-plugin')
check(existsSync(join(restoredPlugin, 'index.js')), 'plugin source was restored')
check(!existsSync(join(restoredPlugin, 'node_modules')), 'restored plugin excludes node_modules')
check((await stat(join(restoredPlugin, 'bulky.txt'))).size === 200000, 'restored plugin keeps every file intact')

const manifestAfter = JSON.parse(await readFile(join(profile, 'package.json'), 'utf8'))
check(manifestAfter.dependencies['@local/demo-plugin'] === `link:${restoredPlugin}`, 'manifest link points at the restored plugin')

const link = await lstat(join(profile, 'node_modules', '@local', 'demo-plugin'))
check(link.isSymbolicLink(), 'node_modules symlink was recreated')
const profileEntries = await readdir(profile)
check(profileEntries.some((name) => name.startsWith('cordis.patch.yml.bak-')), 'previous configuration was kept as a .bak file')
check((await readFile(join(profile, 'cordis.patch.yml'), 'utf8')) === '- id: demo\n', 'configuration file was restored')
check((await readFile(join(home, 'mcp-tools', 'servers.json'), 'utf8')) === '{"servers":[]}', 'plugin data store was restored')

// A second identical restore keeps the local file instead of overwriting it.
const again = await call('POST', '/dsh-backups/restore-file', { name: file.name, sessions: true, configuration: false })
check(again.payload.data.summary.sessions.unchanged === 1, 'repeated restore keeps identical sessions')
check(again.payload.data.summary.sessions.written === 0, 'repeated restore writes nothing')

// ---- Guard rails ---------------------------------------------------------
const traversal = await call('POST', '/dsh-backups/restore-file', { name: '../../etc/passwd.zip', sessions: true })
check(traversal.status === 400, 'restore-file rejects a traversal name')

const empty = await call('POST', '/dsh-backups/create', { sessions: false, configuration: false })
check(empty.status === 400 && empty.payload.code === 'empty-selection', 'create rejects an empty selection')

const unauthenticated = makeResponse()
await __test.handleRequest(fakeContext, {
  method: 'GET',
  url: '/dsh-backups',
  headers: { host: '127.0.0.1:1' },
}, unauthenticated, { isBusy: () => false, setBusy: () => {} })
check(unauthenticated.statusCode === 403, 'route rejects a request without the plugin header')

// ---- Listing -------------------------------------------------------------
const listed = await call('GET', '/dsh-backups')
check(listed.payload.data.backups.length === 1, 'saved backup is listed')
check(listed.payload.data.backups[0].name === file.name, 'listed backup matches')

// ---- Folder opener -------------------------------------------------------
const onMac = __test.folderCommand('darwin', '/tmp/backups')
check(onMac.command === 'open' && onMac.args[0] === '/tmp/backups', 'macOS opens the folder with open')
const onWindows = __test.folderCommand('win32', 'C:\\Users\\demo\\Backups')
check(onWindows.command === 'explorer.exe' && onWindows.args[0] === 'C:\\Users\\demo\\Backups', 'Windows opens the folder with explorer.exe')
const onLinux = __test.folderCommand('linux', '/tmp/backups')
check(onLinux.command === 'xdg-open', 'Linux opens the folder with xdg-open')

// ---- Metadata ------------------------------------------------------------
const manifestSelf = JSON.parse(await readFile(join(here, '..', 'package.json'), 'utf8'))
check(manifestSelf.name === '@local/dsh-backups', 'manifest name')
check(manifestSelf.exports['./client'] === './client.js', 'manifest exports the client module')
for (const locale of ['en', 'es']) {
  const meta = JSON.parse(await readFile(join(here, '..', 'locale', `${locale}.json`), 'utf8'))
  check(typeof meta.meta.title === 'string' && meta.meta.title.length > 0, `${locale} title exists`)
  check(typeof meta.meta.description === 'string' && meta.meta.description.length > 0, `${locale} description exists`)
}
const icon = await readFile(join(here, '..', 'icon.svg'), 'utf8')
check(icon.startsWith('<svg') && icon.includes('</svg>'), 'icon is a complete SVG')

await rm(root, { recursive: true, force: true })

if (failures > 0) {
  console.error(`${failures} host check(s) failed`)
  process.exit(1)
}
console.log('host check passed: zip create, inspect, legacy import, restore, guards')
