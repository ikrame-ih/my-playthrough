// JWT auth + admin checks. Token carries id/email/rol for the UI; admin role is
// always re-read from Postgres because the token may predate a role change.

const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error(
    "ERROR CRÍTICO: La variable de entorno JWT_SECRET no está definida. " +
      "Añádela al fichero .env antes de arrancar el servidor.",
  );
  process.exit(1);
}

const createToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, rol: user.rol || "user" },
    JWT_SECRET,
    { expiresIn: "7d" },
  );

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

async function usuarioEsAdmin(usuarioId) {
  const r = await pool.query("SELECT rol FROM usuarios WHERE id = $1", [
    usuarioId,
  ]);
  return r.rows[0]?.rol === "admin";
}

// Must run after authMiddleware (needs req.user.id). 403 ≠ 401.
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

module.exports = {
  authMiddleware,
  adminMiddleware,
  createToken,
  usuarioEsAdmin,
};
