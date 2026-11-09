# dsh Mobile

**Accede a DeepSeek Harness desde el móvil**: escanea un código QR y verás en el teléfono la misma interfaz que tienes en el ordenador, en tiempo real. Por la red local o por internet.

> Este complemento es la traducción al español de [DSH Pocket](https://github.com/shaobeichen/dsh-pocket) de 少北晨 (shaobeichen), publicado bajo licencia GPL-2.0. La funcionalidad y el modo de funcionamiento son los del proyecto original; los textos de la interfaz, los avisos y la documentación están traducidos al español.

---

## Qué es

**Estás lejos del ordenador y quieres seguir usando el DeepSeek Harness que se ejecuta en él.**

- De camino a casa, el agente sigue trabajando en el ordenador y quieres ver desde el móvil cómo va y qué ha producido.
- Estás fuera y quieres pedirle al agente que busque algo o escriba un fragmento de código, sin escritorio remoto ni SSH.
- El ordenador está en casa o en la oficina y quieres **controlar tu DeepSeek Harness desde el móvil**: enviar tareas, ver la salida y aprobar acciones.

dsh Mobile hace exactamente eso: **lo instalas, escaneas un código QR y el móvil muestra y controla la interfaz de DeepSeek Harness en tiempo real, desde cualquier lugar.**

La pantalla del móvil es la misma que la del ordenador: salida en streaming, aprobaciones, cambios de sesión, etc.

---

## Funciones

| Función | Descripción |
| --- | --- |
| 📶 Acceso por red local | Funciona nada más instalar: **Ajustes → Acceso desde el móvil** muestra un QR para móviles en la misma Wi-Fi (detecta la IP local; en WSL toma la IP física del host Windows). |
| 🚪 Interruptor de red local | Activa o desactiva el acceso por red local con un clic (con diálogo de confirmación). Al desactivarlo, el QR y el enlace dejan de funcionar al instante; el acceso público no se ve afectado. |
| 🌐 Acceso público | Pulsa «Activar acceso público» → túnel de cloudflared → QR público para 4G o cualquier red. |
| 🏷️ Dominio público fijo | Modo opcional de **túnel con nombre**: token de Cloudflare Tunnel + tu dominio; la dirección pública **no cambia** entre reinicios. |
| 🔐 Contraseña de acceso | El acceso público usa una **contraseña aleatoria de 8 caracteres** que se renueva en cada activación (o una contraseña fija personalizada). La red local tiene su propia contraseña de 8 caracteres (activada por defecto y desactivable). |
| 🔑 Contraseñas personalizadas | Las contraseñas pública y local pueden fijarse entre **8 y 64 caracteres alfanuméricos** desde Ajustes. Las personalizadas no se renuevan automáticamente. |
| 🧘 Sesión persistente | Introduces la contraseña una vez y no vuelve a pedirla mientras el proceso `dsh web` del ordenador siga en marcha. Tras reiniciar o actualizar `dsh web` hay que introducirla otra vez. |
| ⚡ Sincronización en tiempo real | La salida en streaming pasa por WebSocket sin modificaciones: lo que pinta el ordenador lo pinta el móvil; interacción bidireccional; latido de WebSocket para evitar cortes silenciosos de NAT/ahorro de energía y reconexión automática. |
| 📱 Diseño adaptado al móvil | En pantallas estrechas aparece un cajón lateral (portado de dsh-web-mobile, MIT): menú lateral, conversación a ancho completo, áreas seguras y optimizaciones táctiles. |
| 🧭 Barra lateral derecha opcional | Muestra el acceso nativo a la barra lateral derecha en el móvil; se puede desactivar para una cabecera más compacta o dejar activada en pantallas desplegadas. |
| 📁 Explorador de archivos | Las entradas móviles de «Archivos» necesitan un panel explorador en el host (componente de dsh-web-ui); si no existe, las entradas se ocultan automáticamente. |
| 🗜️ Compresión de transferencia | Las respuestas JSON grandes se comprimen al vuelo con gzip/brotli (historial de 17 MB → ~1 MB) para cargar antes y gastar menos datos. |
| 🔁 Restauración automática del túnel | Tras reiniciar DSH, el túnel público que estaba abierto se vuelve a levantar solo. |
| 🧩 Instalación sin dependencias externas | Un solo paquete, un panel de ajustes; sin cuentas ni servidores propios. |

---

## Cómo se usa

### Entrar en el panel

Tras instalar el complemento y reiniciar `dsh web`, abre **Ajustes**: en la barra lateral aparece **«Acceso desde el móvil»**, al mismo nivel que General o Modelos.

### Red local (misma Wi-Fi)

1. Abre **Ajustes → Acceso desde el móvil**.
2. Escanea el QR de **📶 Red local** con el móvil conectado a la misma Wi-Fi.
3. Introduce la **contraseña de red local** que aparece en el bloque de red local (puedes renovarla o personalizarla).

> El interruptor **«Acceso por red local»** está activado por defecto. Al desactivarlo, el QR y el enlace dejan de funcionar de inmediato (el acceso público no se ve afectado). Vuelve a activarlo para restaurarlo.
>
> La contraseña de red local está activada por defecto. Si eres el único usuario y no quieres escribirla cada vez, desactívala: los dispositivos de la misma red local se conectarán directamente. **El acceso público siempre pide contraseña.**
>
> El estado de sesión del móvil está ligado al proceso `dsh web`: mientras no se reinicie, no hay que volver a introducir la contraseña.

### Acceso público (desde cualquier lugar)

1. En el mismo panel, pulsa **«Activar acceso público»**.
2. Acepta el **aviso de seguridad** que aparece cada vez (el servidor también lo exige; no se puede saltar).
3. Espera a que se cree el túnel (la primera vez descarga cloudflared; en macOS/Linux usa el espejo de Tsinghua y suele tardar segundos).
4. Escanea el QR de **🌐 Acceso público** e introduce la contraseña pública.

> La contraseña pública se genera al azar en cada activación y la anterior deja de servir. Si usas una **contraseña personalizada**, no se renueva. El enlace público cambia al reiniciar (salvo en modo de dominio fijo).

### Dominio público fijo (túnel con nombre, opcional)

El túnel rápido cambia de URL en cada reinicio. Para una **dirección pública fija** puedes usar un túnel con nombre de Cloudflare (necesitas cuenta de Cloudflare y un dominio propio):

1. En [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) → **Networks → Tunnels**, crea un túnel y copia el **Tunnel Token**.
2. En **Public Hostname** de ese túnel, apunta tu dominio (por ejemplo `movil.example.com`) a `http://127.0.0.1:3081` (el puerto del proxy).
3. En el panel, cambia el modo a **«Dominio fijo»**, pega el token y escribe el dominio.
4. Pulsa «Activar acceso público»: la dirección será tu dominio y **no cambiará al reiniciar**.

> En modo de dominio fijo la contraseña pública **no se renueva automáticamente**. El token se guarda solo en este equipo (`$DSH_HOME/dsh-mobile/settings.json`, solo legible por tu usuario) y el panel nunca lo vuelve a mostrar.

---

## Seguridad (leer antes de usar)

- **DSH puede ejecutar código en tu ordenador.** El QR/URL de red local y su contraseña son la llave. **No compartas el QR, la URL ni la contraseña de red local.**
- **Antes de activar el acceso público hay que leer y aceptar el aviso de seguridad** (aparece en cada activación y el servidor lo exige). El acceso público expone a internet un DSH capaz de ejecutar código: usa una contraseña fuerte, ciérralo en cuanto termines y no lo uses en redes corporativas o clasificadas sin comprobar antes el cumplimiento normativo.
- **Acceso público**: por defecto la contraseña es aleatoria de 8 caracteres y se renueva en cada activación; el enlace es aleatorio y los antiguos dejan de funcionar. Una contraseña personalizada de 8-64 caracteres alfanuméricos no se renueva.
- **Límite de intentos**: 5 contraseñas incorrectas seguidas desde una misma IP bloquean esa IP durante 60 s; un umbral global bloquea temporalmente a todos (frena escaneos distribuidos); un acierto reinicia el contador.
- El estado de sesión del móvil está ligado al proceso: **no hay que repetir la contraseña mientras `dsh web` siga vivo; tras reiniciar/actualizar hay que introducirla una vez más.**
- El **acceso público se decide con criterio fail-closed**: todo lo que no sea loopback o una dirección privada de red local se trata como público y exige la contraseña pública.
- El modo de red local no expone nada a internet; solo los dispositivos de la misma red pueden acceder.
- Las contraseñas se guardan en `$DSH_HOME/dsh-mobile/token` y `$DSH_HOME/dsh-mobile/token-lan`; los interruptores y preferencias, en `$DSH_HOME/dsh-mobile/settings.json`.

---

## Instalación

Requisitos: Node.js 22 o superior y DeepSeek Harness instalado.

Este repositorio contiene el paquete local del complemento. Sustituye `<perfil>` por el perfil que uses (`desktop`, `web`, …):

```sh
# Desde el directorio que contiene local_dsh-mobile/
dsh plugin --profile <perfil> add ./local_dsh-mobile -w
```

Después, **reinicia `dsh web`** (o la aplicación de escritorio) para que el proceso cargue el código nuevo.

También puedes instalarlo desde el gestor de complementos de DeepSeek Harness apuntando a la carpeta `local_dsh-mobile`.

Si el directorio no tiene `node_modules`, instala las dependencias de ejecución (el complemento usa `qrcode` y `qrcode-terminal`):

```sh
npm install --omit=dev --no-audit --no-fund
```

### Compilar el cliente

El cliente web ya viene compilado en `client/client.js`. Si modificas `client/`, vuelve a compilarlo:

```sh
npm install --no-save --no-audit --no-fund esbuild@0.25.9
node client/build.mjs
# opcional: quitar esbuild después de compilar
rm -rf node_modules/esbuild node_modules/@esbuild node_modules/.bin/esbuild
```

---

## Preguntas frecuentes

| Síntoma | Causa y solución |
| --- | --- |
| La interfaz no cambia tras instalar | Hay que reiniciar `dsh web`: el proceso en marcha sigue usando el código antiguo. |
| `listen EADDRINUSE ... :3081` | Otro proceso ocupa el puerto del proxy. En macOS/Linux: `lsof -ti :3081 \| xargs kill -9`; en Windows: `netstat -ano \| findstr :3081` y `taskkill /PID <PID> /F`. |
| Quiero cambiar el puerto | En `$DSH_HOME/dsh-mobile/settings.json` escribe `"proxyPort": 3082` y reinicia `dsh web`. En modo CLI: `dsh-mobile --port 3082`. |
| El acceso público da `error 1033` | Suele ser un proxy/VPN local (Clash, Surge, v2ray, sing-box, sobre todo en modo TUN) que corta las conexiones del túnel. Desactiva el modo TUN o cierra el proxy y vuelve a intentarlo. |
| Safari no entra por la red local | Safari no guarda la cookie de sesión en `http://` con IP simple. Usa Chrome/Edge o el acceso público HTTPS. |
| El móvil muestra `dsh web authentication required` | Era una cookie de sesión antigua de `dsh web` (por ejemplo, tras reiniciar el proceso con el PIN de red local desactivado). El proxy ahora la detecta, la borra y renueva el handshake automáticamente; recarga la página en el móvil. Si sigue apareciendo, vuelve a abrir el enlace del QR. |
| Descarga de cloudflared bloqueada | Instala cloudflared a mano (`brew install cloudflared`, `apt install cloudflared`, `winget install cloudflared`) o indica su ruta con `"cloudflaredPath"` en `settings.json`. |
| DSH Desktop en modo advanced | El acceso desde el móvil necesita el modo **compatibility**. Cambia el modo en los ajustes de DSH Desktop y reinicia. |
| La actualización/el reinicio no aparecen | En DSH Desktop las actualizaciones y el reinicio los gestiona la propia aplicación; el complemento los desactiva en ese entorno. |

---

## Arquitectura

| Archivo | Cometido |
| --- | --- |
| `lib/index.js` | Entrada del plugin: arranca el proxy, registra el RPC, gestiona las contraseñas y los interruptores, y adapta el comportamiento en DSH Desktop. |
| `lib/settings.mjs` | Persistencia de preferencias en `$DSH_HOME/dsh-mobile/settings.json`. |
| `lib/service.mjs` | Ciclo de vida del proxy, túnel público (con restauración automática) y estado con los códigos QR. |
| `lib/proxy.mjs` | Proxy inverso que reescribe Host/Origin a loopback, pasa HTTP y WebSocket, inyecta polyfills, comprime y autentica por Host. |
| `lib/tunnel.mjs` | cloudflared: descarga desde varios espejos, inicio y resolución de la URL pública. |
| `lib/web-rpc.js` | RPC local para el panel: `status`, `tunnel.start`, `tunnel.stop`, `lan.setEnabled`, `version`, `update`, `restart`, etc. |
| `client/index.jsx` | Panel de ajustes y adaptación móvil. |
| `client/mobile/` | Cajón lateral, iconos, hojas de archivos y utilidades táctiles (portadas de dsh-web-mobile, MIT). |
| `client/client.js` | Cliente web compilado (se regenera con `node client/build.mjs`). |

---

## Créditos y licencia

- **Proyecto original**: [DSH Pocket](https://github.com/shaobeichen/dsh-pocket), de 少北晨 (shaobeichen).
- **Esta versión**: traducción al español y adaptación como complemento local «dsh Mobile».
- **Licencia**: GPL-2.0. Consulta [LICENSE](LICENSE).
- La adaptación móvil procede de dsh-web-mobile (MIT); consulta `client/mobile/LICENSE.dsh-web-mobile`.
