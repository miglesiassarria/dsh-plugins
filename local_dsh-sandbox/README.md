# DSH Sandbox

Una **jaula por sesión** para el compositor de DeepSeek Harness. La jaula vive
en el botón situado entre el **+** y el chip de permisos del espacio de trabajo,
y **está activada por defecto en todas las sesiones**.

- **Cerrada y roja** (icono de jaula cerrada): el agente de esa sesión se
  ejecuta con el **executor nativo de herramientas**. Desaparece `run_code`, se
  ocultan `bash`, los trabajos en segundo plano y CUA, y las herramientas de
  archivos solo pueden leer o escribir en el espacio de trabajo de la sesión y
  en las carpetas autorizadas.
- **Abierta** (icono neutro): la sesión se comporta como siempre. Se abre
  expresamente pulsando la jaula.

Al dejar el ratón quieto **2 segundos** sobre el icono aparece el estado:
`Sandbox ON` (cerrada) o `Sandbox OFF` (abierta).

## Qué garantiza

- **Solo herramientas**: el agente no puede escribir ni ejecutar código
  arbitrario. No hay `run_code`, no hay terminal y no hay control del
  escritorio. La selección del executor se sustituye en el propio servicio de
  herramientas, así que el preset `ptc` de la sesión no puede volver a colar
  `run_code`.
- **Archivos confinados**: `read`, `read_image`, `write`, `edit`, `glob`,
  `grep` y `present` pasan por un guard monotónico que resuelve la ruta real
  (incluidos symlinks) y la compara con el espacio de trabajo de la sesión y las
  carpetas autorizadas. `glob`/`grep` también rechazan patrones con `..`.
- **Sandbox de escritura**: mientras la jaula está activa, `sandboxPolicy`
  fuerza `workspace-write` (nunca `danger-full-access`) y añade las carpetas
  autorizadas a las raíces de escritura, de modo que el sandbox de archivos del
  Harness respalda el guard.
- **Todas las sesiones**: la jaula se aplica por defecto a cualquier sesión,
  también a las que se abran después de arrancar; solo se desactiva con una
  elección explícita.
- **Sin puertas laterales**: la jaula también oculta y deniega `subagent`,
  `subagent_fork`, `send_message`, `schedule_create`, `schedule_edit`,
  `working_directory` y las herramientas `office_*`; cambiar el directorio de
  trabajo o delegar en otra sesión ampliaría el perímetro.
- **Persistencia**: las carpetas autorizadas y las sesiones abiertas
  explícitamente viven en `$DSH_HOME/dsh-sandbox/state.json` (0600). El resto
  está cerrado por defecto.

Las herramientas MCP siguen disponibles: son herramientas. Sus efectos externos
(Kubernetes, Grafana, n8n, GitHub…) no los controla este complemento.

## Cómo se usa

La jaula está cerrada por defecto, sin hacer nada.

1. Abre una sesión con agente; el icono aparece **cerrado y rojo** y el
   **siguiente paso** del agente usa el executor nativo.
2. Pulsa la jaula para **abrirla** (icono de jaula abierta, neutro). Esa sesión
   recupera el comportamiento normal (`run_code`) y queda marcada como abierta.
3. Vuelve a pulsarla para cerrarla; vuelve al estado por defecto.

Si se abre o cierra a mitad de un turno, el paso en curso termina con el
executor anterior; el cambio se aplica al siguiente paso.

## Carpetas autorizadas

En **Ajustes → DSH Sandbox** hay una lista de carpetas autorizadas. Añade una
ruta absoluta y pulsa **Autorizar carpeta**; se resuelve a su ruta física y se
añade tanto al guard como a las raíces de escritura de la política. Revocar una
carpeta surte efecto en la siguiente llamada.

## Rutas del Host

| Ruta | Uso |
|---|---|
| `GET /dsh-sandbox/state?sessionId=…` | Estado de la jaula para una sesión. |
| `POST /dsh-sandbox/state` | `{ sessionId, enabled }`: activa o desactiva la jaula. |
| `GET /dsh-sandbox/grants` | Carpetas autorizadas. |
| `POST /dsh-sandbox/grants` | `{ action: "add" \| "remove", path }`. |
| `GET /dsh-sandbox/health` | Comprobación de vida. |

Todas exigen la cabecera `x-dsh-sandbox: 1`.

## Instalación

Con el gestor de complementos de la GUI: **Ajustes → Complementos → Agregar
complemento** y pega la ruta absoluta de esta carpeta. El gestor crea el enlace
del perfil y añade el bundle; después reinicia DeepSeek Harness.

O ejecuta el instalador del repositorio, que enlaza el paquete en el perfil y añade la fila del bundle:

```bash
node local_dsh-sandbox/install.mjs          # perfil «desktop»
node local_dsh-sandbox/install.mjs otro     # otro perfil
```

A mano:

```bash
ROOT=/Users/miglesias/proyectos/GITHUB/dsh-plugins/local_dsh-sandbox
PROFILE=~/.dsh/profiles/desktop

ln -sfn "$ROOT" "$PROFILE/node_modules/@local/dsh-sandbox"
# añade "@local/dsh-sandbox": "link:$ROOT" a dependencies
# y "@local/dsh-sandbox" a dsh.profile.bundles
cd "$PROFILE" && pnpm install
```

Después reinicia DeepSeek Harness.

## Pruebas

```bash
npm test        # host-check: estado, rutas, symlinks y rutas HTTP
npm run test:live  # composición real: executor del app.asar + preset PTC falso
```

La prueba de integración contra el registro real de `@deepseek-ai/dsh-tools`
comprueba el cambio a executor nativo, la ocultación de CLI/CUA, la denegación
de `bash`, la lectura/escritura confinada, la política y la herencia de
subagentes.

## Diagnóstico

`GET /dsh-sandbox/state` (con la cabecera `x-dsh-sandbox: 1`) devuelve
`executor.source`:

- `application`: el executor nativo se cargó desde el `app.asar` de la
  aplicación; es el caso normal en la app empaquetada.
- `profile`: se resolvió como paquete del perfil.
- `none`: no se pudo cargar. La jaula entra en **modo cerrado**: usa un
  executor vacío, no expone ninguna herramienta y `lastError` explica el
  fallo. Es preferible a dejar `run_code` vivo.

El cambio de executor se aplica al **siguiente paso** del agente. Si enciendes
la jaula mientras un turno está ejecutándose, ese turno termina con el executor
anterior; espera a que acabe antes de probar.

## Límites

- No es un sandbox de kernel: es una jaula de **capacidades**. El agente no
  ejecuta código porque no tiene `run_code`; las herramientas MCP sí corren
  fuera del proceso del agente, con los permisos que tenga cada servidor MCP.
- CUA y la terminal desaparecen de la sesión enjaulada; si otro complemento
  registra una herramienta equivalente, el guard solo conoce los nombres de la
  lista y esa herramienta quedaría fuera.
- Las carpetas autorizadas son globales, no por sesión.
- Si el executor nativo no está disponible en la composición, la jaula aplica
  igualmente las restricciones y el guard, pero el agente conserva el executor
  anterior. El estado lo reporta en `lastError`.
