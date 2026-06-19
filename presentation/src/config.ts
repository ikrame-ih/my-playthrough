/**
 * URLs de la demo. Opcional: crea `presentation/.env` con VITE_APP_URL y VITE_API_URL
 * si usas otros puertos (por defecto igual que README: cliente 5173, API 3000).
 */
export const APP_DEMO_URL = (import.meta.env.VITE_APP_URL ?? 'http://localhost:5173').replace(
  /\/$/,
  '',
)
export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
)

/** Repositorio público (cambiar en .env si el remoto cambia). */
export const REPO_PUBLIC_URL =
  import.meta.env.VITE_REPO_URL?.replace(/\/$/, '') ??
  'https://github.com/ikihga2223-create/MyPlaythrough'
