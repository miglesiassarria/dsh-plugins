window.__ModuleLoader__.load({
  id: '@local/skill-studio',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const NS = '@local/skill-studio';
    const strings = {
      es: { nav: 'Skills', title: 'Skill Studio', intro: 'Diseña instrucciones reutilizables y revisa cada borrador antes de guardarlo.' },
      en: { nav: 'Skills', title: 'Skill Studio', intro: 'Design reusable instructions and review each draft before saving.' },
    };
    const css = `
.ss .ss-library{max-height:min(55vh,480px);overflow-y:auto;gap:2px}.ss .ss-library button{padding:5px 8px;overflow-wrap:anywhere}
.ss{color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5;min-width:0;padding:4px 0 24px}.ss *{box-sizing:border-box}.ss-head{border-bottom:1px solid var(--dsw-alias-border-l1);padding-bottom:18px;margin-bottom:18px}.ss-kicker{font:600 11px ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--dsw-alias-brand-primary)}.ss h2{font-size:24px;letter-spacing:-.035em;margin:4px 0}.ss p{margin:4px 0;color:var(--dsw-alias-label-secondary)}.ss-layout{display:grid;grid-template-columns:minmax(155px,220px) minmax(0,1fr);gap:20px}.ss-panel{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);padding:16px;min-width:0}.ss-title{font-size:14px;margin:0 0 10px}.ss-list{display:flex;flex-direction:column;gap:6px;margin-top:12px}.ss button{font:inherit;cursor:pointer;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;padding:7px 10px;color:inherit;background:var(--dsw-alias-bg-layer-2);text-align:left}.ss button:hover:not(:disabled){border-color:var(--dsw-alias-brand-primary)}.ss button:focus-visible,.ss input:focus-visible,.ss textarea:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.ss button:disabled{opacity:.5;cursor:not-allowed}.ss .primary{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground,#fff);border-color:transparent}.ss label{display:block;font-weight:600;margin:12px 0 5px}.ss input,.ss textarea{width:100%;padding:9px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:var(--dsw-alias-bg-base);color:inherit;font:inherit}.ss textarea{resize:vertical;min-height:76px}.ss textarea.code{font:12px/1.55 ui-monospace,monospace;min-height:180px;tab-size:2}.ss-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.ss-note{padding:10px 12px;border-left:3px solid var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2);margin:12px 0;overflow-wrap:anywhere}.ss-error{border-color:var(--dsw-alias-state-error-primary)}.ss-sep{border:0;border-top:1px solid var(--dsw-alias-border-l1);margin:20px 0}.ss-small{font-size:12px;color:var(--dsw-alias-label-secondary)}.ss-file{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;align-items:end}.ss-score{font:600 28px ui-monospace,monospace}.ss ul{padding-left:20px}.ss-empty{padding:14px 0;color:var(--dsw-alias-label-secondary)}@media(max-width:650px){.ss-layout{grid-template-columns:1fr}}
`;
    const empty = () => ({ name: '', description: '', instructions: '', files: [] });
    async function request(operation, payload) {
      const response = await fetch('/api/skill-studio', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ operation }, payload)) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'No se pudo completar la operación');
      return result.data;
    }
    const validPath = path => !!path && path.length <= 240 && path !== 'SKILL.md' && !path.split('/').some(part => !part || part.startsWith('.') || !/^[a-zA-Z0-9_][a-zA-Z0-9_.-]*$/.test(part));
    const fileSize = content => typeof content === 'string' ? new TextEncoder().encode(content).length : Math.floor((content.data || '').length * 3 / 4) - ((content.data || '').endsWith('==') ? 2 : (content.data || '').endsWith('=') ? 1 : 0);
    const fromHost = d => Object.assign({}, d, { files: Object.entries(d.files || {}).map(([path, content]) => ({ path, content })) });
    const toHost = d => Object.assign({}, d, { files: Object.fromEntries(d.files.map(f => [f.path, f.content])) });
    function Icon(props) {
      return h('svg', { width: props.size || 16, height: props.size || 16, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': true }, h('path', { d: 'M4 3.5h9l3 3v10H4zM13 3.5v3h3M7 10h6M7 13h6', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }));
    }
    function Page(props) {
      const [draft, setDraft] = React.useState(empty);
      const [search, setSearch] = React.useState('');
      const fileInput = React.useRef(null);
      const [selected, setSelected] = React.useState(-1);
      const [prompt, setPrompt] = React.useState('');
      const [notice, setNotice] = React.useState('');
      const [success, setSuccess] = React.useState('');
      const [evaluation, setEvaluation] = React.useState(null);
      const [dirty, setDirty] = React.useState(false);
      const [items, setItems] = React.useState([]);
      const [busy, setBusy] = React.useState(false);
      const [connected, setConnected] = React.useState(false);
      const [savedName, setSavedName] = React.useState(null);
      const [proposal, setProposal] = React.useState(null);
      React.useEffect(() => { const warn = event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
      const load = async () => { try { setItems(await request('list')); setConnected(true); } catch (e) { setConnected(false); setNotice(e.message); } };
      React.useEffect(() => { load(); }, []);
      const run = async (fn) => { setBusy(true); setNotice(''); setSuccess(''); try { await fn(); } catch (e) { setNotice(e.message); } finally { setBusy(false); } };
      const selectSkill = name => { if (dirty && !window.confirm('¿Descartar los cambios del borrador actual?')) return; run(async () => { const value = await request('get', { name }); setDraft(fromHost(value)); setSavedName(value.name); setDirty(false); setSelected(-1); setEvaluation(null); }); };
      const save = () => run(async () => { const paths = new Set(); for (const file of draft.files) { if (!validPath(file.path)) throw new Error('Ruta relativa inválida: ' + file.path); if (paths.has(file.path)) throw new Error('Hay archivos con la misma ruta: ' + file.path); paths.add(file.path); } const value = await request('save', { draft: toHost(draft) }); setDraft(fromHost(value)); setSavedName(value.name); setDirty(false); setSuccess('Skill guardada.'); await load(); });
      const evaluate = () => run(async () => setEvaluation(await request('evaluate', { draft: toHost(draft) })));
      const generate = () => run(async () => { const value = await request('generate', { prompt }); setProposal(fromHost(value)); setSuccess('Propuesta recibida; aplícala cuando quieras sustituir el borrador.'); });
      const applyProposal = () => { if (dirty && !window.confirm('¿Sustituir el borrador actual sin guardar por la propuesta?')) return; setDraft(proposal); setProposal(null); setSavedName(null); setDirty(true); setSelected(-1); setEvaluation(null); setSuccess('Propuesta aplicada. Revisa y edita antes de guardar.'); };
      const change = (key, value) => { if (busy) return; setDraft(old => Object.assign({}, old, { [key]: value })); setDirty(true); setEvaluation(null); };
      const reset = () => {
        if (dirty && !window.confirm('¿Descartar los cambios del borrador actual?')) return;
        setDraft(empty()); setSavedName(null); setSelected(-1); setNotice(''); setEvaluation(null); setDirty(false);
      };
      const deleteSkill = () => {
        if (!savedName || !draft.revision) return;
        if (!window.confirm('¿Eliminar la skill «' + savedName + '» y todos sus archivos? Esta acción no se puede deshacer.' + (dirty ? ' También se perderán los cambios sin guardar.' : ''))) return;
        run(async () => { await request('delete', { name: savedName, revision: draft.revision }); setDraft(empty()); setSavedName(null); setSelected(-1); setDirty(false); setEvaluation(null); setSuccess('Skill eliminada.'); await load(); });
      };
      const addFiles = async event => {
        const chosen = Array.from(event.target.files || []); event.target.value = '';
        if (!chosen.length) return;
        try {
          if (draft.files.length + chosen.length > 100) throw new Error('Máximo 100 archivos.');
          const names = new Set(draft.files.map(file => file.path));
          let total = draft.files.reduce((sum, file) => sum + fileSize(file.content), 0);
          for (const file of chosen) {
            if (!validPath(file.name)) throw new Error('Ruta inválida: ' + file.name);
            if (names.has(file.name)) throw new Error('Ya existe un archivo con la ruta «' + file.name + '». Cambia su ruta antes de añadirlo.');
            names.add(file.name);
            if (file.size > 1024 * 1024) throw new Error('El archivo «' + file.name + '» supera 1 MiB.');
            total += file.size;
          }
          if (total > 4 * 1024 * 1024) throw new Error('El conjunto de archivos supera 4 MiB.');
          setBusy(true); setNotice('');
          const files = await Promise.all(chosen.map(async file => {
            const bytes = new Uint8Array(await file.arrayBuffer());
            let content;
            try { content = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); if (content.includes('\u0000')) throw new Error('binary'); }
            catch (_) { let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte); content = { encoding: 'base64', data: btoa(binary) }; }
            return { path: file.name, content };
          }));
          setDraft(old => Object.assign({}, old, { files: old.files.concat(files) })); setDirty(true); setEvaluation(null); setSelected(draft.files.length);
        } catch (e) { setNotice(e.message); } finally { setBusy(false); }
      };
      const updatePath = value => { change('files', draft.files.map((file, i) => i === selected ? Object.assign({}, file, { path: value }) : file)); };
      const updateFile = value => change('files', draft.files.map((file, i) => i === selected ? Object.assign({}, file, { content: value }) : file));
      const removeFile = () => {
        if (!window.confirm('¿Quitar este archivo del borrador?')) return;
        change('files', draft.files.filter((_, i) => i !== selected)); setSelected(-1);
      };
      return h('div', { className: 'ss' }, h('style', null, css),
        h('header', { className: 'ss-head' }, h('div', { className: 'ss-kicker' }, 'WORKBENCH / 01'), h('h2', null, props.t('title')), h('p', null, props.t('intro'))),
        !connected && h('div', { className: 'ss-note', role: 'status' }, 'La conexión con el Host no está disponible. Puedes preparar un borrador local, pero las operaciones requieren el transporte autorizado.', h('div', { className: 'ss-actions' }, h('button', { type: 'button', onClick: load }, 'Reintentar'))),
        h('div', { className: 'ss-layout' },
          h('aside', { className: 'ss-panel' }, h('h3', { className: 'ss-title' }, 'Skills de Studio'), h('p', { className: 'ss-small' }, 'Solo aparecen las skills gestionadas por este complemento.'), h('button', { className: 'primary', type: 'button', onClick: reset, disabled: busy }, '+ Nueva skill'), h('label', { htmlFor: 'ss-search' }, 'Buscar por nombre'), h('input', { id: 'ss-search', type: 'search', value: search, onChange: e => setSearch(e.target.value), placeholder: 'Filtrar skills' }), h('div', { className: 'ss-list ss-library', 'aria-label': 'Skills de Studio' }, items.filter(item => item.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).map(item => h('button', { type: 'button', key: item.name, disabled: busy, onClick: () => selectSkill(item.name), 'aria-pressed': savedName === item.name }, item.name))), connected && !items.length && h('div', { className: 'ss-empty' }, 'Todavía no hay skills gestionadas.'), connected && items.length > 0 && !items.some(item => item.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())) && h('div', { className: 'ss-empty' }, 'No hay coincidencias.')),
          h('main', { className: 'ss-panel' }, h('div', { className: 'ss-kicker' }, dirty ? 'BORRADOR · SIN GUARDAR' : 'BORRADOR'), h('h3', { className: 'ss-title' }, draft.name || 'Nueva skill'),
            notice && h('div', { className: 'ss-note ss-error', role: 'alert' }, notice), success && h('div', { className: 'ss-note', role: 'status' }, success),
            h('fieldset', { disabled: busy, style: { border: 0, padding: 0, margin: 0, minWidth: 0 } },
            h('p', { className: 'ss-small' }, 'Nombre: kebab-case, hasta 64 caracteres. Descripción obligatoria de una línea, hasta 1024 caracteres. Instrucciones obligatorias, hasta 100 000 caracteres. Máximo 100 archivos de 1 MiB cada uno; rutas relativas de hasta 240 caracteres, sin segmentos ocultos ni «..». El Host valida todos los datos al guardar.'),
            h('label', { htmlFor: 'ss-name' }, 'Nombre'), h('input', { id: 'ss-name', value: draft.name, readOnly: !!savedName, onChange: e => change('name', e.target.value), placeholder: 'mi-skill' }), savedName && h('p', { className: 'ss-small' }, 'El nombre de una skill guardada no se puede cambiar.'),
            h('label', { htmlFor: 'ss-description' }, 'Descripción'), h('textarea', { id: 'ss-description', value: draft.description, onChange: e => change('description', e.target.value), placeholder: 'Qué hace y cuándo usarla' }),
            h('label', { htmlFor: 'ss-instructions' }, 'Instrucciones'), h('textarea', { id: 'ss-instructions', className: 'code', value: draft.instructions, onChange: e => change('instructions', e.target.value), placeholder: 'Escribe las instrucciones en Markdown…' }),
            h('hr', { className: 'ss-sep' }), h('h3', { className: 'ss-title' }, 'Archivos auxiliares'), h('p', { className: 'ss-small' }, 'Se copian al guardar y nunca se ejecutan. Los binarios no se editan como texto. Máximo 100 archivos, 1 MiB por archivo y 4 MiB en total.'),
            h('input', { ref: fileInput, type: 'file', multiple: true, style: { display: 'none' }, onChange: addFiles, 'aria-label': 'Seleccionar archivos auxiliares' }), h('button', { type: 'button', onClick: () => fileInput.current && fileInput.current.click() }, 'Añadir archivos'),
            h('div', { className: 'ss-list' }, draft.files.map((file, i) => h('button', { type: 'button', key: i, onClick: () => setSelected(i), 'aria-pressed': i === selected }, file.path || '(ruta vacía)'))),
            selected >= 0 && draft.files[selected] && h(React.Fragment, null, h('label', { htmlFor: 'ss-file-path' }, 'Ruta relativa'), h('input', { id: 'ss-file-path', value: draft.files[selected].path, onChange: e => updatePath(e.target.value) }), !validPath(draft.files[selected].path) && h('p', { className: 'ss-small', role: 'alert' }, 'Ruta inválida. Usa una ruta relativa sin segmentos ocultos ni «..».'), typeof draft.files[selected].content === 'string' ? h(React.Fragment, null, h('label', { htmlFor: 'ss-file-content' }, 'Contenido: ' + draft.files[selected].path), h('textarea', { id: 'ss-file-content', className: 'code', value: draft.files[selected].content, onChange: e => updateFile(e.target.value), spellCheck: false })) : h('p', { className: 'ss-small' }, 'Archivo binario · ' + fileSize(draft.files[selected].content) + ' bytes · no editable como texto.'), h('div', { className: 'ss-actions' }, h('button', { type: 'button', onClick: removeFile }, 'Quitar archivo'))),
            h('div', { className: 'ss-actions' }, h('button', { type: 'button', className: 'primary', disabled: !connected || busy, onClick: save }, busy ? 'Procesando…' : 'Guardar skill'), h('button', { type: 'button', disabled: !connected || busy, onClick: evaluate }, 'Evaluar borrador'), savedName && h('button', { type: 'button', disabled: !connected || busy || !draft.revision, onClick: deleteSkill }, 'Eliminar skill')),
            evaluation && h('div', { className: 'ss-note', 'aria-live': 'polite' }, h('div', { className: 'ss-score' }, evaluation.score + ' / 100'), h('ul', null, evaluation.criteria.map(c => h('li', { key: c.id }, (c.passed ? '✓ ' : '○ ') + c.label + ' · ' + c.points + '/' + c.maxPoints, c.recommendation && h('div', { className: 'ss-small' }, c.recommendation)))), h('p', null, evaluation.disclaimer)),
            h('p', { className: 'ss-small' }, 'La puntuación es orientativa y no valida los requisitos de guardado ni certifica seguridad o funcionamiento.'),
            h('hr', { className: 'ss-sep' }), h('h3', { className: 'ss-title' }, 'Generar con IA'), h('p', null, 'Usa el modelo predeterminado configurado en DSH. La petición puede tener coste según el proveedor. La propuesta no se guarda automáticamente y no sustituye el borrador hasta que lo confirmes.'),
            h('label', { htmlFor: 'ss-prompt' }, 'Petición (máximo 20 000 caracteres)'), h('textarea', { id: 'ss-prompt', maxLength: 20000, value: prompt, onChange: e => setPrompt(e.target.value), placeholder: 'Una skill que…' }), h('div', { className: 'ss-actions' }, h('button', { type: 'button', disabled: !connected || busy || !prompt.trim(), onClick: generate }, busy ? 'Procesando…' : 'Generar borrador')),
            proposal && h('section', { className: 'ss-note' }, h('h3', null, 'Propuesta: ' + proposal.name), h('p', null, proposal.description), h('pre', { style: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: '200px', overflow: 'auto' } }, proposal.instructions), h('p', null, 'Archivos: ' + (proposal.files.map(f => f.path).join(', ') || 'ninguno')), h('div', { className: 'ss-actions' }, h('button', { type: 'button', onClick: applyProposal }, 'Aplicar propuesta'), h('button', { type: 'button', onClick: () => setProposal(null) }, 'Descartar propuesta')))))));
    }
    return { inject: ['slots', 'locale'], apply(ctx) {
      const dispose = ctx.locale.register(NS, strings);
      ctx.effect(() => dispose, 'skill-studio locale');
      const t = ctx.locale.bind(NS);
      ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: 'skill-studio', order: 31, label: () => t('nav'), locale: NS }, () => h(Page, { t })));
      ctx.slots.inject('settings.section.icon', () => ctx.slots.register({ name: 'settings.section.icon', id: 'skill-studio' }, Icon));
    } };
  },
});
