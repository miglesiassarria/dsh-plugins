/** Diccionarios del espacio de nombres `mobileNav`: controles del cajón lateral. */
export const NS = 'dsh-mobile-nav'

/** Diccionario en español (idioma único de esta distribución). */
export const es = {
  'open': 'Abrir el menú',
  'close': 'Cerrar el menú',
  'backdrop': 'Pulsa para cerrar el menú',
  'sessionLog': 'Registro de la sesión',
  'files': 'Archivos',
} as const

/** El móvil se muestra siempre en español. */
export const en: Record<MobileNavKey, string> = es
export const zh: Record<MobileNavKey, string> = es

/** Dominio de claves del espacio de nombres `mobileNav`. */
export type MobileNavKey = keyof typeof es
