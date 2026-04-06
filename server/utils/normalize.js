/**
 * @module normalize
 * @description Funciones puras de normalización para limpiar y estandarizar
 * los datos de entrada antes de guardarlos en la BD o compararlos.
 *
 * Al centralizar aquí estas funciones, cada ruta no necesita repetir la misma
 * lógica de limpieza, lo que reduce errores y mejora la consistencia.
 */

/**
 * Normaliza un email eliminando espacios y convirtiendo a minúsculas.
 * Así "  USER@Gmail.com  " y "user@gmail.com" se tratan como el mismo email.
 *
 * @param {*} email - Valor recibido del cliente (puede ser null/undefined).
 * @returns {string} Email en minúsculas y sin espacios.
 */
const normalizeEmail = (email) =>
  String(email ?? "")
    .trim()
    .toLowerCase();

/**
 * Normaliza el título de un juego colapsando espacios múltiples.
 * Ejemplo: `"  The  Witcher  3  "` → `"The Witcher 3"`.
 *
 * @param {*} t - Título recibido del cliente.
 * @returns {string} Título limpio con un solo espacio entre palabras.
 */
function normalizeGameTitle(t) {
  return String(t ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Genera una clave de comparación de títulos en minúsculas.
 * Usada para detectar duplicados sin importar mayúsculas/minúsculas.
 *
 * @param {string} t - Título a convertir en clave.
 * @returns {string} Título normalizado en minúsculas.
 */
function titleMatchKey(t) {
  return normalizeGameTitle(t).toLowerCase();
}

/**
 * Normaliza la plataforma del juego. Si el usuario no indica ninguna,
 * se asigna "PC" como valor por defecto.
 *
 * @param {*} p - Plataforma recibida del cliente.
 * @returns {string} Nombre de plataforma limpio, o "PC" si estaba vacío.
 */
function normalizePlataforma(p) {
  const s = String(p ?? "").trim();
  return s || "PC";
}

/**
 * Traduce el valor de estado del formulario al valor que espera la base de datos.
 * Acepta tanto español ("Pendiente", "Jugando", "Completado") como inglés
 * ("Backlog", "Playing", "Completed") para que la API sea flexible.
 *
 * @param {string} estado - Estado recibido del cliente.
 * @returns {string} El valor de estado correcto para guardar en la base de datos.
 */
function normalizeEstadoForDb(estado) {
  const s = String(estado ?? "").trim();
  const map = {
    Pendiente: "Pendiente",
    Jugando: "Jugando",
    Completado: "Completado",
    Backlog: "Pendiente", // alias en inglés
    Playing: "Jugando",
    Completed: "Completado",
  };
  return map[s] || s;
}

/**
 * Extrae y valida la referencia al catálogo (RAWG o Steam) del body de la petición.
 * Esta referencia se envía cuando el usuario selecciona un juego del buscador
 * y permite vincular la ficha personal con el catálogo compartido.
 *
 * @param {object} body - `req.body` de Express.
 * @returns {{ source: "rawg"|"steam", id: number } | null} Referencia validada o null.
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
 * Prepara el objeto de error que se devuelve en la respuesta HTTP.
 * En modo desarrollo incluye el mensaje técnico del error para poder depurar.
 * En producción solo devuelve un mensaje genérico para no exponer detalles internos.
 *
 * @param {Error}  err         - El error capturado en el bloque catch.
 * @param {string} fallbackMsg - Mensaje genérico que siempre se muestra.
 * @returns {{ error: string, detail?: string, code?: string }} Objeto de error listo para enviar.
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
 * Crea un temporizador para cancelar peticiones `fetch` que tarden demasiado.
 * Si el entorno lo soporta usa la forma nativa (`AbortSignal.timeout`);
 * si no, hace lo mismo de forma manual con `AbortController` y `setTimeout`.
 *
 * @param {number} ms - Tiempo máximo de espera en milisegundos.
 * @returns {AbortSignal} Señal que cancela el fetch cuando se agota el tiempo.
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
