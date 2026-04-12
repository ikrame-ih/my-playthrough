// Script para resetear contraseña (solo desarrollo):
//   node scripts/reset-password.js tu@email.com nuevaContraseña
const bcrypt = require("bcryptjs");
require("dotenv").config();
const pool = require("../config/db");
const { passwordPolicyMessage } = require("../utils/normalize");

const email = String(process.argv[2] ?? "")
  .trim()
  .toLowerCase();
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error(
    "Uso: node scripts/reset-password.js email@ejemplo.com nuevaContraseña",
  );
  process.exit(1);
}

const policyError = passwordPolicyMessage(newPassword);
if (policyError) {
  console.error(policyError);
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
