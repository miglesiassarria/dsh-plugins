import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { GithubError, parseGithubFolderUrl, resolveGithubFolder } from '../github.js'

const cacheRoot = mkdtempSync(join(tmpdir(), 'dsh-config-github-'))

const MANIFEST = JSON.stringify({ name: '@local/example-plugin', version: '1.2.3', type: 'module' })
const INDEX = 'export function apply() {}\n'

function response(body, status = 200, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => headers[name.toLowerCase()] ?? null },
    async json() { return body },
    async arrayBuffer() {
      const bytes = Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    }
  }
}

function tree(extra = []) {
  return {
    truncated: false,
    tree: [
      { path: 'folder', type: 'tree', mode: '040000', sha: 't-folder' },
      { path: 'folder/package.json', type: 'blob', mode: '100644', sha: 'b-pkg', size: Buffer.byteLength(MANIFEST) },
      { path: 'folder/index.js', type: 'blob', mode: '100644', sha: 'b-index', size: Buffer.byteLength(INDEX) },
      { path: 'README.md', type: 'blob', mode: '100644', sha: 'b-readme', size: 4 },
      ...extra
    ]
  }
}

let rawDownloads = 0
let mode = 'ok'
const originalFetch = globalThis.fetch

globalThis.fetch = async (url, init) => {
  const address = new URL(String(url))
  if (address.hostname === 'api.github.com') {
    if (mode === 'rate-limited') return response({}, 403, { 'x-ratelimit-remaining': '0' })
    const path = decodeURIComponent(address.pathname)
    if (path === '/repos/owner/repo/commits/main/folder') return response({}, 404)
    if (path === '/repos/owner/repo/commits/main') {
      return response({ sha: mode === 'symlink' ? 'def456' : mode === 'no-package' ? 'fee789' : 'abc123' })
    }
    if (path === '/repos/owner/repo/git/trees/abc123') return response(tree())
    if (path === '/repos/owner/repo/git/trees/def456') {
      return response(tree([{ path: 'folder/link', type: 'blob', mode: '120000', sha: 'b-link', size: 3 }]))
    }
    if (path === '/repos/owner/repo/git/trees/fee789') {
      return response({ truncated: false, tree: [
        { path: 'folder', type: 'tree', mode: '040000', sha: 't-folder' },
        { path: 'folder/index.js', type: 'blob', mode: '100644', sha: 'b-index', size: Buffer.byteLength(INDEX) }
      ] })
    }
    return response({}, 404)
  }
  if (address.hostname === 'raw.githubusercontent.com') {
    rawDownloads += 1
    if (address.pathname.endsWith('/package.json')) return response(MANIFEST)
    if (address.pathname.endsWith('/index.js')) return response(INDEX)
    return response('readme')
  }
  throw new Error(`unexpected fetch ${String(url)}`)
}

try {
  assert.deepEqual(parseGithubFolderUrl('https://github.com/owner/repo/tree/main/folder'), {
    owner: 'owner',
    repo: 'repo',
    kind: 'tree',
    segments: ['main', 'folder']
  })
  assert.equal(parseGithubFolderUrl('https://github.com/owner/repo'), null)
  assert.equal(parseGithubFolderUrl('not a url'), null)

  const resolved = await resolveGithubFolder({
    url: 'https://github.com/owner/repo/tree/main/folder',
    cacheRoot
  })
  assert.equal(resolved.name, '@local/example-plugin')
  assert.equal(resolved.version, '1.2.3')
  assert.equal(resolved.ref, 'main')
  assert.equal(resolved.commit, 'abc123')
  assert.equal(resolved.folder, 'folder')
  assert.equal(resolved.files, 2)
  assert.ok(resolved.path.startsWith(cacheRoot))
  assert.equal(readFileSync(join(resolved.path, 'index.js'), 'utf8'), INDEX)
  assert.equal(JSON.parse(readFileSync(join(resolved.path, 'package.json'), 'utf8')).name, '@local/example-plugin')

  const downloads = rawDownloads
  const cached = await resolveGithubFolder({ url: 'https://github.com/owner/repo/tree/main/folder', cacheRoot })
  assert.equal(cached.path, resolved.path)
  assert.equal(rawDownloads, downloads, 'cached folders are not downloaded again')

  await assert.rejects(
    resolveGithubFolder({ url: 'https://github.com/owner/repo/blob/main/folder/index.js', cacheRoot }),
    (error) => error instanceof GithubError && error.code === 'invalid-url'
  )
  await assert.rejects(
    resolveGithubFolder({ url: 'https://github.com/owner/repo/tree/main/../secret', cacheRoot }),
    (error) => error instanceof GithubError && error.code === 'invalid-url'
  )

  mode = 'symlink'
  await assert.rejects(
    resolveGithubFolder({ url: 'https://github.com/owner/repo/tree/main/folder', cacheRoot }),
    (error) => error instanceof GithubError && error.code === 'unsupported-entry'
  )

  mode = 'no-package'
  await assert.rejects(
    resolveGithubFolder({ url: 'https://github.com/owner/repo/tree/main/folder', cacheRoot }),
    (error) => error instanceof GithubError && error.code === 'not-a-package'
  )

  mode = 'rate-limited'
  await assert.rejects(
    resolveGithubFolder({ url: 'https://github.com/owner/repo/tree/main/third', cacheRoot }),
    (error) => error instanceof GithubError && error.code === 'rate-limited'
  )
} finally {
  globalThis.fetch = originalFetch
  rmSync(cacheRoot, { recursive: true, force: true })
}

console.log('dsh-config github check passed')
