/**
 * @module social.routes
 * @description Red social ligada a la biblioteca: seguir a otro usuario, recomendarle
 * un título que tú tienes en tu colección (solo si tú eres quien sigue a él), LFG
 * (buscar grupo) anclado a un juego tuyo, actividad agregada de gente a la que sigues
 * y conteo de recomendaciones no leídas para la campana del header.
 *
 * La regla “solo recomiendo a quien sigo” evita spam de mensajes a desconocidos.
 */

const express = require("express");
const pool = require("../config/db");
const {
  authMiddleware,
  usuarioEsAdmin,
} = require("../middleware/auth.middleware");
const { serverErrorPayload } = require("../utils/normalize");
const { coerceAvatarId } = require("../constants/avatars");

const router = express.Router();

const LFG_MODOS = new Set(["online", "coop_local", "otro"]);

function parseId(param) {
  const n = parseInt(param, 10);
  return Number.isNaN(n) ? null : n;
}

/**
 * GET /api/social/follow-status/:userId
 * Indica si el usuario autenticado sigue al objetivo.
 */
router.get("/follow-status/:userId", authMiddleware, async (req, res) => {
  const targetId = parseId(req.params.userId);
  if (targetId === null || targetId < 1) {
    return res.status(400).json({ error: "ID de usuario inválido." });
  }
  try {
    const r = await pool.query(
      `SELECT 1 FROM usuario_seguimientos
       WHERE seguidor_id = $1 AND seguido_id = $2`,
      [req.user.id, targetId],
    );
    return res.json({ following: r.rows.length > 0 });
  } catch (error) {
    console.error("[GET follow-status]", error);
    return res.status(500).json(serverErrorPayload(error, "Error al comprobar seguimiento."));
  }
});

/**
 * POST /api/social/follow/:userId
 * El usuario autenticado sigue a otro (no a sí mismo).
 */
router.post("/follow/:userId", authMiddleware, async (req, res) => {
  const targetId = parseId(req.params.userId);
  if (targetId === null || targetId < 1) {
    return res.status(400).json({ error: "ID de usuario inválido." });
  }
  if (targetId === req.user.id) {
    return res.status(400).json({ error: "No puedes seguirte a ti misma." });
  }
  try {
    const exists = await pool.query("SELECT 1 FROM usuarios WHERE id = $1", [
      targetId,
    ]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }
    await pool.query(
      `INSERT INTO usuario_seguimientos (seguidor_id, seguido_id)
       VALUES ($1, $2)
       ON CONFLICT (seguidor_id, seguido_id) DO NOTHING`,
      [req.user.id, targetId],
    );
    return res.status(201).json({ success: true });
  } catch (error) {
    console.error("[POST /api/social/follow/:userId]", error);
    if (error.code === "42P01") {
      return res.status(500).json({
        error:
          "Faltan tablas sociales. Ejecuta docs/sql/add-social-features.sql en la base de datos.",
      });
    }
    return res.status(500).json(serverErrorPayload(error, "Error al seguir."));
  }
});

/**
 * DELETE /api/social/follow/:userId
 */
router.delete("/follow/:userId", authMiddleware, async (req, res) => {
  const targetId = parseId(req.params.userId);
  if (targetId === null || targetId < 1) {
    return res.status(400).json({ error: "ID de usuario inválido." });
  }
  try {
    await pool.query(
      `DELETE FROM usuario_seguimientos
       WHERE seguidor_id = $1 AND seguido_id = $2`,
      [req.user.id, targetId],
    );
    return res.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/social/follow/:userId]", error);
    return res
      .status(500)
      .json(serverErrorPayload(error, "Error al dejar de seguir."));
  }
});

/**
 * GET /api/social/following
 * Lista de usuarios a los que sigo (id, nombre_usuario, avatar_id).
 */
router.get("/following", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.nombre_usuario, u.avatar_id
       FROM usuario_seguimientos s
       JOIN usuarios u ON u.id = s.seguido_id
       WHERE s.seguidor_id = $1
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
    console.error("[GET /api/social/following]", error);
    res.status(500).json(serverErrorPayload(error, "Error al cargar seguimientos."));
  }
});

/**
 * GET /api/social/activity
 * Actividad reciente de usuarios seguidos: comentarios y publicaciones LFG.
 */
router.get("/activity", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM (
         SELECT
           'comentario'::text AS tipo,
           jc.fecha_creacion AS en,
           u.id AS actor_id,
           u.nombre_usuario AS actor_nombre,
           u.avatar_id AS actor_avatar_id,
           j.titulo AS juego_titulo,
           j.id AS juego_ficha_id,
           jc.id AS comentario_id,
           left(
             trim(replace(replace(jc.cuerpo, E'\n', ' '), E'\r', ' ')),
             140
           ) AS resumen,
           NULL::text AS modo,
           NULL::text AS lfg_mensaje,
           NULL::int AS lfg_id
         FROM juego_comentarios jc
         JOIN juegos j ON j.id = jc.juego_id
         JOIN usuarios u ON u.id = jc.usuario_id
         WHERE jc.usuario_id IN (
           SELECT seguido_id FROM usuario_seguimientos WHERE seguidor_id = $1
         )
         UNION ALL
         SELECT
           'lfg'::text,
           l.created_at,
           u.id,
           u.nombre_usuario,
           u.avatar_id,
           j.titulo,
           j.id,
           NULL::int,
           NULL,
           l.modo,
           l.mensaje,
           l.id
         FROM lfg_publicaciones l
         JOIN juegos j ON j.id = l.juego_id
         JOIN usuarios u ON u.id = l.usuario_id
         WHERE l.activo
           AND l.usuario_id IN (
             SELECT seguido_id FROM usuario_seguimientos WHERE seguidor_id = $1
           )
       ) AS act
       ORDER BY act.en DESC
       LIMIT 40`,
      [req.user.id],
    );
    res.json(
      result.rows.map((r) => ({
        ...r,
        actor_avatar_id: coerceAvatarId(r.actor_avatar_id),
      })),
    );
  } catch (error) {
    console.error("[GET /api/social/activity]", error);
    res.status(500).json(serverErrorPayload(error, "Error al cargar actividad."));
  }
});

/**
 * GET /api/social/recommendations/unread-count
 */
router.get("/recommendations/unread-count", authMiddleware, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT COUNT(*)::int AS n
       FROM juego_recomendaciones
       WHERE destinatario_id = $1 AND leida = FALSE`,
      [req.user.id],
    );
    res.json({ count: r.rows[0]?.n ?? 0 });
  } catch (error) {
    console.error("[GET unread-count]", error);
    res.status(500).json(serverErrorPayload(error, "Error al contar recomendaciones."));
  }
});

/**
 * GET /api/social/recommendations
 * Bandeja de entrada (recomendaciones recibidas).
 */
router.get("/recommendations", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         r.id,
         r.leida,
         r.created_at,
         r.mensaje,
         rm.id AS remitente_id,
         rm.nombre_usuario AS remitente_nombre,
         rm.avatar_id AS remitente_avatar_id,
         j.titulo AS juego_titulo,
         j.id AS juego_id,
         j.url_imagen AS juego_url_imagen
       FROM juego_recomendaciones r
       JOIN usuarios rm ON rm.id = r.remitente_id
       JOIN juegos j ON j.id = r.juego_id
       WHERE r.destinatario_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id],
    );
    res.json(
      result.rows.map((row) => ({
        ...row,
        remitente_avatar_id: coerceAvatarId(row.remitente_avatar_id),
      })),
    );
  } catch (error) {
    console.error("[GET /api/social/recommendations]", error);
    res
      .status(500)
      .json(serverErrorPayload(error, "Error al cargar recomendaciones."));
  }
});

/**
 * POST /api/social/recommendations
 * Solo si sigues al destinatario; el juego debe ser tuyo.
 */
router.post("/recommendations", authMiddleware, async (req, res) => {
  const destinatario_id = parseId(req.body?.destinatario_id);
  const juego_id = parseId(req.body?.juego_id);
  let mensaje = req.body?.mensaje;
  if (mensaje != null) mensaje = String(mensaje).trim();
  if (mensaje === "") mensaje = null;

  if (destinatario_id === null || juego_id === null) {
    return res
      .status(400)
      .json({ error: "destinatario_id y juego_id son obligatorios." });
  }
  if (destinatario_id === req.user.id) {
    return res.status(400).json({ error: "No puedes recomendarte a ti misma." });
  }
  if (mensaje && mensaje.length > 500) {
    return res.status(400).json({ error: "El mensaje admite como máximo 500 caracteres." });
  }

  try {
    const follow = await pool.query(
      `SELECT 1 FROM usuario_seguimientos
       WHERE seguidor_id = $1 AND seguido_id = $2`,
      [req.user.id, destinatario_id],
    );
    if (follow.rows.length === 0) {
      return res.status(403).json({
        error: "Solo puedes recomendar juegos a usuarios a los que sigues.",
      });
    }

    const game = await pool.query(
      "SELECT id FROM juegos WHERE id = $1 AND usuario_id = $2",
      [juego_id, req.user.id],
    );
    if (game.rows.length === 0) {
      return res.status(400).json({
        error: "Ese juego no está en tu colección o no existe.",
      });
    }

    const destOk = await pool.query("SELECT 1 FROM usuarios WHERE id = $1", [
      destinatario_id,
    ]);
    if (destOk.rows.length === 0) {
      return res.status(404).json({ error: "Destinatario no encontrado." });
    }

    const ins = await pool.query(
      `INSERT INTO juego_recomendaciones
         (remitente_id, destinatario_id, juego_id, mensaje)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at, leida`,
      [req.user.id, destinatario_id, juego_id, mensaje],
    );
    return res.status(201).json(ins.rows[0]);
  } catch (error) {
    console.error("[POST /api/social/recommendations]", error);
    return res
      .status(500)
      .json(serverErrorPayload(error, "Error al enviar la recomendación."));
  }
});

/**
 * PATCH /api/social/recommendations/:id/read
 */
router.patch("/recommendations/:id/read", authMiddleware, async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "ID inválido." });
  }
  try {
    const r = await pool.query(
      `UPDATE juego_recomendaciones
       SET leida = TRUE
       WHERE id = $1 AND destinatario_id = $2
       RETURNING id, leida`,
      [id, req.user.id],
    );
    if (r.rows.length === 0) {
      return res.status(404).json({ error: "Recomendación no encontrada." });
    }
    return res.json(r.rows[0]);
  } catch (error) {
    console.error("[PATCH recommendations read]", error);
    return res.status(500).json(serverErrorPayload(error, "Error al marcar como leída."));
  }
});

/**
 * GET /api/social/lfg
 * Publicaciones activas (todas las usuarias).
 */
router.get("/lfg", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         l.id,
         l.modo,
         l.mensaje,
         l.created_at,
         u.id AS usuario_id,
         u.nombre_usuario,
         u.avatar_id,
         j.id AS juego_id,
         j.titulo AS juego_titulo,
         j.plataforma,
         j.url_imagen
       FROM lfg_publicaciones l
       JOIN usuarios u ON u.id = l.usuario_id
       JOIN juegos j ON j.id = l.juego_id
       WHERE l.activo = TRUE
       ORDER BY l.created_at DESC
       LIMIT 120`,
    );
    res.json(
      result.rows.map((row) => ({
        ...row,
        avatar_id: coerceAvatarId(row.avatar_id),
      })),
    );
  } catch (error) {
    console.error("[GET /api/social/lfg]", error);
    res.status(500).json(serverErrorPayload(error, "Error al cargar buscar grupo."));
  }
});

/**
 * POST /api/social/lfg
 */
router.post("/lfg", authMiddleware, async (req, res) => {
  const juego_id = parseId(req.body?.juego_id);
  const modo = String(req.body?.modo ?? "").trim();
  const mensaje = String(req.body?.mensaje ?? "").trim();

  if (juego_id === null) {
    return res.status(400).json({ error: "juego_id es obligatorio." });
  }
  if (!LFG_MODOS.has(modo)) {
    return res.status(400).json({
      error: "modo debe ser online, coop_local u otro.",
    });
  }
  if (!mensaje || mensaje.length > 500) {
    return res.status(400).json({
      error: "mensaje obligatorio (máx. 500 caracteres).",
    });
  }

  try {
    const game = await pool.query(
      "SELECT id FROM juegos WHERE id = $1 AND usuario_id = $2",
      [juego_id, req.user.id],
    );
    if (game.rows.length === 0) {
      return res.status(400).json({
        error: "Solo puedes publicar LFG para juegos de tu colección.",
      });
    }

    const ins = await pool.query(
      `INSERT INTO lfg_publicaciones (usuario_id, juego_id, modo, mensaje)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at, activo`,
      [req.user.id, juego_id, modo, mensaje],
    );
    return res.status(201).json(ins.rows[0]);
  } catch (error) {
    console.error("[POST /api/social/lfg]", error);
    return res.status(500).json(serverErrorPayload(error, "Error al publicar."));
  }
});

/**
 * DELETE /api/social/lfg/:id
 * Autora o administradora.
 */
router.delete("/lfg/:id", authMiddleware, async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "ID inválido." });
  }
  try {
    const row = await pool.query(
      "SELECT usuario_id FROM lfg_publicaciones WHERE id = $1",
      [id],
    );
    if (row.rows.length === 0) {
      return res.status(404).json({ error: "Publicación no encontrada." });
    }
    const ownerId = row.rows[0].usuario_id;
    const isAdmin = await usuarioEsAdmin(req.user.id);
    if (ownerId !== req.user.id && !isAdmin) {
      return res.status(403).json({ error: "No puedes eliminar esta publicación." });
    }
    await pool.query("DELETE FROM lfg_publicaciones WHERE id = $1", [id]);
    return res.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/social/lfg/:id]", error);
    return res.status(500).json(serverErrorPayload(error, "Error al eliminar."));
  }
});

module.exports = router;
