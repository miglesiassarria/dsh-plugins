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
        light: ['#e6e8d8', '#f4f2df', '#d6deca', '#fffced', '#a1ad9c', '#586b69', '#006d68', '#152d35', '#435b5c', '#9f2935', '#586b69', '#226d3d', '#8a5300', '#c9d8c8'],
        dark: ['#0e1a17', '#14241f', '#1b3029', '#182a24', '#2e4a40', '#4e7064', '#5bd9be', '#ddf3e8', '#a7c6b8', '#f07a86', '#6e8f82', '#62d394', '#e3a34a', '#10211c'],
      },
      {
        id: 'amber',
        nameKey: 'style.amber',
        descKey: 'style.amber.desc',
        artwork: { shell: '#3a2a12', screen: '#f3cd86', bulb: '#e8a33d' },
        swatches: ['#f3e6c8', '#9a5b00', '#4a6b1e', '#2e2108'],
        light: ['#f3e6c8', '#fbf1d9', '#e8d6ae', '#fff7e2', '#c3a66e', '#7a5a1e', '#9a5b00', '#2e2108', '#5e4a22', '#a62b2b', '#8a6a32', '#4a6b1e', '#8a5300', '#ead8b2'],
        dark: ['#140f06', '#20180a', '#2c210d', '#241a0b', '#4c3a16', '#8a6a2a', '#e8a33d', '#f6e3b0', '#c7a96b', '#f07a7a', '#8c7440', '#b6d46a', '#e8a33d', '#1a1308'],
      },
      {
        id: 'vapor',
        nameKey: 'style.vapor',
        descKey: 'style.vapor.desc',
        artwork: { shell: '#3a2158', screen: '#f4c6ff', bulb: '#ff6bd6' },
        swatches: ['#f1e6f7', '#a2268f', '#2e7d6b', '#2a1338'],
        light: ['#f1e6f7', '#fbf4ff', '#e4d1f0', '#fff7ff', '#b79bd6', '#6b4a9e', '#a2268f', '#2a1338', '#5a3c6e', '#b3264a', '#8a6aa6', '#2e7d6b', '#9a5b00', '#e4d1f0'],
        dark: ['#150c24', '#211436', '#2e1c4c', '#241540', '#523573', '#8f63c4', '#ff6bd6', '#f0e2ff', '#bfa3de', '#ff7a94', '#7e5fa0', '#59e0c4', '#ffc15e', '#1a0f2b'],
      },
      {
        id: 'cobalt',
        nameKey: 'style.cobalt',
        descKey: 'style.cobalt.desc',
        artwork: { shell: '#123047', screen: '#bfe9ff', bulb: '#4fc3f7' },
        swatches: ['#e4eef6', '#0b5e8a', '#1f6b4a', '#0e2230'],
        light: ['#e4eef6', '#f2f8fc', '#cfe0ec', '#f7fbff', '#9fb6c6', '#4a6478', '#0b5e8a', '#0e2230', '#3e5a6c', '#a6293a', '#6a8394', '#1f6b4a', '#8a5300', '#d3e2ec'],
        dark: ['#08131c', '#0e1f2c', '#142b3c', '#102432', '#234356', '#3e6780', '#4fc3f7', '#ddf0fa', '#9dbccf', '#ff7d8a', '#6a8fa3', '#5ee0a0', '#ffc15e', '#0a1822'],
      },
    ];

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
        behaviorCard: '02 / BEHAVIOR',
        'toggle.label': 'Enable Retro AI OS',
        'toggle.desc': 'Applies the selected style to the interface. Switching it off restores the host appearance exactly.',
        'mascot.label': 'Show the companion',
        'mascot.desc': 'A pixel companion under the composer that follows the real session state.',
        'animation.label': 'Discreet animations',
        'animation.desc': 'Blinking antenna and scanline cues. Your system reduced-motion setting wins.',
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
        behaviorCard: '02 / COMPORTAMIENTO',
        'toggle.label': 'Activar Retro AI OS',
        'toggle.desc': 'Aplica el estilo elegido a la interfaz. Al desactivarlo reaparece exactamente el aspecto original.',
        'mascot.label': 'Mostrar el compañero',
        'mascot.desc': 'Una mascota pixelada bajo el cuadro de mensaje que sigue el estado real de la sesión.',
        'animation.label': 'Animaciones discretas',
        'animation.desc': 'Antena y línea de barrido. La preferencia de movimiento reducido del sistema tiene prioridad.',
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
        behaviorCard: '02 / 行为',
        'toggle.label': '启用 Retro AI OS',
        'toggle.desc': '将所选风格应用到界面。关闭后恢复原始外观。',
        'mascot.label': '显示伙伴',
        'mascot.desc': '输入框下方的像素伙伴，跟随真实会话状态。',
        'animation.label': '轻微动画',
        'animation.desc': '天线闪烁与扫描线；系统“减少动态效果”优先。',
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
      return { enabled: prefs.enabled, style: prefs.style, mascot: prefs.mascot, animation: prefs.animation };
    }

    function normalizePreferences(input) {
      return {
        enabled: input?.enabled === true,
        style: STYLES.some((style) => style.id === input?.style) ? input.style : 'classic',
        mascot: input?.mascot !== false,
        animation: input?.animation !== false,
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
        const store = createStore({ enabled: false, style: 'classic', mascot: true, animation: true, ready: false, error: false });
        let layer = null;
        let writeSequence = 0;
        let userChanged = false;

        const applyLayer = () => {
          if (layer !== null) {
            layer();
            layer = null;
          }
          const prefs = store.get();
          if (!prefs.enabled) return;
          const style = STYLES.find((candidate) => candidate.id === prefs.style) || STYLES[0];
          layer = ctx.theme.overrideTokens(SOURCE, tokensOf(style));
        };

        const commit = (patch) => {
          userChanged = true;
          const next = { ...store.get(), ...patch, error: false };
          store.set(next);
          applyLayer();
          const sequence = ++writeSequence;
          void requestPreferences('POST', pickPublic(next)).then((saved) => {
            if (sequence !== writeSequence) return;
            store.set({ ...normalizePreferences(saved), ready: true, error: false });
            applyLayer();
          }).catch((error) => {
            if (sequence !== writeSequence) return;
            ctx.logger?.warn?.(`retro-ai-os: cannot persist preferences: ${error instanceof Error ? error.message : String(error)}`);
            store.set({ ...store.get(), error: true });
          });
        };

        ctx.effect(() => {
          let active = true;
          requestPreferences('GET').then((saved) => {
            if (!active || userChanged) return;
            store.set({ ...normalizePreferences(saved), ready: true, error: false });
            applyLayer();
          }).catch((error) => {
            if (!active || userChanged) return;
            ctx.logger?.warn?.(`retro-ai-os: cannot load preferences: ${error instanceof Error ? error.message : String(error)}`);
            store.set({ ...store.get(), ready: false, error: true });
          });
          return () => {
            active = false;
            if (layer !== null) {
              layer();
              layer = null;
            }
          };
        }, 'retro-ai-os preferences');

        function Settings() {
          const prefs = usePrefs(store);
          const selected = STYLES.find((style) => style.id === prefs.style) || STYLES[0];
          return h('section', { className: 'retro-page', 'aria-labelledby': 'retro-heading' },
            h('style', null, CSS),
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
            h('style', null, CSS),
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
