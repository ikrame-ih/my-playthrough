/**
 * Crea un usuario demo con juegos de ejemplo (idempotente).
 * Uso: cd server && npm run seed:demo
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const DEMO_EMAIL = "demo@myplaythrough.local";
const DEMO_USER = "Demo Jurado";
const DEMO_PASS = "demo123456";

/** Títulos con prefijo para no chocar con restricciones UNIQUE de título en BD heredadas. */
const SAMPLE_GAMES = [
  {
    titulo: "[Demo] Zelda BOTW — muestra",
    estado: "Pendiente",
    plataforma: "Switch",
    puntuacion: 0,
    horas_jugadas: 0,
  },
  {
    titulo: "[Demo] Hades — muestra",
    estado: "Jugando",
    plataforma: "PC",
    puntuacion: 9,
    horas_jugadas: 42,
  },
  {
    titulo: "[Demo] Portal 2 — muestra",
    estado: "Completado",
    plataforma: "PC",
    puntuacion: 10,
    horas_jugadas: 18,
  },
];

async function main() {
  const client = await pool.connect();
  try {
    const ex = await client.query(
      "SELECT id FROM usuarios WHERE LOWER(TRIM(email)) = LOWER($1)",
      [DEMO_EMAIL],
    );
    let userId;
    if (ex.rows.length > 0) {
      userId = ex.rows[0].id;
      console.log("Usuario demo ya existe (id %s). Comprobando juegos…", userId);
    } else {
      const hash = await bcrypt.hash(DEMO_PASS, 10);
      const ins = await client.query(
        `INSERT INTO usuarios (nombre_usuario, email, password_hash, rol, avatar_id)
         VALUES ($1, $2, $3, 'user', 'robot-3')
         RETURNING id`,
        [DEMO_USER, DEMO_EMAIL, hash],
      );
      userId = ins.rows[0].id;
      console.log("Usuario demo creado: %s / %s", DEMO_EMAIL, DEMO_PASS);
    }

    const count = await client.query(
      "SELECT COUNT(*)::int AS n FROM juegos WHERE usuario_id = $1",
      [userId],
    );
    if (count.rows[0].n > 0) {
      console.log("La cuenta demo ya tiene juegos (%s). Nada que insertar.", count.rows[0].n);
      return;
    }

    for (const g of SAMPLE_GAMES) {
      await client.query(
        `INSERT INTO juegos (usuario_id, titulo, estado, plataforma, puntuacion, horas_jugadas)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          g.titulo,
          g.estado,
          g.plataforma,
          g.puntuacion,
          g.horas_jugadas,
        ],
      );
    }
    console.log("Insertados %s juegos de ejemplo.", SAMPLE_GAMES.length);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
