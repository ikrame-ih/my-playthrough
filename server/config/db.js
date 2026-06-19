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
 * En la nube (Neon, Render, Railway…) suele usarse `DATABASE_URL`;
 * en local, variables `DB_*` sueltas.
 */
function poolConfig() {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    const disableSsl =
      process.env.PGSSLMODE === "disable" ||
      /localhost|127\.0\.0\.1/i.test(url);
    return {
      connectionString: url,
      ssl: disableSsl ? false : { rejectUnauthorized: false },
    };
  }
  return {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
  };
}

/**
 * Pool de conexión a PostgreSQL reutilizado en todas las rutas.
 * La librería `pg` gestiona automáticamente el número de conexiones activas.
 * @type {import("pg").Pool}
 */
const pool = new Pool(poolConfig());

module.exports = pool;
