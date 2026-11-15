window.__ModuleLoader__.load({
  id: '@local/dsh-total-config',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'dsh-total-config';
    const ROUTE = '/dsh-total-config';
    const HEADER = 'x-dsh-total-config';
    const TAB_ID = '@local/dsh-total-config';
    const TAB_KIND = 'dsh-total-workspace-context';
    const OVERVIEW_PANEL_ID = 'dsh-total-workspace-overview';
    const NUDGE_ID = '__dsh-total-config-nudge__';
    const DRAG_THRESHOLD = 5;
    const DIALOG = '[data-shortcut-modal="settings"]';
    const GITHUB_SPEC = /^(?:https?:\/\/)?(?:www\.)?github\.com\/[^/\s]+\/[^/\s]+\/(?:tree|blob)\//i;
    const MAX_FILE_BYTES = 128 * 1024;

    const FEATURE_DEFAULTS = {
      reorderSections: true,
      githubFolders: true,
      hideDefaultEffort: true,
      defaultModel: true,
      hideUpdates: true,
      hideDeepseekDefaults: true,
      workspaceContext: true,
      workspaceAppearance: true,
      workspaceProjectPage: true,
    };

    const FEATURE_GROUPS = [
      { id: 'config', title: 'page.group.config', rows: ['reorderSections', 'githubFolders', 'hideDefaultEffort'] },
      { id: 'interface', title: 'page.group.interface', rows: ['defaultModel', 'hideUpdates', 'hideDeepseekDefaults'] },
      { id: 'workspace', title: 'page.group.workspace', rows: ['workspaceContext', 'workspaceProjectPage', 'workspaceAppearance'] },
    ];

    const FEATURE_META = {
      reorderSections: { id: 'reorder' },
      githubFolders: { id: 'github' },
      hideDefaultEffort: { id: 'effort' },
      defaultModel: { id: 'defaultModel' },
      hideUpdates: { id: 'updates' },
      hideDeepseekDefaults: { id: 'deepseek' },
      workspaceContext: { id: 'workspace' },
      workspaceProjectPage: { id: 'project', dependency: 'workspaceContext' },
      workspaceAppearance: { id: 'appearance', dependency: 'workspaceContext' },
    };

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

    /** Settings page, migration card and switch copy. */
    const PAGE_STRINGS = {
      en: {
        'nav': 'DHS Total Config',
        'page.title': 'DHS Total Config',
        'page.intro': 'Every behavior this plugin adds to the Harness in one place. Switch each one on or off; the choices are stored in the Host configuration.',
        'page.loading': 'Loading configuration…',
        'page.error': 'The plugin configuration could not be loaded.',
        'page.retry': 'Retry',
        'page.foot': 'Changes apply immediately and are stored in $DSH_HOME/dsh-total-config/settings.json.',
        'page.group.config': 'Settings and installation',
        'page.group.interface': 'Models and interface',
        'page.group.workspace': 'Workspaces',
        'page.depends': 'Needs “{name}”',
        'page.saveError': 'The configuration could not be saved.',
        'page.saved': 'Configuration saved.',
        'feature.reorder.title': 'Reorder Settings categories',
        'feature.reorder.desc': 'Drag the categories in the Settings rail to change their order. Alt+↑ and Alt+↓ move the focused category with the keyboard.',
        'feature.github.title': 'Install from GitHub folders',
        'feature.github.desc': 'Accept a URL that points to a folder in a public GitHub repository in Add plugin.',
        'feature.effort.title': 'Hide the default effort label',
        'feature.effort.desc': 'Do not show “Default” next to the model name in the composer. Other effort labels stay visible.',
        'feature.defaultModel.title': 'Default model for new chats',
        'feature.defaultModel.desc': 'Choose the model new chats start with in Settings → Models. Changing the model inside a chat does not change this default.',
        'feature.updates.title': 'Hide update prompts',
        'feature.updates.desc': 'Hide the update button beside Settings and the new-version dot on the collapsed sidebar. The native macOS menu and the mandatory update window live outside the page and stay as they are.',
        'feature.deepseek.title': 'Hide DeepSeek defaults',
        'feature.deepseek.desc': 'Hide the built-in DeepSeek account and API-key providers from the model picker and Models settings, and hide the Account page. Your own providers are untouched. Reload the page after changing this switch.',
        'feature.workspace.title': 'Workspace context',
        'feature.workspace.desc': 'Give each workspace a description, a system prompt, and files or folders that accompany all of its sessions. Also adds folders as session context from the composer + menu and a Context tab in the right sidebar.',
        'feature.appearance.title': 'Workspace icon and color',
        'feature.appearance.desc': 'Show a custom icon or color for each workspace in the sidebar.',
        'feature.project.title': 'Workspace project page',
        'feature.project.desc': 'Clicking a workspace opens its project page with its context, instructions, chats, and a composer.',
        'deepseek.title': 'DeepSeek providers',
        'deepseek.hidden': 'The built-in DeepSeek providers are hidden.',
        'deepseek.visible': 'The built-in DeepSeek providers are visible.',
        'deepseek.busy': 'Applying…',
        'deepseek.reload': 'Reload the page to finish changing the provider list and the Account page.',
        'deepseek.reloadAction': 'Reload',
        'deepseek.error': 'The provider rows could not be changed.',
        'deepseek.unavailable': 'The Plugin Manager is not available in this profile.',
        'deepseek.partial': 'Some provider rows could not be changed: {rows}',
        'legacy.title': 'Previous plugins',
        'legacy.desc': 'These bundles add the same capabilities as this plugin. Turn them off so nothing appears twice. They stay installed and can be restored from Settings → Plugins.',
        'legacy.disable': 'Turn them off',
        'legacy.disableOne': 'Turn off',
        'legacy.busy': 'Turning off…',
        'legacy.error': 'The previous plugins could not be turned off.',
        'legacy.done': 'Previous plugins turned off.',
        'legacy.reload': 'Reload the page to apply the change.',
        'legacy.on': 'on',
        'legacy.off': 'off',
      },
      es: {
        'nav': 'DHS Total Config',
        'page.title': 'DHS Total Config',
        'page.intro': 'Todos los comportamientos que este complemento añade al Harness en un solo sitio. Activa o desactiva cada uno; las decisiones se guardan en la configuración del Host.',
        'page.loading': 'Cargando configuración…',
        'page.error': 'No se pudo cargar la configuración del complemento.',
        'page.retry': 'Reintentar',
        'page.foot': 'Los cambios se aplican al momento y se guardan en $DSH_HOME/dsh-total-config/settings.json.',
        'page.group.config': 'Ajustes e instalación',
        'page.group.interface': 'Modelos e interfaz',
        'page.group.workspace': 'Espacios de trabajo',
        'page.depends': 'Necesita «{name}»',
        'page.saveError': 'No se pudo guardar la configuración.',
        'page.saved': 'Configuración guardada.',
        'feature.reorder.title': 'Reordenar categorías de Ajustes',
        'feature.reorder.desc': 'Arrastra las categorías de la barra de Ajustes para cambiar su orden. Alt+↑ y Alt+↓ mueven la categoría enfocada con el teclado.',
        'feature.github.title': 'Instalar desde carpetas de GitHub',
        'feature.github.desc': 'Acepta en Agregar complemento una URL que apunte a una carpeta de un repositorio público de GitHub.',
        'feature.effort.title': 'Ocultar la etiqueta de esfuerzo predeterminado',
        'feature.effort.desc': 'No muestra «Predeterminado» junto al nombre del modelo en el compositor. Los demás esfuerzos siguen visibles.',
        'feature.defaultModel.title': 'Modelo predeterminado para chats nuevos',
        'feature.defaultModel.desc': 'Elige en Ajustes → Modelos el modelo con el que empiezan los chats nuevos. Cambiar el modelo dentro de un chat no altera este valor.',
        'feature.updates.title': 'Ocultar avisos de actualización',
        'feature.updates.desc': 'Oculta el botón de actualizar que está junto a Configuración y el punto de nueva versión de la barra lateral plegada. El menú nativo de macOS y la ventana de actualización obligatoria viven fuera de la página y no cambian.',
        'feature.deepseek.title': 'Ocultar los modelos por defecto de DeepSeek',
        'feature.deepseek.desc': 'Oculta los proveedores integrados de DeepSeek (cuenta y clave API) del selector de modelos y de Ajustes → Modelos, y oculta la página Cuenta. Tus proveedores no se tocan. Recarga la página después de cambiar este interruptor.',
        'feature.workspace.title': 'Contexto de espacios',
        'feature.workspace.desc': 'Da a cada espacio una descripción, un prompt del sistema y archivos o carpetas que acompañan a todas sus sesiones. Añade también carpetas como contexto de sesión desde el menú + del compositor y una pestaña Contexto en la barra derecha.',
        'feature.appearance.title': 'Icono y color del espacio',
        'feature.appearance.desc': 'Muestra un icono o un color propio para cada espacio en la barra lateral.',
        'feature.project.title': 'Página de proyecto del espacio',
        'feature.project.desc': 'Al hacer clic en un espacio se abre su página de proyecto con su contexto, instrucciones, chats y un compositor.',
        'deepseek.title': 'Proveedores de DeepSeek',
        'deepseek.hidden': 'Los proveedores integrados de DeepSeek están ocultos.',
        'deepseek.visible': 'Los proveedores integrados de DeepSeek están visibles.',
        'deepseek.busy': 'Aplicando…',
        'deepseek.reload': 'Recarga la página para terminar de cambiar la lista de proveedores y la página Cuenta.',
        'deepseek.reloadAction': 'Recargar',
        'deepseek.error': 'No se pudieron cambiar las filas de proveedores.',
        'deepseek.unavailable': 'El gestor de complementos no está disponible en este perfil.',
        'deepseek.partial': 'Algunas filas de proveedores no se pudieron cambiar: {rows}',
        'legacy.title': 'Complementos anteriores',
        'legacy.desc': 'Estos bundles añaden las mismas capacidades que este complemento. Desactívalos para que nada aparezca dos veces. Siguen instalados y puedes recuperarlos desde Ajustes → Complementos.',
        'legacy.disable': 'Desactivarlos',
        'legacy.disableOne': 'Desactivar',
        'legacy.busy': 'Desactivando…',
        'legacy.error': 'No se pudieron desactivar los complementos anteriores.',
        'legacy.done': 'Complementos anteriores desactivados.',
        'legacy.reload': 'Recarga la página para aplicar el cambio.',
        'legacy.on': 'activo',
        'legacy.off': 'inactivo',
      },
    };

    /** Default-model control copy. */
    const MODEL_STRINGS = {
      en: {
        'model.label': 'Default',
        'model.aria': 'Default model for new chats',
        'model.hint': 'New chats start with this model. Changing the model inside a chat does not change this default.',
        'model.loading': 'Loading…',
        'model.loadError': 'The default model could not be loaded.',
        'model.saveError': 'The default model could not be saved.',
        'model.invalidModel': 'That model is no longer available. Pick another one.',
        'model.networkError': 'The local service could not be reached.',
        'model.retry': 'Retry',
        'model.saved': 'Default model updated.',
        'model.unavailable': 'unavailable',
        'model.noModels': 'No models are configured.',
      },
      es: {
        'model.label': 'Predeterminado',
        'model.aria': 'Modelo predeterminado para chats nuevos',
        'model.hint': 'Los chats nuevos empiezan con este modelo. Cambiar el modelo dentro de un chat no altera este valor.',
        'model.loading': 'Cargando…',
        'model.loadError': 'No se pudo cargar el modelo predeterminado.',
        'model.saveError': 'No se pudo guardar el modelo predeterminado.',
        'model.invalidModel': 'Ese modelo ya no está disponible. Elige otro.',
        'model.networkError': 'No se pudo conectar con el servicio local.',
        'model.retry': 'Reintentar',
        'model.saved': 'Modelo predeterminado actualizado.',
        'model.unavailable': 'no disponible',
        'model.noModels': 'No hay modelos configurados.',
      },
    };

    /** GitHub folder installs and the category-order messages. */
    const SHARED_STRINGS = {
      en: {
        'order.moved': 'Category moved to position {position} of {total}.',
        'order.saveError': 'The new category order could not be saved.',
        'order.loadError': 'The saved category order could not be loaded.',
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
        'order.moved': 'Categoría movida a la posición {position} de {total}.',
        'order.saveError': 'No se pudo guardar el nuevo orden de categorías.',
        'order.loadError': 'No se pudo cargar el orden de categorías guardado.',
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

    /** Workspace-context copy, flattened into dotted keys below. */
    const WS_STRINGS = {
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
          briefcase: 'Briefcase', code: 'Code', book: 'Book', rocket: 'Rocket', star: 'Star',
          heart: 'Heart', bolt: 'Bolt', globe: 'Globe', flask: 'Laboratory', terminal: 'Terminal',
          palette: 'Palette', chat: 'Chat', music: 'Music', camera: 'Camera', lightbulb: 'Idea', flag: 'Flag',
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
          'feature-disabled': 'That behavior is turned off in DHS Total Config.',
          'plugins-unavailable': 'The Plugin Manager is not available in this profile.',
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
          briefcase: 'Maletín', code: 'Código', book: 'Libro', rocket: 'Cohete', star: 'Estrella',
          heart: 'Corazón', bolt: 'Rayo', globe: 'Mundo', flask: 'Laboratorio', terminal: 'Terminal',
          palette: 'Paleta', chat: 'Chat', music: 'Música', camera: 'Cámara', lightbulb: 'Idea', flag: 'Bandera',
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
          'feature-disabled': 'Ese comportamiento está desactivado en DHS Total Config.',
          'plugins-unavailable': 'El gestor de complementos no está disponible en este perfil.',
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

    const DICTS = {
      en: {
        ...PAGE_STRINGS.en,
        ...MODEL_STRINGS.en,
        ...SHARED_STRINGS.en,
        ...flattenDict(WS_STRINGS.en),
      },
      es: {
        ...PAGE_STRINGS.es,
        ...MODEL_STRINGS.es,
        ...SHARED_STRINGS.es,
        ...flattenDict(WS_STRINGS.es),
      },
    };

    const PAGE_CSS = `
      ${DIALOG} > nav > div > button { cursor: default; }
      body.dstc-dragging, body.dstc-dragging * { cursor: default !important; user-select: none !important; }
      .dstc-ghost {
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
      .dstc-indicator {
        position: fixed;
        z-index: 2147483000;
        pointer-events: none;
        border-radius: 999px;
        background: var(--dsw-alias-brand-primary, #4d6bfe);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary, #4d6bfe) 24%, transparent);
      }
      .dstc-hide-caption { display: none !important; }
      .dstc-sr {
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
      .dstc-page { max-width: 720px; padding: 8px 0 24px; color: var(--dsw-alias-label-primary); }
      .dstc-page-title { margin: 0; font-size: 16px; font-weight: 600; line-height: 24px; }
      .dstc-page-intro { margin: 6px 0 0; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 20px; }
      .dstc-group { margin-top: 18px; }
      .dstc-group-title { margin: 0 0 7px 2px; font-size: 11px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--dsw-alias-label-secondary); }
      .dstc-list { border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); overflow: hidden; }
      .dstc-row { display: flex; gap: 20px; align-items: flex-start; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
      .dstc-row:last-child { border-bottom: 0; }
      .dstc-row-copy { min-width: 0; }
      .dstc-row-title { font-size: 13px; font-weight: 600; line-height: 20px; }
      .dstc-row-desc { margin: 2px 0 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
      .dstc-row-dep { margin: 4px 0 0; font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-tertiary); }
      .dstc-page-foot { margin: 12px 0 0; font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-tertiary); }
      .dstc-switch { position: relative; flex: none; width: 38px; height: 22px; margin-top: 1px; padding: 0; border: 1px solid var(--dsw-alias-border-l2); border-radius: 999px; background: var(--dsw-alias-bg-layer-2); cursor: pointer; transition: background .15s ease, border-color .15s ease; }
      .dstc-switch::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: var(--dsw-alias-bg-layer-1); box-shadow: 0 1px 2px rgba(0, 0, 0, .25); transition: transform .15s ease; }
      .dstc-switch[aria-checked="true"] { background: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); }
      .dstc-switch[aria-checked="true"]::after { transform: translateX(16px); }
      .dstc-switch:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
      .dstc-switch:disabled { opacity: .45; cursor: default; }
      .dstc-note { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 10px 0 0; padding: 9px 11px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 9px; background: var(--dsw-alias-bg-layer-1); font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
      .dstc-note[data-tone="error"] { border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 45%, var(--dsw-alias-border-l2)); color: var(--dsw-alias-state-error-primary); }
      .dstc-note[data-tone="success"] { color: var(--dsw-alias-label-primary); }
      .dstc-note-action { height: 26px; padding: 0 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 11.5px; cursor: pointer; }
      .dstc-note-action:hover { background: var(--dsw-alias-interactive-bg-hover); }
      .dstc-note-action:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
      .dstc-note-action:disabled { opacity: .5; cursor: default; }
      .dstc-state { font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-secondary); }
      .dstc-state[data-tone="ok"] { color: var(--dsw-alias-state-success-primary); }
      .dstc-state[data-tone="error"] { color: var(--dsw-alias-state-error-primary); }
      .dstc-busy { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
      .dstc-spin { display: block; width: 12px; height: 12px; border-radius: 50%; border: 2px solid currentColor; border-top-color: transparent; animation: dstc-spin .8s linear infinite; }
      @keyframes dstc-spin { to { transform: rotate(360deg); } }
      .dstc-legacy-row { display: flex; align-items: center; gap: 12px; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
      .dstc-legacy-row:last-child { border-bottom: 0; }
      .dstc-legacy-name { min-width: 0; font-size: 12.5px; line-height: 18px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dstc-legacy-state { flex: none; font-size: 11px; color: var(--dsw-alias-label-secondary); }
      @media (prefers-reduced-motion: reduce) {
        .dstc-ghost { transform: none; }
        .dstc-switch, .dstc-switch::after { transition: none; }
        .dstc-spin { animation: none; }
      }
    `;

    const MODEL_CSS = `
      .dstc-model-root{display:inline-flex;align-items:center;gap:8px;min-width:0;color:var(--dsw-alias-label-secondary);}
      .dstc-model-control{display:inline-flex;align-items:center;gap:6px;min-width:0;}
      .dstc-model-icon{display:inline-flex;flex:none;color:var(--dsw-alias-label-tertiary);}
      .dstc-model-label{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);white-space:nowrap;}
      .dstc-model-select{box-sizing:border-box;height:28px;max-width:200px;border:.5px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:18px;padding:0 6px;min-width:0;}
      .dstc-model-select:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);}
      .dstc-model-select:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
      .dstc-model-select:disabled{opacity:.6;cursor:default;}
      .dstc-model-status{display:inline-flex;align-items:center;flex:none;}
      .dstc-model-muted{color:var(--dsw-alias-label-tertiary);}
      .dstc-model-error{color:var(--dsw-alias-state-error-primary);}
      .dstc-model-ok{color:var(--dsw-alias-state-success-primary);}
      .dstc-model-retry{box-sizing:border-box;height:28px;padding:0 10px;border:.5px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap;}
      .dstc-model-retry:hover{background:var(--dsw-alias-interactive-bg-hover);}
      .dstc-model-retry:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
      .dstc-model-spin{display:block;width:12px;height:12px;border-radius:50%;border:2px solid currentColor;border-top-color:transparent;animation:dstc-model-spin .8s linear infinite;}
      @keyframes dstc-model-spin{to{transform:rotate(360deg);}}
      @media (prefers-reduced-motion:reduce){.dstc-model-spin{animation:none;}}
      @media (max-width:820px){.dstc-model-label{display:none;}}
      @media (max-width:620px){.dstc-model-select{max-width:150px;}}
    `;

    // The desktop shell publishes pending-update state to the Web page, and the
    // Settings root row renders it beside Settings and on the collapsed
    // sidebar. Neither is a replaceable slot, so this stylesheet removes both
    // while the switch is on.
    const HIDE_UPDATES_CSS = `
      [class*="_triggerRow"] button[class*="_indicator"][aria-disabled],
      [class*="_railRow"] button[class*="_indicator"][aria-disabled] {
        display: none !important;
      }
      [data-slot="sidebar.toggle.badge"] [role="img"] {
        display: none !important;
      }
    `;
    const WS_CSS = `
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
    const WS_SIDEBAR_CSS = `
[data-row-key^="workspace:"] [class*="_chevron"]{display:inline-flex !important;order:-1;align-items:center;justify-content:center;width:20px;height:28px;margin-inline-start:-2px;}
[data-row-key^="workspace:"]:hover [class*="_folder"]{display:inline-flex !important;}
`;
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

    /** Star glyph beside the default-model control. */
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

    /** Check glyph for the saved default model. */
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

    /** Error glyph for a failed default-model save. */
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

    /** Sliders glyph for the Settings rail. */
    function TotalConfigIcon({ size = 16 }) {
      return h('svg', {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        'aria-hidden': true,
      },
      h('path', { d: 'M4 7h9M17 7h3M4 12h4M12 12h8M4 17h11M19 17h1' }),
      h('circle', { cx: 15, cy: 7, r: 2 }),
      h('circle', { cx: 10, cy: 12, r: 2 }),
      h('circle', { cx: 17, cy: 17, r: 2 }));
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

    /** Combine disposers so one binding can release every resource it owns. */
    function combineDisposers(disposers) {
      return () => {
        for (const dispose of [...disposers].reverse()) {
          if (typeof dispose !== 'function') continue;
          try {
            dispose();
          } catch {
            // A teardown failure must not keep the others from running.
          }
        }
      };
    }
    /** Modal that edits one Workspace's context configuration. */
    function createWorkspaceDialog(options) {
      const { api, t, closeDialog, uiWorkspace, bump, featuresStore } = options;

      return function WorkspaceDialog({ request }) {
        const live = useStore(featuresStore);
        const appearanceEnabled = live.workspaceAppearance === true;
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
          if (!appearanceEnabled) setAppearanceOpen(false);
        }, [appearanceEnabled]);

        React.useEffect(() => {
          let cancelled = false;
          setPhase('loading');
          setError(null);
          api.get(`/workspace/state?workspaceId=${encodeURIComponent(request.workspaceId)}`)
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
            const data = await api.post('/workspace/save', {
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
              h('style', null, WS_CSS),
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
          h('style', null, WS_CSS),
          h('div', { className: 'wsc-head' },
            h('div', null,
              h('h2', { className: 'wsc-title' }, t('dialog.title')),
              h('p', { className: 'wsc-subtitle' }, t('dialog.subtitle'))),
            h('button', { type: 'button', className: 'wsc-close', 'aria-label': t('dialog.cancel'), onClick: closeDialog }, '×')),
          h('div', { className: 'wsc-body' },
            h('div', { className: 'wsc-field' },
              h('span', { className: 'wsc-label' }, t('dialog.name')),
              h('div', { className: 'wsc-workspace-row' },
                appearanceEnabled
                  ? h('button', {
                    type: 'button',
                    className: 'wsc-iconbutton',
                    title: t('dialog.editAppearance'),
                    'aria-label': t('dialog.editAppearance'),
                    'aria-expanded': appearanceOpen,
                    'aria-controls': 'wsc-appearance-panel',
                    onClick: () => setAppearanceOpen((open) => !open),
                  },
                    workspaceIconNode(draftIcon, draftColor, 18),
                    h('span', { className: 'wsc-iconpencil', 'aria-hidden': true }, h(PencilGlyph, { size: 9 })))
                  : h('span', { className: 'wsc-iconbutton', 'aria-hidden': true }, workspaceIconNode(draftIcon, draftColor, 18)),
                h('span', { className: 'wsc-workspacename', title: title || path || t('dialog.name') }, title || path || t('dialog.name')),
                appearanceEnabled
                  ? h('button', {
                    type: 'button',
                    className: 'wsc-editlink',
                    'aria-expanded': appearanceOpen,
                    'aria-controls': 'wsc-appearance-panel',
                    onClick: () => setAppearanceOpen((open) => !open),
                  }, t('dialog.appearance'))
                  : null),
              appearanceEnabled ? appearancePanel : null,
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
                  }, '×'))))),
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
          h('style', null, WS_CSS),
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
          h('style', null, WS_CSS),
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

    /** Main-panel project page opened by clicking a workspace row. */
    function createWorkspaceOverview(options) {
      const { api, overviewStore, contextBumps, openDialog, uiWorkspace, sendPrompt, composer, featuresStore } = options;
      return function WorkspaceOverview({ useWorkspaces, useSessions, t }) {
        const live = useStore(featuresStore);
        const appearanceEnabled = live.workspaceAppearance === true;
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
          api.get(`/workspace/state?workspaceId=${encodeURIComponent(workspaceId)}`).then((data) => {
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
          return h('div', { className: 'wsc-project' }, h('style', null, WS_CSS), h('div', { className: 'wsc-project-empty' }, t('overview.selectWorkspace')));
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
          return h('div', { className: 'wsc-project' }, h('style', null, WS_CSS), h('div', { className: 'wsc-project-empty' },
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
          h('style', null, WS_CSS),
          h('div', { className: 'wsc-project-inner' },
            h('div', { className: 'wsc-project-main' },
              h('header', { className: 'wsc-project-head' },
                h('div', { className: 'wsc-project-titlewrap' },
                  h('span', { className: 'wsc-project-icon' }, workspaceIconNode(appearanceEnabled ? config.icon : '', appearanceEnabled ? config.color : '', 26)),
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
        let t = (key) => key;
        ctx.effect(() => {
          const disposers = Object.entries(DICTS).map(([locale, dict]) => ctx.locale.register(NS, locale, dict));
          t = ctx.locale.bind(NS);
          return () => {
            for (const dispose of disposers) dispose();
          };
        }, 'dsh-total-config locale');

        // ------------------------------------------------------------------
        // Feature state: one switch per behavior, persisted by the Host.
        // ------------------------------------------------------------------
        const featuresStore = createStore({ ...FEATURE_DEFAULTS });
        const pageStore = createStore({ ready: false, error: null, busy: null, notice: null });
        const deepseekStore = createStore({ status: 'idle', data: null, error: null });
        const legacyStore = createStore({ status: 'idle', data: null, error: null, busy: false });
        const reloadStore = createStore(null);

        let features = { ...FEATURE_DEFAULTS };
        let settingsOrder = [];
        let settingsReady = false;
        const originalOrders = new Map();
        const featureListeners = new Set();
        let refreshAppearance = () => {};
        let saveChain = Promise.resolve();

        const isOn = (key) => features[key] === true;
        const isEffective = (key) => {
          if (key === 'workspaceAppearance' || key === 'workspaceProjectPage') {
            return features.workspaceContext === true && features[key] === true;
          }
          return features[key] === true;
        };
        const notifyFeatures = () => {
          featuresStore.set({ ...features });
          for (const listener of [...featureListeners]) listener();
        };

        const publishPage = (patch) => {
          pageStore.set({ ...pageStore.get(), ...patch });
        };

        /** Same-origin JSON transport for the Host half. */
        const api = {
          async call(path, options) {
            let response;
            try {
              response = await fetch(ROUTE + path, {
                method: options?.method ?? 'GET',
                cache: 'no-store',
                headers: {
                  [HEADER]: '1',
                  ...(options?.body === undefined ? {} : { 'content-type': 'application/json' }),
                },
                body: options?.body === undefined ? undefined : JSON.stringify(options.body),
                ...(options?.signal === undefined ? {} : { signal: options.signal }),
              });
            } catch {
              const error = new Error('network');
              error.code = 'network';
              throw error;
            }
            const payload = await response.json().catch(() => null);
            if (!response.ok || payload?.ok !== true) {
              const error = new Error(typeof payload?.error === 'string' ? payload.error : `HTTP ${response.status}`);
              error.code = typeof payload?.error === 'string' ? payload.error : 'request-failed';
              error.detail = typeof payload?.detail === 'string' ? payload.detail : undefined;
              error.status = response.status;
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

        /** Serialize settings writes so a fast sequence of switches keeps its last value. */
        function persistSettings(patch) {
          saveChain = saveChain.catch(() => {}).then(async () => {
            try {
              await api.post('/settings', patch);
            } catch (error) {
              console.warn(`[dsh-total-config] ${t('page.saveError')}`, error);
              throw error;
            }
          });
          return saveChain;
        }

        /**
         * Apply every switch to the live page. A binding is a setup function
         * that installs one capability and returns its teardown, so switching a
         * behavior off removes exactly what switching it on installed.
         */
        const bindings = new Map();
        const bind = (key, setup) => bindings.set(key, { setup, dispose: null });

        function applyBindings() {
          for (const [key, binding] of bindings) {
            const want = isEffective(key);
            try {
              if (want && binding.dispose === null) {
                binding.dispose = binding.setup() ?? (() => {});
              } else if (!want && binding.dispose !== null) {
                const dispose = binding.dispose;
                binding.dispose = null;
                dispose();
              }
            } catch (error) {
              console.warn(`[dsh-total-config] ${key}`, error);
              binding.dispose = null;
            }
          }
          void refreshAppearance();
        }

        /** @param {string} key @param {boolean} enabled */
        async function setFeature(key, enabled) {
          if (!(key in FEATURE_DEFAULTS) || features[key] === enabled) return true;
          const previous = { ...features };
          features = { ...features, [key]: enabled };
          notifyFeatures();
          applyBindings();

          if (key === 'hideDeepseekDefaults') {
            try {
              const data = await api.post('/deepseek', { enabled });
              deepseekStore.set({ status: 'ready', data, error: null });
              if (typeof data.hidden === 'boolean' && features.hideDeepseekDefaults !== data.hidden) {
                features = { ...features, hideDeepseekDefaults: data.hidden };
                notifyFeatures();
                applyBindings();
              }
              if (data.reload === true) reloadStore.set('deepseek');
            } catch (error) {
              features = previous;
              notifyFeatures();
              applyBindings();
              deepseekStore.set({ status: 'error', data: null, error: describeError(error, t) });
              return false;
            }
          }

          try {
            await persistSettings({ features });
          } catch {
            // The switch stays applied for this session; the page reports the write.
          }
          return true;
        }

        /** Load the durable order and switches once; failures keep the shipped defaults. */
        async function loadSettings() {
          publishPage({ error: null });
          let data = null;
          try {
            data = await api.get('/settings');
          } catch (error) {
            settingsReady = true;
            publishPage({ ready: true, error: describeError(error, t) });
            applyBindings();
            return;
          }
          if (data !== null && typeof data === 'object') {
            if (Array.isArray(data.settingsOrder)) {
              settingsOrder = data.settingsOrder.filter((id) => typeof id === 'string' && id.length > 0);
            }
            if (data.features !== null && typeof data.features === 'object' && !Array.isArray(data.features)) {
              const next = { ...FEATURE_DEFAULTS };
              for (const key of Object.keys(FEATURE_DEFAULTS)) {
                if (typeof data.features[key] === 'boolean') next[key] = data.features[key];
              }
              features = next;
            }
          }
          settingsReady = true;
          publishPage({ ready: true });
          notifyFeatures();
          applyBindings();
          void loadDeepseekState();
        }

        /** Read the real provider-row state; it wins over the stored switch. */
        async function loadDeepseekState() {
          try {
            const data = await api.get('/deepseek');
            deepseekStore.set({ status: 'ready', data, error: null });
            if (data.available === true && typeof data.hidden === 'boolean' && features.hideDeepseekDefaults !== data.hidden) {
              features = { ...features, hideDeepseekDefaults: data.hidden };
              notifyFeatures();
              applyBindings();
              void persistSettings({ features }).catch(() => {});
            }
          } catch (error) {
            deepseekStore.set({ status: 'error', data: null, error: describeError(error, t) });
          }
        }

        /** Read which bundles this plugin replaces, for the migration card. */
        async function loadLegacyState() {
          try {
            const data = await api.get('/legacy');
            legacyStore.set({ ...legacyStore.get(), status: 'ready', data, error: null });
          } catch (error) {
            legacyStore.set({ ...legacyStore.get(), status: 'error', error: describeError(error, t) });
          }
        }

        /** Turn the selected previous bundles off without uninstalling them. */
        async function turnOffLegacy(names) {
          const previous = legacyStore.get();
          legacyStore.set({ ...previous, busy: true, error: null });
          try {
            const result = await api.post('/legacy', { names });
            const bundles = (previous.data?.bundles ?? []).map((bundle) => (
              names.includes(bundle.name) ? { ...bundle, enabled: false } : bundle
            ));
            legacyStore.set({
              ...previous,
              busy: false,
              data: { ...(previous.data ?? {}), bundles },
              error: null,
            });
            if (result.reload === true) reloadStore.set('legacy');
            return true;
          } catch (error) {
            legacyStore.set({ ...previous, busy: false, error: describeError(error, t) });
            return false;
          }
        }

        // ------------------------------------------------------------------
        // Workspace context: shared stores, transport and composer helpers.
        // ------------------------------------------------------------------
        const dialogStore = createStore(null);
        const overviewStore = createStore(null);
        const contextBumps = createStore(0);
        const openDialog = (request) => dialogStore.set(request);
        const closeDialog = () => dialogStore.set(null);

        let appearanceStyle = null;
        let appearanceRequest = 0;
        refreshAppearance = async () => {
          if (appearanceStyle === null) return;
          if (!isEffective('workspaceAppearance')) {
            appearanceStyle.textContent = '';
            return;
          }
          const request = ++appearanceRequest;
          try {
            const data = await api.get('/workspaces/presentation');
            if (request !== appearanceRequest || appearanceStyle === null) return;
            appearanceStyle.textContent = buildAppearanceCss(data?.workspaces);
          } catch {
            // Keep the previous appearance if the Host is unavailable.
          }
        };

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
          retain: (sessionId) => ctx.get('sessions')?.retain?.(sessionId, { source: 'totalConfigDraft' }),
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

        // ------------------------------------------------------------------
        // Default model: the control in Settings → Models.
        // ------------------------------------------------------------------
        const modelsActive = createStore(false);
        const modelView = createStore({ status: 'idle', data: null, error: null, saving: false, saveError: null });
        let modelLoading = null;

        function describeModelError(error, translate, fallbackKey) {
          const code = error && typeof error.code === 'string' ? error.code : '';
          if (code === 'network' || code === 'network-error') return translate('model.networkError');
          if (code === 'invalid-model') return translate('model.invalidModel');
          return translate(fallbackKey);
        }

        /** Flatten the provider groups into select rows, keeping their order. */
        function flattenModels(groups) {
          const rows = [];
          for (const group of Array.isArray(groups) ? groups : []) {
            for (const model of Array.isArray(group.models) ? group.models : []) {
              rows.push({ group, model, provider: group.id, modelId: model.id });
            }
          }
          return rows;
        }

        function loadModel() {
          if (modelLoading !== null) return modelLoading;
          const previous = modelView.get();
          if (previous.status !== 'loading') modelView.set({ ...previous, status: 'loading', error: null });
          modelLoading = api.get('/model/state').then((data) => {
            modelView.set({ ...modelView.get(), status: 'ready', data, error: null });
            return data;
          }, (error) => {
            modelView.set({ ...modelView.get(), status: 'error', error: describeModelError(error, t, 'model.loadError') });
            throw error;
          }).finally(() => {
            modelLoading = null;
          });
          return modelLoading;
        }

        function loadModelIfNeeded() {
          const status = modelView.get().status;
          if (status === 'ready' || status === 'loading') return modelLoading ?? Promise.resolve(modelView.get().data);
          return loadModel();
        }

        async function saveModel(selection) {
          modelView.set({ ...modelView.get(), saving: true, saveError: null });
          try {
            const data = await api.post('/model/selection', selection);
            modelView.set({ ...modelView.get(), status: 'ready', data, saving: false, saveError: null });
            return true;
          } catch (error) {
            modelView.set({ ...modelView.get(), saving: false, saveError: describeModelError(error, t, 'model.saveError') });
            return false;
          }
        }

        function DefaultModelControl(props) {
          const translate = props.t || t;
          const active = useStore(modelsActive);
          const snapshot = useStore(modelView);
          const [flash, setFlash] = React.useState(false);

          React.useEffect(() => {
            if (active) loadModelIfNeeded().catch(() => {});
          }, [active]);

          React.useEffect(() => {
            if (!flash) return undefined;
            const timer = setTimeout(() => setFlash(false), 2200);
            return () => clearTimeout(timer);
          }, [flash]);

          if (!active) return null;

          const data = snapshot.data;
          const rows = flattenModels(data && data.groups);
          const selection = data && data.selection ? data.selection : null;
          const currentIndex = selection === null
            ? -1
            : rows.findIndex((row) => row.provider === selection.provider && row.modelId === selection.model);
          const missing = selection !== null && currentIndex === -1;
          const ready = snapshot.status === 'ready' && data !== null;
          const busy = snapshot.saving;
          const value = missing ? '__missing__' : currentIndex >= 0 ? String(currentIndex) : '';

          const statusIcon = snapshot.saveError !== null
            ? h('span', { className: 'dstc-model-status dstc-model-error', title: snapshot.saveError, role: 'img', 'aria-label': snapshot.saveError }, h(ErrorIcon))
            : flash
              ? h('span', { className: 'dstc-model-status dstc-model-ok', title: translate('model.saved'), role: 'img', 'aria-label': translate('model.saved') }, h(CheckIcon))
              : busy
                ? h('span', { className: 'dstc-model-status dstc-model-muted', title: translate('model.loading'), role: 'status' }, h('span', { className: 'dstc-model-spin' }))
                : null;

          let control;
          if (snapshot.status === 'error') {
            control = h('button', {
              type: 'button',
              className: 'dstc-model-retry',
              title: snapshot.error || translate('model.loadError'),
              onClick: () => {
                loadModel().catch(() => {});
              },
            }, translate('model.retry'));
          } else if (!ready) {
            control = h('select', {
              className: 'dstc-model-select',
              'aria-label': translate('model.aria'),
              disabled: true,
              value: '',
              children: h('option', { value: '' }, translate('model.loading')),
            });
          } else if (rows.length === 0 && !missing) {
            control = h('select', {
              className: 'dstc-model-select',
              'aria-label': translate('model.aria'),
              disabled: true,
              value: '',
              children: h('option', { value: '' }, translate('model.noModels')),
            });
          } else {
            const children = [];
            if (missing) {
              children.push(h('option', { key: '__missing__', value: '__missing__', disabled: true },
                selection.provider + ' · ' + selection.model + ' (' + translate('model.unavailable') + ')'));
            } else if (selection === null) {
              children.push(h('option', { key: '__none__', value: '', disabled: true }, translate('model.aria')));
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
              className: 'dstc-model-select',
              'aria-label': translate('model.aria'),
              title: selection === null ? translate('model.aria') : selection.provider + ' · ' + selection.model,
              disabled: busy,
              value,
              onChange: (event) => {
                const next = event.target.value;
                if (next === '__missing__' || next === '') return;
                const row = rows[Number(next)];
                if (row === undefined) return;
                saveModel({ provider: row.group.id, model: row.model.id }).then((ok) => {
                  if (ok) setFlash(true);
                });
              },
              children,
            });
          }

          const announcement = snapshot.saveError !== null
            ? snapshot.saveError
            : flash
              ? translate('model.saved')
              : '';

          return h('div', { className: 'dstc-model-root' },
            h('style', null, MODEL_CSS),
            h('div', { className: 'dstc-model-control', title: translate('model.hint') },
              h('span', { className: 'dstc-model-icon' }, h(StarIcon)),
              h('span', { className: 'dstc-model-label' }, translate('model.label')),
              control),
            statusIcon,
            h('span', { className: 'dstc-sr', role: 'status', 'aria-live': 'polite' }, announcement));
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

        // ------------------------------------------------------------------
        // GitHub folder installs: the shipped Add plugin dialog only accepts a
        // repository or a tarball. A tree URL naming a folder is resolved by the
        // Host into a local package directory, then handed to the same install
        // pipeline, so the dialog keeps its progress and error screens.
        // ------------------------------------------------------------------
        class GithubSpecError extends Error {
          constructor(code) {
            super(code);
            this.code = code;
          }
        }

        /** Resolved folder paths by URL, shared by the inspect and install calls. */
        const githubPaths = new Map();

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

        async function downloadGithubFolder(url, signal) {
          let response;
          try {
            response = await fetch(`${ROUTE}/github`, {
              method: 'POST',
              headers: { 'content-type': 'application/json', [HEADER]: '1' },
              body: JSON.stringify({ url }),
              signal,
            });
          } catch (error) {
            if (error?.name === 'AbortError') throw error;
            throw new GithubSpecError('network');
          }
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

        async function resolveGithubSpec(spec, signal) {
          if (typeof spec !== 'string' || !GITHUB_SPEC.test(spec.trim())) return { installSpec: spec };
          if (!isOn('githubFolders')) return { installSpec: spec };
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
            }, 'dsh-total-config GitHub folder installs');
          });
        }

        // ------------------------------------------------------------------
        // Composer model caption: next to the model name the composer repeats
        // the reasoning effort, which reads "Predeterminado" for the provider
        // default. That adds nothing to the box where we write, so it is hidden
        // while the choice stays available in the model menu.
        // ------------------------------------------------------------------
        function setupCaption() {
          const HIDE = 'dstc-hide-caption';
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
            if (!settingsReady || !isOn('hideDefaultEffort')) {
              restore();
              return;
            }
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
        }

        /** @param {HTMLElement} dialog @returns {HTMLElement | null} the rail list that holds the category buttons. */
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
            }, () => null);
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

        /** Restore the orders the categories were registered with. */
        function restoreOriginalOrders() {
          const rows = readEntries();
          let restored = false;
          for (const row of rows) {
            const original = originalOrders.get(row.id);
            if (original !== undefined && row.entry.options.order !== original) {
              row.entry.options.order = original;
              restored = true;
            }
          }
          if (restored) nudgeVersion();
        }

        /** Apply the saved order, or restore the registered one when reordering is off. */
        function syncOrder() {
          if (!settingsReady) return;
          const rows = readEntries();
          if (rows.length === 0) return;
          if (!isOn('reorderSections')) {
            restoreOriginalOrders();
            return;
          }
          if (settingsOrder.length === 0) return;
          for (const row of rows) {
            if (!originalOrders.has(row.id)) originalOrders.set(row.id, row.entry.options.order ?? 0);
          }
          const target = mergeOrder(settingsOrder, rows.map((row) => row.id));
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

        /** Drag and keyboard reordering of the Settings rail. */
        function setupReorder() {
          const indicator = document.createElement('div');
          indicator.className = 'dstc-indicator';
          indicator.hidden = true;
          const live = document.createElement('div');
          live.className = 'dstc-sr';
          live.setAttribute('role', 'status');
          live.setAttribute('aria-live', 'polite');
          document.body.append(live, indicator);

          let drag = null;
          let suppressClick = false;
          let suppressTimer = 0;
          let announceTimer = 0;

          /** @param {string} text */
          function announce(text) {
            window.clearTimeout(announceTimer);
            live.textContent = '';
            announceTimer = window.setTimeout(() => {
              live.textContent = text;
            }, 30);
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
            if (!isOn('reorderSections')) return;

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
            ghost.classList.add('dstc-ghost');
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
            document.body.classList.add('dstc-dragging');
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
            settingsOrder = rest;
            syncOrder();
            void persistSettings({ settingsOrder: rest }).catch(() => {});
            announce(
              t('order.moved')
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

          /** Remove every drag artifact and the temporary window listeners. */
          function cancelDrag() {
            window.removeEventListener('pointermove', onPointerMove, true);
            window.removeEventListener('pointerup', onPointerUp, true);
            window.removeEventListener('pointercancel', onPointerCancel, true);
            window.removeEventListener('keydown', onDragKeyDown, true);
            window.removeEventListener('blur', cancelDrag, true);
            if (drag === null) return;
            if (drag.ghost !== null) drag.ghost.remove();
            drag.cell.style.opacity = '';
            document.body.classList.remove('dstc-dragging');
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
            if (!isOn('reorderSections')) return;
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
            settingsOrder = ids;
            syncOrder();
            void persistSettings({ settingsOrder: ids }).catch(() => {});
            announce(
              t('order.moved')
                .replace('{position}', String(next + 1))
                .replace('{total}', String(ids.length)),
            );
          }

          document.addEventListener('pointerdown', onPointerDown, true);
          document.addEventListener('click', onDocumentClick, true);
          document.addEventListener('keydown', onKeyDown, true);
          const offSlots = typeof ctx.slots.subscribe === 'function'
            ? ctx.slots.subscribe('settings.section', () => {
              syncOrder();
            })
            : () => {};
          syncOrder();

          return () => {
            document.removeEventListener('pointerdown', onPointerDown, true);
            document.removeEventListener('click', onDocumentClick, true);
            document.removeEventListener('keydown', onKeyDown, true);
            offSlots();
            window.clearTimeout(announceTimer);
            window.clearTimeout(suppressTimer);
            cancelDrag();
            indicator.remove();
            live.remove();
            restoreOriginalOrders();
          };
        }

        /** Hide every in-page desktop update affordance while the switch is on. */
        function setupUpdates() {
          const style = document.createElement('style');
          style.id = 'dsh-total-config-hide-updates';
          style.textContent = HIDE_UPDATES_CSS;
          document.head.append(style);
          return () => {
            style.remove();
          };
        }

        /** The default-model control lives in the Models section header. */
        function setupDefaultModel() {
          const disposers = [];
          disposers.push(ctx.slots.inject('settings.action', () => ctx.slots.register({
            name: 'settings.action',
            id: 'dsh-total-model',
            order: -1,
            locale: NS,
          }, DefaultModelControl)));
          disposers.push(ctx.slots.inject('settings.models.footer', () => ctx.slots.register({
            name: 'settings.models.footer',
            id: 'dsh-total-model-probe',
          }, ModelsActiveProbe)));
          return combineDisposers(disposers);
        }

        /** Workspace context: dialog, session folders, right-sidebar tab. */
        function setupWorkspaceContext() {
          const disposers = [];

          const sidebarStyle = document.createElement('style');
          sidebarStyle.dataset.plugin = NS;
          sidebarStyle.dataset.workspaceContext = 'sidebar-chevron';
          sidebarStyle.textContent = WS_SIDEBAR_CSS;
          document.head.appendChild(sidebarStyle);
          disposers.push(() => sidebarStyle.remove());

          appearanceStyle = document.createElement('style');
          appearanceStyle.dataset.plugin = NS;
          appearanceStyle.dataset.workspaceContext = 'workspace-appearance';
          document.head.appendChild(appearanceStyle);
          disposers.push(() => {
            appearanceStyle?.remove();
            appearanceStyle = null;
          });
          void refreshAppearance();

          const onFocus = () => {
            void refreshAppearance();
          };
          window.addEventListener('focus', onFocus);
          disposers.push(() => window.removeEventListener('focus', onFocus));
          try {
            const workspaces = ctx.get('workspaces');
            const unsubscribe = workspaces?.list?.subscribe?.(() => {
              void refreshAppearance();
            });
            if (typeof unsubscribe === 'function') disposers.push(unsubscribe);
          } catch {
            // The Workspace list may not expose a snapshot in every client build.
          }

          disposers.push(ctx.effect(() => ctx.contextMenus.register({
            id: 'dsh-total-config.configure',
            target: 'workspace',
            order: 150,
            resolve: ({ workspaceId, path, displayTitle }) => [{
              id: 'configure',
              label: t('menu.configure'),
              icon: { key: 'dsh-total-config.settings' },
              run: () => openDialog({
                workspaceId,
                path,
                title: displayTitle,
              }),
            }],
          }), 'dsh-total-config: workspace menu'));

          disposers.push(ctx.slots.inject('contextMenu.icon', function* () {
            yield ctx.slots.register({ name: 'contextMenu.icon', key: 'dsh-total-config.open' }, FolderGlyph);
            yield ctx.slots.register({ name: 'contextMenu.icon', key: 'dsh-total-config.settings' }, SettingsGlyph);
          }));

          disposers.push(ctx.slots.inject('shell.overlay', () => ctx.slots.register({
            name: 'shell.overlay',
            id: 'dsh-total-config-dialog',
            order: 100,
          }, createWorkspaceOverlay({
            api,
            t,
            closeDialog,
            uiWorkspace: ctx.uiWorkspace,
            dialogStore,
            bump: bumpContext,
            featuresStore,
          }))));

          disposers.push(ctx.effect(() => ctx.commandUi.register({
            name: 'dsh-total-folder',
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
          }), 'dsh-total-config: session folder command'));

          disposers.push(ctx.effect(() => ctx.sidebarRightTabs.register({
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
          }), 'dsh-total-config: tab type'));

          disposers.push(ctx.slots.inject('sidebar.right.tab.guide.entry', () => ctx.slots.register({
            name: 'sidebar.right.tab.guide.entry',
            key: TAB_ID,
            locale: NS,
          }, createContextGuideCard({ api, contextBumps }))));

          disposers.push(ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
            name: 'sidebar.right.pane.tab',
            key: TAB_ID,
            locale: NS,
          }, createContextTab({
            api,
            t,
            contextBumps,
            openDialog,
            addFolder: addFolderToSession,
          }))));

          return combineDisposers(disposers);
        }

        /** Workspace project page: the main panel opened from a workspace row. */
        function setupWorkspaceProjectPage() {
          const disposers = [];

          disposers.push(ctx.effect(() => ctx.contextMenus.register({
            id: 'dsh-total-config.open',
            target: 'workspace',
            order: 50,
            resolve: ({ workspaceId }) => [{
              id: 'open',
              label: t('menu.openWorkspace'),
              icon: { key: 'dsh-total-config.open' },
              run: () => {
                overviewStore.set({ workspaceId });
                ctx.layout.selectPanel(OVERVIEW_PANEL_ID);
              },
            }],
          }), 'dsh-total-config: open workspace menu'));

          disposers.push(ctx.slots.inject('main', () => ctx.slots.register({
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
            featuresStore,
          }))));

          disposers.push(ctx.effect(() => {
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
          }, 'dsh-total-config: workspace row click'));

          return combineDisposers(disposers);
        }

        bind('reorderSections', setupReorder);
        bind('hideDefaultEffort', setupCaption);
        bind('hideUpdates', setupUpdates);
        bind('defaultModel', setupDefaultModel);
        bind('workspaceContext', setupWorkspaceContext);
        bind('workspaceProjectPage', setupWorkspaceProjectPage);

        // ------------------------------------------------------------------
        // Settings → DHS Total Config: one switch per behavior.
        // ------------------------------------------------------------------
        ctx.effect(() => {
          const style = document.createElement('style');
          style.id = 'dsh-total-config-page-style';
          style.textContent = PAGE_CSS;
          document.head.append(style);
          return () => {
            style.remove();
          };
        }, 'dsh-total-config page styles');

        function SettingsPage() {
          const current = useStore(featuresStore);
          const page = useStore(pageStore);
          const deepseek = useStore(deepseekStore);
          const legacy = useStore(legacyStore);
          const reloadNeeded = useStore(reloadStore);
          const [announcement, setAnnouncement] = React.useState('');

          React.useEffect(() => {
            void loadLegacyState();
          }, []);

          const toggle = async (key) => {
            if (page.busy !== null) return;
            publishPage({ busy: key, error: null, notice: null });
            let ok = false;
            try {
              ok = await setFeature(key, current[key] !== true);
            } catch (error) {
              console.warn('[dsh-total-config] switch failed', error);
              ok = false;
            }
            publishPage({
              busy: null,
              ...(ok
                ? { notice: t('page.saved') }
                : { error: key === 'hideDeepseekDefaults' ? t('deepseek.error') : t('page.saveError') }),
            });
            if (ok) setAnnouncement(t('page.saved'));
          };

          const turnOff = async (names) => {
            const ok = await turnOffLegacy(names);
            if (ok) setAnnouncement(t('legacy.done'));
          };

          if (!page.ready) {
            return h('section', { className: 'dstc-page', 'aria-labelledby': 'dstc-page-title' },
              h('header', { className: 'dstc-page-head' },
                h('h2', { className: 'dstc-page-title', id: 'dstc-page-title' }, t('page.title'))),
              h('p', { className: 'dstc-note' },
                page.error === null ? t('page.loading') : page.error,
                page.error === null ? null : h('button', {
                  type: 'button',
                  className: 'dstc-note-action',
                  onClick: () => {
                    publishPage({ error: null });
                    void loadSettings();
                  },
                }, t('page.retry'))));
          }

          const legacyBundles = Array.isArray(legacy.data?.bundles) ? legacy.data.bundles : [];
          const groups = FEATURE_GROUPS.map((group) => h('div', { className: 'dstc-group', key: group.id },
            h('h3', { className: 'dstc-group-title' }, t(group.title)),
            h('div', { className: 'dstc-list', role: 'group', 'aria-label': t(group.title) },
              group.rows.map((key) => {
                const meta = FEATURE_META[key];
                const dependencyBlocked = meta.dependency !== undefined && current[meta.dependency] !== true;
                const enabled = current[key] === true;
                const busy = page.busy === key;
                const dependencyName = meta.dependency === undefined
                  ? ''
                  : t(`feature.${FEATURE_META[meta.dependency].id}.title`);
                return h('div', { className: 'dstc-row', key },
                  h('div', { className: 'dstc-row-copy' },
                    h('div', { className: 'dstc-row-title', id: `dstc-title-${key}` }, t(`feature.${meta.id}.title`)),
                    h('p', { className: 'dstc-row-desc', id: `dstc-desc-${key}` }, t(`feature.${meta.id}.desc`)),
                    dependencyBlocked
                      ? h('p', { className: 'dstc-row-dep' }, t('page.depends', { name: dependencyName }))
                      : null,
                    key === 'hideDeepseekDefaults'
                      ? h('p', {
                        className: 'dstc-state',
                        'data-tone': deepseek.status === 'error'
                          ? 'error'
                          : deepseek.status === 'ready' && deepseek.data?.available === true
                            ? 'ok'
                            : undefined,
                      }, deepseek.status === 'error'
                        ? deepseek.error
                        : deepseek.status !== 'ready'
                          ? t('page.loading')
                          : deepseek.data?.available === false
                            ? t('deepseek.unavailable')
                            : enabled ? t('deepseek.hidden') : t('deepseek.visible'))
                      : null),
                  busy
                    ? h('span', { className: 'dstc-busy' },
                      h('span', { className: 'dstc-spin', 'aria-hidden': true }),
                      t(key === 'hideDeepseekDefaults' ? 'deepseek.busy' : 'page.loading'))
                    : h('button', {
                      type: 'button',
                      role: 'switch',
                      className: 'dstc-switch',
                      'aria-checked': enabled,
                      'aria-labelledby': `dstc-title-${key}`,
                      'aria-describedby': `dstc-desc-${key}`,
                      disabled: dependencyBlocked,
                      onClick: () => {
                        void toggle(key);
                      },
                    }));
              }))
          ));

          const notices = [];
          if (reloadNeeded !== null) {
            notices.push(h('div', { className: 'dstc-note', key: 'reload' },
              h('span', null, t(reloadNeeded === 'legacy' ? 'legacy.reload' : 'deepseek.reload')),
              h('button', {
                type: 'button',
                className: 'dstc-note-action',
                onClick: () => window.location.reload(),
              }, t('deepseek.reloadAction'))));
          }
          if (page.error !== null) {
            notices.push(h('div', { className: 'dstc-note', 'data-tone': 'error', key: 'error' }, page.error));
          }
          if (page.notice !== null) {
            notices.push(h('div', { className: 'dstc-note', 'data-tone': 'success', key: 'notice' }, page.notice));
          }
          if (legacy.error !== null) {
            notices.push(h('div', { className: 'dstc-note', 'data-tone': 'error', key: 'legacy-error' }, legacy.error));
          }

          const legacyCard = legacyBundles.length === 0
            ? null
            : h('div', { className: 'dstc-group' },
              h('h3', { className: 'dstc-group-title' }, t('legacy.title')),
              h('p', { className: 'dstc-row-desc', style: { margin: '0 0 8px 2px' } }, t('legacy.desc')),
              h('div', { className: 'dstc-list' },
                legacyBundles.map((bundle) => h('div', { className: 'dstc-legacy-row', key: bundle.name },
                  h('span', { className: 'dstc-legacy-name', title: bundle.name }, bundle.name),
                  h('span', { className: 'dstc-legacy-state' }, bundle.enabled ? t('legacy.on') : t('legacy.off')),
                  bundle.enabled
                    ? h('button', {
                      type: 'button',
                      className: 'dstc-note-action',
                      disabled: legacy.busy,
                      onClick: () => {
                        void turnOff([bundle.name]);
                      },
                    }, legacy.busy ? t('legacy.busy') : t('legacy.disableOne'))
                    : null))));

          return h('section', { className: 'dstc-page', 'aria-labelledby': 'dstc-page-title' },
            h('header', { className: 'dstc-page-head' },
              h('h2', { className: 'dstc-page-title', id: 'dstc-page-title' }, t('page.title')),
              h('p', { className: 'dstc-page-intro' }, t('page.intro'))),
            groups,
            notices,
            legacyCard,
            h('p', { className: 'dstc-page-foot' }, t('page.foot')),
            h('span', { className: 'dstc-sr', role: 'status', 'aria-live': 'polite' }, announcement));
        }

        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'dsh-total-config',
          order: 90,
          label: () => t('nav'),
          locale: NS,
        }, SettingsPage));

        ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
          name: 'settings.section.icon',
          id: 'dsh-total-config',
          locale: NS,
        }, TotalConfigIcon));

        void loadSettings();
      },
    };
  },
});
