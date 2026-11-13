#!/usr/bin/env node
/**
 * Install @local/dsh-sandbox into a DSH profile.
 *
 * Run it from this folder with the same user that runs DeepSeek Harness:
 *   node install.mjs [profile]
 *
 * It links this package in the profile's node_modules, records the link in the
 * profile package.json and appends the bundle to dsh.profile.bundles. It does
 * not run pnpm; the link is enough for the loader, and your next pnpm install
 * keeps it because the dependency is recorded.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const profileName = process.argv[2] ?? process.env.DSH_PROFILE ?? 'desktop'
const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
const profile = join(home, 'profiles', profileName)
const manifestPath = join(profile, 'package.json')

if (!existsSync(manifestPath)) {
  console.error('No existe el perfil ' + profileName + ': ' + manifestPath)
  process.exit(1)
}

const backup = manifestPath + '.bak-dsh-sandbox'
copyFileSync(manifestPath, backup)
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
manifest.dependencies = manifest.dependencies ?? {}
manifest.dependencies['@local/dsh-sandbox'] = 'link:' + root
manifest.dsh = manifest.dsh ?? {}
manifest.dsh.profile = manifest.dsh.profile ?? {}
manifest.dsh.profile.bundles = manifest.dsh.profile.bundles ?? []
if (!manifest.dsh.profile.bundles.includes('@local/dsh-sandbox')) {
  manifest.dsh.profile.bundles.push('@local/dsh-sandbox')
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

const scope = join(profile, 'node_modules', '@local')
mkdirSync(scope, { recursive: true })
const link = join(scope, 'dsh-sandbox')
try {
  if (existsSync(link)) unlinkSync(link)
} catch {
  // A directory there would need manual removal; the error below is explicit.
}
symlinkSync(root, link, 'dir')

console.log('DSH Sandbox instalado en el perfil ' + profileName + '.')
console.log('Copia de seguridad del package.json: ' + backup)
console.log('Reinicia DeepSeek Harness para cargar el Host y el icono del compositor.')
