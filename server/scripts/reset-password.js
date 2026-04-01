/**
 * Uso (desde la carpeta server):
 *   node scripts/reset-password.js tu@email.com nuevaContraseña
 *
 * Solo para desarrollo: actualiza el hash en PostgreSQL si olvidaste la clave
 * o la cuenta se creó con otra contraseña.
 */
const bcrypt = require("bcryptjs");
require("dotenv").config();
const pool = require("../config/db");

const email = String(process.argv[2] ?? "")
  .trim()
  .toLowerCase();
const newPassword = process.argv[3];

if (!email || !newPassword || newPassword.length < 6) {
  console.error(
    "Uso: node scripts/reset-password.js email@ejemplo.com nuevaContraseña",
  );
  console.error("La contraseña debe tener al menos 6 caracteres.");
  process.exit(1);
}

(async () => {
  const hash = await bcrypt.hash(newPassword, 10);
  const r = await pool.query(
    "UPDATE usuarios SET password_hash = $1 WHERE LOWER(TRIM(email)) = $2 RETURNING id, email",
    [hash, email],
  );
  if (r.rows.length === 0) {
    console.error("No hay ningún usuario con ese email.");
    process.exit(1);
  }
  console.log("Contraseña actualizada para:", r.rows[0].email);
  await pool.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
