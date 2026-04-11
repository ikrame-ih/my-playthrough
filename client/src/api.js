/**
 * URL base del backend (desarrollo: suele ser `http://localhost:3000`).
 * En producción se define en `client/.env` como `VITE_API_URL` para apuntar al dominio real.
 * @constant {string}
 */
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Genera las cabeceras HTTP necesarias para las peticiones autenticadas.
 * Incluye `Content-Type: application/json` siempre, y añade
 * `Authorization: Bearer <token>` cuando hay un token guardado en localStorage.
 *
 * @returns {object} Objeto de cabeceras listo para pasar a `fetch()`.
 */
export function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * `fetch` con cabeceras JSON + `Authorization: Bearer` si hay token guardado.
 *
 * 401: el JWT caducó o el servidor lo rechazó → se borra token/usuario del almacenamiento
 * local y se recarga la página para volver al login (evita pantallas a medias).
 * Así no hay que repetir el mismo `if (res.status === 401)` en cada componente.
 *
 * @param {string} url     - URL de la petición (relativa o absoluta).
 * @param {object} [opts]  - Opciones adicionales de `fetch` (method, body, etc.).
 * @returns {Promise<Response>} La respuesta del servidor (si no fue 401).
 */
export async function apiFetch(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      ...authHeaders(),
      ...opts.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
    throw new Error("Sesión expirada");
  }

  return res;
}
