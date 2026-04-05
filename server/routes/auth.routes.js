/**
 * auth.routes.js
 *
 * Rutas públicas de autenticación: registro e inicio de sesión.
 * Estas rutas NO llevan el authMiddleware porque son las que permiten
 * obtener el token por primera vez. Son el punto de entrada al sistema.
 *
 * Rutas definidas aquí:
 *   POST /api/auth/register  → crea una nueva cuenta
 *   POST /api/auth/login     → verifica credenciales y devuelve JWT
 *   GET  /api/auth/me        → comprueba si el token actual sigue siendo válido
 */

const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { authMiddleware, createToken } = require("../middleware/auth.middleware");
const { normalizeEmail } = require("../utils/normalize");

const router = express.Router();

/**
 * POST /api/auth/register
 * Crea un nuevo usuario. Valida los datos, comprueba que no exista ya ese
 * email o nombre de usuario, hashea la contraseña y devuelve el token listo
 * para que el cliente quede autenticado sin necesidad de hacer login a continuación.
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

    // Comprobamos si el email ya está en uso para dar un mensaje más claro
    // que el error genérico de violación de unicidad que lanzaría PostgreSQL.
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

    // bcrypt.hash aplica el algoritmo bcrypt con coste 10 (2^10 = 1024 iteraciones).
    // Cuanto mayor es el coste, más difícil es para un atacante hacer fuerza bruta,
    // pero también más lento para el servidor. 10 es el estándar recomendado.
    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      `INSERT INTO usuarios (nombre_usuario, email, password_hash, rol)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre_usuario, email, rol`,
      [nombre_usuario, email, password_hash, "user"],
    );

    const token = createToken(newUser.rows[0]);
    return res.status(201).json({ success: true, token, user: newUser.rows[0] });
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    // Código 23505: violación de restricción UNIQUE en PostgreSQL
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
 * POST /api/auth/login
 * Verifica el email y la contraseña. bcrypt.compare compara la contraseña
 * en texto plano con el hash guardado sin necesidad de desencriptarlo,
 * ya que bcrypt es un hash de una sola dirección.
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
 * GET /api/auth/me
 * Ruta protegida. El cliente la llama al arrancar la aplicación para verificar
 * que el token guardado en localStorage sigue siendo válido y obtener los datos
 * frescos del usuario (por si su rol cambió desde que inició sesión).
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
