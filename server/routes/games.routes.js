// User game collection (scoped by usuario_id) and discussion threads on game pages.
// Comment delete: author, game owner, or admin.

const express = require("express");
const pool = require("../config/db");
const { authMiddleware, usuarioEsAdmin } = require("../middleware/auth.middleware");
const {
  queryGamesListForUser,
  queryOneGameForUser,
} = require("../utils/queries");
const {
  normalizeGameTitle,
  normalizePlataforma,
  normalizeEstadoForDb,
  parseCatalogoRef,
  titleMatchKey,
  serverErrorPayload,
} = require("../utils/normalize");
const { upsertCatalogoGame } = require("../utils/covers");
const { coerceAvatarId } = require("../constants/avatars");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const rows = await queryGamesListForUser(req.user.id);
    res.json(rows);
  } catch (error) {
    console.error("[GET /api/games]", error);
    res.status(500).json(serverErrorPayload(error, "Error al cargar la colección."));
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { titulo, estado, plataforma, puntuacion, horas_jugadas, url_imagen } =
      req.body;

    const tituloNorm = normalizeGameTitle(titulo);
    if (!tituloNorm) {
      return res.status(400).json({ success: false, error: "El título es obligatorio." });
    }

    const estadoVal = normalizeEstadoForDb(estado);
    const plataformaVal = normalizePlataforma(plataforma);
    const catalogoRef = parseCatalogoRef(req.body);
    const tituloKey = titleMatchKey(tituloNorm);
    const url =
      typeof url_imagen === "string" && url_imagen.trim() !== ""
        ? url_imagen.trim()
        : null;
    const puntuacionVal = Number.isFinite(Number(puntuacion)) ? Number(puntuacion) : 0;
    const horasVal = Number.isFinite(Number(horas_jugadas))
      ? Math.max(0, Number(horas_jugadas))
      : 0;

    // Catalog pick (RAWG/Steam): upsert catalogo_juegos in a transaction
    if (catalogoRef) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const catId = await upsertCatalogoGame(client, {
          source: catalogoRef.source,
          id: catalogoRef.id,
          titulo: tituloNorm,
          url_imagen: url,
        });
        if (!catId) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            success: false,
            error: "No se pudo registrar el juego en el catálogo.",
          });
        }
        const dup = await client.query(
          "SELECT id FROM juegos WHERE usuario_id = $1 AND catalogo_id = $2",
          [req.user.id, catId],
        );
        if (dup.rows.length > 0) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            success: false,
            error: "Este juego ya está en tu colección.",
          });
        }
        const ins = await client.query(
          `INSERT INTO juegos
             (usuario_id, titulo, estado, plataforma, puntuacion, horas_jugadas, url_imagen, catalogo_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [req.user.id, tituloNorm, estadoVal, plataformaVal, puntuacionVal, horasVal, url, catId],
        );
        await client.query("COMMIT");
        const row = await queryOneGameForUser(req.user.id, ins.rows[0].id);
        return res.status(201).json({ success: true, data: row });
      } catch (e) {
        try { await client.query("ROLLBACK"); } catch (_) { /* */ }
        throw e;
      } finally {
        client.release();
      }
    }

    // Manual title: insert without catalogo_id
    const checkJuego = await pool.query(
      `SELECT id FROM juegos
       WHERE LOWER(TRIM(REGEXP_REPLACE(titulo, '[[:space:]]+', ' ', 'g'))) = $1
         AND usuario_id = $2`,
      [tituloKey, req.user.id],
    );
    if (checkJuego.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Este juego ya está en tu colección.",
      });
    }

    const nuevoJuego = await pool.query(
      `INSERT INTO juegos
         (usuario_id, titulo, estado, plataforma, puntuacion, horas_jugadas, url_imagen)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [req.user.id, tituloNorm, estadoVal, plataformaVal, puntuacionVal, horasVal, url],
    );

    const row = await queryOneGameForUser(req.user.id, nuevoJuego.rows[0].id);
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    console.error("[POST /api/games]", err);
    res.status(500).json(serverErrorPayload(err, "Error de servidor al guardar el juego"));
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const row = await queryOneGameForUser(req.user.id, req.params.id);
    if (!row) {
      return res.status(404).json({ error: "Juego no encontrado." });
    }
    res.json(row);
  } catch (error) {
    console.error("[GET /api/games/:id]", error);
    res.status(500).json(serverErrorPayload(error, "Error al cargar el juego."));
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const gameRowId = parseInt(req.params.id, 10);
    if (Number.isNaN(gameRowId)) {
      return res.status(400).json({ error: "ID de juego inválido." });
    }

    const { titulo, estado, plataforma, puntuacion, horas_jugadas, url_imagen } =
      req.body;

    const tituloNorm = normalizeGameTitle(titulo);
    if (!tituloNorm) {
      return res.status(400).json({ error: "El título es obligatorio." });
    }

    const estadoVal = normalizeEstadoForDb(estado);
    const plataformaVal = normalizePlataforma(plataforma);
    const catalogoRef = parseCatalogoRef(req.body);
    const tituloKey = titleMatchKey(tituloNorm);
    const url =
      typeof url_imagen === "string" && url_imagen.trim() !== ""
        ? url_imagen.trim()
        : null;
    const puntuacionVal = Number.isFinite(Number(puntuacion)) ? Number(puntuacion) : 0;
    const horasVal = Number.isFinite(Number(horas_jugadas))
      ? Math.max(0, Number(horas_jugadas))
      : 0;

    const prev = await pool.query(
      "SELECT id FROM juegos WHERE id = $1 AND usuario_id = $2",
      [gameRowId, req.user.id],
    );
    if (prev.rows.length === 0) {
      return res.status(404).json({ error: "Juego no encontrado." });
    }

    // Si el usuario marca "eliminar duplicada", borramos la otra ficha que choca
    const mergeDup = req.body.merge_duplicate === true;

    const conflictingRows = await pool.query(
      `SELECT id FROM juegos
       WHERE usuario_id = $1 AND id <> $2 AND (
         LOWER(TRIM(REGEXP_REPLACE(titulo, '[[:space:]]+', ' ', 'g'))) = $3
         OR titulo = $4
       )`,
      [req.user.id, gameRowId, tituloKey, tituloNorm],
    );
    if (conflictingRows.rows.length > 0) {
      if (mergeDup) {
        const ids = conflictingRows.rows.map((r) => r.id);
        await pool.query(
          "DELETE FROM juegos WHERE usuario_id = $1 AND id = ANY($2::int[])",
          [req.user.id, ids],
        );
      } else {
        return res.status(400).json({
          error:
            "Ya tienes otra ficha con el mismo título. " +
            "Marca «Eliminar la otra ficha duplicada» y guarda de nuevo.",
          merge_available: true,
        });
      }
    }

    // Catalog pick (RAWG/Steam)
    if (catalogoRef) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const catId = await upsertCatalogoGame(client, {
          source: catalogoRef.source,
          id: catalogoRef.id,
          titulo: tituloNorm,
          url_imagen: url,
        });
        if (!catId) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "No se pudo actualizar el catálogo." });
        }
        const dup = await client.query(
          "SELECT id FROM juegos WHERE usuario_id = $1 AND catalogo_id = $2 AND id <> $3",
          [req.user.id, catId, gameRowId],
        );
        if (dup.rows.length > 0) {
          if (mergeDup) {
            const ids = dup.rows.map((r) => r.id);
            await client.query(
              "DELETE FROM juegos WHERE usuario_id = $1 AND id = ANY($2::int[])",
              [req.user.id, ids],
            );
          } else {
            await client.query("ROLLBACK");
            return res.status(400).json({
              error:
                "Ya tienes otra ficha enlazada al mismo juego del catálogo. " +
                "Marca «Eliminar la otra ficha duplicada» y guarda de nuevo.",
              merge_available: true,
            });
          }
        }
        await client.query(
          `UPDATE juegos
           SET titulo = $1, estado = $2, plataforma = $3,
               puntuacion = $4, horas_jugadas = $5, url_imagen = $6, catalogo_id = $7
           WHERE id = $8 AND usuario_id = $9`,
          [tituloNorm, estadoVal, plataformaVal, puntuacionVal, horasVal, url, catId, gameRowId, req.user.id],
        );
        await client.query("COMMIT");
        const row = await queryOneGameForUser(req.user.id, gameRowId);
        return res.json({ success: true, data: row });
      } catch (e) {
        try { await client.query("ROLLBACK"); } catch (_) { /* */ }
        throw e;
      } finally {
        client.release();
      }
    }

    // Manual title
    const result = await pool.query(
      `UPDATE juegos
       SET titulo = $1, estado = $2, plataforma = $3,
           puntuacion = $4, horas_jugadas = $5, url_imagen = $6
       WHERE id = $7 AND usuario_id = $8
       RETURNING id`,
      [tituloNorm, estadoVal, plataformaVal, puntuacionVal, horasVal, url, gameRowId, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Juego no encontrado." });
    }

    const row = await queryOneGameForUser(req.user.id, gameRowId);
    res.json({ success: true, data: row });
  } catch (err) {
    console.error("[PUT /api/games]", err);
    if (err.code === "23505") {
      return res.status(400).json({
        error: "Ese título ya está en tu colección en otra ficha (restricción única en BD).",
        detail: err.detail,
      });
    }
    res.status(500).json(serverErrorPayload(err, "Error al actualizar el juego"));
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM juegos WHERE id = $1 AND usuario_id = $2 RETURNING id",
      [req.params.id, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Juego no encontrado." });
    }
    res.json({ success: true, message: "Juego eliminado correctamente." });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al intentar eliminar el juego." });
  }
});

router.get("/:gameId/comments", authMiddleware, async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId, 10);
    if (Number.isNaN(gameId)) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const exists = await pool.query("SELECT 1 FROM juegos WHERE id = $1", [gameId]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: "Juego no encontrado." });
    }

    const result = await pool.query(
      `SELECT c.id, c.juego_id, c.usuario_id, c.parent_id, c.cuerpo, c.fecha_creacion,
              u.nombre_usuario AS autor_nombre,
              u.avatar_id AS autor_avatar_id,
              COALESCE(SUM(CASE WHEN v.valor = 1 THEN 1 ELSE 0 END), 0)::int AS votos_arriba,
              COALESCE(SUM(CASE WHEN v.valor = -1 THEN 1 ELSE 0 END), 0)::int AS votos_abajo,
              MAX(CASE WHEN v.usuario_id = $2 THEN v.valor END)::int AS mi_voto
       FROM juego_comentarios c
       JOIN usuarios u ON u.id = c.usuario_id
       LEFT JOIN juego_comentario_votos v ON v.comentario_id = c.id
       WHERE c.juego_id = $1
       GROUP BY c.id, c.juego_id, c.usuario_id, c.parent_id, c.cuerpo, c.fecha_creacion,
                u.nombre_usuario, u.avatar_id
       ORDER BY c.fecha_creacion ASC`,
      [gameId, req.user.id],
    );
    res.json({
      comments: result.rows.map((row) => ({
        ...row,
        autor_avatar_id: coerceAvatarId(row.autor_avatar_id),
        mi_voto: row.mi_voto == null ? null : Number(row.mi_voto),
      })),
    });
  } catch (error) {
    console.error("[GET comments]", error);
    if (error.code === "42P01") {
      return res.status(503).json({
        error:
          "Falta la tabla de votos en reseñas. Ejecuta en el servidor: npm run migrate:votes",
      });
    }
    res.status(500).json(serverErrorPayload(error, "Error al cargar los comentarios."));
  }
});

router.post("/:gameId/comments", authMiddleware, async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId, 10);
    if (Number.isNaN(gameId)) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const cuerpo = String(req.body?.cuerpo ?? "").trim();
    if (!cuerpo || cuerpo.length > 8000) {
      return res.status(400).json({
        error: "El mensaje es obligatorio (máx. 8000 caracteres).",
      });
    }

    const g = await pool.query("SELECT id FROM juegos WHERE id = $1", [gameId]);
    if (g.rows.length === 0) {
      return res.status(404).json({ error: "Juego no encontrado." });
    }

    let parentId = null;
    if (req.body?.parent_id != null && req.body.parent_id !== "") {
      const p = parseInt(req.body.parent_id, 10);
      if (Number.isNaN(p)) {
        return res.status(400).json({ error: "parent_id inválido." });
      }
      const pr = await pool.query(
        "SELECT id FROM juego_comentarios WHERE id = $1 AND juego_id = $2",
        [p, gameId],
      );
      if (pr.rows.length === 0) {
        return res.status(400).json({ error: "Comentario padre no encontrado." });
      }
      parentId = p;
    }

    const ins = await pool.query(
      `INSERT INTO juego_comentarios (juego_id, usuario_id, parent_id, cuerpo)
       VALUES ($1, $2, $3, $4)
       RETURNING id, juego_id, usuario_id, parent_id, cuerpo, fecha_creacion`,
      [gameId, req.user.id, parentId, cuerpo],
    );

    const nombre = await pool.query(
      "SELECT nombre_usuario, avatar_id FROM usuarios WHERE id = $1",
      [req.user.id],
    );

    res.status(201).json({
      comment: {
        ...ins.rows[0],
        autor_nombre: nombre.rows[0]?.nombre_usuario ?? "",
        autor_avatar_id: coerceAvatarId(nombre.rows[0]?.avatar_id),
      },
    });
  } catch (error) {
    console.error("[POST comment]", error);
    res.status(500).json(serverErrorPayload(error, "Error al publicar el comentario."));
  }
});

router.delete("/:gameId/comments/:commentId", authMiddleware, async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId, 10);
    const commentId = parseInt(req.params.commentId, 10);
    if (Number.isNaN(gameId) || Number.isNaN(commentId)) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const row = await pool.query(
      `SELECT c.id, c.usuario_id, j.usuario_id AS juego_owner
       FROM juego_comentarios c
       JOIN juegos j ON j.id = c.juego_id
       WHERE c.id = $1 AND c.juego_id = $2`,
      [commentId, gameId],
    );
    if (row.rows.length === 0) {
      return res.status(404).json({ error: "Comentario no encontrado." });
    }

    const r = row.rows[0];
    const isAuthor = r.usuario_id === req.user.id;
    const isGameOwner = r.juego_owner === req.user.id;
    const isAdmin = await usuarioEsAdmin(req.user.id);

    if (!isAuthor && !isGameOwner && !isAdmin) {
      return res.status(403).json({ error: "No puedes eliminar este comentario." });
    }

    await pool.query("DELETE FROM juego_comentarios WHERE id = $1", [commentId]);
    res.json({ success: true, message: "Comentario eliminado." });
  } catch (error) {
    console.error("[DELETE comment]", error);
    res.status(500).json(serverErrorPayload(error, "Error al eliminar el comentario."));
  }
});

router.put("/:gameId/comments/:commentId/vote", authMiddleware, async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId, 10);
    const commentId = parseInt(req.params.commentId, 10);
    if (Number.isNaN(gameId) || Number.isNaN(commentId)) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const raw = req.body?.val;
    const val = raw === 0 || raw === "0" ? 0 : Number(raw);
    if (val !== 0 && val !== 1 && val !== -1) {
      return res.status(400).json({ error: "Usa val: 1, -1 o 0 (quitar voto)." });
    }

    const row = await pool.query(
      `SELECT c.id, c.parent_id FROM juego_comentarios c WHERE c.id = $1 AND c.juego_id = $2`,
      [commentId, gameId],
    );
    if (row.rows.length === 0) {
      return res.status(404).json({ error: "Comentario no encontrado." });
    }
    if (row.rows[0].parent_id != null) {
      return res
        .status(400)
        .json({ error: "Solo se pueden valorar reseñas de primer nivel." });
    }

    if (val === 0) {
      await pool.query(
        `DELETE FROM juego_comentario_votos WHERE comentario_id = $1 AND usuario_id = $2`,
        [commentId, req.user.id],
      );
    } else {
      await pool.query(
        `INSERT INTO juego_comentario_votos (comentario_id, usuario_id, valor)
         VALUES ($1, $2, $3)
         ON CONFLICT (comentario_id, usuario_id) DO UPDATE SET valor = EXCLUDED.valor`,
        [commentId, req.user.id, val],
      );
    }

    const agg = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN valor = 1 THEN 1 ELSE 0 END), 0)::int AS votos_arriba,
         COALESCE(SUM(CASE WHEN valor = -1 THEN 1 ELSE 0 END), 0)::int AS votos_abajo
       FROM juego_comentario_votos WHERE comentario_id = $1`,
      [commentId],
    );
    const mine = await pool.query(
      `SELECT valor FROM juego_comentario_votos WHERE comentario_id = $1 AND usuario_id = $2`,
      [commentId, req.user.id],
    );

    res.json({
      votos_arriba: agg.rows[0]?.votos_arriba ?? 0,
      votos_abajo: agg.rows[0]?.votos_abajo ?? 0,
      mi_voto: mine.rows[0]?.valor != null ? Number(mine.rows[0].valor) : null,
    });
  } catch (error) {
    console.error("[PUT vote]", error);
    if (error.code === "42P01") {
      return res.status(503).json({
        error:
          "Falta la tabla de votos. Ejecuta npm run migrate:votes en la carpeta server.",
      });
    }
    res.status(500).json(serverErrorPayload(error, "Error al registrar el voto."));
  }
});

module.exports = router;
