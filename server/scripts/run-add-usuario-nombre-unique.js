/**
 * Ejecuta docs/sql/add-usuario-nombre-unique.sql (nombre de usuario único).
 * Uso: desde server → npm run migrate:username-unique
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const fs = require("fs");
const { Pool } = require("pg");

const sqlPath = path.join(
  __dirname,
  "..",
  "..",
  "docs",
  "sql",
  "add-usuario-nombre-unique.sql",
);
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
    console.log("OK: índice único en nombre_usuario aplicado (o ya existía).");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err.message);
    if (err.code === "23505") {
      console.error(
        "Hay nombres de usuario duplicados (misma variante en minúsculas). Corrígelos en la BD y vuelve a ejecutar.",
      );
    }
    process.exit(1);
  })
  .finally(() => pool.end());
