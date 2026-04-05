/**
 * normalize.js
 *
 * Funciones auxiliares puras (no tocan la BD) para limpiar y estandarizar
 * los datos que llegan del cliente antes de guardarlos o compararlos.
 * Las separo aquí para poder reutilizarlas en cualquier ruta sin repetir código.
 */

/**
 * Convierte un email a minúsculas y elimina espacios.
 * Así "  Usuario@Gmail.com  " y "usuario@gmail.com" se tratan como la misma cuenta.
 */
const normalizeEmail = (email) =>
  String(email ?? "")
    .trim()
    .toLowerCase();

/**
 * Normaliza el título de un juego: elimina espacios sobrantes en los extremos
 * y colapsa múltiples espacios internos en uno solo.
 * Ejemplo: "  The  Witcher  3  " → "The Witcher 3"
 */
function normalizeGameTitle(t) {
  return String(t ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Devuelve la clave de comparación para detectar duplicados por título.
 * Pasa todo a minúsculas para que "zelda" y "Zelda" cuenten como el mismo juego.
 */
function titleMatchKey(t) {
  return normalizeGameTitle(t).toLowerCase();
}

/**
 * Garantiza que la plataforma nunca quede vacía.
 * Si el usuario no escribe nada, asignamos "PC" como valor por defecto.
 */
function normalizePlataforma(p) {
  const s = String(p ?? "").trim();
  return s || "PC";
}

/**
 * Traduce el estado del juego al valor que acepta la base de datos.
 * Admite tanto los términos en español (que usa la UI) como en inglés
 * (por si algún cliente alternativo envía otro idioma).
 * Si el valor no coincide con ninguno conocido, lo devuelve tal cual
 * y PostgreSQL aplicará su propio CHECK de validación.
 */
function normalizeEstadoForDb(estado) {
  const s = String(estado ?? "").trim();
  const map = {
    Pendiente: "Pendiente",
    Jugando: "Jugando",
    Completado: "Completado",
    Backlog: "Pendiente",   // alias en inglés
    Playing: "Jugando",
    Completed: "Completado",
  };
  return map[s] || s;
}

/**
 * Extrae y valida la referencia al catálogo externo (RAWG o Steam) del body.
 * Devuelve { source, id } si es válida, o null si no viene o está mal formada.
 * Esto nos permite vincular la ficha del usuario con el juego del catálogo global.
 */
function parseCatalogoRef(body) {
  const ref = body?.catalogo_ref;
  if (!ref || typeof ref !== "object") return null;

  const source = String(ref.source ?? "").toLowerCase();
  const id = ref.id;

  if (source !== "rawg" && source !== "steam") return null;

  const num = Number(id);
  if (!Number.isFinite(num) || num <= 0) return null;

  return { source, id: num };
}

/**
 * Construye el objeto de error que se devuelve al cliente.
 * En producción solo se muestra un mensaje genérico; en desarrollo
 * se añade el detalle técnico para facilitar la depuración.
 */
function serverErrorPayload(err, fallbackMsg) {
  const out = { error: fallbackMsg };
  if (process.env.NODE_ENV !== "production" && err?.message) {
    out.detail = err.message;
  }
  if (err?.code) out.code = err.code;
  return out;
}

/**
 * Crea una señal de timeout compatible con la API fetch nativa.
 * Necesaria porque fetch() no tiene timeout incorporado.
 * Si el navegador ya soporta AbortSignal.timeout() lo usa directamente;
 * si no, crea un AbortController manualmente (fallback para Node < 17.3).
 */
function fetchTimeoutMs(ms) {
  if (
    typeof AbortSignal !== "undefined" &&
    typeof AbortSignal.timeout === "function"
  ) {
    return AbortSignal.timeout(ms);
  }
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

module.exports = {
  normalizeEmail,
  normalizeGameTitle,
  titleMatchKey,
  normalizePlataforma,
  normalizeEstadoForDb,
  parseCatalogoRef,
  serverErrorPayload,
  fetchTimeoutMs,
};
