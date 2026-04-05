/**
 * queries.js
 *
 * Consultas SQL que se reutilizan en varias rutas.
 * Las centralizo aquí para no repetir el mismo JOIN en cada controlador
 * y para que cualquier cambio en el esquema solo afecte a un único lugar.
 *
 * NOTA SOBRE EL ESQUEMA: estas queries asumen que la base de datos ya tiene
 * las columnas url_imagen y catalogo_id en la tabla juegos, y que existe la
 * tabla catalogo_juegos. Si tu BD aún no las tiene, ejecuta los scripts de
 * migración en la carpeta docs/ antes de arrancar el servidor.
 * Eliminé los checks dinámicos de columnas que había en la versión anterior
 * porque hacían una query extra a information_schema en cada petición,
 * lo que penaliza el rendimiento innecesariamente en producción.
 */

const pool = require("../config/db");

/**
 * Devuelve todos los juegos de un usuario concreto.
 * Usa COALESCE para mostrar el título del catálogo cuando existe,
 * y la URL de imagen del catálogo si la ficha del usuario no tiene una propia.
 * Los resultados vienen ordenados por id DESC (el más reciente primero).
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
 * Devuelve una sola ficha de juego verificando que pertenece al usuario.
 * El doble filtro (id + usuario_id) garantiza que nadie pueda leer
 * los datos de los juegos de otro usuario aunque conozca el ID.
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
 * Devuelve el detalle público de una ficha de juego (para la sección de comunidad).
 * Incluye el nombre del propietario para mostrarlo en la cabecera del hilo
 * de comentarios o en la vista de perfil ajeno.
 * Cualquier usuario logueado puede ver esta info, no solo el dueño.
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

/**
 * Comprueba si la tabla de comentarios ya existe en la base de datos.
 * Los comentarios son una funcionalidad opcional que requiere ejecutar
 * el script docs/add-juego-comentarios.sql. Si la tabla no existe,
 * las rutas de comentarios devuelven 503 con un mensaje claro.
 * Este check sí tiene sentido en tiempo de ejecución porque es una
 * característica que puede no estar instalada en todos los entornos.
 */
async function juegoComentariosTableExists() {
  try {
    const r = await pool.query(
      `SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'juego_comentarios'`,
    );
    return r.rows.length > 0;
  } catch {
    return false;
  }
}

module.exports = {
  queryGamesListForUser,
  queryOneGameForUser,
  queryGamePublicById,
  juegoComentariosTableExists,
};
