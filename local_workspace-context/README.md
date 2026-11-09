# Workspace context

Un plugin de DeepSeek Harness que amplía los espacios de trabajo con tres
capacidades opcionales y añade carpetas como contexto de sesión desde el botón
`+` del compositor.

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
carpeta queda como contexto de esa sesión. Las carpetas añadidas aparecen como
chips encima del compositor, con un botón para quitarlas.

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

### Límites y filtros

- Se incluyen como máximo **120 000 caracteres** por sesión y paso.
- Una carpeta aporta hasta **80 archivos** de texto, con un máximo de **256 KB**
  por archivo y **8 niveles** de profundidad.
- Se omiten las carpetas pesadas habituales (`node_modules`, `.git`, `dist`,
  `build`, `.venv`, etc.), los archivos ocultos y los que parecen credenciales
  (`.env`, `*.pem`, `*.key`, `credentials`, `id_rsa`, etc.).
- Solo se admiten archivos de texto UTF-8. Un archivo binario, demasiado grande
  o con bytes nulos se omite.
- El diálogo admite hasta **40 entradas** por espacio y **128 KB** de texto por
  archivo; el total de archivos de un espacio está limitado a 3 MB.
- Las carpetas se leen con una caché de 5 segundos para no repetir trabajo en
  cada paso del agente.

## Dónde se guarda

- Configuración y textos de archivos:
  `$DSH_HOME/workspace-context/context.json` (permisos `0600`).
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
5. Para una sesión concreta, pulsa `+` → **Carpeta** y elige una carpeta. El
   chip aparece encima del compositor y el contexto se inyecta en el siguiente
   paso.

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
  configuración, renderiza el rail de sesión y ejecuta el comando **Carpeta**.

## Límites conocidos

- El contexto del espacio y las carpetas de sesión son datos del plugin: no
  forman parte del log de la sesión. Un fork, una sesión restaurada en otro
  equipo o una sesión que se abra con el plugin desinstalado no los hereda.
- Las carpetas se leen en el momento de componer el prompt; no hay watcher
  dedicado. La caché de 5 segundos hace que un cambio tarde como mucho ese
  tiempo en reflejarse.
- El diálogo no renombra el espacio: el nombre sigue perteneciendo al menú
  nativo.
- Los archivos sueltos del diálogo son texto UTF-8; para binarios o PDFs usa
  los adjuntos normales del compositor.
- La fila **Carpeta** aparece en la sección *Comandos* del menú `+`, no en
  *Añadir*, porque la sección *Añadir* está reservada por el menú del host.
