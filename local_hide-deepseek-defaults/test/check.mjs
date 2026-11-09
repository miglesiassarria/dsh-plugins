import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)

const patch = await readFile(new URL('cordis.patch.yml', root), 'utf8')
for (const id of ['llm-deepseek', 'llm-deepseek-account', 'ui-settings-account']) {
  const block = new RegExp(`(?:^|\\n)- id: ${id}\\n\\s+disabled: true(?:\\n|$)`)
  if (!block.test(patch)) throw new Error(`cordis.patch.yml does not disable ${id}`)
}

for (const locale of ['en', 'es']) {
  const document = JSON.parse(await readFile(new URL(`locale/${locale}.json`, root), 'utf8'))
  for (const field of ['title', 'description']) {
    if (typeof document.meta?.[field] !== 'string' || document.meta[field].length === 0) {
      throw new Error(`locale/${locale}.json is missing meta.${field}`)
    }
  }
}

const icon = await readFile(new URL('icon.svg', root), 'utf8')
if (!icon.includes('<svg') || !icon.includes('</svg>')) throw new Error('icon.svg is not an SVG document')

const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'))
if (manifest.dsh?.bundle?.patch !== './cordis.patch.yml') {
  throw new Error('package.json does not point dsh.bundle.patch at cordis.patch.yml')
}

console.log('hide-deepseek-defaults: ok')
