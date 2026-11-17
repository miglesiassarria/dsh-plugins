import { createHash, randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import { lstat, mkdir, open, readdir, readFile, rename, rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

export const inject = ['connection', 'skills', 'llm', 'agentDefaultModel', 'tools']
const MAX_TOTAL_BYTES = 4 * 1024 * 1024
const namePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const hash = value => createHash('sha256').update(value).digest('hex')
const fail = message => { throw new Error(message) }
function validName(name) {
  if (typeof name !== 'string' || name.length > 64 || !namePattern.test(name)) fail('Nombre inválido: usa kebab-case de hasta 64 caracteres')
  return name
}
function validPath(path) {
  if (typeof path !== 'string' || path.length > 240 || !path || path.includes('\\') || path.split('/').some(x => !x || x === '.' || x === '..' || x.startsWith('.')) || path === 'SKILL.md' || path.split('/').some(x => !/^[a-zA-Z0-9_][a-zA-Z0-9_.-]*$/.test(x))) fail(`Ruta auxiliar inválida ${JSON.stringify(String(path).slice(0, 240))}: usa rutas relativas como scripts/check.sh; sin SKILL.md, puntos iniciales ni segmentos . o ..`)
  return path
}
function fileBytes(content) {
  if (typeof content === 'string') return Buffer.from(content, 'utf8')
  if (!content || typeof content !== 'object' || Array.isArray(content) || Object.keys(content).sort().join(',') !== 'data,encoding' || content.encoding !== 'base64' || typeof content.data !== 'string' || content.data.length > Math.ceil(1024 * 1024 / 3) * 4 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(content.data)) fail('Archivo binario inválido')
  const bytes = Buffer.from(content.data, 'base64')
  if (bytes.toString('base64') !== content.data) fail('Base64 no canónico')
  return bytes
}
function fileValue(bytes) {
  const text = bytes.toString('utf8')
  return !bytes.includes(0) && Buffer.from(text, 'utf8').equals(bytes) ? text : { encoding: 'base64', data: bytes.toString('base64') }
}
function validate(draft) {
  if (!draft || typeof draft !== 'object') fail('Skill inválida')
  validName(draft.name)
  for (const key of ['description', 'instructions']) if (typeof draft[key] !== 'string' || draft[key].length > 100000) fail(`${key} inválido`)
  if (!draft.description.trim() || draft.description.length > 1024 || /[\r\n]/.test(draft.description)) fail('Descripción inválida')
  if (!draft.instructions.trim()) fail('Las instrucciones son obligatorias')
  const files = draft.files ?? {}
  if (!files || typeof files !== 'object' || Array.isArray(files) || Object.keys(files).length > 100) fail('Archivos inválidos')
  let total = 0
  const nodes = new Set()
  const paths = new Set(Object.keys(files))
  for (const [path, content] of Object.entries(files)) {
    validPath(path)
    const parts = path.split('/')
    for (let i = 1; i <= parts.length; i++) {
      const node = parts.slice(0, i).join('/')
      if (i < parts.length && (paths.has(node) || node === 'SKILL.md')) fail('Colisión entre archivo y directorio')
      nodes.add(node)
    }
    if (nodes.size > 200) fail('Demasiados archivos o directorios')
    const bytes = fileBytes(content)
    if (bytes.length > 1024 * 1024) fail('Archivo inválido o demasiado grande')
    total += bytes.length
    if (total > MAX_TOTAL_BYTES) fail('El conjunto de archivos supera 4 MiB')
  }
  return { name: draft.name, description: draft.description, instructions: draft.instructions, files }
}
export function evaluate(draft = {}) {
  const checks = [
    ['name', 'Nombre válido', typeof draft.name === 'string' && namePattern.test(draft.name) && draft.name.length <= 64, 15, 'Usa un nombre kebab-case.'],
    ['description', 'Descripción y contexto', typeof draft.description === 'string' && draft.description.trim().length >= 30, 20, 'Describe qué hace y cuándo utilizarla.'],
    ['instructions', 'Instrucciones sustanciales', typeof draft.instructions === 'string' && draft.instructions.trim().length >= 100, 25, 'Añade instrucciones concretas y suficientes.'],
    ['steps', 'Pasos explícitos', /(?:^|\n)\s*(?:\d+[.)]|[-*])\s+/.test(draft.instructions || ''), 15, 'Organiza el procedimiento en pasos.'],
    ['verification', 'Verificación', /verific|valid|comprob|test|check/i.test(draft.instructions || ''), 15, 'Incluye una comprobación de resultados.'],
    ['limits', 'Límites', /límite|limit|riesgo|segur|no ejecutar|scope/i.test(draft.instructions || ''), 10, 'Documenta límites y riesgos.'],
  ]
  const criteria = checks.map(([id, label, passed, points, recommendation]) => ({ id, label, passed, points: passed ? points : 0, maxPoints: points, recommendation: passed ? null : recommendation }))
  return { score: criteria.reduce((sum, c) => sum + c.points, 0), criteria, recommendations: criteria.filter(c => !c.passed).map(c => c.recommendation), disclaimer: 'Puntuación orientativa: no certifica seguridad ni ejecución correcta.' }
}
async function safeDir(path, create = false) {
  if (create) { try { await mkdir(path, { mode: 0o700 }) } catch (e) { if (e.code !== 'EEXIST') throw e } }
  const s = await lstat(path)
  if (!s.isDirectory() || s.isSymbolicLink()) fail('Directorio inseguro')
}
async function readTree(dir, prefix = '', budget = { count: 0, bytes: 0 }) {
  const out = Object.create(null)
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${ent.name}` : ent.name
    if (!prefix && ent.name === 'SKILL.md') continue
    validPath(path)
    const full = join(dir, ent.name)
    const st = await lstat(full)
    if (st.isSymbolicLink()) fail('Enlace simbólico rechazado')
    if (++budget.count > 200) fail('Demasiados archivos o directorios')
    if (st.isDirectory()) Object.assign(out, await readTree(full, path, budget))
    else if (st.isFile() && st.nlink === 1 && st.size <= 1024 * 1024) {
      budget.bytes += st.size
      if (budget.bytes > MAX_TOTAL_BYTES) fail('El conjunto de archivos supera 4 MiB')
      const handle = await open(full, constants.O_RDONLY | (constants.O_NOFOLLOW || 0))
      try { out[path] = fileValue(await handle.readFile()) } finally { await handle.close() }
    } else fail('Archivo inseguro')
  }
  return out
}
export function createStudio({ root = join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'skill-studio'), skills, llm, agentDefaultModel, invalidate = () => {} } = {}) {
  root = resolve(root)
  let queue = Promise.resolve()
  async function init() {
    // Create the trusted root's parent only; reject a linked root.
    await mkdir(join(root, '..'), { recursive: true, mode: 0o700 })
    await safeDir(root, true)
  }
  async function withReadLock(operation) {
    await init()
    const lock = join(root, '.studio-write-lock')
    try { await mkdir(lock, { mode: 0o700 }) }
    catch (error) { if (error.code === 'EEXIST') fail('Conflicto: guardado o recuperación en curso; si se interrumpió, requiere revisión manual del bloqueo'); throw error }
    try { await recoverInterrupted(); return await operation() } finally { await rm(lock, { recursive: true, force: true }) }
  }
  async function get(name, internal = false) {
    if (!internal) return withReadLock(() => get(name, true))
    validName(name); await init()
    const dir = join(root, name); await safeDir(dir)
    const md = join(dir, 'SKILL.md'); const st = await lstat(md)
    if (!st.isFile() || st.isSymbolicLink() || st.nlink !== 1 || st.size > 1024 * 1024) fail('SKILL.md inseguro')
    const fd = await open(md, constants.O_RDONLY | (constants.O_NOFOLLOW || 0))
    let raw; try { raw = await fd.readFile('utf8') } finally { await fd.close() }
    const match = /^---\nname: ([^\n]+)\ndescription: ("[^\n]*")\n---\n([\s\S]*)$/.exec(raw)
    if (!match || match[1] !== name) fail('Skill no gestionada por Studio')
    let description; try { description = JSON.parse(match[2]) } catch { fail('Metadatos inválidos') }
    const draft = { name, description, instructions: match[3], files: await readTree(dir) }
    return { ...draft, revision: hash(JSON.stringify(draft)) }
  }
  async function list(internal = false) {
    if (!internal) return withReadLock(() => list(true))
    await init(); const result = []
    for (const ent of await readdir(root, { withFileTypes: true })) {
      if (!ent.isDirectory() || !namePattern.test(ent.name)) continue
      try { const { name, description, revision } = await get(ent.name, true); result.push({ name, description, revision }) } catch { /* foreign or unsafe entries stay untouched */ }
    }
    return result.sort((a, b) => a.name.localeCompare(b.name))
  }
  async function save(input, catalog) {
    const draft = validate(input); await init()
    const dir = join(root, draft.name)
    let exists = false
    try { await lstat(dir); exists = true } catch (e) { if (e.code !== 'ENOENT') throw e }
    if (exists) {
      if (typeof input.revision !== 'string') fail('Conflicto: la skill ya existe')
      const current = await get(draft.name, true)
      if (current.revision !== input.revision) fail('Conflicto: la skill cambió desde su lectura')
    } else {
      if (input.revision) fail('Conflicto: la skill ya no existe')
      if (catalog?.some(s => s.name === draft.name)) fail('Conflicto: existe una skill con ese nombre en el catálogo')
    }
    const stage = join(root, `.stage-${randomUUID()}`)
    await mkdir(stage, { mode: 0o700 })
    try {
      const markdown = `---\nname: ${draft.name}\ndescription: ${JSON.stringify(draft.description)}\n---\n${draft.instructions}`
      await writeExclusive(join(stage, 'SKILL.md'), markdown)
      for (const [path, content] of Object.entries(draft.files)) {
        const parts = path.split('/'); let parent = stage
        for (const part of parts.slice(0, -1)) { parent = join(parent, part); await safeDir(parent, true) }
        await writeExclusive(join(parent, parts.at(-1)), fileBytes(content))
      }
      if (exists) {
        // A rename swap cannot atomically replace a nonempty directory. Preserve the old copy until commit.
        const backup = join(root, `.backup-${draft.name}--${randomUUID()}`)
        await rename(dir, backup)
        try { await rename(stage, dir) } catch (error) { await rename(backup, dir); throw error }
        await rm(backup, { recursive: true, force: true })
      } else {
        // Reserve the final name without replacing another process's directory.
        await mkdir(dir, { mode: 0o700 })
        try { await rename(stage, dir) } catch (error) { await rm(dir, { recursive: true, force: true }); throw error }
      }
      invalidate()
      return await get(draft.name, true)
    } finally { await rm(stage, { recursive: true, force: true }) }
  }
  async function recoverInterrupted() {
    const candidates = new Map()
    for (const entry of await readdir(root, { withFileTypes: true })) {
      const match = /^\.backup-([a-z0-9]+(?:-[a-z0-9]+)*)--([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/.exec(entry.name)
      if (!match || !entry.isDirectory() || match[1].length > 64) continue
      const list = candidates.get(match[1]) || []
      list.push(entry.name); candidates.set(match[1], list)
    }
    for (const [name, backups] of candidates) {
      const target = join(root, name)
      try { await lstat(target); continue } catch (error) { if (error.code !== 'ENOENT') throw error }
      if (backups.length !== 1) fail(`Recuperación manual necesaria para ${name}: varias copias`)
      const backup = join(root, backups[0])
      await safeDir(backup)
      // Reserve the destination: never replace an independently created skill.
      try { await mkdir(target, { mode: 0o700 }) }
      catch (error) { if (error.code === 'EEXIST') continue; throw error }
      try { await rename(backup, target) }
      catch (error) { await rm(target, { recursive: true, force: true }); throw error }
      invalidate()
    }
  }
  async function saveSerial(input) {
    const job = queue.then(async () => {
      const catalog = input?.revision ? [] : (skills ? await skills.list() : [])
      await init()
      const lock = join(root, '.studio-write-lock')
      try { await mkdir(lock, { mode: 0o700 }) }
      catch (error) { if (error.code === 'EEXIST') fail('Conflicto: otra operación de guardado está en curso'); throw error }
      try { await recoverInterrupted(); return await save(input, catalog) } finally { await rm(lock, { recursive: true, force: true }) }
    })
    queue = job.catch(() => {}); return job
  }
  async function deleteSerial(name, revision) {
    validName(name)
    if (typeof revision !== 'string' || !revision) fail('Conflicto: se requiere la revisión de la skill')
    const job = queue.then(() => withReadLock(async () => {
      const current = await get(name, true)
      if (current.revision !== revision) fail('Conflicto: la skill cambió desde su lectura')
      const backupPattern = /^\.backup-([a-z0-9]+(?:-[a-z0-9]+)*)--[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      if ((await readdir(root)).some(entry => backupPattern.exec(entry)?.[1] === name)) fail(`Recuperación manual necesaria para ${name}: existe una copia pendiente`)
      // Even a failed recursive removal may have changed the provider's contents.
      try { await rm(join(root, name), { recursive: true }) } finally { invalidate() }
      return { name, deleted: true }
    }))
    queue = job.catch(() => {}); return job
  }
  async function generate(request, signal) {
    const prompt = typeof request === 'string' ? request : request?.prompt
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 20000) fail('Petición inválida')
    const selection = agentDefaultModel?.currentSelection()
    if (!llm || !selection?.provider || !selection?.model) fail('No hay modelo configurado')
    let text = '', finished = false
    for await (const chunk of llm.stream({ ...selection, messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }], system: 'Devuelve solamente un objeto JSON con name, description, instructions y files. name debe ser kebab-case y tener máximo 64 caracteres; description es texto de una línea; instructions es texto no vacío. files es un objeto opcional de rutas relativas a contenido textual, por ejemplo {"scripts/check.sh":"echo ok"}; usa {} si no hacen falta auxiliares. No incluyas SKILL.md en files: se crea a partir de name, description e instructions. Las rutas no pueden ser absolutas, contener barras invertidas, segmentos vacíos, . o .., ni componentes que empiecen por punto. Cada componente empieza por letra ASCII, número o guion bajo y solo admite letras ASCII, números, guion bajo, punto o guion. No ejecutes nada.', signal })) {
      if (chunk.type === 'text-delta') { text += chunk.text; if (text.length > 2_000_000) fail('Respuesta demasiado grande') }
      if (chunk.type === 'finish') { finished = true; if (chunk.reason.kind !== 'stop') fail(`Generación fallida: ${chunk.reason.failure?.message || chunk.reason.kind}`) }
    }
    if (!finished) fail('La generación terminó sin resultado completo')
    let draft; try { draft = JSON.parse(text.trim().replace(/^```(?:json)?\s*|\s*```$/g, '')) } catch { fail('El modelo no devolvió JSON válido') }
    try { return validate(draft) } catch (error) { fail(`Borrador del modelo inválido: ${error.message}. No se ha guardado; reformula la petición y vuelve a intentarlo.`) }
  }
  return { list, get, save: saveSerial, delete: deleteSerial, evaluate, generate, root }
}
async function writeExclusive(path, content) {
  const fd = await open(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW || 0), 0o600)
  try { await fd.writeFile(content, 'utf8') } finally { await fd.close() }
}
export function apply(ctx) {
  let invalidate = () => {}
  const studio = createStudio({ skills: ctx.skills, llm: ctx.llm, agentDefaultModel: ctx.agentDefaultModel, invalidate: () => invalidate() })
  ctx.effect(() => ctx.skills.registerProvider(control => {
    invalidate = control.invalidate
    return {
      name: 'skill-studio',
      async list() { return (await studio.list()).map(s => ({ ...s, source: 'custom', provider: 'skill-studio', rank: 0, locator: s.name, invocation: { modelInvocable: true, userInvocable: true }, resourceBase: { kind: 'directory', path: join(studio.root, s.name) } })) },
      async get(candidate) { const s = await studio.get(candidate.locator); return { name: s.name, description: s.description, content: s.instructions, source: 'custom', provider: 'skill-studio', invocation: { modelInvocable: true, userInvocable: true }, resourceBase: { kind: 'directory', path: join(studio.root, s.name) } } },
    }
  }), 'skill-studio provider')
  async function dispatch(data, signal) {
    switch (data?.operation) {
      case 'list': return studio.list()
      case 'get': return studio.get(data.name)
      case 'save': return studio.save(data.draft)
      case 'delete': return studio.delete(data.name, data.revision)
      case 'evaluate': return studio.evaluate(data.draft)
      case 'generate': return studio.generate(data.prompt, signal)
      default: fail('Operación desconocida')
    }
  }
  ctx.effect(() => ctx.tools.register({
    name: 'skill_studio',
    description: 'Gestiona skills de Studio: listar, leer, guardar o eliminar con revisión, evaluar o generar borradores. No ejecuta scripts.',
    parameters: { type: 'object', properties: { operation: { type: 'string', enum: ['list', 'get', 'save', 'delete', 'evaluate', 'generate'] }, name: { type: 'string' }, revision: { type: 'string' }, prompt: { type: 'string' }, draft: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, instructions: { type: 'string' }, files: { type: 'object' }, revision: { type: 'string' } }, additionalProperties: false } }, required: ['operation'], additionalProperties: false },
    output: { schema: { type: 'object', additionalProperties: true }, render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }] },
    async execute(args, exec) { return { data: await dispatch(args, exec.signal) } },
    isConcurrencySafe: args => !['save', 'delete'].includes(args?.operation),
  }), 'skill-studio tool')
  ctx.effect(() => ctx.connection.fetch.register({ path: '/api/skill-studio', methods: ['POST'], requestBody: 'buffered', async fetch(request) {
    try {
      const data = await request.json()
      const result = await dispatch(data, request.signal)
      return Response.json({ ok: true, data: result })
    } catch (error) { return Response.json({ ok: false, error: error.message || 'Error' }, { status: 400 }) }
  } }), 'skill-studio transport')
}
