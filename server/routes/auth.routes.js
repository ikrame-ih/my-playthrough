// Auth: register, login, session check, profile patch. Register/login return a JWT;
// register and login share an IP rate limit.

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

/** POST /register — create account and return JWT (no separate login step). */
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

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      `INSERT INTO usuarios (nombre_usuario, email, password_hash, rol)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre_usuario, email, rol, avatar_id, notificaciones_sonido`,
      [nombre_usuario, email, password_hash, "user"],
    );

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
        error: "That email or username already exists. Try signing in instead.",
        detail: error.detail,
      });
    }
    return res
      .status(500)
      .json(serverErrorPayload(error, "Could not register user."));
  }
});

/** POST /login — email or username + password. */
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
      // Old DB without avatar_id / notificaciones_sonido (PG 42703)
      if (err?.code === "42703") {
        result = await pool.query(leanSelect, [loginParam]);
      } else {
        throw err;
      }
    }

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "No account exists with that email or username. Register first.",
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

/** GET /me — refresh user from DB (token validity check on app load). */
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

/** PATCH /me — display name, avatar_id, notificaciones_sonido. */
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
      const raw = nombreUsuarioSnake ? body.nombre_usuario : body.nombreUsuario;
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
        const keys = body && typeof body === "object" ? Object.keys(body) : [];
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
    // avatar_id column missing on older DBs
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

/** POST /demo — pre-seeded account (run seed:demo first). */
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
    return res
      .status(500)
      .json({ error: "Could not sign in with demo account." });
  }
});

module.exports = router;
