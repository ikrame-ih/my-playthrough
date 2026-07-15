// Other users for community: member list (excludes self) and public collections.

const express = require("express");
const pool = require("../config/db");
const { authMiddleware } = require("../middleware/auth.middleware");
const { queryGamesListForUser } = require("../utils/queries");
const { serverErrorPayload } = require("../utils/normalize");
const { coerceAvatarId } = require("../constants/avatars");

const router = express.Router();

/** GET / — member list (excludes self) with follow flag and quick stats. */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         u.id,
         u.nombre_usuario,
         u.avatar_id,
         (SELECT COUNT(*)::int FROM juegos j WHERE j.usuario_id = u.id) AS num_juegos,
         (SELECT COUNT(*)::int FROM usuario_seguimientos s WHERE s.seguido_id = u.id) AS num_seguidores,
         (SELECT j.plataforma FROM juegos j WHERE j.usuario_id = u.id ORDER BY j.id DESC LIMIT 1) AS plataforma_ejemplo,
         EXISTS (
           SELECT 1 FROM usuario_seguimientos s
           WHERE s.seguidor_id = $1 AND s.seguido_id = u.id
         ) AS siguiendo
       FROM usuarios u
       WHERE u.id <> $1
       ORDER BY u.nombre_usuario ASC`,
      [req.user.id],
    );
    res.json(
      result.rows.map((r) => ({
        ...r,
        avatar_id: coerceAvatarId(r.avatar_id),
        siguiendo: Boolean(r.siguiendo),
      })),
    );
  } catch (error) {
    console.error("[GET /api/users]", error);
    res.status(500).json(serverErrorPayload(error, "Error al cargar usuarios."));
  }
});

/** GET /:userId/games — read-only public collection (404 if user missing). */
router.get("/:userId/games", authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: "ID de usuario inválido." });
    }

    const userExists = await pool.query(
      `SELECT u.id, u.nombre_usuario, u.avatar_id,
         (SELECT COUNT(*)::int FROM usuario_seguimientos s WHERE s.seguido_id = u.id) AS num_seguidores
       FROM usuarios u WHERE u.id = $1`,
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
