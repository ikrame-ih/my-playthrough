// Shared pg pool. Uses DATABASE_URL in cloud; DB_* vars locally.

const { Pool } = require("pg");
require("dotenv").config();

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

const pool = new Pool(poolConfig());

module.exports = pool;
