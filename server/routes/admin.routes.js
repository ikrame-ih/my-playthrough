/**
 * @module admin.routes
 * @description Rutas del panel de administración. Solo accesibles con rol 'admin'.
 * El doble middleware `authMiddleware + adminMiddleware` se aplica a nivel de router
 * para proteger todas las rutas de este módulo de una sola vez.
 *
 * Rutas definidas:
 *   GET    /api/admin/users      → listado de todas las cuentas
 *   DELETE /api/admin/users/:id  → eliminar una cuenta (moderación)
 *   GET    /api/admin/games      → listado de todos los juegos
 *   DELETE /api/admin/games/:id  → eliminar cualquier ficha de juego
 */

const express = require("express");
const pool = require("../config/db");
const { authMiddleware, adminMiddleware } = require("../middleware/auth.middleware");
const { serverErrorPayload } = require("../utils/normalize");
const { coerceAvatarId } = require("../constants/avatars");

const router = express.Router();

// Todas las rutas de este router requieren login + rol admin
router.use(authMiddleware, adminMiddleware);

/**
 * Devuelve el listado completo de cuentas de usuario para el panel de administración.
 *
 * @route  GET /api/admin/users
 * @access Private – Admin only
 * @returns {object[]} 200 – Array de usuarios con `id`, `nombre_usuario`, `email`, `rol`, `fecha_registro`.
 */
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
    res.status(500).json(serverErrorPayload(error, "Error al cargar usuarios."));
  }
});

/**
 * Elimina la cuenta de un usuario. Operación de moderación que también borra
 * todos sus juegos y comentarios (ON DELETE CASCADE en la BD).
 * El admin no puede borrarse a sí mismo para evitar quedarse sin acceso al panel.
 *
 * @route  DELETE /api/admin/users/:id
 * @access Private – Admin only
 * @param  {string} req.params.id - ID del usuario a eliminar.
 * @returns {object} 200 – `{ success, message }` | 400 – auto-borrado o ID inválido | 404 – no encontrado.
 */
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
    res.status(500).json(serverErrorPayload(error, "Error al eliminar usuario."));
  }
});

/**
 * Devuelve el listado completo de fichas de juego de todos los usuarios,
 * incluyendo el nombre y email del propietario para facilitar la moderación.
 *
 * @route  GET /api/admin/games
 * @access Private – Admin only
 * @returns {object[]} 200 – Array de juegos con datos del propietario.
 */
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

/**
 * Elimina cualquier ficha de juego independientemente de su propietario.
 * Solo disponible para administradores, a diferencia del DELETE del usuario
 * que solo puede borrar sus propios juegos.
 *
 * @route  DELETE /api/admin/games/:id
 * @access Private – Admin only
 * @param  {string} req.params.id - ID de la ficha a eliminar.
 * @returns {object} 200 – `{ success, message }` | 400 – ID inválido | 404 – no encontrado.
 */
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

module.exports = router;
