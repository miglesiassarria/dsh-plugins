# DSH Sandbox

Una **jaula por sesión** para el compositor de DeepSeek Harness. La jaula vive
en el botón con forma de jaula situado entre el **+** y el chip de permisos del
espacio de trabajo.

- **Apagada** (icono neutro): la sesión se comporta como siempre.
- **Encendida** (icono rojo): el agente de esa sesión pasa a ejecutarse con el
  **executor nativo de herramientas**. Desaparece `run_code`, se ocultan
  `bash`, los trabajos en segundo plano y CUA, y las herramientas de archivos
  solo pueden leer o escribir en el espacio de trabajo de la sesión y en las
  carpetas autorizadas.

## Qué garantiza

- **Solo herramientas**: el agente no puede escribir ni ejecutar código
  arbitrario. No hay `run_code`, no hay terminal y no hay control del
  escritorio.
- **Archivos confinados**: `read`, `read_image`, `write`, `edit`, `glob`,
  `grep` y `present` pasan por un guard monotónico que resuelve la ruta real
  (incluidos symlinks) y la compara con el espacio de trabajo de la sesión y las
  carpetas autorizadas. `glob`/`grep` también rechazan patrones con `..`.
- **Sandbox de escritura**: mientras la jaula está activa, `sandboxPolicy`
  fuerza `workspace-write` (nunca `danger-full-access`) y añade las carpetas
  autorizadas a las raíces de escritura, de modo que el sandbox de archivos del
  Harness respalda el guard.
- **Herencia**: un subagente creado por un agente enjaulado hereda la jaula.
- **Persistencia**: el estado por sesión y las carpetas autorizadas viven en
  `$DSH_HOME/dsh-sandbox/state.json` (0600).

Las herramientas MCP siguen disponibles: son herramientas. Sus efectos externos
(Kubernetes, Grafana, n8n, GitHub…) no los controla este complemento.

## Cómo se activa

1. Abre una sesión con agente.
2. Pulsa el icono de jaula a la derecha del **+**.
3. El icono se pinta de rojo. El **siguiente paso** del agente ya usa el
   executor nativo; si la jaula se enciende a mitad de turno, el paso en curso
   termina con el executor anterior.
4. Vuelve a pulsarlo para salir de la jaula y recuperar `run_code`.

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
```

La prueba de integración contra el registro real de `@deepseek-ai/dsh-tools`
comprueba el cambio a executor nativo, la ocultación de CLI/CUA, la denegación
de `bash`, la lectura/escritura confinada, la política y la herencia de
subagentes.

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
