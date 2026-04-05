/**
 * users.routes.js
 *
 * Rutas para la funcionalidad social (RF-04): consultar otros perfiles.
 * Todas requieren autenticación: solo los usuarios registrados pueden
 * explorar la comunidad. El email nunca se expone en estas rutas.
 *
 * Rutas definidas aquí:
 *   GET /api/users              → lista de usuarios (para la página de comunidad)
 *   GET /api/users/:userId/games → colección pública de un usuario concreto
 */

const express = require("express");
const pool = require("../config/db");
const { authMiddleware } = require("../middleware/auth.middleware");
const { queryGamesListForUser } = require("../utils/queries");

const router = express.Router();

/**
 * GET /api/users
 * Devuelve la lista de usuarios con datos básicos para mostrar tarjetas
 * en la página de comunidad. Se excluye el propio usuario de la lista
 * (no tiene sentido verse a uno mismo en la sección de comunidad).
 * Incluye el número de juegos y la última plataforma usada como datos
 * de contexto para la tarjeta de cada miembro.
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         u.id,
         u.nombre_usuario,
         (SELECT COUNT(*)::int FROM juegos j WHERE j.usuario_id = u.id) AS num_juegos,
         (SELECT j.plataforma FROM juegos j WHERE j.usuario_id = u.id ORDER BY j.id DESC LIMIT 1) AS plataforma_ejemplo
       FROM usuarios u
       WHERE u.id <> $1
       ORDER BY u.nombre_usuario ASC`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/:userId/games
 * Devuelve la colección completa de otro usuario en modo solo lectura.
 * Primero verifica que el usuario existe para devolver 404 si no,
 * en lugar de simplemente una lista vacía que podría confundir al cliente.
 */
router.get("/:userId/games", authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: "ID de usuario inválido." });
    }

    const userExists = await pool.query(
      "SELECT id, nombre_usuario FROM usuarios WHERE id = $1",
      [userId],
    );
    if (userExists.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const games = await queryGamesListForUser(userId);
    // Devuelvo tanto los datos del usuario como sus juegos en un solo objeto
    // para que el cliente no tenga que hacer dos peticiones separadas.
    res.json({ user: userExists.rows[0], games });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
