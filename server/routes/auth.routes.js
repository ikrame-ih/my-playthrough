/**
 * @module auth.routes
 * @description Registro y login: aquí aún no hay JWT en la petición; si todo va bien,
 * la respuesta incluye `token` + datos de usuario. El cliente lo guarda y lo reutiliza en el resto
 * de la API. `GET /me` sirve para comprobar que el token sigue válido y refrescar perfil.
 * `PATCH /me` actualiza nombre visible, avatar y sonido de recomendaciones (sin ampliar el esquema).
 *
 * Rutas definidas:
 *   POST /api/auth/register → crear nueva cuenta
 *   POST /api/auth/login    → iniciar sesión (devuelve JWT)
 *   GET  /api/auth/me       → verificar que el token sigue siendo válido
 *   PATCH /api/auth/me      → actualizar perfil (nombre_usuario, avatar_id, notificaciones_sonido)
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
      "Too many sign-in or registration attempts. Wait a few minutes and try again.",
  },
});

const DEMO_EMAIL = "demo@myplaythrough.local";
const DEMO_PASS = "Presentacion2026!";

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
        error: "Username, email, and password are required.",
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
          "That email is already registered. Sign in with that account instead.",
      });
    }

    const byName = await pool.query(
      "SELECT id FROM usuarios WHERE LOWER(TRIM(nombre_usuario)) = LOWER(TRIM($1))",
      [nombre_usuario],
    );
    if (byName.rows.length > 0) {
      return res.status(400).json({
        error: "That username is already taken. Try another name.",
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
          "That email or username already exists. Try signing in instead.",
        detail: error.detail,
      });
    }
    return res
      .status(500)
      .json(serverErrorPayload(error, "Could not register user."));
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
        error: "Enter your email or username and password.",
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
          "No account exists with that email or username. Register first.",
      });
    }

    const user = result.rows[0];
    if (!user.password_hash) {
      return res.status(500).json({
        error:
          "This account has no password in the database. Re-run the seed script or migrations.",
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Incorrect password." });
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
    const connRefused =
      error?.code === "ECONNREFUSED" ||
      (Array.isArray(error?.errors) &&
        error.errors.some((e) => e?.code === "ECONNREFUSED"));
    if (connRefused && process.env.NODE_ENV !== "production") {
      return res.status(503).json({
        error:
          "Cannot connect to PostgreSQL (connection refused). Start the database: run `docker compose up -d db` from the project root, or adjust DB_HOST and DB_PORT in server/.env.",
      });
    }
    return res.status(500).json({ error: "Could not sign in." });
  }
});

/**
 * Devuelve los datos frescos del usuario autenticado.
 * El frontend la llama al cargar la app para verificar que el token almacenado
 * en localStorage sigue siendo válido y para obtener el rol actualizado. `PATCH /me` actualiza
 * nombre visible, avatar y preferencia de sonido (sin nuevas columnas).
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
      return res.status(404).json({ error: "User not found." });
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
    return res.status(500).json({ error: "Could not validate session." });
  }
});

/**
 * Actualiza campos permitidos del perfil: `nombre_usuario` (único, case-insensitive), `avatar_id`,
 * `notificaciones_sonido`. No amplía el esquema de BD.
 *
 * @route  PATCH /api/auth/me
 * @access Private
 */
router.patch("/me", authMiddleware, async (req, res) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const nombreUsuarioSnake = Object.prototype.hasOwnProperty.call(
      body,
      "nombre_usuario",
    );
    const nombreUsuarioCamel = Object.prototype.hasOwnProperty.call(
      body,
      "nombreUsuario",
    );
    const nombreSpecified = nombreUsuarioSnake || nombreUsuarioCamel;
    const avatar_id = body?.avatar_id;
    const rawSound = body?.notificaciones_sonido;

    const sets = [];
    const vals = [];
    let i = 1;

    if (nombreSpecified) {
      const raw = nombreUsuarioSnake
        ? body.nombre_usuario
        : body.nombreUsuario;
      if (raw === null || raw === undefined) {
        return res.status(400).json({ error: "Display name cannot be empty." });
      }
      const nombre_usuario = String(raw).trim();
      if (!nombre_usuario) {
        return res.status(400).json({ error: "Display name cannot be empty." });
      }
      if (nombre_usuario.length > 64) {
        return res.status(400).json({
          error: "Display name is too long (max 64 characters).",
        });
      }
      const dup = await pool.query(
        `SELECT id FROM usuarios
         WHERE LOWER(TRIM(nombre_usuario)) = LOWER(TRIM($1)) AND id <> $2`,
        [nombre_usuario, req.user.id],
      );
      if (dup.rows.length > 0) {
        return res.status(409).json({
          error: "That username is already taken. Try another name.",
        });
      }
      sets.push(`nombre_usuario = $${i++}`);
      vals.push(nombre_usuario);
    }

    if (avatar_id !== undefined && avatar_id !== null) {
      if (!isValidRobotAvatarId(String(avatar_id).trim())) {
        return res.status(400).json({ error: "Invalid avatar." });
      }
      sets.push(`avatar_id = $${i++}`);
      vals.push(String(avatar_id).trim());
    }

    if (rawSound !== undefined) {
      sets.push(`notificaciones_sonido = $${i++}`);
      vals.push(Boolean(rawSound));
    }

    if (sets.length === 0) {
      if (process.env.NODE_ENV !== "production") {
        const keys =
          body && typeof body === "object" ? Object.keys(body) : [];
        console.warn(
          "[PATCH /api/auth/me] ningún campo reconocido; claves recibidas:",
          keys.length ? keys.join(", ") : "(cuerpo vacío o no JSON)",
        );
      }
      return res.status(400).json({
        error:
          "Provide at least one field: nombre_usuario, avatar_id, or notificaciones_sonido (boolean).",
      });
    }

    vals.push(req.user.id);
    const result = await pool.query(
      `UPDATE usuarios SET ${sets.join(", ")} WHERE id = $${i}
       RETURNING id, nombre_usuario, email, rol, avatar_id, notificaciones_sonido`,
      vals,
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }
    const u = result.rows[0];
    u.avatar_id = coerceAvatarId(u.avatar_id);
    u.notificaciones_sonido = Boolean(u.notificaciones_sonido);
    return res.json({ user: u });
  } catch (error) {
    console.error("[PATCH /api/auth/me]", error);
    if (error.code === "23505") {
      return res.status(409).json({
        error: "That username is already taken.",
      });
    }
    // Columna avatar_id ausente en BD antigua (PostgreSQL: 42703 = undefined_column)
    if (
      error?.code === "42703" &&
      String(error?.message || "").includes("avatar_id")
    ) {
      return res.status(500).json({
        error:
          "The database is missing the avatar_id column. Run docs/sql/add-avatar-id-usuarios.sql once (or recreate the DB from docs/sql/schema.sql) and restart the server.",
        code: error.code,
      });
    }
    return res
      .status(500)
      .json(serverErrorPayload(error, "Could not update profile."));
  }
});

/**
 * Signs in with the pre-seeded demo account (requires `npm run seed:demo` or `seed:presentation`).
 *
 * @route  POST /api/auth/demo
 * @access Public
 */
router.post("/demo", authLoginRegisterLimiter, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre_usuario, email, password_hash, rol, avatar_id, notificaciones_sonido
       FROM usuarios WHERE LOWER(TRIM(email)) = $1`,
      [DEMO_EMAIL],
    );

    if (result.rows.length === 0) {
      return res.status(503).json({
        error:
          "Demo account not found. From the server folder run: npm run seed:demo",
      });
    }

    const user = result.rows[0];
    if (!user.password_hash) {
      return res.status(500).json({
        error: "Demo account has no password. Re-run the seed script.",
      });
    }

    const isValidPassword = await bcrypt.compare(DEMO_PASS, user.password_hash);
    if (!isValidPassword) {
      return res.status(500).json({
        error:
          "Demo password mismatch. Re-run npm run seed:demo to reset credentials.",
      });
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
    console.error("[POST /api/auth/demo]", error);
    return res.status(500).json({ error: "Could not sign in with demo account." });
  }
});

module.exports = router;
