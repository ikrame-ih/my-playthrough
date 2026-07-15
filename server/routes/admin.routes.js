// Admin moderation: list/delete users, games, LFG. All routes need auth + admin (role checked in DB).

const express = require("express");
const pool = require("../config/db");
const {
  authMiddleware,
  adminMiddleware,
} = require("../middleware/auth.middleware");
const { serverErrorPayload } = require("../utils/normalize");
const { coerceAvatarId } = require("../constants/avatars");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

/** GET /users */
router.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, nombre_usuario, email, rol, fecha_registro, avatar_id FROM usuarios ORDER BY id ASC",
    );
    res.json(
      result.rows.map((u) => ({
        ...u,
        avatar_id: coerceAvatarId(u.avatar_id),
      })),
    );
  } catch (error) {
    console.error("[GET /api/admin/users]", error);
    res
      .status(500)
      .json(serverErrorPayload(error, "Error al cargar usuarios."));
  }
});

/** DELETE /users/:id — CASCADE removes their games/comments; admin cannot delete self. */
router.delete("/users/:id", async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (Number.isNaN(targetId)) {
      return res.status(400).json({ error: "ID inválido." });
    }
    if (targetId === req.user.id) {
      return res.status(400).json({
        error: "No puedes eliminar tu propia cuenta desde el panel.",
      });
    }

    const deleted = await pool.query(
      "DELETE FROM usuarios WHERE id = $1 RETURNING id",
      [targetId],
    );
    if (deleted.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }
    res.json({ success: true, message: "Usuario eliminado." });
  } catch (error) {
    console.error("[DELETE /api/admin/users/:id]", error);
    res
      .status(500)
      .json(serverErrorPayload(error, "Error al eliminar usuario."));
  }
});

/** GET /games — all library entries with owner info. */
router.get("/games", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         j.id,
         COALESCE(c.titulo, j.titulo) AS titulo,
         j.usuario_id,
         j.plataforma,
         j.estado,
         j.puntuacion,
         u.nombre_usuario,
         u.email
       FROM juegos j
       JOIN usuarios u ON u.id = j.usuario_id
       LEFT JOIN catalogo_juegos c ON j.catalogo_id = c.id
       ORDER BY j.id DESC`,
    );
    res.json(result.rows);
  } catch (error) {
    console.error("[GET /api/admin/games]", error);
    res.status(500).json(serverErrorPayload(error, "Error al cargar juegos."));
  }
});

/** DELETE /games/:id */
router.delete("/games/:id", async (req, res) => {
  try {
    const gameId = parseInt(req.params.id, 10);
    if (Number.isNaN(gameId)) {
      return res.status(400).json({ error: "ID de juego inválido." });
    }

    const deleted = await pool.query(
      "DELETE FROM juegos WHERE id = $1 RETURNING id",
      [gameId],
    );
    if (deleted.rows.length === 0) {
      return res.status(404).json({ error: "Juego no encontrado." });
    }
    res.json({ success: true, message: "Juego eliminado." });
  } catch (error) {
    console.error("[DELETE /api/admin/games/:id]", error);
    res.status(500).json(serverErrorPayload(error, "Error al eliminar juego."));
  }
});

/** GET /lfg — moderation list (delete still via DELETE /api/social/lfg/:id). */
router.get("/lfg", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.id, l.mensaje, l.modo, l.activo, l.created_at,
              l.usuario_id, l.juego_id,
              u.nombre_usuario, u.email,
              COALESCE(c.titulo, j.titulo) AS juego_titulo
       FROM lfg_publicaciones l
       JOIN usuarios u ON u.id = l.usuario_id
       JOIN juegos j ON j.id = l.juego_id
       LEFT JOIN catalogo_juegos c ON j.catalogo_id = c.id
       ORDER BY l.created_at DESC
       LIMIT 300`,
    );
    res.json(result.rows);
  } catch (error) {
    console.error("[GET /api/admin/lfg]", error);
    res
      .status(500)
      .json(serverErrorPayload(error, "Error al cargar publicaciones LFG."));
  }
});

module.exports = router;
