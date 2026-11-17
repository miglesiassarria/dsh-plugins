import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createStudio } from '../index.js'

test('binary files and UTF-8 survive editing without byte loss', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'skill-binary-'))
  try {
    const studio = createStudio({ root: join(dir, 'studio') })
    const bytes = Buffer.from([0, 255, 128, 42])
    const original = join(dir, 'original.bin'); await writeFile(original, bytes)
    const draft = { name: 'binary-example', description: 'Ejemplo de archivos', instructions: 'Verificar', files: { 'assets/test.bin': { encoding: 'base64', data: bytes.toString('base64') }, 'notes.txt': '\ufeffhola\r\nmundo', 'empty.txt': '' } }
    const saved = await studio.save(draft)
    assert.deepEqual(await readFile(join(dir, 'studio', draft.name, 'assets/test.bin')), bytes)
    assert.deepEqual(await readFile(original), bytes)
    assert.equal(saved.files['notes.txt'], draft.files['notes.txt'])
    const updated = await studio.save({ ...saved, description: 'Descripción modificada' })
    assert.deepEqual(updated.files['assets/test.bin'], draft.files['assets/test.bin'])
    assert.deepEqual(await readFile(join(dir, 'studio', draft.name, 'assets/test.bin')), bytes)
    for (const content of [{ encoding: 'base64', data: '!!!!' }, { encoding: 'base64', data: 'AB==' }, { encoding: 'base64', data: 'AA==', extra: true }]) await assert.rejects(studio.save({ ...updated, files: { 'x.bin': content } }), /binario|Base64/)
  } finally { await rm(dir, { recursive: true, force: true }) }
})
