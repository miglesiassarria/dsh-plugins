# DSH Config

Complemento de configuración del Harness. Su primera funcionalidad reordena
las categorías de la barra izquierda de **Ajustes** arrastrándolas con el ratón
y guarda ese orden como configuración del Harness.

| Elemento | Valor |
|---|---|
| Paquete | `@local/dsh-config` |
| Fila del perfil | `dsh-config` |
| Ruta del Host | `/dsh-config/settings` |
| Documento persistido | `$DSH_HOME/dsh-config/settings.json` |
| Mitad de cliente | sí (`client.js`), se carga con la página |

## Qué hace

- Al abrir **Ajustes → categorías de la izquierda**, cada categoría se puede
  arrastrar hacia arriba o hacia abajo. Una línea de inserción marca dónde
  caerá y una copia flotante acompaña al puntero.
- Al soltar, la categoría se coloca en esa posición. El orden se aplica al
  momento en la barra y se guarda en `$DSH_HOME/dsh-config/settings.json`.
- El orden guardado se aplica al cargar la página y cuando aparece una
  categoría nueva. Las categorías que aparecen después de guardar el orden se
  añaden al final.
- `Alt+↑` y `Alt+↓` mueven la categoría enfocada con el teclado; los lectores
  de pantalla reciben el aviso de la nueva posición.
- En pantallas estrechas la barra pasa a ser horizontal y el arrastre funciona
  igual, en ese eje.

El orden vive en el Host, no en `localStorage`: sobrevive a recargas, cambios de
navegador y reinicios, y se puede incluir en las copias de seguridad. El
documento no contiene secretos.

## Cómo está hecho

- **Host (`index.js`)**: servicio `webServer` y ruta de mismo origen
  `/dsh-config/settings`. `GET` devuelve el documento; `POST` valida
  (`settingsOrder` es una lista de ids únicos, hasta 128, de 200 caracteres) y
  escribe de forma atómica con permisos `0600`.
- **Cliente (`client.js`)**: escucha el puntero sobre la barra que ya renderiza
  el Harness, pinta la línea de inserción y la copia flotante en `body`, y al
  soltar reordena las entradas reales del slot `settings.section`
  (`options.order`) y avisa al shell con una mutación de versión del slot para
  que vuelva a pintar la barra. No reimplementa el panel de Ajustes ni mueve
  nodos de React a mano.
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

## Prueba del Host

```bash
node test/host-check.mjs
```

Comprueba el documento por defecto, la escritura atómica, el `GET`/`POST`, el
rechazo sin cabecera, la validación y la recuperación ante un fichero corrupto.

## Limitaciones conocidas

- El orden se aplica a las categorías que existan en ese momento; una categoría
  nueva se añade al final hasta que se vuelva a arrastrar.
- La línea de inserción y la copia flotante se dibujan fuera del árbol de React;
  si el Harness cambia la estructura del panel (`nav > div > button`) habrá que
  ajustar los selectores de `client.js`.
