window.__ModuleLoader__.load({
  id: '@local/retro-ai-os',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const ID = 'retro-ai-os';
    const NS = 'retro-ai-os';
    const ENDPOINT = '/dsh-retro-ai-os';
    const HEADER = 'x-dsh-retro-ai-os';
    const SOURCE = '@local/retro-ai-os';

    const TOKEN_NAMES = [
      '--dsw-alias-bg-base',
      '--dsw-alias-bg-layer-1',
      '--dsw-alias-bg-layer-2',
      '--dsw-alias-bg-overlay',
      '--dsw-alias-border-l1',
      '--dsw-alias-border-l2',
      '--dsw-alias-brand-primary',
      '--dsw-alias-label-primary',
      '--dsw-alias-label-secondary',
      '--dsw-alias-state-error-primary',
      '--dsw-alias-state-idle-primary',
      '--dsw-alias-state-success-primary',
      '--dsw-alias-state-warn-primary',
      '--dsw-specific-sidebar-fill',
      /* Text drawn on top of a brand or state fill (primary buttons, badges,
       * switch thumbs). Light palettes use paper, dark palettes use ink, so the
       * label never disappears into the bright accent. */
      '--dsw-alias-label-primary-foreground',
    ];

    /**
     * Each style ships a coherent palette for the light and the dark color
     * scheme, so the host Appearance control keeps working underneath the skin.
     * Order matches TOKEN_NAMES.
     */
    const STYLES = [
      {
        id: 'classic',
        nameKey: 'style.classic',
        descKey: 'style.classic.desc',
        artwork: { shell: '#193b43', screen: '#a4e8b5', bulb: '#5bd9be' },
        swatches: ['#e6e8d8', '#006d68', '#226d3d', '#152d35'],
        light: ['#e6e8d8', '#f4f2df', '#d6deca', '#fffced', '#a1ad9c', '#586b69', '#006d68', '#152d35', '#435b5c', '#9f2935', '#586b69', '#226d3d', '#8a5300', '#c9d8c8', '#f4f2df'],
        dark: ['#0e1a17', '#14241f', '#1b3029', '#182a24', '#2e4a40', '#4e7064', '#5bd9be', '#ddf3e8', '#a7c6b8', '#f07a86', '#6e8f82', '#62d394', '#e3a34a', '#10211c', '#06120c'],
      },
      {
        id: 'amber',
        nameKey: 'style.amber',
        descKey: 'style.amber.desc',
        artwork: { shell: '#3a2a12', screen: '#f3cd86', bulb: '#e8a33d' },
        swatches: ['#f3e6c8', '#9a5b00', '#4a6b1e', '#2e2108'],
        light: ['#f3e6c8', '#fbf1d9', '#e8d6ae', '#fff7e2', '#c3a66e', '#7a5a1e', '#9a5b00', '#2e2108', '#5e4a22', '#a62b2b', '#8a6a32', '#4a6b1e', '#8a5300', '#ead8b2', '#fff7e2'],
        dark: ['#140f06', '#20180a', '#2c210d', '#241a0b', '#4c3a16', '#8a6a2a', '#e8a33d', '#f6e3b0', '#c7a96b', '#f07a7a', '#8c7440', '#b6d46a', '#e8a33d', '#1a1308', '#140f06'],
      },
      {
        id: 'vapor',
        nameKey: 'style.vapor',
        descKey: 'style.vapor.desc',
        artwork: { shell: '#3a2158', screen: '#f4c6ff', bulb: '#ff6bd6' },
        swatches: ['#f1e6f7', '#a2268f', '#2e7d6b', '#2a1338'],
        light: ['#f1e6f7', '#fbf4ff', '#e4d1f0', '#fff7ff', '#b79bd6', '#6b4a9e', '#a2268f', '#2a1338', '#5a3c6e', '#b3264a', '#8a6aa6', '#2e7d6b', '#9a5b00', '#e4d1f0', '#fbf4ff'],
        dark: ['#150c24', '#211436', '#2e1c4c', '#241540', '#523573', '#8f63c4', '#ff6bd6', '#f0e2ff', '#bfa3de', '#ff7a94', '#7e5fa0', '#59e0c4', '#ffc15e', '#1a0f2b', '#150c24'],
      },
      {
        id: 'cobalt',
        nameKey: 'style.cobalt',
        descKey: 'style.cobalt.desc',
        artwork: { shell: '#123047', screen: '#bfe9ff', bulb: '#4fc3f7' },
        swatches: ['#e4eef6', '#0b5e8a', '#1f6b4a', '#0e2230'],
        light: ['#e4eef6', '#f2f8fc', '#cfe0ec', '#f7fbff', '#9fb6c6', '#4a6478', '#0b5e8a', '#0e2230', '#3e5a6c', '#a6293a', '#6a8394', '#1f6b4a', '#8a5300', '#d3e2ec', '#f2f8fc'],
        dark: ['#08131c', '#0e1f2c', '#142b3c', '#102432', '#234356', '#3e6780', '#4fc3f7', '#ddf0fa', '#9dbccf', '#ff7d8a', '#6a8fa3', '#5ee0a0', '#ffc15e', '#0a1822', '#08131c'],
      },
      {
        id: 'matrix',
        nameKey: 'style.matrix',
        descKey: 'style.matrix.desc',
        artwork: { shell: '#073016', screen: '#b9ffca', bulb: '#50ff82' },
        swatches: ['#020a05', '#123c20', '#62ef85', '#dcffe4'],
        // Matrix intentionally stays dark in both host appearance modes.
        light: ['#030b06', '#08180d', '#102719', '#08180d', '#315d3b', '#538363', '#80ef9b', '#e2ffe9', '#b4d9bc', '#ff9191', '#97bba0', '#8df5aa', '#f2d082', '#06120a', '#030b06'],
        dark: ['#030b06', '#08180d', '#102719', '#08180d', '#315d3b', '#538363', '#80ef9b', '#e2ffe9', '#b4d9bc', '#ff9191', '#97bba0', '#8df5aa', '#f2d082', '#06120a', '#030b06'],
      },
    ];

    /**
     * Bundled brand typefaces. Each stack starts with the @font-face family
     * served from /dsh-retro-ai-os/fonts/ (see BRAND_CSS); `scale` keeps a wide
     * display face from overflowing the sidebar row and the hero headline.
     */
    const BRAND_FONTS = [
      { id: 'system', labelKey: 'brand.font.system', stack: 'inherit', scale: 1 },
      { id: 'arcade', labelKey: 'brand.font.arcade', stack: "'Retro Brand Arcade', 'Press Start 2P', ui-monospace, monospace", scale: 0.6 },
      { id: 'terminal', labelKey: 'brand.font.terminal', stack: "'Retro Brand Terminal', 'VT323', ui-monospace, monospace", scale: 1.1 },
      { id: 'orbitron', labelKey: 'brand.font.orbitron', stack: "'Retro Brand Orbitron', 'Orbitron', ui-monospace, monospace", scale: 0.94 },
      { id: 'neon', labelKey: 'brand.font.neon', stack: "'Retro Brand Neon', 'Monoton', ui-monospace, monospace", scale: 0.96 },
      { id: 'roman', labelKey: 'brand.font.roman', stack: "'Retro Brand Roman', 'Cinzel', Georgia, serif", scale: 0.92 },
      { id: 'editorial', labelKey: 'brand.font.editorial', stack: "'Retro Brand Editorial', 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif", scale: 0.95 },
      { id: 'syne', labelKey: 'brand.font.syne', stack: "'Retro Brand Syne', 'Syne', ui-sans-serif, system-ui, sans-serif", scale: 0.88 },
      { id: 'bebas', labelKey: 'brand.font.bebas', stack: "'Retro Brand Bebas', 'Bebas Neue', 'Arial Narrow', ui-sans-serif, sans-serif", scale: 1.12 },
      { id: 'bungee', labelKey: 'brand.font.bungee', stack: "'Retro Brand Bungee', 'Bungee', ui-sans-serif, system-ui, sans-serif", scale: 0.82 },
      { id: 'mono', labelKey: 'brand.font.mono', stack: "'Retro Brand Mono', 'IBM Plex Mono', ui-monospace, monospace", scale: 0.86 },
    ];

    /** Where a brand mark comes from. */
    const BRAND_MARKS = ['default', 'custom', 'none'];

    /** Sidebar brand row geometry owned by ui-sidebar. */
    const SIDEBAR_BRAND_SIZE = 18;

    /** Hero headline geometry owned by ui-conversation. */
    const HERO_BRAND_SIZE = 26;

    /**
     * @param {string} id Typeface id.
     * @returns {typeof BRAND_FONTS[number]} The typeface entry.
     */
    function fontOf(id) {
      return BRAND_FONTS.find((font) => font.id === id) || BRAND_FONTS[0];
    }

    /** Smallest and largest logo scale the slider offers. */
    const MARK_SCALE_MIN = 0.5;
    const MARK_SCALE_MAX = 1.5;

    /**
     * @param {unknown} input Untrusted scale.
     * @returns {number} A scale between 0.5 and 1.5.
     */
    function scaleOf(input) {
      const value = typeof input === 'number' && Number.isFinite(input) ? input : 1;
      return Math.min(MARK_SCALE_MAX, Math.max(MARK_SCALE_MIN, value));
    }

    /** @returns {object} A fresh default brand block. */
    function defaultBrand() {
      return {
        on: false, seeded: false, sidebarText: '', heroText: '',
        sidebarMark: 'default', heroMark: 'default', markScale: 1, font: 'system', badge: true, asset: null,
      };
    }

    /**
     * Normalize the brand block received from the Host.
     * @param {unknown} input Untrusted share.
     * @returns {ReturnType<typeof defaultBrand>} A complete brand block.
     */
    function normalizeBrand(input) {
      const source = input && typeof input === 'object' ? input : {};
      const asset = source.asset && typeof source.asset === 'object' && typeof source.asset.url === 'string'
        ? { url: source.asset.url, label: typeof source.asset.label === 'string' ? source.asset.label : '' }
        : null;
      return {
        on: source.on === true,
        seeded: source.seeded === true,
        sidebarText: typeof source.sidebarText === 'string' ? source.sidebarText.slice(0, 48) : '',
        heroText: typeof source.heroText === 'string' ? source.heroText.slice(0, 48) : '',
        sidebarMark: BRAND_MARKS.includes(source.sidebarMark) ? source.sidebarMark : 'default',
        heroMark: BRAND_MARKS.includes(source.heroMark) ? source.heroMark : 'default',
        markScale: scaleOf(source.markScale),
        font: BRAND_FONTS.some((font) => font.id === source.font) ? source.font : 'system',
        badge: source.badge !== false,
        asset,
      };
    }

    const DICTS = {
      en: {
        eyebrow: 'CUSTOMIZATION / PLUGIN',
        title: 'Retro AI OS',
        intro: 'A pixel-era desktop skin for Harness. Pick a style, keep every control in place, and switch it off at any time.',
        styleCard: '01 / STYLE KIT',
        styleLabel: 'Visual style',
        'style.classic': 'Classic Mint',
        'style.classic.desc': 'Soft sage panels with deep teal accents.',
        'style.amber': 'Amber CRT',
        'style.amber.desc': 'Warm phosphor terminal with amber highlights.',
        'style.vapor': 'Vaporwave',
        'style.vapor.desc': 'Violet dusk with magenta and mint signals.',
        'style.cobalt': 'Midnight Cobalt',
        'style.cobalt.desc': 'Blueprint blue with bright cyan accents.',
        'style.matrix': 'Matrix',
        'style.matrix.desc': 'Dark terminal, green phosphor and falling code.',
        behaviorCard: '02 / BEHAVIOR',
        'toggle.label': 'Enable Retro AI OS',
        'toggle.desc': 'Applies the selected style to the interface. Switching it off restores the host appearance exactly.',
        'mascot.label': 'Show the companion',
        'mascot.desc': 'A pixel companion under the composer that follows the real session state.',
        'animation.label': 'Discreet animations',
        'animation.desc': 'Companion cues and Matrix digital rain. Your system reduced-motion setting wins.',
        companionCard: '03 / COMPANION & STATUS',
        'companion.title': 'Pixel companion',
        'companion.desc': 'It reports activity, pending questions and the end of a turn. It never answers, approves or changes your session.',
        preview: 'Status bar preview',
        'state.idle': 'Ready',
        'state.working': 'Working',
        'state.waiting': 'Waiting for your response',
        'state.done': 'Turn finished',
        'state.unknown': 'Status unavailable',
        statusLabel: 'Agent status',
        saved: 'Preferences saved in Harness',
        saveError: 'Could not save preferences; this session keeps them only until reload.',
        loading: 'Loading preferences…',
        brandCard: '04 / CUSTOM BRAND',
        'brand.on.label': 'Custom brand',
        'brand.on.desc': 'Replaces the sidebar brand and the home headline with your own name, logo and typeface. Turn it off to get the DeepSeek marks back.',
        'brand.sidebar.title': 'Sidebar',
        'brand.hero.title': 'Home headline',
        'brand.text.label': 'Text',
        'brand.text.hint': 'Empty hides the text. Keep it short: 48 characters at most.',
        'brand.mark.label': 'Logo',
        'brand.mark.default': 'Original',
        'brand.mark.custom': 'Custom',
        'brand.mark.none': 'None',
        'brand.badge.label': 'Show the “Preview” badge',
        'brand.asset.title': 'Logo image',
        'brand.asset.hint': 'PNG, JPG, WebP, GIF or SVG · up to 400 KB · a transparent background works best.',
        'brand.asset.upload': 'Upload image',
        'brand.asset.replace': 'Replace image',
        'brand.asset.remove': 'Remove',
        'brand.asset.empty': 'No custom image yet',
        'brand.asset.error': 'That image could not be uploaded.',
        'brand.previewBadge': 'Preview',
        'brand.requiresTheme': 'The brand applies while Retro AI OS is enabled.',
        'brand.asset.uploading': 'Uploading image…',
        'brand.size.label': 'Logo size',
        'brand.size.hint': 'Scales your own image; the original whale keeps its size.',
        'brand.font.title': 'Typeface',
        'brand.font.system': 'Host default',
        'brand.font.arcade': 'Arcade',
        'brand.font.terminal': 'Terminal',
        'brand.font.orbitron': 'Orbitron',
        'brand.font.neon': 'Neon',
        'brand.font.roman': 'Roman',
        'brand.font.editorial': 'Editorial',
        'brand.font.syne': 'Syne',
        'brand.font.bebas': 'Bebas',
        'brand.font.bungee': 'Bungee',
        'brand.font.mono': 'Mono',
        'brand.preview': 'Brand preview',
        'brand.preview.sidebar': 'Sidebar',
        'brand.preview.hero': 'Home',
        'brand.heroDefault': 'Into the Unknown',
        'brand.reset': 'Reset brand',
        footer: 'The style is a reversible token layer: disable it and every original color returns. Preferences persist across restarts.',
      },
      es: {
        eyebrow: 'PERSONALIZACIÓN / PLUGIN',
        title: 'Retro AI OS',
        intro: 'Un escritorio pixelado para Harness. Elige un estilo, conserva todos los controles y desactívalo cuando quieras.',
        styleCard: '01 / ESTILOS',
        styleLabel: 'Estilo visual',
        'style.classic': 'Menta clásica',
        'style.classic.desc': 'Paneles salvia con acentos verde azulado.',
        'style.amber': 'CRT ámbar',
        'style.amber.desc': 'Fósforo cálido con luces ámbar.',
        'style.vapor': 'Vaporwave',
        'style.vapor.desc': 'Atardecer violeta con señales magenta y menta.',
        'style.cobalt': 'Azul medianoche',
        'style.cobalt.desc': 'Azul de plano con acentos cian.',
        'style.matrix': 'Matrix',
        'style.matrix.desc': 'Terminal oscuro, fósforo verde y lluvia de código.',
        behaviorCard: '02 / COMPORTAMIENTO',
        'toggle.label': 'Activar Retro AI OS',
        'toggle.desc': 'Aplica el estilo elegido a la interfaz. Al desactivarlo reaparece exactamente el aspecto original.',
        'mascot.label': 'Mostrar el compañero',
        'mascot.desc': 'Una mascota pixelada bajo el cuadro de mensaje que sigue el estado real de la sesión.',
        'animation.label': 'Animaciones discretas',
        'animation.desc': 'Animaciones del compañero y lluvia digital de Matrix. La preferencia de movimiento reducido del sistema tiene prioridad.',
        companionCard: '03 / MASCOTA Y ESTADO',
        'companion.title': 'Compañero pixelado',
        'companion.desc': 'Informa de la actividad, las preguntas pendientes y el final del turno. Nunca responde, aprueba ni modifica tu sesión.',
        preview: 'Vista previa de la barra de estado',
        'state.idle': 'Preparado',
        'state.working': 'Trabajando',
        'state.waiting': 'Esperando tu respuesta',
        'state.done': 'Turno terminado',
        'state.unknown': 'Estado no disponible',
        statusLabel: 'Estado del agente',
        saved: 'Preferencias guardadas en Harness',
        saveError: 'No se pudieron guardar las preferencias; esta sesión las conserva solo hasta recargar.',
        loading: 'Cargando preferencias…',
        brandCard: '04 / MARCA PROPIA',
        'brand.on.label': 'Marca propia',
        'brand.on.desc': 'Sustituye la marca de la barra lateral y el título de la portada por tu nombre, tu logo y tu tipografía. Al desactivarlo vuelven las marcas de DeepSeek.',
        'brand.sidebar.title': 'Barra lateral',
        'brand.hero.title': 'Portada',
        'brand.text.label': 'Texto',
        'brand.text.hint': 'Vacío oculta el texto. Mejor corto: 48 caracteres como máximo.',
        'brand.mark.label': 'Logo',
        'brand.mark.default': 'Original',
        'brand.mark.custom': 'Propio',
        'brand.mark.none': 'Ninguno',
        'brand.badge.label': 'Mostrar la etiqueta «Vista previa»',
        'brand.asset.title': 'Imagen del logo',
        'brand.asset.hint': 'PNG, JPG, WebP, GIF o SVG · hasta 400 KB · mejor con fondo transparente.',
        'brand.asset.upload': 'Subir imagen',
        'brand.asset.replace': 'Cambiar imagen',
        'brand.asset.remove': 'Quitar',
        'brand.asset.empty': 'Todavía no hay imagen propia',
        'brand.asset.error': 'No se pudo subir esa imagen.',
        'brand.previewBadge': 'Vista previa',
        'brand.requiresTheme': 'La marca se aplica mientras Retro AI OS está activado.',
        'brand.asset.uploading': 'Subiendo imagen…',
        'brand.size.label': 'Tamaño del logo',
        'brand.size.hint': 'Escala tu propia imagen; la ballena original conserva su tamaño.',
        'brand.font.title': 'Tipografía',
        'brand.font.system': 'La del sistema',
        'brand.font.arcade': 'Arcade',
        'brand.font.terminal': 'Terminal',
        'brand.font.orbitron': 'Orbitron',
        'brand.font.neon': 'Neón',
        'brand.font.roman': 'Romana',
        'brand.font.editorial': 'Editorial',
        'brand.font.syne': 'Syne',
        'brand.font.bebas': 'Bebas',
        'brand.font.bungee': 'Bungee',
        'brand.font.mono': 'Mono',
        'brand.preview': 'Vista previa de la marca',
        'brand.preview.sidebar': 'Barra lateral',
        'brand.preview.hero': 'Portada',
        'brand.heroDefault': 'Hacia lo desconocido',
        'brand.reset': 'Restaurar marca',
        footer: 'El estilo es una capa de tokens reversible: al desactivarlo vuelven todos los colores originales. Las preferencias se conservan entre reinicios.',
      },
      zh: {
        eyebrow: '个性化 / 插件',
        title: 'Retro AI OS',
        intro: '为 Harness 提供像素桌面皮肤。选择风格、保留所有控件，并可随时关闭。',
        styleCard: '01 / 风格',
        styleLabel: '视觉风格',
        'style.classic': '薄荷经典',
        'style.classic.desc': '柔和鼠尾草面板与深青色点缀。',
        'style.amber': '琥珀 CRT',
        'style.amber.desc': '温暖磷光终端与琥珀高光。',
        'style.vapor': '蒸汽波',
        'style.vapor.desc': '紫罗兰暮色与洋红、薄荷信号。',
        'style.cobalt': '午夜钴蓝',
        'style.cobalt.desc': '蓝图蓝与明亮青色点缀。',
        'style.matrix': 'Matrix',
        'style.matrix.desc': '深色终端、绿色荧光与数字雨。',
        behaviorCard: '02 / 行为',
        'toggle.label': '启用 Retro AI OS',
        'toggle.desc': '将所选风格应用到界面。关闭后恢复原始外观。',
        'mascot.label': '显示伙伴',
        'mascot.desc': '输入框下方的像素伙伴，跟随真实会话状态。',
        'animation.label': '轻微动画',
        'animation.desc': '伙伴动画和 Matrix 数字雨；系统“减少动态效果”优先。',
        companionCard: '03 / 伙伴与状态',
        'companion.title': '像素伙伴',
        'companion.desc': '报告活动、待回答的问题与本轮结束；不会替你回答、批准或修改会话。',
        preview: '状态栏预览',
        'state.idle': '就绪',
        'state.working': '工作中',
        'state.waiting': '等待你的回应',
        'state.done': '本轮已结束',
        'state.unknown': '状态不可用',
        statusLabel: '智能体状态',
        saved: '偏好已保存到 Harness',
        saveError: '无法保存偏好；本次会话只在刷新前保留。',
        loading: '正在加载偏好…',
        brandCard: '04 / 自定义品牌',
        'brand.on.label': '自定义品牌',
        'brand.on.desc': '用你自己的名称、标志和字体替换侧边栏品牌与首页标题。关闭后恢复 DeepSeek 品牌。',
        'brand.sidebar.title': '侧边栏',
        'brand.hero.title': '首页标题',
        'brand.text.label': '文字',
        'brand.text.hint': '留空即不显示文字，最多 48 个字符。',
        'brand.mark.label': '标志',
        'brand.mark.default': '原始',
        'brand.mark.custom': '自定义',
        'brand.mark.none': '无',
        'brand.badge.label': '显示“预览版”标签',
        'brand.asset.title': '标志图片',
        'brand.asset.hint': 'PNG、JPG、WebP、GIF 或 SVG · 不超过 400 KB · 建议使用透明背景。',
        'brand.asset.upload': '上传图片',
        'brand.asset.replace': '更换图片',
        'brand.asset.remove': '移除',
        'brand.asset.empty': '尚未上传图片',
        'brand.asset.error': '无法上传该图片。',
        'brand.previewBadge': '预览版',
        'brand.requiresTheme': '只有在启用 Retro AI OS 时品牌才会应用。',
        'brand.asset.uploading': '正在上传…',
        'brand.size.label': '标志大小',
        'brand.size.hint': '只缩放你上传的图片，原始标志保持原尺寸。',
        'brand.font.title': '字体',
        'brand.font.system': '系统默认',
        'brand.font.arcade': '街机',
        'brand.font.terminal': '终端',
        'brand.font.orbitron': 'Orbitron',
        'brand.font.neon': '霓虹',
        'brand.font.roman': '罗马',
        'brand.font.editorial': '编辑体',
        'brand.font.syne': 'Syne',
        'brand.font.bebas': 'Bebas',
        'brand.font.bungee': 'Bungee',
        'brand.font.mono': '等宽',
        'brand.preview': '品牌预览',
        'brand.preview.sidebar': '侧边栏',
        'brand.preview.hero': '首页',
        'brand.heroDefault': '探索未至之境',
        'brand.reset': '恢复品牌',
        footer: '风格是可逆的令牌层：关闭后恢复所有原始颜色，偏好可在重启后保留。',
      },
    };

    function tokensOf(style) {
      const tokens = {};
      TOKEN_NAMES.forEach((name, index) => {
        tokens[name] = { light: style.light[index], dark: style.dark[index] };
      });
      const alias = (name) => tokens[name];
      tokens['--dsw-alias-border-l3'] = alias('--dsw-alias-border-l2');
      tokens['--dsw-alias-border-l4'] = alias('--dsw-alias-border-l1');
      tokens['--dsw-alias-bg-module-platform'] = alias('--dsw-alias-bg-layer-2');
      tokens['--dsw-alias-interactive-bg-hover'] = alias('--dsw-alias-bg-layer-2');
      tokens['--dsw-alias-label-tertiary'] = alias('--dsw-alias-label-secondary');
      tokens['--dsw-alias-state-business-primary'] = alias('--dsw-alias-brand-primary');
      tokens['--dsw-alias-button-primary-fill'] = alias('--dsw-alias-brand-primary');
      tokens['--dsw-alias-switch-thumb'] = alias('--dsw-alias-bg-layer-1');
      tokens['--dsw-alias-menu-icon'] = alias('--dsw-alias-label-primary');
      return tokens;
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

    function usePrefs(store) {
      const [prefs, setPrefs] = React.useState(store.get());
      React.useEffect(() => store.subscribe(() => setPrefs(store.get())), []);
      return prefs;
    }

    function pickPublic(prefs) {
      return {
        enabled: prefs.enabled,
        style: prefs.style,
        mascot: prefs.mascot,
        animation: prefs.animation,
        brand: normalizeBrand(prefs.brand),
      };
    }

    function normalizePreferences(input) {
      return {
        enabled: input?.enabled === true,
        style: STYLES.some((style) => style.id === input?.style) ? input.style : 'classic',
        mascot: input?.mascot !== false,
        animation: input?.animation !== false,
        brand: normalizeBrand(input?.brand),
      };
    }

    async function requestPreferences(method, body) {
      const response = await fetch(ENDPOINT + '/preferences', {
        method,
        cache: 'no-store',
        headers: {
          [HEADER]: '1',
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok !== true) {
        throw new Error(typeof payload?.error === 'string' ? payload.error : 'preferences-request-failed');
      }
      return payload.data;
    }

    const CSS = `
html[data-retro-matrix="true"] body{font-family:'IBM Plex Mono','SFMono-Regular',Consolas,'Liberation Mono',monospace}
/* Matrix: a finished turn marks the session row with a 6px success-green
 * dot that vanishes into the green rain. Keep the host's green but thicken the
 * core and add a dark rim plus a glow in the same colour, so the completed
 * session stays visible at a glance. Scoped to the session rows
 * (data-row-key="session:<id>") and to the Matrix theme. */
html[data-retro-matrix="true"] [data-row-key^="session:"] [data-state="done"]::after{inset:8%;box-shadow:0 0 0 1px rgba(3,11,6,.85),0 0 7px currentColor}
.retro-matrix-rain{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0;opacity:.52;mask-image:linear-gradient(90deg,#000 0%,#000 12%,rgba(0,0,0,.45) 35%,rgba(0,0,0,.25) 60%,rgba(0,0,0,.10) 100%);-webkit-mask-image:linear-gradient(90deg,#000 0%,#000 12%,rgba(0,0,0,.45) 35%,rgba(0,0,0,.25) 60%,rgba(0,0,0,.10) 100%)}
.retro-matrix-column{position:absolute;top:0;display:flex;flex-direction:column;align-items:center;font:500 15px/1.12 'Courier New',monospace;white-space:nowrap;animation:matrix-fall var(--duration) linear var(--delay) infinite}
.retro-matrix-tail{writing-mode:vertical-rl;text-orientation:upright;letter-spacing:.08em;color:#19eb54;background:linear-gradient(to bottom,transparent,#087e30 25%,#19ed58 85%,#a0ffb3);background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-shadow:0 0 7px rgba(0,255,72,.3)}
.retro-matrix-head{color:#e2ffe9;text-shadow:0 0 4px #baffcc,0 0 12px #29ff67}
.retro-matrix-rain.retro-static .retro-matrix-column{animation:none;top:var(--static-top)}
@keyframes matrix-fall{from{transform:translateY(-100%)}to{transform:translateY(100vh)}}
@media (prefers-reduced-motion:reduce){.retro-matrix-column{animation:none;top:var(--static-top)}}
.retro-page{max-width:760px;color:var(--dsw-alias-label-primary)}
.retro-hero{padding:6px 0 18px;border-bottom:2px dashed var(--dsw-alias-border-l2)}
.retro-eyebrow{font:700 11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;color:var(--dsw-alias-brand-primary)}
.retro-title{font:700 26px/1.15 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:-.02em;margin:8px 0 6px;color:var(--dsw-alias-label-primary)}
.retro-intro{margin:0;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.55;max-width:620px}
.retro-card{margin:16px 0 0;border:2px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);box-shadow:4px 4px 0 var(--dsw-alias-border-l1)}
.retro-card-head{display:flex;align-items:center;gap:8px;padding:7px 12px;background:var(--dsw-alias-bg-layer-2);border-bottom:2px solid var(--dsw-alias-border-l2);font:700 11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;color:var(--dsw-alias-brand-primary)}
.retro-card-head::before{content:"";width:7px;height:7px;background:var(--dsw-alias-state-success-primary);box-shadow:7px 0 0 var(--dsw-alias-state-warn-primary),14px 0 0 var(--dsw-alias-brand-primary)}
.retro-card-head span{padding-left:17px}
.retro-card-body{padding:4px 14px 8px}
.retro-row{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px dashed var(--dsw-alias-border-l1)}
.retro-row:last-child{border-bottom:0}
.retro-row-title{font-size:13px;font-weight:600;line-height:1.4;color:var(--dsw-alias-label-primary)}
.retro-row-desc{margin:3px 0 0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary);max-width:470px}
.retro-switch{position:relative;flex:none;width:58px;height:28px;margin-top:2px;border:2px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);cursor:pointer;padding:0;transition:background .12s steps(2,end)}
.retro-switch::after{content:"";position:absolute;top:2px;left:2px;width:20px;height:20px;background:var(--dsw-alias-state-idle-primary);box-shadow:inset 1px 1px 0 rgba(255,255,255,.45),inset -1px -1px 0 rgba(0,0,0,.25);transition:transform .12s steps(2,end)}
.retro-switch[aria-checked="true"]{background:var(--dsw-alias-brand-primary)}
.retro-switch[aria-checked="true"]::after{transform:translateX(28px);background:var(--dsw-alias-bg-layer-1)}
.retro-switch:focus-visible{outline:3px solid var(--dsw-alias-brand-primary);outline-offset:3px}
.retro-styles{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;padding:12px 0 4px}
.retro-style{position:relative;display:block;border:2px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);cursor:pointer;padding:0}
.retro-style:hover{border-color:var(--dsw-alias-border-l2)}
.retro-style.selected{border-color:var(--dsw-alias-brand-primary);box-shadow:inset 0 0 0 1px var(--dsw-alias-brand-primary)}
.retro-style:has(input:focus-visible){outline:3px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.retro-style input{position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}
.retro-style-body{display:flex;flex-direction:column;gap:5px;padding:10px}
.retro-swatches{display:flex;gap:4px;margin-bottom:2px}
.retro-swatch{width:20px;height:14px;border:1px solid rgba(0,0,0,.35);box-shadow:inset 1px 1px 0 rgba(255,255,255,.35)}
.retro-style-name{font:600 13px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--dsw-alias-label-primary)}
.retro-style-desc{font-size:11px;line-height:1.45;color:var(--dsw-alias-label-secondary)}
.retro-style-check{align-self:flex-end;margin-top:2px;font:700 10px ui-monospace,monospace;letter-spacing:.08em;color:var(--dsw-alias-brand-primary);visibility:hidden}
.retro-style.selected .retro-style-check{visibility:visible}
.retro-status{display:inline-flex;align-items:center;gap:10px;max-width:100%;padding:6px 10px;border:2px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);box-shadow:inset 2px 2px 0 rgba(255,255,255,.35),inset -2px -2px 0 rgba(0,0,0,.16);color:var(--dsw-alias-label-primary)}
.retro-status-copy{display:flex;flex-direction:column;gap:1px;min-width:0}
.retro-status-brand{font:700 10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;color:var(--dsw-alias-brand-primary);white-space:nowrap}
.retro-status-state{font-size:11px;line-height:1.25;color:var(--dsw-alias-label-primary);white-space:nowrap}
.retro-status-style{margin-left:auto;padding:2px 5px;border:1px solid var(--dsw-alias-border-l1);font:700 9px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em;color:var(--dsw-alias-label-secondary);white-space:nowrap;text-transform:uppercase}
.retro-led{flex:none;width:8px;height:8px;background:var(--dsw-alias-state-idle-primary);box-shadow:inset 1px 1px 0 rgba(255,255,255,.5),inset -1px -1px 0 rgba(0,0,0,.35)}
.retro-led-working{background:var(--dsw-alias-state-success-primary);animation:retro-pulse 1.2s steps(2,end) infinite}
.retro-led-waiting{background:var(--dsw-alias-state-warn-primary)}
.retro-led-done{background:var(--dsw-alias-state-success-primary)}
.retro-dock{display:flex;justify-content:flex-start;padding:2px 0 4px}
.retro-legend{display:flex;flex-wrap:wrap;gap:14px;padding:14px 0 4px;border-top:1px dashed var(--dsw-alias-border-l1);margin-top:12px}
.retro-legend-item{display:flex;align-items:center;gap:7px;font-size:11px;color:var(--dsw-alias-label-secondary)}
.retro-legend-item strong{font-weight:600;color:var(--dsw-alias-label-primary)}
.retro-preview-label{margin:14px 0 6px;font:700 10px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;color:var(--dsw-alias-label-secondary)}
.retro-status-line{margin:14px 0 0;font-size:11px;line-height:1.4;color:var(--dsw-alias-label-secondary);display:flex;align-items:center;gap:6px}
.retro-status-line::before{content:"";width:6px;height:6px;background:var(--dsw-alias-state-success-primary)}
.retro-status-line.error{color:var(--dsw-alias-state-error-primary)}
.retro-status-line.error::before{background:var(--dsw-alias-state-error-primary)}
.retro-mascot{image-rendering:pixelated;flex:none;display:block}
.retro-mascot .retro-eyes{animation:retro-blink 6.4s steps(1,end) infinite}
.retro-mascot .retro-antenna{animation:retro-glow 2.4s steps(2,end) infinite}
.retro-mascot-working .retro-antenna{animation-duration:1.1s}
.retro-mascot-working .retro-scan{animation:retro-scan 2.2s steps(6,end) infinite}
.retro-mascot-waiting .retro-note{animation:retro-pulse 1.6s steps(2,end) infinite}
.retro-mascot-done .retro-check{animation:retro-pop .5s steps(3,end) both}
.retro-static .retro-mascot *,.retro-static.retro-mascot *,.retro-static.retro-led{animation:none!important}
@keyframes retro-blink{0%,93%,100%{opacity:1}94%,97%{opacity:0}}
@keyframes retro-glow{0%,100%{opacity:1}50%{opacity:.55}}
@keyframes retro-pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes retro-scan{from{transform:translateY(0)}to{transform:translateY(12px)}}
@keyframes retro-pop{from{opacity:0;transform:translateY(2px)}to{opacity:1;transform:none}}
@media (max-width:520px){.retro-status-style{display:none}.retro-row{flex-direction:column;gap:8px}.retro-switch{align-self:flex-end}}
@media (prefers-reduced-motion:reduce){.retro-page *,.retro-dock *,.retro-status *{animation:none!important;transition:none!important}}
@font-face{font-family:'Retro Brand Arcade';src:url('/dsh-retro-ai-os/fonts/press-start-2p.woff2') format('woff2');font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:'Retro Brand Terminal';src:url('/dsh-retro-ai-os/fonts/vt323.woff2') format('woff2');font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:'Retro Brand Orbitron';src:url('/dsh-retro-ai-os/fonts/orbitron.woff2') format('woff2');font-weight:700;font-style:normal;font-display:swap}
@font-face{font-family:'Retro Brand Neon';src:url('/dsh-retro-ai-os/fonts/monoton.woff2') format('woff2');font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:'Retro Brand Roman';src:url('/dsh-retro-ai-os/fonts/cinzel.woff2') format('woff2');font-weight:600;font-style:normal;font-display:swap}
@font-face{font-family:'Retro Brand Editorial';src:url('/dsh-retro-ai-os/fonts/bricolage-grotesque.woff2') format('woff2');font-weight:700;font-style:normal;font-display:swap}
@font-face{font-family:'Retro Brand Syne';src:url('/dsh-retro-ai-os/fonts/syne.woff2') format('woff2');font-weight:700;font-style:normal;font-display:swap}
@font-face{font-family:'Retro Brand Bebas';src:url('/dsh-retro-ai-os/fonts/bebas-neue.woff2') format('woff2');font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:'Retro Brand Bungee';src:url('/dsh-retro-ai-os/fonts/bungee.woff2') format('woff2');font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:'Retro Brand Mono';src:url('/dsh-retro-ai-os/fonts/ibm-plex-mono.woff2') format('woff2');font-weight:600;font-style:normal;font-display:swap}
[class*="_titleGroup"][data-retro-hide-text]>span:first-child{display:none}
[class*="_titleGroup"][data-retro-hide-badge]>span[class*="_previewBadge"]{display:none}
[data-retro-brand-text]{font-family:var(--retro-brand-font,inherit);font-size:calc(1em * var(--retro-brand-scale,1));line-height:1.16;letter-spacing:.01em}
.retro-brand-logo{display:block;object-fit:contain;image-rendering:pixelated}
.retro-brand-name{display:inline-flex;align-items:center;height:24px;color:var(--dsw-alias-label-primary);letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.retro-brand-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:12px 0 2px}
.retro-field{display:flex;flex-direction:column;gap:7px;min-width:0}
.retro-field-label{font:700 10px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;color:var(--dsw-alias-label-secondary);text-transform:uppercase}
.retro-input{box-sizing:border-box;width:100%;padding:8px 10px;border:2px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:500 13px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace}
.retro-input::placeholder{color:var(--dsw-alias-label-tertiary)}
.retro-input:focus-visible{outline:3px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.retro-field-hint{margin:0;font-size:11px;line-height:1.45;color:var(--dsw-alias-label-secondary)}
.retro-segmented{display:inline-flex;align-self:flex-start;border:2px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1)}
.retro-segment{appearance:none;border:0;border-right:2px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary);font:600 11px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em;padding:7px 10px;cursor:pointer}
.retro-segment:last-child{border-right:0}
.retro-segment:hover{color:var(--dsw-alias-label-primary)}
.retro-segment[aria-checked="true"]{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-layer-1)}
.retro-segment:focus-visible{outline:3px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.retro-inline-switch{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:2px}
.retro-inline-switch span{font-size:11px;line-height:1.4;color:var(--dsw-alias-label-secondary)}
.retro-asset-row{display:flex;align-items:center;gap:12px;padding:14px 0 12px;border-bottom:1px dashed var(--dsw-alias-border-l1)}
.retro-asset-thumb{display:flex;flex:none;align-items:center;justify-content:center;width:46px;height:46px;border:2px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);box-shadow:inset 2px 2px 0 rgba(255,255,255,.3),inset -2px -2px 0 rgba(0,0,0,.14)}
.retro-asset-thumb img{max-width:36px;max-height:36px;object-fit:contain;image-rendering:pixelated}
.retro-asset-thumb span{padding:2px;font:700 9px/1.25 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--dsw-alias-label-secondary);text-align:center}
.retro-asset-copy{display:flex;flex:1;flex-direction:column;gap:3px;min-width:0}
.retro-asset-title{font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary)}
.retro-asset-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--dsw-alias-label-secondary)}
.retro-asset-actions{display:flex;flex:none;flex-wrap:wrap;justify-content:flex-end;gap:6px}
.retro-button{appearance:none;cursor:pointer;padding:7px 10px;border:2px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:600 11px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.03em;box-shadow:2px 2px 0 var(--dsw-alias-border-l1)}
.retro-button:hover{background:var(--dsw-alias-bg-layer-1)}
.retro-button:disabled{opacity:.55;cursor:default}
.retro-button:focus-visible{outline:3px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.retro-button.danger{color:var(--dsw-alias-state-error-primary)}
.retro-file{position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}
.retro-fonts{display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:8px;padding:10px 0 2px}
.retro-font{position:relative;display:block;cursor:pointer;padding:9px 10px 7px;border:2px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.retro-font:hover{border-color:var(--dsw-alias-border-l2)}
.retro-font.selected{border-color:var(--dsw-alias-brand-primary);box-shadow:inset 0 0 0 1px var(--dsw-alias-brand-primary)}
.retro-font:has(input:focus-visible){outline:3px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.retro-font input{position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}
.retro-font-sample{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:24px;line-height:1.15;color:var(--dsw-alias-label-primary)}
.retro-font-name{display:block;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--dsw-alias-label-secondary)}
.retro-brand-preview{display:flex;flex-direction:column;gap:10px;margin-top:14px;padding:12px;border:2px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2)}
.retro-brand-preview-row{display:flex;align-items:center;gap:9px;min-height:28px;min-width:0}
.retro-brand-preview-tag{flex:none;width:86px;white-space:nowrap;font:700 9px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.09em;text-transform:uppercase;color:var(--dsw-alias-label-secondary)}
.retro-brand-preview-name{font-size:18px;font-weight:600;letter-spacing:.04em;color:var(--dsw-alias-label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.retro-brand-preview-hero{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:26px;font-weight:500;color:var(--dsw-alias-label-primary)}
.retro-brand-preview-badge{margin-left:8px;padding:1px 5px;border-radius:3px;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-layer-1);font:600 10px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;vertical-align:middle}
.retro-scale{display:flex;flex-direction:column;gap:4px;padding-top:14px}
.retro-scale-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
.retro-scale-value{font:700 11px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em;color:var(--dsw-alias-brand-primary)}
.retro-range{-webkit-appearance:none;appearance:none;width:100%;height:22px;margin:0;background:transparent;cursor:pointer}
.retro-range::-webkit-slider-runnable-track{box-sizing:border-box;height:8px;background:var(--dsw-alias-bg-layer-1);border:2px solid var(--dsw-alias-border-l2);box-shadow:inset 2px 2px 0 rgba(0,0,0,.14)}
.retro-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;box-sizing:border-box;width:16px;height:20px;margin-top:-6px;background:var(--dsw-alias-brand-primary);border:2px solid var(--dsw-alias-bg-layer-1);box-shadow:2px 2px 0 var(--dsw-alias-border-l1)}
.retro-range:focus-visible{outline:3px solid var(--dsw-alias-brand-primary);outline-offset:4px}
.retro-range:disabled{opacity:.45;cursor:default}
.retro-range::-moz-range-track{height:8px;background:var(--dsw-alias-bg-layer-1);border:2px solid var(--dsw-alias-border-l2)}
.retro-range::-moz-range-thumb{width:16px;height:20px;border-radius:0;background:var(--dsw-alias-brand-primary);border:2px solid var(--dsw-alias-bg-layer-1)}
[class*="_brand"]:has(.retro-brand-logo){overflow:visible}
@media (max-width:640px){.retro-brand-grid{grid-template-columns:1fr}.retro-asset-row{flex-wrap:wrap}.retro-asset-actions{width:100%;justify-content:flex-start}}
`;

    function Mascot({ state = 'idle', size = 40, style, animate = true }) {
      const art = (style && style.artwork) || STYLES[0].artwork;
      const bulge = state === 'waiting' ? '#e3a34a' : state === 'working' ? '#62d394' : state === 'done' ? '#62d394' : art.bulb;
      const className = 'retro-mascot retro-mascot-' + state + (animate ? '' : ' retro-static');
      const eye = (x, y, w, hgt) => h('rect', { key: x + '-' + y, x, y, width: w, height: hgt, fill: art.shell });
      let eyes;
      if (state === 'done') {
        eyes = [
          h('rect', { key: 'l1', x: 9, y: 14, width: 2, height: 2, fill: art.shell }),
          h('rect', { key: 'l2', x: 11, y: 12, width: 2, height: 2, fill: art.shell }),
          h('rect', { key: 'r1', x: 18, y: 12, width: 2, height: 2, fill: art.shell }),
          h('rect', { key: 'r2', x: 20, y: 14, width: 2, height: 2, fill: art.shell }),
        ];
      } else if (state === 'waiting') {
        eyes = [
          h('rect', { key: 'l1', x: 10, y: 12, width: 3, height: 4, fill: art.shell }),
          h('rect', { key: 'r1', x: 19, y: 13, width: 3, height: 3, fill: art.shell }),
          h('rect', { key: 'r2', x: 19, y: 11, width: 3, height: 1, fill: art.shell }),
        ];
      } else if (state === 'working') {
        eyes = [h('rect', { key: 'l', x: 10, y: 13, width: 3, height: 3, fill: art.shell }), h('rect', { key: 'r', x: 19, y: 13, width: 3, height: 3, fill: art.shell })];
      } else {
        eyes = [h('rect', { key: 'l', x: 10, y: 12, width: 3, height: 4, fill: art.shell }), h('rect', { key: 'r', x: 19, y: 12, width: 3, height: 4, fill: art.shell })];
      }
      let mouth;
      if (state === 'done') {
        mouth = [
          h('rect', { key: 'm1', x: 12, y: 19, width: 2, height: 2, fill: art.shell }),
          h('rect', { key: 'm2', x: 13, y: 21, width: 6, height: 2, fill: art.shell }),
          h('rect', { key: 'm3', x: 19, y: 19, width: 2, height: 2, fill: art.shell }),
        ];
      } else if (state === 'waiting') {
        mouth = [h('rect', { key: 'm', x: 15, y: 20, width: 2, height: 2, fill: art.shell })];
      } else if (state === 'working') {
        mouth = [h('rect', { key: 'm', x: 14, y: 20, width: 4, height: 2, fill: art.shell })];
      } else {
        mouth = [h('rect', { key: 'm', x: 13, y: 20, width: 6, height: 2, fill: art.shell })];
      }
      return h('svg', {
        className,
        viewBox: '0 0 32 32',
        width: size,
        height: size,
        shapeRendering: 'crispEdges',
        'aria-hidden': true,
        focusable: false,
      },
        h('g', { className: 'retro-antenna' },
          h('rect', { x: 14, y: 0, width: 4, height: 2, fill: bulge }),
          h('rect', { x: 15, y: 2, width: 2, height: 4, fill: art.shell })),
        h('rect', { x: 1, y: 9, width: 3, height: 8, fill: art.shell }),
        h('rect', { x: 28, y: 9, width: 3, height: 8, fill: art.shell }),
        h('rect', { x: 4, y: 6, width: 24, height: 18, fill: art.shell }),
        h('rect', { x: 6, y: 8, width: 20, height: 14, fill: art.screen }),
        h('g', { className: 'retro-eyes' }, eyes),
        h('g', { className: 'retro-mouth' }, mouth),
        state === 'working' ? h('rect', { className: 'retro-scan', x: 6, y: 8, width: 20, height: 2, fill: 'rgba(255,255,255,.38)' }) : null,
        h('rect', { x: 13, y: 24, width: 6, height: 2, fill: art.shell }),
        h('rect', { x: 7, y: 26, width: 18, height: 5, fill: art.shell }),
        h('rect', { x: 14, y: 26, width: 4, height: 3, fill: art.screen }),
        state === 'working' ? h('g', { className: 'retro-note', fill: art.bulb },
          h('rect', { x: 0, y: 12, width: 2, height: 2 }),
          h('rect', { x: 30, y: 16, width: 2, height: 2 })) : null,
        state === 'waiting' ? h('g', { className: 'retro-note', fill: '#e3a34a' },
          h('rect', { x: 26, y: 1, width: 2, height: 2 }),
          h('rect', { x: 26, y: 4, width: 2, height: 1 })) : null,
        state === 'done' ? h('g', { className: 'retro-check', fill: '#62d394' },
          h('rect', { x: 24, y: 5, width: 2, height: 2 }),
          h('rect', { x: 26, y: 3, width: 2, height: 2 }),
          h('rect', { x: 28, y: 1, width: 2, height: 2 })) : null);
    }

    function StatusBar({ state, style, animate, t }) {
      return h('div', { className: 'retro-status' + (animate ? '' : ' retro-static'), role: 'status', 'aria-live': 'polite', 'aria-label': t('statusLabel') },
        h(Mascot, { state, size: 40, style, animate }),
        h('div', { className: 'retro-status-copy' },
          h('span', { className: 'retro-status-brand' }, 'RETRO AI OS'),
          h('span', { className: 'retro-status-state' }, t('state.' + state))),
        h('span', { className: 'retro-status-style' }, t(style.nameKey)),
        h('span', { className: 'retro-led retro-led-' + state, 'aria-hidden': true }));
    }

    function useCompanionState(props) {
      const session = props.useSession(
        (snapshot) => ({ running: snapshot.running, openState: snapshot.openState }),
        (left, right) => left.running === right.running && left.openState === right.openState,
      );
      const status = props.useSessionStatus((map) => map.get(props.sessionId));
      const [finished, setFinished] = React.useState(false);
      const previous = React.useRef(false);
      React.useEffect(() => {
        const running = Boolean(session.running || (status && status.running));
        if (previous.current && !running) {
          setFinished(true);
          const timer = setTimeout(() => setFinished(false), 8000);
          previous.current = running;
          return () => clearTimeout(timer);
        }
        if (running) setFinished(false);
        previous.current = running;
      }, [session.running, status && status.running]);
      if (status && status.pendingInteraction) return 'waiting';
      if (session.running || (status && status.running)) return 'working';
      if (finished) return 'done';
      if (session.openState === 'open') return 'idle';
      return 'unknown';
    }

    return {
      inject: ['slots', 'theme', 'locale'],
      apply(ctx) {
        ctx.effect(() => {
          const disposers = Object.entries(DICTS).map(([locale, dict]) => ctx.locale.register(NS, locale, dict));
          return () => {
            for (const dispose of disposers) dispose();
          };
        }, 'retro-ai-os locale');

        const t = ctx.locale.bind(NS);
        const store = createStore({ enabled: false, style: 'classic', mascot: true, animation: true, brand: defaultBrand(), ready: false, error: false });
        let layer = null;
        let writeSequence = 0;
        let userChanged = false;

        const applyLayer = () => {
          if (layer !== null) {
            layer();
            layer = null;
          }
          const prefs = store.get();
          if (prefs.enabled && prefs.style === 'matrix') document.documentElement.setAttribute('data-retro-matrix', 'true');
          else document.documentElement.removeAttribute('data-retro-matrix');
          if (!prefs.enabled) return;
          const style = STYLES.find((candidate) => candidate.id === prefs.style) || STYLES[0];
          layer = ctx.theme.overrideTokens(SOURCE, tokensOf(style));
        };

        /* ---------------------------------------------------------------- *
         * Custom brand: sidebar slots, home headline patch and typefaces.
         * Every registration is conditional, so a disabled or untouched brand
         * leaves the stock DeepSeek marks and the host headline in place.
         * ---------------------------------------------------------------- */

        /** Live brand slot disposers. */
        let brandSlots = [];
        /** Signature of the registrations currently installed. */
        let brandSignature = '';
        /** Pending debounced publication of text edits. */
        let commitTimer = 0;
        /** Pending animation frame for the headline patch. */
        let heroFrame = 0;
        /** Text this plugin last wrote into the headline (null: untouched). */
        let lastHeroText = null;

        /** @returns {object} The stored brand block. */
        const currentBrand = () => store.get().brand || defaultBrand();

        /** @returns {boolean} Whether the custom brand should be visible. */
        const brandActive = () => store.get().enabled === true && currentBrand().on === true;

        /** Remove every brand slot registration. */
        const clearBrandSlots = () => {
          for (const dispose of brandSlots) dispose();
          brandSlots = [];
        };

        /** @returns {boolean} Whether a custom logo image is stored. */
        const hasBrandAsset = () => {
          const asset = currentBrand().asset;
          return asset !== null && typeof asset === 'object' && typeof asset.url === 'string';
        };

        /** Register exactly the slots the current brand needs. */
        const syncBrandSlots = () => {
          const prefs = store.get();
          const brand = currentBrand();
          const custom = hasBrandAsset();
          const wantsSidebarMark = brand.sidebarMark === 'none' || (brand.sidebarMark === 'custom' && custom);
          const wantsHeroMark = brand.heroMark === 'none' || (brand.heroMark === 'custom' && custom);
          // The name occupant stays registered while the brand is on: an empty
          // text must hide the stock wordmark, not bring it back.
          const signature = prefs.enabled === true && brand.on === true
            ? (wantsSidebarMark ? 'mark' : '-') + '|name|' + (wantsHeroMark ? 'hero' : '-')
            : 'off';
          if (signature === brandSignature) return;
          brandSignature = signature;
          clearBrandSlots();
          if (signature === 'off') return;
          if (wantsSidebarMark) {
            brandSlots.push(ctx.slots.inject('sidebar.brand.mark', () => ctx.slots.register({
              name: 'sidebar.brand.mark',
              priority: -100,
            }, SidebarBrandMark)));
          }
          brandSlots.push(ctx.slots.inject('sidebar.brand.name', () => ctx.slots.register({
            name: 'sidebar.brand.name',
            priority: -100,
          }, SidebarBrandName)));
          if (wantsHeroMark) {
            brandSlots.push(ctx.slots.inject('conversation.hero.brand.mark', () => ctx.slots.register({
              name: 'conversation.hero.brand.mark',
              priority: -100,
            }, HeroBrandMark)));
          }
        };

        /** Selector of the home headline group owned by ui-conversation. */
        const HERO_GROUP = '[class*="_titleGroup"]';

        /** Attribute holding the headline text the host rendered. */
        const ORIGINAL_TEXT = 'data-retro-original-text';

        /** Root custom properties the brand CSS reads. */
        const applyBrandFont = (active, brand) => {
          const root = document.documentElement;
          if (!active) {
            root.style.removeProperty('--retro-brand-font');
            root.style.removeProperty('--retro-brand-scale');
            return;
          }
          const font = fontOf(brand.font);
          root.style.setProperty('--retro-brand-font', font.stack);
          root.style.setProperty('--retro-brand-scale', String(font.scale));
        };

        /** Patch (or restore) the home headline in place. */
        const applyHeroBrand = () => {
          heroFrame = 0;
          const brand = currentBrand();
          const active = brandActive();
          applyBrandFont(active, brand);
          const group = document.querySelector(HERO_GROUP);
          const title = group === null ? null : group.querySelector(':scope > span:first-child');
          if (group === null || title === null) return;
          if (!active) {
            group.removeAttribute('data-retro-hide-text');
            group.removeAttribute('data-retro-hide-badge');
            title.removeAttribute('data-retro-brand-text');
            const stored = title.getAttribute(ORIGINAL_TEXT);
            if (stored !== null) {
              if ((title.textContent || '') !== stored) title.textContent = stored;
              title.removeAttribute(ORIGINAL_TEXT);
            }
            lastHeroText = null;
            return;
          }
          group.toggleAttribute('data-retro-hide-text', brand.heroText === '');
          group.toggleAttribute('data-retro-hide-badge', brand.badge !== true);
          title.setAttribute('data-retro-brand-text', '');
          const current = title.textContent || '';
          const stored = title.getAttribute(ORIGINAL_TEXT);
          if (stored === null) {
            title.setAttribute(ORIGINAL_TEXT, current);
          } else if (current !== stored && current !== lastHeroText) {
            // React re-rendered fresh copy (a locale switch or a remount):
            // adopt it as the original before writing the custom text.
            title.setAttribute(ORIGINAL_TEXT, current);
          }
          // An empty custom text hides the headline through CSS while the DOM
          // keeps the host copy, so switching the brand off restores it.
          const target = brand.heroText === '' ? (title.getAttribute(ORIGINAL_TEXT) || '') : brand.heroText;
          if ((title.textContent || '') !== target) title.textContent = target;
          lastHeroText = target;
        };

        /** Coalesce headline patches into one animation frame. */
        const scheduleHeroBrand = () => {
          if (heroFrame !== 0) return;
          heroFrame = requestAnimationFrame(applyHeroBrand);
        };

        /** Reconcile slots and the headline after any preference change. */
        const refreshBrand = () => {
          syncBrandSlots();
          scheduleHeroBrand();
        };

        /**
         * Store a text/brand edit locally, then publish it (debounced for typing).
         * @param {object} patch Brand fields to change.
         * @param {boolean} [immediate] Publish without waiting for the debounce.
         * @returns {void}
         */
        const updateBrand = (patch, immediate) => {
          userChanged = true;
          const prefs = store.get();
          store.set({ ...prefs, brand: { ...currentBrand(), ...patch }, error: false });
          applyLayer();
          refreshBrand();
          if (commitTimer !== 0) clearTimeout(commitTimer);
          if (immediate) {
            commitTimer = 0;
            commit({});
            return;
          }
          commitTimer = setTimeout(() => {
            commitTimer = 0;
            commit({});
          }, 450);
        };

        const commit = (patch) => {
          userChanged = true;
          const next = { ...store.get(), ...patch, error: false };
          store.set(next);
          applyLayer();
          refreshBrand();
          const sequence = ++writeSequence;
          void requestPreferences('POST', pickPublic(next)).then((saved) => {
            if (sequence !== writeSequence) return;
            store.set({ ...normalizePreferences(saved), ready: true, error: false });
            applyLayer();
            refreshBrand();
          }).catch((error) => {
            if (sequence !== writeSequence) return;
            const message = error instanceof Error ? error.message : String(error);
            ctx.logger?.warn?.('retro-ai-os: cannot persist preferences: ' + message);
            store.set({ ...store.get(), error: true });
          });
        };

        /**
         * Install the plugin stylesheet once, and watch the home headline so a
         * late mount or a locale switch is patched again.
         */
        ctx.effect(() => {
          const style = document.createElement('style');
          style.dataset.retroAiOs = ID;
          style.textContent = CSS;
          document.head.appendChild(style);
          const observer = new MutationObserver(scheduleHeroBrand);
          observer.observe(document.body, { childList: true, subtree: true, characterData: true });
          refreshBrand();
          return () => {
            observer.disconnect();
            if (heroFrame !== 0) cancelAnimationFrame(heroFrame);
            heroFrame = 0;
            if (commitTimer !== 0) clearTimeout(commitTimer);
            commitTimer = 0;
            clearBrandSlots();
            brandSignature = '';
            lastHeroText = null;
            const group = document.querySelector(HERO_GROUP);
            const title = group === null ? null : group.querySelector(':scope > span:first-child');
            if (group !== null) {
              group.removeAttribute('data-retro-hide-text');
              group.removeAttribute('data-retro-hide-badge');
            }
            if (title !== null) {
              title.removeAttribute('data-retro-brand-text');
              const stored = title.getAttribute(ORIGINAL_TEXT);
              if (stored !== null) {
                title.textContent = stored;
                title.removeAttribute(ORIGINAL_TEXT);
              }
            }
            applyBrandFont(false, currentBrand());
            style.remove();
          };
        }, 'retro-ai-os brand style');

        ctx.effect(() => {
          let active = true;
          requestPreferences('GET').then((saved) => {
            if (!active || userChanged) return;
            store.set({ ...normalizePreferences(saved), ready: true, error: false });
            applyLayer();
            refreshBrand();
          }).catch((error) => {
            if (!active || userChanged) return;
            const message = error instanceof Error ? error.message : String(error);
            ctx.logger?.warn?.('retro-ai-os: cannot load preferences: ' + message);
            store.set({ ...store.get(), ready: false, error: true });
          });
          return () => {
            active = false;
            document.documentElement.removeAttribute('data-retro-matrix');
            if (layer !== null) {
              layer();
              layer = null;
            }
          };
        }, 'retro-ai-os preferences');

        /** Primitives module (whale mark). Optional: the plugin still works without it. */
        let brandPrimitives = null;
        try {
          brandPrimitives = require('@deepseek-ai/dsh-client-ui-primitives');
        } catch {
          brandPrimitives = null;
        }

        /** The stock DeepSeek whale, or a small stand-in when primitives are absent. */
        function BrandGlyph({ size }) {
          if (brandPrimitives && typeof brandPrimitives.FishLogo === 'function') {
            return h(brandPrimitives.FishLogo, { size });
          }
          return h('svg', {
            width: size, height: size, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true,
          }, h('path', { d: 'M2 12c3.4-4.4 7.6-6.2 11.6-5.2l4-2.8 1.9 4.2-1.9 3 1.9 3-1.9 4.2-4-2.8C9.6 18.2 5.4 16.4 2 12Z' }));
        }

        /** Sidebar mark occupant: a custom logo, or nothing when the user chose so. */
        function SidebarBrandMark({ size }) {
          const prefs = usePrefs(store);
          const brand = prefs.brand || defaultBrand();
          if (!prefs.enabled || !brand.on) return null;
          if (brand.sidebarMark !== 'custom' || !brand.asset) return null;
          const edge = Math.round(size * scaleOf(brand.markScale));
          return h('img', {
            className: 'retro-brand-logo',
            src: brand.asset.url,
            width: edge,
            height: edge,
            style: { width: edge + 'px', height: edge + 'px', maxWidth: 'none' },
            alt: '',
            'aria-hidden': true,
            draggable: false,
          });
        }

        /** Sidebar name occupant: the custom text in the chosen typeface. */
        function SidebarBrandName() {
          const prefs = usePrefs(store);
          const brand = prefs.brand || defaultBrand();
          if (!prefs.enabled || !brand.on || brand.sidebarText === '') return null;
          const font = fontOf(brand.font);
          return h('span', {
            className: 'retro-brand-name',
            style: { fontFamily: font.stack, fontSize: (SIDEBAR_BRAND_SIZE * font.scale).toFixed(1) + 'px' },
          }, brand.sidebarText);
        }

        /** Home mark occupant: a custom logo, or nothing when the user chose so. */
        function HeroBrandMark(props) {
          const prefs = usePrefs(store);
          const brand = prefs.brand || defaultBrand();
          if (!prefs.enabled || !brand.on) return null;
          if (brand.heroMark !== 'custom' || !brand.asset) return null;
          const edge = Math.round(props.size * scaleOf(brand.markScale));
          return h('img', {
            className: 'retro-brand-logo' + (props.className ? ' ' + props.className : ''),
            src: brand.asset.url,
            width: edge,
            height: edge,
            style: { width: edge + 'px', height: edge + 'px', maxWidth: 'none' },
            alt: '',
            'aria-hidden': true,
            draggable: false,
          });
        }

        /**
         * Read one file as a data URL.
         * @param {File} file Browser file handle.
         * @returns {Promise<string>} The data URL.
         */
        function readDataUrl(file) {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.onerror = () => reject(reader.error || new Error('read-failed'));
            reader.readAsDataURL(file);
          });
        }

        /**
         * Upload one logo to the Host.
         * @param {File} file Browser file handle.
         * @returns {Promise<{ url: string, label: string }>} The stored reference.
         */
        async function uploadBrandAsset(file) {
          if (!file || typeof file.type !== 'string' || file.type.slice(0, 6) !== 'image/') throw new Error('invalid-asset');
          if (typeof file.size === 'number' && file.size > 400 * 1024) throw new Error('asset-too-large');
          const dataUrl = await readDataUrl(file);
          const response = await fetch(ENDPOINT + '/brand-asset', {
            method: 'POST',
            cache: 'no-store',
            headers: { [HEADER]: '1', 'content-type': 'application/json' },
            body: JSON.stringify({ dataUrl, name: file.name }),
          });
          const payload = await response.json().catch(() => null);
          if (!response.ok || payload?.ok !== true) {
            throw new Error(typeof payload?.error === 'string' ? payload.error : 'asset-upload-failed');
          }
          return payload.data;
        }

        /** Delete the uploaded logo from the Host. */
        async function removeBrandAsset() {
          try {
            await fetch(ENDPOINT + '/brand-asset', {
              method: 'DELETE',
              cache: 'no-store',
              headers: { [HEADER]: '1' },
            });
          } catch {
            // The local reference is dropped anyway; a stale file is harmless.
          }
          const brand = currentBrand();
          updateBrand({
            asset: null,
            sidebarMark: brand.sidebarMark === 'custom' ? 'default' : brand.sidebarMark,
            heroMark: brand.heroMark === 'custom' ? 'default' : brand.heroMark,
          }, true);
        }

        /** Three-way logo selector shared by both surfaces. */
        function BrandSegmented({ label, value, onChange }) {
          return h('div', { className: 'retro-segmented', role: 'radiogroup', 'aria-label': label },
            BRAND_MARKS.map((mark) => h('button', {
              key: mark,
              type: 'button',
              role: 'radio',
              'aria-checked': value === mark,
              className: 'retro-segment',
              onClick: () => onChange(mark),
            }, t('brand.mark.' + mark))));
        }

        /** Upload / replace / remove the shared logo image. */
        function BrandAssetRow({ brand }) {
          const [busy, setBusy] = React.useState(false);
          const [failed, setFailed] = React.useState(false);
          const input = React.useRef(null);
          const asset = brand.asset;
          const choose = () => {
            if (input.current) input.current.click();
          };
          const accept = (file) => {
            if (!file || busy) return;
            setBusy(true);
            setFailed(false);
            void uploadBrandAsset(file).then((stored) => {
              const current = currentBrand();
              updateBrand({
                asset: stored,
                sidebarMark: current.sidebarMark === 'default' ? 'custom' : current.sidebarMark,
                heroMark: current.heroMark === 'default' ? 'custom' : current.heroMark,
              }, true);
            }).catch((error) => {
              ctx.logger?.warn?.('retro-ai-os: cannot upload the brand logo: ' + (error instanceof Error ? error.message : String(error)));
              setFailed(true);
            }).finally(() => {
              setBusy(false);
              if (input.current) input.current.value = '';
            });
          };
          return h('div', { className: 'retro-asset-row' },
            h('div', { className: 'retro-asset-thumb' },
              asset
                ? h('img', { src: asset.url, alt: '', 'aria-hidden': true, draggable: false })
                : h('span', null, 'LOGO')),
            h('div', { className: 'retro-asset-copy' },
              h('span', { className: 'retro-asset-title' }, t('brand.asset.title')),
              h('span', { className: 'retro-asset-label' }, failed
                ? t('brand.asset.error')
                : busy
                  ? t('brand.asset.uploading')
                  : asset && asset.label
                    ? asset.label
                    : t('brand.asset.empty')),
              h('span', { className: 'retro-field-hint' }, t('brand.asset.hint'))),
            h('div', { className: 'retro-asset-actions' },
              h('input', {
                ref: input,
                type: 'file',
                className: 'retro-file',
                accept: 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml',
                'aria-label': t('brand.asset.upload'),
                onChange: (event) => accept(event.target.files && event.target.files[0]),
              }),
              h('button', { type: 'button', className: 'retro-button', onClick: choose, disabled: busy },
                asset ? t('brand.asset.replace') : t('brand.asset.upload')),
              asset
                ? h('button', { type: 'button', className: 'retro-button danger', onClick: () => { void removeBrandAsset(); }, disabled: busy },
                  t('brand.asset.remove'))
                : null));
        }

        /** Live preview of both brand surfaces. */
        function BrandPreview({ brand }) {
          const font = fontOf(brand.font);
          const custom = brand.asset !== null && typeof brand.asset === 'object';
          const scale = scaleOf(brand.markScale);
          const sidebarEdge = Math.round(24 * scale);
          const heroEdge = Math.round(26 * scale);
          return h('div', { className: 'retro-brand-preview', 'aria-label': t('brand.preview') },
            h('div', { className: 'retro-brand-preview-row' },
              h('span', { className: 'retro-brand-preview-tag' }, t('brand.preview.sidebar')),
              brand.sidebarMark === 'none'
                ? null
                : brand.sidebarMark === 'custom' && custom
                  ? h('img', { className: 'retro-brand-logo', src: brand.asset.url, width: sidebarEdge, height: sidebarEdge, alt: '' })
                  : h(BrandGlyph, { size: 24 }),
              brand.sidebarText === ''
                ? null
                : h('span', {
                  className: 'retro-brand-preview-name',
                  style: { fontFamily: font.stack, fontSize: (SIDEBAR_BRAND_SIZE * font.scale).toFixed(1) + 'px' },
                }, brand.sidebarText)),
            h('div', { className: 'retro-brand-preview-row' },
              h('span', { className: 'retro-brand-preview-tag' }, t('brand.preview.hero')),
              brand.heroMark === 'none'
                ? null
                : brand.heroMark === 'custom' && custom
                  ? h('img', { className: 'retro-brand-logo', src: brand.asset.url, width: heroEdge, height: heroEdge, alt: '' })
                  : h(BrandGlyph, { size: 26 }),
              brand.heroText === ''
                ? null
                : h('span', {
                  className: 'retro-brand-preview-hero',
                  style: { fontFamily: font.stack, fontSize: (HERO_BRAND_SIZE * font.scale).toFixed(1) + 'px' },
                }, brand.heroText,
                brand.badge ? h('span', { className: 'retro-brand-preview-badge' }, t('brand.previewBadge')) : null)));
        }

        /** One labelled brand text input. */
        function BrandTextField({ label, value, placeholder, onText }) {
          return h('div', { className: 'retro-field' },
            h('input', {
              type: 'text',
              className: 'retro-input',
              value,
              maxLength: 48,
              placeholder,
              'aria-label': label,
              onChange: (event) => onText(event.target.value),
            }));
        }

        /** One brand surface: its text field, its logo selector and an extra row. */
        function BrandSurfaceField({ title, value, placeholder, mark, onText, onMark, extra }) {
          return h('div', { className: 'retro-field' },
            h('span', { className: 'retro-field-label' }, title),
            h(BrandTextField, { label: title + ' · ' + t('brand.text.label'), value, placeholder, onText }),
            h(BrandSegmented, { label: title + ' · ' + t('brand.mark.label'), value: mark, onChange: onMark }),
            extra || null);
        }

        /** Shared logo size slider (only the custom image is affected). */
        function BrandScale({ brand }) {
          const percent = Math.round(scaleOf(brand.markScale) * 100);
          return h('div', { className: 'retro-scale' },
            h('div', { className: 'retro-scale-head' },
              h('span', { className: 'retro-field-label' }, t('brand.size.label')),
              h('span', { className: 'retro-scale-value' }, percent + ' %')),
            h('input', {
              type: 'range',
              className: 'retro-range',
              min: Math.round(MARK_SCALE_MIN * 100),
              max: Math.round(MARK_SCALE_MAX * 100),
              step: 5,
              value: percent,
              disabled: !(brand.asset !== null && typeof brand.asset === 'object'),
              'aria-label': t('brand.size.label'),
              'aria-valuetext': percent + ' %',
              onChange: (event) => updateBrand({ markScale: Number(event.target.value) / 100 }),
            }),
            h('p', { className: 'retro-field-hint' }, t('brand.size.hint')));
        }

        /** Settings card: enable the custom brand and edit every surface. */
        function BrandCard({ prefs }) {
          const brand = prefs.brand || defaultBrand();
          const toggle = () => {
            const current = currentBrand();
            const next = !current.on;
            updateBrand({
              on: next,
              seeded: true,
              sidebarText: next && current.seeded !== true ? 'deepseek' : current.sidebarText,
              heroText: next && current.seeded !== true ? t('brand.heroDefault') : current.heroText,
            }, true);
          };
          const reset = () => {
            updateBrand({
              on: true,
              seeded: true,
              sidebarText: 'deepseek',
              heroText: t('brand.heroDefault'),
              sidebarMark: 'default',
              heroMark: 'default',
              font: 'system',
              badge: true,
            }, true);
          };
          const sidebarField = h(BrandSurfaceField, {
            title: t('brand.sidebar.title'),
            value: brand.sidebarText,
            placeholder: 'deepseek',
            mark: brand.sidebarMark,
            onText: (text) => updateBrand({ sidebarText: text }),
            onMark: (mark) => updateBrand({ sidebarMark: mark }, true),
            extra: h('p', { className: 'retro-field-hint' }, t('brand.text.hint')),
          });
          const badgeSwitch = h('div', { className: 'retro-inline-switch' },
            h('span', null, t('brand.badge.label')),
            h('button', {
              type: 'button',
              role: 'switch',
              'aria-checked': brand.badge,
              'aria-label': t('brand.badge.label'),
              className: 'retro-switch',
              onClick: () => updateBrand({ badge: !brand.badge }, true),
            }));
          const heroField = h(BrandSurfaceField, {
            title: t('brand.hero.title'),
            value: brand.heroText,
            placeholder: t('brand.heroDefault'),
            mark: brand.heroMark,
            onText: (text) => updateBrand({ heroText: text }),
            onMark: (mark) => updateBrand({ heroMark: mark }, true),
            extra: badgeSwitch,
          });
          const fonts = h('div', { className: 'retro-fonts', role: 'radiogroup', 'aria-label': t('brand.font.title') },
            BRAND_FONTS.map((option) => h('label', {
              key: option.id,
              className: 'retro-font' + (option.id === brand.font ? ' selected' : ''),
            },
              h('input', {
                type: 'radio',
                name: 'retro-ai-os-brand-font',
                value: option.id,
                checked: option.id === brand.font,
                onChange: () => updateBrand({ font: option.id }, true),
              }),
              h('span', { className: 'retro-font-sample', style: { fontFamily: option.stack } }, 'Aa'),
              h('span', { className: 'retro-font-name', style: { fontFamily: option.stack } }, t(option.labelKey)))));
          const editor = h(React.Fragment, null,
            prefs.enabled ? null : h('p', { className: 'retro-field-hint', style: { paddingTop: '10px' } }, t('brand.requiresTheme')),
            h('div', { className: 'retro-brand-grid' }, sidebarField, heroField),
            h(BrandAssetRow, { brand }),
            h(BrandScale, { brand }),
            h('div', { className: 'retro-preview-label' }, t('brand.font.title')),
            fonts,
            h('div', { className: 'retro-preview-label' }, t('brand.preview')),
            h(BrandPreview, { brand }),
            h('div', { className: 'retro-brand-preview-row', style: { marginTop: '12px', justifyContent: 'flex-end' } },
              h('button', { type: 'button', className: 'retro-button', onClick: reset }, t('brand.reset'))));
          return h('div', { className: 'retro-card' },
            h('div', { className: 'retro-card-head' }, h('span', null, t('brandCard'))),
            h('div', { className: 'retro-card-body' },
              h('div', { className: 'retro-row' },
                h('div', null,
                  h('div', { className: 'retro-row-title' }, t('brand.on.label')),
                  h('p', { className: 'retro-row-desc' }, t('brand.on.desc'))),
                h('button', {
                  type: 'button',
                  role: 'switch',
                  'aria-checked': brand.on,
                  'aria-label': t('brand.on.label'),
                  className: 'retro-switch',
                  onClick: toggle,
                })),
              brand.on ? editor : null));
        }



        function MatrixRain() {
          const prefs = usePrefs(store);
          if (!prefs.enabled || prefs.style !== 'matrix') return null;
          const glyphs = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ012345789';
          const columns = Array.from({ length: 112 }, (_, i) => {
            const length = 12 + (i * 7 % 17);
            const sequence = Array.from({ length }, (_, j) => glyphs[(i * 31 + j * 17 + j * j * 3) % glyphs.length]);
            return h('span', {
              key: i,
              className: 'retro-matrix-column',
              style: { left: ((i % 56) * 100 / 56) + '%', '--duration': (8 + (i * 7 % 13)) + 's', '--delay': (-((i * 11) % 23)) + 's', '--static-top': ((i * 37 % 125) - 25) + '%' },
            }, h('span', { className: 'retro-matrix-tail' }, sequence.slice(0, -1).join('')), h('span', { className: 'retro-matrix-head' }, sequence[length - 1]));
          });
          return h(React.Fragment, null,
            h('div', { className: 'retro-matrix-rain' + (prefs.animation ? '' : ' retro-static'), 'aria-hidden': true }, columns));
        }

        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay', id: 'retro-ai-os-matrix-rain', order: -100,
        }, MatrixRain));

        function Settings() {
          const prefs = usePrefs(store);
          const selected = STYLES.find((style) => style.id === prefs.style) || STYLES[0];
          return h('section', { className: 'retro-page', 'aria-labelledby': 'retro-heading' },
            h('header', { className: 'retro-hero' },
              h('span', { className: 'retro-eyebrow' }, t('eyebrow')),
              h('h2', { className: 'retro-title', id: 'retro-heading' }, t('title')),
              h('p', { className: 'retro-intro' }, t('intro'))),

            h('div', { className: 'retro-card' },
              h('div', { className: 'retro-card-head' }, h('span', null, t('styleCard'))),
              h('div', { className: 'retro-card-body' },
                h('div', { className: 'retro-preview-label' }, t('styleLabel')),
                h('div', { className: 'retro-styles', role: 'radiogroup', 'aria-label': t('styleLabel') },
                  STYLES.map((style) => h('label', { key: style.id, className: 'retro-style' + (style.id === prefs.style ? ' selected' : '') },
                    h('input', {
                      type: 'radio',
                      name: 'retro-ai-os-style',
                      value: style.id,
                      checked: style.id === prefs.style,
                      onChange: () => commit({ style: style.id, enabled: true }),
                    }),
                    h('span', { className: 'retro-style-body' },
                      h('span', { className: 'retro-swatches', 'aria-hidden': true },
                        style.swatches.map((color, index) => h('span', { key: index, className: 'retro-swatch', style: { background: color } }))),
                      h('span', { className: 'retro-style-name' }, t(style.nameKey)),
                      h('span', { className: 'retro-style-desc' }, t(style.descKey)),
                      h('span', { className: 'retro-style-check' }, '●'))))))),

            h('div', { className: 'retro-card' },
              h('div', { className: 'retro-card-head' }, h('span', null, t('behaviorCard'))),
              h('div', { className: 'retro-card-body' },
                h('div', { className: 'retro-row' },
                  h('div', null, h('div', { className: 'retro-row-title' }, t('toggle.label')), h('p', { className: 'retro-row-desc' }, t('toggle.desc'))),
                  h('button', {
                    type: 'button',
                    role: 'switch',
                    'aria-checked': prefs.enabled,
                    'aria-label': t('toggle.label'),
                    className: 'retro-switch',
                    onClick: () => commit({ enabled: !prefs.enabled }),
                  })),
                h('div', { className: 'retro-row' },
                  h('div', null, h('div', { className: 'retro-row-title' }, t('mascot.label')), h('p', { className: 'retro-row-desc' }, t('mascot.desc'))),
                  h('button', {
                    type: 'button',
                    role: 'switch',
                    'aria-checked': prefs.mascot,
                    'aria-label': t('mascot.label'),
                    className: 'retro-switch',
                    onClick: () => commit({ mascot: !prefs.mascot }),
                  })),
                h('div', { className: 'retro-row' },
                  h('div', null, h('div', { className: 'retro-row-title' }, t('animation.label')), h('p', { className: 'retro-row-desc' }, t('animation.desc'))),
                  h('button', {
                    type: 'button',
                    role: 'switch',
                    'aria-checked': prefs.animation,
                    'aria-label': t('animation.label'),
                    className: 'retro-switch',
                    onClick: () => commit({ animation: !prefs.animation }),
                  })))),

            h('div', { className: 'retro-card' },
              h('div', { className: 'retro-card-head' }, h('span', null, t('companionCard'))),
              h('div', { className: 'retro-card-body' },
                h('div', { className: 'retro-row-title' }, t('companion.title')),
                h('p', { className: 'retro-row-desc' }, t('companion.desc')),
                h('div', { className: 'retro-preview-label' }, t('preview')),
                h(StatusBar, { state: 'idle', style: selected, animate: prefs.animation, t }),
                h('div', { className: 'retro-legend' },
                  h('div', { className: 'retro-legend-item' }, h(Mascot, { state: 'working', size: 32, style: selected, animate: prefs.animation }), h('strong', null, t('state.working'))),
                  h('div', { className: 'retro-legend-item' }, h(Mascot, { state: 'waiting', size: 32, style: selected, animate: prefs.animation }), h('strong', null, t('state.waiting'))),
                  h('div', { className: 'retro-legend-item' }, h(Mascot, { state: 'done', size: 32, style: selected, animate: prefs.animation }), h('strong', null, t('state.done')))))),

            h(BrandCard, { prefs }),

            h('p', { className: 'retro-status-line' + (prefs.error ? ' error' : '') },
              h('span', null, prefs.error ? t('saveError') : prefs.ready ? t('saved') : t('loading'))),
            h('p', { className: 'retro-intro', style: { marginTop: '10px', fontSize: '11px' } }, t('footer')));
        }

        function Dock(props) {
          const prefs = usePrefs(store);
          const state = useCompanionState(props);
          if (!prefs.enabled || !prefs.mascot) return null;
          const style = STYLES.find((candidate) => candidate.id === prefs.style) || STYLES[0];
          return h('div', { className: 'retro-dock' },
            h(StatusBar, { state, style, animate: prefs.animation, t }));
        }

        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: ID,
          label: () => t('title'),
          order: 12,
        }, Settings));

        ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
          name: 'settings.section.icon',
          id: ID,
        }, ({ size }) => h('svg', {
          viewBox: '0 0 24 24',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          'aria-hidden': true,
        },
          h('rect', { x: 3, y: 4, width: 18, height: 13, rx: 1 }),
          h('path', { d: 'M8 20h8M12 17v3M7 8h2v2H7zm8 0h2v2h-2zM9 12h6' }))));

        ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
          name: 'conversation.composer.dock',
          id: ID,
          order: 5,
        }, Dock));
      },
    };
  },
});
