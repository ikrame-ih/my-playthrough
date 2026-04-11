/**
 * @module queries
 * @description Consultas SQL reutilizables para la tabla `juegos`.
 *
 * Centralizar aquí los SELECT evita repetir el mismo JOIN en cada ruta.
 * Todas las queries usan LEFT JOIN con `catalogo_juegos` para que, cuando
 * el usuario eligió el juego del buscador oficial (RAWG/Steam), se muestre
 * el título e imagen del catálogo en lugar de los de la ficha manual.
 *
 * REQUISITO: La BD debe tener las tablas `catalogo_juegos` y las columnas
 * `url_imagen` y `catalogo_id` en `juegos`. Si no las tienes, ejecuta
 * primero los scripts de `docs/sql/`.
 */

const pool = require("../config/db");

/**
 * Devuelve todos los juegos de un usuario ordenados por fecha de inserción descendente.
 * Usa COALESCE para priorizar el título e imagen del catálogo oficial cuando estén disponibles.
 *
 * @param {number} usuarioId - ID del usuario propietario de la colección.
 * @returns {Promise<object[]>} Array de filas con los juegos del usuario.
 */
async function queryGamesListForUser(usuarioId) {
  const result = await pool.query(
    `SELECT
       j.id,
       j.usuario_id,
       COALESCE(c.titulo, j.titulo)                                          AS titulo,
       j.estado,
       j.plataforma,
       j.puntuacion,
       j.horas_jugadas,
       COALESCE(NULLIF(TRIM(c.url_imagen), ''), NULLIF(TRIM(j.url_imagen), '')) AS url_imagen,
       j.catalogo_id
     FROM juegos j
     LEFT JOIN catalogo_juegos c ON j.catalogo_id = c.id
     WHERE j.usuario_id = $1
     ORDER BY j.id DESC`,
    [usuarioId],
  );
  return result.rows;
}

/**
 * Devuelve el detalle de una sola ficha verificando que pertenezca al usuario.
 * El doble filtro `j.id = $1 AND j.usuario_id = $2` impide que un usuario
 * pueda leer o editar juegos ajenos aunque conozca el ID numérico.
 *
 * @param {number} usuarioId - ID del usuario propietario.
 * @param {number} gameId    - ID de la ficha de juego.
 * @returns {Promise<object|null>} Fila del juego o null si no existe o no pertenece al usuario.
 */
async function queryOneGameForUser(usuarioId, gameId) {
  const r = await pool.query(
    `SELECT
       j.id,
       j.usuario_id,
       COALESCE(c.titulo, j.titulo)                                          AS titulo,
       j.estado,
       j.plataforma,
       j.puntuacion,
       j.horas_jugadas,
       COALESCE(NULLIF(TRIM(c.url_imagen), ''), NULLIF(TRIM(j.url_imagen), '')) AS url_imagen,
       j.catalogo_id
     FROM juegos j
     LEFT JOIN catalogo_juegos c ON j.catalogo_id = c.id
     WHERE j.id = $1 AND j.usuario_id = $2`,
    [gameId, usuarioId],
  );
  return r.rows[0] ?? null;
}

/**
 * Devuelve el detalle público de un juego (visible para cualquier usuario autenticado).
 * Incluye el nombre del propietario (`propietario_nombre`) para mostrarlo
 * en la vista de comunidad y en los hilos de comentarios.
 *
 * @param {number|string} gameId - ID de la ficha de juego.
 * @returns {Promise<object|null>} Fila del juego con datos de su propietario, o null.
 */
async function queryGamePublicById(gameId) {
  const gid = parseInt(gameId, 10);
  if (Number.isNaN(gid)) return null;

  const r = await pool.query(
    `SELECT
       j.id,
       j.usuario_id,
       COALESCE(c.titulo, j.titulo)                                          AS titulo,
       j.estado,
       j.plataforma,
       j.puntuacion,
       j.horas_jugadas,
       COALESCE(NULLIF(TRIM(c.url_imagen), ''), NULLIF(TRIM(j.url_imagen), '')) AS url_imagen,
       j.catalogo_id,
       u.nombre_usuario AS propietario_nombre
     FROM juegos j
     LEFT JOIN catalogo_juegos c ON j.catalogo_id = c.id
     JOIN usuarios u ON u.id = j.usuario_id
     WHERE j.id = $1`,
    [gid],
  );
  return r.rows[0] ?? null;
}

module.exports = {
  queryGamesListForUser,
  queryOneGameForUser,
  queryGamePublicById,
};
