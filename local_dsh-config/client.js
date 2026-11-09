window.__ModuleLoader__.load({
  id: '@local/dsh-config',
  factory(require) {
    const NS = 'dsh-config';
    const ROUTE = '/dsh-config';
    const HEADER = 'x-dsh-config';
    const NUDGE_ID = '__dsh-config-nudge__';
    const STYLE_ID = 'dsh-config-style';
    const DRAG_THRESHOLD = 5;
    const DIALOG = '[data-shortcut-modal="settings"]';
    const GITHUB_SPEC = /^(?:https?:\/\/)?(?:www\.)?github\.com\/[^/\s]+\/[^/\s]+\/(?:tree|blob)\//i;

    const DICTS = {
      en: {
        'meta.title': 'DSH Config',
        'meta.description': 'Reorder the Settings categories by dragging them, and install plugins from a folder in a public GitHub repository.',
        'moved': 'Category moved to position {position} of {total}.',
        'saveError': 'The new category order could not be saved.',
        'loadError': 'The saved category order could not be loaded.',
        'github.invalid': 'The URL must point to a GitHub folder, for example https://github.com/owner/repo/tree/main/folder.',
        'github.notFound': 'The repository, branch or folder was not found on GitHub.',
        'github.notPackage': 'The GitHub folder has no valid package.json.',
        'github.rateLimited': 'GitHub limited the anonymous requests. Wait a few minutes and try again.',
        'github.tooLarge': 'The GitHub folder is too large to install.',
        'github.unsupported': 'The folder contains symlinks or submodules, which cannot be copied.',
        'github.network': 'The folder could not be downloaded from GitHub. Check the connection.',
        'github.cancelled': 'The check was cancelled.',
      },
      es: {
        'meta.title': 'DSH Config',
        'meta.description': 'Reordena las categorías de Ajustes arrastrándolas e instala complementos desde una carpeta de un repositorio público de GitHub.',
        'moved': 'Categoría movida a la posición {position} de {total}.',
        'saveError': 'No se pudo guardar el nuevo orden de categorías.',
        'loadError': 'No se pudo cargar el orden de categorías guardado.',
        'github.invalid': 'La URL debe apuntar a una carpeta de GitHub, por ejemplo https://github.com/usuario/repositorio/tree/main/carpeta.',
        'github.notFound': 'No se encontró el repositorio, la rama o la carpeta en GitHub.',
        'github.notPackage': 'La carpeta de GitHub no contiene un package.json válido.',
        'github.rateLimited': 'GitHub ha limitado las peticiones anónimas. Espera unos minutos y vuelve a intentarlo.',
        'github.tooLarge': 'La carpeta de GitHub es demasiado grande para instalarla.',
        'github.unsupported': 'La carpeta contiene enlaces simbólicos o submódulos, que no se pueden copiar.',
        'github.network': 'No se pudo descargar la carpeta desde GitHub. Comprueba la conexión.',
        'github.cancelled': 'La comprobación se canceló.',
      },
    };

    // Only the drag ghost and the insertion line are our own body-level nodes.
    // The pointer keeps the plain arrow over the rail (no hand, no grab).
    const CSS = `
      ${DIALOG} > nav > div > button { cursor: default; }
      body.dshc-dragging, body.dshc-dragging * { cursor: default !important; user-select: none !important; }
      .dshc-ghost {
        position: fixed !important;
        z-index: 2147483000;
        box-sizing: border-box;
        margin: 0 !important;
        background: var(--dsw-alias-bg-overlay) !important;
        opacity: .97;
        pointer-events: none;
        box-shadow: 0 12px 32px rgba(0, 0, 0, .32), 0 0 0 .5px var(--dsw-alias-border-l2);
        transform: scale(1.015);
      }
      .dshc-indicator {
        position: fixed;
        z-index: 2147483000;
        pointer-events: none;
        border-radius: 999px;
        background: var(--dsw-alias-brand-primary, #4d6bfe);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary, #4d6bfe) 24%, transparent);
      }
      .dshc-hide-caption { display: none !important; }
      .dshc-sr {
        position: absolute !important;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
        border: 0;
      }
      @media (prefers-reduced-motion: reduce) {
        .dshc-ghost { transform: none; }
      }
    `;

    /** One placeholder React component for the version-nudge registration. */
    function Noop() {
      return null;
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        let t = (key) => key;
        ctx.effect(() => {
          const disposers = Object.entries(DICTS).map(([locale, dict]) => ctx.locale.register(NS, locale, dict));
          t = ctx.locale.bind(NS);
          return () => {
            for (const dispose of disposers) dispose();
          };
        }, 'dsh-config locale');

        /** Preferred order loaded from (or last written to) the Host. */
        let saved = [];
        /** True briefly after a drag so the drop does not select a section. */
        let suppressClick = false;
        let suppressTimer = 0;
        let announceTimer = 0;
        let saveChain = Promise.resolve();
        let drag = null;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = CSS;

        const indicator = document.createElement('div');
        indicator.className = 'dshc-indicator';
        indicator.hidden = true;

        const live = document.createElement('div');
        live.className = 'dshc-sr';
        live.setAttribute('role', 'status');
        live.setAttribute('aria-live', 'polite');

        document.head.append(style);
        document.body.append(live, indicator);

        ctx.effect(() => () => {
          style.remove();
          indicator.remove();
          live.remove();
          window.clearTimeout(announceTimer);
          window.clearTimeout(suppressTimer);
          cancelDrag();
        }, 'dsh-config resources');

        /** @param {string} text */
        function announce(text) {
          window.clearTimeout(announceTimer);
          live.textContent = '';
          announceTimer = window.setTimeout(() => {
            live.textContent = text;
          }, 30);
        }

        /** @returns {Array<{ id: string, entry: object, index: number, order: number }>} */
        function readEntries() {
          if (typeof ctx.slots.entries !== 'function') return [];
          const entries = ctx.slots.entries('settings.section') ?? [];
          const rows = [];
          entries.forEach((entry, index) => {
            const id = entry?.options?.id;
            if (typeof id !== 'string' || id.length === 0 || id === NUDGE_ID) return;
            const order = typeof entry.options.order === 'number' ? entry.options.order : 0;
            rows.push({ id, entry, index, order });
          });
          rows.sort((left, right) => left.order - right.order || left.index - right.index);
          return rows;
        }

        /**
         * Bump the slot version without leaving a row behind: the Settings shell
         * recomputes its rail only when `settings.section` changes version, so a
         * register/dispose pair in one tick refreshes it with the new orders.
         */
        function nudgeVersion() {
          if (typeof ctx.slots.register !== 'function') return;
          try {
            const dispose = ctx.slots.register({
              name: 'settings.section',
              id: NUDGE_ID,
              order: -1,
              locale: NS,
            }, Noop);
            if (typeof dispose === 'function') dispose();
          } catch {
            // The slot may be tearing down; the next registration recomputes.
          }
        }

        /**
         * Merge the saved ids with the live ones: saved ids keep their relative
         * order and any category that appeared later goes to the end.
         * @param {string[]} preferred
         * @param {string[]} liveIds
         * @returns {string[]}
         */
        function mergeOrder(preferred, liveIds) {
          const available = new Set(liveIds);
          const result = [];
          const seen = new Set();
          for (const id of preferred) {
            if (available.has(id) && !seen.has(id)) {
              seen.add(id);
              result.push(id);
            }
          }
          for (const id of liveIds) {
            if (!seen.has(id)) {
              seen.add(id);
              result.push(id);
            }
          }
          return result;
        }

        /** Apply the saved order to the live registrations, then refresh the rail. */
        function syncOrder() {
          if (saved.length === 0) return;
          const rows = readEntries();
          if (rows.length === 0) return;
          const target = mergeOrder(saved, rows.map((row) => row.id));
          const byId = new Map(rows.map((row) => [row.id, row.entry]));
          let changed = false;
          target.forEach((id, index) => {
            const entry = byId.get(id);
            if (entry !== undefined && entry.options.order !== index) {
              entry.options.order = index;
              changed = true;
            }
          });
          if (changed) nudgeVersion();
        }

        /** @param {string[]} order */
        function persist(order) {
          saveChain = saveChain.then(async () => {
            try {
              const response = await fetch(`${ROUTE}/settings`, {
                method: 'POST',
                headers: { 'content-type': 'application/json', [HEADER]: '1' },
                body: JSON.stringify({ settingsOrder: order }),
              });
              if (!response.ok) throw new Error(`HTTP ${response.status}`);
            } catch (error) {
              console.warn(`[dsh-config] ${t('saveError')}`, error);
            }
          });
        }

        /** Load the durable order once; failures leave the shipped order intact. */
        async function loadOrder() {
          try {
            const response = await fetch(`${ROUTE}/settings`, {
              headers: { [HEADER]: '1' },
              cache: 'no-store',
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const payload = await response.json();
            const order = payload?.data?.settingsOrder;
            if (!Array.isArray(order)) return;
            saved = order.filter((id) => typeof id === 'string' && id.length > 0);
            syncOrder();
          } catch (error) {
            console.warn(`[dsh-config] ${t('loadError')}`, error);
          }
        }

        // ------------------------------------------------------------------
        // GitHub folder installs: the shipped Add plugin dialog only accepts a
        // repository or a tarball. A tree URL naming a folder is resolved by the
        // Host into a local package directory, then handed to the same install
        // pipeline, so the dialog keeps its progress and error screens.
        // ------------------------------------------------------------------

        /** One failed Host resolve, with the code the route answered. */
        class GithubSpecError extends Error {
          constructor(code) {
            super(code);
            this.code = code;
          }
        }

        /** Resolved folder paths by URL, shared by the inspect and install calls. */
        const githubPaths = new Map();

        /** @param {unknown} error @returns {{ aborted?: true, problem?: string, reason?: string }} */
        function describeGithubFailure(error) {
          if (error?.name === 'AbortError') return { aborted: true };
          const code = typeof error?.code === 'string' ? error.code : 'network';
          if (code === 'invalid-url') return { problem: 'invalid-spec', reason: t('github.invalid') };
          if (code === 'not-found') return { problem: 'not-found', reason: t('github.notFound') };
          if (code === 'not-a-package') return { problem: 'not-a-package', reason: t('github.notPackage') };
          if (code === 'rate-limited') return { problem: 'unknown', reason: t('github.rateLimited') };
          if (code === 'too-large') return { problem: 'unknown', reason: t('github.tooLarge') };
          if (code === 'unsupported-entry') return { problem: 'unknown', reason: t('github.unsupported') };
          return { problem: 'unknown', reason: t('github.network') };
        }

        /**
         * Ask the Host to materialize a GitHub folder.
         * @param {string} url Folder URL.
         * @param {AbortSignal} [signal] Caller cancellation.
         * @returns {Promise<string>} Local package path.
         */
        async function downloadGithubFolder(url, signal) {
          const response = await fetch(`${ROUTE}/github`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', [HEADER]: '1' },
            body: JSON.stringify({ url }),
            signal,
          });
          let payload = null;
          try {
            payload = await response.json();
          } catch {
            payload = null;
          }
          if (!response.ok || payload?.ok !== true || typeof payload?.data?.path !== 'string') {
            const code = typeof payload?.error === 'string'
              ? payload.error
              : response.status === 404 ? 'not-found' : 'network';
            throw new GithubSpecError(code);
          }
          return payload.data.path;
        }

        /**
         * Translate a GitHub folder URL into the local path the manager installs.
         * Any other spec passes through untouched.
         * @param {unknown} spec The spec as typed.
         * @param {AbortSignal} [signal] Caller cancellation.
         * @returns {Promise<{ installSpec?: string, aborted?: true, problem?: string, reason?: string }>}
         */
        async function resolveGithubSpec(spec, signal) {
          if (typeof spec !== 'string' || !GITHUB_SPEC.test(spec.trim())) return { installSpec: spec };
          const key = spec.trim();
          let pending = githubPaths.get(key);
          if (pending === undefined) {
            pending = downloadGithubFolder(key, signal);
            githubPaths.set(key, pending);
            pending.catch(() => {
              if (githubPaths.get(key) === pending) githubPaths.delete(key);
            });
          }
          try {
            return { installSpec: await pending };
          } catch (error) {
            return describeGithubFailure(error);
          }
        }

        if (typeof ctx.inject === 'function') {
          ctx.inject(['remote', 'remote.pluginManager'], (scope) => {
            const service = scope.remote?.pluginManager;
            if (service === undefined || service === null) return;
            scope.effect(() => {
              const restores = [];
              /** Replace one namespace method getter, preserving the caller binding. */
              const wrap = (method, build) => {
                const descriptor = Object.getOwnPropertyDescriptor(service, method);
                if (descriptor === undefined || typeof descriptor.get !== 'function') return;
                const originalGet = descriptor.get;
                const getter = function wrappedRemoteMethod() {
                  return build(originalGet.call(this));
                };
                Object.defineProperty(service, method, {
                  configurable: true,
                  enumerable: descriptor.enumerable ?? true,
                  get: getter,
                });
                restores.push(() => {
                  const current = Object.getOwnPropertyDescriptor(service, method);
                  if (current?.get === getter) Object.defineProperty(service, method, descriptor);
                });
              };

              wrap('inspect', (invoke) => async (spec, options, signal) => {
                const resolved = await resolveGithubSpec(spec, signal);
                if (resolved.installSpec === undefined) {
                  if (resolved.aborted) {
                    return { ok: false, error: { code: 'cancelled', message: t('github.cancelled') } };
                  }
                  return {
                    ok: true,
                    value: { status: 'refused', problem: resolved.problem, reason: resolved.reason },
                  };
                }
                return invoke(resolved.installSpec, options, signal);
              });

              wrap('installBundle', (invoke) => async (spec, options) => {
                const resolved = await resolveGithubSpec(spec);
                if (resolved.installSpec === undefined) {
                  return {
                    ok: false,
                    error: { code: resolved.problem ?? 'invalid-spec', message: resolved.reason ?? t('github.network') },
                  };
                }
                return invoke(resolved.installSpec, options);
              });

              return () => {
                for (const restore of restores.reverse()) restore();
              };
            }, 'dsh-config GitHub folder installs');
          });
        }

        // ------------------------------------------------------------------
        // Composer model caption: next to the model name the composer repeats the
        // reasoning effort, which reads "Predeterminado" for the provider
        // default. That adds nothing to the box where we write, so it is hidden
        // while the choice stays available in the model menu.
        // ------------------------------------------------------------------
        ctx.effect(() => {
          const HIDE = 'dshc-hide-caption';
          const tModel = ctx.locale.bind('model');
          let bar = null;
          let bodyObserver = null;
          let barObserver = null;
          let scheduled = false;
          let caption = null;

          /** Undo the caption override. */
          function restore() {
            if (caption !== null) {
              caption.classList.remove(HIDE);
              caption = null;
            }
          }

          /** Coalesce the frequent composer mutations into one check per frame. */
          function schedule() {
            if (scheduled) return;
            scheduled = true;
            requestAnimationFrame(() => {
              scheduled = false;
              sync();
            });
          }

          /** Hide the caption only while it carries the provider-default name. */
          function sync() {
            if (bar !== null && !bar.isConnected) {
              barObserver?.disconnect();
              barObserver = null;
              bar = null;
            }
            if (bar === null) {
              attachBar();
              return;
            }
            const slot = bar.querySelector('[data-slot="conversation.input.model"]');
            const next = slot === null ? null : slot.querySelector('[class*="triggerEffort"]');
            const defaultLabel = tModel('effort.providerDefault').trim();
            const isDefault = next !== null
              && defaultLabel !== ''
              && defaultLabel !== 'effort.providerDefault'
              && next.textContent?.trim() === defaultLabel;
            if (!isDefault) {
              restore();
              return;
            }
            if (caption !== next) {
              restore();
              caption = next;
              next.classList.add(HIDE);
            }
          }

          /** Watch the resident composer bar, waiting for it when it is not mounted yet. */
          function attachBar() {
            const next = document.querySelector('[data-slot="conversation.composer.bar"]');
            if (next === null) {
              if (bodyObserver === null) {
                bodyObserver = new MutationObserver(() => {
                  if (document.querySelector('[data-slot="conversation.composer.bar"]') !== null) {
                    bodyObserver?.disconnect();
                    bodyObserver = null;
                    attachBar();
                  }
                });
                bodyObserver.observe(document.body, { childList: true, subtree: true });
              }
              return;
            }
            bodyObserver?.disconnect();
            bodyObserver = null;
            bar = next;
            barObserver = new MutationObserver(schedule);
            barObserver.observe(bar, {
              childList: true,
              subtree: true,
              characterData: true,
              attributes: true,
              attributeFilter: ['class'],
            });
            sync();
          }

          const offLocale = ctx.locale.subscribe(schedule);
          attachBar();
          return () => {
            offLocale();
            bodyObserver?.disconnect();
            barObserver?.disconnect();
            restore();
          };
        }, 'dsh-config composer default effort');

        /**
         * @param {HTMLElement} dialog
         * @returns {HTMLElement | null} the rail list that holds the category buttons.
         */
        function navListOf(dialog) {
          const nav = Array.from(dialog.children).find((child) => child.tagName === 'NAV');
          if (!(nav instanceof HTMLElement)) return null;
          const list = Array.from(nav.children).find((child) => child.tagName === 'DIV');
          return list instanceof HTMLElement ? list : null;
        }

        /** @param {HTMLElement} list @returns {HTMLElement[]} */
        function cellButtons(list) {
          return Array.from(list.children).filter((child) => child.tagName === 'BUTTON');
        }

        /** @param {HTMLElement} list @returns {boolean} */
        function isHorizontal(list) {
          return window.getComputedStyle(list).flexDirection.startsWith('row');
        }

        /** @param {PointerEvent} event */
        function onPointerDown(event) {
          if (event.defaultPrevented || event.button !== 0 || event.isPrimary === false) return;
          const target = event.target;
          if (!(target instanceof Element)) return;
          const cell = target.closest('button');
          if (!(cell instanceof HTMLElement)) return;
          const dialog = cell.closest(DIALOG);
          if (!(dialog instanceof HTMLElement)) return;
          const list = navListOf(dialog);
          if (list === null || cell.parentElement !== list) return;

          cancelDrag();
          const rect = cell.getBoundingClientRect();
          drag = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            cell,
            list,
            moved: false,
            grabX: event.clientX - rect.left,
            grabY: event.clientY - rect.top,
            ids: null,
            cellIndex: -1,
            insertIndex: 0,
            ghost: null,
          };
          window.addEventListener('pointermove', onPointerMove, true);
          window.addEventListener('pointerup', onPointerUp, true);
          window.addEventListener('pointercancel', onPointerCancel, true);
          window.addEventListener('keydown', onDragKeyDown, true);
          window.addEventListener('blur', cancelDrag, true);
        }

        /** @returns {boolean} whether the drag visuals could be created. */
        function startDrag() {
          if (drag === null) return false;
          const cells = cellButtons(drag.list);
          const rows = readEntries();
          if (rows.length === 0 || rows.length !== cells.length) return false;
          const index = cells.indexOf(drag.cell);
          if (index < 0) return false;

          drag.ids = rows.map((row) => row.id);
          drag.cellIndex = index;
          drag.insertIndex = index;

          const rect = drag.cell.getBoundingClientRect();
          const ghost = drag.cell.cloneNode(true);
          ghost.classList.add('dshc-ghost');
          ghost.removeAttribute('aria-current');
          ghost.removeAttribute('data-modal-autofocus');
          ghost.setAttribute('aria-hidden', 'true');
          ghost.tabIndex = -1;
          ghost.style.width = `${rect.width}px`;
          ghost.style.height = `${rect.height}px`;
          ghost.style.left = `${rect.left}px`;
          ghost.style.top = `${rect.top}px`;
          drag.ghost = ghost;
          document.body.append(ghost);

          drag.cell.style.opacity = '0.35';
          document.body.classList.add('dshc-dragging');
          indicator.hidden = false;
          return true;
        }

        /** @param {PointerEvent} event */
        function updateGhost(event) {
          if (drag === null || drag.ghost === null) return;
          drag.ghost.style.left = `${event.clientX - drag.grabX}px`;
          drag.ghost.style.top = `${event.clientY - drag.grabY}px`;
        }

        /** @param {PointerEvent} event */
        function updateIndicator(event) {
          if (drag === null) return;
          const listRect = drag.list.getBoundingClientRect();
          const horizontal = isHorizontal(drag.list);
          const others = cellButtons(drag.list).filter((cell) => cell !== drag.cell);
          let index = 0;
          for (const cell of others) {
            const rect = cell.getBoundingClientRect();
            if (horizontal ? event.clientX > rect.left + rect.width / 2 : event.clientY > rect.top + rect.height / 2) {
              index += 1;
            }
          }
          drag.insertIndex = index;

          if (horizontal) {
            const boundary = index < others.length
              ? others[index].getBoundingClientRect().left
              : (others.length > 0 ? others[others.length - 1].getBoundingClientRect().right : listRect.left);
            indicator.style.left = `${Math.max(listRect.left, Math.min(listRect.right - 2, boundary - 1))}px`;
            indicator.style.top = `${listRect.top + 4}px`;
            indicator.style.width = '2px';
            indicator.style.height = `${Math.max(0, listRect.height - 8)}px`;
          } else {
            const boundary = index < others.length
              ? others[index].getBoundingClientRect().top
              : (others.length > 0 ? others[others.length - 1].getBoundingClientRect().bottom : listRect.top);
            indicator.style.left = `${listRect.left + 8}px`;
            indicator.style.top = `${Math.max(listRect.top, Math.min(listRect.bottom - 2, boundary - 1))}px`;
            indicator.style.width = `${Math.max(0, listRect.width - 16)}px`;
            indicator.style.height = '2px';
          }
        }

        /** @param {PointerEvent} event */
        function autoScroll(event) {
          if (drag === null) return;
          const rect = drag.list.getBoundingClientRect();
          const edge = 28;
          if (isHorizontal(drag.list)) {
            if (event.clientX < rect.left + edge) drag.list.scrollLeft -= 12;
            else if (event.clientX > rect.right - edge) drag.list.scrollLeft += 12;
          } else if (event.clientY < rect.top + edge) {
            drag.list.scrollTop -= 12;
          } else if (event.clientY > rect.bottom - edge) {
            drag.list.scrollTop += 12;
          }
        }

        /** @param {PointerEvent} event */
        function onPointerMove(event) {
          if (drag === null || event.pointerId !== drag.pointerId) return;
          if (!drag.cell.isConnected) {
            cancelDrag();
            return;
          }
          if (!drag.moved) {
            const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
            if (distance < DRAG_THRESHOLD) return;
            if (!startDrag()) {
              cancelDrag();
              return;
            }
            drag.moved = true;
          }
          event.preventDefault();
          updateGhost(event);
          updateIndicator(event);
          autoScroll(event);
        }

        /** Move the dragged category to its last insertion index and store the result. */
        function commitDrag() {
          if (drag === null || !Array.isArray(drag.ids)) return;
          const id = drag.ids[drag.cellIndex];
          if (typeof id !== 'string') return;
          const rest = drag.ids.filter((candidate) => candidate !== id);
          const index = Math.max(0, Math.min(drag.insertIndex, rest.length));
          rest.splice(index, 0, id);
          saved = rest;
          syncOrder();
          persist(rest);
          announce(
            t('moved')
              .replace('{position}', String(index + 1))
              .replace('{total}', String(rest.length)),
          );
        }

        /** @param {PointerEvent} event */
        function onPointerUp(event) {
          if (drag === null || event.pointerId !== drag.pointerId) return;
          if (drag.moved) {
            event.preventDefault();
            commitDrag();
            suppressClick = true;
            window.clearTimeout(suppressTimer);
            suppressTimer = window.setTimeout(() => {
              suppressClick = false;
            }, 400);
          }
          cancelDrag();
        }

        function onPointerCancel() {
          cancelDrag();
        }

        /** @param {KeyboardEvent} event */
        function onDragKeyDown(event) {
          if (event.key === 'Escape') cancelDrag();
        }

        /**
         * Remove every drag artifact and the temporary window listeners.
         * Safe to call whenever a drag is not in progress.
         */
        function cancelDrag() {
          window.removeEventListener('pointermove', onPointerMove, true);
          window.removeEventListener('pointerup', onPointerUp, true);
          window.removeEventListener('pointercancel', onPointerCancel, true);
          window.removeEventListener('keydown', onDragKeyDown, true);
          window.removeEventListener('blur', cancelDrag, true);
          if (drag === null) return;
          if (drag.ghost !== null) drag.ghost.remove();
          drag.cell.style.opacity = '';
          document.body.classList.remove('dshc-dragging');
          indicator.hidden = true;
          drag = null;
        }

        /** @param {MouseEvent} event */
        function onDocumentClick(event) {
          if (!suppressClick) return;
          suppressClick = false;
          event.preventDefault();
          event.stopPropagation();
        }

        /** Alt+Arrow moves the focused category for keyboard users. */
        function onKeyDown(event) {
          if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
          const target = event.target;
          if (!(target instanceof Element) || target.tagName !== 'BUTTON') return;
          const dialog = target.closest(DIALOG);
          if (!(dialog instanceof HTMLElement)) return;
          const list = navListOf(dialog);
          if (list === null || target.parentElement !== list) return;
          const cells = cellButtons(list);
          const index = cells.indexOf(target);
          if (index < 0) return;
          const rows = readEntries();
          if (rows.length !== cells.length) return;
          const next = index + (event.key === 'ArrowUp' ? -1 : 1);
          if (next < 0 || next >= rows.length) return;
          event.preventDefault();
          const ids = rows.map((row) => row.id);
          const id = ids[index];
          ids.splice(index, 1);
          ids.splice(next, 0, id);
          saved = ids;
          syncOrder();
          persist(ids);
          announce(
            t('moved')
              .replace('{position}', String(next + 1))
              .replace('{total}', String(ids.length)),
          );
        }

        ctx.effect(() => {
          document.addEventListener('pointerdown', onPointerDown, true);
          document.addEventListener('click', onDocumentClick, true);
          document.addEventListener('keydown', onKeyDown, true);
          return () => {
            document.removeEventListener('pointerdown', onPointerDown, true);
            document.removeEventListener('click', onDocumentClick, true);
            document.removeEventListener('keydown', onKeyDown, true);
            cancelDrag();
          };
        }, 'dsh-config drag layer');

        if (typeof ctx.slots.subscribe === 'function') {
          ctx.effect(() => {
            const off = ctx.slots.subscribe('settings.section', () => {
              syncOrder();
            });
            return () => off();
          }, 'dsh-config section order');
        }

        void loadOrder();
      },
    };
  },
});
