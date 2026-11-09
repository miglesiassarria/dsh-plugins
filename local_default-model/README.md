# @local/default-model

Elige el modelo con el que empiezan los chats nuevos desde **Ajustes → Modelos**.
El control aparece arriba del todo de esa página, a la izquierda de
*«Abrir archivo de configuración»*, y solo mientras esa página está abierta.

## Qué hace

- Guarda un **modelo predeterminado** propio y lo aplica a cada chat nuevo.
- Al elegirlo, actualiza también las sesiones **vacías** que la GUI reutiliza
  como próximo chat, aunque no se cree un agente nuevo.
- Cada sesión sigue pudiendo cambiar de modelo cuando quiera. Ese cambio afecta
  a esa conversación, **no** al valor predeterminado elegido aquí.
- Las conversaciones que ya han empezado conservan su modelo: el plugin solo
  actúa sobre sesiones sin ningún turno iniciado.

## Cómo está hecho

| Mitad | Archivo | Papel |
|---|---|---|
| Host | [`index.js`](index.js) | Guarda el pin, sirve la ruta same-origin y prepara las sesiones nuevas |
| Cliente | [`client.js`](client.js) | Selector en la cabecera de **Modelos**, visible solo en esa página |
| Textos | [`locale/en.json`](locale/en.json), [`locale/es.json`](locale/es.json) | Metadatos e idiomas |
| Entrada | [`cordis.patch.yml`](cordis.patch.yml) | Inserta la fila `default-model` |

El selector se registra en el hueco `settings.action` de la barra superior de
Ajustes. Como ese hueco es común a todas las páginas, un componente invisible
en `settings.models.footer` informa de cuándo la página **Modelos** está
montada; el selector se muestra solo entonces.

El Host expone una única ruta, `/dsh-default-model`:

- `GET /state` — selección guardada, catálogo agrupado por proveedor y fallos de
  carga aislados.
- `POST /selection` — valida `{ provider, model, reasoningEffort? }` contra el
  catálogo vivo, guarda el pin y sincroniza las sesiones vacías.

La ruta exige la cabecera `x-dsh-default-model: 1`; al ser una cabecera
personalizada, cualquier llamada desde otro origen necesita un preflight CORS
que la ruta no responde.

## Persistencia

`$DSH_HOME/default-model/settings.json` (por defecto
`~/.dsh/default-model/settings.json`), con permisos `0600` y escritura atómica:

```json
{
  "version": 1,
  "selection": { "provider": "nexo", "model": "openai/gpt-6-luna" }
}
```

No contiene secretos: solo los identificadores que ya muestra la página de
Modelos. Si el archivo no existe, el plugin adopta el modelo predeterminado
actual del despliegue y lo guarda como punto de partida.

## Instalación

Copia la carpeta al directorio de plugins locales y enlázala en el perfil, o
instálala con el gestor de complementos de la GUI (escribe esas entradas por
ti). El paquete es autocontenido: no tiene dependencias ni build.

```json
{
  "dependencies": {
    "@local/default-model": "link:/Users/tu-usuario/.dsh/local-plugins/local_default-model"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "@local/default-model"
      ]
    }
  }
}
```

## Pruebas

```bash
node test/host-check.mjs
node test/render-check.mjs
```

La primera prueba levanta un `DSH_HOME` temporal y cubre la ruta, la validación
del catálogo, la persistencia, la adopción del valor actual, la creación de
sesiones, la reutilización de sesiones vacías y los casos que no deben tocarse
(subagentes, forks y sesiones con turnos). La segunda carga `client.js` en una
VM con un renderizador React mínimo y comprueba los dos registros, la
visibilidad por página, las opciones agrupadas, el guardado y los errores.
