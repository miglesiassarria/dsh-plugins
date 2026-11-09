window.__ModuleLoader__.load({
  id: '@local/dsh-backups',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = '@local/dsh-backups';
    const ENDPOINT = '/dsh-backups';

    const STRINGS = {
      en: {
        nav: 'Backups',
        title: 'Backups',
        subtitle: 'Save your settings, plugins and chats to a file you can take to another computer.',
        createTitle: 'Create a backup',
        createText: 'Choose what to include. The file is written to your computer, so you can copy it anywhere.',
        partSessions: 'Chats and sessions',
        partConfiguration: 'Settings and plugins',
        destination: 'Saved in',
        copyPath: 'Copy path',
        openFolder: 'Open folder',
        opening: 'Opening…',
        errorOpenFolder: 'The folder could not be opened.',
        copied: 'Path copied',
        copyFailed: 'Could not copy the path',
        create: 'Create backup',
        creating: 'Creating backup…',
        createdTitle: 'Backup created',
        createdDetail: '{name} · {size}',
        restoreTitle: 'Restore a backup',
        restoreText: 'Pick a backup file (.zip). You can restore only the chats, only the settings, or both.',
        chooseFile: 'Choose file',
        dropHint: 'or drop the backup file here',
        selectedFile: 'Selected file',
        includes: 'This backup contains',
        restore: 'Restore backup',
        restoring: 'Restoring…',
        restoreNote: 'Restoring replaces your current settings. Overwritten files are kept with a .bak suffix.',
        savedTitle: 'Backups on this computer',
        savedText: 'Files in {dir}',
        restoreAction: 'Restore',
        emptySaved: 'No backups saved yet.',
        restoreDone: 'Restore finished',
        sessionsRestored: '{count} sessions restored',
        sessionsGrouped: '{count} grouped in their workspaces',
        sessionsUngrouped: '{count} could not be grouped because their folder does not exist here',
        sessionsUnchanged: '{count} already existed and were kept',
        sessionsConflict: '{count} already existed with other content and were kept',
        configurationRestored: '{count} configuration files restored',
        pluginsRestored: '{count} plugins restored',
        restart: 'Restart DeepSeek Harness to load the restored settings and plugins.',
        backupDate: 'Backup from {date}',
        sessionCount: '{count} sessions in {workspaces}',
        pluginCount: '{count} plugins',
        errorGeneric: 'The operation could not be completed.',
        errorBusy: 'Another backup operation is already running.',
        errorInvalid: 'The file is not a valid DeepSeek Harness backup.',
        errorVersion: 'This backup was made by a newer version of DeepSeek Harness.',
        errorMissingPart: 'The backup does not include the selected part.',
        errorMissingFile: 'That backup is no longer in the folder.',
        errorTooLarge: 'The file is too large to restore from this page.',
        errorEmpty: 'Select at least one part.',
        loading: 'Loading…',
        loadFailed: 'Could not read the backup status.',
        sessionsOne: 'session',
        sessionsMany: 'sessions',
        workspacesOne: 'workspace',
        workspacesMany: 'workspaces',
        pluginsOne: 'plugin',
        pluginsMany: 'plugins',
        filesOne: 'configuration file',
        filesMany: 'configuration files',
        warningTitle: 'Warnings',
      },
      es: {
        nav: 'Copias de seguridad',
        title: 'Copias de seguridad',
        subtitle: 'Guarda tu configuración, tus plugins y tus chats en un archivo que puedas llevar a otro ordenador.',
        createTitle: 'Crear copia de seguridad',
        createText: 'Elige qué quieres incluir. El archivo se guarda en tu ordenador, así que puedes copiarlo donde quieras.',
        partSessions: 'Chats y sesiones',
        partConfiguration: 'Configuración y plugins',
        destination: 'Se guardan en',
        copyPath: 'Copiar ruta',
        openFolder: 'Abrir carpeta',
        opening: 'Abriendo…',
        errorOpenFolder: 'No se pudo abrir la carpeta.',
        copied: 'Ruta copiada',
        copyFailed: 'No se pudo copiar la ruta',
        create: 'Crear copia de seguridad',
        creating: 'Creando copia…',
        createdTitle: 'Copia creada',
        createdDetail: '{name} · {size}',
        restoreTitle: 'Restaurar copia de seguridad',
        restoreText: 'Elige un archivo de copia (.zip). Puedes restaurar solo los chats, solo la configuración o ambas cosas.',
        chooseFile: 'Elegir archivo',
        dropHint: 'o arrastra aquí el archivo de la copia',
        selectedFile: 'Archivo seleccionado',
        includes: 'Esta copia contiene',
        restore: 'Restaurar copia',
        restoring: 'Restaurando…',
        restoreNote: 'Restaurar reemplaza tu configuración actual. Los archivos que se sobrescriben se conservan con el sufijo .bak.',
        savedTitle: 'Copias en este ordenador',
        savedText: 'Archivos en {dir}',
        restoreAction: 'Restaurar',
        emptySaved: 'Todavía no hay copias guardadas.',
        restoreDone: 'Restauración terminada',
        sessionsRestored: '{count} sesiones restauradas',
        sessionsGrouped: '{count} agrupadas en sus espacios de trabajo',
        sessionsUngrouped: '{count} sin agrupar porque su carpeta no existe en este ordenador',
        sessionsUnchanged: '{count} ya existían y se han conservado',
        sessionsConflict: '{count} ya existían con otro contenido y se han conservado',
        configurationRestored: '{count} archivos de configuración restaurados',
        pluginsRestored: '{count} plugins restaurados',
        restart: 'Reinicia DeepSeek Harness para cargar la configuración y los plugins restaurados.',
        backupDate: 'Copia del {date}',
        sessionCount: '{count} sesiones en {workspaces}',
        pluginCount: '{count} plugins',
        errorGeneric: 'No se pudo completar la operación.',
        errorBusy: 'Ya hay otra operación de copia en curso.',
        errorInvalid: 'El archivo no es una copia de seguridad válida de DeepSeek Harness.',
        errorVersion: 'Esta copia se creó con una versión más reciente de DeepSeek Harness.',
        errorMissingPart: 'La copia no incluye la parte seleccionada.',
        errorMissingFile: 'Esa copia ya no está en la carpeta.',
        errorTooLarge: 'El archivo es demasiado grande para restaurarlo desde esta página.',
        errorEmpty: 'Selecciona al menos una parte.',
        loading: 'Cargando…',
        loadFailed: 'No se pudo leer el estado de las copias.',
        sessionsOne: 'sesión',
        sessionsMany: 'sesiones',
        workspacesOne: 'espacio de trabajo',
        workspacesMany: 'espacios de trabajo',
        pluginsOne: 'plugin',
        pluginsMany: 'plugins',
        filesOne: 'archivo de configuración',
        filesMany: 'archivos de configuración',
        warningTitle: 'Avisos',
      },
    };

    const CSS = `
.bkp-root{display:flex;flex-direction:column;gap:16px;min-width:0;padding-top:4px;font-size:14px;line-height:20px;color:var(--dsw-alias-label-primary)}
.bkp-head{display:flex;align-items:flex-start;gap:12px;min-width:0}
.bkp-headtext{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.bkp-title{margin:0;font-size:15px;font-weight:600;line-height:22px}
.bkp-sub{margin:0;font-size:13px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.bkp-card{border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-layer-1);display:flex;flex-direction:column;min-width:0;overflow:hidden}
.bkp-cardhead{display:flex;align-items:flex-start;gap:12px;padding:16px 18px 0;min-width:0}
.bkp-mark{width:32px;height:32px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:10px;color:var(--dsw-alias-brand-primary);background:color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent)}
.bkp-cardtext{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.bkp-cardtitle{margin:0;font-size:14.5px;font-weight:600;line-height:21px}
.bkp-cardsub{margin:0;font-size:12.5px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.bkp-body{display:flex;flex-direction:column;gap:12px;padding:14px 18px 16px;min-width:0}
.bkp-dest{display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-width:0;padding:9px 11px;border-radius:9px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1)}
.bkp-destlabel{font-size:12px;color:var(--dsw-alias-label-secondary);flex:none}
.bkp-destpath{flex:1;min-width:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11.5px;line-height:16px;color:var(--dsw-alias-label-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;direction:rtl;text-align:left}
.bkp-link{flex:none;height:24px;padding:0 8px;border:none;border-radius:6px;background:transparent;color:var(--dsw-alias-brand-primary);font:inherit;font-size:12px;font-weight:500;cursor:pointer}
.bkp-link:hover{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent)}
.bkp-link:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.bkp-parts{display:flex;flex-direction:column;gap:2px;border:1px solid var(--dsw-alias-border-l1);border-radius:11px;overflow:hidden;background:var(--dsw-alias-bg-base)}
.bkp-part{display:flex;align-items:flex-start;gap:10px;padding:11px 13px;min-width:0}
.bkp-part + .bkp-part{border-top:1px solid var(--dsw-alias-border-l1)}
.bkp-part input{width:16px;height:16px;margin:2px 0 0;accent-color:var(--dsw-alias-brand-primary);cursor:pointer;flex:none}
.bkp-parttext{display:flex;flex-direction:column;gap:1px;min-width:0;cursor:pointer;flex:1}
.bkp-partname{font-size:13.5px;font-weight:500;line-height:19px}
.bkp-partdetail{font-size:12px;line-height:17px;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere}
.bkp-part.is-disabled{opacity:.55}
.bkp-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.bkp-btn{height:34px;padding:0 15px;border-radius:9px;font:inherit;font-size:13px;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px;white-space:nowrap}
.bkp-btn:disabled{opacity:.55;cursor:default}
.bkp-btn-primary{border:1px solid transparent;background:var(--dsw-alias-brand-primary);color:#fff}
.bkp-btn-primary:hover:not(:disabled){filter:brightness(1.05)}
.bkp-btn-ghost{border:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-primary)}
.bkp-btn-ghost:hover:not(:disabled){background:color-mix(in srgb, var(--dsw-alias-label-primary) 7%, transparent)}
.bkp-btn-sm{height:26px;padding:0 10px;font-size:12px;border-radius:8px}
.bkp-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.bkp-subrow{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.bkp-subrow .bkp-link{height:20px;padding:0 4px}
.bkp-spinner{width:13px;height:13px;flex:none;border-radius:50%;border:2px solid rgba(255,255,255,.45);border-top-color:#fff;animation:bkp-spin .8s linear infinite}
@keyframes bkp-spin{to{transform:rotate(360deg)}}
.bkp-note{margin:0;font-size:12px;line-height:17px;color:var(--dsw-alias-label-secondary)}
.bkp-banner{display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border-radius:10px;font-size:12.5px;line-height:18px;overflow-wrap:anywhere}
.bkp-banner.is-ok{background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 10%, transparent);color:var(--dsw-alias-state-success-primary)}
.bkp-banner.is-error{background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent);color:var(--dsw-alias-state-error-primary)}
.bkp-banner.is-warn{background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 10%, transparent);color:var(--dsw-alias-state-warn-primary)}
.bkp-bannerbody{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.bkp-bannerstrong{font-weight:600}
.bkp-banner ul{margin:2px 0 0;padding-left:16px;display:flex;flex-direction:column;gap:1px}
.bkp-drop{display:flex;flex-direction:column;align-items:center;gap:10px;padding:22px 16px;border:1px dashed var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-base);text-align:center;transition:border-color .12s ease,background .12s ease}
.bkp-drop.is-over{border-color:var(--dsw-alias-brand-primary);background:color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent)}
.bkp-drophint{font-size:12.5px;color:var(--dsw-alias-label-secondary)}
.bkp-file{display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:11px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);min-width:0}
.bkp-fileicon{width:28px;height:28px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:8px;color:var(--dsw-alias-label-secondary);background:color-mix(in srgb, var(--dsw-alias-label-primary) 7%, transparent)}
.bkp-filetext{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.bkp-filename{font-size:13px;font-weight:500;line-height:18px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bkp-filedetail{font-size:12px;line-height:17px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bkp-close{flex:none;width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;border:none;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.bkp-close:hover{background:color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent);color:var(--dsw-alias-label-primary)}
.bkp-summary{display:flex;flex-direction:column;gap:6px;padding:11px 13px;border-radius:11px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);min-width:0}
.bkp-summarytitle{font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.bkp-sumbrow{display:flex;align-items:flex-start;gap:7px;font-size:12.5px;line-height:18px;min-width:0}
.bkp-dot{width:6px;height:6px;border-radius:50%;flex:none;margin-top:6px;background:var(--dsw-alias-state-success-primary)}
.bkp-dot.is-off{background:var(--dsw-alias-state-idle-primary)}
.bkp-sumbtext{flex:1;min-width:0;overflow-wrap:anywhere}
.bkp-list{display:flex;flex-direction:column;gap:8px;min-width:0}
.bkp-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);min-width:0}
.bkp-rowname{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11.5px;line-height:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bkp-rowmeta{font-size:12px;line-height:17px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.bkp-empty{padding:14px;text-align:center;font-size:12.5px;color:var(--dsw-alias-label-secondary);border:1px dashed var(--dsw-alias-border-l1);border-radius:10px}
.bkp-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
@media (prefers-reduced-motion: reduce){.bkp-spinner{animation-duration:2s}}
`.trim();

    /**
     * Read the JSON envelope of one response.
     * @param {Response} response Fetch response.
     * @returns {Promise<any>} Unwrapped data.
     */
    async function unwrap(response) {
      const text = await response.text();
      let payload = null;
      try {
        payload = text.length > 0 ? JSON.parse(text) : null;
      } catch (error) {
        payload = null;
      }
      if (!response.ok || (payload && payload.ok === false)) {
        const failure = new Error(
          (payload && payload.error) || 'HTTP ' + response.status,
        );
        failure.code = payload && payload.code ? payload.code : undefined;
        throw failure;
      }
      return payload ? payload.data : null;
    }

    /**
     * Call one backups route with a JSON body and unwrap its envelope.
     * @param {string} path Route suffix below ENDPOINT.
     * @param {{method?: string, body?: unknown}} [options] Request options.
     * @returns {Promise<any>} Unwrapped data.
     */
    async function request(path, options) {
      const opts = options || {};
      const response = await fetch(ENDPOINT + path, {
        method: opts.method || 'GET',
        credentials: 'same-origin',
        headers: Object.assign(
          { 'x-dsh-backups': '1' },
          opts.body === undefined ? {} : { 'content-type': 'application/json' },
        ),
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      });
      return await unwrap(response);
    }

    /**
     * Call one backups route with the backup file itself as the body, so the
     * archive never passes through base64.
     * @param {string} path Route suffix below ENDPOINT.
     * @param {Blob} body Backup bytes.
     * @returns {Promise<any>} Unwrapped data.
     */
    async function requestRaw(path, body) {
      const response = await fetch(ENDPOINT + path, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'x-dsh-backups': '1', 'content-type': 'application/octet-stream' },
        body,
      });
      return await unwrap(response);
    }

    /** Fill a `{name}` template. @param {string} template Text. @param {object} values Values. */
    function fill(template, values) {
      return String(template).replace(/\{(\w+)\}/g, (match, key) => (
        values[key] === undefined ? match : String(values[key])
      ));
    }

    /** @param {number} bytes Size. @returns {string} Human size. */
    function formatBytes(bytes) {
      const value = Number(bytes) || 0;
      if (value < 1024) return value + ' B';
      const units = ['KB', 'MB', 'GB'];
      let size = value / 1024;
      let index = 0;
      while (size >= 1024 && index < units.length - 1) {
        size /= 1024;
        index += 1;
      }
      return (size >= 10 ? Math.round(size) : Math.round(size * 10) / 10) + ' ' + units[index];
    }

    /** @param {string | null | undefined} iso Timestamp. @returns {string} Local date. */
    function formatDate(iso) {
      if (!iso) return '';
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return '';
      try {
        return date.toLocaleString(undefined, {
          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
      } catch (error) {
        return date.toISOString();
      }
    }

    /** Count label with singular and plural. */
    function plural(count, one, many) {
      return count + ' ' + (count === 1 ? one : many);
    }

    /** "9 sesiones · 1 espacio de trabajo" for one inspected sessions part. */
    function sessionsSummary(part, t) {
      return plural(part.sessionCount || 0, t('sessionsOne'), t('sessionsMany'))
        + ' · ' + plural((part.workspaces || []).length, t('workspacesOne'), t('workspacesMany'));
    }

    /** Turn a failed request into localized text. */
    function describeError(error, t) {
      const code = error && error.code;
      const byCode = {
        busy: t('errorBusy'),
        'invalid-backup': t('errorInvalid'),
        'invalid-json': t('errorInvalid'),
        'unsupported-version': t('errorVersion'),
        'missing-part': t('errorMissingPart'),
        'missing-file': t('errorMissingFile'),
        'too-large': t('errorTooLarge'),
        'empty-selection': t('errorEmpty'),
        'open-failed': t('errorOpenFolder'),
      };
      return byCode[code] || (error && error.message) || t('errorGeneric');
    }

    /** Default part selection for one inspected backup. */
    function defaultSelection(summary) {
      const parts = (summary && summary.parts) || {};
      return {
        sessions: parts.sessions !== undefined,
        configuration: parts.configuration !== undefined,
      };
    }

    function IconArchive(props) {
      const size = props.size || 18;
      return h('svg', { width: size, height: size, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': 'true' },
        h('path', { d: 'M2.75 6.25h14.5v2.1H2.75z', stroke: 'currentColor', strokeWidth: 1.4 }),
        h('path', { d: 'M3.75 8.35h12.5v7.4a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5z', stroke: 'currentColor', strokeWidth: 1.4 }),
        h('path', { d: 'M8 11.5h4', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }));
    }

    function IconRestore(props) {
      const size = props.size || 18;
      return h('svg', { width: size, height: size, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': 'true' },
        h('path', { d: 'M4.2 8.1A6.1 6.1 0 1 1 4 11.3', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }),
        h('path', { d: 'M4 4.4v3.9h3.9', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }));
    }

    function IconFile(props) {
      const size = props.size || 16;
      return h('svg', { width: size, height: size, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': 'true' },
        h('path', { d: 'M5.5 2.75h6l3 3v11.5h-9z', stroke: 'currentColor', strokeWidth: 1.4, strokeLinejoin: 'round' }),
        h('path', { d: 'M11.5 2.75v3h3', stroke: 'currentColor', strokeWidth: 1.4, strokeLinejoin: 'round' }));
    }

    function IconClose() {
      return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' },
        h('path', { d: 'M4 4l8 8M12 4l-8 8', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }));
    }

    /** Error boundary so a rendering failure never blanks the settings panel. */
    class Boundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }
      static getDerivedStateFromError(error) {
        return { error };
      }
      render() {
        if (this.state.error !== null) {
          const message = this.state.error && this.state.error.message
            ? this.state.error.message
            : String(this.state.error);
          return h('div', { className: 'bkp-root' },
            h('style', null, CSS),
            h('div', { className: 'bkp-banner is-error' }, message));
        }
        return this.props.children;
      }
    }

    /**
     * Build the Settings section entry point around one translator binding.
     * @param {Function} t Translator bound to this plugin's namespace.
     * @returns {Function} Section component.
     */
    function createBackupsSection(t) {
      return function BackupsSection() {
        return h(Boundary, null, h(BackupsPage, { t }));
      };
    }

    /** The page body; separated so the boundary can catch its failures. */
    function BackupsPage(props) {
      const t = props.t;
        const [status, setStatus] = React.useState(null);
        const [loadError, setLoadError] = React.useState(null);
        const [loading, setLoading] = React.useState(true);
        const [createSelection, setCreateSelection] = React.useState({ sessions: true, configuration: true });
        const [creating, setCreating] = React.useState(false);
        const [created, setCreated] = React.useState(null);
        const [createError, setCreateError] = React.useState(null);
        const [copied, setCopied] = React.useState(null);
        const [opening, setOpening] = React.useState(false);
        const [openError, setOpenError] = React.useState(null);
        const [selection, setSelection] = React.useState(null);
        const [restoreSelection, setRestoreSelection] = React.useState({ sessions: true, configuration: true });
        const [restoring, setRestoring] = React.useState(false);
        const [restored, setRestored] = React.useState(null);
        const [restoreError, setRestoreError] = React.useState(null);
        const [dragging, setDragging] = React.useState(false);
        const inputRef = React.useRef(null);

        const loadStatus = async function loadStatus() {
          try {
            const data = await request('');
            setStatus(data);
            setLoadError(null);
          } catch (error) {
            setLoadError(describeError(error, t));
          } finally {
            setLoading(false);
          }
        };

        React.useEffect(() => {
          loadStatus();
        }, []);

        const toggleCreate = function toggleCreate(key) {
          setCreateSelection((current) => ({ ...current, [key]: !current[key] }));
        };

        const toggleRestore = function toggleRestore(key) {
          setRestoreSelection((current) => ({ ...current, [key]: !current[key] }));
        };

        const copyPath = async function copyPath(text) {
          try {
            if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') throw new Error('no clipboard');
            await navigator.clipboard.writeText(text);
            setCopied(text);
            setTimeout(() => setCopied(null), 1600);
          } catch (error) {
            setCopied(t('copyFailed'));
            setTimeout(() => setCopied(null), 2000);
          }
        };

        const openFolder = async function openFolder() {
          setOpening(true);
          setOpenError(null);
          try {
            await request('/open', { method: 'POST' });
          } catch (error) {
            setOpenError(describeError(error, t));
          } finally {
            setOpening(false);
          }
        };

        const create = async function create() {
          setCreating(true);
          setCreateError(null);
          setCreated(null);
          try {
            const data = await request('/create', { method: 'POST', body: createSelection });
            setCreated(data);
            await loadStatus();
          } catch (error) {
            setCreateError(describeError(error, t));
          } finally {
            setCreating(false);
          }
        };

        const acceptFile = async function acceptFile(file) {
          if (!file) return;
          setRestoreError(null);
          setRestored(null);
          try {
            const summary = await requestRaw('/inspect', file);
            setSelection({ kind: 'upload', name: file.name, file, summary });
            setRestoreSelection(defaultSelection(summary));
          } catch (error) {
            setRestoreError(describeError(error, t));
          }
        };

        const chooseSaved = async function chooseSaved(name) {
          setRestoreError(null);
          setRestored(null);
          try {
            const summary = await request('/inspect-file', { method: 'POST', body: { name } });
            setSelection({ kind: 'file', name, summary });
            setRestoreSelection(defaultSelection(summary));
          } catch (error) {
            setRestoreError(describeError(error, t));
          }
        };

        const restore = async function restore() {
          if (selection === null) return;
          setRestoring(true);
          setRestoreError(null);
          setRestored(null);
          try {
            const flags = '?sessions=' + (restoreSelection.sessions ? '1' : '0')
              + '&configuration=' + (restoreSelection.configuration ? '1' : '0');
            const data = selection.kind === 'upload'
              ? await requestRaw('/restore' + flags, selection.file)
              : await request('/restore-file', {
                method: 'POST',
                body: {
                  name: selection.name,
                  sessions: restoreSelection.sessions,
                  configuration: restoreSelection.configuration,
                },
              });
            setRestored(data);
            await loadStatus();
          } catch (error) {
            setRestoreError(describeError(error, t));
          } finally {
            setRestoring(false);
          }
        };

        const sessionsDetail = function sessionsDetail() {
          if (status === null) return t('loading');
          const sessions = status.sessions || {};
          const bits = [plural(sessions.count || 0, t('sessionsOne'), t('sessionsMany'))];
          if ((sessions.workspaces || 0) > 0) {
            bits.push(plural(sessions.workspaces, t('workspacesOne'), t('workspacesMany')));
          }
          bits.push(formatBytes(sessions.bytes || 0));
          return bits.join(' · ');
        };

        const configurationDetail = function configurationDetail() {
          if (status === null) return t('loading');
          const configuration = status.configuration || {};
          return [
            plural(configuration.files || 0, t('filesOne'), t('filesMany')),
            plural((configuration.plugins || []).length, t('pluginsOne'), t('pluginsMany')),
          ].join(' · ');
        };

        const canCreate = createSelection.sessions || createSelection.configuration;
        const canRestore = selection !== null && (restoreSelection.sessions || restoreSelection.configuration);

        const createCard = h('section', { className: 'bkp-card', 'aria-labelledby': 'bkp-create-title' },
          h('div', { className: 'bkp-cardhead' },
            h('div', { className: 'bkp-mark' }, h(IconArchive)),
            h('div', { className: 'bkp-cardtext' },
              h('h3', { className: 'bkp-cardtitle', id: 'bkp-create-title' }, t('createTitle')),
              h('p', { className: 'bkp-cardsub' }, t('createText')))),
          h('div', { className: 'bkp-body' },
            status !== null
              ? h('div', { className: 'bkp-dest' },
                h('span', { className: 'bkp-destlabel' }, t('destination')),
                h('span', { className: 'bkp-destpath', title: status.destination }, status.destination),
                h('button', {
                  type: 'button',
                  className: 'bkp-btn bkp-btn-ghost bkp-btn-sm',
                  disabled: opening,
                  onClick: openFolder,
                }, opening ? t('opening') : t('openFolder')),
                h('button', {
                  type: 'button',
                  className: 'bkp-link',
                  onClick: () => copyPath(status.destination),
                }, copied === status.destination ? t('copied') : t('copyPath')))
              : null,
            openError !== null
              ? h('div', { className: 'bkp-banner is-error', role: 'alert' }, openError)
              : null,
            h('div', { className: 'bkp-parts' },
              h('div', { className: 'bkp-part' },
                h('input', {
                  id: 'bkp-part-sessions',
                  type: 'checkbox',
                  checked: createSelection.sessions,
                  onChange: () => toggleCreate('sessions'),
                }),
                h('label', { className: 'bkp-parttext', htmlFor: 'bkp-part-sessions' },
                  h('span', { className: 'bkp-partname' }, t('partSessions')),
                  h('span', { className: 'bkp-partdetail' }, sessionsDetail()))),
              h('div', { className: 'bkp-part' },
                h('input', {
                  id: 'bkp-part-configuration',
                  type: 'checkbox',
                  checked: createSelection.configuration,
                  onChange: () => toggleCreate('configuration'),
                }),
                h('label', { className: 'bkp-parttext', htmlFor: 'bkp-part-configuration' },
                  h('span', { className: 'bkp-partname' }, t('partConfiguration')),
                  h('span', { className: 'bkp-partdetail' }, configurationDetail())))),
            h('div', { className: 'bkp-actions' },
              h('button', {
                type: 'button',
                className: 'bkp-btn bkp-btn-primary',
                disabled: creating || !canCreate,
                onClick: create,
              }, creating ? h('span', { className: 'bkp-spinner', 'aria-hidden': 'true' }) : null,
              creating ? t('creating') : t('create'))),
            created !== null
              ? h('div', { className: 'bkp-banner is-ok', role: 'status' },
                h('div', { className: 'bkp-bannerbody' },
                  h('span', { className: 'bkp-bannerstrong' }, t('createdTitle')),
                  h('span', null, fill(t('createdDetail'), { name: created.name, size: formatBytes(created.bytes) })),
                  h('span', { className: 'bkp-partdetail' }, created.path)))
              : null,
            createError !== null
              ? h('div', { className: 'bkp-banner is-error', role: 'alert' }, createError)
              : null,
            loadError !== null
              ? h('div', { className: 'bkp-banner is-error', role: 'alert' }, t('loadFailed') + ' ' + loadError)
              : null));

        const selectedSummary = selection === null ? null : selection.summary;

        const summaryView = selectedSummary === null ? null : h('div', { className: 'bkp-summary' },
          h('span', { className: 'bkp-summarytitle' }, t('includes')),
          h('div', { className: 'bkp-sumbrow' },
            h('span', { className: 'bkp-dot' + (selectedSummary.parts.sessions ? '' : ' is-off') }),
            h('span', { className: 'bkp-sumbtext' },
              h('strong', null, t('partSessions')),
              selectedSummary.parts.sessions
                ? ' — ' + sessionsSummary(selectedSummary.parts.sessions, t)
                : ' — ' + t('errorMissingPart'))),
          h('div', { className: 'bkp-sumbrow' },
            h('span', { className: 'bkp-dot' + (selectedSummary.parts.configuration ? '' : ' is-off') }),
            h('span', { className: 'bkp-sumbtext' },
              h('strong', null, t('partConfiguration')),
              selectedSummary.parts.configuration
                ? ' — ' + plural(selectedSummary.parts.configuration.plugins.length, t('pluginsOne'), t('pluginsMany'))
                : ' — ' + t('errorMissingPart'))),
          selectedSummary.createdAt
            ? h('span', { className: 'bkp-note' }, fill(t('backupDate'), { date: formatDate(selectedSummary.createdAt) }))
            : null);

        const restoreResult = restored === null ? null : (function renderRestoreResult() {
          const rows = [];
          const sessionsResult = restored.summary && restored.summary.sessions;
          if (sessionsResult) {
            rows.push(fill(t('sessionsRestored'), { count: sessionsResult.written }));
            if (sessionsResult.grouped > 0) rows.push(fill(t('sessionsGrouped'), { count: sessionsResult.grouped }));
            if (sessionsResult.ungrouped > 0) rows.push(fill(t('sessionsUngrouped'), { count: sessionsResult.ungrouped }));
            if (sessionsResult.unchanged > 0) rows.push(fill(t('sessionsUnchanged'), { count: sessionsResult.unchanged }));
            if (sessionsResult.conflicts > 0) rows.push(fill(t('sessionsConflict'), { count: sessionsResult.conflicts }));
          }
          const configurationResult = restored.summary && restored.summary.configuration;
          if (configurationResult) {
            rows.push(fill(t('configurationRestored'), { count: configurationResult.files }));
            rows.push(fill(t('pluginsRestored'), { count: configurationResult.plugins }));
          }
          return h('div', { className: 'bkp-banner is-ok', role: 'status' },
            h('div', { className: 'bkp-bannerbody' },
              h('span', { className: 'bkp-bannerstrong' }, t('restoreDone')),
              rows.length > 0 ? h('ul', null, rows.map((row, index) => h('li', { key: 'row-' + index }, row))) : null,
              configurationResult && configurationResult.requiresRestart
                ? h('span', null, t('restart'))
                : null));
        })();

        const restoreCard = h('section', { className: 'bkp-card', 'aria-labelledby': 'bkp-restore-title' },
          h('div', { className: 'bkp-cardhead' },
            h('div', { className: 'bkp-mark' }, h(IconRestore)),
            h('div', { className: 'bkp-cardtext' },
              h('h3', { className: 'bkp-cardtitle', id: 'bkp-restore-title' }, t('restoreTitle')),
              h('p', { className: 'bkp-cardsub' }, t('restoreText')))),
          h('div', { className: 'bkp-body' },
            selection === null
              ? h('div', {
                className: 'bkp-drop' + (dragging ? ' is-over' : ''),
                onDragOver: (event) => { event.preventDefault(); setDragging(true); },
                onDragLeave: () => setDragging(false),
                onDrop: (event) => {
                  event.preventDefault();
                  setDragging(false);
                  const file = event.dataTransfer && event.dataTransfer.files ? event.dataTransfer.files[0] : null;
                  acceptFile(file);
                },
              },
              h('button', {
                type: 'button',
                className: 'bkp-btn bkp-btn-ghost',
                onClick: () => { if (inputRef.current) inputRef.current.click(); },
              }, h(IconFile), t('chooseFile')),
              h('span', { className: 'bkp-drophint' }, t('dropHint')))
              : h('div', { className: 'bkp-file' },
                h('span', { className: 'bkp-fileicon' }, h(IconFile, { size: 15 })),
                h('div', { className: 'bkp-filetext' },
                  h('span', { className: 'bkp-filename', title: selection.name }, selection.name),
                  h('span', { className: 'bkp-filedetail' }, formatDate(selectedSummary && selectedSummary.createdAt))),
                h('button', {
                  type: 'button',
                  className: 'bkp-close',
                  'aria-label': t('selectedFile'),
                  onClick: () => { setSelection(null); setRestored(null); setRestoreError(null); },
                }, h(IconClose))),
            h('input', {
              ref: inputRef,
              type: 'file',
              accept: '.zip,.json,application/zip,application/json',
              className: 'bkp-sr',
              'aria-label': t('chooseFile'),
              onChange: (event) => {
                const file = event.target.files ? event.target.files[0] : null;
                acceptFile(file);
                if (event.target) event.target.value = '';
              },
            }),
            summaryView,
            selection !== null
              ? h('div', { className: 'bkp-parts' },
                h('div', { className: 'bkp-part' + (selectedSummary.parts.sessions ? '' : ' is-disabled') },
                  h('input', {
                    id: 'bkp-restore-sessions',
                    type: 'checkbox',
                    disabled: !selectedSummary.parts.sessions,
                    checked: restoreSelection.sessions,
                    onChange: () => toggleRestore('sessions'),
                  }),
                  h('label', { className: 'bkp-parttext', htmlFor: 'bkp-restore-sessions' },
                    h('span', { className: 'bkp-partname' }, t('partSessions')),
                    h('span', { className: 'bkp-partdetail' },
                      selectedSummary.parts.sessions
                        ? sessionsSummary(selectedSummary.parts.sessions, t)
                        : t('errorMissingPart')))),
                h('div', { className: 'bkp-part' + (selectedSummary.parts.configuration ? '' : ' is-disabled') },
                  h('input', {
                    id: 'bkp-restore-configuration',
                    type: 'checkbox',
                    disabled: !selectedSummary.parts.configuration,
                    checked: restoreSelection.configuration,
                    onChange: () => toggleRestore('configuration'),
                  }),
                  h('label', { className: 'bkp-parttext', htmlFor: 'bkp-restore-configuration' },
                    h('span', { className: 'bkp-partname' }, t('partConfiguration')),
                    h('span', { className: 'bkp-partdetail' },
                      selectedSummary.parts.configuration
                        ? plural(selectedSummary.parts.configuration.plugins.length, t('pluginsOne'), t('pluginsMany'))
                        : t('errorMissingPart')))))
              : null,
            selection !== null
              ? h('p', { className: 'bkp-note' }, t('restoreNote'))
              : null,
            selection !== null
              ? h('div', { className: 'bkp-actions' },
                h('button', {
                  type: 'button',
                  className: 'bkp-btn bkp-btn-primary',
                  disabled: restoring || !canRestore,
                  onClick: restore,
                }, restoring ? h('span', { className: 'bkp-spinner', 'aria-hidden': 'true' }) : null,
                restoring ? t('restoring') : t('restore')))
              : null,
            restoreResult,
            restoreError !== null
              ? h('div', { className: 'bkp-banner is-error', role: 'alert' }, restoreError)
              : null,
            restored !== null && restored.warnings && restored.warnings.length > 0
              ? h('div', { className: 'bkp-banner is-warn', role: 'status' },
                h('div', { className: 'bkp-bannerbody' },
                  h('span', { className: 'bkp-bannerstrong' }, t('warningTitle')),
                  h('ul', null, restored.warnings.map((warning, index) => h('li', { key: 'warn-' + index }, warning)))))
              : null));

        const saved = status === null || !Array.isArray(status.backups) ? [] : status.backups.slice(0, 6);

        const savedCard = h('section', { className: 'bkp-card', 'aria-labelledby': 'bkp-saved-title' },
          h('div', { className: 'bkp-cardhead' },
            h('div', { className: 'bkp-mark' }, h(IconFile, { size: 17 })),
            h('div', { className: 'bkp-cardtext' },
              h('h3', { className: 'bkp-cardtitle', id: 'bkp-saved-title' }, t('savedTitle')),
              h('div', { className: 'bkp-cardsub bkp-subrow' },
                h('span', null, fill(t('savedText'), { dir: status === null ? '' : status.destination })),
                h('button', {
                  type: 'button',
                  className: 'bkp-link',
                  disabled: opening,
                  onClick: openFolder,
                }, opening ? t('opening') : t('openFolder'))))),
          h('div', { className: 'bkp-body' },
            loading
              ? h('div', { className: 'bkp-empty' }, t('loading'))
              : saved.length === 0
                ? h('div', { className: 'bkp-empty' }, t('emptySaved'))
                : h('div', { className: 'bkp-list' }, saved.map((backup) => h('div', { className: 'bkp-row', key: backup.name },
                  h('div', { className: 'bkp-filetext' },
                    h('span', { className: 'bkp-rowname', title: backup.name }, backup.name),
                    h('span', { className: 'bkp-rowmeta' }, formatDate(backup.createdAt) + ' · ' + formatBytes(backup.bytes))),
                  h('button', {
                    type: 'button',
                    className: 'bkp-btn bkp-btn-ghost',
                    onClick: () => chooseSaved(backup.name),
                  }, t('restoreAction')))))));

        return h('div', { className: 'bkp-root' },
          h('style', null, CSS),
          h('div', { className: 'bkp-head' },
            h('div', { className: 'bkp-headtext' },
              h('h2', { className: 'bkp-title' }, t('title')),
              h('p', { className: 'bkp-sub' }, t('subtitle')))),
          createCard,
          restoreCard,
          savedCard);
    }

    /** Navigation icon addressed by the section id. */
    function BackupsNavIcon(props) {
      const size = props.size || 16;
      return h('svg', { width: size, height: size, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': 'true' },
        h('path', { d: 'M2.75 6.25h14.5v2.1H2.75z', stroke: 'currentColor', strokeWidth: 1.5 }),
        h('path', { d: 'M3.75 8.35h12.5v7.9a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5z', stroke: 'currentColor', strokeWidth: 1.5 }),
        h('path', { d: 'M8 11.6h4', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }));
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const disposeLocale = ctx.locale.register(NS, STRINGS);
        ctx.effect(() => disposeLocale, 'dsh-backups locale');

        const t = ctx.locale.bind(NS);

        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'backups',
          order: 30,
          label: () => t('nav'),
          locale: NS,
        }, createBackupsSection(t)));

        ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
          name: 'settings.section.icon',
          id: 'backups',
        }, BackupsNavIcon));
      },
    };
  },
});
