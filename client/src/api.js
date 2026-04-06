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
