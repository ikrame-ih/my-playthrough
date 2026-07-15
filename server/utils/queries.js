// Shared SELECTs for juegos + catalogo_juegos (title/cover from catalog when linked).

const pool = require("../config/db");

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

// id + usuario_id filter — stops guessing another user's game id.
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
