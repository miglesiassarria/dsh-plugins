# Workspace context

Un plugin de DeepSeek Harness que amplía los espacios de trabajo con tres
capacidades opcionales y añade carpetas como contexto de sesión desde el botón
`+` del compositor. Al hacer clic en un espacio de trabajo se abre su **página
de proyecto** en el panel principal, con descripción, prompt del sistema,
contexto y chats navegables. El contexto activo se muestra además en la **barra
lateral derecha**: una tarjeta **Contexto** en la página *Empezar* y una pestaña
completa con la gestión de entradas.

## Qué añade

Al abrir el menú de un espacio de trabajo (clic derecho o el botón `...`) hay
una entrada nueva, **Configurar espacio**, con:

1. **Descripción del espacio**: un texto breve que explica para qué sirve.
2. **Prompt del sistema**: instrucciones permanentes para las sesiones del
   espacio.
3. **Archivos y carpetas de contexto**: archivos de texto que se incluyen
   completos y carpetas que se leen de forma recursiva con un límite.

Además, el botón `+` del compositor ofrece **Carpeta** en su menú (sección
*Comandos*). Al elegirla se abre el selector de carpetas del sistema y la
carpeta queda como contexto de esa sesión.

## Página de proyecto del espacio

Al hacer clic en la fila de un espacio de trabajo (o en el botón `...` →
**Abrir espacio**) el panel principal muestra una página de proyecto:

- título y ruta del espacio;
- descripción del espacio;
- **caja de chat** para empezar una sesión nueva: escribe y pulsa Enter o
  **Enviar**; se crea una sesión en el espacio, se envía el mensaje y la vista
  pasa directamente a esa sesión;
- **selector de modo** con los presets del host (estándar, PTC, mínimo,
  creador y los personalizados), con su descripción;
- **selector de modelo** con el catálogo del host, agrupado por proveedor;
  muestra el nombre del modelo predeterminado (y la etiqueta **Predeterminado**)
  cuando no hay una elección explícita, y **selector de permisos** (sólo lectura, escritura en el espacio de trabajo y
  acceso completo; este último pide confirmación). Al abrir un selector se crea
  o reutiliza una sesión vacía del espacio, y el envío usa esa misma sesión;
- **Prompt del sistema** en una tarjeta lateral, con acceso a Configurar
  espacio;
- **Contexto** del espacio en otra tarjeta, con acceso a Configurar espacio;
- **Chats** del espacio, ordenados por actividad, con fecha y clic para abrirlo;
- botones **Nueva sesión** y **Configurar espacio**.

El clic sobre el nombre, la carpeta o el fondo de la fila abre esta página y
**no** pliega la lista. Para plegar o desplegar los chats del espacio hay que
pulsar la **flecha**, que queda siempre visible a la izquierda de la carpeta
(no solo al pasar el ratón), de modo que también se puede usar en pantallas
táctiles.

## El apartado «Contexto» de la barra derecha

La barra lateral derecha muestra el contexto de la sesión activa de dos formas:

- **Tarjeta Contexto** en la página *Empezar*: aparece junto a Archivos,
  Terminal, Navegador y Más herramientas. Muestra el nombre y el origen de las
  primeras cuatro entradas, sin tener que pulsar nada. Al pulsarla se abre la
  pestaña completa.
- **Pestaña Contexto**: muestra la suma del contexto del espacio de trabajo y el
  de la sesión, agrupada por origen.

En la pestaña:

- el engranaje del grupo del espacio abre **Configurar espacio**;
- las entradas de la sesión se pueden quitar con su aspa;
- el botón `+` añade una carpeta a la sesión activa;
- el estado vacío ofrece añadir una carpeta o configurar el espacio.

La lista se refresca al añadir o quitar contexto, al guardar la configuración
del espacio y al cambiar de sesión.

## Cómo llega el contexto al modelo

Cada agente vivo recibe una sección de prompt propia, `workspace-context`, que
se vuelve a componer en cada paso. La sección contiene, en este orden:

- el espacio de trabajo que posee la sesión (título y ruta);
- su descripción y su prompt del sistema, si existen;
- el contenido de los archivos y carpetas configurados en el espacio;
- las carpetas añadidas a esa sesión concreta.

La sección solo existe cuando hay algo configurado: un espacio sin contexto no
gasta tokens. Los agentes que ya estaban vivos al instalar el plugin también
reciben la sección, y los nuevos agentes se enganchan al nacer.

El espacio se resuelve por pertenencia de la sesión y, si hace falta, por la
ruta canónica del directorio (resolviendo enlaces simbólicos). La configuración
guarda también la ruta del espacio, de modo que si un espacio se vuelve a
registrar con otro id su contexto no se pierde.

### Límites y filtros

- Se incluyen como máximo **120 000 caracteres** por sesión y paso.
- Una carpeta aporta hasta **80 archivos** de texto, con un máximo de **256 KB**
  por archivo y **8 niveles** de profundidad.
- Se omiten las carpetas pesadas habituales (`node_modules`, `.git`, `dist`,
  `build`, `.venv`, etc.), los archivos ocultos, los que parecen credenciales
  (`.env`, `*.pem`, `*.key`, `credentials`, `id_rsa`, etc.) y los generados o de
  dependencias (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `*.map`,
  `*.min.js`, `*.lock`, etc.).
- Solo se admiten archivos de texto UTF-8. Un archivo binario, demasiado grande
  o con bytes nulos se omite.
- El diálogo admite hasta **40 entradas** por espacio y **128 KB** de texto por
  archivo; el total de archivos de un espacio está limitado a 3 MB.
- Las carpetas se leen con una caché de 5 segundos para no repetir trabajo en
  cada paso del agente.

## Dónde se guarda

- Configuración y textos de archivos:
  `$DSH_HOME/workspace-context/context.json` (permisos `0600`). Los registros de
  espacio incluyen su ruta canónica y su título además del id.
- El plugin **no** escribe en la sesión ni en el perfil. La configuración es
  datos del plugin; el estado del modelo se deriva de ella en cada paso.
- El contenido de una carpeta se lee del disco cuando se compone el prompt. No
  se copia al store salvo que se añada como archivo suelto desde el diálogo.

## Instalación

El plugin vive como paquete local `@local/workspace-context`:

```bash
cp -R local_workspace-context ~/.dsh/local-plugins/
```

Después, desde el gestor de plugins de la GUI o editando el `package.json` del
perfil:

```json
{
  "dependencies": {
    "@local/workspace-context": "link:/Users/tu-usuario/.dsh/local-plugins/local_workspace-context"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "@local/workspace-context"
      ]
    }
  }
}
```

```bash
cd ~/.dsh/profiles/desktop && pnpm install
```

El plugin necesita la GUI web y los servicios `webServer`, `agents`,
`systemPrompt`, `workspaceRegistry` y `workingDirectory`, que forman parte de la
composición web estándar. La mitad de cliente inyecta
`ui-context-menu`, `ui-commands`, `ui-workspace` y `ui-conversation`.

## Uso

1. Clic derecho sobre un espacio de la barra lateral (o su botón `...`) →
   **Configurar espacio**.
2. Rellena la descripción y el prompt del sistema si los quieres.
3. **Añadir carpeta** usa el selector nativo del sistema; **Añadir archivos**
   lee los archivos de texto elegidos y los guarda en el contexto del espacio.
4. Guarda. La siguiente petición de cualquier sesión del espacio ya incluye el
   contexto.
5. Para una sesión concreta, pulsa `+` → **Carpeta** y elige una carpeta. La
   entrada aparece en la tarjeta y la pestaña **Contexto** de la barra lateral
   derecha, y el contexto se inyecta en el siguiente paso. La pestaña muestra
   esa carpeta junto a las que ya herede del espacio.
6. Para ver el detalle, abre la barra derecha, ve a *Empezar* y pulsa la
   tarjeta **Contexto**. La pestaña se abre en esa misma barra.
7. Para abrir la página de proyecto de un espacio, pulsa su fila en la barra
   izquierda. Desde ahí puedes abrir cualquiera de sus chats, crear una sesión
   nueva o configurar el espacio.

## Pruebas

```bash
node test/host-check.mjs
node test/render-check.mjs
```

- `host-check` construye un store temporal, comprueba la validación de rutas,
  el filtrado de archivos ocultos/binarios, la retención de textos al guardar y
  la ruta HTTP con su cabecera de mismo origen.
- `render-check` ejecuta la mitad de cliente en una VM con un React mínimo:
  abre el diálogo desde el menú, edita campos, añade un archivo, guarda la
  configuración, renderiza la tarjeta y la pestaña **Contexto** de la barra
  derecha, simula el clic en una fila de espacio, comprueba la página de
  proyecto con su caja de chat, sus selectores de modelo y permisos y sus chats,
  verifica que la flecha no abre la página y ejecuta el comando **Carpeta**.

## Límites conocidos

- El contexto del espacio y las carpetas de sesión son datos del plugin: no
  forman parte del log de la sesión. Un fork, una sesión restaurada en otro
  equipo o una sesión que se abra con el plugin desinstalado no los hereda.
- El apartado **Contexto** vive en la barra lateral derecha; si esa barra está
  cerrada hay que abrirla para verlo. La tarjeta de *Empezar* muestra solo las
  primeras cuatro entradas; la pestaña muestra todas. El contexto de un espacio
  se ve al abrir cualquiera de sus sesiones.
- Las carpetas se leen en el momento de componer el prompt; no hay watcher
  dedicado. La caché de 5 segundos hace que un cambio tarde como mucho ese
  tiempo en reflejarse.
- El diálogo no renombra el espacio: el nombre sigue perteneciendo al menú
  nativo.
- Los archivos sueltos del diálogo son texto UTF-8; para binarios o PDFs usa
  los adjuntos normales del compositor.
- La fila **Carpeta** aparece en la sección *Comandos* del menú `+`, no en
  *Añadir*, porque la sección *Añadir* está reservada por el menú del host.
