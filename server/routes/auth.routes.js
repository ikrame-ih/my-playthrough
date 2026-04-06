/**
 * @module auth.routes
 * @description Rutas públicas de autenticación.
 * No requieren token porque son precisamente las rutas donde el token se obtiene.
 *
 * Rutas definidas:
 *   POST /api/auth/register → crear nueva cuenta
 *   POST /api/auth/login    → iniciar sesión (devuelve JWT)
 *   GET  /api/auth/me       → verificar que el token sigue siendo válido
 */

const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { authMiddleware, createToken } = require("../middleware/auth.middleware");
const { normalizeEmail } = require("../utils/normalize");

const router = express.Router();

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
 * @param  {string} req.body.password       - Contraseña en texto plano (mín. 6 caracteres).
 * @returns {object} 201 – `{ success, token, user }` | 400 – `{ error }` | 500 – `{ error }`
 */
router.post("/register", async (req, res) => {
  try {
    const nombre_usuario = String(req.body.nombre_usuario ?? "").trim();
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!nombre_usuario || !email || !password) {
      return res.status(400).json({
        error: "Nombre de usuario, email y contraseña son obligatorios.",
      });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "La contraseña debe tener al menos 6 caracteres." });
    }

    // Compruebo si ya existe antes de intentar insertar, así puedo dar un mensaje más claro
    const byEmail = await pool.query(
      "SELECT id FROM usuarios WHERE LOWER(TRIM(email)) = $1",
      [email],
    );
    if (byEmail.rows.length > 0) {
      return res.status(400).json({
        error: "Ese email ya está registrado. Usa «Inicia sesión» con esa cuenta.",
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
       RETURNING id, nombre_usuario, email, rol`,
      [nombre_usuario, email, password_hash, "user"],
    );

    // Devuelvo el token directamente para que el usuario quede logueado sin hacer login aparte
    const token = createToken(newUser.rows[0]);
    return res.status(201).json({ success: true, token, user: newUser.rows[0] });
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    if (error.code === "23505") {
      return res.status(400).json({
        error: "Ese email o nombre de usuario ya existe. Prueba a iniciar sesión.",
        detail: error.detail,
      });
    }
    return res.status(500).json({
      error: "Error al registrar usuario.",
      detail: error.message || String(error),
    });
  }
});

/**
 * Inicia sesión verificando las credenciales y devolviendo un JWT.
 * La contraseña se compara con el hash almacenado usando bcrypt.compare(),
 * que es la función inversa (verificación) del hash generado al registrarse.
 *
 * @route  POST /api/auth/login
 * @access Public
 * @param  {string} req.body.email    - Email de la cuenta.
 * @param  {string} req.body.password - Contraseña en texto plano.
 * @returns {object} 200 – `{ success, token, user }` | 401 – `{ error }` | 500 – `{ error }`
 */
router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email y contraseña son obligatorios." });
    }

    const result = await pool.query(
      "SELECT id, nombre_usuario, email, password_hash, rol FROM usuarios WHERE LOWER(TRIM(email)) = $1",
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "No existe ninguna cuenta con ese email. Regístrate primero.",
      });
    }

    const user = result.rows[0];
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
      },
    });
  } catch {
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
      "SELECT id, nombre_usuario, email, rol FROM usuarios WHERE id = $1",
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    return res.json({ user: result.rows[0] });
  } catch {
    return res.status(500).json({ error: "Error al validar sesión." });
  }
});

module.exports = router;
