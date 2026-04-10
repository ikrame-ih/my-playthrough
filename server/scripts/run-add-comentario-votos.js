/**
 * Ejecuta docs/add-comentario-votos.sql usando las credenciales de server/.env
 * Uso: desde la carpeta server → npm run migrate:votes
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const fs = require("fs");
const { Pool } = require("pg");

const sqlPath = path.join(__dirname, "..", "..", "docs", "add-comentario-votos.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool
  .query(sql)
  .then(() => {
    console.log("OK: tabla juego_comentario_votos aplicada (o ya existía).");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
