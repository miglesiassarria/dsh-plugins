window.__ModuleLoader__.load({
  id: '@local/default-model',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'default-model';
    const ENDPOINT = '/dsh-default-model';
    const HEADER = 'x-dsh-default-model';

    const DICTS = {
      en: {
        label: 'Default',
        aria: 'Default model for new chats',
        hint: 'New chats start with this model. Changing the model inside a chat does not change this default.',
        loading: 'Loading…',
        loadError: 'The default model could not be loaded.',
        saveError: 'The default model could not be saved.',
        invalidModel: 'That model is no longer available. Pick another one.',
        networkError: 'The local service could not be reached.',
        retry: 'Retry',
        saved: 'Default model updated.',
        unavailable: 'unavailable',
        noModels: 'No models are configured.',
      },
      es: {
        label: 'Predeterminado',
        aria: 'Modelo predeterminado para chats nuevos',
        hint: 'Los chats nuevos empiezan con este modelo. Cambiar el modelo dentro de un chat no altera este valor.',
        loading: 'Cargando…',
        loadError: 'No se pudo cargar el modelo predeterminado.',
        saveError: 'No se pudo guardar el modelo predeterminado.',
        invalidModel: 'Ese modelo ya no está disponible. Elige otro.',
        networkError: 'No se pudo conectar con el servicio local.',
        retry: 'Reintentar',
        saved: 'Modelo predeterminado actualizado.',
        unavailable: 'no disponible',
        noModels: 'No hay modelos configurados.',
      },
    };

    const CSS = `
      .dm-root{display:inline-flex;align-items:center;gap:8px;min-width:0;color:var(--dsw-alias-label-secondary);}
      .dm-control{display:inline-flex;align-items:center;gap:6px;min-width:0;}
      .dm-icon{display:inline-flex;flex:none;color:var(--dsw-alias-label-tertiary);}
      .dm-label{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);white-space:nowrap;}
      .dm-select{box-sizing:border-box;height:28px;max-width:200px;border:.5px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:18px;padding:0 6px;min-width:0;}
      .dm-select:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);}
      .dm-select:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
      .dm-select:disabled{opacity:.6;cursor:default;}
      .dm-status{display:inline-flex;align-items:center;flex:none;}
      .dm-muted{color:var(--dsw-alias-label-tertiary);}
      .dm-error{color:var(--dsw-alias-state-error-primary);}
      .dm-ok{color:var(--dsw-alias-state-success-primary);}
      .dm-retry{box-sizing:border-box;height:28px;padding:0 10px;border:.5px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap;}
      .dm-retry:hover{background:var(--dsw-alias-interactive-bg-hover);}
      .dm-retry:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
      .dm-spin{display:block;width:12px;height:12px;border-radius:50%;border:2px solid currentColor;border-top-color:transparent;animation:dm-spin .8s linear infinite;}
      .dm-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;}
      @keyframes dm-spin{to{transform:rotate(360deg);}}
      @media (prefers-reduced-motion:reduce){.dm-spin{animation:none;}}
      @media (max-width:820px){.dm-label{display:none;}}
      @media (max-width:620px){.dm-select{max-width:150px;}}
    `;

    function StarIcon() {
      return h('svg', {
        width: 14,
        height: 14,
        viewBox: '0 0 16 16',
        fill: 'none',
        'aria-hidden': 'true',
        focusable: false,
      },
      h('path', {
        d: 'M8 1.8 9.7 5.4l3.9.5-2.9 2.7.8 3.9L8 10.6l-3.5 1.9.8-3.9L2.4 5.9l3.9-.5L8 1.8Z',
        stroke: 'currentColor',
        strokeWidth: 1.4,
        strokeLinejoin: 'round',
      }));
    }

    function CheckIcon() {
      return h('svg', {
        width: 14,
        height: 14,
        viewBox: '0 0 16 16',
        fill: 'none',
        'aria-hidden': 'true',
        focusable: false,
      },
      h('path', {
        d: 'm3.2 8.4 3 3L12.9 4.6',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }));
    }

    function ErrorIcon() {
      return h('svg', {
        width: 14,
        height: 14,
        viewBox: '0 0 16 16',
        fill: 'none',
        'aria-hidden': 'true',
        focusable: false,
      },
      h('circle', { cx: 8, cy: 8, r: 6.2, stroke: 'currentColor', strokeWidth: 1.4 }),
      h('path', { d: 'M8 4.8v3.7', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' }),
      h('circle', { cx: 8, cy: 11.1, r: 0.9, fill: 'currentColor' }));
    }

    function createStore(initial) {
      let value = initial;
      const listeners = new Set();
      return {
        get: () => value,
        set(next) {
          value = next;
          for (const listener of listeners) listener();
        },
        subscribe(listener) {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
      };
    }

    function useStore(store) {
      const [value, setValue] = React.useState(store.get());
      React.useEffect(() => store.subscribe(() => setValue(store.get())), []);
      return value;
    }

    function describeError(error, t, fallbackKey) {
      const code = error && typeof error.code === 'string' ? error.code : '';
      if (code === 'network-error') return t('networkError');
      if (code === 'invalid-model') return t('invalidModel');
      return t(fallbackKey);
    }

    function selectionOf(group, model) {
      return { provider: group.id, model: model.id };
    }

    /** Flatten the provider groups into select rows, keeping their order. */
    function flatten(groups) {
      const rows = [];
      for (const group of Array.isArray(groups) ? groups : []) {
        for (const model of Array.isArray(group.models) ? group.models : []) {
          rows.push({ group, model, provider: group.id, modelId: model.id });
        }
      }
      return rows;
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, DICTS), 'default-model locale');
        const t = ctx.locale.bind(NS);

        const modelsActive = createStore(false);
        const view = createStore({
          status: 'idle',
          data: null,
          error: null,
          saving: false,
          saveError: null,
        });
        let loading = null;

        async function request(method, path, body) {
          let response;
          try {
            response = await fetch(ENDPOINT + path, {
              method,
              cache: 'no-store',
              headers: {
                [HEADER]: '1',
                ...(body === undefined ? {} : { 'content-type': 'application/json' }),
              },
              body: body === undefined ? undefined : JSON.stringify(body),
            });
          } catch {
            const error = new Error('network-error');
            error.code = 'network-error';
            throw error;
          }
          const payload = await response.json().catch(() => null);
          if (!response.ok || payload?.ok !== true) {
            const error = new Error(typeof payload?.error === 'string' ? payload.error : 'request-failed');
            error.code = typeof payload?.code === 'string' ? payload.code : 'generic';
            throw error;
          }
          return payload.data;
        }

        function load() {
          if (loading !== null) return loading;
          const previous = view.get();
          if (previous.status !== 'loading') view.set({ ...previous, status: 'loading', error: null });
          loading = request('GET', '/state').then((data) => {
            view.set({ ...view.get(), status: 'ready', data, error: null });
            return data;
          }, (error) => {
            view.set({ ...view.get(), status: 'error', error: describeError(error, t, 'loadError') });
            throw error;
          }).finally(() => {
            loading = null;
          });
          return loading;
        }

        function loadIfNeeded() {
          const status = view.get().status;
          if (status === 'ready' || status === 'loading') return loading ?? Promise.resolve(view.get().data);
          return load();
        }

        async function save(selection) {
          view.set({ ...view.get(), saving: true, saveError: null });
          try {
            const data = await request('POST', '/selection', selection);
            view.set({ ...view.get(), status: 'ready', data, saving: false, saveError: null });
            return true;
          } catch (error) {
            view.set({ ...view.get(), saving: false, saveError: describeError(error, t, 'saveError') });
            return false;
          }
        }

        function DefaultModelControl(props) {
          const translate = props.t || t;
          const active = useStore(modelsActive);
          const snapshot = useStore(view);
          const [flash, setFlash] = React.useState(false);

          React.useEffect(() => {
            if (active) loadIfNeeded().catch(() => {});
          }, [active]);

          React.useEffect(() => {
            if (!flash) return undefined;
            const timer = setTimeout(() => setFlash(false), 2200);
            return () => clearTimeout(timer);
          }, [flash]);

          if (!active) return null;

          const data = snapshot.data;
          const rows = flatten(data && data.groups);
          const selection = data && data.selection ? data.selection : null;
          const currentIndex = selection === null
            ? -1
            : rows.findIndex((row) => row.provider === selection.provider && row.modelId === selection.model);
          const missing = selection !== null && currentIndex === -1;
          const ready = snapshot.status === 'ready' && data !== null;
          const busy = snapshot.saving;
          const value = missing ? '__missing__' : currentIndex >= 0 ? String(currentIndex) : '';

          const statusIcon = snapshot.saveError !== null
            ? h('span', { className: 'dm-status dm-error', title: snapshot.saveError, role: 'img', 'aria-label': snapshot.saveError }, h(ErrorIcon))
            : flash
              ? h('span', { className: 'dm-status dm-ok', title: translate('saved'), role: 'img', 'aria-label': translate('saved') }, h(CheckIcon))
              : busy
                ? h('span', { className: 'dm-status dm-muted', title: translate('loading'), role: 'status' }, h('span', { className: 'dm-spin' }))
                : null;

          let control;
          if (snapshot.status === 'error') {
            control = h('button', {
              type: 'button',
              className: 'dm-retry',
              title: snapshot.error || translate('loadError'),
              onClick: () => {
                load().catch(() => {});
              },
            }, translate('retry'));
          } else if (!ready) {
            control = h('select', {
              className: 'dm-select',
              'aria-label': translate('aria'),
              disabled: true,
              value: '',
              children: h('option', { value: '' }, translate('loading')),
            });
          } else if (rows.length === 0 && !missing) {
            control = h('select', {
              className: 'dm-select',
              'aria-label': translate('aria'),
              disabled: true,
              value: '',
              children: h('option', { value: '' }, translate('noModels')),
            });
          } else {
            const children = [];
            if (missing) {
              children.push(h('option', { key: '__missing__', value: '__missing__', disabled: true },
                selection.provider + ' · ' + selection.model + ' (' + translate('unavailable') + ')'));
            } else if (selection === null) {
              children.push(h('option', { key: '__none__', value: '', disabled: true }, translate('aria')));
            }
            for (const group of data.groups || []) {
              const options = [];
              rows.forEach((row, index) => {
                if (row.group !== group) return;
                options.push(h('option', { key: group.id + '\u0000' + row.modelId, value: String(index) }, row.model.name));
              });
              if (options.length === 0) continue;
              children.push(h('optgroup', { key: group.id, label: group.name }, options));
            }
            control = h('select', {
              className: 'dm-select',
              'aria-label': translate('aria'),
              title: selection === null ? translate('aria') : selection.provider + ' · ' + selection.model,
              disabled: busy,
              value,
              onChange: (event) => {
                const next = event.target.value;
                if (next === '__missing__' || next === '') return;
                const row = rows[Number(next)];
                if (row === undefined) return;
                save(selectionOf(row.group, row.model)).then((ok) => {
                  if (ok) setFlash(true);
                });
              },
              children,
            });
          }

          const announcement = snapshot.saveError !== null
            ? snapshot.saveError
            : flash
              ? translate('saved')
              : '';

          return h('div', { className: 'dm-root' },
            h('style', null, CSS),
            h('div', { className: 'dm-control', title: translate('hint') },
              h('span', { className: 'dm-icon' }, h(StarIcon)),
              h('span', { className: 'dm-label' }, translate('label')),
              control),
            statusIcon,
            h('span', { className: 'dm-sr', role: 'status', 'aria-live': 'polite' }, announcement));
        }

        /**
         * The footer probe makes the header control visible only while the Models
         * section is mounted; section content renders for the active page alone.
         */
        function ModelsActiveProbe() {
          React.useEffect(() => {
            modelsActive.set(true);
            return () => modelsActive.set(false);
          }, []);
          return null;
        }

        ctx.slots.inject('settings.action', () => ctx.slots.register({
          name: 'settings.action',
          id: NS,
          order: -1,
          locale: NS,
        }, DefaultModelControl));

        ctx.slots.inject('settings.models.footer', () => ctx.slots.register({
          name: 'settings.models.footer',
          id: NS + '-probe',
        }, ModelsActiveProbe));
      },
    };
  },
});
