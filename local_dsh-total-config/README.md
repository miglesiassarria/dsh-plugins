# DHS Total Config

Complemento único para **DeepSeek Harness** que reúne, en una sola página de
Ajustes, los comportamientos que antes vivían en cinco bundles distintos:

- [`local_dsh-config`](../local_dsh-config/)
- [`local_default-model`](../local_default-model/)
- [`local_hide-deepseek-defaults`](../local_hide-deepseek-defaults/)
- [`local_hide-updates`](../local_hide-updates/)
- [`local_workspace-context`](../local_workspace-context/)

Cada comportamiento tiene su propio interruptor en **Ajustes → DHS Total
Config** y se guarda en el Host, así que la elección sobrevive a recargas,
ediciones del perfil y reinicios.

| | |
|---|---|
| Paquete | `@local/dsh-total-config` |
| Página de Ajustes | **DHS Total Config** |
| Interruptores | 9, agrupados en tres bloques |
| Datos | `$DSH_HOME/dsh-total-config/` |
| Interfaz | Sí: página de Ajustes, control de modelo, página de proyecto, pestaña Contexto, menús |

## Interruptores

### Ajustes e instalación

| Interruptor | Qué hace |
|---|---|
| **Reordenar categorías de Ajustes** | Arrastra las categorías de la barra de Ajustes para cambiar su orden. `Alt+↑` y `Alt+↓` mueven la categoría enfocada. El orden se guarda en el Host. |
| **Instalar desde carpetas de GitHub** | En **Agregar complemento** acepta una URL que apunte a una carpeta de un repositorio público (`https://github.com/usuario/repositorio/tree/rama/carpeta`). El Host descarga esa carpeta a una caché local y la entrega al mismo proceso de instalación. |
| **Ocultar la etiqueta de esfuerzo predeterminado** | No muestra «Predeterminado» junto al nombre del modelo en el compositor. El resto de etiquetas de esfuerzo siguen visibles. |

### Modelos e interfaz

| Interruptor | Qué hace |
|---|---|
| **Modelo predeterminado para chats nuevos** | Añade el control en **Ajustes → Modelos** y fija el modelo con el que empiezan los chats nuevos. Cambiar de modelo dentro de un chat no altera este valor. |
| **Ocultar avisos de actualización** | Oculta el botón de actualización junto a *Configuración* y el punto de nueva versión de la barra lateral plegada. No desactiva el actualizador ni el menú nativo de macOS. |
| **Ocultar los modelos por defecto de DeepSeek** | Oculta los proveedores integrados de DeepSeek (cuenta y clave API) del selector de modelos y de **Ajustes → Modelos**, y oculta la página **Cuenta** y su lanzador de la barra lateral. Tus proveedores (Nexo, opencode-go…) no se tocan. |

Este último interruptor se aplica a través del **gestor de complementos**: el
bundle trae esas tres filas desactivadas de fábrica y el interruptor escribe (o
retira) una excepción en el parche del perfil. Por eso, al cambiarlo, la página
pide **recargar** para refrescar la lista de proveedores y la página Cuenta.

### Espacios de trabajo

| Interruptor | Qué hace |
|---|---|
| **Contexto de espacios** | Da a cada espacio una descripción, un prompt del sistema y archivos o carpetas de contexto que acompañan a todas sus sesiones. Añade además carpetas como contexto de sesión desde el menú `+` del compositor y una pestaña **Contexto** en la barra derecha. |
| **Página de proyecto del espacio** | Al hacer clic en un espacio se abre su página de proyecto con su contexto, instrucciones, chats y un compositor. |
| **Icono y color del espacio** | Muestra un icono o un color propio para cada espacio en la barra lateral y en su página. |

La página de proyecto y el icono/color **dependen de Contexto de espacios**: si
ese interruptor está apagado, los otros dos se muestran desactivados.

## Complementos anteriores

Si los cinco bundles anteriores siguen activos, la página muestra una tarjeta
**Complementos anteriores** con un botón para desactivar cada uno. Desactivar no
desinstala: el bundle sigue en el perfil y puedes volver a activarlo desde
**Ajustes → Complementos**.

Se recomienda desactivarlos para que nada aparezca dos veces: las dos páginas de
Ajustes, dos contextos inyectados en el modelo, dos pestañas de Contexto, etc.

## Dónde se guardan los datos

| Archivo | Contenido |
|---|---|
| `$DSH_HOME/dsh-total-config/settings.json` | Orden de categorías de Ajustes y los nueve interruptores. |
| `$DSH_HOME/dsh-total-config/workspace.json` | Descripciones, prompts, entradas y aspecto de cada espacio, y carpetas de contexto por sesión. |
| `$DSH_HOME/dsh-total-config/default-model.json` | Modelo fijado para chats nuevos. |
| `$DSH_HOME/dsh-total-config/github/` | Caché inmutable de las carpetas de GitHub instaladas. |

Todos los documentos se escriben con permisos de solo propietario y sin secretos.

Para no perder lo que ya tenías, la primera lectura **migra** los datos
anteriores cuando todavía no existe el archivo propio:

- `$DSH_HOME/dsh-config/settings.json` → orden y los tres interruptores que
  compartía DSH Config;
- `$DSH_HOME/workspace-context/context.json` → contexto de espacios y sesiones;
- `$DSH_HOME/default-model/settings.json` → modelo fijado.

La migración es de solo lectura hasta el primer guardado; a partir de ahí manda
el archivo nuevo. Los archivos antiguos no se modifican ni se borran.

## Rutas del Host

Todas viven bajo `/dsh-total-config`, exigen la cabecera `x-dsh-total-config: 1`
y responden JSON:

| Ruta | Método | Uso |
|---|---|---|
| `/settings` | GET, POST | Orden de categorías e interruptores. |
| `/github` | POST | Resolver una carpeta de GitHub a una ruta local. |
| `/model/state`, `/model/selection` | GET, POST | Catálogo y modelo predeterminado. |
| `/workspaces/health`, `/workspaces/presentation` | GET | Recuento y aspecto de los espacios. |
| `/workspace/state`, `/workspace/save` | GET, POST | Contexto de un espacio. |
| `/session/context`, `/session`, `/session/entries`, `/session/entries/remove` | GET, POST | Carpetas de contexto de una sesión. |
| `/deepseek` | GET, POST | Estado y cambio de las filas de DeepSeek. |
| `/legacy` | GET, POST | Detección y desactivación de los bundles anteriores. |

Las rutas de cada comportamiento respetan su interruptor: si está apagado
responden `403` con `feature-disabled`, así el Host no ejecuta trabajo que la
página ha desactivado.

## Instalación

Con el gestor de complementos, instala esta carpeta como bundle:

```text
@local/dsh-total-config  →  /ruta/a/dsh-plugins/local_dsh-total-config
```

y **recarga la pestaña** para que se cargue la mitad de cliente y aparezca la
página nueva. También puedes enlazarla a mano en el perfil:

```json
{
  "dependencies": {
    "@local/dsh-total-config": "link:/ruta/a/dsh-plugins/local_dsh-total-config"
  },
  "dsh": {
    "profile": {
      "bundles": ["@local/dsh-total-config"]
    }
  }
}
```

Al activarse, el bundle desactiva las filas `llm-deepseek`,
`llm-deepseek-account` y `ui-settings-account`, igual que hacía
`hide-deepseek-defaults`. Desactivar el bundle completo restaura esas filas,
porque la desactivación vive en su parche y no en el parche del usuario.

## Comprobación

```bash
node local_dsh-total-config/test/check.mjs
```

Valida el manifiesto, el parche, los textos, el icono, la sintaxis de las dos
mitades y, con un `DSH_HOME` temporal, el documento de ajustes, la migración
desde DSH Config, el almacén de contextos, las restricciones por interruptor en
las rutas y el puente con el gestor de complementos (con un gestor simulado).

La comprobación visual (página de Ajustes, control de modelo, página de
proyecto, pestaña Contexto y avisos) requiere abrir la interfaz y revisar cada
interruptor; el test no la sustituye.

## Límites conocidos

- **Ocultar avisos de actualización** solo cubre la página web. El menú nativo
  **DeepSeek Harness → Check for Updates…** y la ventana de actualización
  obligatoria del shell están fuera de la página.
- **Ocultar los modelos por defecto de DeepSeek** no borra credenciales,
  sesiones ni mensajes: solo desactiva las rutas y su interfaz. El buscador web
  de DeepSeek usa `DEEPSEEK_API_KEY` y no depende de esas filas.
- Los avisos de versión nueva de **complementos** en **Ajustes → Complementos**
  son del gestor de complementos y no se ocultan.
- El reordenado de categorías y la etiqueta de esfuerzo dependen de la estructura
  del shell (barra de Ajustes y compositor). Si una versión futura cambia esos
  puntos de anclaje, el complemento deja de aplicar ese comportamiento sin
  romper nada; en ese caso hay que revisar `client.js`.
