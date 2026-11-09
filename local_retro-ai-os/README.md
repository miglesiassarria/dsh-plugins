# Retro AI OS

Un tema visual reversible para DeepSeek Harness inspirado en los escritorios pixelados de los años 90. Añade una sección propia en **Ajustes → Retro AI OS**, cuatro estilos seleccionables, un compañero pixelado que refleja el estado real de la sesión y preferencias que sobreviven a los reinicios.

## Qué añade

- **Cuatro estilos**: Menta clásica, CRT ámbar, Vaporwave y Azul medianoche. Cada uno incluye una paleta coherente para los esquemas claro y oscuro, de modo que el control de apariencia de Harness sigue funcionando.
- **Interruptor de activación** con `role="switch"` y estado `aria-checked`.
- **Compañero pixelado** en la zona inferior del compositor. Refleja cuatro estados reales:
  - trabajando (sesión en ejecución),
  - esperando tu respuesta (interacción pendiente),
  - turno terminado (fin de ejecución, durante unos segundos),
  - preparado (sesión abierta sin actividad).
- **Barra de estado** con nombre del estilo, estado y testigo luminoso.
- **Opciones** para mostrar u ocultar el compañero y para desactivar las animaciones discretas.

## Reversibilidad

El estilo se aplica como una capa de tokens mediante `ctx.theme.overrideTokens(...)`. Al desactivar el interruptor se elimina esa capa y reaparecen exactamente los colores originales del tema activo. No se sustituyen componentes, no se ocultan controles y no se modifica el comportamiento interno de Harness.

## Persistencia

La mitad Host guarda `{ enabled, style, mascot, animation }` en:

```
$DSH_HOME/retro-ai-os/preferences.json
```

y lo sirve en la ruta de mismo origen `GET/POST /dsh-retro-ai-os/preferences`, protegida por la cabecera `x-dsh-retro-ai-os: 1`. La mitad Cliente la lee al activarse y la actualiza en cada cambio. Al reiniciar Harness, el estilo y las opciones se restauran automáticamente.

## Accesibilidad

- Etiquetas explícitas y navegación por teclado en el selector de estilos (radios nativos).
- Anillo de foco visible, contraste alto en las cuatro paletas.
- Animaciones desactivables y respeto a `prefers-reduced-motion`.
- El compañero usa `role="status"` y `aria-live="polite"`; el arte es decorativo (`aria-hidden`).

## Verificación

```bash
node --check index.js
node --check client.js
node test/host-check.mjs
```

La prueba cubre lectura/escritura de preferencias, actualización parcial, rechazo de estilos desconocidos y peticiones sin la cabecera.
