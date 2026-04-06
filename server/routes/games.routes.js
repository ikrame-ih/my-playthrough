/**
 * @module games.routes
 * @description CRUD completo de la colección personal de juegos (RF-02, RF-03)
 * y sistema de comentarios por hilo (RF-05).
 *
 * Todas las rutas están protegidas con `authMiddleware`. El filtro
 * `usuario_id = req.user.id` garantiza que cada usuario solo puede leer
 * y modificar sus propios juegos, nunca los de otros.
 *
 * Rutas definidas:
 *   GET    /api/games                              → lista mis juegos
 *   POST   /api/games                              → añadir juego
 *   GET    /api/games/:id                          → detalle de un juego (para editar)
 *   PUT    /api/games/:id                          → actualizar juego
 *   DELETE /api/games/:id                          → eliminar juego
 *   GET    /api/games/:gameId/comments             → comentarios de una ficha
 *   POST   /api/games/:gameId/comments             → añadir comentario
 *   DELETE /api/games/:gameId/comments/:commentId  → borrar comentario
 */

const express = require("express");
const pool = require("../config/db");
const { authMiddleware, usuarioEsAdmin } = require("../middleware/auth.middleware");
const {
  queryGamesListForUser,
  queryOneGameForUser,
  juegoComentariosTableExists,
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

const router = express.Router();

// ---------------------------------------------------------------------------
// COLECCIÓN PERSONAL
// ---------------------------------------------------------------------------

/**
 * Devuelve la colección completa del usuario autenticado.
 * El filtro `usuario_id = req.user.id` garantiza el aislamiento entre usuarios:
 * cada usuario solo puede ver sus propios juegos, nunca los de otros.
 *
 * @route  GET /api/games
 * @access Private (requiere JWT válido)
 * @returns {object[]} 200 – Array de fichas de juego del usuario.
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const rows = await queryGamesListForUser(req.user.id);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Añade un nuevo juego a la colección del usuario.
 * Hay dos caminos: si el usuario eligió el juego del buscador oficial (RAWG/Steam),
 * el body incluye `catalogo_ref` y se usa una transacción para enlazar la ficha
 * con `catalogo_juegos`. Si el título fue escrito a mano, se inserta directamente.
 *
 * @route  POST /api/games
 * @access Private (requiere JWT válido)
 * @param  {string} req.body.titulo         - Título del juego.
 * @param  {string} req.body.estado         - Estado: 'Pendiente', 'Jugando' o 'Completado'.
 * @param  {string} [req.body.plataforma]   - Plataforma (por defecto 'PC').
 * @param  {number} [req.body.puntuacion]   - Nota del 0 al 10.
 * @param  {number} [req.body.horas_jugadas]- Horas jugadas.
 * @param  {string} [req.body.url_imagen]   - URL de la portada.
 * @param  {object} [req.body.catalogo_ref] - Referencia al catálogo `{ source, id }`.
 * @returns {object} 201 – `{ success, data }` | 400 – duplicado o datos inválidos.
 */
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

    // --- Camino A: viene del catálogo (RAWG/Steam) → transacción ---
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

    // --- Camino B: título escrito a mano ---
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

/**
 * Devuelve el detalle de una ficha de juego para precargar el formulario de edición.
 * El filtro por `usuario_id` impide leer juegos ajenos aunque se conozca el ID.
 *
 * @route  GET /api/games/:id
 * @access Private (requiere JWT válido)
 * @param  {string} req.params.id - ID de la ficha de juego.
 * @returns {object} 200 – Datos del juego | 404 – no encontrado.
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const row = await queryOneGameForUser(req.user.id, req.params.id);
    if (!row) {
      return res.status(404).json({ error: "Juego no encontrado." });
    }
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Actualiza una ficha existente. La lógica es equivalente al POST pero
 * gestiona además el caso en que el nuevo título coincida con otra ficha
 * del mismo usuario (`merge_duplicate`).
 *
 * @route  PUT /api/games/:id
 * @access Private (requiere JWT válido)
 * @param  {string}  req.params.id               - ID de la ficha a actualizar.
 * @param  {boolean} [req.body.merge_duplicate]   - Si es `true`, borra la ficha duplicada que colisione.
 * @returns {object} 200 – `{ success, data }` | 400 – conflicto de título | 404 – no encontrado.
 */
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

    // --- Camino A: viene del catálogo ---
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

    // --- Camino B: título a mano ---
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

/**
 * Elimina una ficha de juego. Solo funciona si el juego pertenece al usuario.
 * El `AND usuario_id = req.user.id` actúa como barrera de seguridad: si alguien
 * intenta borrar el juego de otro usuario, la query no encuentra ninguna fila
 * y devuelve 404 sin revelar que el juego existe.
 *
 * @route  DELETE /api/games/:id
 * @access Private (requiere JWT válido)
 * @param  {string} req.params.id - ID de la ficha a eliminar.
 * @returns {object} 200 – `{ success, message }` | 404 – no encontrado.
 */
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

// ---------------------------------------------------------------------------
// COMENTARIOS
// ---------------------------------------------------------------------------

/**
 * Devuelve todos los comentarios de una ficha ordenados cronológicamente.
 * Si la tabla `juego_comentarios` no existe, devuelve 503 con instrucciones
 * en lugar de un error de PostgreSQL críptico.
 *
 * @route  GET /api/games/:gameId/comments
 * @access Private (requiere JWT válido)
 * @param  {string} req.params.gameId - ID de la ficha.
 * @returns {object} 200 – `{ comments: [...] }` | 503 – tabla no creada.
 */
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

    if (!(await juegoComentariosTableExists())) {
      return res.status(503).json({
        error: "Los comentarios no están activos. Ejecuta docs/add-juego-comentarios.sql.",
      });
    }

    const result = await pool.query(
      `SELECT c.id, c.juego_id, c.usuario_id, c.parent_id, c.cuerpo, c.fecha_creacion,
              u.nombre_usuario AS autor_nombre
       FROM juego_comentarios c
       JOIN usuarios u ON u.id = c.usuario_id
       WHERE c.juego_id = $1
       ORDER BY c.fecha_creacion ASC`,
      [gameId],
    );
    res.json({ comments: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Añade un comentario o respuesta a una ficha.
 * Soporta hilos anidados mediante `parent_id`. Se valida que el comentario
 * padre pertenezca al mismo juego para evitar comentarios "huérfanos".
 *
 * @route  POST /api/games/:gameId/comments
 * @access Private (requiere JWT válido)
 * @param  {string} req.body.cuerpo      - Texto del comentario (máx. 8000 caracteres).
 * @param  {number} [req.body.parent_id] - ID del comentario al que se responde.
 * @returns {object} 201 – `{ comment }` con datos del autor incluidos.
 */
router.post("/:gameId/comments", authMiddleware, async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId, 10);
    if (Number.isNaN(gameId)) {
      return res.status(400).json({ error: "ID inválido." });
    }

    if (!(await juegoComentariosTableExists())) {
      return res.status(503).json({
        error: "Los comentarios no están activos. Ejecuta docs/add-juego-comentarios.sql.",
      });
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

    // Devuelvo el nombre del autor para que el frontend no tenga que pedirlo aparte
    const nombre = await pool.query(
      "SELECT nombre_usuario FROM usuarios WHERE id = $1",
      [req.user.id],
    );

    res.status(201).json({
      comment: {
        ...ins.rows[0],
        autor_nombre: nombre.rows[0]?.nombre_usuario ?? "",
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Elimina un comentario. Pueden borrarlo: su autor, el dueño de la ficha o un admin.
 * Esta política de tres niveles permite la auto-moderación sin depender siempre del admin.
 *
 * @route  DELETE /api/games/:gameId/comments/:commentId
 * @access Private (requiere JWT válido)
 * @returns {object} 200 – `{ success }` | 403 – sin permisos | 404 – no encontrado.
 */
router.delete("/:gameId/comments/:commentId", authMiddleware, async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId, 10);
    const commentId = parseInt(req.params.commentId, 10);
    if (Number.isNaN(gameId) || Number.isNaN(commentId)) {
      return res.status(400).json({ error: "ID inválido." });
    }

    if (!(await juegoComentariosTableExists())) {
      return res.status(503).json({ error: "Comentarios no disponibles." });
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
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
