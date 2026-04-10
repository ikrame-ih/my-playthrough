/**
 * Crea un usuario demo con tres juegos y carátulas reales (idempotente).
 * Uso: cd server && npm run seed:demo
 *
 * Contraseña alineada con `seed:presentation`: Presentacion2026!
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const DEMO_EMAIL = "demo@myplaythrough.local";
const DEMO_USER = "Demo Jurado";
const DEMO_PASS = "Presentacion2026!";

const DEMO_GAMES = [
  {
    titulo: "The Legend of Zelda: Breath of the Wild",
    url_imagen:
      "https://media.rawg.io/media/games/cc1/cc196a5ad763955d6532cdba236f730c.jpg",
    rawg_id: 22511,
    steam_app_id: null,
    estado: "Pendiente",
    plataforma: "Switch",
    puntuacion: null,
    horas_jugadas: 0,
  },
  {
    titulo: "Hades",
    url_imagen:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/header.jpg",
    rawg_id: null,
    steam_app_id: 1145360,
    estado: "Jugando",
    plataforma: "PC",
    puntuacion: 9,
    horas_jugadas: 42,
  },
  {
    titulo: "Portal 2",
    url_imagen:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/620/header.jpg",
    rawg_id: null,
    steam_app_id: 620,
    estado: "Completado",
    plataforma: "PC",
    puntuacion: 10,
    horas_jugadas: 18,
  },
];

async function ensureCatalog(client, row) {
  if (row.rawg_id) {
    const r = await client.query(
      "SELECT id FROM catalogo_juegos WHERE rawg_id = $1",
      [row.rawg_id],
    );
    if (r.rows.length) return r.rows[0].id;
  }
  if (row.steam_app_id) {
    const r = await client.query(
      "SELECT id FROM catalogo_juegos WHERE steam_app_id = $1",
      [row.steam_app_id],
    );
    if (r.rows.length) return r.rows[0].id;
  }
  const ins = await client.query(
    `INSERT INTO catalogo_juegos (titulo, url_imagen, rawg_id, steam_app_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [row.titulo, row.url_imagen, row.rawg_id, row.steam_app_id],
  );
  return ins.rows[0].id;
}

async function main() {
  const client = await pool.connect();
  try {
    const ex = await client.query(
      "SELECT id FROM usuarios WHERE LOWER(TRIM(email)) = LOWER($1)",
      [DEMO_EMAIL],
    );
    let userId;
    const hash = await bcrypt.hash(DEMO_PASS, 10);
    if (ex.rows.length > 0) {
      userId = ex.rows[0].id;
      await client.query(
        "UPDATE usuarios SET password_hash = $1, nombre_usuario = $2 WHERE id = $3",
        [hash, DEMO_USER, userId],
      );
      console.log("Usuario demo actualizado (misma contraseña que seed:presentation).");
    } else {
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
      console.log(
        "La cuenta demo ya tiene juegos (%s). Nada que insertar.",
        count.rows[0].n,
      );
      return;
    }

    for (const g of DEMO_GAMES) {
      const catId = await ensureCatalog(client, g);
      await client.query(
        `INSERT INTO juegos (usuario_id, titulo, estado, plataforma, puntuacion, horas_jugadas, catalogo_id, url_imagen)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          g.titulo,
          g.estado,
          g.plataforma,
          g.puntuacion,
          g.horas_jugadas,
          catId,
          g.url_imagen,
        ],
      );
    }
    console.log("Insertados %s juegos con carátulas.", DEMO_GAMES.length);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
