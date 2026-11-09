# Ocultar los modelos por defecto de DeepSeek

Bundle local que retira de DeepSeek Harness los dos proveedores integrados de
DeepSeek:

- **Cuenta DeepSeek** (`deepseek-account`), que aparece en la lista de modelos
  del chat y como fila en **Ajustes → Modelos** mientras hay una sesión
  iniciada.
- **DeepSeek** (`deepseek-official`), el proveedor oficial por clave API, que
  aparece como fila con el punto rojo cuando no hay clave configurada.

Además oculta la página **Cuenta** de Ajustes y el lanzador de cuenta de la
barra lateral, porque sin la ruta de cuenta no tienen nada que configurar.

Tus proveedores añadidos (por ejemplo **Nexo** u **opencode-go**) y sus modelos
no se tocan.

## Qué cambia

El paquete solo aplica un parche de composición; no ejecuta código en el host
ni en el navegador. Desactiva tres filas del perfil:

| Fila | Qué elimina |
|---|---|
| `llm-deepseek` | El proveedor oficial por clave API y sus modelos. |
| `llm-deepseek-account` | La ruta de modelos de la cuenta DeepSeek. |
| `ui-settings-account` | La página Cuenta y el menú de cuenta de la barra lateral. |

El selector de modelos del chat y la página **Modelos** leen el catálogo de
rutas registradas, así que al desaparecer las rutas desaparecen también sus
grupos y filas. No se borran credenciales, sesiones ni mensajes: la cuenta
sigue guardada aunque su interfaz quede oculta.

## Instalación

Con el gestor de complementos de la GUI, instala esta carpeta como bundle
(`install_bundle` sobre la ruta absoluta de esta carpeta) y recarga la página.
También puedes enlazarla a mano en el perfil:

```json
{
  "dependencies": {
    "@local/hide-deepseek-defaults": "link:/ruta/a/dsh-plugins/local_hide-deepseek-defaults"
  },
  "dsh": {
    "profile": {
      "bundles": ["@local/hide-deepseek-defaults"]
    }
  }
}
```

Después de instalar, recarga la pestaña del navegador para que el cliente web
vuelva a componer la lista de plugins.

## Volver a mostrarlos

Elimina el bundle desde el gestor de complementos o quita sus entradas de
`cordis.patch.yml`. Si solo quieres recuperar la página **Cuenta** pero seguir
ocultando los modelos de DeepSeek, borra únicamente la entrada
`ui-settings-account`.

## Efectos a tener en cuenta

- Si una sesión tenía seleccionado un modelo de DeepSeek, el selector mostrará
  «Selecciona un modelo» hasta que elijas uno de tus proveedores. El modelo
  guardado no se borra.
- Si usabas la página Cuenta para cerrar sesión o recargar saldo, deja de estar
  disponible mientras el bundle esté activo. Quita `ui-settings-account` del
  parche si la necesitas.
- El buscador web de DeepSeek usa `DEEPSEEK_API_KEY`, no este proveedor de
  chat; este bundle no lo desactiva.

## Comprobación

```bash
node local_hide-deepseek-defaults/test/check.mjs
```

El test valida que el parche declare las tres filas desactivadas, que los
locales sean JSON válido y que el icono sea un SVG.
