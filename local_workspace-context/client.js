window.__ModuleLoader__.load({
  id: '@local/workspace-context',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = '@local/workspace-context';
    const TAB_ID = '@local/workspace-context';
    const TAB_KIND = 'workspace-context';
    const OVERVIEW_PANEL_ID = 'workspace-overview';
    const ENDPOINT = '/dsh-workspace-context';
    const HEADER = 'x-dsh-workspace-context';
    const MAX_FILE_BYTES = 128 * 1024;

    /** Shipped workspace icon set. Paths use a 24×24 stroke grid. */
    const ICON_DEFS = [
      { id: 'briefcase', path: 'M4 8h16v10H4zM9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 12h16' },
      { id: 'code', path: 'M9 7l-5 5 5 5M15 7l5 5-5 5' },
      { id: 'book', path: 'M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4zM8 20a3 3 0 0 1 0-6h9' },
      { id: 'rocket', path: 'M14 4c3 0 5 2 5 5 0 4-4 8-7 10l-3-3c2-3 5-7 5-12zM9 15l-4 4M7 11l-3 2 3 3 2-3' },
      { id: 'star', path: 'M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9L12 3z' },
      { id: 'heart', path: 'M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9z' },
      { id: 'bolt', path: 'M13 2L4 14h7l-2 8 9-12h-7l2-8z' },
      { id: 'globe', path: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18' },
      { id: 'flask', path: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M7.5 15h9' },
      { id: 'terminal', path: 'M4 5h16v14H4zM7 9l3 3-3 3M13 15h4' },
      { id: 'palette', path: 'M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 0-4 2 2 0 0 1 2-2h2a4 4 0 0 0 4-4 9 9 0 0 0-9-8zM8 9h.01M6.5 13h.01M10 16h.01' },
      { id: 'chat', path: 'M4 5h16v11H9l-5 4V5z' },
      { id: 'music', path: 'M9 18V5l10-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM19 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z' },
      { id: 'camera', path: 'M4 8h3l2-3h6l2 3h3v11H4V8zM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
      { id: 'lightbulb', path: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3 11c1 1 1 2 1 3h4c0-1 0-2 1-3a6 6 0 0 0-3-11z' },
      { id: 'flag', path: 'M5 21V4M5 4h11l-2 4 2 4H5' },
    ];

    /** Preset accent colors offered beside the custom color input. */
    const ICON_COLORS = ['#e55353', '#e8912a', '#d4b106', '#3fa45b', '#2f9e9e', '#3b82f6', '#7c5cff', '#d946ef', '#8b8f98'];

    /** Inline mask for one preset icon; the CSS background color supplies its tone. */
    function presetIconDataUri(def) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${def.path}"/></svg>`;
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    }

    /** Build the sidebar rules that repaint configured workspace rows. */
    function buildAppearanceCss(workspaces) {
      const rules = [];
      for (const workspace of Array.isArray(workspaces) ? workspaces : []) {
        if (typeof workspace?.workspaceId !== 'string' || workspace.workspaceId === '') continue;
        const row = `[data-row-key=${JSON.stringify(`workspace:${workspace.workspaceId}`)}]`;
        const color = typeof workspace.color === 'string' && /^#[0-9a-f]{6}$/i.test(workspace.color) ? workspace.color : '';
        const icon = typeof workspace.icon === 'string' ? workspace.icon : '';
        if (color !== '') rules.push(`${row} [class*="_folder"]{color:${color} !important;}`);
        if (icon.startsWith('data:image/')) {
          rules.push(`${row} [class*="_folder"]{background-image:url("${icon}");background-size:16px 16px;background-position:center;background-repeat:no-repeat;}`);
          rules.push(`${row} [class*="_folder"] svg{display:none !important;}`);
          continue;
        }
        const def = ICON_DEFS.find(entry => entry.id === icon);
        if (def === undefined) continue;
        const uri = presetIconDataUri(def);
        rules.push(`${row} [class*="_folder"]{-webkit-mask-image:url("${uri}");-webkit-mask-position:center;-webkit-mask-size:16px 16px;-webkit-mask-repeat:no-repeat;mask-image:url("${uri}");mask-position:center;mask-size:16px 16px;mask-repeat:no-repeat;background-color:currentColor;}`);
        rules.push(`${row} [class*="_folder"] svg{display:none !important;}`);
      }
      return rules.join('\n');
    }

    const STRINGS = {
      en: {
        menu: { configure: 'Configure workspace', openWorkspace: 'Open workspace' },
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
          appearance: 'Appearance',
          editAppearance: 'Edit icon or color',
          close: 'Close',
          color: 'Color',
          automatic: 'Automatic',
          customColor: 'Custom color',
          icon: 'Icon',
          defaultIcon: 'Folder',
          uploadIcon: 'Upload image',
          removeIcon: 'Remove image',
          iconInvalid: 'Choose a PNG, JPEG, WebP or GIF image.',
          iconTooLarge: 'That image is too large.',
        },
        iconNames: {
          briefcase: 'Briefcase',
          code: 'Code',
          book: 'Book',
          rocket: 'Rocket',
          star: 'Star',
          heart: 'Heart',
          bolt: 'Bolt',
          globe: 'Globe',
          flask: 'Laboratory',
          terminal: 'Terminal',
          palette: 'Palette',
          chat: 'Chat',
          music: 'Music',
          camera: 'Camera',
          lightbulb: 'Idea',
          flag: 'Flag',
        },
        session: {
          contextLabel: 'Session context',
          addFolderLabel: 'Folder',
          addFolderDescription: 'Add a folder as context for this session',
          added: 'Folder “{name}” added to this session.',
          remove: 'Remove folder',
          removeFailed: 'Could not remove the folder.',
        },
        sidebar: {
          title: 'Context',
          session: 'Session',
          empty: 'No context yet.',
          emptyHint: 'Add a folder from the composer + menu.',
          addFolder: 'Add folder',
          expand: 'Show context',
          collapse: 'Hide context',
          noWorkspaceContext: 'No workspace context',
          description: 'Workspace and session context',
          workspace: 'workspace',
          more: '+{count} more',
        },
        overview: {
          newSession: 'New session',
          chats: 'Chats',
          untitled: 'Untitled session',
          instructions: 'System prompt',
          context: 'Context',
          noDescription: 'No description yet. Use Configure workspace to add one.',
          noInstructions: 'No system prompt yet.',
          noContext: 'No files or folders in this workspace context yet.',
          noChats: 'This workspace has no chats yet.',
          notFound: 'This workspace no longer exists.',
          selectWorkspace: 'Select a workspace to see its project page.',
          openChat: 'Open chat',
          composerPlaceholder: 'How can I help you today?',
          send: 'Send',
          sendFailed: 'Could not send the message.',
        },
        composer: {
          model: 'Model',
          defaultModel: 'Default model',
          selectModel: 'Select model',
          modelLoading: 'Loading models…',
          modelEmpty: 'No models available.',
          modelError: 'Could not load the model list.',
          permissions: 'Permissions',
          permissionDefault: 'Default permissions',
          permissionReadOnly: 'Read only',
          permissionWorkspaceWrite: 'Workspace write',
          permissionFullAccess: 'Full access',
          permissionAuto: 'Auto review',
          permissionUnavailable: 'Permissions are not available in this session.',
          permissionLoading: 'Loading permissions…',
          permissionError: 'Could not load the permission presets.',
          permissionConfirmFull: 'Enable full access? This session may modify files outside the workspace.',
          permissionConfirmAuto: 'Enable auto review? This is an experimental capability.',
          cancel: 'Cancel',
          confirm: 'Enable',
          retry: 'Retry',
        },
        mode: {
          label: 'Mode',
          default: 'Default mode',
          loading: 'Loading modes…',
          empty: 'No modes available.',
          error: 'Could not load the modes.',
          standard: 'Standard mode',
          standardDescription: 'Work with code, files, and information. Suitable for most tasks, with search, editing, terminal commands, and other tools available as needed.',
          ptc: 'PTC mode',
          ptcDescription: 'Includes all Standard mode capabilities. Better suited to tasks that call tools in batches and then filter, organize, deduplicate, count, or summarize the results.',
          minimal: 'Minimal mode',
          minimalDescription: 'The agent uses a terminal and image reading, with context compaction. Useful for testing and comparing its basic performance.',
          creator: 'Creator mode',
          creatorDescription: 'Customize DSH through conversation. Let the agent write plugins that add functions or a user interface, or combine tools and instructions to create its own mode.',
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
        menu: { configure: 'Configurar espacio', openWorkspace: 'Abrir espacio' },
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
          appearance: 'Aspecto',
          editAppearance: 'Editar icono o color',
          close: 'Cerrar',
          color: 'Color',
          automatic: 'Automático',
          customColor: 'Otro color',
          icon: 'Icono',
          defaultIcon: 'Carpeta',
          uploadIcon: 'Subir imagen',
          removeIcon: 'Quitar imagen',
          iconInvalid: 'Elige una imagen PNG, JPEG, WebP o GIF.',
          iconTooLarge: 'La imagen es demasiado grande.',
        },
        iconNames: {
          briefcase: 'Maletín',
          code: 'Código',
          book: 'Libro',
          rocket: 'Cohete',
          star: 'Estrella',
          heart: 'Corazón',
          bolt: 'Rayo',
          globe: 'Mundo',
          flask: 'Laboratorio',
          terminal: 'Terminal',
          palette: 'Paleta',
          chat: 'Chat',
          music: 'Música',
          camera: 'Cámara',
          lightbulb: 'Idea',
          flag: 'Bandera',
        },
        session: {
          contextLabel: 'Contexto de sesión',
          addFolderLabel: 'Carpeta',
          addFolderDescription: 'Añade una carpeta como contexto de esta sesión',
          added: 'Carpeta «{name}» añadida a esta sesión.',
          remove: 'Quitar carpeta',
          removeFailed: 'No se pudo quitar la carpeta.',
        },
        sidebar: {
          title: 'Contexto',
          session: 'Sesión',
          empty: 'Sin contexto todavía.',
          emptyHint: 'Añade una carpeta desde el menú + del compositor.',
          addFolder: 'Añadir carpeta',
          expand: 'Mostrar contexto',
          collapse: 'Ocultar contexto',
          noWorkspaceContext: 'Sin contexto del espacio',
          description: 'Contexto del espacio y de la sesión',
          workspace: 'espacio',
          more: '+{count} más',
        },
        overview: {
          newSession: 'Nueva sesión',
          chats: 'Chats',
          untitled: 'Sesión sin título',
          instructions: 'Prompt del sistema',
          context: 'Contexto',
          noDescription: 'Todavía no hay descripción. Usa Configurar espacio para añadirla.',
          noInstructions: 'Todavía no hay prompt del sistema.',
          noContext: 'Todavía no hay archivos ni carpetas en el contexto del espacio.',
          noChats: 'Este espacio todavía no tiene chats.',
          notFound: 'Este espacio de trabajo ya no existe.',
          selectWorkspace: 'Selecciona un espacio de trabajo para ver su página de proyecto.',
          openChat: 'Abrir chat',
          composerPlaceholder: '¿Cómo puedo ayudarte hoy?',
          send: 'Enviar',
          sendFailed: 'No se pudo enviar el mensaje.',
        },
        composer: {
          model: 'Modelo',
          defaultModel: 'Modelo predeterminado',
          selectModel: 'Seleccionar modelo',
          modelLoading: 'Cargando modelos…',
          modelEmpty: 'No hay modelos disponibles.',
          modelError: 'No se pudo cargar la lista de modelos.',
          permissions: 'Permisos',
          permissionDefault: 'Permisos predeterminados',
          permissionReadOnly: 'Sólo lectura',
          permissionWorkspaceWrite: 'Escritura en el espacio de trabajo',
          permissionFullAccess: 'Acceso completo',
          permissionAuto: 'Auto revisión',
          permissionUnavailable: 'Los permisos no están disponibles en esta sesión.',
          permissionLoading: 'Cargando permisos…',
          permissionError: 'No se pudieron cargar los permisos.',
          permissionConfirmFull: '¿Activar acceso completo? Esta sesión podrá modificar archivos fuera del espacio de trabajo.',
          permissionConfirmAuto: '¿Activar la revisión automática? Es una capacidad experimental.',
          cancel: 'Cancelar',
          confirm: 'Activar',
          retry: 'Reintentar',
        },
        mode: {
          label: 'Modo',
          default: 'Modo predeterminado',
          loading: 'Cargando modos…',
          empty: 'No hay modos disponibles.',
          error: 'No se pudieron cargar los modos.',
          standard: 'Modo estándar',
          standardDescription: 'Trabaje con código, archivos e información. Adecuado para la mayoría de las tareas, con búsqueda, edición, comandos de terminal y otras herramientas disponibles según sea necesario.',
          ptc: 'Modo PTC',
          ptcDescription: 'Incluye todas las capacidades del modo Estándar. Más adecuado para tareas que llaman a herramientas en lotes y luego filtran, organizan, deduplican, cuentan o resumen los resultados.',
          minimal: 'Modo mínimo',
          minimalDescription: 'El agente utiliza un terminal y lectura de imágenes, con compactación de contexto. Útil para probar y comparar su rendimiento básico.',
          creator: 'Modo creador',
          creatorDescription: 'Personaliza DSH a través de la conversación. Deja que el agente escriba complementos que agreguen funciones o interfaz de usuario, o combine herramientas e indicaciones para crear su propio modo.',
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
.wsc-workspace-row{display:flex;align-items:center;gap:8px;min-height:38px;box-sizing:border-box;padding:3px 8px 3px 5px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-2);}
.wsc-workspacename{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;}
.wsc-iconbutton{position:relative;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:1px solid transparent;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;flex:none;}
.wsc-iconbutton:hover{background:var(--dsw-alias-bg-layer-1);border-color:var(--dsw-alias-border-l1);color:var(--dsw-alias-label-primary);}
.wsc-iconbutton:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
.wsc-iconpencil{position:absolute;right:-2px;bottom:-2px;display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1);border-radius:50%;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-secondary);}
.wsc-editlink{flex:none;height:24px;padding:0 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;cursor:pointer;}
.wsc-editlink:hover{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);}
.wsc-editlink[aria-expanded="true"]{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary);}
.wsc-editlink:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
.wsc-appearance{display:flex;flex-direction:column;gap:10px;padding:10px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);}
.wsc-appearancehead{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.wsc-tabs{display:inline-flex;padding:2px;border-radius:7px;background:var(--dsw-alias-bg-layer-2);}
.wsc-tab{height:24px;padding:0 10px;border:0;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11.5px;cursor:pointer;}
.wsc-tab[aria-selected="true"]{background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);}
.wsc-tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}
.wsc-appearanceclose{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;padding:0;border:0;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:15px;line-height:1;cursor:pointer;}
.wsc-appearanceclose:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);}
.wsc-tabpanel{display:flex;flex-direction:column;gap:8px;}
.wsc-colorchoices{display:flex;flex-wrap:wrap;align-items:center;gap:6px;}
.wsc-colorchoice{width:20px;height:20px;padding:0;border:2px solid transparent;border-radius:50%;cursor:pointer;}
.wsc-colorchoice.selected{box-shadow:0 0 0 2px var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-bg-overlay);}
.wsc-colorauto{height:22px;padding:0 7px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:10px;cursor:pointer;}
.wsc-colorauto.selected{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary);}
.wsc-colorcustom{display:inline-flex;align-items:center;width:26px;height:22px;padding:2px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;cursor:pointer;}
.wsc-colorcustom input{width:100%;height:100%;padding:0;border:0;background:transparent;cursor:pointer;}
.wsc-icongrid{display:flex;flex-wrap:wrap;align-items:center;gap:5px;}
.wsc-iconchoice{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;padding:0;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;}
.wsc-iconchoice:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);}
.wsc-iconchoice.selected{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2);}
.wsc-iconchoice:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}
.wsc-iconuploadrow{display:flex;align-items:center;gap:6px;}
.wsc-iconuploadbtn{height:26px;padding:0 8px;font-size:11px;}
.wsc-iconremove{height:26px;padding:0 8px;font-size:11px;}
.wsc-workspaceiconimg{border-radius:5px;object-fit:contain;display:block;}
.wsc-workspaceiconfolder{display:inline-flex;align-items:center;justify-content:center;}
.wsc-field{display:flex;flex-direction:column;gap:6px;}
.wsc-labelrow{display:flex;align-items:baseline;justify-content:space-between;gap:12px;}
.wsc-label{font-size:12.5px;font-weight:600;}
.wsc-count{font-size:11px;color:var(--dsw-alias-label-secondary);}
.wsc-hint{margin:0;font-size:11.5px;line-height:1.45;color:var(--dsw-alias-label-secondary);}
.wsc-input,.wsc-textarea{width:100%;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:1.5;padding:9px 11px;resize:vertical;}
.wsc-input:focus,.wsc-textarea:focus{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;border-color:transparent;}
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
.wsc-side{flex:1 1 0%;min-width:0;max-height:260px;box-sizing:border-box;display:flex;flex-direction:column;padding:6px 2px 8px;border-top:1px solid var(--dsw-alias-border-l1);}
.wsc-side-head{display:flex;align-items:center;gap:6px;padding:1px 4px 5px;}
.wsc-side-toggle{display:inline-flex;align-items:center;gap:6px;min-width:0;flex:1;padding:2px 2px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;text-align:left;}
.wsc-side-toggle:hover{background:var(--dsw-alias-bg-layer-2);}
.wsc-side-title{font-size:10.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;}
.wsc-side-count{min-width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;padding:0 4px;box-sizing:border-box;border-radius:999px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:9.5px;}
.wsc-side-chevron{font-size:10px;line-height:1;color:var(--dsw-alias-label-secondary);}
.wsc-side-add{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;padding:0;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:15px;line-height:1;cursor:pointer;}
.wsc-side-add:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);}
.wsc-side-body{flex:1 1 auto;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:8px;padding:0 2px;}
.wsc-side-group{display:flex;flex-direction:column;gap:1px;min-width:0;}
.wsc-side-group-head{display:flex;align-items:center;gap:4px;padding:2px 4px 2px 6px;}
.wsc-side-group-title{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:600;color:var(--dsw-alias-label-primary);}
.wsc-side-gear{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;padding:0;border:0;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;}
.wsc-side-gear:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);}
.wsc-side-row{display:flex;align-items:center;gap:6px;min-height:26px;box-sizing:border-box;padding:3px 5px;border-radius:6px;}
.wsc-side-row:hover{background:var(--dsw-alias-bg-layer-2);}
.wsc-side-icon{flex:0 0 auto;display:inline-flex;color:var(--dsw-alias-label-secondary);}
.wsc-side-text{min-width:0;flex:1 1 auto;display:flex;flex-direction:column;gap:0;}
.wsc-side-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11.5px;color:var(--dsw-alias-label-primary);}
.wsc-side-meta{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;color:var(--dsw-alias-label-secondary);}
.wsc-side-remove{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;padding:0;border:0;border-radius:999px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:13px;line-height:1;}
.wsc-side-remove:hover{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-state-error-primary);}
.wsc-side-empty{display:flex;flex-direction:column;align-items:flex-start;gap:5px;padding:4px 6px 6px;font-size:11px;line-height:1.45;color:var(--dsw-alias-label-secondary);}
.wsc-side-empty button{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:10.5px;cursor:pointer;}
.wsc-side-empty button:hover{background:var(--dsw-alias-bg-layer-2);}
.wsc-side-error{padding:2px 6px 6px;font-size:10.5px;line-height:1.4;color:var(--dsw-alias-state-error-primary);}
.wsc-guide-wrap{width:100%;}
.wsc-guide{width:100%;box-sizing:border-box;display:flex;align-items:flex-start;gap:14px;min-height:56px;padding:14px 18px;border:0.5px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;text-align:left;cursor:pointer;}
.wsc-guide:hover{background:var(--dsw-alias-bg-layer-2);}
.wsc-guide:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}
.wsc-guide-icon{flex:0 0 auto;display:inline-flex;color:var(--dsw-alias-label-secondary);margin-top:1px;}
.wsc-guide-body{min-width:0;flex:1 1 auto;display:flex;flex-direction:column;gap:3px;}
.wsc-guide-title{font-size:14px;line-height:1.4;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.wsc-guide-desc{font-size:11px;line-height:1.4;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.wsc-guide-list{display:flex;flex-direction:column;gap:1px;margin-top:4px;min-width:0;}
.wsc-guide-item{display:flex;align-items:center;gap:5px;min-width:0;font-size:11px;line-height:1.4;color:var(--dsw-alias-label-primary);}
.wsc-guide-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.wsc-guide-source{flex:0 0 auto;font-size:9.5px;color:var(--dsw-alias-label-secondary);}
.wsc-guide-more{font-size:10px;line-height:1.4;color:var(--dsw-alias-label-secondary);}
.wsc-guide-chevron{flex:0 0 auto;color:var(--dsw-alias-label-secondary);font-size:16px;line-height:1;margin-top:1px;}
.wsc-rt{height:100%;min-height:0;box-sizing:border-box;overflow:auto;display:flex;flex-direction:column;gap:12px;padding:16px;color:var(--dsw-alias-label-primary);font:inherit;}
.wsc-rt-head{display:flex;align-items:center;gap:8px;flex:none;}
.wsc-rt-title{min-width:0;flex:1 1 auto;font-size:14px;font-weight:600;letter-spacing:-.01em;}
.wsc-rt-body{display:flex;flex-direction:column;gap:14px;min-height:0;}
.wsc-project{height:100%;min-height:0;overflow:auto;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;}
.wsc-project-inner{max-width:1120px;margin:0 auto;padding:40px 32px 64px;display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:36px;box-sizing:border-box;}
.wsc-project-main{min-width:0;display:flex;flex-direction:column;gap:22px;}
.wsc-project-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;}
.wsc-project-titlewrap{display:flex;align-items:flex-start;gap:10px;min-width:0;}
.wsc-project-icon{flex:0 0 auto;display:inline-flex;color:var(--dsw-alias-label-secondary);margin-top:3px;}
.wsc-project-title{margin:0;font-size:28px;line-height:1.2;font-weight:600;letter-spacing:-.02em;overflow-wrap:anywhere;}
.wsc-project-path{margin:5px 0 0;font-size:12px;line-height:1.4;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere;}
.wsc-project-actions{flex:0 0 auto;display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;}
.wsc-project-desc{margin:0;font-size:14px;line-height:1.65;white-space:pre-wrap;overflow-wrap:anywhere;}
.wsc-project-muted{color:var(--dsw-alias-label-secondary);}
.wsc-project-composer{display:flex;flex-direction:column;gap:8px;padding:14px 16px;border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-layer-1);}
.wsc-project-composerstack{display:flex;flex-direction:column;gap:6px;}
.wsc-project-composerhead{display:flex;align-items:center;gap:6px;min-height:28px;padding:0 16px;}
.wsc-project-modetrigger{font-size:13px;font-weight:500;padding:0 8px;max-width:min(240px,100%);}
.wsc-project-input{width:100%;min-height:54px;max-height:200px;box-sizing:border-box;padding:0;border:0;outline:none;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;line-height:1.5;resize:vertical;}
.wsc-project-input::placeholder{color:var(--dsw-alias-label-secondary);}
.wsc-project-composerbar{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.wsc-project-tools{display:flex;align-items:center;gap:6px;min-width:0;}
.wsc-project-tool{position:relative;min-width:0;}
.wsc-project-trigger{display:inline-flex;align-items:center;gap:4px;max-width:240px;height:28px;padding:0 7px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11.5px;line-height:1;cursor:pointer;}
.wsc-project-trigger:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);}
.wsc-project-triggericon{flex:none;display:inline-flex;color:var(--dsw-alias-label-caption);}
.wsc-project-triggerlabel{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.wsc-project-triggerchevron{flex:none;font-size:10px;line-height:1;color:var(--dsw-alias-label-caption);}
.wsc-project-menu{position:absolute;top:calc(100% + 6px);left:0;z-index:40;box-sizing:border-box;width:max-content;min-width:230px;max-width:min(340px,calc(100vw - 48px));max-height:320px;overflow:auto;padding:5px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-2);box-shadow:0 16px 48px rgba(0,0,0,.28);}
.wsc-project-menu-right{left:auto;right:0;}
.wsc-project-group{display:flex;flex-direction:column;gap:1px;padding:2px 0;}
.wsc-project-group+.wsc-project-group{border-top:1px solid var(--dsw-alias-border-l1);margin-top:3px;padding-top:5px;}
.wsc-project-grouphead{padding:4px 8px;font-size:9.5px;line-height:1.3;letter-spacing:.05em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);}
.wsc-project-option{display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;padding:6px 8px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:1.4;text-align:left;cursor:pointer;}
.wsc-project-option:hover{background:var(--dsw-alias-interactive-bg-hover);}
.wsc-project-option:disabled{opacity:.55;cursor:default;}
.wsc-project-optionname{min-width:0;flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.wsc-project-modeoption{align-items:flex-start;padding-top:7px;padding-bottom:7px;}
.wsc-project-modecopy{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1 1 auto;}
.wsc-project-optiondesc{font-size:10.5px;line-height:1.4;color:var(--dsw-alias-label-secondary);white-space:normal;}
.wsc-project-optioncheck{flex:none;color:var(--dsw-alias-brand-primary);font-size:12px;}
.wsc-project-menunote{padding:8px;font-size:11px;line-height:1.4;color:var(--dsw-alias-label-secondary);}
.wsc-project-menuerror{padding:7px 8px;font-size:11px;line-height:1.4;color:var(--dsw-alias-state-error-primary);}
.wsc-project-confirm{display:flex;flex-direction:column;gap:6px;margin:4px 2px 2px;padding:8px;border:1px solid var(--dsw-alias-state-warn-primary);border-radius:8px;background:var(--dsw-alias-bg-layer-1);}
.wsc-project-confirm p{margin:0;font-size:11px;line-height:1.45;color:var(--dsw-alias-label-primary);}
.wsc-project-confirmactions{display:flex;justify-content:flex-end;gap:6px;}
.wsc-project-send{flex:none;display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;padding:0;border:0;border-radius:999px;background:var(--dsw-alias-brand-primary);color:#fff;font:inherit;cursor:pointer;}
.wsc-project-send:hover{filter:brightness(1.06);}
.wsc-project-send:disabled{opacity:.45;cursor:default;filter:none;}
.wsc-project-composererror{font-size:11px;line-height:1.4;color:var(--dsw-alias-state-error-primary);}
.wsc-project-sectionhead{display:flex;align-items:center;gap:8px;}
.wsc-project-h2{margin:0;font-size:14px;font-weight:600;}
.wsc-project-count{font-size:11px;color:var(--dsw-alias-label-secondary);}
.wsc-project-chatlist{display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;overflow:hidden;background:var(--dsw-alias-bg-layer-1);}
.wsc-project-chat{display:flex;align-items:center;gap:10px;width:100%;box-sizing:border-box;padding:12px 14px;border:0;border-bottom:1px solid var(--dsw-alias-border-l1);background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;}
.wsc-project-chat:last-child{border-bottom:0;}
.wsc-project-chat:hover{background:var(--dsw-alias-bg-layer-2);}
.wsc-project-chat:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px;}
.wsc-project-chaticon{flex:0 0 auto;display:inline-flex;color:var(--dsw-alias-label-secondary);}
.wsc-project-chattext{min-width:0;flex:1 1 auto;display:flex;flex-direction:column;gap:2px;}
.wsc-project-chattitle{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;line-height:1.4;font-weight:500;}
.wsc-project-chatmeta{font-size:11px;line-height:1.4;color:var(--dsw-alias-label-secondary);}
.wsc-project-chatarrow{flex:0 0 auto;color:var(--dsw-alias-label-secondary);font-size:16px;line-height:1;}
.wsc-project-side{display:flex;flex-direction:column;gap:16px;min-width:0;}
.wsc-project-card{display:flex;flex-direction:column;gap:10px;padding:16px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);}
.wsc-project-cardhead{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.wsc-project-h3{margin:0;font-size:13px;font-weight:600;}
.wsc-project-cardtext{margin:0;font-size:12.5px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere;max-height:220px;overflow:auto;}
.wsc-project-empty{height:100%;display:flex;align-items:center;justify-content:center;padding:40px;box-sizing:border-box;color:var(--dsw-alias-label-secondary);font-size:13px;text-align:center;}
.wsc-project-empty-inline{padding:18px;border:1px dashed var(--dsw-alias-border-l1);border-radius:12px;color:var(--dsw-alias-label-secondary);font-size:12px;text-align:center;}
.wsc-project-error{padding:10px 12px;border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent);color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:1.4;}
@media (max-width:900px){.wsc-project-inner{grid-template-columns:minmax(0,1fr);padding:24px 18px 48px;gap:24px;}.wsc-project-head{flex-direction:column;}.wsc-project-actions{justify-content:flex-start;}}
.wsc-spin{font-size:12px;color:var(--dsw-alias-label-secondary);}
@media (max-width:640px){.wsc-overlay{padding:10px;}.wsc-dialog{max-height:calc(100vh - 20px);}.wsc-head,.wsc-body,.wsc-foot{padding-left:16px;padding-right:16px;}}
`;

    /**
     * Keep each workspace row's expander visible on every input modality, and
     * place it before the folder icon so touch screens can collapse the list.
     */
    const SIDEBAR_CSS = `
[data-row-key^="workspace:"] [class*="_chevron"]{display:inline-flex !important;order:-1;align-items:center;justify-content:center;width:20px;height:28px;margin-inline-start:-2px;}
[data-row-key^="workspace:"]:hover [class*="_folder"]{display:inline-flex !important;}
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

    /** Subscribe one component to a `getSnapshot`/`subscribe` store. */
    function useSnapshot(store) {
      const [value, setValue] = React.useState(() => store.getSnapshot());
      React.useEffect(() => {
        setValue(store.getSnapshot());
        return store.subscribe(() => setValue(store.getSnapshot()));
      }, [store]);
      return value;
    }

    const EMPTY_MODEL_SNAPSHOT = { current: null, routable: null, groups: [], failures: [], status: 'idle', pending: null, error: null };
    const EMPTY_MODEL_STORE = { getSnapshot: () => EMPTY_MODEL_SNAPSHOT, subscribe: () => () => {} };

    /** Read a permission preset label, falling back to the host name. */
    function permissionLabel(value, name, t) {
      switch (value) {
        case 'read-only': return t('composer.permissionReadOnly');
        case 'workspace-write': return t('composer.permissionWorkspaceWrite');
        case 'danger-full-access': return t('composer.permissionFullAccess');
        case 'auto': return t('composer.permissionAuto');
        default: return typeof name === 'string' && name !== '' ? name : String(value ?? '');
      }
    }

    /** Read an agent-preset label and description, localizing shipped modes. */
    function modeDisplayText(preset, t) {
      const builtIn = {
        standard: ['mode.standard', 'mode.standardDescription'],
        ptc: ['mode.ptc', 'mode.ptcDescription'],
        minimal: ['mode.minimal', 'mode.minimalDescription'],
        cordis: ['mode.creator', 'mode.creatorDescription'],
      };
      const keys = preset?.name === undefined ? builtIn[preset?.id] : undefined;
      if (keys !== undefined) return { name: t(keys[0]), description: t(keys[1]) };
      return {
        name: typeof preset?.name === 'string' && preset.name !== '' ? preset.name : String(preset?.id ?? ''),
        ...typeof preset?.description === 'string' && preset.description !== '' ? { description: preset.description } : {},
      };
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

    /** Small pencil badge for the workspace icon edit trigger. */
    function PencilGlyph(props) {
      const size = props && props.size ? props.size : 9;
      return h('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true',
      },
      h('path', {
        d: 'M3 13l.8-3.2L11.2 2.4a1.4 1.4 0 0 1 2 2L5.8 11.8 3 13z',
        stroke: 'currentColor', strokeWidth: 1.4, strokeLinejoin: 'round',
      }),
      h('path', { d: 'M9.8 3.8l2.4 2.4', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }));
    }

    /** Render a configured workspace icon at one size. */
    function workspaceIconNode(icon, color, size) {
      if (typeof icon === 'string' && icon.startsWith('data:image/')) {
        return h('img', {
          className: 'wsc-workspaceiconimg',
          src: icon,
          width: size,
          height: size,
          alt: '',
          style: { width: `${size}px`, height: `${size}px` },
        });
      }
      const def = ICON_DEFS.find(entry => entry.id === icon);
      if (def !== undefined) {
        return h('svg', {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: color || 'currentColor',
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
        }, h('path', { d: def.path }));
      }
      return h('span', { className: 'wsc-workspaceiconfolder', style: color ? { color } : undefined }, h(FolderGlyph, { size }));
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

    /** Downscale one uploaded icon to a small square PNG data URL. */
    async function resizeIconFile(file, size) {
      const url = URL.createObjectURL(file);
      try {
        const image = await new Promise((resolve, reject) => {
          const element = new Image();
          element.onload = () => resolve(element);
          element.onerror = () => reject(new Error('decode'));
          element.src = url;
        });
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        if (context === null) throw new Error('canvas');
        const scale = Math.min(size / image.width, size / image.height);
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        context.clearRect(0, 0, size, size);
        context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
        return canvas.toDataURL('image/png');
      } finally {
        URL.revokeObjectURL(url);
      }
    }

    /** Modal that edits one Workspace's context configuration. */
    function createWorkspaceDialog(options) {
      const { api, t, closeDialog, uiWorkspace, bump } = options;

      return function WorkspaceDialog({ request }) {
        const [phase, setPhase] = React.useState('loading');
        const [error, setError] = React.useState(null);
        const [title, setTitle] = React.useState(request.title || '');
        const [path, setPath] = React.useState(request.path || '');
        const [description, setDescription] = React.useState('');
        const [systemPrompt, setSystemPrompt] = React.useState('');
        const [entries, setEntries] = React.useState([]);
        const [draftColor, setDraftColor] = React.useState('');
        const [draftIcon, setDraftIcon] = React.useState('');
        const [appearanceOpen, setAppearanceOpen] = React.useState(false);
        const [appearanceTab, setAppearanceTab] = React.useState('icon');
        const fileInput = React.useRef(null);
        const iconInput = React.useRef(null);

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
              setDraftColor(typeof data.config.color === 'string' ? data.config.color : '');
              setDraftIcon(typeof data.config.icon === 'string' ? data.config.icon : '');
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
            setError(describeError(reason, t));
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

        const pickIcon = async (event) => {
          const file = event.target.files === null || event.target.files === undefined ? undefined : event.target.files[0];
          event.target.value = '';
          if (file === undefined) return;
          if (!/^image\/(?:png|jpeg|webp|gif)$/i.test(file.type)) {
            setError(t('dialog.iconInvalid'));
            return;
          }
          if (file.size > 5 * 1024 * 1024) {
            setError(t('dialog.iconTooLarge'));
            return;
          }
          try {
            setDraftIcon(await resizeIconFile(file, 64));
            setError(null);
          } catch {
            setError(t('dialog.iconInvalid'));
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
              color: draftColor,
              icon: draftIcon,
              entries: entries.map((entry) => entry.kind === 'folder'
                ? { id: entry.id, kind: 'folder', path: entry.path, name: entry.name }
                : { id: entry.id, kind: 'file', name: entry.name, text: entry.text, bytes: entry.bytes }),
            });
            closeDialog();
            if (typeof bump === 'function') bump();
            api.notify(t('dialog.saved'), true);
            return data;
          } catch (reason) {
            setError(describeError(reason, t));
            setPhase('ready');
          }
        };

        const iconTab = h('div', { className: 'wsc-tabpanel', role: 'tabpanel' },
          h('div', { className: 'wsc-icongrid' },
            h('button', {
              type: 'button',
              className: draftIcon === '' ? 'wsc-iconchoice selected' : 'wsc-iconchoice',
              title: t('dialog.defaultIcon'),
              'aria-label': t('dialog.defaultIcon'),
              onClick: () => setDraftIcon(''),
            }, h(FolderGlyph, { size: 16 })),
            ICON_DEFS.map(def => h('button', {
              type: 'button',
              key: def.id,
              className: draftIcon === def.id ? 'wsc-iconchoice selected' : 'wsc-iconchoice',
              title: t(`iconNames.${def.id}`),
              'aria-label': t(`iconNames.${def.id}`),
              onClick: () => setDraftIcon(def.id),
            }, h('svg', {
              width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true,
              stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
            }, h('path', { d: def.path })))),
            h('input', {
              ref: iconInput,
              type: 'file',
              accept: 'image/png,image/jpeg,image/webp,image/gif',
              hidden: true,
              onChange: pickIcon,
            })),
          h('div', { className: 'wsc-iconuploadrow' },
            h('button', {
              type: 'button',
              className: 'wsc-btn wsc-btn-ghost wsc-iconuploadbtn',
              onClick: () => iconInput.current?.click(),
            }, t('dialog.uploadIcon')),
            draftIcon.startsWith('data:image/')
              ? h('button', { type: 'button', className: 'wsc-btn wsc-btn-ghost wsc-iconremove', onClick: () => setDraftIcon('') }, t('dialog.removeIcon'))
              : null));

        const colorTab = h('div', { className: 'wsc-tabpanel', role: 'tabpanel' },
          h('div', { className: 'wsc-colorchoices' },
            h('button', {
              type: 'button',
              className: draftColor === '' ? 'wsc-colorauto selected' : 'wsc-colorauto',
              title: t('dialog.automatic'),
              onClick: () => setDraftColor(''),
            }, t('dialog.automatic')),
            ICON_COLORS.map(color => h('button', {
              type: 'button',
              key: color,
              className: draftColor === color ? 'wsc-colorchoice selected' : 'wsc-colorchoice',
              style: { background: color },
              title: color,
              'aria-label': color,
              onClick: () => setDraftColor(color),
            })),
            h('label', { className: 'wsc-colorcustom', title: t('dialog.customColor') },
              h('input', {
                type: 'color',
                value: draftColor || '#8b8f98',
                'aria-label': t('dialog.customColor'),
                onChange: (event) => setDraftColor(event.target.value),
              }))));

        const appearancePanel = appearanceOpen
          ? h('div', {
            className: 'wsc-appearance',
            id: 'wsc-appearance-panel',
            role: 'group',
            'aria-label': t('dialog.appearance'),
            onKeyDown: (event) => {
              if (event.key !== 'Escape') return;
              event.preventDefault();
              event.stopPropagation();
              setAppearanceOpen(false);
            },
          },
            h('div', { className: 'wsc-appearancehead' },
              h('div', { className: 'wsc-tabs', role: 'tablist', 'aria-label': t('dialog.appearance') },
                h('button', {
                  type: 'button',
                  role: 'tab',
                  'aria-selected': appearanceTab === 'icon',
                  className: 'wsc-tab',
                  onClick: () => setAppearanceTab('icon'),
                }, t('dialog.icon')),
                h('button', {
                  type: 'button',
                  role: 'tab',
                  'aria-selected': appearanceTab === 'color',
                  className: 'wsc-tab',
                  onClick: () => setAppearanceTab('color'),
                }, t('dialog.color'))),
              h('button', {
                type: 'button',
                className: 'wsc-appearanceclose',
                title: t('dialog.close'),
                'aria-label': t('dialog.close'),
                onClick: () => setAppearanceOpen(false),
              }, '×')),
            appearanceTab === 'icon' ? iconTab : colorTab)
          : null;

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
              h('div', { className: 'wsc-workspace-row' },
                h('button', {
                  type: 'button',
                  className: 'wsc-iconbutton',
                  title: t('dialog.editAppearance'),
                  'aria-label': t('dialog.editAppearance'),
                  'aria-expanded': appearanceOpen,
                  'aria-controls': 'wsc-appearance-panel',
                  onClick: () => setAppearanceOpen((open) => !open),
                },
                  workspaceIconNode(draftIcon, draftColor, 18),
                  h('span', { className: 'wsc-iconpencil', 'aria-hidden': true }, h(PencilGlyph, { size: 9 }))),
                h('span', { className: 'wsc-workspacename', title: title || path || t('dialog.name') }, title || path || t('dialog.name')),
                h('button', {
                  type: 'button',
                  className: 'wsc-editlink',
                  'aria-expanded': appearanceOpen,
                  'aria-controls': 'wsc-appearance-panel',
                  onClick: () => setAppearanceOpen((open) => !open),
                }, t('dialog.appearance'))),
              appearancePanel,
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

    /** Shared fetch for the right-sidebar guide card and the full Context tab. */
    function useContextState({ sessionId, api, t, contextBumps, useSessions, useWorkspaces }) {
      const cwd = useSessions((state) => (sessionId === undefined ? undefined : state.byId?.[sessionId]?.cwd));
      const workspaceId = useWorkspaces((state) => {
        if (sessionId === undefined) return undefined;
        const items = Array.isArray(state.items) ? state.items : [];
        const bySession = items.find((item) => Array.isArray(item.sessionIds) && item.sessionIds.includes(sessionId));
        if (bySession !== undefined) return bySession.workspaceId;
        if (cwd === undefined) return undefined;
        return items.find((item) => item.path === cwd)?.workspaceId;
      });
      const version = useStore(contextBumps);
      const [state, setState] = React.useState({ phase: 'loading', data: null, error: null });

      React.useEffect(() => {
        if (sessionId === undefined) {
          setState({ phase: 'idle', data: null, error: null });
          return undefined;
        }
        let cancelled = false;
        const suffix = workspaceId === undefined ? '' : `&workspaceId=${encodeURIComponent(workspaceId)}`;
        api.get(`/session/context?sessionId=${encodeURIComponent(sessionId)}${suffix}`)
          .then((data) => {
            if (cancelled) return;
            setState({ phase: 'ready', data, error: null });
          })
          .catch((reason) => {
            if (cancelled) return;
            setState({ phase: 'error', data: null, error: describeError(reason, t) });
          });
        return () => {
          cancelled = true;
        };
      }, [sessionId, workspaceId, version]);

      return { state, workspaceId };
    }

    /** Entry rows shared by the full tab. */
    function contextRows(entries, source, t, onRemove) {
      return entries.map((entry) => h('div', {
        className: 'wsc-side-row',
        key: `${source}:${entry.id}`,
        title: entry.path || entry.name,
      },
      h('span', { className: 'wsc-side-icon' }, entry.kind === 'folder' ? h(FolderGlyph, { size: 13 }) : h(FileGlyph, { size: 13 })),
      h('span', { className: 'wsc-side-text' },
        h('span', { className: 'wsc-side-name' }, entry.name),
        h('span', { className: 'wsc-side-meta' }, entry.kind === 'folder' ? entry.path : `${t('dialog.fileTag')} · ${formatBytes(entry.bytes || 0)}`)),
      source === 'session'
        ? h('button', {
          type: 'button',
          className: 'wsc-side-remove',
          title: t('session.remove'),
          'aria-label': t('session.remove'),
          onClick: () => void onRemove(entry.id),
        }, '×')
        : null));
    }

    /** Guide card shown in the right Sidebar's Start page. */
    function createContextGuideCard(options) {
      const { api, contextBumps } = options;
      return function ContextGuideCard({ title, description, kind, sessionId, useTabInfo, useSessions, useWorkspaces, t }) {
        const { state } = useContextState({ sessionId, api, t, contextBumps, useSessions, useWorkspaces });
        const { tab } = useTabInfo();
        const entries = Array.isArray(state.data?.merged) ? state.data.merged : [];
        const preview = entries.slice(0, 4);
        const remaining = entries.length - preview.length;
        const open = () => {
          tab.actions.openTab(kind, { replaceTab: true });
        };
        return h('div', { className: 'wsc-guide-wrap' },
          h('style', null, CSS),
          h('button', {
            type: 'button',
            className: 'wsc-guide',
            'data-sidebar-right-guide-entry': kind,
            'aria-label': description === undefined ? title : `${title} ${description}`,
            onClick: open,
          },
          h('span', { className: 'wsc-guide-icon' }, h(FolderGlyph, { size: 22 })),
          h('span', { className: 'wsc-guide-body' },
            h('span', { className: 'wsc-guide-title' }, title),
            h('span', { className: 'wsc-guide-desc' }, entries.length === 0
              ? (state.phase === 'loading' ? t('dialog.loading') : t('sidebar.empty'))
              : `${entries.length} · ${t('sidebar.description')}`),
            entries.length === 0
              ? null
              : h('span', { className: 'wsc-guide-list' },
                ...preview.map((entry) => h('span', { className: 'wsc-guide-item', key: `${entry.source}:${entry.id}` },
                  entry.kind === 'folder' ? h(FolderGlyph, { size: 12 }) : h(FileGlyph, { size: 12 }),
                  h('span', { className: 'wsc-guide-name' }, entry.name),
                  h('span', { className: 'wsc-guide-source' }, entry.source === 'workspace' ? t('sidebar.workspace') : t('sidebar.session')))),
                remaining > 0 ? h('span', { className: 'wsc-guide-more' }, t('sidebar.more', { count: remaining })) : null)),
          h('span', { className: 'wsc-guide-chevron' }, '›')));
      };
    }

    /** Full Context tab opened from the guide card. */
    function createContextTab(options) {
      const { api, t: boundT, contextBumps, openDialog, addFolder } = options;
      return function ContextTab({ sessionId, useSessions, useWorkspaces, t }) {
        const { state } = useContextState({ sessionId, api, t, contextBumps, useSessions, useWorkspaces });
        const data = state.data;
        const workspace = data?.workspace ?? null;
        const workspaceEntries = Array.isArray(data?.workspaceEntries) ? data.workspaceEntries : [];
        const sessionEntries = Array.isArray(data?.sessionEntries) ? data.sessionEntries : [];
        const total = workspaceEntries.length + sessionEntries.length;

        const remove = async (entryId) => {
          try {
            await api.post('/session/entries/remove', { sessionId, entryId });
            contextBumps.set(contextBumps.get() + 1);
          } catch (reason) {
            api.notify(describeError(reason, boundT), false);
          }
        };

        return h('div', { className: 'wsc-rt' },
          h('style', null, CSS),
          h('div', { className: 'wsc-rt-head' },
            h('span', { className: 'wsc-rt-title' }, t('sidebar.title')),
            h('span', { className: 'wsc-side-count' }, String(total)),
            h('button', {
              type: 'button',
              className: 'wsc-side-add',
              title: t('sidebar.addFolder'),
              'aria-label': t('sidebar.addFolder'),
              onClick: () => void addFolder(sessionId),
            }, '+')),
          h('div', { className: 'wsc-rt-body' },
            state.phase === 'loading' ? h('div', { className: 'wsc-side-empty' }, t('dialog.loading')) : null,
            state.phase === 'error' ? h('div', { className: 'wsc-side-error' }, state.error) : null,
            workspace === null || (workspaceEntries.length === 0 && total === 0)
              ? null
              : h('div', { className: 'wsc-side-group' },
                h('div', { className: 'wsc-side-group-head' },
                  h('span', { className: 'wsc-side-group-title' }, workspace.title),
                  h('button', {
                    type: 'button',
                    className: 'wsc-side-gear',
                    title: t('menu.configure'),
                    'aria-label': t('menu.configure'),
                    onClick: () => openDialog({ workspaceId: workspace.workspaceId, path: workspace.path, title: workspace.title }),
                  }, h(SettingsGlyph, { size: 14 }))),
                workspaceEntries.length === 0
                  ? h('div', { className: 'wsc-side-empty' }, t('sidebar.noWorkspaceContext'))
                  : contextRows(workspaceEntries, 'workspace', t, remove)),
            sessionEntries.length === 0 ? null : h('div', { className: 'wsc-side-group' },
              h('div', { className: 'wsc-side-group-head' },
                h('span', { className: 'wsc-side-group-title' }, t('sidebar.session'))),
              contextRows(sessionEntries, 'session', t, remove)),
            total === 0 && state.phase === 'ready'
              ? h('div', { className: 'wsc-side-empty' },
                h('span', null, t('sidebar.empty')),
                h('span', null, t('sidebar.emptyHint')),
                h('button', { type: 'button', onClick: () => void addFolder(sessionId) }, `+ ${t('sidebar.addFolder')}`),
                workspace === null ? null : h('button', {
                  type: 'button',
                  onClick: () => openDialog({ workspaceId: workspace.workspaceId, path: workspace.path, title: workspace.title }),
                }, t('menu.configure')))
              : null));
      };
    }

    /** Chat bubble glyph for the project page chat list. */
    function ChatGlyph(props) {
      const size = props && props.size ? props.size : 15;
      return h('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true',
      },
      h('path', {
        d: 'M2.5 4.25A2.25 2.25 0 0 1 4.75 2h6.5a2.25 2.25 0 0 1 2.25 2.25v5A2.25 2.25 0 0 1 11.25 11.5H7.1L4.2 13.7a.55.55 0 0 1-.88-.44V11.4a2.25 2.25 0 0 1-0.82-1.74z',
        stroke: 'currentColor', strokeWidth: 1.35, strokeLinejoin: 'round',
      }));
    }

    /** Compact date label for one project chat. */
    function sessionTime(value) {
      const stamp = typeof value === 'number' ? value : typeof value === 'string' ? Date.parse(value) : Number.NaN;
      if (Number.isNaN(stamp)) return '';
      const date = new Date(stamp);
      if (Number.isNaN(date.getTime())) return '';
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    }

    /** Main-panel project page opened by clicking a workspace row. */
    function createWorkspaceOverview(options) {
      const { api, overviewStore, contextBumps, openDialog, uiWorkspace, sendPrompt, composer } = options;
      return function WorkspaceOverview({ useWorkspaces, useSessions, t }) {
        const request = useStore(overviewStore);
        const workspaceId = request?.workspaceId;
        const workspace = useWorkspaces((state) => {
          if (workspaceId === undefined) return undefined;
          const items = Array.isArray(state.items) ? state.items : [];
          return items.find((item) => item.workspaceId === workspaceId);
        });
        const archived = useWorkspaces((state) => (Array.isArray(state.archivedSessionIds) ? state.archivedSessionIds : []));
        const byId = useSessions((state) => state.byId ?? {});
        const version = useStore(contextBumps);
        const [state, setState] = React.useState({ phase: 'loading', config: null, meta: null, error: null });
        const [draft, setDraft] = React.useState('');
        const [sending, setSending] = React.useState(false);
        const [composerError, setComposerError] = React.useState(null);
        const sessionRef = React.useRef(null);
        const sessionPromise = React.useRef(null);
        const draftRef = React.useRef(null);
        const workspaceToken = React.useRef(0);
        const menusRef = React.useRef(null);
        const [modelOpen, setModelOpen] = React.useState(false);
        const [modelDirectory, setModelDirectory] = React.useState(null);
        const modelSnapshot = useSnapshot(modelDirectory?.store ?? EMPTY_MODEL_STORE);
        const [modelLoading, setModelLoading] = React.useState(false);
        const [modelError, setModelError] = React.useState(null);
        const [defaultModel, setDefaultModel] = React.useState(null);
        const [permissionOpen, setPermissionOpen] = React.useState(false);
        const [permissionOptions, setPermissionOptions] = React.useState([]);
        const [permissionCurrent, setPermissionCurrent] = React.useState(null);
        const [permissionLoading, setPermissionLoading] = React.useState(false);
        const [permissionError, setPermissionError] = React.useState(null);
        const [permissionConfirm, setPermissionConfirm] = React.useState(null);
        const [modeOpen, setModeOpen] = React.useState(false);
        const [modeRoster, setModeRoster] = React.useState([]);
        const [modeCurrent, setModeCurrent] = React.useState(null);
        const [modeLoading, setModeLoading] = React.useState(false);
        const [modeError, setModeError] = React.useState(null);

        React.useEffect(() => {
          workspaceToken.current += 1;
          if (draftRef.current !== null) {
            try {
              draftRef.current.release();
            } catch {
              // The scope may already have been dropped by a workspace switch.
            }
            draftRef.current = null;
          }
          sessionRef.current = null;
          sessionPromise.current = null;
          setDraft('');
          setSending(false);
          setComposerError(null);
          setModelOpen(false);
          setModelDirectory(null);
          setModelError(null);
          setModelLoading(false);
          setDefaultModel(null);
          setPermissionOpen(false);
          setPermissionOptions([]);
          setPermissionCurrent(null);
          setPermissionError(null);
          setPermissionLoading(false);
          setPermissionConfirm(null);
          setModeOpen(false);
          setModeRoster([]);
          setModeCurrent(null);
          setModeLoading(false);
          setModeError(null);
        }, [workspaceId]);

        React.useEffect(() => () => {
          if (draftRef.current !== null) {
            try {
              draftRef.current.release();
            } catch {
              // The session scope may already be gone.
            }
            draftRef.current = null;
          }
        }, []);

        React.useEffect(() => {
          if (workspaceId === undefined) return undefined;
          let cancelled = false;
          composer.agentPresetsList().then((result) => {
            if (cancelled || !result?.ok) return;
            const presets = Array.isArray(result.value?.presets) ? result.value.presets : [];
            const healthy = presets.filter((preset) => preset.broken === undefined);
            const fallback = presets.find((preset) => preset.isDefault === true)?.id ?? presets[0]?.id ?? null;
            setModeRoster(healthy);
            if (fallback !== null) setModeCurrent((current) => (current === null ? fallback : current));
          }).catch(() => {
            // The mode menu reports a failure when opened; the label stays generic.
          });
          composer.defaultModelInfo().then((info) => {
            if (!cancelled && info !== null) setDefaultModel(info);
          }).catch(() => {
            // The model menu reports a failure when opened; the label stays generic.
          });
          return () => {
            cancelled = true;
          };
        }, [workspaceId]);

        React.useEffect(() => {
          if (!modelOpen && !permissionOpen && !modeOpen) return undefined;
          const onDown = (event) => {
            if (menusRef.current !== null && menusRef.current.contains(event.target)) return;
            setModelOpen(false);
            setPermissionOpen(false);
            setPermissionConfirm(null);
            setModeOpen(false);
          };
          document.addEventListener('mousedown', onDown);
          return () => document.removeEventListener('mousedown', onDown);
        }, [modelOpen, permissionOpen, modeOpen]);

        React.useEffect(() => {
          if (workspaceId === undefined) {
            setState({ phase: 'idle', config: null, meta: null, error: null });
            return undefined;
          }
          let cancelled = false;
          api.get(`/state?workspaceId=${encodeURIComponent(workspaceId)}`).then((data) => {
            if (cancelled) return;
            setState({ phase: 'ready', config: data.config, meta: data.workspace, error: null });
          }, (reason) => {
            if (cancelled) return;
            setState({ phase: 'error', config: null, meta: null, error: describeError(reason, t) });
          });
          return () => {
            cancelled = true;
          };
        }, [workspaceId, version]);

        if (workspaceId === undefined) {


        return h('div', { className: 'wsc-project' }, h('style', null, CSS), h('div', { className: 'wsc-project-empty' }, t('overview.selectWorkspace')));
        }

        const meta = workspace ?? state.meta;
        const config = state.config ?? { description: '', systemPrompt: '', entries: [] };
        const archivedSet = new Set(archived);
        const memberIds = new Set(Array.isArray(workspace?.sessionIds) ? workspace.sessionIds : []);
        const projectPath = meta?.path ?? workspace?.path;
        const chats = [];
        for (const [id, summary] of Object.entries(byId)) {
          if (summary === null || summary === undefined || summary.blank) continue;
          if (summary.origin === 'subagent' || archivedSet.has(id)) continue;
          if (!memberIds.has(id) && summary.cwd !== projectPath) continue;
          chats.push({ id, ...summary });
        }
        chats.sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0));

        if (meta === undefined || meta === null) {
          return h('div', { className: 'wsc-project' }, h('style', null, CSS), h('div', { className: 'wsc-project-empty' },
            state.phase === 'error' ? state.error : state.phase === 'loading' ? t('dialog.loading') : t('overview.notFound')));
        }

        const openWorkspaceDialog = () => openDialog({ workspaceId, path: meta.path, title: meta.title });
        const entries = Array.isArray(config.entries) ? config.entries : [];

        const ensureSession = () => {
          if (sessionRef.current !== null) return Promise.resolve(sessionRef.current);
          if (sessionPromise.current === null) {
            const token = workspaceToken.current;
            sessionPromise.current = composer.connectWorkspace(workspaceId).then(async (id) => {
              if (workspaceToken.current !== token) return id;
              const reference = composer.retain(id);
              if (reference !== undefined) {
                draftRef.current = reference;
                try {
                  await reference.ready;
                } catch (error) {
                  reference.release();
                  draftRef.current = null;
                  throw error;
                }
              }
              if (workspaceToken.current === token) sessionRef.current = id;
              return id;
            }).finally(() => {
              sessionPromise.current = null;
            });
          }
          return sessionPromise.current;
        };

        const openModelMenu = async () => {
          if (modelOpen) {
            setModelOpen(false);
            return;
          }
          const token = workspaceToken.current;
          setPermissionOpen(false);
          setPermissionConfirm(null);
          setModeOpen(false);
          setModelOpen(true);
          setModelError(null);
          setModelLoading(true);
          try {
            const sessionId = await ensureSession();
            if (workspaceToken.current !== token) return;
            const directory = composer.modelDirectory(sessionId);
            if (directory === undefined) throw new Error(t('composer.modelError'));
            setModelDirectory(directory);
            await directory.load();
          } catch (reason) {
            if (workspaceToken.current === token) setModelError(describeError(reason, t));
          } finally {
            if (workspaceToken.current === token) setModelLoading(false);
          }
        };

        const selectModel = async (group, model) => {
          if (modelDirectory === null) return;
          setModelError(null);
          try {
            const result = await modelDirectory.select({ provider: group.id, model: model.id });
            if (!result?.ok) {
              const error = new Error(result?.error?.message ?? t('composer.modelError'));
              error.code = result?.error?.code;
              throw error;
            }
            setModelOpen(false);
          } catch (reason) {
            setModelError(describeError(reason, t));
          }
        };

        const readPermissionProjection = async (binding) => {
          const deadline = Date.now() + 2_000;
          while (Date.now() < deadline) {
            try {
              const projection = binding?.session?.projections?.faceOf?.('permissions')?.getSnapshot?.();
              if (projection !== undefined) return projection;
            } catch {
              // The projection may still be registering on a just-opened session.
            }
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
          return undefined;
        };

        const openPermissionMenu = async () => {
          if (permissionOpen) {
            setPermissionOpen(false);
            return;
          }
          const token = workspaceToken.current;
          setModelOpen(false);
          setModeOpen(false);
          setPermissionOpen(true);
          setPermissionError(null);
          setPermissionConfirm(null);
          setPermissionLoading(true);
          try {
            const sessionId = await ensureSession();
            if (workspaceToken.current !== token) return;
            const binding = composer.binding(sessionId);
            const projection = await readPermissionProjection(binding);
            if (workspaceToken.current !== token) return;
            if (projection === undefined) throw new Error(t('composer.permissionUnavailable'));
            const result = await composer.permissionCatalog();
            if (!result?.ok) {
              const error = new Error(result?.error?.message ?? t('composer.permissionError'));
              error.code = result?.error?.code;
              throw error;
            }
            if (workspaceToken.current !== token) return;
            setPermissionOptions(Array.isArray(result.value?.options) ? result.value.options : []);
            setPermissionCurrent(projection.currentValue ?? null);
          } catch (reason) {
            if (workspaceToken.current === token) setPermissionError(describeError(reason, t));
          } finally {
            if (workspaceToken.current === token) setPermissionLoading(false);
          }
        };

        const applyPermission = async (value) => {
          const sessionId = await ensureSession();
          const binding = composer.binding(sessionId);
          if (binding === undefined) throw new Error(t('composer.permissionUnavailable'));
          const result = await binding.session.command(`/permission ${value}`);
          if (!result?.ok) {
            const error = new Error(result?.error?.message ?? t('composer.permissionError'));
            error.code = result?.error?.code;
            throw error;
          }
          if (result.value?.matched !== true) throw new Error(t('composer.permissionUnavailable'));
          setPermissionCurrent(value);
          setPermissionConfirm(null);
          setPermissionOpen(false);
        };

        const pickPermission = async (value) => {
          if (value === permissionCurrent) {
            setPermissionOpen(false);
            return;
          }
          if (value === 'danger-full-access' || value === 'auto') {
            setPermissionConfirm(value);
            return;
          }
          setPermissionError(null);
          try {
            await applyPermission(value);
          } catch (reason) {
            setPermissionError(describeError(reason, t));
          }
        };

        const confirmPermission = async () => {
          if (permissionConfirm === null) return;
          setPermissionError(null);
          try {
            await applyPermission(permissionConfirm);
          } catch (reason) {
            setPermissionError(describeError(reason, t));
          }
        };

        const openModeMenu = async () => {
          if (modeOpen) {
            setModeOpen(false);
            return;
          }
          const token = workspaceToken.current;
          setModelOpen(false);
          setPermissionOpen(false);
          setPermissionConfirm(null);
          setModeOpen(true);
          setModeError(null);
          setModeLoading(true);
          try {
            const sessionId = await ensureSession();
            if (workspaceToken.current !== token) return;
            const result = await composer.agentPresetsList();
            if (!result?.ok) {
              const error = new Error(result?.error?.message ?? t('mode.error'));
              error.code = result?.error?.code;
              throw error;
            }
            const presets = Array.isArray(result.value?.presets) ? result.value.presets : [];
            const healthy = presets.filter((preset) => preset.broken === undefined);
            const summary = composer.sessionSummary(sessionId);
            const listed = summary?.projectionValues?.agentPreset;
            const fallback = presets.find((preset) => preset.isDefault === true)?.id ?? presets[0]?.id ?? null;
            if (workspaceToken.current !== token) return;
            setModeRoster(healthy);
            setModeCurrent(typeof listed === 'string' ? listed : fallback);
          } catch (reason) {
            if (workspaceToken.current === token) setModeError(describeError(reason, t));
          } finally {
            if (workspaceToken.current === token) setModeLoading(false);
          }
        };

        const selectMode = async (presetId) => {
          setModeError(null);
          try {
            const sessionId = await ensureSession();
            const result = await composer.selectAgentPreset(sessionId, presetId);
            if (!result?.ok) {
              const error = new Error(result?.error?.message ?? t('mode.error'));
              error.code = result?.error?.code;
              throw error;
            }
            setModeCurrent(typeof result.value === 'string' ? result.value : presetId);
            setModeOpen(false);
          } catch (reason) {
            setModeError(describeError(reason, t));
          }
        };

        const selectedModel = modelSnapshot.current;
        const selectedGroup = modelSnapshot.groups.find((group) => group.id === selectedModel?.provider);
        const selectedEntry = selectedGroup?.models?.find((model) => model.id === selectedModel?.model);
        const modelLabel = selectedEntry?.name ?? defaultModel?.name ?? (modelLoading ? t('composer.modelLoading') : t('composer.defaultModel'));
        const modelErrorText = modelError ?? (modelSnapshot.status === 'error' ? modelSnapshot.error : null);
        const permissionText = permissionCurrent === null
          ? t('composer.permissionDefault')
          : permissionLabel(permissionCurrent, permissionCurrent, t);
        const modeEntry = modeRoster.find((preset) => preset.id === modeCurrent);
        const modeLabel = modeCurrent === null
          ? (modeLoading ? t('mode.loading') : t('mode.default'))
          : modeDisplayText(modeEntry ?? { id: modeCurrent }, t).name;

        const send = async (event) => {
          if (event !== undefined && event !== null && typeof event.preventDefault === 'function') event.preventDefault();
          const text = draft.trim();
          if (text === '' || sending) return;
          setSending(true);
          setComposerError(null);
          const token = workspaceToken.current;
          try {
            const sessionId = await ensureSession();
            if (workspaceToken.current !== token) return;
            await sendPrompt(workspaceId, text, sessionId);
            setDraft('');
          } catch (reason) {
            const message = describeError(reason, t);
            setComposerError(message);
            setSending(false);
            api.notify(message, false);
          }
        };
        const onComposerKeyDown = (event) => {
          if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent?.isComposing) return;
          event.preventDefault();
          void send();
        };

        const modeTool = h('div', { className: 'wsc-project-tool' },
                              h('button', {
                                type: 'button',
                                className: 'wsc-project-trigger wsc-project-modetrigger',
                                onClick: openModeMenu,
                                'aria-expanded': modeOpen,
                                title: t('mode.label'),
                              },
                              h('svg', { viewBox: '0 0 16 16', width: 12, height: 12, fill: 'none', 'aria-hidden': true, className: 'wsc-project-triggericon' },
                                h('path', { d: 'M8 1.8l1.3 3.4 3.4 1.3-3.4 1.3L8 11.2 6.7 7.8 3.3 6.5l3.4-1.3L8 1.8z', stroke: 'currentColor', strokeWidth: 1.2, strokeLinejoin: 'round' })),
                              h('span', { className: 'wsc-project-triggerlabel' }, modeLabel),
                              h('span', { className: 'wsc-project-triggerchevron' }, '⌄')),
                              modeOpen ? h('div', { className: 'wsc-project-menu' },
                                modeLoading ? h('div', { className: 'wsc-project-menunote' }, t('mode.loading')) : null,
                                modeError === null ? null : h('div', { className: 'wsc-project-menuerror' }, modeError),
                                modeRoster.map((preset) => {
                                  const text = modeDisplayText(preset, t);
                                  return h('button', {
                                    type: 'button',
                                    className: 'wsc-project-option wsc-project-modeoption',
                                    key: preset.id,
                                    onClick: () => void selectMode(preset.id),
                                  },
                                  h('span', { className: 'wsc-project-modecopy' },
                                    h('span', { className: 'wsc-project-optionname' }, text.name),
                                    text.description === undefined ? null : h('span', { className: 'wsc-project-optiondesc' }, text.description)),
                                  modeCurrent === preset.id ? h('span', { className: 'wsc-project-optioncheck' }, '✓') : null);
                                }),
                                !modeLoading && modeError === null && modeRoster.length === 0
                                  ? h('div', { className: 'wsc-project-menunote' }, t('mode.empty'))
                                  : null) : null);

        return h('div', { className: 'wsc-project' },
          h('style', null, CSS),
          h('div', { className: 'wsc-project-inner' },
            h('div', { className: 'wsc-project-main' },
              h('header', { className: 'wsc-project-head' },
                h('div', { className: 'wsc-project-titlewrap' },
                  h('span', { className: 'wsc-project-icon' }, workspaceIconNode(config.icon, config.color, 26)),
                  h('div', { style: { minWidth: 0 } },
                    h('h1', { className: 'wsc-project-title' }, meta.title || meta.path),
                    h('p', { className: 'wsc-project-path' }, meta.path))),
                h('div', { className: 'wsc-project-actions' },
                  h('button', { type: 'button', className: 'wsc-btn wsc-btn-primary', onClick: () => uiWorkspace.startSession(workspaceId) }, t('overview.newSession')),
                  h('button', { type: 'button', className: 'wsc-btn', onClick: openWorkspaceDialog }, t('menu.configure')))),
              h('p', { className: config.description ? 'wsc-project-desc' : 'wsc-project-desc wsc-project-muted' }, config.description || t('overview.noDescription')),
              state.phase === 'error' ? h('div', { className: 'wsc-project-error' }, state.error) : null,
              h('div', { className: 'wsc-project-composerstack', ref: menusRef },
                h('div', { className: 'wsc-project-composerhead' }, modeTool),
                h('form', { className: 'wsc-project-composer', onSubmit: send },
                h('textarea', {
                  className: 'wsc-project-input',
                  rows: 2,
                  value: draft,
                  placeholder: t('overview.composerPlaceholder'),
                  disabled: sending,
                  onChange: (event) => setDraft(event.target.value),
                  onKeyDown: onComposerKeyDown,
                }),
                h('div', { className: 'wsc-project-composerbar' },
                  h('div', { className: 'wsc-project-tools' },
                    h('div', { className: 'wsc-project-tool' },
                      h('button', {
                        type: 'button',
                        className: 'wsc-project-trigger',
                        onClick: openPermissionMenu,
                        'aria-expanded': permissionOpen,
                        title: t('composer.permissions'),
                      },
                      h('svg', { viewBox: '0 0 16 16', width: 12, height: 12, fill: 'none', 'aria-hidden': true, className: 'wsc-project-triggericon' },
                        h('path', { d: 'M8 1.8l5 2v3.4c0 3.1-2.1 5.4-5 6.9-2.9-1.5-5-3.8-5-6.9V3.8l5-2z', stroke: 'currentColor', strokeWidth: 1.2, strokeLinejoin: 'round' })),
                      h('span', { className: 'wsc-project-triggerlabel' }, permissionText),
                      h('span', { className: 'wsc-project-triggerchevron' }, '⌄')),
                      permissionOpen ? h('div', { className: 'wsc-project-menu' },
                        permissionLoading ? h('div', { className: 'wsc-project-menunote' }, t('composer.permissionLoading')) : null,
                        permissionError === null ? null : h('div', { className: 'wsc-project-menuerror' }, permissionError),
                        permissionOptions.map((option) => h('button', {
                          type: 'button',
                          className: 'wsc-project-option',
                          key: option.value,
                          onClick: () => void pickPermission(option.value),
                        },
                        h('span', { className: 'wsc-project-optionname' }, permissionLabel(option.value, option.name, t)),
                        permissionCurrent === option.value ? h('span', { className: 'wsc-project-optioncheck' }, '✓') : null)),
                        permissionConfirm === null ? null : h('div', { className: 'wsc-project-confirm' },
                          h('p', null, permissionConfirm === 'auto' ? t('composer.permissionConfirmAuto') : t('composer.permissionConfirmFull')),
                          h('div', { className: 'wsc-project-confirmactions' },
                            h('button', { type: 'button', className: 'wsc-btn wsc-btn-ghost', onClick: () => setPermissionConfirm(null) }, t('composer.cancel')),
                            h('button', { type: 'button', className: 'wsc-btn wsc-btn-primary', onClick: () => void confirmPermission() }, t('composer.confirm')))),
                        !permissionLoading && permissionError === null && permissionOptions.length === 0
                          ? h('div', { className: 'wsc-project-menunote' }, t('composer.permissionUnavailable'))
                          : null) : null)),
                  h('div', { className: 'wsc-project-tools' },
                    h('div', { className: 'wsc-project-tool' },
                      h('button', {
                        type: 'button',
                        className: 'wsc-project-trigger',
                        onClick: openModelMenu,
                        'aria-expanded': modelOpen,
                        title: t('composer.model'),
                      },
                      h('span', { className: 'wsc-project-triggerlabel' }, modelLabel),
                      h('span', { className: 'wsc-project-triggerchevron' }, '⌄')),
                      modelOpen ? h('div', { className: 'wsc-project-menu wsc-project-menu-right' },
                        modelLoading || modelSnapshot.status === 'loading' ? h('div', { className: 'wsc-project-menunote' }, t('composer.modelLoading')) : null,
                        modelErrorText === null ? null : h('div', { className: 'wsc-project-menuerror' }, modelErrorText),
                        modelSnapshot.groups.map((group) => h('div', { className: 'wsc-project-group', key: group.id },
                          h('div', { className: 'wsc-project-grouphead' }, group.name ?? group.id),
                          (Array.isArray(group.models) ? group.models : []).map((model) => h('button', {
                            type: 'button',
                            className: 'wsc-project-option',
                            key: `${group.id}:${model.id}`,
                            disabled: modelSnapshot.status === 'selecting',
                            onClick: () => void selectModel(group, model),
                          },
                          h('span', { className: 'wsc-project-optionname' }, model.name ?? model.id),
                          selectedModel?.provider === group.id && selectedModel?.model === model.id
                            ? h('span', { className: 'wsc-project-optioncheck' }, '✓')
                            : null)))),
                        !modelLoading && modelErrorText === null && modelSnapshot.groups.length === 0
                          ? h('div', { className: 'wsc-project-menunote' }, t('composer.modelEmpty'))
                          : null) : null),
                    h('button', {
                      type: 'submit',
                      className: 'wsc-project-send',
                      disabled: sending || draft.trim() === '',
                      title: t('overview.send'),
                      'aria-label': t('overview.send'),
                    }, h('svg', { viewBox: '0 0 16 16', width: 15, height: 15, fill: 'none', 'aria-hidden': true },
                      h('path', { d: 'M8 13V3M4 7l4-4 4 4', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' })))),
              ),
              ),
              ),
              composerError === null ? null : h('div', { className: 'wsc-project-composererror' }, composerError),
              h('section', { className: 'wsc-project-chats' },
                h('div', { className: 'wsc-project-sectionhead' },
                  h('h2', { className: 'wsc-project-h2' }, t('overview.chats')),
                  h('span', { className: 'wsc-project-count' }, String(chats.length))),
                chats.length === 0
                  ? h('div', { className: 'wsc-project-empty-inline' }, t('overview.noChats'))
                  : h('div', { className: 'wsc-project-chatlist' }, chats.map((chat) => h('button', {
                    type: 'button',
                    className: 'wsc-project-chat',
                    key: chat.id,
                    title: t('overview.openChat'),
                    onClick: () => uiWorkspace.openSession(chat.id),
                  },
                  h('span', { className: 'wsc-project-chaticon' }, h(ChatGlyph, { size: 15 })),
                  h('span', { className: 'wsc-project-chattext' },
                    h('span', { className: 'wsc-project-chattitle' }, chat.title?.trim() || t('overview.untitled')),
                    h('span', { className: 'wsc-project-chatmeta' }, sessionTime(chat.updatedAt))),
                  h('span', { className: 'wsc-project-chatarrow' }, '›')))))),
            h('aside', { className: 'wsc-project-side' },
              h('section', { className: 'wsc-project-card' },
                h('div', { className: 'wsc-project-cardhead' },
                  h('h3', { className: 'wsc-project-h3' }, t('overview.instructions')),
                  h('button', { type: 'button', className: 'wsc-side-gear', title: t('menu.configure'), 'aria-label': t('menu.configure'), onClick: openWorkspaceDialog }, h(SettingsGlyph, { size: 14 }))),
                h('p', { className: config.systemPrompt ? 'wsc-project-cardtext' : 'wsc-project-cardtext wsc-project-muted' }, config.systemPrompt || t('overview.noInstructions'))),
              h('section', { className: 'wsc-project-card' },
                h('div', { className: 'wsc-project-cardhead' },
                  h('h3', { className: 'wsc-project-h3' }, t('overview.context')),
                  h('button', { type: 'button', className: 'wsc-side-add', title: t('sidebar.addFolder'), 'aria-label': t('sidebar.addFolder'), onClick: openWorkspaceDialog }, '+')),
                entries.length === 0
                  ? h('p', { className: 'wsc-project-cardtext wsc-project-muted' }, t('overview.noContext'))
                  : h('div', { className: 'wsc-side-group' }, contextRows(entries, 'workspace', t, () => {}))))));
      };
    }

    return {
      inject: [
        'slots',
        'locale',
        'contextMenus',
        'commandUi',
        'uiWorkspace',
        'sidebarRightTabs',
        'layout',
        'remote',
        'remote.permissionPresets',
        'remote.agentPresets',
      ],
      apply(ctx) {
        const disposeLocale = ctx.locale.register(NS, DICTS);
        ctx.effect(() => disposeLocale, 'workspace-context locale');

        const sidebarStyle = typeof document !== 'undefined' && document.head !== undefined && typeof document.createElement === 'function'
          ? document.createElement('style')
          : null;
        if (sidebarStyle !== null) {
          sidebarStyle.dataset.plugin = NS;
          sidebarStyle.dataset.workspaceContext = 'sidebar-chevron';
          sidebarStyle.textContent = SIDEBAR_CSS;
          document.head.appendChild(sidebarStyle);
          ctx.effect(() => () => sidebarStyle.remove(), 'workspace-context sidebar chevron');
        }

        const t = ctx.locale.bind(NS);
        const dialogStore = createStore(null);
        const overviewStore = createStore(null);
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

        const appearanceStyle = typeof document !== 'undefined' && document.head !== undefined && typeof document.createElement === 'function'
          ? document.createElement('style')
          : null;
        let appearanceRequest = 0;
        const refreshAppearance = async () => {
          if (appearanceStyle === null) return;
          const request = ++appearanceRequest;
          try {
            const data = await api.get('/presentation');
            if (request !== appearanceRequest) return;
            appearanceStyle.textContent = buildAppearanceCss(data?.workspaces);
          } catch {
            // Keep the previous appearance if the Host is unavailable.
          }
        };
        if (appearanceStyle !== null) {
          appearanceStyle.dataset.plugin = NS;
          appearanceStyle.dataset.workspaceContext = 'workspace-appearance';
          document.head.appendChild(appearanceStyle);
          ctx.effect(() => () => appearanceStyle.remove(), 'workspace-context workspace appearance');
        }
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
          const onFocus = () => { void refreshAppearance(); };
          window.addEventListener('focus', onFocus);
          ctx.effect(() => () => window.removeEventListener('focus', onFocus), 'workspace-context appearance focus');
        }
        void refreshAppearance();
        try {
          const workspaces = ctx.get('workspaces');
          const unsubscribe = workspaces?.list?.subscribe?.(() => { void refreshAppearance(); });
          if (typeof unsubscribe === 'function') ctx.effect(() => unsubscribe, 'workspace-context appearance list');
        } catch {
          // The Workspace list may not expose a snapshot in every client build.
        }

        const contextBumps = createStore(0);
        const bumpContext = () => {
          contextBumps.set(contextBumps.get() + 1);
          void refreshAppearance();
        };

        /** Pick one folder and attach it to a Session's context. */
        const addFolderToSession = async (sessionId) => {
          try {
            const picked = await ctx.uiWorkspace.pickDirectory();
            if (picked === null || picked === undefined) return;
            await api.post('/session/entries', { sessionId, path: picked });
            bumpContext();
            api.notify(t('session.added', { name: baseName(picked) }), true);
          } catch (reason) {
            api.notify(describeError(reason, t), false);
          }
        };

        /** Create a session in the workspace and send the project page prompt. */
        const sendProjectPrompt = async (workspaceId, text, existingSessionId) => {
          const sessionId = existingSessionId ?? await ctx.uiWorkspace.connectWorkspace(workspaceId);
          ctx.uiWorkspace.openSession(sessionId);
          const sessions = ctx.get('sessions');
          let binding;
          const bindingDeadline = Date.now() + 5_000;
          while (Date.now() < bindingDeadline) {
            binding = sessions?.binding?.(sessionId);
            if (binding !== undefined) break;
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
          if (binding === undefined) throw new Error(t('overview.sendFailed'));
          let opened = false;
          const deadline = Date.now() + 5_000;
          while (Date.now() < deadline) {
            const sessionState = binding.session.getSnapshot();
            if (sessionState.openState === 'open' || sessionState.openState === undefined) {
              opened = true;
              break;
            }
            if (sessionState.openState === 'error') throw new Error(sessionState.openError?.message ?? t('overview.sendFailed'));
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
          if (!opened) throw new Error(t('overview.sendFailed'));
          const restoreDraft = () => {
            try {
              ctx.get('conversation.input')?.requestDraftInitialization?.(binding, { prompt: text, whenDraftExists: 'replace' });
            } catch {
              // The composer may not be mounted yet; the toast still reports the failure.
            }
          };
          try {
            const conversation = ctx.get('conversation');
            if (conversation === undefined || typeof conversation.sendSession !== 'function') throw new Error(t('overview.sendFailed'));
            const result = await conversation.sendSession(binding.session, text, [], 'queue');
            if (result?.kind === 'error') throw new Error(t('overview.sendFailed'));
          } catch (error) {
            restoreDraft();
            throw error;
          }
        };

        const composerTools = {
          connectWorkspace: (workspaceId) => ctx.uiWorkspace.connectWorkspace(workspaceId),
          binding: (sessionId) => ctx.get('sessions')?.binding?.(sessionId),
          retain: (sessionId) => ctx.get('sessions')?.retain?.(sessionId, { source: 'workspaceContextDraft' }),
          modelDirectory: (sessionId) => ctx.get('modelDirectories')?.directoryFor?.(sessionId),
          permissionCatalog: () => ctx.get('remote')?.permissionPresets?.catalog?.(),
          agentPresetsList: () => ctx.get('remote')?.agentPresets?.list?.(),
          selectAgentPreset: (sessionId, presetId) => ctx.get('remote')?.agentPresets?.select?.(sessionId, presetId),
          sessionSummary: (sessionId) => ctx.get('sessions')?.list?.getSnapshot?.()?.byId?.[sessionId],
          defaultModelInfo: async () => {
            const catalog = ctx.get('modelDirectories')?.catalog;
            if (catalog === undefined) return null;
            try {
              await catalog.load?.();
            } catch {
              return null;
            }
            const value = catalog.store?.getSnapshot?.()?.value;
            const selection = value?.default;
            if (selection === undefined || selection === null) return null;
            const group = Array.isArray(value.groups) ? value.groups.find((entry) => entry.id === selection.provider) : undefined;
            const model = Array.isArray(group?.models) ? group.models.find((entry) => entry.id === selection.model) : undefined;
            return { provider: selection.provider, model: selection.model, name: model?.name ?? selection.model };
          },
          notify: (text, success) => api.notify(text, success),
        };

        // Workspace menu: open the project page explicitly.
        ctx.effect(() => ctx.contextMenus.register({
          id: 'workspace-context.open',
          target: 'workspace',
          order: 50,
          resolve: ({ workspaceId }) => [{
            id: 'open',
            label: t('menu.openWorkspace'),
            icon: { key: 'workspace-context.open' },
            run: () => {
              overviewStore.set({ workspaceId });
              ctx.layout.selectPanel(OVERVIEW_PANEL_ID);
            },
          }],
        }), 'workspace-context: open workspace menu');

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

        // Icons dispatched by the captured actions' icon keys.
        ctx.slots.inject('contextMenu.icon', function* () {
          yield ctx.slots.register({ name: 'contextMenu.icon', key: 'workspace-context.open' }, FolderGlyph);
          yield ctx.slots.register({ name: 'contextMenu.icon', key: 'workspace-context.settings' }, SettingsGlyph);
        });

        // The Workspace dialog lives in the frame-wide overlay layer.
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'workspace-context-dialog',
          order: 100,
        }, createWorkspaceOverlay({ api, t, closeDialog, uiWorkspace: ctx.uiWorkspace, dialogStore, bump: bumpContext })));

        // "+" menu: Folder joins the Add/Commands menu as a session context row.
        ctx.commandUi.register({
          name: 'folder',
          label: () => t('session.addFolderLabel'),
          description: () => t('session.addFolderDescription'),
          icon: FolderGlyph,
          available: (session) => session !== undefined && session !== null && typeof session.sessionId === 'string',
          ui: {
            kind: 'action',
            run: (session) => {
              const sessionId = session?.sessionId;
              if (typeof sessionId === 'string') void addFolderToSession(sessionId);
            },
          },
        });

        // Right Sidebar: one type with a Start-page card and a full tab.
        ctx.effect(() => ctx.sidebarRightTabs.register({
          id: TAB_ID,
          kind: TAB_KIND,
          priority: 'extension',
          title: () => t('sidebar.title'),
          guide: [{
            id: 'context',
            order: 0,
            title: () => t('sidebar.title'),
            description: () => t('sidebar.description'),
            icon: FolderGlyph,
          }],
        }), 'workspace-context: tab type');

        ctx.slots.inject('sidebar.right.tab.guide.entry', () => ctx.slots.register({
          name: 'sidebar.right.tab.guide.entry',
          key: TAB_ID,
          locale: NS,
        }, createContextGuideCard({ api, contextBumps })));

        ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
          name: 'sidebar.right.pane.tab',
          key: TAB_ID,
          locale: NS,
        }, createContextTab({
          api,
          t,
          contextBumps,
          openDialog,
          addFolder: addFolderToSession,
        })));

        // Main panel: the workspace project page.
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: OVERVIEW_PANEL_ID,
          locale: NS,
        }, createWorkspaceOverview({
          api,
          overviewStore,
          contextBumps,
          openDialog,
          uiWorkspace: ctx.uiWorkspace,
          sendPrompt: sendProjectPrompt,
          composer: composerTools,
        })));

        // A primary click on a real workspace row opens its project page; the
        // row's own expand/collapse handler still runs.
        ctx.effect(() => {
          if (typeof document === 'undefined') return () => {};
          const onClick = (event) => {
            if (event.button !== 0 || event.defaultPrevented) return;
            const target = event.target;
            if (target === null || target === undefined || typeof target.closest !== 'function') return;
            if (target.closest('button, [data-context-menu-trigger]') !== null) return;
            if (target.closest('[class*="_chevron"]') !== null) return;
            const row = target.closest('[data-row-key^="workspace:"]');
            if (row === null) return;
            const rowChevron = row.children !== undefined && row.children.length > 1 ? row.children[1] : null;
            if (rowChevron !== null && typeof rowChevron.contains === 'function' && rowChevron.contains(target)) return;
            const key = typeof row.getAttribute === 'function' ? row.getAttribute('data-row-key') : null;
            if (typeof key !== 'string') return;
            const workspaceId = key.slice('workspace:'.length);
            if (workspaceId === '') return;
            if (typeof event.preventDefault === 'function') event.preventDefault();
            if (typeof event.stopPropagation === 'function') event.stopPropagation();
            overviewStore.set({ workspaceId });
            try {
              ctx.layout.selectPanel(OVERVIEW_PANEL_ID);
            } catch {
              // The panel may be transiently unregistered during an HMR swap.
            }
          };
          document.addEventListener('click', onClick, true);
          return () => document.removeEventListener('click', onClick, true);
        }, 'workspace-context: workspace row click');
      },
    };
  },
});
