/**
 * @module auth.routes
 * @description Registro y login: aquí aún no hay JWT en la petición; si todo va bien,
 * la respuesta incluye `token` + datos de usuario. El cliente lo guarda y lo reutiliza en el resto
 * de la API. `GET /me` sirve para comprobar que el token sigue válido y refrescar perfil (avatar, sonido).
 *
 * Rutas definidas:
 *   POST /api/auth/register → crear nueva cuenta
 *   POST /api/auth/login    → iniciar sesión (devuelve JWT)
 *   GET  /api/auth/me       → verificar que el token sigue siendo válido
 *
 * POST de registro e inicio de sesión comparten un límite por IP (`express-rate-limit`)
 * para dificultar pruebas masivas de contraseñas desde la misma dirección.
 */

const express = require("express");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const {
  authMiddleware,
  createToken,
} = require("../middleware/auth.middleware");
const {
  normalizeEmail,
  passwordPolicyMessage,
  serverErrorPayload,
} = require("../utils/normalize");
const {
  isValidRobotAvatarId,
  coerceAvatarId,
} = require("../constants/avatars");

const router = express.Router();

const authLoginRegisterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "Demasiados intentos de registro o inicio de sesión. Espera unos minutos e inténtalo de nuevo.",
  },
});

/**
 * Registra una nueva cuenta de usuario en el sistema.
 * Valida que el email y el nombre de usuario no estén ya en uso antes de insertar.
 * Usa bcrypt con coste 10 para hashear la contraseña (valor estándar en la industria).
 * Devuelve un JWT directamente para que el usuario quede logueado al instante.
 *
 * @route  POST /api/auth/register
 * @access Public
 * @param  {string} req.body.nombre_usuario - Nombre visible en la comunidad.
 * @param  {string} req.body.email          - Email único de la cuenta.
 * @param  {string} req.body.password       - Contraseña (mín. 8 caracteres, mayúscula, minúscula, número y símbolo).
 * @returns {object} 201 – `{ success, token, user }` | 400 – `{ error }` | 500 – `{ error }`
 */
router.post("/register", authLoginRegisterLimiter, async (req, res) => {
  try {
    const nombre_usuario = String(req.body.nombre_usuario ?? "").trim();
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!nombre_usuario || !email || !password) {
      return res.status(400).json({
        error: "Nombre de usuario, email y contraseña son obligatorios.",
      });
    }

    const pwdErr = passwordPolicyMessage(password);
    if (pwdErr) {
      return res.status(400).json({ error: pwdErr });
    }

    // Se comprueba duplicado antes del INSERT para devolver un mensaje claro al cliente
    const byEmail = await pool.query(
      "SELECT id FROM usuarios WHERE LOWER(TRIM(email)) = $1",
      [email],
    );
    if (byEmail.rows.length > 0) {
      return res.status(400).json({
        error:
          "Ese email ya está registrado. Usa «Inicia sesión» con esa cuenta.",
      });
    }

    const byName = await pool.query(
      "SELECT id FROM usuarios WHERE LOWER(TRIM(nombre_usuario)) = LOWER(TRIM($1))",
      [nombre_usuario],
    );
    if (byName.rows.length > 0) {
      return res.status(400).json({
        error: "Ese nombre de usuario ya está en uso. Prueba otro nombre.",
      });
    }

    // Coste 10 es el estándar para bcrypt (equilibrio seguridad/rendimiento)
    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      `INSERT INTO usuarios (nombre_usuario, email, password_hash, rol)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre_usuario, email, rol, avatar_id, notificaciones_sonido`,
      [nombre_usuario, email, password_hash, "user"],
    );

    // Devuelvo el token directamente para que el usuario quede logueado sin hacer login aparte
    const row = newUser.rows[0];
    row.avatar_id = coerceAvatarId(row.avatar_id);
    row.notificaciones_sonido =
      row.notificaciones_sonido !== undefined
        ? Boolean(row.notificaciones_sonido)
        : true;
    const token = createToken(row);
    return res.status(201).json({ success: true, token, user: row });
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    if (error.code === "23505") {
      return res.status(400).json({
        error:
          "Ese email o nombre de usuario ya existe. Prueba a iniciar sesión.",
        detail: error.detail,
      });
    }
    return res
      .status(500)
      .json(serverErrorPayload(error, "Error al registrar usuario."));
  }
});

/**
 * Inicia sesión verificando las credenciales y devolviendo un JWT.
 * La contraseña se compara con el hash almacenado usando bcrypt.compare(),
 * que es la función inversa (verificación) del hash generado al registrarse.
 *
 * @route  POST /api/auth/login
 * @access Public
 * @param  {string} [req.body.login]  - Email o nombre de usuario (preferido).
 * @param  {string} [req.body.email]  - Mismo uso que `login` (compatibilidad).
 * @param  {string} req.body.password - Contraseña en texto plano.
 * @returns {object} 200 – `{ success, token, user }` | 401 – `{ error }` | 500 – `{ error }`
 */
router.post("/login", authLoginRegisterLimiter, async (req, res) => {
  try {
    const raw = String(req.body.login ?? req.body.email ?? "").trim();
    const password = req.body.password;

    if (!raw || !password) {
      return res.status(400).json({
        error: "Indica email o nombre de usuario y la contraseña.",
      });
    }

    const looksLikeEmail = raw.includes("@");
    const loginParam = looksLikeEmail ? normalizeEmail(raw) : raw;

    const fullSelect = looksLikeEmail
      ? `SELECT id, nombre_usuario, email, password_hash, rol, avatar_id, notificaciones_sonido
         FROM usuarios WHERE LOWER(TRIM(email)) = $1`
      : `SELECT id, nombre_usuario, email, password_hash, rol, avatar_id, notificaciones_sonido
         FROM usuarios WHERE LOWER(TRIM(nombre_usuario)) = LOWER(TRIM($1))`;

    const leanSelect = looksLikeEmail
      ? `SELECT id, nombre_usuario, email, password_hash, rol
         FROM usuarios WHERE LOWER(TRIM(email)) = $1`
      : `SELECT id, nombre_usuario, email, password_hash, rol
         FROM usuarios WHERE LOWER(TRIM(nombre_usuario)) = LOWER(TRIM($1))`;

    let result;
    try {
      result = await pool.query(fullSelect, [loginParam]);
    } catch (err) {
      // BD creada antes de avatar_id / notificaciones_sonido (42703 = undefined_column)
      if (err?.code === "42703") {
        result = await pool.query(leanSelect, [loginParam]);
      } else {
        throw err;
      }
    }

    if (result.rows.length === 0) {
      return res.status(401).json({
        error:
          "No existe ninguna cuenta con ese email o nombre de usuario. Regístrate primero.",
      });
    }

    const user = result.rows[0];
    if (!user.password_hash) {
      return res.status(500).json({
        error:
          "Esta cuenta no tiene contraseña en la base de datos. Ejecuta de nuevo el seed o migraciones.",
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Contraseña incorrecta." });
    }

    const token = createToken(user);
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        nombre_usuario: user.nombre_usuario,
        email: user.email,
        rol: user.rol,
        avatar_id: coerceAvatarId(user.avatar_id),
        notificaciones_sonido:
          user.notificaciones_sonido !== undefined
            ? Boolean(user.notificaciones_sonido)
            : true,
      },
    });
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return res.status(500).json({ error: "Error al iniciar sesión." });
  }
});

/**
 * Devuelve los datos frescos del usuario autenticado.
 * El frontend la llama al cargar la app para verificar que el token almacenado
 * en localStorage sigue siendo válido y para obtener el rol actualizado.
 *
 * @route  GET /api/auth/me
 * @access Private (requiere JWT válido)
 * @returns {object} 200 – `{ user }` | 404 – `{ error }` | 500 – `{ error }`
 */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, nombre_usuario, email, rol, avatar_id, notificaciones_sonido FROM usuarios WHERE id = $1",
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const u = result.rows[0];
    u.avatar_id = coerceAvatarId(u.avatar_id);
    if (u.notificaciones_sonido !== undefined) {
      u.notificaciones_sonido = Boolean(u.notificaciones_sonido);
    } else {
      u.notificaciones_sonido = true;
    }
    return res.json({ user: u });
  } catch {
    return res.status(500).json({ error: "Error al validar sesión." });
  }
});

/**
 * Actualiza el avatar de perfil (solo entre los identificadores permitidos).
 *
 * @route  PATCH /api/auth/me
 * @access Private
 */
router.patch("/me", authMiddleware, async (req, res) => {
  try {
    const avatar_id = req.body?.avatar_id;
    const rawSound = req.body?.notificaciones_sonido;

    const sets = [];
    const vals = [];
    let i = 1;

    if (avatar_id !== undefined && avatar_id !== null) {
      if (!isValidRobotAvatarId(String(avatar_id).trim())) {
        return res.status(400).json({ error: "Avatar no válido." });
      }
      sets.push(`avatar_id = $${i++}`);
      vals.push(String(avatar_id).trim());
    }

    if (rawSound !== undefined) {
      sets.push(`notificaciones_sonido = $${i++}`);
      vals.push(Boolean(rawSound));
    }

    if (sets.length === 0) {
      return res.status(400).json({
        error:
          "Indica al menos un campo: avatar_id o notificaciones_sonido (boolean).",
      });
    }

    vals.push(req.user.id);
    const result = await pool.query(
      `UPDATE usuarios SET ${sets.join(", ")} WHERE id = $${i}
       RETURNING id, nombre_usuario, email, rol, avatar_id, notificaciones_sonido`,
      vals,
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }
    const u = result.rows[0];
    u.avatar_id = coerceAvatarId(u.avatar_id);
    u.notificaciones_sonido = Boolean(u.notificaciones_sonido);
    return res.json({ user: u });
  } catch (error) {
    console.error("[PATCH /api/auth/me]", error);
    // Columna avatar_id ausente en BD antigua (PostgreSQL: 42703 = undefined_column)
    if (
      error?.code === "42703" &&
      String(error?.message || "").includes("avatar_id")
    ) {
      return res.status(500).json({
        error:
          "La base de datos no tiene la columna avatar_id. Ejecuta una vez el script docs/sql/add-avatar-id-usuarios.sql (o vuelve a crear la BD desde docs/sql/schema.sql) y reinicia el servidor.",
        code: error.code,
      });
    }
    return res
      .status(500)
      .json(serverErrorPayload(error, "Error al actualizar el perfil."));
  }
});

module.exports = router;
