/**
 * @module auth.middleware
 * @description Middlewares de autenticación y autorización para Express.
 *
 * - `authMiddleware`  → verifica que la petición lleve un JWT válido.
 * - `adminMiddleware` → verifica que el usuario autenticado tenga rol 'admin'.
 * - `createToken`     → genera un JWT firmado con los datos del usuario.
 * - `usuarioEsAdmin`  → consulta el rol actual en BD (fuente de verdad).
 */

const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// Si no hay secreto configurado, el servidor no puede firmar ni verificar tokens.
// Es mejor parar en arranque que arrancar con seguridad comprometida.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error(
    "ERROR CRÍTICO: La variable de entorno JWT_SECRET no está definida. " +
    "Añádela al fichero .env antes de arrancar el servidor.",
  );
  process.exit(1);
}

/**
 * Genera un JSON Web Token firmado con los datos básicos del usuario.
 *
 * El token contiene `id`, `email` y `rol` en el payload para que el frontend
 * pueda mostrar menús según el rol sin necesidad de llamadas extra a la API.
 * Sin embargo, en las rutas protegidas siempre se re-comprueba el rol en BD
 * porque el token puede haber sido emitido antes de un cambio de permisos.
 *
 * @param {object} user          - Objeto usuario obtenido de la base de datos.
 * @param {number} user.id       - ID del usuario.
 * @param {string} user.email    - Email del usuario.
 * @param {string} [user.rol]    - Rol ('user' | 'admin'). Por defecto 'user'.
 * @returns {string} JWT firmado con `JWT_SECRET`, con expiración de 7 días.
 */
const createToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, rol: user.rol || "user" },
    JWT_SECRET,
    { expiresIn: "7d" },
  );

/**
 * Middleware Express que comprueba que la petición lleve un JWT válido.
 *
 * Espera la cabecera `Authorization: Bearer <token>`.
 * Si el token es válido, adjunta el payload decodificado en `req.user`
 * y llama a `next()` para continuar con la siguiente función de la cadena.
 *
 * @param {import("express").Request}  req  - Objeto petición de Express.
 * @param {import("express").Response} res  - Objeto respuesta de Express.
 * @param {import("express").NextFunction} next - Función para continuar la cadena de middlewares.
 * @returns {void}
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Token no proporcionado o formato inválido." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado." });
  }
};

/**
 * Consulta la base de datos para saber si un usuario tiene rol 'admin'.
 *
 * Se consulta la BD en lugar de confiar solo en el token porque el token
 * puede haberse emitido antes de que se cambiara el rol del usuario.
 * Así la comprobación siempre refleja el estado actual.
 *
 * @param {number} usuarioId - ID del usuario a comprobar.
 * @returns {Promise<boolean>} `true` si el usuario tiene rol 'admin'.
 */
async function usuarioEsAdmin(usuarioId) {
  const r = await pool.query("SELECT rol FROM usuarios WHERE id = $1", [
    usuarioId,
  ]);
  return r.rows[0]?.rol === "admin";
}

/**
 * Middleware Express que verifica que el usuario autenticado sea administrador.
 *
 * Debe colocarse siempre DESPUÉS de `authMiddleware` en la cadena de middlewares,
 * ya que depende de que `req.user.id` esté disponible.
 *
 * Devuelve 403 (Forbidden) si el usuario está logueado pero no es admin.
 * Esto es distinto de 401 (Unauthorized), que significa que no está logueado.
 *
 * @param {import("express").Request}  req  - Objeto petición (requiere `req.user.id`).
 * @param {import("express").Response} res  - Objeto respuesta de Express.
 * @param {import("express").NextFunction} next - Función para continuar la cadena.
 * @returns {Promise<void>}
 */
const adminMiddleware = async (req, res, next) => {
  try {
    if (!(await usuarioEsAdmin(req.user.id))) {
      return res
        .status(403)
        .json({ error: "Se requieren permisos de administrador." });
    }
    next();
  } catch {
    return res.status(500).json({ error: "Error al comprobar permisos." });
  }
};

module.exports = { authMiddleware, adminMiddleware, createToken, usuarioEsAdmin };
