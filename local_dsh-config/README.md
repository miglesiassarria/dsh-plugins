# DSH Config

Complemento para ajustar el comportamiento por defecto del Harness. Ahora
mismo ofrece tres comportamientos, cada uno con su interruptor en **Ajustes →
DSH Config**: reordenar las categorías de la barra izquierda de Ajustes
arrastrándolas, permitir que **Agregar un complemento** acepte una URL de GitHub
que apunte a una carpeta dentro de un repositorio y limpiar la etiqueta de
esfuerzo predeterminado del selector de modelo del compositor.

| Elemento | Valor |
|---|---|
| Paquete | `@local/dsh-config` |
| Fila del perfil | `dsh-config` |
| Rutas del Host | `/dsh-config/settings`, `/dsh-config/github` |
| Documento persistido | `$DSH_HOME/dsh-config/settings.json` (orden + interruptores `features`) |
| Copia de carpetas de GitHub | `$DSH_HOME/dsh-config/github/<propietario>__<repo>/<commit>/<carpeta>` |
| Mitad de cliente | sí (`client.js`), se carga con la página |

## Qué hace

### Página DSH Config

- La barra izquierda de **Ajustes** incluye una categoría **DSH Config**, con su
  propio icono y una página con un interruptor por cada comportamiento del
  complemento.
- Los tres interruptores empiezan activados. Al desactivar uno, ese
  comportamiento deja de aplicarse al momento; al volver a activarlo, se aplica
  de nuevo con las preferencias guardadas.
- Los cambios se guardan en el Host (`features` de
  `$DSH_HOME/dsh-config/settings.json`), así que sobreviven a recargas y
  reinicios.
- La propia categoría se puede reordenar como las demás cuando la opción de
  reordenar está activa.

### Orden de las categorías de Ajustes

- Al abrir **Ajustes**, cada categoría de la barra izquierda se puede arrastrar
  hacia arriba o hacia abajo. Una línea de inserción marca dónde caerá y una
  copia flotante acompaña al puntero.
- Al soltar, la categoría se coloca en esa posición. El orden se aplica al
  momento en la barra y se guarda en `$DSH_HOME/dsh-config/settings.json`.
- El orden guardado se aplica al cargar la página y cuando aparece una
  categoría nueva. Las categorías que aparecen después de guardar el orden se
  añaden al final.
- `Alt+↑` y `Alt+↓` mueven la categoría enfocada con el teclado; los lectores
  de pantalla reciben el aviso de la nueva posición.
- En pantallas estrechas la barra pasa a ser horizontal y el arrastre funciona
  igual, en ese eje.
- El puntero no cambia de forma: se mantiene la flecha al pasar por encima y
  mientras se arrastra.

El orden vive en el Host, no en `localStorage`: sobrevive a recargas, cambios de
navegador y reinicios. El documento no contiene secretos.

### Selector de modelo del compositor

- El selector de modelo del compositor muestra el nombre del modelo y, detrás,
  el esfuerzo de razonamiento. Cuando el esfuerzo vale el valor predeterminado
  del proveedor, esa etiqueta («Predeterminado» / «Default») se oculta.
- Los esfuerzos no predeterminados («Alto», «Bajo»…) siguen visibles, y la
  opción de volver al predeterminado sigue en el menú del modelo.
- La etiqueta accesible del control conserva la selección completa.

### Instalar desde una carpeta de GitHub

En **Complementos → Agregar complemento** puedes pegar una URL de carpeta, por
ejemplo:

```text
https://github.com/miglesiassarria/dsh-plugins/tree/main/local_retro-ai-os
```

El diálogo normal de instalación la acepta: el Host descarga solo esa carpeta
(no el repositorio entero) y la deja como un paquete local; después el mismo
diálogo muestra el nombre, la versión, el progreso de pnpm y el resultado, como
con cualquier ruta local. Si el paquete ya está instalado, el aviso de "ya
instalado" es el de siempre.

- Se admiten URLs con `http(s)://`, con o sin `www.`, y también sin esquema
  (`github.com/usuario/repo/tree/rama/carpeta`).
- La rama o etiqueta se resuelve probando primero la ruta más larga, así que
  funcionan referencias con barras (`feature/x`) y nombres de carpeta.
- La copia queda fijada al commit resuelto y se reutiliza al reintentar; una
  rama que avance no cambia una instalación ya hecha.
- Los errores se muestran bajo el campo: URL que no es una carpeta, repositorio
  o rama inexistente, carpeta sin `package.json`, límite de la API de GitHub,
  carpeta demasiado grande, enlaces simbólicos o submódulos.

## Qué modifica

Todo lo que el complemento toca en el Harness, superficie por superficie:

| Superficie | Cambio |
|---|---|
| Categoría de Ajustes | Registra la sección `dsh-config` con la etiqueta «DSH Config» y su icono en la barra izquierda de Ajustes, con una página propia. |
| Interruptores | La página tiene un `role="switch"` por comportamiento; cada cambio se aplica al momento y se guarda en `features` dentro de `$DSH_HOME/dsh-config/settings.json`. |
| Barra de categorías de Ajustes | Reordena las entradas reales del slot `settings.section` cambiando su `options.order`; el orden se aplica al instante y al volver a cargar la página. |
| Arrastre en la barra | Añade arrastre con puntero (ratón o dedo, umbral de 5 px), línea de inserción, copia flotante, auto-scroll cerca de los bordes y cancelación con Escape. |
| Teclado | `Alt+↑` y `Alt+↓` mueven la categoría enfocada; se anuncia la nueva posición por `aria-live`. |
| Puntero | Fuerza la flecha sobre las categorías (sin mano ni `grab`), también durante el arrastre. |
| Persistencia del orden | Escribe `$DSH_HOME/dsh-config/settings.json` con permisos `0600` mediante `POST /dsh-config/settings`, y lo lee al arrancar. |
| Categorías nuevas | Las que se registren después de guardar el orden se añaden al final. |
| Aviso al shell | Registra y retira una entrada temporal en `settings.section` para que el shell recalcule la barra con el orden nuevo. |
| Diálogo Agregar complemento | Envuelve `inspect` e `installBundle` del namespace remoto `remote.pluginManager`; solo cambia los specs que son URLs de carpeta de GitHub, el resto pasa intacto. |
| Instalación desde GitHub | Descarga solo la carpeta, la fija al commit y la guarda en `$DSH_HOME/dsh-config/github/...`; el diálogo instala esa ruta local como cualquier paquete local, con su progreso y sus errores. |
| Errores del diálogo | Traduce los fallos del resolutor a los mensajes del propio diálogo: URL no válida, repositorio/rama/carpeta inexistente, carpeta sin `package.json`, límite de la API, tamaño excesivo, symlinks o submódulos. |
| Selector de modelo del compositor | Oculta el sufijo de esfuerzo solo cuando vale el valor predeterminado del proveedor; los demás esfuerzos y el menú no cambian. Se puede desactivar desde la página DSH Config. |
| Textos | Registra el namespace de locale `dsh-config` (inglés y español) para los avisos del arrastre y los errores de GitHub. |
| Recursos de página | Añade un `<style>` en `head`, una región `aria-live` y los nodos de línea de inserción y copia flotante en `body`; todo se retira al descargar el complemento. |
| Host | Registra las rutas de mismo origen `/dsh-config/settings` y `/dsh-config/github`, ambas con la cabecera `x-dsh-config: 1`. |
| Composición | La fila `dsh-config` entra en el perfil y el cliente declara dependencia de `@deepseek-ai/dsh-client-locale` y `@deepseek-ai/dsh-client-ui-settings-general`. |

### Lo que no modifica

- No reimplementa el panel de Ajustes ni sustituye sus componentes de React:
  usa los slots existentes y escucha el DOM de la barra y del compositor.
- No cambia el modelo ni el esfuerzo seleccionados, ni las opciones del menú del
  selector; solo oculta la etiqueta visible del esfuerzo predeterminado.
- No altera ninguna instalación que no sea una URL de carpeta de GitHub: nombres
  de paquete, repositorios completos, tarballs y rutas locales siguen igual.
- No modifica el orden de otros slots ni el de otras listas del Harness.
- No escribe fuera de `$DSH_HOME/dsh-config` y no guarda secretos. La
  instalación de paquetes la ejecuta el gestor de complementos del Harness,
  que actualiza el perfil como con cualquier otra instalación.

## Cómo está hecho

- **Host (`index.js`)**: servicio `webServer` con dos rutas de mismo origen.
  `/dsh-config/settings` guarda el orden de categorías; `/dsh-config/github`
  valida la URL y devuelve la ruta local del paquete resuelto. Ambas exigen la
  cabecera `x-dsh-config: 1` y escriben con permisos privados.
- **Resolutor (`github.js`)**: lee la URL, resuelve rama/etiqueta mediante la API
  pública de GitHub, recorre el árbol del commit, descarga solo los archivos de
  la carpeta con concurrencia limitada y valida el `package.json`. No usa
  archivos comprimidos ni escribe fuera de la caché.
- **Cliente (`client.js`)**: envuelve `inspect` e `installBundle` del namespace
  remoto `remote.pluginManager`; si el spec es una URL de carpeta de GitHub lo
  cambia por la ruta local que devuelve el Host, y para cualquier otro spec no
  toca nada. Para el orden, escucha el puntero sobre la barra que ya renderiza el
  Harness, pinta la línea de inserción y la copia flotante en `body`, y al soltar
  reordena las entradas reales del slot `settings.section` (`options.order`) y
  avisa al shell con una mutación de versión del slot. También vigila el
  selector de modelo del compositor y oculta el sufijo de esfuerzo cuando vale
  el valor predeterminado del proveedor; el resto de esfuerzos sigue visible.
  Registra además la sección `dsh-config` de Ajustes, su icono y la página con
  los tres interruptores; cada interruptor activa o desactiva su efecto y
  persiste el cambio.
- **Textos**: `locale/en.json` y `locale/es.json` (incluye `meta.title` y
  `meta.description` para la ficha del complemento).

## Instalación

Añade esta carpeta como bundle del perfil con el gestor de complementos de la
GUI (**Ajustes → Complementos**) o con la herramienta `plugin_manager`
(`action: install_bundle`, `target` = la ruta absoluta de esta carpeta). El
gestor escribe el enlace y la entrada de `dsh.profile.bundles` en el perfil por
ti. Después, recarga la página de la GUI para que el cliente cargue
`client.js`.

Si prefieres hacerlo a mano, enlaza `@local/dsh-config` en el `package.json`
del perfil y añádelo a `dsh.profile.bundles`, como se explica en el README
principal del repositorio.

## Pruebas

```bash
node test/host-check.mjs
node test/github-check.mjs
```

- `host-check.mjs`: documento por defecto, escritura atómica, `GET`/`POST`,
  rechazo sin cabecera, validación del orden y de los interruptores, mezcla de
  cambios parciales y recuperación ante un fichero corrupto.
- `github-check.mjs`: análisis de URLs, resolución de rama, descarga simulada,
  caché por commit, enlaces simbólicos, carpeta sin `package.json` y límite de
  la API.

## Limitaciones conocidas

- El orden se aplica a las categorías que existan en ese momento; una categoría
  nueva se añade al final hasta que se vuelva a arrastrar.
- La línea de inserción y la copia flotante se dibujan fuera del árbol de React;
  si el Harness cambia la estructura del panel (`nav > div > button`) habrá que
  ajustar los selectores de `client.js`.
- Las carpetas de GitHub se leen de repositorios **públicos** y sin
  autenticación; la API anónima tiene un límite de peticiones por hora. Un
  repositorio privado se muestra como no encontrado.
- La instalación enlaza la copia local, como cualquier instalación desde una
  ruta. Las dependencias de npm del paquete no se instalan dentro de esa copia;
  los complementos de este repositorio no las necesitan.
- La copia descargada se conserva en `$DSH_HOME/dsh-config/github` aunque luego
  se desinstale el complemento.
- El cliente se carga al abrir la página: tras instalar o actualizar DSH Config
  hay que recargar la pestaña de la GUI.
