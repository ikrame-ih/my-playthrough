// Community aggregates: search, global rating stats, public game header for discussions.

const express = require("express");
const pool = require("../config/db");
const { authMiddleware } = require("../middleware/auth.middleware");
const { queryGamePublicById } = require("../utils/queries");
const { serverErrorPayload } = require("../utils/normalize");
const { coerceAvatarId } = require("../constants/avatars");

const router = express.Router();

/** GET /search?q= — members + game entries across the community. */
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

/** GET /stats — average score per title (group by catalogo_id when present). */
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

/** GET /games/:id — public header for discussion view. */
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
