/**
 * URL base del backend. Se puede sobreescribir en producción
 * con la variable de entorno `VITE_API_URL` en el fichero `.env` del cliente.
 * @constant {string}
 */
export const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

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
 * Envoltorio de `fetch` que añade automáticamente las cabeceras de autenticación
 * y gestiona de forma centralizada la expiración del token (HTTP 401).
 *
 * Si el servidor responde 401, significa que el token ha caducado o es inválido.
 * En ese caso se limpia el localStorage y se recarga la página para que el
 * usuario vuelva a la pantalla de login, en lugar de quedarse en un estado roto.
 *
 * Con esta función no hace falta repetir la comprobación del 401 en cada componente.
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
