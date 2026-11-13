window.__ModuleLoader__.load({
  id: '@local/dsh-sandbox',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const NS = 'dsh-sandbox';
    const ROUTE = '/dsh-sandbox';
    const HEADER = 'x-dsh-sandbox';
    let activeT = (key) => key;

    const DICTS = {
      en: {
        'meta.title': 'DSH Sandbox',
        'meta.description': 'Run a session inside a cage: only tools, no CLI, and files limited to the workspace and granted folders.',
        nav: 'DSH Sandbox',
        'page.title': 'DSH Sandbox',
        'page.intro': 'The cage is enabled per session from the composer. While it is red, the agent runs on native tools only: no shell, no desktop control, and file reads or writes outside the session workspace or the folders below are denied.',
        'page.how': 'The cage also forces the workspace-write policy and merges these folders into the writable roots, so the Harness file sandbox backs the tool-level checks.',
        'grants.title': 'Granted folders',
        'grants.intro': 'These directories are readable and writable from a caged session, in addition to its own workspace.',
        'grants.empty': 'No folders granted yet. A caged session can still use its workspace.',
        'grants.path': 'Absolute folder path',
        'grants.add': 'Grant folder',
        'grants.remove': 'Revoke',
        'grants.added': 'Folder granted.',
        'grants.removed': 'Folder revoked.',
        'grants.error': 'The folder could not be updated.',
        'cage.on': 'Sandbox on: tools only, files confined',
        'cage.off': 'Sandbox off: normal session',
        'cage.onHint': 'This session is caged (red). The agent can only use tools, cannot run the CLI or code, and files are limited to the workspace and granted folders. Click to leave the cage.',
        'cage.offHint': 'Click to cage this session: native tools only, no CLI or code, and files limited to the workspace and granted folders.',
        'cage.error': 'The sandbox switch could not be saved.',
        'cage.loading': 'Sandbox',
      },
      es: {
        'meta.title': 'DSH Sandbox',
        'meta.description': 'Ejecuta una sesión dentro de una jaula: solo herramientas, sin CLI y con archivos limitados al espacio de trabajo y a las carpetas autorizadas.',
        nav: 'DSH Sandbox',
        'page.title': 'DSH Sandbox',
        'page.intro': 'La jaula se activa por sesión desde el compositor. Mientras está roja, el agente usa solo herramientas nativas: no hay terminal, no hay control del escritorio y se deniega cualquier lectura o escritura fuera del espacio de trabajo de la sesión o de las carpetas de abajo.',
        'page.how': 'La jaula además fuerza la política workspace-write y añade estas carpetas a las raíces de escritura, de modo que el sandbox de archivos del Harness respalda las comprobaciones de las herramientas.',
        'grants.title': 'Carpetas autorizadas',
        'grants.intro': 'Estos directorios se pueden leer y escribir desde una sesión enjaulada, además de su propio espacio de trabajo.',
        'grants.empty': 'Todavía no hay carpetas autorizadas. Una sesión enjaulada puede seguir usando su espacio de trabajo.',
        'grants.path': 'Ruta absoluta de la carpeta',
        'grants.add': 'Autorizar carpeta',
        'grants.remove': 'Revocar',
        'grants.added': 'Carpeta autorizada.',
        'grants.removed': 'Carpeta revocada.',
        'grants.error': 'No se pudo actualizar la carpeta.',
        'cage.on': 'Sandbox activo: solo herramientas, archivos confinados',
        'cage.off': 'Sandbox desactivado: sesión normal',
        'cage.onHint': 'Esta sesión está enjaulada (roja). El agente solo puede usar herramientas, no puede ejecutar la CLI ni código, y los archivos se limitan al espacio de trabajo y a las carpetas autorizadas. Pulsa para salir de la jaula.',
        'cage.offHint': 'Pulsa para enjaular esta sesión: solo herramientas nativas, sin CLI ni código, y archivos limitados al espacio de trabajo y a las carpetas autorizadas.',
        'cage.error': 'No se pudo guardar el interruptor del sandbox.',
        'cage.loading': 'Sandbox',
      },
    };

    const CSS = `
      .dsb-slot { display: inline-flex; flex: none; align-items: center; order: 1; }
      [class*="_tools"] > [data-slot="conversation.input.left"] > .dsb-slot { order: 1; }
      [class*="_tools"] > [class*="_modes"] { order: 2; }
      .dsb-cage { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; flex: none; padding: 0; border: 0; border-radius: 999px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; }
      .dsb-cage:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
      .dsb-cage:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
      .dsb-cage.is-on { color: var(--dsw-alias-state-error-primary); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 14%, transparent); }
      .dsb-cage.is-on:hover:not(:disabled) { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 20%, transparent); }
      .dsb-cage:disabled { opacity: .55; cursor: default; }
      .dsb-cage.is-failed { outline: 2px solid var(--dsw-alias-state-error-primary); outline-offset: 1px; }
      .dsb-page { max-width: 680px; padding: 8px 0 24px; color: var(--dsw-alias-label-primary); }
      .dsb-page h2 { margin: 0; font-size: 16px; font-weight: 600; line-height: 24px; }
      .dsb-intro { margin: 8px 0 0; font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-secondary); }
      .dsb-hint { margin: 4px 0 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary); }
      .dsb-card { margin-top: 18px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); overflow: hidden; }
      .dsb-card-head { padding: 14px 16px 10px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
      .dsb-card-title { margin: 0; font-size: 13px; font-weight: 600; line-height: 20px; }
      .dsb-card-intro { margin: 3px 0 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
      .dsb-row { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
      .dsb-row:last-child { border-bottom: 0; }
      .dsb-path { flex: 1; min-width: 0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; line-height: 18px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dsb-empty { padding: 14px 16px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
      .dsb-form { display: flex; gap: 8px; padding: 12px 16px; }
      .dsb-input { flex: 1; min-width: 0; height: 30px; padding: 0 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; }
      .dsb-btn { flex: none; height: 30px; padding: 0 12px; border: 1px solid transparent; border-radius: 7px; background: var(--dsw-alias-brand-primary); color: #fff; font: inherit; font-size: 12px; font-weight: 500; cursor: pointer; }
      .dsb-btn:hover:not(:disabled) { filter: brightness(1.05); }
      .dsb-btn:disabled { opacity: .55; cursor: default; }
      .dsb-btn-danger { background: transparent; border-color: transparent; color: var(--dsw-alias-state-error-primary); }
      .dsb-btn-danger:hover:not(:disabled) { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent); }
      .dsb-error { margin: 0; padding: 10px 16px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-state-error-primary); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent); }
      .dsb-status { margin: 10px 0 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-state-success-primary); }
    `;

    /**
     * Call one Host route and unwrap its envelope.
     * @param {string} path Suffix below ROUTE.
     * @param {{ method?: string, body?: unknown }} [options] Request options.
     * @returns {Promise<any>} Unwrapped data.
     */
    async function request(path, options) {
      const opts = options || {};
      const response = await fetch(ROUTE + path, {
        method: opts.method || 'GET',
        credentials: 'same-origin',
        headers: Object.assign(
          { [HEADER]: '1' },
          opts.body === undefined ? {} : { 'content-type': 'application/json' },
        ),
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      });
      const text = await response.text();
      let payload = null;
      try {
        payload = text.length > 0 ? JSON.parse(text) : null;
      } catch {
        payload = null;
      }
      if (!response.ok || (payload && payload.ok === false)) {
        throw new Error((payload && payload.error) || 'HTTP ' + response.status);
      }
      return payload ? payload.data : null;
    }

    /** Cage glyph: a rounded cage with bars and a handle. */
    function CageIcon({ active, size = 18 }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        'aria-hidden': true,
      },
        h('rect', {
          x: 4, y: 7, width: 16, height: 13, rx: 2.5,
          stroke: 'currentColor', strokeWidth: 1.6,
          fill: active ? 'currentColor' : 'none', fillOpacity: active ? 0.16 : 0,
        }),
        h('path', { d: 'M8 10.5v6M12 10.5v6M16 10.5v6', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }),
        h('path', { d: 'M9 7V5.5A3 3 0 0 1 15 5.5V7', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' }));
    }

    /** Composer cage switch for the current session. */
    function CageButton(props) {
      const t = typeof props.t === 'function' ? props.t : activeT;
      const sessionId = typeof props.sessionId === 'string' ? props.sessionId : undefined;
      const [on, setOn] = React.useState(false);
      const [busy, setBusy] = React.useState(false);
      const [failed, setFailed] = React.useState(false);
      const [ready, setReady] = React.useState(false);

      React.useEffect(() => {
        let alive = true;
        if (sessionId === undefined) {
          setReady(false);
          return () => { alive = false; };
        }
        setReady(false);
        request('/state?sessionId=' + encodeURIComponent(sessionId))
          .then((data) => {
            if (!alive || data === null) return;
            setOn(data.enabled === true);
            setReady(true);
          })
          .catch(() => {
            if (alive) setReady(true);
          });
        return () => { alive = false; };
      }, [sessionId]);

      const toggle = async () => {
        if (sessionId === undefined || busy) return;
        const next = !on;
        setBusy(true);
        setFailed(false);
        try {
          const data = await request('/state', { method: 'POST', body: { sessionId: sessionId, enabled: next } });
          setOn(data && data.enabled === true);
        } catch (error) {
          console.warn('[dsh-sandbox] ' + t('cage.error'), error);
          setFailed(true);
          window.setTimeout(() => setFailed(false), 5000);
        } finally {
          setBusy(false);
        }
      };

      const label = on ? t('cage.on') : t('cage.off');
      return h('div', { className: 'dsb-slot' },
        h('style', null, CSS),
        h('button', {
          type: 'button',
          className: 'dsb-cage' + (on ? ' is-on' : '') + (failed ? ' is-failed' : ''),
          'aria-label': label,
          'aria-pressed': on,
          title: failed ? t('cage.error') : !ready ? t('cage.loading') : on ? t('cage.onHint') : t('cage.offHint'),
          disabled: busy || sessionId === undefined,
          onClick: toggle,
        }, h(CageIcon, { active: on })));
    }

    /** Settings page: granted folders and an explanation of the cage. */
    function SandboxPage(props) {
      const t = typeof props.t === 'function' ? props.t : activeT;
      const [grants, setGrants] = React.useState([]);
      const [path, setPath] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState(null);
      const [status, setStatus] = React.useState(null);

      const load = React.useCallback(async () => {
        try {
          const data = await request('/grants');
          setGrants(Array.isArray(data?.grants) ? data.grants : []);
          setError(null);
        } catch (failure) {
          setError(String(failure?.message || failure));
        }
      }, []);

      React.useEffect(() => {
        void load();
      }, [load]);

      const mutate = async (action, value) => {
        setBusy(true);
        setError(null);
        setStatus(null);
        try {
          const data = await request('/grants', { method: 'POST', body: { action: action, path: value } });
          setGrants(Array.isArray(data?.grants) ? data.grants : []);
          setStatus(t(action === 'add' ? 'grants.added' : 'grants.removed'));
          window.setTimeout(() => setStatus(null), 5000);
          return true;
        } catch (failure) {
          setError(String(failure?.message || failure) || t('grants.error'));
          return false;
        } finally {
          setBusy(false);
        }
      };

      const submit = async (event) => {
        event.preventDefault();
        if (path.trim().length === 0) return;
        if (await mutate('add', path.trim())) setPath('');
      };

      return h('div', { className: 'dsb-page' },
        h('style', null, CSS),
        h('h2', null, t('page.title')),
        h('p', { className: 'dsb-intro' }, t('page.intro')),
        h('p', { className: 'dsb-hint' }, t('page.how')),
        h('div', { className: 'dsb-card' },
          h('div', { className: 'dsb-card-head' },
            h('h3', { className: 'dsb-card-title' }, t('grants.title')),
            h('p', { className: 'dsb-card-intro' }, t('grants.intro'))),
          error !== null ? h('p', { className: 'dsb-error' }, error) : null,
          grants.length === 0
            ? h('div', { className: 'dsb-empty' }, t('grants.empty'))
            : grants.map((grant) => h('div', { className: 'dsb-row', key: grant },
              h('span', { className: 'dsb-path', title: grant }, grant),
              h('button', {
                type: 'button',
                className: 'dsb-btn dsb-btn-danger',
                disabled: busy,
                onClick: () => void mutate('remove', grant),
              }, t('grants.remove')))),
          h('form', { className: 'dsb-form', onSubmit: submit },
            h('input', {
              className: 'dsb-input',
              type: 'text',
              value: path,
              placeholder: '/Users/you/Documents/shared',
              'aria-label': t('grants.path'),
              onChange: (event) => setPath(event.target.value),
              spellCheck: false,
            }),
            h('button', { type: 'submit', className: 'dsb-btn', disabled: busy || path.trim().length === 0 }, t('grants.add')))),
        status !== null ? h('p', { className: 'dsb-status' }, status) : null);
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const disposeLocale = ctx.locale.register(NS, DICTS);
        ctx.effect(() => disposeLocale, 'dsh-sandbox locale');
        const t = ctx.locale.bind(NS);
        activeT = t;

        ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
          name: 'conversation.input.left',
          id: 'dsh-sandbox-cage',
          order: 10,
          locale: NS,
          inject: () => ({ t }),
        }, CageButton));

        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'dsh-sandbox',
          order: 85,
          label: () => t('nav'),
          locale: NS,
          inject: () => ({ t }),
        }, SandboxPage));

        ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
          name: 'settings.section.icon',
          id: 'dsh-sandbox',
          locale: NS,
        }, (props) => h(CageIcon, { size: props?.size || 16 })));
      },
    };
  },
});
