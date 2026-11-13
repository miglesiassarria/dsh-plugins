window.__ModuleLoader__.load({
  id: '@local/groq-dictation',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const ID = 'groq-dictation';
    const NS = 'groq-dictation';
    const ENDPOINT = '/dsh-groq-dictation';
    const HEADER = 'x-dsh-groq-dictation';
    const DEFAULT_MODEL = 'whisper-large-v3-turbo';
    const MODELS = ['whisper-large-v3-turbo', 'whisper-large-v3', 'distil-whisper-large-v3-en'];
    const MAX_RECORDING_SECONDS = 600;

    const STRINGS = {
      en: {
        settings: {
          title: 'Groq dictation',
          desc: 'Record with the microphone button in the composer and have Whisper write what you say. The key stays on this computer and is never sent to the browser.',
          configured: 'Key saved ···· {hint}',
          loading: 'Loading…',
          loadError: 'The dictation settings could not be read.',
          apiKeyLabel: 'Groq API key',
          apiKeyPlaceholder: 'gsk_…',
          apiKeyPlaceholderSaved: 'Enter a new key to replace the saved one',
          modelLabel: 'Whisper model',
          save: 'Save',
          saving: 'Saving…',
          clear: 'Delete key',
          saved: 'Saved.',
          clearDone: 'Key deleted.',
          needKey: 'Enter a key to turn dictation on.',
          privacy: 'Audio is sent to Groq only when you stop recording.',
          secureContextHint: 'On a phone, open the GUI over HTTPS (the tunnel link): Safari and Chrome block the microphone on plain HTTP.',
          hostMicLabel: 'Computer microphone',
          hostMicDesc: 'When the browser cannot record (Safari on a phone over HTTP), dictation records with this computer\'s microphone. Useful when you are near it.',
          hostMicOn: 'Allowed as a fallback',
          hostMicOff: 'Never use it',
          hostMicAvailable: 'Available: {device}',
          hostMicUnavailable: 'No microphone this computer can record from.',
        },
        model: {
          'whisper-large-v3-turbo': 'Whisper Large v3 Turbo · fastest',
          'whisper-large-v3': 'Whisper Large v3 · most accurate',
          'distil-whisper-large-v3-en': 'Distil Whisper Large v3 · English only',
        },
        mic: {
          idle: 'Dictate with Groq',
          idleHost: 'Dictate with the computer microphone',
          recording: 'Stop dictation (Enter)',
          recordingHost: 'Stop dictation (computer microphone)',
          requesting: 'Asking for microphone permission…',
          startingHost: 'Opening the computer microphone…',
          transcribing: 'Transcribing…',
          notConfigured: 'Add your Groq API key in Settings → General to use dictation.',
          recordingAria: 'Recording, {time}. Press Enter to finish.',
          recordingAriaHost: 'Recording with the computer microphone, {time}. Press Enter to finish.',
          hostTag: 'computer',
        },
        error: {
          generic: 'The dictation request failed.',
          'missing-api-key': 'No Groq API key is configured.',
          'invalid-key': 'Groq rejected the API key. Check it in Settings → General.',
          'rate-limited': 'Groq is receiving too many requests. Try again in a moment.',
          'audio-too-large': 'The recording is too long for Groq.',
          'empty-transcript': 'No speech was detected in the recording.',
          'empty-audio': 'The recording is empty.',
          'unsupported-audio': 'This browser produced an audio format Groq does not accept.',
          'bad-request': 'Groq could not process the recording.',
          'upstream-error': 'Groq returned an unexpected error.',
          'network-error': 'Could not reach Groq.',
          timeout: 'Groq took too long to answer.',
          'invalid-api-key': 'That API key does not look valid.',
          'invalid-model': 'The selected Whisper model is not available.',
          'invalid-json': 'The settings request was not valid JSON.',
          'invalid-settings': 'The saved settings file is damaged.',
          'too-large': 'The request was too large.',
          'microphone-denied': 'Microphone access was denied. Allow it in the browser and try again.',
          'microphone-missing': 'No microphone was found.',
          'microphone-insecure': 'The microphone needs HTTPS. Open the app with the tunnel link, not the LAN address.',
          'microphone-unsupported': 'This browser does not expose a microphone to the page.',
          'microphone-busy': 'The microphone is in use by another app or call. Close it and try again.',
          'microphone-failed': 'The microphone could not be opened.',
          'host-mic-unavailable': 'This computer has no microphone dictation can use.',
          'host-mic-disabled': 'The computer microphone is turned off in Settings → General.',
          'host-mic-busy': 'A recording is already running.',
          'host-mic-failed': 'The computer microphone could not be opened.',
          'not-recording': 'There was no recording to stop.',
          'recorder-unavailable': 'This browser cannot record audio.',
          'recording-failed': 'The recording failed. Try again.',
          'not-configured': 'Add your Groq API key in Settings → General to use dictation.',
        },
      },
      es: {
        settings: {
          title: 'Dictado con Groq',
          desc: 'Graba con el botón de micrófono del compositor y deja que Whisper escriba lo que dices. La clave se queda en este equipo y nunca se envía al navegador.',
          configured: 'Clave guardada ···· {hint}',
          loading: 'Cargando…',
          loadError: 'No se pudo leer la configuración del dictado.',
          apiKeyLabel: 'Clave API de Groq',
          apiKeyPlaceholder: 'gsk_…',
          apiKeyPlaceholderSaved: 'Escribe una clave nueva para sustituir la guardada',
          modelLabel: 'Modelo de Whisper',
          save: 'Guardar',
          saving: 'Guardando…',
          clear: 'Borrar clave',
          saved: 'Guardado.',
          clearDone: 'Clave borrada.',
          needKey: 'Introduce una clave para activar el dictado.',
          privacy: 'El audio solo se envía a Groq cuando detienes la grabación.',
          secureContextHint: 'En el móvil, abre la GUI por HTTPS (el enlace del túnel): Safari y Chrome bloquean el micrófono en HTTP.',
          hostMicLabel: 'Micrófono del ordenador',
          hostMicDesc: 'Cuando el navegador no puede grabar (Safari en el móvil por HTTP), el dictado graba con el micrófono de este ordenador. Útil si estás cerca de él.',
          hostMicOn: 'Permitido como alternativa',
          hostMicOff: 'No usarlo nunca',
          hostMicAvailable: 'Disponible: {device}',
          hostMicUnavailable: 'Este ordenador no tiene un micrófono que el dictado pueda usar.',
        },
        model: {
          'whisper-large-v3-turbo': 'Whisper Large v3 Turbo · el más rápido',
          'whisper-large-v3': 'Whisper Large v3 · el más preciso',
          'distil-whisper-large-v3-en': 'Distil Whisper Large v3 · solo inglés',
        },
        mic: {
          idle: 'Dictar con Groq',
          idleHost: 'Dictar con el micrófono del ordenador',
          recording: 'Detener dictado (Enter)',
          recordingHost: 'Detener dictado (micrófono del ordenador)',
          requesting: 'Pidiendo permiso al micrófono…',
          startingHost: 'Abriendo el micrófono del ordenador…',
          transcribing: 'Transcribiendo…',
          notConfigured: 'Añade tu clave API de Groq en Ajustes → General para usar el dictado.',
          recordingAria: 'Grabando, {time}. Pulsa Enter para terminar.',
          recordingAriaHost: 'Grabando con el micrófono del ordenador, {time}. Pulsa Enter para terminar.',
          hostTag: 'ordenador',
        },
        error: {
          generic: 'La petición de dictado falló.',
          'missing-api-key': 'No hay ninguna clave API de Groq configurada.',
          'invalid-key': 'Groq ha rechazado la clave API. Revísala en Ajustes → General.',
          'rate-limited': 'Groq está recibiendo demasiadas peticiones. Inténtalo en un momento.',
          'audio-too-large': 'La grabación es demasiado larga para Groq.',
          'empty-transcript': 'No se ha detectado voz en la grabación.',
          'empty-audio': 'La grabación está vacía.',
          'unsupported-audio': 'Este navegador ha generado un formato de audio que Groq no acepta.',
          'bad-request': 'Groq no pudo procesar la grabación.',
          'upstream-error': 'Groq devolvió un error inesperado.',
          'network-error': 'No se pudo conectar con Groq.',
          timeout: 'Groq ha tardado demasiado en responder.',
          'invalid-api-key': 'Esa clave API no parece válida.',
          'invalid-model': 'El modelo de Whisper seleccionado no está disponible.',
          'invalid-json': 'La petición de configuración no es JSON válido.',
          'invalid-settings': 'El archivo de configuración guardado está dañado.',
          'too-large': 'La petición era demasiado grande.',
          'microphone-denied': 'Se ha denegado el acceso al micrófono. Permítelo en el navegador y vuelve a intentarlo.',
          'microphone-missing': 'No se ha encontrado ningún micrófono.',
          'microphone-insecure': 'El micrófono necesita HTTPS. Abre la app con el enlace del túnel, no con la dirección de la red local.',
          'microphone-unsupported': 'Este navegador no expone ningún micrófono a la página.',
          'microphone-busy': 'El micrófono está ocupado por otra app o llamada. Ciérrala y vuelve a intentarlo.',
          'microphone-failed': 'No se pudo abrir el micrófono.',
          'host-mic-unavailable': 'Este ordenador no tiene un micrófono que el dictado pueda usar.',
          'host-mic-disabled': 'El micrófono del ordenador está desactivado en Ajustes → General.',
          'host-mic-busy': 'Ya hay una grabación en marcha.',
          'host-mic-failed': 'No se pudo abrir el micrófono del ordenador.',
          'not-recording': 'No había ninguna grabación que detener.',
          'recorder-unavailable': 'Este navegador no puede grabar audio.',
          'recording-failed': 'La grabación falló. Inténtalo de nuevo.',
          'not-configured': 'Añade tu clave API de Groq en Ajustes → General para usar el dictado.',
        },
      },
    };

    /**
     * The locale runtime indexes dictionaries by dotted key, so the readable
     * nested tree above is flattened once before registration. Registering it
     * as-is made every lookup fall back to the key itself.
     */
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
      .grd-row{display:flex;flex-direction:column;gap:10px;padding:16px 0;border-bottom:.5px solid var(--dsw-alias-border-l2);}
      .grd-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;}
      .grd-copy{display:flex;flex-direction:column;gap:3px;min-width:0;}
      .grd-title{font-size:14px;line-height:22px;color:var(--dsw-alias-label-primary);}
      .grd-desc{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);max-width:560px;}
      .grd-hint{margin:0;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);}
      .grd-hint-warn{color:var(--dsw-alias-state-error-primary);}
      .grd-badge{flex:none;font-size:11px;line-height:16px;color:var(--dsw-alias-state-success-primary);background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 12%,transparent);border-radius:999px;padding:3px 8px;white-space:nowrap;}
      .grd-fields{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;}
      .grd-field{display:flex;flex-direction:column;gap:4px;min-width:0;}
      .grd-field-key{flex:1 1 260px;}
      .grd-label{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);}
      .grd-input,.grd-select{box-sizing:border-box;height:34px;border:.5px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;padding:0 10px;min-width:0;}
      .grd-select{min-width:220px;}
      .grd-input:focus-visible,.grd-select:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}
      .grd-check{display:inline-flex;align-items:center;gap:8px;height:34px;font-size:12px;color:var(--dsw-alias-label-primary);cursor:pointer;}
      .grd-check input{width:15px;height:15px;margin:0;accent-color:var(--dsw-alias-brand-primary);}
      .grd-field-check{flex:0 1 260px;}
      .grd-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px;}
      .grd-btn{height:32px;padding:0 12px;border-radius:9px;border:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer;}
      .grd-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);}
      .grd-btn:disabled{opacity:.55;cursor:default;}
      .grd-btn-primary{border-color:transparent;background:var(--dsw-alias-brand-primary);color:#fff;}
      .grd-btn-primary:hover:not(:disabled){filter:brightness(1.05);}
      .grd-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
      .grd-status{font-size:11px;line-height:16px;}
      .grd-status-ok{color:var(--dsw-alias-state-success-primary);}
      .grd-status-error{color:var(--dsw-alias-state-error-primary);}
      .grd-mic-wrap{position:relative;display:inline-flex;align-items:center;gap:6px;min-width:0;max-width:280px;}
      .grd-mic{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:0;border-radius:999px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;flex:none;}
      .grd-mic:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);}
      .grd-mic:disabled{cursor:default;opacity:.7;}
      .grd-mic:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
      .grd-mic.is-recording{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 16%,transparent);color:var(--dsw-alias-state-error-primary);}
      .grd-stop-icon{display:block;width:9px;height:9px;border-radius:2px;background:currentColor;}
      .grd-rec-time{font-size:11px;line-height:1;font-variant-numeric:tabular-nums;color:var(--dsw-alias-state-error-primary);white-space:nowrap;}
      .grd-mic-tag{font-size:10px;line-height:1;padding:3px 6px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);white-space:nowrap;}
      .grd-spin{display:block;width:14px;height:14px;border-radius:50%;border:2px solid currentColor;border-top-color:transparent;animation:grd-spin .8s linear infinite;}
      .grd-mic-notice{font-size:11px;line-height:1.3;color:var(--dsw-alias-state-error-primary);max-width:240px;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;}
      .grd-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;}
      @keyframes grd-spin{to{transform:rotate(360deg);}}
      @media (prefers-reduced-motion:reduce){.grd-spin{animation:none;}}
      @media (max-width:767px){.grd-head{flex-direction:column;align-items:flex-start;gap:6px;}.grd-fields{flex-direction:column;align-items:stretch;}.grd-select,.grd-input{width:100%;min-width:0;}}
    `;

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

    function fill(text, values) {
      return String(text).replace(/\{(\w+)\}/gu, (match, key) => (values[key] === undefined ? match : String(values[key])));
    }

    function modelLabel(id, t) {
      const key = 'model.' + id;
      const label = t(key);
      return typeof label === 'string' && label !== key ? label : id;
    }

    function describeError(error, t) {
      const code = error && typeof error.code === 'string' ? error.code : '';
      if (code !== '') {
        const key = 'error.' + code;
        const text = t(key);
        if (typeof text === 'string' && text !== key) return text;
      }
      if (error && error.name === 'NotAllowedError') return t('error.microphone-denied');
      if (error && (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError')) return t('error.microphone-missing');
      return t('error.generic');
    }

    function microphoneErrorKey(error) {
      const name = error && typeof error.name === 'string' ? error.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') return 'error.microphone-denied';
      if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') return 'error.microphone-missing';
      if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') return 'error.microphone-busy';
      if (name === 'TypeError' || name === 'NotSupportedError') return 'error.microphone-unsupported';
      return 'error.microphone-failed';
    }

    /**
     * Browsers hide `navigator.mediaDevices` on insecure origins. That is what
     * an iPhone hits when the GUI is opened over plain HTTP on the LAN, and it
     * says nothing about the microphone being absent or denied.
     */
    function microphoneSupport() {
      if (typeof window !== 'undefined' && window.isSecureContext === false) return 'insecure';
      const devices = typeof navigator === 'undefined' ? undefined : navigator.mediaDevices;
      if (!devices || typeof devices.getUserMedia !== 'function') return 'unsupported';
      return 'ok';
    }

    /** Safari on macOS and every browser on iOS record MP4/AAC only. */
    function isWebKit() {
      if (typeof navigator === 'undefined') return false;
      const vendor = String(navigator.vendor ?? '');
      const userAgent = String(navigator.userAgent ?? '');
      if (!/apple/i.test(vendor)) return false;
      return /safari/i.test(userAgent) && !/chrome|chromium|crios|android/i.test(userAgent);
    }

    /** Keep the platform failure visible in the console; the notice cannot show it. */
    function reportMicrophoneError(error) {
      if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn('[groq-dictation] microphone unavailable:', error);
      }
    }

    function formatTime(total) {
      const minutes = Math.floor(total / 60);
      const seconds = total % 60;
      return minutes + ':' + String(seconds).padStart(2, '0');
    }

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

    async function sendAudio(blob, type) {
      const declared = String(blob.type || type || '').split(';')[0].trim().toLowerCase();
      const headerType = declared === '' ? 'application/octet-stream' : declared;
      let response;
      try {
        response = await fetch(ENDPOINT + '/transcribe', {
          method: 'POST',
          cache: 'no-store',
          headers: { [HEADER]: '1', 'content-type': headerType },
          body: blob,
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

    function MicIcon({ size }) {
      return h('svg', {
        viewBox: '0 0 24 24',
        width: size || 18,
        height: size || 18,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        focusable: false,
      },
        h('rect', { x: 9, y: 2.5, width: 6, height: 11, rx: 3 }),
        h('path', { d: 'M5.5 11.5a6.5 6.5 0 0 0 13 0' }),
        h('path', { d: 'M12 18v3.5' }),
        h('path', { d: 'M8.5 21.5h7' }));
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => {
          const disposers = Object.entries(DICTS).map(([locale, dict]) => ctx.locale.register(NS, locale, dict));
          return () => {
            for (const dispose of disposers) dispose();
          };
        }, 'groq-dictation locale');

        const t = ctx.locale.bind(NS);
        const settingsStore = createStore({
          ready: false,
          configured: false,
          model: DEFAULT_MODEL,
          models: MODELS,
          apiKeyHint: '',
          hostMic: true,
          hostMicInfo: { checked: false, available: false, device: '' },
          error: null,
        });
        let loading = null;
        let hostMicLoading = null;

        /**
         * Probe the computer microphone once. The Host answers with the device it
         * would use, so the composer can offer the fallback before recording.
         */
        function loadHostMic() {
          const current = settingsStore.get().hostMicInfo;
          if (current.checked) return Promise.resolve(current);
          if (hostMicLoading !== null) return hostMicLoading;
          hostMicLoading = request('GET', '/host-mic').then((data) => {
            settingsStore.set({
              ...settingsStore.get(),
              hostMicInfo: {
                checked: true,
                available: data?.available === true,
                device: typeof data?.device === 'string' ? data.device : '',
              },
            });
            return settingsStore.get().hostMicInfo;
          }, () => {
            settingsStore.set({ ...settingsStore.get(), hostMicInfo: { checked: true, available: false, device: '' } });
            return settingsStore.get().hostMicInfo;
          }).finally(() => {
            hostMicLoading = null;
          });
          return hostMicLoading;
        }

        function loadSettings() {
          if (loading !== null) return loading;
          loading = request('GET', '/settings').then((data) => {
            const next = {
              ...settingsStore.get(),
              ready: true,
              configured: data?.configured === true,
              model: typeof data?.model === 'string' ? data.model : DEFAULT_MODEL,
              models: Array.isArray(data?.models) && data.models.length > 0 ? data.models : MODELS,
              apiKeyHint: typeof data?.apiKeyHint === 'string' ? data.apiKeyHint : '',
              hostMic: data?.hostMic !== false,
              error: null,
            };
            settingsStore.set(next);
            return next;
          }, (error) => {
            settingsStore.set({ ...settingsStore.get(), ready: true, error: describeError(error, t) });
            throw error;
          }).finally(() => {
            loading = null;
          });
          return loading;
        }

        function SettingsRow(props) {
          const translate = props.t || t;
          const state = useStore(settingsStore);
          const [keyDraft, setKeyDraft] = React.useState('');
          const [modelDraft, setModelDraft] = React.useState(state.model);
          const [hostMicDraft, setHostMicDraft] = React.useState(state.hostMic !== false);
          const [busy, setBusy] = React.useState(false);
          const [notice, setNotice] = React.useState(null);

          React.useEffect(() => {
            if (!state.ready) loadSettings().catch(() => {});
          }, [state.ready]);

          React.useEffect(() => {
            loadHostMic().catch(() => {});
          }, []);

          React.useEffect(() => {
            setModelDraft(state.model);
            setHostMicDraft(state.hostMic !== false);
          }, [state.model, state.hostMic]);

          const ids = Array.isArray(state.models) && state.models.length > 0 ? state.models.slice() : MODELS.slice();
          if (!ids.includes(modelDraft)) ids.push(modelDraft);
          const insecureContext = typeof window !== 'undefined' && window.isSecureContext === false;

          const save = async () => {
            if (busy) return;
            const key = keyDraft.trim();
            if (!state.configured && key === '') {
              setNotice({ kind: 'error', text: translate('settings.needKey') });
              return;
            }
            setBusy(true);
            setNotice(null);
            try {
              const body = { model: modelDraft, hostMic: hostMicDraft };
              if (key !== '') body.apiKey = key;
              const data = await request('POST', '/settings', body);
              settingsStore.set({
                ...settingsStore.get(),
                ready: true,
                configured: data?.configured === true,
                model: typeof data?.model === 'string' ? data.model : modelDraft,
                models: Array.isArray(data?.models) && data.models.length > 0 ? data.models : MODELS,
                apiKeyHint: typeof data?.apiKeyHint === 'string' ? data.apiKeyHint : '',
                hostMic: data?.hostMic !== false,
                error: null,
              });
              setKeyDraft('');
              setNotice({ kind: 'ok', text: translate('settings.saved') });
            } catch (error) {
              setNotice({ kind: 'error', text: describeError(error, translate) });
            } finally {
              setBusy(false);
            }
          };

          const clearKey = async () => {
            if (busy) return;
            setBusy(true);
            setNotice(null);
            try {
              const data = await request('POST', '/settings', { apiKey: '', model: modelDraft, hostMic: hostMicDraft });
              settingsStore.set({
                ...settingsStore.get(),
                ready: true,
                configured: data?.configured === true,
                model: typeof data?.model === 'string' ? data.model : modelDraft,
                models: Array.isArray(data?.models) && data.models.length > 0 ? data.models : MODELS,
                apiKeyHint: '',
                hostMic: data?.hostMic !== false,
                error: null,
              });
              setKeyDraft('');
              setNotice({ kind: 'ok', text: translate('settings.clearDone') });
            } catch (error) {
              setNotice({ kind: 'error', text: describeError(error, translate) });
            } finally {
              setBusy(false);
            }
          };

          const keyField = h('label', { className: 'grd-field grd-field-key' },
            h('span', { className: 'grd-label' }, translate('settings.apiKeyLabel')),
            h('input', {
              className: 'grd-input',
              type: 'password',
              name: 'groq-api-key',
              autoComplete: 'off',
              spellCheck: false,
              value: keyDraft,
              disabled: busy || !state.ready,
              placeholder: state.configured
                ? translate('settings.apiKeyPlaceholderSaved')
                : translate('settings.apiKeyPlaceholder'),
              onChange: (event) => setKeyDraft(event.target.value),
            }));

          const modelField = h('label', { className: 'grd-field' },
            h('span', { className: 'grd-label' }, translate('settings.modelLabel')),
            h('select', {
              className: 'grd-select',
              value: modelDraft,
              disabled: busy || !state.ready,
              onChange: (event) => setModelDraft(event.target.value),
            }, ids.map((id) => h('option', { key: id, value: id }, modelLabel(id, translate)))));

          const hostMicInfo = state.hostMicInfo;
          const hostMicField = h('div', { className: 'grd-field grd-field-check' },
            h('span', { className: 'grd-label' }, translate('settings.hostMicLabel')),
            h('label', { className: 'grd-check' },
              h('input', {
                type: 'checkbox',
                name: 'groq-host-mic',
                checked: hostMicDraft,
                disabled: busy || !state.ready,
                onChange: (event) => setHostMicDraft(event.target.checked),
              }),
              h('span', null, hostMicDraft ? translate('settings.hostMicOn') : translate('settings.hostMicOff'))),
            h('span', { className: 'grd-hint' }, translate('settings.hostMicDesc')),
            h('span', { className: 'grd-hint' },
              hostMicInfo.checked
                ? hostMicInfo.available
                  ? fill(translate('settings.hostMicAvailable'), { device: hostMicInfo.device })
                  : translate('settings.hostMicUnavailable')
                : translate('settings.loading')));

          const saveButton = h('button', {
            type: 'button',
            className: 'grd-btn grd-btn-primary',
            disabled: busy || !state.ready || (!state.configured && keyDraft.trim() === ''),
            onClick: () => { void save(); },
          }, busy ? translate('settings.saving') : translate('settings.save'));

          const clearButton = state.configured
            ? h('button', {
              type: 'button',
              className: 'grd-btn',
              disabled: busy,
              onClick: () => { void clearKey(); },
            }, translate('settings.clear'))
            : null;

          const status = notice !== null
            ? h('span', { className: 'grd-status grd-status-' + notice.kind, role: 'status' }, notice.text)
            : state.error !== null
              ? h('span', { className: 'grd-status grd-status-error', role: 'status' }, state.error)
              : !state.ready
                ? h('span', { className: 'grd-hint' }, translate('settings.loading'))
                : !state.configured
                  ? h('span', { className: 'grd-hint' }, translate('settings.needKey'))
                  : null;

          return h('div', { className: 'grd-row' },
            h('style', null, CSS),
            h('div', { className: 'grd-head' },
              h('div', { className: 'grd-copy' },
                h('div', { className: 'grd-title' }, translate('settings.title')),
                h('p', { className: 'grd-desc' }, translate('settings.desc')),
                h('p', { className: 'grd-hint' }, translate('settings.privacy')),
                insecureContext
                  ? h('p', { className: 'grd-hint grd-hint-warn' }, translate('settings.secureContextHint'))
                  : null),
              state.configured
                ? h('span', { className: 'grd-badge' }, fill(translate('settings.configured'), { hint: state.apiKeyHint }))
                : null),
            h('div', { className: 'grd-fields' }, keyField, modelField, hostMicField),
            h('div', { className: 'grd-actions' }, saveButton, clearButton, status));
        }

        function DictationButton(props) {
          const translate = props.t || t;
          const state = useStore(settingsStore);
          const draft = props.useInput((snapshot) => snapshot.draft);
          const [phase, setPhase] = React.useState('idle');
          const [seconds, setSeconds] = React.useState(0);
          const [notice, setNotice] = React.useState(null);
          const phaseRef = React.useRef('idle');
          const draftRef = React.useRef(draft);
          const actionsRef = React.useRef(props.inputActions);
          const buttonRef = React.useRef(null);
          const insertionRef = React.useRef(null);
          const recorderRef = React.useRef(null);
          const streamRef = React.useRef(null);
          const mimeRef = React.useRef('');
          const modeRef = React.useRef('browser');
          const chunksRef = React.useRef([]);
          const cancelledRef = React.useRef(false);
          const noticeSeqRef = React.useRef(0);

          actionsRef.current = props.inputActions;
          draftRef.current = draft;

          function changePhase(next) {
            phaseRef.current = next;
            setPhase(next);
          }

          function showNotice(text) {
            noticeSeqRef.current += 1;
            setNotice({ text, seq: noticeSeqRef.current });
          }

          /**
           * Return the keyboard to the composer. The public input actions expose
           * no focus verb, so mirror the shell's own focus sequence on the Lexical
           * root: focus the contenteditable and then the editor, which restores
           * the selection left by the insertion.
           */
          function focusComposer() {
            if (typeof document === 'undefined') return;
            const focusRoot = (root) => {
              if (root === null || root === undefined) return;
              try {
                if (typeof root.focus === 'function') root.focus({ preventScroll: true });
                const editor = root.__lexicalEditor;
                if (editor && typeof editor.focus === 'function') editor.focus();
              } catch {
                // Focus can fail while the composer is being replaced.
              }
            };
            let node = buttonRef.current ? buttonRef.current.parentElement : null;
            while (node !== null && node !== document.body) {
              const root = node.querySelector('[contenteditable="true"]');
              if (root !== null) {
                focusRoot(root);
                return;
              }
              node = node.parentElement;
            }
            focusRoot(document.querySelector('[contenteditable="true"]'));
          }

          function releaseMedia() {
            const stream = streamRef.current;
            streamRef.current = null;
            recorderRef.current = null;
            if (stream !== null) {
              for (const track of stream.getTracks()) {
                try {
                  track.stop();
                } catch {
                  // The track may already be stopped.
                }
              }
            }
          }

          function pickMime() {
            if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return '';
            const candidates = isWebKit()
              ? ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
              : ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
            for (const candidate of candidates) {
              try {
                if (MediaRecorder.isTypeSupported(candidate)) return candidate;
              } catch {
                // Ignore browsers that reject the probe.
              }
            }
            return '';
          }

          /** The container the recorder really produces, even when it reports none. */
          function recordedType(recorder, chosen) {
            const declared = String((recorder && recorder.mimeType) || chosen || '').split(';')[0].trim().toLowerCase();
            if (declared !== '') return declared;
            return isWebKit() ? 'audio/mp4' : 'audio/webm';
          }

          function createRecorder(stream, mime) {
            try {
              return mime === '' ? new MediaRecorder(stream) : new MediaRecorder(stream, { mimeType: mime });
            } catch {
              // The requested container was refused; the default one may still work.
            }
            try {
              return new MediaRecorder(stream);
            } catch {
              return null;
            }
          }

          function startRecorder(recorder) {
            try {
              recorder.start(250);
              return true;
            } catch {
              // Safari versions that reject the timeslice form still accept start().
            }
            try {
              recorder.start();
              return true;
            } catch {
              return false;
            }
          }

          function insertTranscript(text) {
            const actions = actionsRef.current;
            if (!actions) return;
            const span = insertionRef.current;
            insertionRef.current = null;
            const current = String(draftRef.current ?? '');
            let value = text;
            if (span && typeof span.start === 'number' && typeof span.end === 'number'
              && span.start >= 0 && span.end >= span.start && span.end <= current.length) {
              const before = current.slice(0, span.start);
              const after = current.slice(span.end);
              if (before !== '' && !/\s$/u.test(before)) value = ' ' + value;
              if (after === '' || !/^\s/u.test(after)) value = value + ' ';
              if (typeof actions.insertText === 'function' && actions.insertText(value, span) === true) return;
            }
            if (typeof actions.setDraft === 'function') {
              const separator = current !== '' && !/\s$/u.test(current) ? ' ' : '';
              actions.setDraft(current + separator + text + ' ');
              return;
            }
            if (typeof actions.captureInsertion === 'function' && typeof actions.insertText === 'function') {
              actions.insertText(text + ' ', actions.captureInsertion());
            }
          }

          async function complete(type) {
            if (cancelledRef.current || phaseRef.current !== 'transcribing') {
              releaseMedia();
              return;
            }
            // Safari can deliver the final dataavailable right after stop(); give
            // it one short beat before deciding the clip is empty.
            if (chunksRef.current.length === 0) {
              await new Promise((resolve) => setTimeout(resolve, 400));
              if (cancelledRef.current || phaseRef.current !== 'transcribing') {
                releaseMedia();
                return;
              }
            }
            const chunks = chunksRef.current;
            chunksRef.current = [];
            releaseMedia();
            const blobType = String(type || '').split(';')[0].trim().toLowerCase();
            const blob = new Blob(chunks, blobType === '' ? {} : { type: blobType });
            if (blob.size === 0) {
              changePhase('idle');
              showNotice(translate('error.empty-audio'));
              focusComposer();
              return;
            }
            try {
              const data = await sendAudio(blob, blobType);
              if (cancelledRef.current) return;
              const text = typeof data?.text === 'string' ? data.text.trim() : '';
              if (text === '') throw Object.assign(new Error('empty-transcript'), { code: 'empty-transcript' });
              insertTranscript(text);
              changePhase('idle');
              focusComposer();
            } catch (error) {
              if (cancelledRef.current) return;
              changePhase('idle');
              showNotice(describeError(error, translate));
              focusComposer();
            }
          }

          /**
           * Record on the computer instead of the browser. This is the only way
           * to dictate from a page Safari refuses to give a microphone to.
           */
          async function beginHost() {
            const actions = actionsRef.current;
            if (!actions || typeof actions.captureInsertion !== 'function' || typeof actions.insertText !== 'function') {
              showNotice(translate('error.generic'));
              return;
            }
            insertionRef.current = actions.captureInsertion();
            cancelledRef.current = false;
            modeRef.current = 'host';
            setSeconds(0);
            changePhase('requesting');
            try {
              await request('POST', '/host-mic/start');
            } catch (error) {
              modeRef.current = 'browser';
              changePhase('idle');
              showNotice(describeError(error, translate));
              return;
            }
            if (cancelledRef.current) {
              void request('POST', '/host-mic/cancel').catch(() => {});
              return;
            }
            changePhase('recording');
          }

          async function stopHost() {
            changePhase('transcribing');
            try {
              const data = await request('POST', '/host-mic/stop');
              if (cancelledRef.current) return;
              const text = typeof data?.text === 'string' ? data.text.trim() : '';
              if (text === '') throw Object.assign(new Error('empty-transcript'), { code: 'empty-transcript' });
              insertTranscript(text);
              changePhase('idle');
              focusComposer();
            } catch (error) {
              if (cancelledRef.current) return;
              changePhase('idle');
              showNotice(describeError(error, translate));
              focusComposer();
            }
          }

          function stopRecording() {
            if (phaseRef.current !== 'recording') return;
            if (modeRef.current === 'host') {
              void stopHost();
              return;
            }
            changePhase('transcribing');
            const recorder = recorderRef.current;
            if (!recorder || recorder.state === 'inactive') {
              void complete(recordedType(recorder, mimeRef.current));
              return;
            }
            try {
              recorder.stop();
            } catch {
              void complete(recordedType(recorder, mimeRef.current));
            }
          }

          async function begin() {
            if (phaseRef.current === 'requesting' || phaseRef.current === 'recording' || phaseRef.current === 'transcribing') return;
            setNotice(null);
            const current = settingsStore.get();
            if (!current.ready) {
              loadSettings().catch(() => {});
              showNotice(translate('settings.loading'));
              return;
            }
            if (current.error !== null) {
              showNotice(current.error);
              return;
            }
            if (!current.configured) {
              showNotice(translate('error.not-configured'));
              return;
            }
            const actions = actionsRef.current;
            if (!actions || typeof actions.captureInsertion !== 'function' || typeof actions.insertText !== 'function') {
              showNotice(translate('error.generic'));
              return;
            }
            const support = microphoneSupport();
            if (support !== 'ok') {
              if (support === 'insecure' && current.hostMic !== false) {
                // Hold the phase while the Host answers, so a second tap cannot
                // start a second recording.
                changePhase('requesting');
                const info = await loadHostMic();
                if (info.available === true && !cancelledRef.current) {
                  await beginHost();
                  return;
                }
                changePhase('idle');
              }
              showNotice(translate(support === 'insecure' ? 'error.microphone-insecure' : 'error.microphone-unsupported'));
              return;
            }
            modeRef.current = 'browser';
            if (typeof MediaRecorder === 'undefined') {
              showNotice(translate('error.recorder-unavailable'));
              return;
            }

            insertionRef.current = actions.captureInsertion();
            cancelledRef.current = false;
            setSeconds(0);
            changePhase('requesting');
            let stream;
            try {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (error) {
              changePhase('idle');
              reportMicrophoneError(error);
              showNotice(translate(microphoneErrorKey(error)));
              return;
            }
            if (cancelledRef.current) {
              for (const track of stream.getTracks()) {
                try {
                  track.stop();
                } catch {
                  // The track may already be stopped.
                }
              }
              return;
            }

            const mime = pickMime();
            mimeRef.current = mime;
            const recorder = createRecorder(stream, mime);
            if (recorder === null) {
              for (const track of stream.getTracks()) {
                try {
                  track.stop();
                } catch {
                  // The track may already be stopped.
                }
              }
              changePhase('idle');
              showNotice(translate('error.recorder-unavailable'));
              return;
            }

            streamRef.current = stream;
            recorderRef.current = recorder;
            chunksRef.current = [];
            recorder.ondataavailable = (event) => {
              if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
            };
            recorder.onerror = () => {
              if (cancelledRef.current || phaseRef.current === 'transcribing') return;
              changePhase('idle');
              showNotice(translate('error.recording-failed'));
              try {
                recorder.stop();
              } catch {
                // The recorder may already be inactive.
              }
              releaseMedia();
            };
            recorder.onstop = () => {
              if (cancelledRef.current) {
                releaseMedia();
                return;
              }
              if (phaseRef.current === 'recording') changePhase('transcribing');
              void complete(recordedType(recorder, mime));
            };
            if (!startRecorder(recorder)) {
              releaseMedia();
              changePhase('idle');
              showNotice(translate('error.recording-failed'));
              return;
            }
            changePhase('recording');
          }

          function toggle() {
            if (phaseRef.current === 'recording') {
              stopRecording();
              return;
            }
            if (phaseRef.current === 'idle') void begin();
          }

          React.useEffect(() => {
            if (!state.ready) loadSettings().catch(() => {});
          }, [state.ready]);

          React.useEffect(() => {
            if (typeof window !== 'undefined' && window.isSecureContext === false) loadHostMic().catch(() => {});
          }, []);

          React.useEffect(() => {
            if (phase !== 'recording') return undefined;
            const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
            return () => clearInterval(timer);
          }, [phase]);

          React.useEffect(() => {
            if (phase === 'recording' && seconds >= MAX_RECORDING_SECONDS) stopRecording();
          }, [phase, seconds]);

          React.useEffect(() => {
            const onKeyDown = (event) => {
              const currentPhase = phaseRef.current;
              if (currentPhase === 'idle') return;
              if (event.key !== 'Enter' || event.isComposing || event.keyCode === 229) return;
              event.preventDefault();
              event.stopPropagation();
              if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
              if (currentPhase === 'recording') stopRecording();
            };
            window.addEventListener('keydown', onKeyDown, true);
            return () => window.removeEventListener('keydown', onKeyDown, true);
          }, []);

          React.useEffect(() => {
            if (notice === null) return undefined;
            const timer = setTimeout(() => setNotice(null), 8000);
            return () => clearTimeout(timer);
          }, [notice]);

          React.useEffect(() => () => {
            cancelledRef.current = true;
            if (modeRef.current === 'host') void request('POST', '/host-mic/cancel').catch(() => {});
            const recorder = recorderRef.current;
            if (recorder && recorder.state !== 'inactive') {
              try {
                recorder.stop();
              } catch {
                // The recorder may already be inactive.
              }
            }
            releaseMedia();
          }, []);

          const recording = phase === 'recording';
          const requesting = phase === 'requesting';
          const transcribing = phase === 'transcribing';
          const hostMode = modeRef.current === 'host' && (recording || requesting);
          const hostFallback = !hostMode
            && microphoneSupport() === 'insecure'
            && state.hostMic !== false
            && state.hostMicInfo.available === true;
          const label = recording
            ? translate(hostMode ? 'mic.recordingHost' : 'mic.recording')
            : requesting
              ? translate(hostMode ? 'mic.startingHost' : 'mic.requesting')
              : transcribing
                ? translate('mic.transcribing')
                : translate(hostFallback ? 'mic.idleHost' : 'mic.idle');
          const time = formatTime(seconds);

          return h('div', { className: 'grd-mic-wrap' },
            h('style', null, CSS),
            hostMode && (recording || requesting)
              ? h('span', { className: 'grd-mic-tag', 'aria-hidden': true }, translate('mic.hostTag'))
              : null,
            recording ? h('span', { className: 'grd-rec-time', 'aria-hidden': true }, time) : null,
            h('button', {
              ref: buttonRef,
              type: 'button',
              className: 'grd-mic' + (recording ? ' is-recording' : ''),
              'aria-label': recording ? fill(translate(hostMode ? 'mic.recordingAriaHost' : 'mic.recordingAria'), { time }) : label,
              'aria-pressed': recording,
              'aria-busy': requesting || transcribing,
              title: notice !== null ? notice.text : label,
              disabled: requesting || transcribing,
              onClick: toggle,
            },
              recording
                ? h('span', { className: 'grd-stop-icon', 'aria-hidden': true })
                : requesting || transcribing
                  ? h('span', { className: 'grd-spin', 'aria-hidden': true })
                  : h(MicIcon, { size: 18 })),
            notice !== null
              ? h('span', { className: 'grd-mic-notice', role: 'status', title: notice.text }, notice.text)
              : null,
            h('span', { className: 'grd-sr', 'aria-live': 'polite' },
              notice !== null ? notice.text : recording ? translate('mic.recording') : ''));
        }

        ctx.slots.inject('settings.general.item', () => ctx.slots.register({
          name: 'settings.general.item',
          id: ID,
          order: 18,
          locale: NS,
        }, SettingsRow));

        ctx.slots.inject('conversation.input.activity', () => ctx.slots.register({
          name: 'conversation.input.activity',
          locale: NS,
        }, DictationButton));
      },
    };
  },
});
