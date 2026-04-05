/**
 * auth.middleware.js
 *
 * Middlewares de autenticación y autorización.
 * En Express, un middleware es una función que se ejecuta entre que llega
 * la petición y que el controlador la procesa. Aquí tengo dos:
 *
 *   1. authMiddleware  → comprueba que el usuario lleva un JWT válido.
 *   2. adminMiddleware → verifica además que el usuario tiene rol "admin".
 *
 * Los encadeno así en las rutas que lo necesitan:
 *   app.get("/ruta-privada", authMiddleware, controlador)
 *   app.get("/ruta-admin",   authMiddleware, adminMiddleware, controlador)
 */

const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// Leo el secreto desde las variables de entorno.
// Si no está definido en producción, el servidor falla de inmediato con un
// error claro en lugar de arrancar con un secreto conocido publicamente,
// lo que sería un agujero de seguridad grave.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error(
    "ERROR CRÍTICO: La variable de entorno JWT_SECRET no está definida. " +
    "Añádela al fichero .env antes de arrancar el servidor.",
  );
  process.exit(1);
}

/**
 * Genera un JWT firmado con los datos mínimos del usuario.
 * El token dura 7 días. Lo uso en el login y en el registro para que
 * el cliente quede autenticado directamente sin necesidad de un segundo paso.
 *
 * Incluyo el rol en el token para que el frontend pueda mostrar u ocultar
 * elementos del menú (ej. el panel de administración) sin consultar la BD,
 * aunque las rutas protegidas siempre re-comprueban el rol en BD por seguridad.
 */
const createToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, rol: user.rol || "user" },
    JWT_SECRET,
    { expiresIn: "7d" },
  );

/**
 * authMiddleware
 *
 * Verifica que la cabecera Authorization contenga un JWT válido con el formato:
 *   Authorization: Bearer <token>
 *
 * Si la verificación tiene éxito, adjunta el payload decodificado a req.user
 * para que los controladores puedan acceder a req.user.id, req.user.rol, etc.
 * Si falla, devuelve 401 y corta la cadena de middlewares con return.
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Token no proporcionado o formato inválido." });
  }

  // El token viene después del prefijo "Bearer ".
  const token = authHeader.split(" ")[1];

  try {
    // jwt.verify lanza una excepción si el token es inválido o ha expirado,
    // por eso lo envuelvo en try/catch.
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // disponible en todos los middlewares siguientes
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado." });
  }
};

/**
 * Función auxiliar: consulta el rol actual del usuario en la BD.
 * La consulto directamente en BD (y no confío solo en el rol del token)
 * porque el token puede haberse emitido antes de que un administrador
 * promoviese o degradase al usuario. Así la comprobación siempre está
 * actualizada.
 */
async function usuarioEsAdmin(usuarioId) {
  const r = await pool.query("SELECT rol FROM usuarios WHERE id = $1", [
    usuarioId,
  ]);
  return r.rows[0]?.rol === "admin";
}

/**
 * adminMiddleware
 *
 * Se usa después de authMiddleware. Comprueba en la BD que el usuario
 * autenticado tiene rol "admin". Si no, devuelve 403 Forbidden.
 * El 403 (prohibido) es distinto del 401 (no autenticado): el usuario
 * está identificado pero no tiene permisos suficientes.
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
