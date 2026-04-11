/**
 * Ejecuta docs/sql/add-avatar-id-usuarios.sql usando las credenciales de server/.env
 * Uso: desde la carpeta server → node scripts/run-add-avatar-column.js
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
  "add-avatar-id-usuarios.sql",
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
    console.log("OK: columna avatar_id aplicada (o ya existía).");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
