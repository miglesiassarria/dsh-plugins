# dsh-plugins

Complementos propios para **DeepSeek Harness**, escritos para vivir como
plugins locales de un perfil (`@local/*`). Cada carpeta es un paquete ESM
autocontenido con su mitad de host (`index.js`), su mitad de cliente web
(`client.js`), sus textos (`locale/`) y su parche de composición
(`cordis.patch.yml`).

| Plugin | Nombre del paquete | Página | Qué añade |
|---|---|---|---|
| [`local_dsh-backups`](local_dsh-backups/) | `@local/dsh-backups` | Ajustes → **Copias de seguridad** | Exporta a un ZIP las sesiones, la configuración del perfil y los plugins locales, y los restaura en otro equipo. |
| [`local_tools-mcp-servers`](local_tools-mcp-servers/) | `@local/tools-mcp-servers` | Ajustes → **Herramientas** | Gestiona servidores MCP (stdio local o Streamable HTTP remoto) y registra sus herramientas en `ctx.tools` como `mcp__<servidor>__<herramienta>`. |

## Requisitos

- DeepSeek Harness con la GUI web (los dos plugins inyectan
  `@deepseek-ai/dsh-client-ui-settings` y `@deepseek-ai/dsh-client-locale`).
- Node.js y pnpm, los mismos que usa tu instalación de Harness.

## Instalación

1. Copia cada carpeta dentro del directorio de plugins locales de tu Harness
   (`$DSH_HOME/local-plugins`, por defecto `~/.dsh/local-plugins`):

   ```bash
   cp -R local_dsh-backups local_tools-mcp-servers ~/.dsh/local-plugins/
   ```

2. Declara los paquetes como enlaces en el `package.json` de tu perfil
   (`$DSH_HOME/profiles/<perfil>/package.json`):

   ```json
   {
     "dependencies": {
       "@local/dsh-backups": "link:/Users/tu-usuario/.dsh/local-plugins/local_dsh-backups",
       "@local/tools-mcp-servers": "link:/Users/tu-usuario/.dsh/local-plugins/local_tools-mcp-servers"
     },
     "dsh": {
       "profile": {
         "bundles": [
           "@deepseek-ai/dsh-base",
           "@deepseek-ai/dsh-web-app",
           "@local/tools-mcp-servers",
           "@local/dsh-backups"
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

## Uso rápido

- **Copias de seguridad**: elige qué incluir (chats y sesiones, configuración y
  plugins), crea el ZIP en `~/Documents/DeepSeek Harness/Backups` y, en el otro
  equipo, restaura solo las partes que quieras. La configuración que se
  sobrescribe se guarda antes con el sufijo `.bak-<fecha>`.
- **Herramientas**: añade un servidor con *comando local* o *URL remota*,
  conéctalo y decide por herramienta si se permite siempre, pide aprobación o
  se deniega. La lista se guarda en `$DSH_HOME/mcp-tools/servers.json`
  (permisos `0600`).

Cada plugin documenta su comportamiento en su propio `README.md`.

## Pruebas

Los dos plugins traen comprobaciones que se ejecutan sin tocar tu instalación:
la de `local_dsh-backups` construye un Harness desechable en un directorio
temporal y la de `local_tools-mcp-servers` monta el árbol de React en una VM.

```bash
node local_dsh-backups/test/host-check.mjs
node local_dsh-backups/test/render-check.mjs
node local_tools-mcp-servers/test/render-check.mjs
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
```

## Notas

- Los plugins se cargan desde el sistema de archivos: si editas su código,
  reinicia el Harness para ver los cambios en el host. La mitad de cliente se
  recarga con el HMR de la GUI cuando está activo.
- No hay claves ni rutas absolutas en el repositorio; las credenciales de los
  servidores MCP las escribe el usuario y se guardan fuera del control de
  versiones.
