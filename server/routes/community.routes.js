/**
 * @module community.routes
 * @description Agregados sobre toda la comunidad: búsqueda por texto (miembros + fichas),
 * medias de nota por título (`GROUP BY` en SQL) y detalle público de una ficha ajena
 * (p. ej. enlace desde una búsqueda).
 *
 * Rutas definidas:
 *   GET /api/community/search     → usuarios y fichas de juego por texto
 *   GET /api/community/stats      → nota media por juego entre todos los usuarios
 *   GET /api/community/games/:id  → detalle público de una ficha (para comentarios)
 */

const express = require("express");
const pool = require("../config/db");
const { authMiddleware } = require("../middleware/auth.middleware");
const { queryGamePublicById } = require("../utils/queries");
const { serverErrorPayload } = require("../utils/normalize");
const { coerceAvatarId } = require("../constants/avatars");

const router = express.Router();

/**
 * Búsqueda global: miembros por nombre y fichas de juego por título (todas las colecciones).
 *
 * @route  GET /api/community/search?q=
 * @access Private
 */
router.get("/search", authMiddleware, async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (q.length < 1) {
    return res.json({ users: [], games: [] });
  }
  const pat = `%${q}%`;
  try {
    const [usersR, gamesR] = await Promise.all([
      pool.query(
        `SELECT u.id, u.nombre_usuario, u.avatar_id
         FROM usuarios u
         WHERE u.nombre_usuario ILIKE $1
         ORDER BY u.nombre_usuario ASC
         LIMIT 25`,
        [pat],
      ),
      pool.query(
        `SELECT j.id, j.titulo, j.usuario_id, u.nombre_usuario AS propietario_nombre
         FROM juegos j
         JOIN usuarios u ON u.id = j.usuario_id
         LEFT JOIN catalogo_juegos c ON c.id = j.catalogo_id
         WHERE j.titulo ILIKE $1
            OR COALESCE(c.titulo, '') ILIKE $1
         ORDER BY j.titulo ASC, j.id ASC
         LIMIT 40`,
        [pat],
      ),
    ]);
    res.json({
      users: usersR.rows.map((r) => ({
        ...r,
        avatar_id: coerceAvatarId(r.avatar_id),
      })),
      games: gamesR.rows,
    });
  } catch (error) {
    console.error("[GET /api/community/search]", error);
    res.status(500).json(serverErrorPayload(error, "Error al buscar."));
  }
});

/**
 * Devuelve la nota media de cada juego calculada a partir de las puntuaciones
 * de todos los usuarios de la comunidad.
 *
 * La agrupación usa `catalogo_id` cuando está disponible (más precisa, ya que
 * identifica el mismo juego sin depender del texto del título) y cae al título
 * normalizado cuando el juego fue añadido manualmente sin usar el buscador.
 *
 * @route  GET /api/community/stats
 * @access Private (requiere JWT válido)
 * @returns {object[]} 200 – Array con `{ titulo, nota_media, num_votos }` ordenado por nota desc.
 */
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        MAX(COALESCE(c.titulo, j.titulo))         AS titulo,
        ROUND(AVG(j.puntuacion)::numeric, 2)      AS nota_media,
        COUNT(*)::int                             AS num_votos
      FROM juegos j
      LEFT JOIN catalogo_juegos c ON j.catalogo_id = c.id
      WHERE j.puntuacion IS NOT NULL
      GROUP BY
        CASE
          WHEN j.catalogo_id IS NOT NULL
            THEN 'c:' || j.catalogo_id::text
          ELSE 't:' || LOWER(TRIM(REGEXP_REPLACE(j.titulo, '[[:space:]]+', ' ', 'g')))
        END
      ORDER BY nota_media DESC NULLS LAST, MAX(COALESCE(c.titulo, j.titulo)) ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("[GET /api/community/stats]", error);
    res.status(500).json(serverErrorPayload(error, "Error al cargar estadísticas."));
  }
});

/**
 * Devuelve el detalle público de una ficha de juego.
 * Lo usa la vista de GameDiscussion para mostrar el encabezado del juego
 * antes de cargar el hilo de comentarios.
 *
 * @route  GET /api/community/games/:id
 * @access Private (requiere JWT válido)
 * @param  {string} req.params.id - ID de la ficha de juego.
 * @returns {object} 200 – Datos del juego con `propietario_nombre` | 404 – no encontrado.
 */
router.get("/games/:id", authMiddleware, async (req, res) => {
  try {
    const row = await queryGamePublicById(req.params.id);
    if (!row) {
      return res.status(404).json({ error: "Juego no encontrado." });
    }
    res.json(row);
  } catch (error) {
    console.error("[GET /api/community/games/:id]", error);
    res.status(500).json(serverErrorPayload(error, "Error al cargar el juego."));
  }
});

module.exports = router;
