/**
 * @module users.routes
 * @description Rutas para explorar los perfiles públicos de otros usuarios.
 * Forman la base de la funcionalidad de comunidad (RF-06).
 *
 * Rutas definidas:
 *   GET /api/users              → lista de todos los usuarios excepto el propio
 *   GET /api/users/:userId/games → colección pública de un usuario concreto
 */

const express = require("express");
const pool = require("../config/db");
const { authMiddleware } = require("../middleware/auth.middleware");
const { queryGamesListForUser } = require("../utils/queries");
const { serverErrorPayload } = require("../utils/normalize");
const { coerceAvatarId } = require("../constants/avatars");

const router = express.Router();

/**
 * Devuelve la lista de usuarios registrados para la página de comunidad.
 * Excluye al usuario que hace la petición (`WHERE u.id <> $1`) para que
 * no aparezca en su propio feed de comunidad.
 * Incluye el número de juegos y la plataforma del último juego añadido
 * como datos de contexto para la tarjeta de cada miembro.
 *
 * @route  GET /api/users
 * @access Private (requiere JWT válido)
 * @returns {object[]} 200 – Array de usuarios con `id`, `nombre_usuario`, `num_juegos`, `plataforma_ejemplo`.
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         u.id,
         u.nombre_usuario,
         u.avatar_id,
         (SELECT COUNT(*)::int FROM juegos j WHERE j.usuario_id = u.id) AS num_juegos,
         (SELECT j.plataforma FROM juegos j WHERE j.usuario_id = u.id ORDER BY j.id DESC LIMIT 1) AS plataforma_ejemplo
       FROM usuarios u
       WHERE u.id <> $1
       ORDER BY u.nombre_usuario ASC`,
      [req.user.id],
    );
    res.json(
      result.rows.map((r) => ({
        ...r,
        avatar_id: coerceAvatarId(r.avatar_id),
      })),
    );
  } catch (error) {
    console.error("[GET /api/users]", error);
    res.status(500).json(serverErrorPayload(error, "Error al cargar usuarios."));
  }
});

/**
 * Devuelve la colección pública de otro usuario (solo lectura).
 * Comprueba primero que el usuario exista para devolver un 404 descriptivo
 * en lugar del array vacío que devolvería `queryGamesListForUser` si no hay juegos.
 *
 * @route  GET /api/users/:userId/games
 * @access Private (requiere JWT válido)
 * @param  {string} req.params.userId - ID del usuario cuya colección se quiere ver.
 * @returns {object} 200 – `{ user, games }` | 400 – ID inválido | 404 – usuario no encontrado.
 */
router.get("/:userId/games", authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: "ID de usuario inválido." });
    }

    const userExists = await pool.query(
      "SELECT id, nombre_usuario, avatar_id FROM usuarios WHERE id = $1",
      [userId],
    );
    if (userExists.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const u = userExists.rows[0];
    u.avatar_id = coerceAvatarId(u.avatar_id);

    const games = await queryGamesListForUser(userId);
    res.json({ user: u, games });
  } catch (error) {
    console.error("[GET /api/users/:userId/games]", error);
    res.status(500).json(serverErrorPayload(error, "Error al cargar la colección pública."));
  }
});

module.exports = router;
