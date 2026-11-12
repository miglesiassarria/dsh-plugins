/**
 * DSH Hide Updates — Client half.
 *
 * The desktop shell publishes pending-update state to the Web page through its
 * preload bridge, and `@deepseek-ai/dsh-client-ui-settings-general` renders it
 * in two places: the update button beside Settings at the sidebar foot and the
 * dot on the collapsed sidebar expand button. Neither is a replaceable slot, so
 * this plugin owns one stylesheet that removes both while it is active.
 *
 * The stylesheet is registered inside `apply` and removed when the bundle is
 * disabled, so nothing is hidden unless the plugin is active.
 *
 * @module @local/hide-updates
 */

window.__ModuleLoader__.load({
  id: '@local/hide-updates',
  factory() {
    const STYLE_ID = 'dsh-hide-updates-style'

    // `_triggerRow` / `_railRow` are the CSS-module locals of the Settings root
    // row; `_indicator` is the update button inside it and `aria-disabled` is
    // set on every phase (including `false`). CSS-module class names keep the
    // local name as their suffix (`<hash>_indicator`), so these stay valid
    // across builds. The collapsed-sidebar dot is the image-role glyph inside
    // its own slot, so only that glyph is hidden and the seat stays usable.
    const CSS = `
      [class*="_triggerRow"] button[class*="_indicator"][aria-disabled],
      [class*="_railRow"] button[class*="_indicator"][aria-disabled] {
        display: none !important;
      }
      [data-slot="sidebar.toggle.badge"] [role="img"] {
        display: none !important;
      }
    `

    return {
      inject: [],
      apply(ctx) {
        ctx.effect(() => {
          const style = document.createElement('style')
          style.id = STYLE_ID
          style.textContent = CSS
          document.head.append(style)
          return () => {
            style.remove()
          }
        }, 'hide-updates: stylesheet')
      },
    }
  },
})
