# DSH Hide Updates · Ocultar actualizaciones

Complemento de interfaz para **DeepSeek Harness** que, mientras está activo, no
muestra en la página web ninguna seña de que hay una actualización de la
aplicación pendiente: ni el botón **Actualizar** junto a *Configuración*, ni el
punto de nueva versión sobre el botón de la barra lateral plegada.

| | |
|---|---|
| Paquete | `@local/hide-updates` |
| Página de Ajustes | — |
| Interfaz | Ocultar los avisos de actualización |
| Estado | Sin preferencias: se aplica mientras el bundle esté activo |

## Qué hace

El shell de escritorio publica el estado de actualización en la página a través
de su puente de precarga. `@deepseek-ai/dsh-client-ui-settings-general` lo pinta
en dos sitios:

1. un botón **Actualizar** (o el progreso de descarga, verificación e
   instalación) a la derecha de *Configuración*, al pie de la barra lateral;
2. un punto azul sobre el botón que despliega la barra lateral cuando está
   plegada.

Ninguno de los dos es un *slot* reemplazable, así que la mitad de cliente del
complemento registra una hoja de estilos propia que oculta ambos elementos con
`display: none !important`. No se desactiva el actualizador, no se bloquea la
descarga y no se tocan los datos: solo desaparece la superficie visible.

Al desactivar el bundle, el efecto se limpia y los dos controles vuelven a
aparecer en cuanto la página se recarga.

## Qué no cubre

- El menú nativo **DeepSeek Harness → Check for Updates…** vive en Electron,
  fuera de la página, y no se puede ocultar desde un complemento web.
- La ventana de **actualización obligatoria** del shell es independiente de esta
  interfaz y tampoco se suprime.
- Los avisos de versión nueva de **complementos** en *Ajustes → Complementos*
  son otra función del Plugin Manager y siguen visibles.

## Instalación

Copia la carpeta a los complementos locales de tu Harness y declárala como en el
[README principal](../README.md#instalación), o instálala como bundle
local con una ruta absoluta:

```text
@local/hide-updates  →  /ruta/a/dsh-plugins/local_hide-updates
```

Tras instalarlo, **recarga la pestaña** para que se cargue la mitad de cliente.
El bundle se activa por sí solo; no tiene interruptores propios.

## Cómo lo oculta

La hoja de estilos se registra una sola vez, con el id
`dsh-hide-updates-style`, y se retira al desactivar el complemento:

```css
[class*="_triggerRow"] button[class*="_indicator"][aria-disabled],
[class*="_railRow"] button[class*="_indicator"][aria-disabled] { display: none !important; }

[data-slot="sidebar.toggle.badge"] [role="img"] { display: none !important; }
```

Los nombres de clase de los módulos CSS conservan el nombre local como sufijo
(`<hash>_indicator`), de modo que la regla sigue siendo válida aunque cambie el
hash de compilación. El botón se distingue además por llevar siempre
`aria-disabled`, así que el indicador de conexión del mismo pie no se oculta. El
punto del lateral se localiza por su *slot* (`sidebar.toggle.badge`), que es
estable, y solo se oculta el glifo con `role="img"` dentro de él.

Si una versión futura del Harness cambia esos puntos de anclaje, el complemento
deja de ocultar sin romper nada; en ese caso hay que revisar los selectores en
`client.js` y en su comprobación.

## Comprobación

```bash
node local_hide-updates/test/check.mjs
```

Valida el manifiesto, el parche, los textos, el icono y que la mitad de cliente
registra exactamente una hoja de estilos con los selectores previstos, sin tocar
la barra lateral ni el indicador de conexión, y la retira al desactivarse.

No incluye una prueba de navegador: la comprobación visual requiere abrir la
interfaz y confirmar que no hay botón junto a *Configuración* ni punto en la
barra plegada.
