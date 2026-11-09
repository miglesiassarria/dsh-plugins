window.__ModuleLoader__.load({
  id: '@local/workspace-context',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = '@local/workspace-context';
    const ENDPOINT = '/dsh-workspace-context';
    const HEADER = 'x-dsh-workspace-context';
    const MAX_FILE_BYTES = 128 * 1024;

    const STRINGS = {
      en: {
        menu: { configure: 'Configure workspace' },
        dialog: {
          title: 'Configure workspace',
          subtitle: 'Give this workspace context that every session carries.',
          name: 'Workspace',
          description: 'Description',
          descriptionHint: 'A short explanation of what this workspace is for.',
          descriptionPlaceholder: 'What lives in this workspace and how it should be used…',
          systemPrompt: 'System prompt',
          systemPromptHint: 'Permanent instructions added to every session in this workspace.',
          systemPromptPlaceholder: 'Work conventions, constraints, or a role for this workspace…',
          context: 'Files and folders as context',
          contextHint: 'Text files are inlined; folders are read up to a bounded budget. Hidden and credential-shaped files are skipped.',
          addFolder: 'Add folder',
          addFiles: 'Add files',
          empty: 'No context files or folders yet.',
          remove: 'Remove',
          cancel: 'Cancel',
          save: 'Save',
          saving: 'Saving…',
          loading: 'Loading…',
          folderTag: 'Folder',
          fileTag: 'File',
          chars: '{count} / {max}',
          saved: 'Workspace saved.',
          truncated: 'Context is capped; very large folders keep their first readable files.',
        },
        session: {
          contextLabel: 'Session context',
          addFolderLabel: 'Folder',
          addFolderDescription: 'Add a folder as context for this session',
          added: 'Folder “{name}” added to this session.',
          remove: 'Remove folder',
          removeFailed: 'Could not remove the folder.',
        },
        error: {
          requestFailed: 'The request failed.',
          unauthorized: 'The request was not authorized.',
          'workspace-unknown': 'This workspace no longer exists.',
          'folder-missing': 'The folder does not exist: {detail}',
          'folder-not-directory': 'That path is not a folder: {detail}',
          'invalid-patch': 'The workspace configuration is invalid.',
          'invalid-entry': 'One of the context entries is invalid.',
          'file-too-large': '“{detail}” is larger than the 128 KB text limit.',
          'workspace-too-large': 'The workspace context is too large. Remove some files.',
          'too-many-session-entries': 'This session already has too many context folders.',
          'body-too-large': 'The request is too large.',
          'invalid-json': 'The request body is not valid JSON.',
          'invalid-session': 'The session is invalid.',
          'not-found': 'The route does not exist.',
          'file-not-text': '“{name}” is not a UTF-8 text file.',
          'pick-folder': 'Could not choose a folder.',
        },
      },
      es: {
        menu: { configure: 'Configurar espacio' },
        dialog: {
          title: 'Configurar espacio',
          subtitle: 'Da a este espacio un contexto que acompaña a todas sus sesiones.',
          name: 'Espacio de trabajo',
          description: 'Descripción',
          descriptionHint: 'Una explicación breve de para qué sirve este espacio.',
          descriptionPlaceholder: 'Qué hay en este espacio y cómo debe usarse…',
          systemPrompt: 'Prompt del sistema',
          systemPromptHint: 'Instrucciones permanentes que se añaden a todas las sesiones de este espacio.',
          systemPromptPlaceholder: 'Convenciones, restricciones o un rol para este espacio…',
          context: 'Archivos y carpetas de contexto',
          contextHint: 'Los archivos de texto se incluyen completos; las carpetas se leen con un límite. Se omiten los archivos ocultos y los que parecen credenciales.',
          addFolder: 'Añadir carpeta',
          addFiles: 'Añadir archivos',
          empty: 'Todavía no hay archivos ni carpetas de contexto.',
          remove: 'Quitar',
          cancel: 'Cancelar',
          save: 'Guardar',
          saving: 'Guardando…',
          loading: 'Cargando…',
          folderTag: 'Carpeta',
          fileTag: 'Archivo',
          chars: '{count} / {max}',
          saved: 'Espacio guardado.',
          truncated: 'El contexto tiene un límite; las carpetas muy grandes conservan los primeros archivos legibles.',
        },
        session: {
          contextLabel: 'Contexto de sesión',
          addFolderLabel: 'Carpeta',
          addFolderDescription: 'Añade una carpeta como contexto de esta sesión',
          added: 'Carpeta «{name}» añadida a esta sesión.',
          remove: 'Quitar carpeta',
          removeFailed: 'No se pudo quitar la carpeta.',
        },
        error: {
          requestFailed: 'La petición ha fallado.',
          unauthorized: 'La petición no está autorizada.',
          'workspace-unknown': 'Este espacio de trabajo ya no existe.',
          'folder-missing': 'La carpeta no existe: {detail}',
          'folder-not-directory': 'Esa ruta no es una carpeta: {detail}',
          'invalid-patch': 'La configuración del espacio no es válida.',
          'invalid-entry': 'Una de las entradas de contexto no es válida.',
          'file-too-large': '«{detail}» supera el límite de 128 KB de texto.',
          'workspace-too-large': 'El contexto del espacio es demasiado grande. Quita algunos archivos.',
          'too-many-session-entries': 'Esta sesión ya tiene demasiadas carpetas de contexto.',
          'body-too-large': 'La petición es demasiado grande.',
          'invalid-json': 'El cuerpo de la petición no es JSON válido.',
          'invalid-session': 'La sesión no es válida.',
          'not-found': 'La ruta no existe.',
          'file-not-text': '«{name}» no es un archivo de texto UTF-8.',
          'pick-folder': 'No se pudo elegir una carpeta.',
        },
      },
    };

    /** Flatten nested dictionaries into the dotted keys the locale service reads. */
    function flattenDict(source, prefix = '') {
      const out = {};
      for (const [key, value] of Object.entries(source)) {
        const name = prefix === '' ? key : `${prefix}.${key}`;
        if (typeof value === 'string') out[name] = value;
        else if (value !== null && typeof value === 'object') Object.assign(out, flattenDict(value, name));
      }
      return out;
    }

    const DICTS = { en: flattenDict(STRINGS.en), es: flattenDict(STRINGS.es) };

    const CSS = `
.wsc-overlay{position:fixed;inset:0;z-index:1000;pointer-events:auto;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(8,10,14,.52);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);}
.wsc-dialog{width:min(680px,100%);max-height:calc(100vh - 48px);overflow:auto;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l1);border-radius:16px;box-shadow:0 24px 80px rgba(0,0,0,.38);font:inherit;}
.wsc-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:20px 22px 0;}
.wsc-title{margin:0;font-size:17px;font-weight:600;letter-spacing:-.01em;}
.wsc-subtitle{margin:6px 0 0;font-size:12.5px;line-height:1.45;color:var(--dsw-alias-label-secondary);}
.wsc-close{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:18px;line-height:1;}
.wsc-close:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);}
.wsc-body{display:flex;flex-direction:column;gap:16px;padding:18px 22px 4px;}
.wsc-field{display:flex;flex-direction:column;gap:6px;}
.wsc-labelrow{display:flex;align-items:baseline;justify-content:space-between;gap:12px;}
.wsc-label{font-size:12.5px;font-weight:600;}
.wsc-count{font-size:11px;color:var(--dsw-alias-label-secondary);}
.wsc-hint{margin:0;font-size:11.5px;line-height:1.45;color:var(--dsw-alias-label-secondary);}
.wsc-input,.wsc-textarea{width:100%;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:1.5;padding:9px 11px;resize:vertical;}
.wsc-input:focus,.wsc-textarea:focus{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;border-color:transparent;}
.wsc-readonly{display:flex;align-items:center;gap:8px;min-height:38px;box-sizing:border-box;padding:8px 11px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-2);font-size:13px;}
.wsc-readonly span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.wsc-path{color:var(--dsw-alias-label-secondary);font-size:11.5px;}
.wsc-actions{display:flex;flex-wrap:wrap;gap:8px;}
.wsc-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:32px;padding:0 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;font-weight:500;cursor:pointer;}
.wsc-btn:hover{background:var(--dsw-alias-bg-layer-2);}
.wsc-btn:disabled{opacity:.55;cursor:default;}
.wsc-btn-primary{border-color:transparent;background:var(--dsw-alias-brand-primary);color:#fff;}
.wsc-btn-primary:hover{background:var(--dsw-alias-brand-primary);filter:brightness(1.06);}
.wsc-btn-danger{color:var(--dsw-alias-state-error-primary);}
.wsc-btn-ghost{border-color:transparent;}
.wsc-entries{display:flex;flex-direction:column;gap:6px;}
.wsc-entry{display:flex;align-items:center;gap:9px;min-height:38px;box-sizing:border-box;padding:5px 6px 5px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-2);}
.wsc-entry-icon{flex:0 0 auto;display:inline-flex;color:var(--dsw-alias-label-secondary);}
.wsc-entry-text{min-width:0;flex:1 1 auto;display:flex;flex-direction:column;gap:1px;}
.wsc-entry-name{font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.wsc-entry-meta{font-size:10.5px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.wsc-entry-remove{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;padding:0;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:15px;line-height:1;}
.wsc-entry-remove:hover{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-state-error-primary);}
.wsc-empty{padding:12px;border:1px dashed var(--dsw-alias-border-l1);border-radius:9px;color:var(--dsw-alias-label-secondary);font-size:12px;text-align:center;}
.wsc-error{margin:0;padding:9px 11px;border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent);color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:1.4;}
.wsc-foot{display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:16px 22px 20px;border-top:1px solid var(--dsw-alias-border-l1);margin-top:16px;}
.wsc-dock{display:flex;align-items:center;flex-wrap:wrap;gap:6px;padding:0 2px 6px;}
.wsc-dock-label{font-size:10.5px;letter-spacing:.02em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);}
.wsc-chip{display:inline-flex;align-items:center;gap:5px;max-width:280px;box-sizing:border-box;padding:2px 3px 2px 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:11.5px;}
.wsc-chip-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.wsc-chip-remove{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;padding:0;border:0;border-radius:999px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:13px;line-height:1;}
.wsc-chip-remove:hover{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-state-error-primary);}
.wsc-spin{font-size:12px;color:var(--dsw-alias-label-secondary);}
@media (max-width:640px){.wsc-overlay{padding:10px;}.wsc-dialog{max-height:calc(100vh - 20px);}.wsc-head,.wsc-body,.wsc-foot{padding-left:16px;padding-right:16px;}}
`;

    /** Small external store: enough for one dialog request and session bumps. */
    function createStore(initial) {
      let value = initial;
      const listeners = new Set();
      return {
        get: () => value,
        set(next) {
          value = next;
          for (const listener of [...listeners]) listener();
        },
        subscribe(listener) {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
      };
    }

    /** Subscribe one component to an external store. */
    function useStore(store) {
      const [value, setValue] = React.useState(store.get());
      React.useEffect(() => store.subscribe(() => setValue(store.get())), [store]);
      return value;
    }

    /** Read a localized host error, falling back to its message. */
    function describeError(error, t) {
      const code = error && typeof error === 'object' ? error.code : undefined;
      if (typeof code === 'string' && code.length > 0) {
        const key = `error.${code}`;
        const text = t(key, { detail: error.detail ?? '', name: error.detail ?? '' });
        if (text !== key) return text;
      }
      return error instanceof Error && error.message ? error.message : t('error.requestFailed');
    }

    /** Format a byte count. */
    function formatBytes(bytes) {
      if (!Number.isFinite(bytes) || bytes < 1024) return `${Math.max(0, Math.round(bytes || 0))} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    /** Return the final path segment for a folder. */
    function baseName(path) {
      const parts = String(path).replace(/[\\/]+$/u, '').split(/[\\/]/u);
      return parts[parts.length - 1] || String(path);
    }

    /** Read one File as UTF-8 text, refusing binary and oversized files. */
    async function readTextFile(file, t) {
      if (file.size > MAX_FILE_BYTES) {
        const error = new Error('file-too-large');
        error.code = 'file-too-large';
        error.detail = file.name;
        throw error;
      }
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      for (const byte of bytes) {
        if (byte === 0) {
          const error = new Error('file-not-text');
          error.code = 'file-not-text';
          error.detail = file.name;
          throw error;
        }
      }
      try {
        return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      } catch {
        const error = new Error('file-not-text');
        error.code = 'file-not-text';
        error.detail = file.name;
        throw error;
      }
    }

    /** Folder glyph used by rows and chips. */
    function FolderGlyph(props) {
      const size = props && props.size ? props.size : 15;
      return h('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true',
      },
      h('path', {
        d: 'M2 4.75A1.75 1.75 0 0 1 3.75 3h2.4c.5 0 .98.21 1.32.59l.7.78c.15.16.36.26.58.26h3.5A1.75 1.75 0 0 1 14 6.38v4.87A1.75 1.75 0 0 1 12.25 13H3.75A1.75 1.75 0 0 1 2 11.25z',
        stroke: 'currentColor', strokeWidth: 1.35, strokeLinejoin: 'round',
      }));
    }

    /** Document glyph used by file rows. */
    function FileGlyph(props) {
      const size = props && props.size ? props.size : 15;
      return h('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true',
      },
      h('path', {
        d: 'M4 2.75A1.75 1.75 0 0 1 5.75 1h3.1L13 5.15v8.1A1.75 1.75 0 0 1 11.25 15h-5.5A1.75 1.75 0 0 1 4 13.25z',
        stroke: 'currentColor', strokeWidth: 1.35, strokeLinejoin: 'round',
      }),
      h('path', { d: 'M8.75 1v3.3c0 .5.4.9.9.9h3.2', stroke: 'currentColor', strokeWidth: 1.35, strokeLinejoin: 'round' }));
    }

    /** Gear glyph for the Workspace menu. */
    function SettingsGlyph(props) {
      const size = props && props.size ? props.size : 16;
      return h('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true',
      },
      h('circle', { cx: 8, cy: 8, r: 2.15, stroke: 'currentColor', strokeWidth: 1.35 }),
      h('path', {
        d: 'M8 1.6v1.8M8 12.6v1.8M1.6 8h1.8M12.6 8h1.8M3.47 3.47l1.27 1.27M11.26 11.26l1.27 1.27M12.53 3.47l-1.27 1.27M4.74 11.26l-1.27 1.27',
        stroke: 'currentColor', strokeWidth: 1.35, strokeLinecap: 'round',
      }));
    }

    /** Modal that edits one Workspace's context configuration. */
    function createWorkspaceDialog(options) {
      const { api, t, notify, closeDialog, uiWorkspace } = options;

      return function WorkspaceDialog({ request }) {
        const [phase, setPhase] = React.useState('loading');
        const [error, setError] = React.useState(null);
        const [title, setTitle] = React.useState(request.title || '');
        const [path, setPath] = React.useState(request.path || '');
        const [description, setDescription] = React.useState('');
        const [systemPrompt, setSystemPrompt] = React.useState('');
        const [entries, setEntries] = React.useState([]);
        const fileInput = React.useRef(null);

        React.useEffect(() => {
          let cancelled = false;
          setPhase('loading');
          setError(null);
          api.get(`/state?workspaceId=${encodeURIComponent(request.workspaceId)}`)
            .then((data) => {
              if (cancelled) return;
              setTitle(data.workspace.title || request.title || '');
              setPath(data.workspace.path || request.path || '');
              setDescription(data.config.description || '');
              setSystemPrompt(data.config.systemPrompt || '');
              setEntries(Array.isArray(data.config.entries) ? data.config.entries : []);
              setPhase('ready');
            })
            .catch((reason) => {
              if (cancelled) return;
              setError(describeError(reason, t));
              setPhase('ready');
            });
          return () => {
            cancelled = true;
          };
        }, [request.workspaceId]);

        const pickFolder = async () => {
          try {
            const picked = await uiWorkspace.pickDirectory();
            if (picked === null || picked === undefined) return;
            setEntries((current) => current.some((entry) => entry.kind === 'folder' && entry.path === picked)
              ? current
              : [...current, { kind: 'folder', path: picked, name: baseName(picked) }]);
            setError(null);
          } catch (reason) {
            setError(describeError(reason, t).replace(/\{detail\}/gu, ''));
          }
        };

        const pickFiles = async (event) => {
          const picked = event.target.files === null ? [] : [...event.target.files];
          event.target.value = '';
          if (picked.length === 0) return;
          const next = [];
          for (const file of picked) {
            try {
              const text = await readTextFile(file, t);
              next.push({ kind: 'file', name: file.name, text, bytes: file.size });
            } catch (reason) {
              setError(describeError(reason, t));
            }
          }
          if (next.length > 0) {
            setEntries((current) => {
              const merged = [...current];
              for (const entry of next) {
                const index = merged.findIndex((candidate) => candidate.kind === 'file' && candidate.name === entry.name);
                if (index === -1) merged.push(entry);
                else merged[index] = entry;
              }
              return merged;
            });
          }
        };

        const removeEntry = (entry, index) => {
          setEntries((current) => current.filter((candidate, candidateIndex) => candidateIndex !== index));
        };

        const save = async (event) => {
          if (event && event.preventDefault) event.preventDefault();
          if (phase === 'saving') return;
          setPhase('saving');
          setError(null);
          try {
            const data = await api.post('/workspace', {
              workspaceId: request.workspaceId,
              description,
              systemPrompt,
              entries: entries.map((entry) => entry.kind === 'folder'
                ? { id: entry.id, kind: 'folder', path: entry.path, name: entry.name }
                : { id: entry.id, kind: 'file', name: entry.name, text: entry.text, bytes: entry.bytes }),
            });
            closeDialog();
            notify(t('dialog.saved'), true);
            return data;
          } catch (reason) {
            setError(describeError(reason, t));
            setPhase('ready');
          }
        };

        if (phase === 'loading' && entries.length === 0 && description === '' && systemPrompt === '') {
          return h('div', { className: 'wsc-overlay', role: 'presentation' },
            h('div', { className: 'wsc-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('dialog.title') },
              h('style', null, CSS),
              h('div', { className: 'wsc-head' },
                h('div', null,
                  h('h2', { className: 'wsc-title' }, t('dialog.title')),
                  h('p', { className: 'wsc-subtitle' }, t('dialog.loading'))))));
        }

        return h('div', { className: 'wsc-overlay', role: 'presentation', onMouseDown: (event) => { if (event.target === event.currentTarget) closeDialog(); } },
          h('form', {
            className: 'wsc-dialog',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': t('dialog.title'),
            onSubmit: save,
          },
          h('style', null, CSS),
          h('div', { className: 'wsc-head' },
            h('div', null,
              h('h2', { className: 'wsc-title' }, t('dialog.title')),
              h('p', { className: 'wsc-subtitle' }, t('dialog.subtitle'))),
            h('button', { type: 'button', className: 'wsc-close', 'aria-label': t('dialog.cancel'), onClick: closeDialog }, '×')),
          h('div', { className: 'wsc-body' },
            h('div', { className: 'wsc-field' },
              h('span', { className: 'wsc-label' }, t('dialog.name')),
              h('div', { className: 'wsc-readonly' },
                h(FolderGlyph, { size: 15 }),
                h('span', null, title)),
              path === '' ? null : h('span', { className: 'wsc-path' }, path)),
            h('label', { className: 'wsc-field' },
              h('span', { className: 'wsc-labelrow' },
                h('span', { className: 'wsc-label' }, t('dialog.description')),
                h('span', { className: 'wsc-count' }, t('dialog.chars', { count: description.length, max: 8000 }))),
              h('textarea', {
                className: 'wsc-textarea',
                rows: 3,
                maxLength: 8000,
                value: description,
                placeholder: t('dialog.descriptionPlaceholder'),
                onChange: (event) => setDescription(event.target.value),
              }),
              h('span', { className: 'wsc-hint' }, t('dialog.descriptionHint'))),
            h('label', { className: 'wsc-field' },
              h('span', { className: 'wsc-labelrow' },
                h('span', { className: 'wsc-label' }, t('dialog.systemPrompt')),
                h('span', { className: 'wsc-count' }, t('dialog.chars', { count: systemPrompt.length, max: 40000 }))),
              h('textarea', {
                className: 'wsc-textarea',
                rows: 6,
                maxLength: 40000,
                value: systemPrompt,
                placeholder: t('dialog.systemPromptPlaceholder'),
                onChange: (event) => setSystemPrompt(event.target.value),
              }),
              h('span', { className: 'wsc-hint' }, t('dialog.systemPromptHint'))),
            h('div', { className: 'wsc-field' },
              h('span', { className: 'wsc-label' }, t('dialog.context')),
              h('div', { className: 'wsc-actions' },
                h('button', { type: 'button', className: 'wsc-btn', onClick: pickFolder },
                  h(FolderGlyph, { size: 14 }), t('dialog.addFolder')),
                h('button', { type: 'button', className: 'wsc-btn', onClick: () => fileInput.current && fileInput.current.click() },
                  h(FileGlyph, { size: 14 }), t('dialog.addFiles')),
                h('input', {
                  ref: fileInput,
                  type: 'file',
                  multiple: true,
                  hidden: true,
                  onChange: pickFiles,
                })),
              h('span', { className: 'wsc-hint' }, t('dialog.contextHint')),
              entries.length === 0
                ? h('div', { className: 'wsc-empty' }, t('dialog.empty'))
                : h('div', { className: 'wsc-entries' }, entries.map((entry, index) => h('div', { className: 'wsc-entry', key: entry.id || `${entry.kind}:${entry.path || entry.name}:${index}` },
                  h('span', { className: 'wsc-entry-icon' }, entry.kind === 'folder' ? h(FolderGlyph) : h(FileGlyph)),
                  h('span', { className: 'wsc-entry-text' },
                    h('span', { className: 'wsc-entry-name' }, entry.kind === 'folder' ? (entry.name || baseName(entry.path)) : entry.name),
                    h('span', { className: 'wsc-entry-meta' }, entry.kind === 'folder' ? entry.path : `${t('dialog.fileTag')} · ${formatBytes(entry.bytes || 0)}`)),
                  h('button', {
                    type: 'button',
                    className: 'wsc-entry-remove',
                    title: t('dialog.remove'),
                    'aria-label': t('dialog.remove'),
                    onClick: () => removeEntry(entry, index),
                  }, '×')))))
            ,
            error === null ? null : h('p', { className: 'wsc-error', role: 'alert' }, error)),
          h('div', { className: 'wsc-foot' },
            h('button', { type: 'button', className: 'wsc-btn wsc-btn-ghost', onClick: closeDialog, disabled: phase === 'saving' }, t('dialog.cancel')),
            h('button', { type: 'submit', className: 'wsc-btn wsc-btn-primary', disabled: phase === 'saving' }, phase === 'saving' ? t('dialog.saving') : t('dialog.save')))));
      };
    }

    /** Root overlay that renders the dialog when a Workspace request is open. */
    function createWorkspaceOverlay(options) {
      const WorkspaceDialog = createWorkspaceDialog(options);
      const dialogStore = options.dialogStore;
      return function WorkspaceOverlay() {
        const request = useStore(dialogStore);
        if (request === null) return null;
        return h('div', null, h(WorkspaceDialog, { key: request.workspaceId, request }));
      };
    }

    /** Rail of folders attached to one Session, rendered above the composer. */
    function createSessionDock(options) {
      const { api, t, sessionBumps } = options;
      return function SessionContextDock({ sessionId }) {
        const [entries, setEntries] = React.useState([]);
        const [ready, setReady] = React.useState(false);

        React.useEffect(() => {
          let cancelled = false;
          let current = true;
          const load = async () => {
            if (!current) return;
            try {
              const data = await api.get(`/session?sessionId=${encodeURIComponent(sessionId)}`);
              if (cancelled) return;
              setEntries(Array.isArray(data.entries) ? data.entries : []);
            } catch {
              if (cancelled) return;
              setEntries([]);
            } finally {
              if (!cancelled) setReady(true);
            }
          };
          void load();
          return sessionBumps.subscribe(sessionId, () => {
            current = true;
            void load();
          });
        }, [sessionId]);

        if (!ready || entries.length === 0) return null;

        const remove = async (entryId) => {
          try {
            await api.post('/session/entries/remove', { sessionId, entryId });
            sessionBumps.bump(sessionId);
          } catch (reason) {
            api.notify(describeError(reason, t), false);
          }
        };

        return h('div', { className: 'wsc-dock' },
          h('style', null, CSS),
          h('span', { className: 'wsc-dock-label' }, t('session.contextLabel')),
          ...entries.map((entry) => h('span', { className: 'wsc-chip', key: entry.id, title: entry.path },
            h(FolderGlyph, { size: 13 }),
            h('span', { className: 'wsc-chip-name' }, entry.name),
            h('button', {
              type: 'button',
              className: 'wsc-chip-remove',
              title: t('session.remove'),
              'aria-label': t('session.remove'),
              onClick: () => void remove(entry.id),
            }, '×'))));
      };
    }

    return {
      inject: ['slots', 'locale', 'contextMenus', 'commandUi', 'uiWorkspace'],
      apply(ctx) {
        const disposeLocale = ctx.locale.register(NS, DICTS);
        ctx.effect(() => disposeLocale, 'workspace-context locale');

        const t = ctx.locale.bind(NS);
        const dialogStore = createStore(null);
        const openDialog = (request) => dialogStore.set(request);
        const closeDialog = () => dialogStore.set(null);

        /** Same-origin JSON transport for the Host half. */
        const api = {
          async call(path, options) {
            const response = await fetch(ENDPOINT + path, {
              method: options?.method ?? 'GET',
              cache: 'no-store',
              headers: {
                [HEADER]: '1',
                ...(options?.body === undefined ? {} : { 'content-type': 'application/json' }),
              },
              body: options?.body === undefined ? undefined : JSON.stringify(options.body),
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok || payload?.ok !== true) {
              const error = new Error(payload?.error ?? 'request-failed');
              error.code = typeof payload?.error === 'string' ? payload.error : 'requestFailed';
              error.detail = typeof payload?.detail === 'string' ? payload.detail : undefined;
              throw error;
            }
            return payload.data;
          },
          get(path) {
            return this.call(path);
          },
          post(path, body) {
            return this.call(path, { method: 'POST', body });
          },
          notify(text, success) {
            try {
              ctx.contextMenus.notify(text, success);
            } catch {
              // A missing toast surface must not break the action.
            }
          },
        };

        const sessionBumps = (() => {
          const listeners = new Map();
          return {
            subscribe(sessionId, listener) {
              const set = listeners.get(sessionId) ?? new Set();
              set.add(listener);
              listeners.set(sessionId, set);
              return () => {
                set.delete(listener);
                if (set.size === 0) listeners.delete(sessionId);
              };
            },
            bump(sessionId) {
              for (const listener of [...(listeners.get(sessionId) ?? [])]) listener();
            },
          };
        })();

        // Menu action shared by right-click and the "..." button on a Workspace.
        ctx.effect(() => ctx.contextMenus.register({
          id: 'workspace-context.configure',
          target: 'workspace',
          order: 150,
          resolve: ({ workspaceId, path, displayTitle }) => [{
            id: 'configure',
            label: t('menu.configure'),
            icon: { key: 'workspace-context.settings' },
            run: () => openDialog({
              workspaceId,
              path,
              title: displayTitle,
            }),
          }],
        }), 'workspace-context: workspace menu');

        // Icon dispatched by the captured action's icon key.
        ctx.slots.inject('contextMenu.icon', () => ctx.slots.register({
          name: 'contextMenu.icon',
          key: 'workspace-context.settings',
        }, SettingsGlyph));

        // The Workspace dialog lives in the frame-wide overlay layer.
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'workspace-context-dialog',
          order: 100,
        }, createWorkspaceOverlay({ api, t, notify: (text, ok) => api.notify(text, ok), closeDialog, uiWorkspace: ctx.uiWorkspace, dialogStore })));

        // "+" menu: Folder joins the Add/Commands menu as a session context row.
        ctx.commandUi.register({
          name: 'folder',
          label: () => t('session.addFolderLabel'),
          description: () => t('session.addFolderDescription'),
          icon: FolderGlyph,
          available: (session) => session !== undefined && session !== null && typeof session.sessionId === 'string',
          ui: {
            kind: 'action',
            run: async (session) => {
              const sessionId = session?.sessionId;
              if (typeof sessionId !== 'string') return;
              try {
                const picked = await ctx.uiWorkspace.pickDirectory();
                if (picked === null || picked === undefined) return;
                await api.post('/session/entries', { sessionId, path: picked });
                sessionBumps.bump(sessionId);
                api.notify(t('session.added', { name: baseName(picked) }), true);
              } catch (reason) {
                api.notify(describeError(reason, t), false);
              }
            },
          },
        });

        // Visible chips for the folders attached to the current Session.
        ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
          name: 'conversation.input.dock',
          id: 'workspace-context-session',
          order: 30,
          locale: NS,
        }, createSessionDock({ api, t, sessionBumps })));
      },
    };
  },
});
