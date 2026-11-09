# DSH Config

Complemento para ajustar el comportamiento por defecto del Harness. Ahora
mismo ofrece dos cosas: reordenar las categorías de la barra izquierda de
**Ajustes** arrastrándolas y permitir que **Agregar un complemento** acepte una
URL de GitHub que apunte a una carpeta dentro de un repositorio.

| Elemento | Valor |
|---|---|
| Paquete | `@local/dsh-config` |
| Fila del perfil | `dsh-config` |
| Rutas del Host | `/dsh-config/settings`, `/dsh-config/github` |
| Documento persistido | `$DSH_HOME/dsh-config/settings.json` |
| Copia de carpetas de GitHub | `$DSH_HOME/dsh-config/github/<propietario>__<repo>/<commit>/<carpeta>` |
| Mitad de cliente | sí (`client.js`), se carga con la página |

## Qué hace

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
  avisa al shell con una mutación de versión del slot.
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
  rechazo sin cabecera, validación y recuperación ante un fichero corrupto.
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
