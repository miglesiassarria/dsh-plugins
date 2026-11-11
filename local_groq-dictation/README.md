# Dictado con Groq

Dictado por voz dentro del compositor de DeepSeek Harness. Pulsas el micrófono
que aparece junto al botón de enviar, hablas, vuelves a pulsar y el texto
transcrito se escribe en el borrador, en la posición del cursor.

La transcripción la hace **Groq Whisper**. La clave API se configura en
**Ajustes → General → Dictado con Groq** y se queda en el equipo: el navegador
solo habla con una ruta local del Host, que es quien llama a Groq.

## Qué añade

- Una fila **Dictado con Groq** en la sección General de Ajustes, con la clave
  API, el modelo de Whisper y los botones Guardar y Borrar clave.
- Un botón de micrófono en la barra de herramientas del compositor, entre el
  selector de modelo y el botón de Enviar. Durante la grabación muestra el
  tiempo y un cuadrado de parada; al terminar muestra un indicador de
  transcripción. También puedes terminar la grabación pulsando **Enter**.
- Inserción del texto en el borrador con una sola operación de deshacer. Si el
  borrador cambió mientras se transcribía, el texto se añade al final en lugar
  de pisar lo que hayas escrito.
- Avisos localizados para clave rechazada, límite de peticiones, micrófono
  denegado, formato de audio no admitido, tiempo de espera y red.

## Modelos

| Modelo | Cuándo usarlo |
|---|---|
| `whisper-large-v3-turbo` | Opción por defecto; la más rápida para dictado normal. |
| `whisper-large-v3` | Más preciso y algo más lento. |
| `distil-whisper-large-v3-en` | Solo inglés; pensado para notas rápidas en ese idioma. |

El idioma se detecta automáticamente. Groq acepta WebM/Opus (Chrome, Edge,
Firefox), MP4/AAC (Safari) y otros formatos habituales; el cliente elige el
primero que soporte el navegador.

## Uso

1. Abre **Ajustes → General** y busca la fila **Dictado con Groq**.
2. Pega una clave de <https://console.groq.com/keys>, elige el modelo y pulsa
   **Guardar**. La fila muestra `Clave guardada ···· <últimos 4>`.
3. En un chat, pulsa el micrófono del compositor. El navegador pedirá permiso
   para usar el micrófono la primera vez.
4. Habla y pulsa **Enter** para terminar (o vuelve a pulsar el micrófono). El
   Enter se intercepta mientras grabas y mientras procesa la transcripción, así
   que no envía el mensaje. Mientras transcribe verás el indicador giratorio;
   al terminar, el texto aparece en el borrador y el foco vuelve al compositor,
   así que puedes revisar y pulsar Enter otra vez para enviar.

El dictado se puede usar en cualquier sesión. Si cierras Ajustes, la clave
sigue guardada y el micrófono funciona sin recargar la página. Para desactivar
el dictado, borra la clave desde la misma fila.

## Límites

- La grabación se detiene sola a los **10 minutos** y el audio no puede pasar
  de **24 MB**, por debajo del límite de 25 MB de Groq.
- El audio se envía a Groq en el momento en que detienes la grabación. No se
  guarda en disco ni se reutiliza.
- El micrófono necesita un contexto seguro. La GUI de Harness en
  `http://127.0.0.1` cumple esa condición; una página servida por HTTP en una
  IP remota no la cumple y el navegador bloqueará `getUserMedia`.

## Privacidad y seguridad

- La clave se guarda en `$DSH_HOME/groq-dictation/settings.json` con permisos
  `0600` (directorio `0700`). La página nunca recibe la clave completa: la ruta
  `GET /dsh-groq-dictation/settings` devuelve solo `configured` y los últimos
  cuatro caracteres.
- La ruta de transcripción exige la cabecera `x-dsh-groq-dictation: 1`, que
  fuerza un preflight CORS para cualquier origen ajeno; el Host no responde a
  ese preflight.
- El audio se reenvía a
  `https://api.groq.com/openai/v1/audio/transcriptions` con la clave en la
  cabecera `Authorization`. No se escribe en logs ni en el disco del Host.
- Si borras la clave, la fila de Ajustes vuelve a pedir una y el micrófono deja
  de grabar.

## Instalación

Copia la carpeta a `$DSH_HOME/local-plugins` y enlázala desde el
`package.json` del perfil, o instálala desde el gestor de plugins de la GUI:

```json
{
  "dependencies": {
    "@local/groq-dictation": "link:/Users/tu-usuario/.dsh/local-plugins/local_groq-dictation"
  },
  "dsh": {
    "profile": {
      "bundles": ["@local/groq-dictation"]
    }
  }
}
```

El paquete inyecta `@deepseek-ai/dsh-client-locale`,
`@deepseek-ai/dsh-client-ui-settings` y
`@deepseek-ai/dsh-client-ui-conversation` en la mitad de cliente, y declara
`webServer` en la mitad de host.

## Pruebas

```bash
node local_groq-dictation/test/host-check.mjs
node local_groq-dictation/test/render-check.mjs
```

- `host-check` prueba el store, los permisos `0600`, la validación de la clave
  y del modelo, el enmascarado, el rechazo sin cabecera, la limpieza de la
  clave y la transcripción con `fetch` simulado (incluidos clave rechazada,
  red caída y transcripción vacía).
- `render-check` monta el cliente en una VM con React mínimo y recorre la fila
  de Ajustes, el guardado y borrado de la clave, la grabación simulada, la
  inserción en el borrador y los avisos de error y de permiso denegado.

Ninguna prueba necesita una clave real ni toca tu instalación.
