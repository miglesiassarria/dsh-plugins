/**
 * GitHub folder resolver for DSH Config.
 *
 * Turns a GitHub "tree" URL that points at a folder inside a repository
 * (`https://github.com/<owner>/<repo>/tree/<ref>/<folder>`) into a local
 * package directory the plugin manager can install like any other local path.
 * Only public repositories are read; every request is anonymous.
 *
 * The copy is immutable and cached per commit under
 * `$DSH_HOME/dsh-config/github/<owner>__<repo>/<commit>/<folder>`.
 *
 * @module @local/dsh-config/github
 */

import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'

/** GitHub REST base. */
const API = 'https://api.github.com'

/** Raw file base. */
const RAW = 'https://raw.githubusercontent.com'

/** API identification required by GitHub. */
const USER_AGENT = 'dsh-config'

/** Per-request deadline in milliseconds. */
const REQUEST_TIMEOUT_MS = 20_000

/** Raw download deadline in milliseconds. */
const DOWNLOAD_TIMEOUT_MS = 60_000

/** Maximum files copied from one folder. */
const MAX_FILES = 600

/** Maximum size of one file. */
const MAX_FILE_BYTES = 24 * 1024 * 1024

/** Maximum combined size of one folder. */
const MAX_TOTAL_BYTES = 64 * 1024 * 1024

/** Parallel raw downloads. */
const DOWNLOAD_CONCURRENCY = 6

/** `https://github.com/owner/repo/tree/<ref...>/<folder...>` */
const TREE_URL = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/?#\s]+)\/([^/?#\s]+)\/(tree|blob)\/([^?#\s]+)(?:[?#][^\s]*)?$/i

/** Owner and repository names GitHub accepts. */
const REPO_PART = /^[A-Za-z0-9_.-]+$/

/** One failed resolve; `code` and `status` are stable for the route and the browser. */
export class GithubError extends Error {
  /**
   * @param {string} code Stable machine-readable reason.
   * @param {number} status HTTP status the route should use.
   * @param {string} [detail] Human-readable detail, in the UI language of the caller when the route supplies one.
   */
  constructor(code, status, detail) {
    super(detail ?? code)
    this.name = 'GithubError'
    this.code = code
    this.status = status
    this.detail = detail ?? code
  }
}

/**
 * Reject one unsafe path segment.
 * @param {string} segment Decoded path segment.
 * @returns {string} The same segment.
 */
function safeSegment(segment) {
  if (segment === '' || segment === '.' || segment === '..') {
    throw new GithubError('invalid-url', 400, 'The GitHub folder URL contains an unsafe path.')
  }
  if (/[\\\0]/u.test(segment) || segment.length > 200) {
    throw new GithubError('invalid-url', 400, 'The GitHub folder URL contains an unsafe path.')
  }
  return segment
}

/**
 * Read a GitHub folder URL.
 * @param {unknown} raw The address as typed.
 * @returns {{ owner: string, repo: string, kind: string, segments: string[] } | null} Parsed address, or null when it is not a GitHub tree/blob URL.
 */
export function parseGithubFolderUrl(raw) {
  if (typeof raw !== 'string') return null
  const match = TREE_URL.exec(raw.trim())
  if (match === null) return null
  const owner = match[1]
  const repo = match[2].replace(/\.git$/i, '')
  if (!REPO_PART.test(owner) || !REPO_PART.test(repo) || owner === '.' || owner === '..' || repo === '.' || repo === '..') {
    throw new GithubError('invalid-url', 400, 'The GitHub repository name is not valid.')
  }
  let segments
  try {
    segments = match[4].split('/').filter((segment) => segment !== '').map((segment) => decodeURIComponent(segment))
  } catch {
    throw new GithubError('invalid-url', 400, 'The GitHub folder URL is not valid.')
  }
  if (segments.length === 0) {
    throw new GithubError('invalid-url', 400, 'The GitHub folder URL is not valid.')
  }
  return { owner, repo, kind: match[3].toLowerCase(), segments: segments.map(safeSegment) }
}

/**
 * Ask the GitHub API for one path.
 * @param {string} path API path starting with `/`.
 * @returns {Promise<any | null>} Parsed JSON, or null for a 404.
 */
async function githubApi(path) {
  let response
  try {
    response = await fetch(`${API}${path}`, {
      headers: {
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        'user-agent': USER_AGENT,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch {
    throw new GithubError('network', 502, 'GitHub could not be reached.')
  }
  if (response.status === 404 || response.status === 422) return null
  if (response.status === 403 || response.status === 429) {
    const remaining = response.headers.get('x-ratelimit-remaining')
    if (response.status === 429 || remaining === '0') {
      throw new GithubError('rate-limited', 429, 'The anonymous GitHub API limit was reached; wait a while and retry.')
    }
  }
  if (!response.ok) {
    throw new GithubError('network', 502, `GitHub answered with HTTP ${response.status}.`)
  }
  try {
    return await response.json()
  } catch {
    throw new GithubError('network', 502, 'GitHub answered with an unreadable document.')
  }
}

/**
 * Resolve the longest prefix of the URL path that names a ref.
 * @param {string} owner Repository owner.
 * @param {string} repo Repository name.
 * @param {string[]} segments Ref and folder segments.
 * @returns {Promise<{ ref: string, commit: string, folder: string }>} Resolved coordinates.
 */
async function resolveRef(owner, repo, segments) {
  for (let length = segments.length; length >= 1; length -= 1) {
    const ref = segments.slice(0, length).join('/')
    const encoded = ref.split('/').map(encodeURIComponent).join('/')
    const commit = await githubApi(`/repos/${owner}/${repo}/commits/${encoded}`)
    if (commit === null) continue
    if (typeof commit?.sha !== 'string') {
      throw new GithubError('not-found', 404, 'The ref does not name a commit.')
    }
    return { ref, commit: commit.sha, folder: segments.slice(length).join('/') }
  }
  throw new GithubError('not-found', 404, 'The repository, ref or folder could not be found.')
}

/**
 * Fetch the recursive tree of a commit.
 * @param {string} owner Repository owner.
 * @param {string} repo Repository name.
 * @param {string} commit Commit SHA.
 * @returns {Promise<Array<{ path: string, type: string, mode: string, size?: number }>>} Tree entries.
 */
async function readTree(owner, repo, commit) {
  const tree = await githubApi(`/repos/${owner}/${repo}/git/trees/${commit}?recursive=1`)
  if (tree === null) throw new GithubError('not-found', 404, 'The repository tree could not be read.')
  if (tree.truncated === true) {
    throw new GithubError('too-large', 413, 'The repository tree is too large to read this way.')
  }
  if (!Array.isArray(tree.tree)) {
    throw new GithubError('network', 502, 'GitHub answered with an unreadable tree.')
  }
  return tree.tree
}

/**
 * Download one raw file.
 * @param {string} url Raw URL.
 * @param {number} expected Expected byte size, when known.
 * @returns {Promise<Buffer>} File bytes.
 */
async function downloadFile(url, expected) {
  let response
  try {
    response = await fetch(url, {
      headers: { 'user-agent': USER_AGENT },
      redirect: 'follow',
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    })
  } catch {
    throw new GithubError('network', 502, 'A file could not be downloaded from GitHub.')
  }
  if (!response.ok) {
    throw new GithubError('network', 502, `A file could not be downloaded from GitHub (HTTP ${response.status}).`)
  }
  let buffer
  try {
    buffer = Buffer.from(await response.arrayBuffer())
  } catch {
    throw new GithubError('network', 502, 'A file could not be read from GitHub.')
  }
  if (buffer.length > MAX_FILE_BYTES) {
    throw new GithubError('too-large', 413, 'A file in the GitHub folder is too large.')
  }
  if (expected !== undefined && expected > 0 && buffer.length !== expected) {
    throw new GithubError('network', 502, 'A downloaded file does not match the size GitHub reported.')
  }
  return buffer
}

/**
 * Run tasks with bounded concurrency.
 * @template T, R
 * @param {T[]} items Work items.
 * @param {number} limit Maximum concurrent workers.
 * @param {(item: T) => Promise<R>} run Work.
 * @returns {Promise<R[]>} Results in input order.
 */
async function mapLimit(items, limit, run) {
  const results = new Array(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next
      next += 1
      results[index] = await run(items[index])
    }
  })
  await Promise.all(workers)
  return results
}

/**
 * Local file name for one repository path segment.
 * @param {string} segment Path segment.
 * @returns {string} A safe single path segment.
 */
function localSegment(segment) {
  const cleaned = segment.replace(/[<>:"|?*\u0000-\u001f]/gu, '_').replace(/[. ]+$/u, '')
  return cleaned === '' || cleaned === '.' || cleaned === '..' ? '_' : cleaned
}

/**
 * Download a public GitHub folder as a local package directory.
 * @param {{ url: string, cacheRoot: string }} input Address and cache root.
 * @returns {Promise<{ path: string, name: string, version: string, commit: string, ref: string, folder: string, files: number }>} The materialized package.
 */
export async function resolveGithubFolder(input) {
  const parsed = parseGithubFolderUrl(input.url)
  if (parsed === null) {
    throw new GithubError('invalid-url', 400, 'Use a GitHub folder URL such as https://github.com/owner/repo/tree/main/folder.')
  }
  if (parsed.kind !== 'tree') {
    throw new GithubError('invalid-url', 400, 'The URL points at a file; use the folder that contains the package.')
  }
  const { owner, repo, segments } = parsed
  const { ref, commit, folder } = await resolveRef(owner, repo, segments)
  const tree = await readTree(owner, repo, commit)

  const prefix = folder === '' ? '' : `${folder}/`
  if (folder !== '') {
    const folderEntry = tree.find((entry) => entry.path === folder)
    if (folderEntry === undefined || folderEntry.type !== 'tree') {
      throw new GithubError('not-found', 404, `The folder "${folder}" does not exist in that repository.`)
    }
  }
  const entries = tree.filter((entry) => {
    if (entry.type === 'blob' && (folder === '' || entry.path.startsWith(prefix))) return true
    return false
  })
  const links = tree.filter((entry) => entry.type !== 'blob' && entry.type !== 'tree' && (folder === '' || entry.path.startsWith(prefix)))
  if (links.length > 0) {
    throw new GithubError('unsupported-entry', 422, 'The folder contains a symlink or submodule, which cannot be copied.')
  }
  if (entries.length === 0) {
    throw new GithubError('not-a-package', 422, 'The GitHub folder is empty.')
  }
  if (entries.length > MAX_FILES) {
    throw new GithubError('too-large', 413, 'The GitHub folder has too many files.')
  }
  const total = entries.reduce((sum, entry) => sum + (typeof entry.size === 'number' ? entry.size : 0), 0)
  if (total > MAX_TOTAL_BYTES) {
    throw new GithubError('too-large', 413, 'The GitHub folder is too large.')
  }
  if (entries.some((entry) => entry.mode === '120000')) {
    throw new GithubError('unsupported-entry', 422, 'The folder contains a symlink, which cannot be copied.')
  }

  const repoKey = `${owner}__${repo}`
  const folderParts = folder === '' ? [] : folder.split('/').map(localSegment)
  const destination = resolve(input.cacheRoot, repoKey, commit, ...folderParts)
  const root = resolve(input.cacheRoot)
  if (destination !== root && !destination.startsWith(`${root}${sep}`)) {
    throw new GithubError('invalid-url', 400, 'The GitHub folder escapes the cache directory.')
  }
  const manifestPath = join(destination, 'package.json')
  if (existsSync(manifestPath)) {
    const manifest = await readManifest(manifestPath)
    if (manifest !== null) {
      return { path: destination, ...manifest, commit, ref, folder, files: entries.length }
    }
  }

  const temporary = `${destination}.tmp-${randomUUID().slice(0, 8)}`
  await rm(temporary, { recursive: true, force: true })
  await mkdir(temporary, { recursive: true })
  try {
    await mapLimit(entries, DOWNLOAD_CONCURRENCY, async (entry) => {
      const relative = entry.path.slice(prefix.length)
      const parts = relative.split('/').map(localSegment)
      const filePath = join(temporary, ...parts)
      await mkdir(dirname(filePath), { recursive: true })
      const rawPath = entry.path.split('/').map(encodeURIComponent).join('/')
      const bytes = await downloadFile(`${RAW}/${owner}/${repo}/${commit}/${rawPath}`, entry.size)
      await writeFile(filePath, bytes, { mode: 0o644 })
    })
    const manifest = await readManifest(join(temporary, 'package.json'))
    if (manifest === null) {
      throw new GithubError('not-a-package', 422, 'The GitHub folder has no readable package.json.')
    }
    await rm(destination, { recursive: true, force: true })
    await mkdir(dirname(destination), { recursive: true })
    await rename(temporary, destination)
    return { path: destination, ...manifest, commit, ref, folder, files: entries.length }
  } catch (error) {
    await rm(temporary, { recursive: true, force: true })
    throw error
  }
}

/**
 * Read a package manifest.
 * @param {string} path Manifest path.
 * @returns {Promise<{ name: string, version: string } | null>} Name and version, or null when unreadable.
 */
async function readManifest(path) {
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8'))
    if (typeof parsed?.name !== 'string' || parsed.name === '') return null
    return { name: parsed.name, version: typeof parsed.version === 'string' ? parsed.version : '' }
  } catch {
    return null
  }
}
