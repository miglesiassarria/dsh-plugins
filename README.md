# dsh-plugins

Complementos propios para **DeepSeek Harness**, escritos para vivir como
plugins locales de un perfil (`@local/*`). Cada carpeta es un paquete ESM
autocontenido con sus textos (`locale/`) y su parche de composición
(`cordis.patch.yml`); los que tienen interfaz añaden su mitad de host
(`index.js`) y su mitad de cliente web (`client.js`).

| Plugin | Nombre del paquete | Página | Qué añade |
|---|---|---|---|
| [`local_dsh-backups`](local_dsh-backups/) | `@local/dsh-backups` | Ajustes → **Copias de seguridad** | Exporta a un ZIP las sesiones, la configuración del perfil y los plugins locales, y los restaura en otro equipo. |
| [`local_tools-mcp-servers`](local_tools-mcp-servers/) | `@local/tools-mcp-servers` | Ajustes → **Herramientas** | Gestiona servidores MCP (stdio local o Streamable HTTP remoto) y registra sus herramientas en `ctx.tools` como `mcp__<servidor>__<herramienta>`. |
| [`local_hide-deepseek-defaults`](local_hide-deepseek-defaults/) | `@local/hide-deepseek-defaults` | — | Desactiva los proveedores integrados de DeepSeek (cuenta y clave API) para que no aparezcan ni en el selector de modelos del chat ni en **Ajustes → Modelos**. |
| [`local_default-model`](local_default-model/) | `@local/default-model` | Ajustes → **Modelos** (arriba del todo) | Elige el modelo con el que empiezan los chats nuevos. Cada sesión puede cambiar de modelo después sin alterar el predeterminado. |
| [`local_workspace-context`](local_workspace-context/) | `@local/workspace-context` | Clic en el espacio → página de proyecto; menú del espacio → **Configurar espacio**; tarjeta y pestaña **Contexto** de la barra derecha; menú `+` del compositor | Añade descripción, prompt del sistema y archivos o carpetas de contexto a cada espacio de trabajo, y carpetas como contexto de sesión. La página de proyecto muestra esos datos y sus chats. |
| [`local_retro-ai-os`](local_retro-ai-os/) | `@local/retro-ai-os` | Ajustes → **Retro AI OS** | Tema retro reversible con cuatro estilos seleccionables, barra de estado y una mascota pixelada que refleja el estado real de la sesión. |
| [`local_groq-dictation`](local_groq-dictation/) | `@local/groq-dictation` | Ajustes → General → **Dictado con Groq**; micrófono del compositor | Dictado por voz con Groq Whisper: graba desde el compositor, transcribe y escribe el texto en el borrador. La clave se guarda en el Host. |
| [`local_dsh-config`](local_dsh-config/) | `@local/dsh-config` | Ajustes → barra lateral de categorías (arrastrar); Complementos → Agregar complemento; compositor → selector de modelo | Reordena las categorías de Ajustes arrastrándolas (también con `Alt+↑`/`Alt+↓`) y guarda ese orden en el Host. Además, **Agregar complemento** acepta URLs de carpeta de GitHub (`.../tree/rama/carpeta`) y las instala como paquete local, y el selector de modelo del compositor oculta el sufijo «Predeterminado». |
| [`local_dsh-mobile`](local_dsh-mobile/) | `@local/dsh-mobile` | Ajustes → **Acceso desde el móvil** | Control remoto por QR: acceso desde la red local o por internet (túnel de Cloudflare), con la misma interfaz del ordenador sincronizada en tiempo real. Traducción al español de DSH Pocket. |

## Requisitos

- DeepSeek Harness con la GUI web (los plugins de Ajustes inyectan
  `@deepseek-ai/dsh-client-ui-settings` y `@deepseek-ai/dsh-client-locale`; el
  de espacios de trabajo inyecta los paquetes de menú contextual, comandos,
  espacios de trabajo y conversación; el de dictado inyecta conversación,
  ajustes e idioma y usa una ruta del Host para llamar a Groq; el de DSH Config
  inyecta el shell de Ajustes y el idioma y usa una ruta del Host para guardar
  el orden; el de móvil inyecta conexión, slots, layout, idioma y exportación
  del registro de sesión, y levanta un proxy en el puerto 3081). El de
  DeepSeek es solo un parche de composición y no necesita cliente.
- Node.js y pnpm, los mismos que usa tu instalación de Harness.

## Instalación

1. Copia cada carpeta dentro del directorio de plugins locales de tu Harness
   (`$DSH_HOME/local-plugins`, por defecto `~/.dsh/local-plugins`):

   ```bash
   cp -R local_dsh-backups local_tools-mcp-servers local_workspace-context local_hide-deepseek-defaults local_retro-ai-os local_groq-dictation local_default-model local_dsh-config local_dsh-mobile ~/.dsh/local-plugins/
   ```

2. Declara los paquetes como enlaces en el `package.json` de tu perfil
   (`$DSH_HOME/profiles/<perfil>/package.json`):

   ```json
   {
     "dependencies": {
       "@local/dsh-backups": "link:/Users/tu-usuario/.dsh/local-plugins/local_dsh-backups",
       "@local/tools-mcp-servers": "link:/Users/tu-usuario/.dsh/local-plugins/local_tools-mcp-servers",
       "@local/workspace-context": "link:/Users/tu-usuario/.dsh/local-plugins/local_workspace-context",
       "@local/hide-deepseek-defaults": "link:/Users/tu-usuario/.dsh/local-plugins/local_hide-deepseek-defaults",
       "@local/retro-ai-os": "link:/Users/tu-usuario/.dsh/local-plugins/local_retro-ai-os",
       "@local/groq-dictation": "link:/Users/tu-usuario/.dsh/local-plugins/local_groq-dictation",
       "@local/default-model": "link:/Users/tu-usuario/.dsh/local-plugins/local_default-model",
       "@local/dsh-config": "link:/Users/tu-usuario/.dsh/local-plugins/local_dsh-config",
       "@local/dsh-mobile": "link:/Users/tu-usuario/.dsh/local-plugins/local_dsh-mobile"
     },
     "dsh": {
       "profile": {
         "bundles": [
           "@deepseek-ai/dsh-base",
           "@deepseek-ai/dsh-web-app",
           "@local/tools-mcp-servers",
           "@local/dsh-backups",
           "@local/workspace-context",
           "@local/hide-deepseek-defaults",
           "@local/retro-ai-os",
           "@local/groq-dictation",
           "@local/default-model",
           "@local/dsh-config",
           "@local/dsh-mobile"
         ]
       }
     }
   }
   ```

3. Instala los enlaces dentro del perfil y reinicia DeepSeek Harness:

   ```bash
   cd ~/.dsh/profiles/desktop && pnpm install
   ```

   También puedes activarlos desde el gestor de plugins de la GUI, que escribe
   esas entradas por ti.

   `local_dsh-mobile` usa `qrcode` y `qrcode-terminal` en el Host. Si copias la
   carpeta sin su `node_modules`, instala esas dependencias antes de reiniciar:

   ```bash
   cd local_dsh-mobile && npm install --omit=dev --no-audit --no-fund
   ```

## Uso rápido

- **Copias de seguridad**: elige qué incluir (chats y sesiones, configuración y
  plugins), crea el ZIP en `~/Documents/DeepSeek Harness/Backups` y, en el otro
  equipo, restaura solo las partes que quieras. La configuración que se
  sobrescribe se guarda antes con el sufijo `.bak-<fecha>`.
- **Herramientas**: añade un servidor con *comando local* o *URL remota*,
  conéctalo y decide por herramienta si se permite siempre, pide aprobación o
  se deniega. La lista se guarda en `$DSH_HOME/mcp-tools/servers.json`
  (permisos `0600`).
- **Modelos de DeepSeek**: no hay nada que configurar; al activar el bundle
  desaparecen «Cuenta DeepSeek» y «DeepSeek» del chat y de Ajustes, y también la
  página Cuenta, y tus proveedores siguen igual. Recarga la pestaña después de
  instalarlo.
- **Contexto de espacios**: pulsa la fila de un espacio (la flecha solo pliega
  la lista) para abrir su página de proyecto con descripción, prompt del
  sistema, contexto, caja de chat con selectores de modo, modelo y permisos, y chats
  navegables. Escribe en la caja y pulsa Enter o **Enviar** para crear una sesión
  con ese mensaje ya enviado. Clic derecho en el espacio → **Configurar
  espacio** para editar esos datos.
  Para una sesión suelta, pulsa `+` → **Carpeta**. La barra lateral derecha
  muestra una tarjeta **Contexto** en *Empezar* y una pestaña completa con la
  suma del contexto del espacio y el de la sesión. La configuración se guarda
  en `$DSH_HOME/workspace-context/context.json` (permisos `0600`).
- **Retro AI OS**: elige *Menta clásica*, *CRT ámbar*, *Vaporwave* o *Azul
  medianoche* y activa el interruptor. La barra bajo el compositor muestra el
  estado real de la sesión (trabajando, esperando respuesta o turno terminado).
  Desactivar el interruptor retira la capa de tokens y devuelve el aspecto
  original; las preferencias se guardan en
  `$DSH_HOME/retro-ai-os/preferences.json`.
- **Dictado con Groq**: en **Ajustes → General → Dictado con Groq**, pega tu
  clave de Groq, elige el modelo de Whisper y guarda. En el compositor aparece
  un micrófono entre el selector de modelo y Enviar: pulsa para grabar, habla
  y vuelve a pulsar para que Groq transcriba y escriba el texto en el borrador.
  La clave se guarda en `$DSH_HOME/groq-dictation/settings.json` (permisos
  `0600`); el audio solo sale del equipo al detener la grabación.
- **Modelo predeterminado**: abre **Ajustes → Modelos**. Arriba del todo, junto
  a *Abrir archivo de configuración*, elige el modelo con el que empiezan los
  chats nuevos. El control solo aparece en esa página. Cambiar el modelo dentro
  de una sesión no modifica este valor; las conversaciones ya empezadas
  conservan el suyo. La elección se guarda en
  `$DSH_HOME/default-model/settings.json` (permisos `0600`).
- **Acceso desde el móvil**: en **Ajustes → Acceso desde el móvil** escanea el
  QR de **Red local** con el móvil en la misma Wi-Fi (o activa el **Acceso
  público** para entrar desde cualquier red). La pantalla del móvil es la misma
  que la del ordenador y se sincroniza en tiempo real. El acceso público pide
  aceptar el aviso de seguridad y usa una contraseña de 8 caracteres que se
  renueva en cada activación (o una personalizada). Los datos se guardan en
  `$DSH_HOME/dsh-mobile/` (permisos `0600`).
- **DSH Config**: abre **Ajustes** y arrastra cualquier categoría de la barra
  izquierda hacia arriba o hacia abajo; una línea marca dónde caerá. Al soltar,
  el orden se aplica al momento y se guarda en
  `$DSH_HOME/dsh-config/settings.json` (permisos `0600`). También puedes mover
  la categoría enfocada con `Alt+↑` y `Alt+↓`.
  En **Complementos → Agregar complemento** puedes pegar una URL de carpeta de
  GitHub, por ejemplo
  `https://github.com/miglesiassarria/dsh-plugins/tree/main/local_retro-ai-os`:
  el Host descarga solo esa carpeta, fijada al commit, en
  `$DSH_HOME/dsh-config/github`, y el diálogo normal la instala como paquete
  local. Solo repositorios públicos y sujeto al límite anónimo de la API de
  GitHub. En el compositor, el selector de modelo ya no muestra el sufijo
  «Predeterminado» del esfuerzo del proveedor.
  **Qué modifica:** (1) el orden de las categorías de Ajustes, con arrastre,
  teclado y persistencia en el Host; (2) el diálogo **Agregar complemento**,
  para aceptar carpetas de GitHub y resolverlas a un paquete local; (3) el
  selector de modelo del compositor, para ocultar solo el esfuerzo
  predeterminado. La lista completa, con los recursos y las rutas que toca, está
  en [su README](local_dsh-config/README.md#qué-modifica).
  Recarga la pestaña tras instalarlo para que cargue la mitad de cliente.

Cada plugin documenta su comportamiento en su propio `README.md`.

## Pruebas

Los plugins traen comprobaciones que se ejecutan sin tocar tu instalación:
la de `local_dsh-backups` construye un Harness desechable en un directorio
temporal, la de `local_tools-mcp-servers` monta el árbol de React en una VM, la
de `local_workspace-context` prueba el store, el filtrado de carpetas, la ruta
HTTP, la herencia por ruta canónica, la tarjeta y la pestaña **Contexto**, la
página de proyecto con clic, flecha y caja de chat, y el diálogo del cliente, la
de `local_hide-deepseek-defaults` valida su parche y sus recursos, la de
`local_groq-dictation` prueba el store de la clave, la ruta de transcripción
con `fetch` simulado, la fila de Ajustes y el micrófono del compositor, y la de
`local_default-model` prueba el catálogo, la persistencia del pin, la ruta HTTP,
la preparación de sesiones nuevas y vacías (sin tocar subagentes, forks ni
conversaciones empezadas) y el selector de la cabecera de Modelos. El de móvil
no incluye una suite propia: su mitad de host se verificó contra el proxy real
(login, QR, conmutador de red local y RPC) y su mitad de cliente se sirve como
bundle `@local/dsh-mobile`.

```bash
node local_dsh-backups/test/host-check.mjs
node local_dsh-backups/test/render-check.mjs
node local_tools-mcp-servers/test/render-check.mjs
node local_workspace-context/test/host-check.mjs
node local_workspace-context/test/render-check.mjs
node local_hide-deepseek-defaults/test/check.mjs
node local_retro-ai-os/test/host-check.mjs
node local_groq-dictation/test/host-check.mjs
node local_groq-dictation/test/render-check.mjs
node local_default-model/test/host-check.mjs
node local_default-model/test/render-check.mjs
```

## Estructura

```text
local_dsh-backups/
  index.js            mitad de host: rutas HTTP, ZIP, restauración
  client.js           página de Ajustes (React)
  cordis.patch.yml    entrada de bundle
  locale/{en,es}.json textos
  test/               comprobaciones de host y de render
local_tools-mcp-servers/
  index.js            mitad de host: cliente MCP, registro de herramientas
  client.js           página de Ajustes (React)
  cordis.patch.yml    entrada de bundle
  locale/{en,es}.json textos
  test/               comprobación de render y servidores MCP de ejemplo
local_workspace-context/
  index.js            mitad de host: store, ruta y contexto de prompt
  client.js           mitad de cliente: menú, diálogo, comando + y rail
  cordis.patch.yml    entrada de bundle
  locale/{en,es}.json textos
  test/               comprobaciones de host y de render
local_hide-deepseek-defaults/
  cordis.patch.yml    desactiva llm-deepseek, llm-deepseek-account y ui-settings-account
  locale/{en,es}.json textos
  test/check.mjs      validación del parche y de los recursos
local_retro-ai-os/
  index.js            mitad de host: preferencias y ruta HTTP
  client.js           mitad de cliente: estilos, capa de tokens, mascota y estado
  cordis.patch.yml    entrada de bundle
  locale/{en,es}.json textos
  test/host-check.mjs persistencia y validación de la ruta
local_groq-dictation/
  index.js            mitad de host: clave, ajustes y proxy a Groq
  client.js           mitad de cliente: fila de Ajustes y micrófono del compositor
  cordis.patch.yml    entrada de bundle
  locale/{en,es}.json textos
  test/               comprobaciones de host y de render
local_default-model/
  index.js            mitad de host: pin, catálogo, ruta y preparación de sesiones
  client.js           mitad de cliente: selector en la cabecera de Modelos
  cordis.patch.yml    entrada de bundle
  locale/{en,es}.json textos
  test/               comprobaciones de host y de render
local_dsh-mobile/
  lib/index.js        mitad de host: proxy, RPC, contraseñas y ajustes
  lib/proxy.mjs       proxy inverso con autenticación y páginas de acceso
  lib/service.mjs     estado, códigos QR y túnel de Cloudflare
  lib/tunnel.mjs      descarga, arranque y resolución de cloudflared
  client/client.js    mitad de cliente compilada (panel y móvil)
  client/index.jsx    panel «Acceso desde el móvil»
  client/mobile/      adaptación móvil (dsh-web-mobile, MIT)
  cordis.patch.yml    entrada de bundle
  locale/{en,es}.json textos e icono
```

## Seguridad

Este repositorio es público y **no contiene credenciales**: ni claves de API, ni
tokens, ni rutas de tu equipo, ni direcciones de tu red. Los valores de ejemplo
de los tests son ficticios (`/Users/demo`, `localhost`, `example.com`).

Lo que sí puede contener secretos son tus **datos**, que nunca entran aquí:

- Las credenciales del Harness viven en `$DSH_HOME/.credentials.yaml`.
- La página **Herramientas** guarda en `$DSH_HOME/mcp-tools/servers.json` los
  valores de entorno y los tokens Bearer que escribas, con permisos `0600`. Ese
  archivo se incluye a propósito en la copia de seguridad para poder restaurar
  los servidores MCP en otro equipo: trata los ZIP de copia como material
  sensible y no los adjuntes a incidencias, PRs ni conversaciones públicas.
- **Contexto de espacios** guarda en `$DSH_HOME/workspace-context/context.json`
  la configuración y los archivos de texto que añadas, con permisos `0600`. Las
  carpetas se leen en el momento de componer el prompt, omitiendo archivos
  ocultos y con nombre de credencial, pero un archivo de texto elegido a mano
  puede contener secretos: revísalo antes de compartir una copia del perfil.
- **Dictado con Groq** guarda la clave API en
  `$DSH_HOME/groq-dictation/settings.json` con permisos `0600`. La página solo
  recibe si hay clave y sus últimos cuatro caracteres; el audio se reenvía a
  Groq únicamente al detener la grabación y no se guarda en disco. La copia de
  seguridad del plugin de copias no incluye este archivo; si copias el perfil a
  mano, contiene una credencial: trátalo como material sensible.
- **Modelo predeterminado** guarda en `$DSH_HOME/default-model/settings.json`
  solo el proveedor y el identificador del modelo elegidos, con permisos `0600`.
  No contiene claves ni credenciales.
- **Acceso desde el móvil** guarda en `$DSH_HOME/dsh-mobile/` las contraseñas de
  acceso (`token`, `token-lan`), los interruptores y el token del túnel de
  Cloudflare si usas dominio fijo, con permisos `0600`. El token del túnel no se
  devuelve nunca al navegador. No compartas el QR ni la contraseña de red local:
  quien los tenga puede controlar el Harness de este equipo.
- `.gitignore` bloquea `.env`, claves privadas, `servers.json`, credenciales y
  archivos `.zip` para que no se suban por descuido.

## Notas

- Los plugins se cargan desde el sistema de archivos: si editas su código,
  reinicia el Harness para ver los cambios en el host. La mitad de cliente se
  recarga con el HMR de la GUI cuando está activo.
- Las credenciales de los servidores MCP las escribe el usuario y se guardan
  fuera del control de versiones.
