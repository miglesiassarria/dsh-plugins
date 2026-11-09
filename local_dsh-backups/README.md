# Copias de seguridad (`@local/dsh-backups`)

Página de **Configuración → Copias de seguridad** para exportar tu DeepSeek
Harness a otro ordenador y volver a importarlo.

## Qué hace

**Crear copia de seguridad** escribe un archivo **ZIP** en
`~/Documents/DeepSeek Harness/Backups` con dos partes seleccionables, ambas
marcadas por defecto:

- **Chats y sesiones**: los registros de sesión de `$DSH_HOME/sessions`, más la
  pertenencia de cada sesión a su espacio de trabajo y el conjunto de chats
  archivados.
- **Configuración y plugins**: los archivos del perfil (`cordis.patch.yml`,
  `cordis.yml`, `package.json`, `pnpm-workspace.yaml` y cualquier YAML de nivel
  superior), el código de cada plugin local enlazado con `link:` y los datos de
  plugins que viven en `$DSH_HOME` (por ejemplo `mcp-tools/servers.json`). El
  `pnpm-lock.yaml` no se copia: contiene rutas absolutas de la máquina de origen
  y pnpm lo regenera solo.

Junto a la ruta hay un botón **Abrir carpeta** que la abre en el gestor de
archivos del sistema: Finder en macOS (`open`), Explorador de Windows
(`explorer.exe`) y `xdg-open` en Linux. También aparece como enlace en la
tarjeta de copias guardadas.

**Restaurar copia de seguridad** acepta uno de esos archivos, muestra qué
contiene y permite restaurar solo una parte. Al restaurar:

- las sesiones que no existían se escriben y se enganchan a su espacio de
  trabajo cuando la carpeta original existe en este ordenador (si no existe, se
  restauran sin agrupar y se indica cuántas);
- los archivos de configuración que se sobrescriben se conservan antes con el
  sufijo `.bak-<fecha>`;
- los plugins se copian a `$DSH_HOME/local-plugins/<nombre>`, `package.json` se
  reescribe para apuntar ahí y se recrean los enlaces de `node_modules`.

Después de restaurar configuración o plugins hay que **reiniciar DeepSeek
Harness** para cargarlos. Los chats restaurados aparecen sin reiniciar.

## Detalles

- Los archivos de copia son ZIP normales y se abren en Finder o en el
  Explorador de Windows. Los archivos de texto se comprimen con deflate.
- Los registros de sesión se **re-codifican** antes de guardarlos: DeepSeek los
  escribe como una concatenación de frames zstd independientes (uno por lote),
  y eso deja mucho margen. La copia los decodifica a JSONL, comprime el cuerpo
  entero en un solo frame a nivel 19 y mantiene un primer frame con solo la
  cabecera, que es lo que exige el lector de sesiones. El resultado se
  verifica decodificándolo de nuevo: si no reproduce el log original, se
  guarda el archivo tal cual.
- Cifras de este perfil: 10,5 MB de JSONL → 2,7 MB tal como están en disco →
  **1,4 MB dentro de la copia**. La copia completa (sesiones + configuración +
  plugins) pasa de 3,6 MB (primer formato) a 1,4 MB.
- El formato anterior (`.json` con base64) se sigue pudiendo importar.
- Los backups **no incluyen** `node_modules`, `.git` ni los archivos de bloqueo
  de sesión.
- Pueden contener datos sensibles (por ejemplo tokens de servidores MCP):
  trátalos como privados.
- La carpeta de destino se puede cambiar con la variable de entorno
  `DSH_BACKUPS_DIR`.

## Pruebas

```bash
node test/host-check.mjs     # ruta HTTP real sobre un $DSH_HOME temporal
node test/render-check.mjs   # render de la página con React mínimo
```
