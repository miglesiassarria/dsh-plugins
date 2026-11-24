// Oculta la acción de añadir espacios de trabajo en pantallas móviles.
const WS_LABELS = ['Agregar espacio de trabajo', 'Agregar espacio de trabajo…', 'Añadir espacio de trabajo', 'Añadir espacio de trabajo…', '添加工作区', '添加工作区…', 'Add workspace', 'Add workspace…']

export function startFileGuard(): () => void {
  const checkOne = (node: Node): void => {
    if (node.nodeType !== 1) return
    const el = node as HTMLElement
    const txt = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim()
    if (WS_LABELS.includes(txt)) {
      el.style.display = 'none'
      el.setAttribute('data-mobile-nav-hide', 'add-workspace')
    }
  }
  const sel = '[role="menuitem"],[role="option"],li,button,a'
  document.querySelectorAll(sel).forEach(checkOne)
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return
        checkOne(n)
        ;(n as HTMLElement).querySelectorAll?.(sel).forEach(checkOne)
      })
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
  return () => observer.disconnect()
}
