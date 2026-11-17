import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rename, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createStudio, evaluate, apply } from '../index.js'

const draft = { name: 'demo-skill', description: 'Una descripción suficientemente larga para identificar esta skill.', instructions: '1. Prepara los datos.\n2. Verifica el resultado y documenta los límites.\n' + 'Instrucciones detalladas. '.repeat(5), files: { 'scripts/check.sh': 'echo ok\n' } }
async function fixture(fn) {
  const temp = await mkdtemp(join(tmpdir(), 'studio-'))
  try { await fn(temp, createStudio({ root: join(temp, 'skills') })) } finally { await rm(temp, { recursive: true, force: true }) }
}
test('persistencia, revisiones y archivos', async () => fixture(async (dir, studio) => {
  const first = await studio.save(draft)
  assert.equal((await studio.get(draft.name)).files['scripts/check.sh'], 'echo ok\n')
  assert.equal((await studio.list()).length, 1)
  await assert.rejects(studio.save(draft), /Conflicto/)
  const second = await studio.save({ ...first, instructions: 'Actualizado', files: { 'notes.txt': 'hola' } })
  assert.equal(second.instructions, 'Actualizado')
  await assert.rejects(studio.save(first), /Conflicto/)
  assert.equal(await readFile(join(dir, 'skills', draft.name, 'notes.txt'), 'utf8'), 'hola')
}))
test('traversal, enlaces y conflictos de catálogo', async () => fixture(async (dir, studio) => {
  for (const path of ['../escape', '/tmp/x', 'x/../../evil', 'x\\evil', 'SKILL.md']) await assert.rejects(studio.save({ ...draft, files: { [path]: 'bad' } }), /Ruta/)
  await assert.rejects(studio.save({ ...draft, name: '../bad' }), /Nombre/)
  const occupied = createStudio({ root: join(dir, 'other'), skills: { list: async () => [{ name: draft.name }] } })
  await assert.rejects(occupied.save(draft), /Conflicto/)
  await studio.save(draft)
  await symlink(dir, join(dir, 'skills', draft.name, 'link'))
  await assert.rejects(studio.get(draft.name), /enlace|ruta/i)
}))
test('límite agregado, claves especiales y escritores concurrentes', async () => fixture(async (dir, studio) => {
  const files = Object.fromEntries(Array.from({ length: 5 }, (_, n) => [`${n}.txt`, 'x'.repeat(900000)]))
  await assert.rejects(studio.save({ ...draft, files }), /4 MiB/)
  const special = JSON.parse('{"__proto__":"contenido"}')
  const first = await studio.save({ ...draft, files: special })
  assert.equal(Object.hasOwn(first.files, '__proto__'), true)
  assert.equal(first.files.__proto__, 'contenido')
  const second = createStudio({ root: join(dir, 'skills') })
  const results = await Promise.allSettled([studio.save({ ...first, instructions: 'uno' }), second.save({ ...first, instructions: 'dos' })])
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1)
  assert.equal(results.filter(result => result.status === 'rejected').length, 1)
}))
test('recupera copia interrumpida sin sobrescribir y respeta bloqueo', async () => fixture(async (dir, studio) => {
  const original = await studio.save(draft)
  const root = join(dir, 'skills')
  const backup = join(root, '.backup-demo-skill--11111111-1111-4111-8111-111111111111')
  await rename(join(root, draft.name), backup)
  await mkdir(join(root, '.studio-write-lock'))
  await assert.rejects(studio.get(draft.name), /revisión manual/)
  await rm(join(root, '.studio-write-lock'), { recursive: true })
  assert.equal((await studio.get(draft.name)).revision, original.revision)
  await mkdir(backup)
  await writeFile(join(backup, 'marker'), 'no reemplazar')
  assert.equal((await studio.get(draft.name)).revision, original.revision)
  assert.equal(await readFile(join(backup, 'marker'), 'utf8'), 'no reemplazar')
}))
test('evaluación orientativa distingue entradas', () => {
  assert.ok(evaluate(draft).score > evaluate({}).score)
  assert.ok(evaluate({}).recommendations.length)
  assert.match(evaluate(draft).disclaimer, /no certifica/)
})
test('generación simulada y errores no escriben', async () => fixture(async (dir) => {
  const model = { currentSelection: () => ({ provider: 'mock', model: 'mock' }) }
  const llm = { async *stream(options) { assert.equal(options.provider, 'mock'); assert.match(options.system, /No incluyas SKILL\.md/); yield { type: 'text-delta', text: JSON.stringify(draft) }; yield { type: 'finish', reason: { kind: 'stop' } } } }
  const studio = createStudio({ root: join(dir, 'generated'), agentDefaultModel: model, llm })
  assert.deepEqual(await studio.generate('Crea una skill'), draft)
  assert.deepEqual(await studio.list(), [])
  const broken = createStudio({ root: join(dir, 'broken'), agentDefaultModel: model, llm: { async *stream() { yield { type: 'finish', reason: { kind: 'error', failure: { message: 'sin credenciales' } } } } } })
  await assert.rejects(broken.generate('hola'), /sin credenciales/)
  assert.deepEqual(await broken.list(), [])
  const invalid = createStudio({ root: join(dir, 'invalid'), agentDefaultModel: model, llm: { async *stream() { yield { type: 'text-delta', text: JSON.stringify({ ...draft, files: { 'SKILL.md': 'duplicate' } }) }; yield { type: 'finish', reason: { kind: 'stop' } } } } })
  await assert.rejects(invalid.generate('hola'), /Borrador del modelo inválido: Ruta auxiliar inválida "SKILL.md".*No se ha guardado/)
  assert.deepEqual(await invalid.list(), [])
}))
test('integración usa canal Connection autenticado y proveedor de catálogo', async () => fixture(async dir => {
  const old = process.env.DSH_HOME; process.env.DSH_HOME = dir
  try {
    let provider, route, tool
    const disposers = []
    const ctx = { effect(f) { const dispose = f(); disposers.push(dispose); return dispose }, tools: { register(value) { tool = value; return () => {} } }, skills: { registerProvider(f) { provider = f({ invalidate() {} }); return () => {} }, list: async () => [] }, llm: {}, agentDefaultModel: {}, connection: { fetch: { register(value) { route = value; return async () => {} } } } }
    apply(ctx)
    const response = await route.fetch(new Request('http://localhost/api/skill-studio', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operation: 'save', draft }) }))
    assert.equal((await response.json()).ok, true)
    const candidates = await provider.list()
    assert.equal(candidates[0].name, draft.name)
    assert.equal((await provider.get(candidates[0])).content, draft.instructions)
    assert.equal((await tool.execute({ operation: 'get', name: draft.name }, { signal: new AbortController().signal })).data.name, draft.name)
    assert.equal(disposers.length, 3)
    for (const dispose of disposers.reverse()) await dispose()
  } finally { if (old === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = old }
}))
