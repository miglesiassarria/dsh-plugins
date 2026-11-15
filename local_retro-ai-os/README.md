# Retro AI OS

Un tema visual reversible para DeepSeek Harness inspirado en los escritorios pixelados de los años 90. Añade una sección propia en **Ajustes → Retro AI OS**, cinco estilos seleccionables, un compañero pixelado que refleja el estado real de la sesión, **marca propia** (texto, logo y tipografía para la barra lateral y la portada) y preferencias que sobreviven a los reinicios.

## Qué añade

- **Cinco estilos**: Menta clásica, CRT ámbar, Vaporwave, Azul medianoche y Matrix. Matrix conserva su estética oscura en ambos modos de apariencia y añade lluvia digital tenue en los laterales y tipografía monoespaciada. Los demás estilos ofrecen paletas claras y oscuras.
- **Interruptor de activación** con `role="switch"` y estado `aria-checked`.
- **Compañero pixelado** en la zona inferior del compositor. Refleja cuatro estados reales:
  - trabajando (sesión en ejecución),
  - esperando tu respuesta (interacción pendiente),
  - turno terminado (fin de ejecución, durante unos segundos),
  - preparado (sesión abierta sin actividad).
- **Barra de estado** con nombre del estilo, estado y testigo luminoso.
- **Aviso de sesión terminada**: en Matrix, una sesión que termina un turno sin abrirse marca su fila con el punto verde del anfitrión, pero con el núcleo algo más grueso y un halo del mismo verde para que se lea sobre la lluvia de fondo. El resto de estilos conserva el marcador original.
- **Opciones** para mostrar u ocultar el compañero y para desactivar las animaciones discretas.
- **Marca propia** (04 / Marca propia):
  - **Texto** independiente para la barra lateral y para el título de la portada, con 48 caracteres como máximo. Vacío = sin texto.
  - **Logo** en cada superficie con tres estados: *Original* (la ballena de DeepSeek), *Propio* (tu imagen) o *Ninguno* (sin marca).
  - **Imagen propia** compartida por ambas superficies: PNG, JPG, WebP, GIF o SVG de hasta 400 KB, con miniatura, cambio y borrado.
  - **Tamaño del logo** con un deslizador del 50 % al 150 %: escala solo tu imagen, con la vista previa al día; la ballena original conserva su tamaño.
  - **Etiqueta «Vista previa»** de la portada: se puede ocultar.
  - **Tipografía** entre once opciones con vista previa real: sistema, Arcade (Press Start 2P), Terminal (VT323), Orbitron, Neón (Monoton), Romana (Cinzel), Editorial (Bricolage Grotesque), Syne, Bebas (Bebas Neue), Bungee y Mono (IBM Plex Mono). Cada familia trae su propio ajuste de escala para que el texto no desborde.
  - **Vista previa en vivo** de las dos superficies y botón **Restaurar marca**.

## Cómo funciona la marca propia

La mitad Cliente ocupa los huecos que el propio Harness declara para la marca, sin sustituir componentes ni controles:

- `sidebar.brand.mark` y `sidebar.brand.name` para el logo y el nombre de la barra lateral.
- `conversation.hero.brand.mark` para la ballena de la portada.
- El **titular de la portada** no tiene hueco propio: se parchea en el DOM (`[class*="_titleGroup"]`) guardando el texto original en `data-retro-original-text` y reponiéndolo al desactivar la marca. Un `MutationObserver` vuelve a aplicar el parche si React vuelve a pintar el titular (cambio de idioma o remontaje).

Cada registro es condicional: si la marca propia está apagada, o una superficie sigue en *Original*, el plugin **no ocupa** ese hueco y Harness pinta exactamente su marca de siempre (incluida la animación de la ballena al pasar el ratón). Al desactivar el interruptor se retiran las capas, los atributos y las variables CSS.

## Tipografías

Las once familias se sirven desde el propio plugin como subconjuntos latinos WOFF2 (`fonts/`, ~170 KB en total) mediante `@font-face` y la ruta de mismo origen `GET /dsh-retro-ai-os/fonts/<archivo>.woff2`. No se llama a Google Fonts en tiempo de ejecución y el tema funciona sin conexión. Las licencias SIL OFL 1.1 de cada familia están en [`fonts/LICENSES.md`](fonts/LICENSES.md).

## Reversibilidad

El estilo se aplica como una capa de tokens mediante `ctx.theme.overrideTokens(...)`. Al desactivar el interruptor se elimina esa capa y reaparecen exactamente los colores originales del tema activo. La marca propia se retira del mismo modo: se liberan los huecos de los slots, se restauran los atributos del titular y se eliminan las variables CSS. No se sustituyen componentes, no se ocultan controles y no se modifica el comportamiento interno de Harness.

## Persistencia

La mitad Host guarda el documento en:

```
$DSH_HOME/retro-ai-os/preferences.json
```

```json
{
  "version": 2,
  "enabled": true,
  "style": "classic",
  "mascot": true,
  "animation": true,
  "brand": {
    "on": true,
    "seeded": true,
    "sidebarText": "Mi estudio",
    "heroText": "Hacia lo desconocido",
    "sidebarMark": "custom",
    "heroMark": "none",
    "font": "neon",
    "badge": false,
    "asset": { "url": "/dsh-retro-ai-os/assets/brand-4f2a.png", "label": "logo.png" }
  }
}
```

Rutas de mismo origen:

| Ruta | Método | Cabecera `x-dsh-retro-ai-os: 1` | Uso |
| --- | --- | --- | --- |
| `/dsh-retro-ai-os/preferences` | GET / POST | Obligatoria | Leer y guardar preferencias (fusión parcial en el POST). |
| `/dsh-retro-ai-os/brand-asset` | POST / DELETE | Obligatoria | Subir (data URL base64) o borrar el logo propio. |
| `/dsh-retro-ai-os/assets/<archivo>` | GET | No | Servir el logo subido (nombre con hash de contenido). |
| `/dsh-retro-ai-os/fonts/<archivo>.woff2` | GET | No | Servir las tipografías incluidas. |

Las lecturas estáticas no piden la cabecera porque `<img>` y `@font-face` no pueden enviarla; se validan con una lista blanca de nombres y tamaño. Los logos se guardan en `$DSH_HOME/retro-ai-os/brand/` con permisos privados, se comprueba su firma real (PNG/JPEG/GIF/WebP/SVG) y al subir uno nuevo se borra el anterior. El cuerpo de la petición está limitado a 720 KB y la imagen a 400 KB.

Al reiniciar Harness, el estilo, las opciones y la marca se restauran automáticamente.

## Accesibilidad

- Etiquetas explícitas y navegación por teclado en el selector de estilos (radios nativos) y en el de tipografías.
- El selector de logo usa un `radiogroup` con `aria-checked`; los interruptores usan `role="switch"`.
- Anillo de foco visible y paletas de alto contraste.
- Animaciones desactivables y respeto a `prefers-reduced-motion`; la lluvia Matrix queda inmóvil en ambos casos y no intercepta clics.
- El compañero usa `role="status"` y `aria-live="polite"`; el arte es decorativo (`aria-hidden`). La marca de la barra lateral mantiene el `aria-hidden` del anfitrión.

## Verificación

```bash
node --check index.js
node --check client.js
node test/host-check.mjs
node test/client-smoke.mjs
```

- `host-check.mjs`: preferencias (lectura, escritura, fusión parcial, saneado de texto), rechazo de estilo/logo/tipografía/deslizador desconocidos, límites de la escala del logo (50–150 %), subida y descarga del logo con validación de firma, lista blanca de tipografías, rutas estáticas sin cabecera y peticiones no autorizadas.
- `client-smoke.mjs`: banco sin navegador (React mínimo, DOM simulado) que aplica el plugin, comprueba los slots registrados, el parche del titular con su restauración, el cambio de tipografía y el renderizado de la tarjeta de Ajustes.
