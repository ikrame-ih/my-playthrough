/**
 * community.routes.js
 *
 * Rutas para las estadísticas globales de la comunidad (RF-05).
 * Agregan datos de todos los usuarios para mostrar información colectiva
 * como la nota media de cada juego.
 *
 * Rutas definidas aquí:
 *   GET /api/community/stats      → ranking de juegos por nota media
 *   GET /api/community/games/:id  → detalle público de una ficha concreta
 */

const express = require("express");
const pool = require("../config/db");
const { authMiddleware } = require("../middleware/auth.middleware");
const { queryGamePublicById } = require("../utils/queries");

const router = express.Router();

/**
 * GET /api/community/stats
 * Calcula la nota media de cada juego agrupando las valoraciones de todos
 * los usuarios. Usa COALESCE para preferir el nombre del catálogo sobre el
 * título libre, y agrupa por clave de catálogo o por título normalizado
 * para que distintas fichas del mismo juego se cuenten juntas.
 *
 * La función SQL REGEXP_REPLACE colapsa espacios múltiples igual que
 * nuestra función normalizeGameTitle en JavaScript, garantizando coherencia.
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
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/community/games/:id
 * Devuelve el detalle de una ficha de juego para mostrar en el hilo
 * de comentarios de la comunidad. Cualquier usuario logueado puede verla,
 * no solo el propietario.
 */
router.get("/games/:id", authMiddleware, async (req, res) => {
  try {
    const row = await queryGamePublicById(req.params.id);
    if (!row) {
      return res.status(404).json({ error: "Juego no encontrado." });
    }
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
