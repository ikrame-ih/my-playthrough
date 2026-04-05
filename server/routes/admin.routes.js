/**
 * admin.routes.js
 *
 * Panel de administración (RF-06). Todas las rutas de este fichero
 * requieren primero authMiddleware (usuario logueado) y después
 * adminMiddleware (que además tenga rol "admin").
 * Si alguien intenta acceder sin ser admin recibe un 403 Forbidden.
 *
 * Rutas definidas aquí:
 *   GET    /api/admin/users     → listado completo de usuarios
 *   DELETE /api/admin/users/:id → eliminar cuenta (moderación)
 *   GET    /api/admin/games     → listado global de fichas de juego
 *   DELETE /api/admin/games/:id → eliminar cualquier ficha (moderación)
 */

const express = require("express");
const pool = require("../config/db");
const { authMiddleware, adminMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

// Aplico los dos middlewares a todas las rutas de este router de una vez.
// Es equivalente a añadirlos uno a uno en cada ruta, pero más limpio.
router.use(authMiddleware, adminMiddleware);

/**
 * GET /api/admin/users
 * Lista todas las cuentas con sus datos básicos y la fecha de registro.
 * La información se muestra en el panel de administración para facilitar
 * la moderación de la comunidad.
 */
router.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, nombre_usuario, email, rol, fecha_registro FROM usuarios ORDER BY id ASC",
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Elimina la cuenta de un usuario. Incluye una protección explícita
 * para impedir que el administrador borre su propia cuenta por accidente,
 * ya que perder la única cuenta admin bloquearía el acceso al panel.
 * Los juegos del usuario se borran automáticamente en cascada (ON DELETE CASCADE
 * definido en el esquema SQL) sin necesidad de gestionarlo aquí.
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
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/games
 * Lista todas las fichas de juego de todos los usuarios con los datos
 * del propietario. Permite al admin detectar contenido inapropiado.
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
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/games/:id
 * Elimina cualquier ficha de juego sin importar a quién pertenezca.
 * Solo accesible para administradores (lo garantiza el router.use anterior).
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
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
