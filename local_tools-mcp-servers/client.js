window.__ModuleLoader__.load({
  id: '@local/tools-mcp-servers',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = '@local/tools-mcp-servers';
    const ENDPOINT = '/dsh-tools-mcp';
    const LATEST_PROTOCOL = '2025-06-18';

    const STRINGS = {
      en: {
        nav: 'Tools',
        title: 'Tool servers',
        subtitle: 'Give your agents extra capabilities through MCP servers.',
        add: 'Add',
        newServer: 'New server',
        editServer: 'Edit server',
        formSubtitle: 'Extend what your agents can do with external tools.',
        name: 'Name',
        namePlaceholder: 'e.g. Filesystem',
        transport: 'Transport',
        transportStdio: 'Local command',
        transportHttp: 'Remote URL',
        command: 'Command',
        commandPlaceholder: 'e.g. npx',
        args: 'Arguments',
        argsPlaceholder: '-y @modelcontextprotocol/server-filesystem /path',
        env: 'Environment',
        addVar: 'Add var',
        noVars: 'No environment variables configured.',
        envHint: 'Values are local to this device.',
        autoConnect: 'Auto-connect on startup',
        url: 'URL',
        urlPlaceholder: 'https://example.com/mcp',
        auth: 'Authentication',
        authNone: 'None',
        authBearer: 'Bearer token',
        token: 'Token',
        tokenUnchanged: '•••••• (unchanged)',
        cancel: 'Cancel',
        save: 'Save',
        connect: 'Connect',
        disconnect: 'Disconnect',
        edit: 'Edit',
        remove: 'Delete',
        deleteQuestion: 'Delete this server?',
        empty: 'No tool servers configured yet.',
        emptyHint: 'Add a local command or a remote URL to get started.',
        toolOne: 'tool',
        toolMany: 'tools',
        statusConnected: 'Connected',
        statusConnecting: 'Connecting…',
        statusDisconnected: 'Disconnected',
        statusError: 'Error',
        olderProtocol: 'Connected using an older MCP version. Most tools should work, but a few newer capabilities may be limited.',
        loading: 'Loading…',
        removeVar: 'Remove',
        nameRequired: 'A name is required.',
        commandRequired: 'A command is required.',
        urlRequired: 'A URL is required.',
        tokenRequired: 'A token is required.',
        actions: 'Server actions',
        backToServers: 'Back to the server list',
        reveal: 'Reveal values',
        hide: 'Hide values',
        permissions: 'Tool permissions',
        permissionsHint: 'Always allow runs the tool without asking. Requires approval pauses before every call. Deny removes the tool from your agents entirely.',
        groupRead: 'Read-only tools',
        groupWrite: 'Write/delete tools',
        groupOther: 'Other tools',
        permAllow: 'Always allow',
        permAsk: 'Requires approval',
        permDeny: 'Deny',
        permMixed: 'Mixed',
        permGroupLabel: 'Permission for this block',
        connnectToDiscover: 'Connect the server to discover its tools.',
        lastKnownTools: 'Last known tool list. Connect the server to refresh it.',
      },
      es: {
        nav: 'Herramientas',
        title: 'Servidores de herramientas',
        subtitle: 'Da a tus agentes capacidades extra mediante servidores MCP.',
        add: 'Añadir',
        newServer: 'Nuevo servidor',
        editServer: 'Editar servidor',
        formSubtitle: 'Amplía lo que pueden hacer tus agentes con herramientas externas.',
        name: 'Nombre',
        namePlaceholder: 'p. ej. Filesystem',
        transport: 'Transporte',
        transportStdio: 'Comando local',
        transportHttp: 'URL remota',
        command: 'Comando',
        commandPlaceholder: 'p. ej. npx',
        args: 'Argumentos',
        argsPlaceholder: '-y @modelcontextprotocol/server-filesystem /ruta',
        env: 'Entorno',
        addVar: 'Añadir variable',
        noVars: 'No hay variables de entorno configuradas.',
        envHint: 'Los valores son locales en este dispositivo.',
        autoConnect: 'Conectar al iniciar',
        url: 'URL',
        urlPlaceholder: 'https://ejemplo.com/mcp',
        auth: 'Autenticación',
        authNone: 'Ninguna',
        authBearer: 'Token Bearer',
        token: 'Token',
        tokenUnchanged: '•••••• (sin cambios)',
        cancel: 'Cancelar',
        save: 'Guardar',
        connect: 'Conectar',
        disconnect: 'Desconectar',
        edit: 'Editar',
        remove: 'Eliminar',
        deleteQuestion: '¿Eliminar este servidor?',
        empty: 'Todavía no hay servidores configurados.',
        emptyHint: 'Añade un comando local o una URL remota para empezar.',
        toolOne: 'herramienta',
        toolMany: 'herramientas',
        statusConnected: 'Conectado',
        statusConnecting: 'Conectando…',
        statusDisconnected: 'Desconectado',
        statusError: 'Error',
        olderProtocol: 'Conectado con una versión anterior de MCP. La mayoría de las herramientas deberían funcionar, pero algunas capacidades nuevas pueden estar limitadas.',
        loading: 'Cargando…',
        removeVar: 'Quitar',
        nameRequired: 'El nombre es obligatorio.',
        commandRequired: 'El comando es obligatorio.',
        urlRequired: 'La URL es obligatoria.',
        tokenRequired: 'El token es obligatorio.',
        actions: 'Acciones del servidor',
        backToServers: 'Volver a la lista de servidores',
        reveal: 'Mostrar valores',
        hide: 'Ocultar valores',
        permissions: 'Permisos de herramientas',
        permissionsHint: 'Permitir siempre ejecuta la herramienta sin preguntar. Requiere aprobación te pide confirmar antes de cada llamada. Denegar retira la herramienta de tus agentes por completo.',
        groupRead: 'Herramientas de solo lectura',
        groupWrite: 'Herramientas de escritura/eliminación',
        groupOther: 'Otras herramientas',
        permAllow: 'Permitir siempre',
        permAsk: 'Requiere aprobación',
        permDeny: 'Denegar',
        permMixed: 'Mixto',
        permGroupLabel: 'Permiso para este bloque',
        connnectToDiscover: 'Conecta el servidor para descubrir sus herramientas.',
        lastKnownTools: 'Última lista conocida. Conecta el servidor para actualizarla.',
      },
    };

    const CSS = `
.tms-root{display:flex;flex-direction:column;gap:16px;min-width:0;padding-top:4px;font-size:14px;line-height:20px;color:var(--dsw-alias-label-primary)}
.tms-shell{display:flex;flex-direction:column;gap:14px;padding:16px;border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-layer-1);box-sizing:border-box;min-width:0}
.tms-head{display:flex;align-items:flex-start;gap:12px;min-width:0}
.tms-mark{width:34px;height:34px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:10px;color:var(--dsw-alias-brand-primary);background:color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent)}
.tms-headtext{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.tms-title{margin:0;font-size:15px;font-weight:600;line-height:22px}
.tms-sub{margin:0;font-size:13px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.tms-add{flex:none;display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 14px;border-radius:999px;border:1px solid transparent;background:var(--dsw-alias-brand-primary);color:#fff;font:inherit;font-size:13px;font-weight:500;cursor:pointer}
.tms-add:hover{filter:brightness(1.05)}
.tms-add:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.tms-list{display:flex;flex-direction:column;gap:10px;min-width:0}
.tms-row{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-base);padding:12px 14px;display:flex;gap:10px;align-items:flex-start;min-width:0}
.tms-row-main{flex:1;min-width:0;display:flex;gap:10px;align-items:flex-start}
.tms-dot{width:8px;height:8px;border-radius:50%;flex:none;margin-top:6px;background:var(--dsw-alias-state-idle-primary)}
.tms-dot.is-connected{background:var(--dsw-alias-state-success-primary)}
.tms-dot.is-error{background:var(--dsw-alias-state-error-primary)}
.tms-dot.is-connecting{background:var(--dsw-alias-brand-primary);animation:tms-pulse 1.1s ease-in-out infinite}
@keyframes tms-pulse{0%,100%{opacity:1}50%{opacity:.25}}
.tms-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.tms-nameline{display:flex;align-items:center;gap:8px;min-width:0;flex-wrap:wrap}
.tms-name{font-size:14px;font-weight:600;line-height:20px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tms-badge{flex:none;font-size:11px;line-height:16px;font-weight:500;padding:0 7px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);white-space:nowrap}
.tms-status{font-size:12.5px;line-height:17px;color:var(--dsw-alias-label-secondary)}
.tms-status.is-error{color:var(--dsw-alias-state-error-primary)}
.tms-target{margin-top:3px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11.5px;line-height:16px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tms-warning{margin-top:6px;font-size:12px;line-height:16px;color:var(--dsw-alias-state-warn-primary)}
.tms-rowerror{margin-top:6px;font-size:12px;line-height:16px;color:var(--dsw-alias-state-error-primary);white-space:pre-wrap;overflow-wrap:anywhere}
.tms-tools{margin-top:6px;display:flex;flex-wrap:wrap;gap:4px}
.tms-tool{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;line-height:16px;padding:0 6px;border-radius:5px;background:color-mix(in srgb, var(--dsw-alias-label-primary) 7%, transparent);color:var(--dsw-alias-label-secondary);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tms-more{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);padding:0 6px}
.tms-menuwrap{position:relative;flex:none}
.tms-kebab{width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;border-radius:6px;border:none;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.tms-kebab:hover{background:color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent);color:var(--dsw-alias-label-primary)}
.tms-kebab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.tms-menu{position:absolute;right:0;top:30px;z-index:20;min-width:168px;padding:4px;border-radius:10px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-overlay);box-shadow:0 10px 30px rgba(0,0,0,.16)}
.tms-menuitem{display:flex;width:100%;align-items:center;gap:8px;padding:7px 10px;border:none;border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;text-align:left;cursor:pointer}
.tms-menuitem:hover{background:color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent)}
.tms-menuitem.is-danger{color:var(--dsw-alias-state-error-primary)}
.tms-confirm{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px;padding:8px 10px;border-radius:8px;background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent);font-size:12.5px}
.tms-confirm span{flex:1;min-width:0}
.tms-empty{display:flex;flex-direction:column;align-items:center;gap:4px;padding:28px 16px;border:1px dashed var(--dsw-alias-border-l1);border-radius:12px;text-align:center}
.tms-empty-title{font-size:13.5px;font-weight:500}
.tms-empty-sub{font-size:12.5px;color:var(--dsw-alias-label-secondary)}
.tms-banner{display:flex;align-items:flex-start;gap:8px;padding:9px 12px;border-radius:10px;background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent);color:var(--dsw-alias-state-error-primary);font-size:12.5px;line-height:17px;overflow-wrap:anywhere}
.tms-banner button{margin-left:auto;flex:none;border:none;background:transparent;color:inherit;font:inherit;cursor:pointer;text-decoration:underline}
.tms-form{display:flex;flex-direction:column;gap:0;min-width:0}
.tms-formcard{border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-layer-1);display:flex;flex-direction:column;min-width:0}
.tms-formhead{display:flex;align-items:flex-start;gap:12px;padding:16px 18px;border-bottom:1px solid var(--dsw-alias-border-l1);border-radius:14px 14px 0 0}
.tms-formhead .tms-headtext{gap:2px}
.tms-back{width:30px;height:30px;flex:none;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer}
.tms-back:hover{background:color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent)}
.tms-fields{display:flex;flex-direction:column;gap:16px;padding:16px 18px}
.tms-field{display:flex;flex-direction:column;gap:6px;min-width:0}
.tms-label{font-size:13px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.tms-labelrow{display:flex;align-items:center;justify-content:space-between;gap:8px}
.tms-pill{height:24px;padding:0 10px;border-radius:999px;border:none;background:color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent);color:var(--dsw-alias-brand-primary);font:inherit;font-size:12px;font-weight:500;cursor:pointer}
.tms-pill:hover{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 20%, transparent)}
.tms-input,.tms-select{width:100%;box-sizing:border-box;height:38px;padding:0 12px;border-radius:9px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:13.5px;min-width:0}
.tms-input::placeholder{color:var(--dsw-alias-label-secondary);opacity:.75}
.tms-input:focus,.tms-select:focus{outline:none;border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 18%, transparent)}
.tms-input.is-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12.5px}
.tms-selectwrap{position:relative;display:flex;min-width:0}
.tms-select{appearance:none;-webkit-appearance:none;padding-right:36px;cursor:pointer}
.tms-chevron{position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--dsw-alias-label-secondary);display:flex}
.tms-hint{font-size:12px;line-height:16px;color:var(--dsw-alias-label-secondary)}
.tms-envlist{display:flex;flex-direction:column;gap:8px}
.tms-envrow{display:flex;gap:8px;align-items:center;min-width:0}
.tms-envrow .tms-input{height:34px}
.tms-envname{flex:0 0 38%}
.tms-envvalue{flex:1}
.tms-envremove{flex:none;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border:none;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.tms-envremove:hover{background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent);color:var(--dsw-alias-state-error-primary)}
.tms-check{display:flex;align-items:center;gap:9px;font-size:13px;line-height:18px;cursor:pointer;user-select:none}
.tms-check input{width:16px;height:16px;margin:0;accent-color:var(--dsw-alias-brand-primary);cursor:pointer}
.tms-formfoot{position:sticky;bottom:0;padding:14px 18px;display:flex;align-items:center;justify-content:flex-end;gap:8px;border-top:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);border-radius:0 0 14px 14px}
.tms-formerror{flex:1;min-width:0;font-size:12.5px;color:var(--dsw-alias-state-error-primary);overflow-wrap:anywhere}
.tms-btn{height:34px;padding:0 14px;border-radius:9px;font:inherit;font-size:13px;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:7px}
.tms-btn:disabled{opacity:.55;cursor:default}
.tms-btn-primary{border:1px solid transparent;background:var(--dsw-alias-brand-primary);color:#fff}
.tms-btn-ghost{border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-primary)}
.tms-btn-ghost:hover{background:color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent)}
.tms-btn-danger{border:1px solid transparent;background:var(--dsw-alias-state-error-primary);color:#fff}
.tms-spinner{width:13px;height:13px;border-radius:50%;border:2px solid rgba(255,255,255,.45);border-top-color:#fff;animation:tms-spin .8s linear infinite}
@keyframes tms-spin{to{transform:rotate(360deg)}}
.tms-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
@media (prefers-reduced-motion: reduce){.tms-dot.is-connecting{animation:none}.tms-spinner{animation-duration:2s}}
.tms-reveal{height:24px;padding:0 2px;border:none;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer;text-decoration:underline;text-underline-offset:2px}
.tms-reveal:hover{color:var(--dsw-alias-label-primary)}
.tms-labelextras{display:flex;align-items:center;gap:10px}
.tms-tokenrow{display:flex;align-items:center;gap:8px}
.tms-tokenrow .tms-input{flex:1;min-width:0}
.tms-remove{flex:none;height:28px;padding:0 6px;border:none;border-radius:6px;background:transparent;color:var(--dsw-alias-state-error-primary);font:inherit;font-size:12.5px;cursor:pointer}
.tms-remove:hover{background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent)}
.tms-namelink{padding:0;border:none;background:transparent;color:inherit;font:inherit;font-size:14px;font-weight:600;line-height:20px;cursor:pointer;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tms-namelink:hover{text-decoration:underline;text-underline-offset:2px}
.tms-backlink{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;padding:0;border:none;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12.5px;cursor:pointer}
.tms-backlink:hover{color:var(--dsw-alias-label-primary)}
.tms-detail{display:flex;flex-direction:column;gap:14px;min-width:0}
.tms-detailhead{display:flex;align-items:center;gap:10px;min-width:0;padding-top:2px}
.tms-detailname{display:flex;flex-direction:column;gap:1px;min-width:0}
.tms-detailname strong{font-size:15px;font-weight:600;line-height:21px}
.tms-sectiontitle{margin:0;font-size:14px;font-weight:600;line-height:20px}
.tms-intro{margin:0;font-size:12.5px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.tms-groups{display:flex;flex-direction:column;gap:10px}
.tms-group{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);overflow:hidden}
.tms-grouphead{display:flex;align-items:center;gap:8px;padding:10px 12px;min-width:0}
.tms-grouphead.is-collapsed{border-bottom:none}
.tms-groupchevron{flex:none;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;border:none;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.tms-groupchevron:hover{background:color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent)}
.tms-grouptitle{flex:1;min-width:0;font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tms-count{flex:none;font-size:11px;line-height:16px;padding:0 6px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary)}
.tms-groupsel{flex:none;height:26px;max-width:172px;padding:0 22px 0 8px;border-radius:6px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;appearance:none;-webkit-appearance:none;cursor:pointer;background-image:linear-gradient(45deg,transparent 50%,currentColor 50%),linear-gradient(135deg,currentColor 50%,transparent 50%);background-position:calc(100% - 12px) 11px,calc(100% - 8px) 11px;background-size:4px 4px,4px 4px;background-repeat:no-repeat}
.tms-permrow{display:flex;align-items:center;gap:12px;padding:8px 12px;border-top:1px solid var(--dsw-alias-border-l1);min-width:0}
.tms-permname{flex:1;min-width:0;font-size:12.5px;color:var(--dsw-alias-label-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tms-seg{flex:none;display:inline-flex;align-items:center;gap:2px}
.tms-segbtn{width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;border:none;border-radius:999px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.tms-segbtn:hover{background:color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent)}
.tms-segbtn.is-active{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 16%, transparent);color:var(--dsw-alias-brand-primary)}
.tms-segbtn.is-active.is-deny{background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 14%, transparent);color:var(--dsw-alias-state-error-primary)}
.tms-segbtn.is-active.is-ask{background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 16%, transparent);color:var(--dsw-alias-state-warn-primary)}
.tms-segbtn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
`.trim();

    /**
     * Call one Settings route and unwrap its envelope.
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
          { 'x-dsh-tools': '1' },
          opts.body === undefined ? {} : { 'content-type': 'application/json' },
        ),
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      });
      const text = await response.text();
      let payload = null;
      try {
        payload = text.length > 0 ? JSON.parse(text) : null;
      } catch (error) {
        payload = null;
      }
      if (!response.ok || (payload && payload.ok === false)) {
        throw new Error((payload && payload.error) || 'HTTP ' + response.status);
      }
      return payload ? payload.data : null;
    }

    /** @param {number} count Tool count. @param {Function} t Translator. */
    function toolCountLabel(count, t) {
      return count + ' ' + (count === 1 ? t('toolOne') : t('toolMany'));
    }

    /** @returns {string} The status caption for one server view. */
    function statusCaption(server, t) {
      switch (server.status) {
        case 'connected':
          return t('statusConnected') + ' · ' + toolCountLabel(server.toolCount, t);
        case 'connecting':
          return t('statusConnecting');
        case 'error':
          return t('statusError');
        default:
          return t('statusDisconnected');
      }
    }

    /** @param {string} status Server status. @returns {string} Dot class suffix. */
    function dotClass(status) {
      if (status === 'connected') return ' is-connected';
      if (status === 'error') return ' is-error';
      if (status === 'connecting') return ' is-connecting';
      return '';
    }

    function IconGrid(props) {
      const size = props.size || 18;
      return h('svg', {
        width: size, height: size, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': 'true',
      },
      h('rect', { x: 2.5, y: 2.5, width: 6, height: 6, rx: 1.6, stroke: 'currentColor', strokeWidth: 1.5 }),
      h('rect', { x: 11.5, y: 2.5, width: 6, height: 6, rx: 1.6, stroke: 'currentColor', strokeWidth: 1.5 }),
      h('rect', { x: 2.5, y: 11.5, width: 6, height: 6, rx: 1.6, stroke: 'currentColor', strokeWidth: 1.5 }),
      h('rect', { x: 11.5, y: 11.5, width: 6, height: 6, rx: 1.6, stroke: 'currentColor', strokeWidth: 1.5 }));
    }

    function IconKebab() {
      return h('svg', { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'currentColor', 'aria-hidden': 'true' },
        h('circle', { cx: 8, cy: 3, r: 1.4 }),
        h('circle', { cx: 8, cy: 8, r: 1.4 }),
        h('circle', { cx: 8, cy: 13, r: 1.4 }));
    }

    function IconChevron() {
      return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' },
        h('path', { d: 'M4 6.5 8 10.5 12 6.5', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }));
    }

    function IconBack() {
      return h('svg', { width: 15, height: 15, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' },
        h('path', { d: 'M10.5 3.5 5.5 8l5 4.5', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }));
    }

    function IconPlus() {
      return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' },
        h('path', { d: 'M8 3v10M3 8h10', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' }));
    }

    function IconTrash() {
      return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' },
        h('path', { d: 'M3.5 4.5h9M6.5 4.5V3h3v1.5M5 4.5l.6 8h4.8l.6-8', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }));
    }

    function IconPlug() {
      return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' },
        h('path', { d: 'M6 2v3M10 2v3M4.5 5.5h7V9a3.5 3.5 0 0 1-7 0V5.5ZM8 12.5V14', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }));
    }

    function IconCheck() {
      return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' },
        h('path', { d: 'm3.5 8.5 3 3 6-7', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }));
    }

    function IconHand() {
      return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' },
        h('path', {
          d: 'M5.2 7.4V4.2a.9.9 0 0 1 1.8 0v2.6m0-3.2a.9.9 0 0 1 1.8 0v3.2m0-2.6a.9.9 0 0 1 1.8 0v4.6c0 2.3-1.6 3.7-3.7 3.7-1.6 0-2.6-.6-3.4-1.9L3 8.9a.9.9 0 0 1 1.5-1l.7 1',
          stroke: 'currentColor', strokeWidth: 1.25, strokeLinecap: 'round', strokeLinejoin: 'round',
        }));
    }

    function IconBan() {
      return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' },
        h('circle', { cx: 8, cy: 8, r: 5.2, stroke: 'currentColor', strokeWidth: 1.4 }),
        h('path', { d: 'M4.4 11.6 11.6 4.4', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }));
    }

    function IconShield() {
      return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' },
        h('path', {
          d: 'M8 2.2 13 4v3.7c0 2.7-2 4.9-5 6.1-3-1.2-5-3.4-5-6.1V4l5-1.8Z',
          stroke: 'currentColor', strokeWidth: 1.35, strokeLinejoin: 'round',
        }),
        h('path', { d: 'm5.9 8 1.5 1.5 2.8-3', stroke: 'currentColor', strokeWidth: 1.35, strokeLinecap: 'round', strokeLinejoin: 'round' }));
    }

    function IconChevronDown(props) {
      const open = props.open !== false;
      return h('svg', {
        width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true',
        style: { transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform .12s ease' },
      }, h('path', { d: 'M4 6.5 8 10.5 12 6.5', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }));
    }

    function IconPencil() {
      return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' },
        h('path', { d: 'M11 2.5 13.5 5 5.5 13H3v-2.5L11 2.5Z', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }));
    }

    /**
     * Root of the Settings page: list view and add/edit form.
     * @param {{t: Function}} props Injected translator.
     */
    function ToolsPage(props) {
      const t = props.t;
      const [servers, setServers] = React.useState([]);
      const [loading, setLoading] = React.useState(true);
      const [error, setError] = React.useState(null);
      const [view, setView] = React.useState({ kind: 'list' });
      const [busyId, setBusyId] = React.useState(null);
      const [confirmId, setConfirmId] = React.useState(null);

      const load = React.useCallback(async () => {
        try {
          const data = await request('/servers');
          setServers((data && data.servers) || []);
          setError(null);
        } catch (failure) {
          setError(String(failure && failure.message ? failure.message : failure));
        } finally {
          setLoading(false);
        }
      }, []);

      React.useEffect(() => {
        let alive = true;
        const tick = () => {
          if (!alive) return;
          load();
        };
        tick();
        const timer = setInterval(() => {
          if (!document.hidden) load();
        }, 4000);
        return () => {
          alive = false;
          clearInterval(timer);
        };
      }, [load]);

      const run = React.useCallback(async (id, operation) => {
        setBusyId(id);
        setError(null);
        try {
          const data = await operation();
          if (data && data.servers) setServers(data.servers);
          return true;
        } catch (failure) {
          setError(String(failure && failure.message ? failure.message : failure));
          return false;
        } finally {
          setBusyId(null);
        }
      }, []);

      const connect = (server) => run(server.id, () => request('/servers/' + encodeURIComponent(server.id) + '/connect', { method: 'POST' }));
      const disconnect = (server) => run(server.id, () => request('/servers/' + encodeURIComponent(server.id) + '/disconnect', { method: 'POST' }));
      const remove = async (server) => {
        const done = await run(server.id, () => request('/servers/' + encodeURIComponent(server.id), { method: 'DELETE' }));
        if (done) setConfirmId(null);
      };
      const setPermission = React.useCallback(async (server, names, value) => {
        const permissions = Object.assign({}, server.permissions || {});
        for (const name of names) permissions[name] = value;
        setServers((current) => current.map((entry) => (entry.id === server.id ? Object.assign({}, entry, { permissions: permissions }) : entry)));
        setError(null);
        try {
          const data = await request('/servers/' + encodeURIComponent(server.id) + '/permissions', {
            method: 'PUT',
            body: { permissions: permissions },
          });
          if (data && data.servers) setServers(data.servers);
        } catch (failure) {
          setError(String(failure && failure.message ? failure.message : failure));
        }
      }, []);

      const submit = async (payload) => {
        const editing = view.kind === 'form' && view.server !== null;
        const id = editing ? view.server.id : 'new';
        setBusyId(id);
        setError(null);
        try {
          const path = editing ? '/servers/' + encodeURIComponent(view.server.id) : '/servers';
          const data = await request(path, { method: editing ? 'PUT' : 'POST', body: payload });
          if (data && data.servers) setServers(data.servers);
          setView({ kind: 'list' });
          return null;
        } catch (failure) {
          return String(failure && failure.message ? failure.message : failure);
        } finally {
          setBusyId(null);
        }
      };

      if (view.kind === 'permissions') {
        const current = servers.find((entry) => entry.id === view.serverId) || view.server;
        return h('div', { className: 'tms-root' },
          h('style', null, CSS),
          error !== null ? h('div', { className: 'tms-banner' }, error, h('button', { type: 'button', onClick: () => setError(null) }, '×')) : null,
          h(PermissionsView, {
            t: t,
            server: current,
            onBack: () => { setError(null); setView({ kind: 'list' }); },
            onSet: (names, value) => setPermission(current, names, value),
          }));
      }

      if (view.kind === 'form') {
        return h('div', { className: 'tms-root' },
          h('style', null, CSS),
          error !== null ? h('div', { className: 'tms-banner' }, error, h('button', { type: 'button', onClick: () => setError(null) }, '×')) : null,
          h(ServerForm, {
            t: t,
            server: view.server,
            saving: busyId !== null,
            onCancel: () => { setError(null); setView({ kind: 'list' }); },
            onSubmit: submit,
          }));
      }

      return h('div', { className: 'tms-root' },
        h('style', null, CSS),
        error !== null ? h('div', { className: 'tms-banner' }, error, h('button', { type: 'button', onClick: () => setError(null) }, '×')) : null,
        h('div', { className: 'tms-shell' },
          h('div', { className: 'tms-head' },
            h('div', { className: 'tms-mark' }, h(IconGrid, { size: 18 })),
            h('div', { className: 'tms-headtext' },
              h('h2', { className: 'tms-title' }, t('title')),
              h('p', { className: 'tms-sub' }, t('subtitle'))),
            h('button', {
              type: 'button',
              className: 'tms-add',
              onClick: () => { setError(null); setView({ kind: 'form', server: null }); },
            }, h(IconPlus), t('add'))),
          loading && servers.length === 0
            ? h('div', { className: 'tms-empty' }, h('span', { className: 'tms-empty-sub' }, t('loading')))
            : servers.length === 0
              ? h('div', { className: 'tms-empty' },
                h('span', { className: 'tms-empty-title' }, t('empty')),
                h('span', { className: 'tms-empty-sub' }, t('emptyHint')))
              : h('div', { className: 'tms-list' }, servers.map((server) => h(ServerRow, {
                key: server.id,
                t: t,
                server: server,
                busy: busyId === server.id,
                confirm: confirmId === server.id,
                onConnect: () => connect(server),
                onDisconnect: () => disconnect(server),
                onEdit: () => { setError(null); setView({ kind: 'form', server: server }); },
                onPermissions: () => { setError(null); setView({ kind: 'permissions', serverId: server.id, server: server }); },
                onAskDelete: () => setConfirmId(server.id),
                onCancelDelete: () => setConfirmId(null),
                onDelete: () => remove(server),
              })))));
    }

    /**
     * One server card.
     * @param {Record<string, any>} props Row props.
     */
    function ServerRow(props) {
      const { t, server, busy, confirm } = props;
      const [menu, setMenu] = React.useState(false);
      const wrap = React.useRef(null);

      React.useEffect(() => {
        if (!menu) return undefined;
        const onPointer = (event) => {
          if (wrap.current !== null && !wrap.current.contains(event.target)) setMenu(false);
        };
        const onKey = (event) => {
          if (event.key === 'Escape') setMenu(false);
        };
        document.addEventListener('mousedown', onPointer);
        document.addEventListener('keydown', onKey);
        return () => {
          document.removeEventListener('mousedown', onPointer);
          document.removeEventListener('keydown', onKey);
        };
      }, [menu]);

      const showOlderWarning = server.status === 'connected'
        && typeof server.protocolVersion === 'string'
        && server.protocolVersion.length > 0
        && server.protocolVersion < LATEST_PROTOCOL;
      const visibleTools = Array.isArray(server.tools) ? server.tools.slice(0, 6) : [];
      const remaining = server.toolCount - visibleTools.length;

      return h('div', { className: 'tms-row' },
        h('div', { className: 'tms-row-main' },
          h('span', { className: 'tms-dot' + dotClass(server.status), 'aria-hidden': 'true' }),
          h('div', { className: 'tms-body' },
            h('div', { className: 'tms-nameline' },
              h('button', {
                type: 'button',
                className: 'tms-namelink',
                title: server.name,
                onClick: props.onPermissions,
              }, server.name),
              server.status === 'connected' && typeof server.protocolVersion === 'string' && server.protocolVersion.length > 0
                ? h('span', { className: 'tms-badge' }, 'MCP ' + server.protocolVersion)
                : null),
            h('div', { className: 'tms-status' + (server.status === 'error' ? ' is-error' : '') }, statusCaption(server, t)),
            server.target ? h('div', { className: 'tms-target', title: server.target }, server.target) : null,
            server.status === 'error' && server.error
              ? h('div', { className: 'tms-rowerror' }, server.error)
              : null,
            showOlderWarning ? h('div', { className: 'tms-warning' }, t('olderProtocol')) : null,
            server.status === 'connected' && visibleTools.length > 0
              ? h('div', { className: 'tms-tools' },
                visibleTools.map((tool) => h('span', { key: tool.name, className: 'tms-tool', title: tool.description || tool.name }, tool.name)),
                remaining > 0 ? h('span', { className: 'tms-more' }, '+' + remaining) : null)
              : null,
            confirm
              ? h('div', { className: 'tms-confirm' },
                h('span', null, t('deleteQuestion')),
                h('button', { type: 'button', className: 'tms-btn tms-btn-ghost', onClick: props.onCancelDelete, disabled: busy }, t('cancel')),
                h('button', { type: 'button', className: 'tms-btn tms-btn-danger', onClick: props.onDelete, disabled: busy }, t('remove')))
              : null)),
        h('div', { className: 'tms-menuwrap', ref: wrap },
          h('button', {
            type: 'button',
            className: 'tms-kebab',
            'aria-label': t('actions'),
            'aria-haspopup': 'menu',
            'aria-expanded': menu ? 'true' : 'false',
            disabled: busy,
            onClick: () => setMenu(!menu),
          }, h(IconKebab)),
          menu
            ? h('div', { className: 'tms-menu', role: 'menu' },
              server.status === 'connected' || server.status === 'connecting'
                ? h('button', { type: 'button', role: 'menuitem', className: 'tms-menuitem', onClick: () => { setMenu(false); props.onDisconnect(); } }, h(IconPlug), t('disconnect'))
                : h('button', { type: 'button', role: 'menuitem', className: 'tms-menuitem', onClick: () => { setMenu(false); props.onConnect(); } }, h(IconPlug), t('connect')),
              h('button', { type: 'button', role: 'menuitem', className: 'tms-menuitem', onClick: () => { setMenu(false); props.onPermissions(); } }, h(IconShield), t('permissions')),
              h('button', { type: 'button', role: 'menuitem', className: 'tms-menuitem', onClick: () => { setMenu(false); props.onEdit(); } }, h(IconPencil), t('edit')),
              h('button', { type: 'button', role: 'menuitem', className: 'tms-menuitem is-danger', onClick: () => { setMenu(false); props.onAskDelete(); } }, h(IconTrash), t('remove')))
            : null));
    }

    /**
     * Add/edit form.
     * @param {Record<string, any>} props Form props.
     */
    function ServerForm(props) {
      const { t, server, saving } = props;
      const editing = server !== null && server !== undefined;
      const [draft, setDraft] = React.useState(() => ({
        name: editing ? server.name : '',
        transport: editing ? server.transport : 'stdio',
        command: editing ? server.command : '',
        args: editing ? (server.args || []).join(' ') : '',
        env: editing ? Object.keys(server.env || {}).map((name) => ({ name: name, value: server.env[name] })) : [],
        url: editing ? server.url : '',
        auth: editing ? server.auth : 'none',
        token: '',
        tokenTouched: false,
        autoConnect: editing ? server.autoConnect : true,
      }));
      const [formError, setFormError] = React.useState(null);
      const [revealed, setRevealed] = React.useState(false);

      const patch = (values) => setDraft((current) => Object.assign({}, current, values));

      const setEnvRow = (index, values) => setDraft((current) => {
        const env = current.env.map((row, position) => (position === index ? Object.assign({}, row, values) : row));
        return Object.assign({}, current, { env: env });
      });
      const addEnvRow = () => setDraft((current) => Object.assign({}, current, { env: current.env.concat([{ name: '', value: '' }]) }));
      const removeEnvRow = (index) => setDraft((current) => Object.assign({}, current, { env: current.env.filter((row, position) => position !== index) }));

      const submit = async (event) => {
        if (event !== undefined) event.preventDefault();
        setFormError(null);
        const name = draft.name.trim();
        if (name.length === 0) return setFormError(t('nameRequired'));
        const payload = { name: name, transport: draft.transport, autoConnect: draft.autoConnect };
        if (draft.transport === 'stdio') {
          if (draft.command.trim().length === 0) return setFormError(t('commandRequired'));
          payload.command = draft.command.trim();
          payload.args = draft.args;
          const env = {};
          for (const row of draft.env) {
            if (row.name.trim().length === 0) continue;
            env[row.name.trim()] = row.value;
          }
          payload.env = env;
        } else {
          if (draft.url.trim().length === 0) return setFormError(t('urlRequired'));
          payload.url = draft.url.trim();
          payload.auth = draft.auth;
          if (draft.auth === 'bearer' && draft.token.length === 0 && !(editing && server.hasToken)) {
            return setFormError(t('tokenRequired'));
          }
          if (draft.tokenTouched && draft.token.length > 0) payload.token = draft.token;
        }
        const failure = await props.onSubmit(payload);
        if (failure) setFormError(failure);
      };

      const field = (key, label, control, hint) => h('label', { className: 'tms-field', key: key },
        h('span', { className: 'tms-label' }, label),
        control,
        hint ? h('span', { className: 'tms-hint' }, hint) : null);

      const input = (key, value, placeholder, onInput, mono) => h('input', {
        className: 'tms-input' + (mono ? ' is-mono' : ''),
        type: 'text',
        value: value,
        placeholder: placeholder,
        spellCheck: false,
        autoComplete: 'off',
        onChange: (event) => onInput(event.target.value),
      });

      const select = (value, options, onInput) => h('div', { className: 'tms-selectwrap' },
        h('select', {
          className: 'tms-select',
          value: value,
          onChange: (event) => onInput(event.target.value),
        }, options.map((option) => h('option', { key: option.value, value: option.value }, option.label))),
        h('span', { className: 'tms-chevron' }, h(IconChevron)));

      const nameField = field('name', t('name'),
        input('name', draft.name, t('namePlaceholder'), (value) => patch({ name: value })));

      const transportField = field('transport', t('transport'), select(draft.transport, [
        { value: 'stdio', label: t('transportStdio') },
        { value: 'http', label: t('transportHttp') },
      ], (value) => patch({ transport: value })));

      const commandField = draft.transport === 'stdio'
        ? field('command', t('command'), input('command', draft.command, t('commandPlaceholder'), (value) => patch({ command: value }), true))
        : null;

      const argsField = draft.transport === 'stdio'
        ? field('args', t('args'), input('args', draft.args, t('argsPlaceholder'), (value) => patch({ args: value }), true))
        : null;

      const urlField = draft.transport === 'http'
        ? field('url', t('url'), input('url', draft.url, t('urlPlaceholder'), (value) => patch({ url: value }), true))
        : null;

      const authField = draft.transport === 'http'
        ? field('auth', t('auth'), select(draft.auth, [
          { value: 'none', label: t('authNone') },
          { value: 'bearer', label: t('authBearer') },
        ], (value) => patch({ auth: value })))
        : null;

      const tokenField = draft.transport === 'http' && draft.auth === 'bearer'
        ? field('token', t('token'), h('div', { className: 'tms-tokenrow' },
          h('input', {
            className: 'tms-input is-mono',
            type: revealed ? 'text' : 'password',
            value: draft.token,
            autoComplete: 'off',
            placeholder: editing && server.hasToken ? t('tokenUnchanged') : '',
            onChange: (event) => patch({ token: event.target.value, tokenTouched: true }),
          }),
          h('button', {
            type: 'button',
            className: 'tms-reveal',
            'aria-pressed': revealed ? 'true' : 'false',
            onClick: () => setRevealed(!revealed),
          }, revealed ? t('hide') : t('reveal'))))
        : null;

      const envRow = (row, index) => h('div', { className: 'tms-envrow', key: 'env-' + index },
        h('input', {
          className: 'tms-input tms-envname is-mono',
          type: 'text',
          value: row.name,
          placeholder: 'NAME',
          spellCheck: false,
          autoComplete: 'off',
          onChange: (event) => setEnvRow(index, { name: event.target.value }),
        }),
        h('input', {
          className: 'tms-input tms-envvalue is-mono',
          type: revealed ? 'text' : 'password',
          value: row.value,
          placeholder: 'value',
          spellCheck: false,
          autoComplete: 'off',
          onChange: (event) => setEnvRow(index, { value: event.target.value }),
        }),
        h('button', {
          type: 'button',
          className: 'tms-remove',
          'aria-label': t('removeVar'),
          onClick: () => removeEnvRow(index),
        }, t('removeVar')));

      const envField = draft.transport === 'stdio'
        ? h('div', { className: 'tms-field', key: 'env' },
          h('div', { className: 'tms-labelrow' },
            h('span', { className: 'tms-label' }, t('env')),
            h('span', { className: 'tms-labelextras' },
              draft.env.length > 0
                ? h('button', {
                  type: 'button',
                  className: 'tms-reveal',
                  'aria-pressed': revealed ? 'true' : 'false',
                  onClick: () => setRevealed(!revealed),
                }, revealed ? t('hide') : t('reveal'))
                : null,
              h('button', { type: 'button', className: 'tms-pill', onClick: addEnvRow }, t('addVar')))),
          draft.env.length === 0
            ? h('span', { className: 'tms-hint' }, t('noVars'))
            : h('div', { className: 'tms-envlist' }, draft.env.map(envRow)),
          h('span', { className: 'tms-hint' }, t('envHint')))
        : null;

      const autoField = h('label', { className: 'tms-check', key: 'auto' },
        h('input', {
          type: 'checkbox',
          checked: draft.autoConnect,
          onChange: (event) => patch({ autoConnect: event.target.checked }),
        }),
        t('autoConnect'));

      const head = h('div', { className: 'tms-formhead' },
        h('div', { className: 'tms-headtext' },
          h('h2', { className: 'tms-title' }, editing ? t('editServer') : t('newServer')),
          h('p', { className: 'tms-sub' }, t('formSubtitle'))),
        h('button', {
          type: 'button',
          className: 'tms-back',
          'aria-label': t('backToServers'),
          onClick: props.onCancel,
        }, h(IconBack)));

      const fields = h('div', { className: 'tms-fields' },
        nameField,
        transportField,
        commandField,
        argsField,
        urlField,
        authField,
        tokenField,
        envField,
        autoField);

      const foot = h('div', { className: 'tms-formfoot' },
        formError !== null
          ? h('span', { className: 'tms-formerror', role: 'alert' }, formError)
          : h('span', { className: 'tms-formerror' }),
        h('button', { type: 'button', className: 'tms-btn tms-btn-ghost', onClick: props.onCancel, disabled: saving }, t('cancel')),
        h('button', { type: 'submit', className: 'tms-btn tms-btn-primary', disabled: saving },
          saving ? h('span', { className: 'tms-spinner' }) : null,
          editing ? t('save') : t('add')));

      return h('form', { className: 'tms-form', onSubmit: submit, noValidate: true },
        h('style', null, CSS),
        h('div', { className: 'tms-formcard' }, head, fields, foot));
    }


    /** Read-shaped tool names used when a server publishes no annotations. */
    const READ_WORDS = new Set([
      'get', 'list', 'search', 'read', 'query', 'find', 'fetch', 'describe', 'inspect', 'health',
      'export', 'preview', 'neighbors', 'proposals', 'view', 'status', 'count', 'show', 'history',
      'catalog', 'lookup', 'check', 'info', 'snapshot', 'summarize', 'resolve', 'discover', 'trace',
    ]);

    /** Write-shaped tool names used when a server publishes no annotations. */
    const WRITE_WORDS = new Set([
      'create', 'update', 'delete', 'remove', 'write', 'post', 'apply', 'put', 'patch', 'set',
      'insert', 'upsert', 'capture', 'decide', 'archive', 'restore', 'upload', 'send', 'add', 'edit',
      'modify', 'approve', 'reject', 'cancel', 'move', 'rename', 'publish', 'install', 'uninstall',
      'grant', 'revoke', 'run', 'execute', 'start', 'stop', 'kill', 'restart', 'deploy', 'commit',
      'push', 'merge', 'reply', 'comment', 'assign', 'close', 'open',
    ]);

    /**
     * Classify one discovered tool for the permission blocks.
     * @param {Record<string, any>} tool Discovered tool.
     * @returns {'read' | 'write' | 'other'} Block key.
     */
    function classifyTool(tool) {
      if (tool.destructive === true) return 'write';
      if (tool.readOnly === true) return 'read';
      const words = String(tool.name)
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .split(/[^A-Za-z0-9]+/)
        .filter(Boolean)
        .map((word) => word.toLowerCase());
      if (words.some((word) => WRITE_WORDS.has(word))) return 'write';
      if (words.some((word) => READ_WORDS.has(word))) return 'read';
      return 'other';
    }

    /**
     * Turn a raw tool name into a readable label.
     * @param {string} name Raw name.
     * @returns {string} Readable label.
     */
    function humanizeTool(name) {
      const spaced = String(name)
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .trim();
      if (spaced.length === 0) return name;
      return spaced.charAt(0).toUpperCase() + spaced.slice(1);
    }

    /**
     * Per-tool permission editor for one server.
     * @param {Record<string, any>} props View props.
     */
    function PermissionsView(props) {
      const { t, server } = props;
      const [collapsed, setCollapsed] = React.useState({});
      const tools = Array.isArray(server.tools) ? server.tools : [];
      const permissions = server.permissions || {};

      const valueOf = (name) => {
        const value = permissions[name];
        return value === 'ask' || value === 'deny' ? value : 'allow';
      };

      const blocks = [
        { key: 'read', title: t('groupRead') },
        { key: 'write', title: t('groupWrite') },
        { key: 'other', title: t('groupOther') },
      ]
        .map((block) => Object.assign({}, block, {
          tools: tools.filter((tool) => classifyTool(tool) === block.key),
        }))
        .filter((block) => block.tools.length > 0);

      const options = [
        { value: 'allow', label: t('permAllow'), icon: IconCheck, extra: '' },
        { value: 'ask', label: t('permAsk'), icon: IconHand, extra: ' is-ask' },
        { value: 'deny', label: t('permDeny'), icon: IconBan, extra: ' is-deny' },
      ];

      const groupValue = (block) => {
        const values = new Set(block.tools.map((tool) => valueOf(tool.name)));
        return values.size === 1 ? block.tools.map((tool) => valueOf(tool.name))[0] : 'mixed';
      };

      const blockView = (block) => {
        const isCollapsed = collapsed[block.key] === true;
        const current = groupValue(block);
        const names = block.tools.map((tool) => tool.name);
        const head = h('div', { className: 'tms-grouphead' + (isCollapsed ? ' is-collapsed' : '') },
          h('button', {
            type: 'button',
            className: 'tms-groupchevron',
            'aria-expanded': isCollapsed ? 'false' : 'true',
            'aria-label': block.title,
            onClick: () => setCollapsed((state) => Object.assign({}, state, { [block.key]: !isCollapsed })),
          }, h(IconChevronDown, { open: !isCollapsed })),
          h('span', { className: 'tms-grouptitle' }, block.title),
          h('span', { className: 'tms-count' }, String(block.tools.length)),
          h('select', {
            className: 'tms-groupsel',
            'aria-label': t('permGroupLabel') + ': ' + block.title,
            value: current,
            onChange: (event) => {
              if (event.target.value === 'mixed') return;
              props.onSet(names, event.target.value);
            },
          },
          current === 'mixed' ? h('option', { value: 'mixed', disabled: true }, t('permMixed')) : null,
          options.map((option) => h('option', { key: option.value, value: option.value }, option.label))));

        if (isCollapsed) return h('div', { className: 'tms-group', key: block.key }, head);

        return h('div', { className: 'tms-group', key: block.key },
          head,
          block.tools.map((tool) => {
            const value = valueOf(tool.name);
            return h('div', { className: 'tms-permrow', key: tool.name },
              h('span', { className: 'tms-permname', title: tool.description || tool.name }, humanizeTool(tool.name)),
              h('div', { className: 'tms-seg', role: 'radiogroup', 'aria-label': humanizeTool(tool.name) },
                options.map((option) => h('button', {
                  key: option.value,
                  type: 'button',
                  role: 'radio',
                  'aria-checked': value === option.value ? 'true' : 'false',
                  title: option.label,
                  'aria-label': option.label,
                  className: 'tms-segbtn' + (value === option.value ? ' is-active' + option.extra : ''),
                  onClick: () => props.onSet([tool.name], option.value),
                }, h(option.icon)))));
          }));
      };

      const identity = h('div', { className: 'tms-detailhead' },
        h('div', { className: 'tms-mark' }, h(IconGrid, { size: 18 })),
        h('div', { className: 'tms-detailname' },
          h('strong', null, server.name),
          h('span', { className: 'tms-status' }, statusCaption(server, t))));

      return h('div', { className: 'tms-detail' },
        h('button', { type: 'button', className: 'tms-backlink', onClick: props.onBack }, h(IconBack), t('backToServers')),
        identity,
        h('h3', { className: 'tms-sectiontitle' }, t('permissions')),
        h('p', { className: 'tms-intro' }, t('permissionsHint')),
        server.status !== 'connected' && tools.length > 0
          ? h('p', { className: 'tms-hint' }, t('lastKnownTools'))
          : null,
        blocks.length === 0
          ? h('div', { className: 'tms-empty' }, h('span', { className: 'tms-empty-sub' }, t('connnectToDiscover')))
          : h('div', { className: 'tms-groups' }, blocks.map(blockView)));
    }

    /** Error boundary so a rendering failure never blanks the settings panel. */
    class Boundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }
      static getDerivedStateFromError(error) {
        return { error: error };
      }
      render() {
        if (this.state.error !== null) {
          const message = this.state.error && this.state.error.message ? this.state.error.message : String(this.state.error);
          return h('div', { className: 'tms-root' }, h('style', null, CSS), h('div', { className: 'tms-banner' }, message));
        }
        return this.props.children;
      }
    }

    /**
     * Build the Settings section entry point around one translator binding.
     * @param {Function} t Translator bound to this plugin's namespace.
     * @returns {Function} Section component.
     */
    function createToolsSection(t) {
      return function ToolsSection() {
        return h(Boundary, null, h(ToolsPage, { t: t }));
      };
    }

    /** Navigation icon addressed by the section id. */
    function ToolsNavIcon(props) {
      const size = props.size || 16;
      return h('svg', {
        width: size, height: size, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': 'true',
      },
      h('rect', { x: 2.75, y: 3.5, width: 14.5, height: 5, rx: 1.6, stroke: 'currentColor', strokeWidth: 1.5 }),
      h('rect', { x: 2.75, y: 11.5, width: 14.5, height: 5, rx: 1.6, stroke: 'currentColor', strokeWidth: 1.5 }),
      h('circle', { cx: 6, cy: 6, r: 0.9, fill: 'currentColor' }),
      h('circle', { cx: 6, cy: 14, r: 0.9, fill: 'currentColor' }));
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const disposeLocale = ctx.locale.register(NS, STRINGS);
        ctx.effect(() => disposeLocale, 'tools-mcp locale');

        const t = ctx.locale.bind(NS);

        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'tools',
          order: 20,
          label: () => t('nav'),
          locale: NS,
        }, createToolsSection(t)));

        ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
          name: 'settings.section.icon',
          id: 'tools',
        }, ToolsNavIcon));
      },
    };
  },
});
