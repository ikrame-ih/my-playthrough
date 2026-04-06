/**
 * @module db
 * @description Configura y exporta el pool de conexiones a PostgreSQL.
 *
 * Un "pool" es un conjunto de conexiones ya abiertas y listas para usar.
 * En lugar de abrir una conexión nueva por cada petición HTTP (operación costosa),
 * el pool reutiliza las existentes, lo que mejora el rendimiento bajo carga.
 *
 * Las credenciales se leen de variables de entorno para no hardcodearlas
 * en el código y poder desplegarlas de forma segura en producción.
 */

const { Pool } = require("pg");
require("dotenv").config();

/**
 * Pool de conexión a PostgreSQL reutilizado en todas las rutas.
 * La librería `pg` gestiona automáticamente el número de conexiones activas.
 * @type {import("pg").Pool}
 */
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports = pool;
