/**
 * Población de datos para presentación: usuarios, mismas contraseñas, juegos con
 * carátulas reales, comentarios, seguimientos y recomendaciones.
 *
 * Uso: cd server && npm run seed:presentation
 *
 * Contraseña unificada: Presentacion2026! (documentada en README)
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const PASS = "Presentacion2026!";

/** Catálogo con URLs permitidas por el proxy (Steam / RAWG). */
const CATALOG = [
  {
    slug: "portal2",
    titulo: "Portal 2",
    url_imagen:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/620/header.jpg",
    rawg_id: null,
    steam_app_id: 620,
  },
  {
    slug: "hades",
    titulo: "Hades",
    url_imagen:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/header.jpg",
    rawg_id: null,
    steam_app_id: 1145360,
  },
  {
    slug: "zelda",
    titulo: "The Legend of Zelda: Breath of the Wild",
    url_imagen:
      "https://media.rawg.io/media/games/cc1/cc196a5ad763955d6532cdba236f730c.jpg",
    rawg_id: 22511,
    steam_app_id: null,
  },
  {
    slug: "elden",
    titulo: "Elden Ring",
    url_imagen:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg",
    rawg_id: null,
    steam_app_id: 1245620,
  },
  {
    slug: "hollow",
    titulo: "Hollow Knight",
    url_imagen:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/367520/header.jpg",
    rawg_id: null,
    steam_app_id: 367520,
  },
  {
    slug: "cyberpunk",
    titulo: "Cyberpunk 2077",
    url_imagen:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg",
    rawg_id: null,
    steam_app_id: 1091500,
  },
  {
    slug: "stardew",
    titulo: "Stardew Valley",
    url_imagen:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/413150/header.jpg",
    rawg_id: null,
    steam_app_id: 413150,
  },
  {
    slug: "ds3",
    titulo: "Dark Souls III",
    url_imagen:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/374320/header.jpg",
    rawg_id: null,
    steam_app_id: 374320,
  },
  {
    slug: "celeste",
    titulo: "Celeste",
    url_imagen:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/504230/header.jpg",
    rawg_id: null,
    steam_app_id: 504230,
  },
  {
    slug: "deadcells",
    titulo: "Dead Cells",
    url_imagen:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/588650/header.jpg",
    rawg_id: null,
    steam_app_id: 588650,
  },
];

const SEED_USERS = [
  {
    email: "rufleto@myplaythrough.local",
    nombre_usuario: "Rufleto",
    rol: "admin",
    avatar_id: "robot-2",
  },
  {
    email: "tizza@myplaythrough.local",
    nombre_usuario: "Tizza",
    rol: "admin",
    avatar_id: "robot-3",
  },
  {
    email: "elotro@myplaythrough.local",
    nombre_usuario: "ElOtro",
    rol: "user",
    avatar_id: "robot-4",
  },
  {
    email: "knekro@myplaythrough.local",
    nombre_usuario: "Knekro",
    rol: "user",
    avatar_id: "robot-5",
  },
  {
    email: "sequian@myplaythrough.local",
    nombre_usuario: "SequianCalvísimo",
    rol: "user",
    avatar_id: "robot-6",
  },
  {
    email: "laquete@myplaythrough.local",
    nombre_usuario: "LaQueTeCuento>:(",
    rol: "user",
    avatar_id: "robot-7",
  },
  {
    email: "demo@myplaythrough.local",
    nombre_usuario: "Demo Jurado",
    rol: "admin",
    avatar_id: "robot-0",
  },
];

/** Juegos por email (slugs). */
const GAMES_BY_EMAIL = {
  "rufleto@myplaythrough.local": [
    "portal2",
    "elden",
    "ds3",
    "deadcells",
  ],
  "tizza@myplaythrough.local": [
    "hades",
    "hollow",
    "cyberpunk",
    "celeste",
    "zelda",
    "stardew",
  ],
  "elotro@myplaythrough.local": [
    "cyberpunk",
    "stardew",
    "portal2",
  ],
  "knekro@myplaythrough.local": [
    "elden",
    "ds3",
    "deadcells",
  ],
  "sequian@myplaythrough.local": [
    "stardew",
    "celeste",
    "hollow",
  ],
  "laquete@myplaythrough.local": [
    "portal2",
    "zelda",
    "hades",
  ],
  "demo@myplaythrough.local": ["portal2", "hades", "zelda"],
};

/** estado, puntuacion, horas por slug y usuario (simples variaciones). */
const GAME_STATS = {
  portal2: { estado: "Completado", puntuacion: 10, horas: 24 },
  hades: { estado: "Jugando", puntuacion: 9, horas: 45 },
  zelda: { estado: "Jugando", puntuacion: 10, horas: 80 },
  elden: { estado: "Completado", puntuacion: 9, horas: 120 },
  hollow: { estado: "Jugando", puntuacion: 9, horas: 30 },
  cyberpunk: { estado: "Completado", puntuacion: 8, horas: 90 },
  stardew: { estado: "Jugando", puntuacion: 10, horas: 60 },
  ds3: { estado: "Completado", puntuacion: 9, horas: 70 },
  celeste: { estado: "Completado", puntuacion: 10, horas: 18 },
  deadcells: { estado: "Pendiente", puntuacion: 8, horas: 5 },
};

/** Ficha del propietario (targetOwner), autor del comentario (authorEmail). */
const COMMENTS = [
  {
    targetOwner: "rufleto@myplaythrough.local",
    slug: "portal2",
    authorEmail: "rufleto@myplaythrough.local",
    cuerpo:
      "El humor de GLaDOS sigue siendo oro puro. Me pasé el coop con un amigo y fue un viaje.",
  },
  {
    targetOwner: "rufleto@myplaythrough.local",
    slug: "portal2",
    authorEmail: "laquete@myplaythrough.local",
    cuerpo:
      "Me reí más con las líneas que con muchas comedias. Corto pero intenso.",
  },
  {
    targetOwner: "tizza@myplaythrough.local",
    slug: "hades",
    authorEmail: "tizza@myplaythrough.local",
    cuerpo:
      "Llevo como ocho intentos y cada run se siente distinto. La narrativa engancha un montón.",
  },
  {
    targetOwner: "tizza@myplaythrough.local",
    slug: "zelda",
    authorEmail: "tizza@myplaythrough.local",
    cuerpo:
      "Me encanta explorar sin prisa; el juego no te empuja y eso se agradece. También te digo, la Switch 1 va fatal...",
  },
  {
    targetOwner: "tizza@myplaythrough.local",
    slug: "zelda",
    authorEmail: "tizza@myplaythrough.local",
    cuerpo:
      "Lo de fusionar cosas no se me da bien xd.",
  },
  {
    targetOwner: "knekro@myplaythrough.local",
    slug: "elden",
    authorEmail: "knekro@myplaythrough.local",
    cuerpo:
      "Boss difíciles pero justos. Cuando cae uno grande es una celebración en el sofá.",
  },
  {
    targetOwner: "elotro@myplaythrough.local",
    slug: "cyberpunk",
    authorEmail: "elotro@myplaythrough.local",
    cuerpo:
      "Night City de noche con lluvia… cinemático. Algunos bugs me sacaron pero el vibe pesa más.",
  },
  {
    targetOwner: "elotro@myplaythrough.local",
    slug: "cyberpunk",
    authorEmail: "rufleto@myplaythrough.local",
    cuerpo:
      "El DLC me entró mejor que el arranque del juego base, la verdad.",
  },
  {
    targetOwner: "sequian@myplaythrough.local",
    slug: "stardew",
    authorEmail: "sequian@myplaythrough.local",
    cuerpo:
      "Lo abrí para media hora y son tres horas. Las gallinas me roban la vida.",
  },
  {
    targetOwner: "tizza@myplaythrough.local",
    slug: "hollow",
    authorEmail: "tizza@myplaythrough.local",
    cuerpo:
      "El mapa es enorme y el combate exige ritmo. Me gusta el estilo dibujado.",
  },
  {
    targetOwner: "tizza@myplaythrough.local",
    slug: "celeste",
    authorEmail: "tizza@myplaythrough.local",
    cuerpo:
      "Capítulos duros pero el checkpoint es generoso. La historia me pilló por sorpresa.",
  },
  {
    targetOwner: "demo@myplaythrough.local",
    slug: "hades",
    authorEmail: "demo@myplaythrough.local",
    cuerpo:
      "Para probar en clase: se nota el ritmo desde el primer run.",
  },
  {
    targetOwner: "rufleto@myplaythrough.local",
    slug: "elden",
    authorEmail: "tizza@myplaythrough.local",
    cuerpo:
      "Me costó el principio pero cuando engancha no sueltas el mando. El mundo interconectado se nota en cada atajo que descubres.",
  },
  {
    targetOwner: "laquete@myplaythrough.local",
    slug: "hades",
    authorEmail: "knekro@myplaythrough.local",
    cuerpo:
      "OST brutal. Un día más diciendo 'solo un intento más' a las 2 de la mañana.",
  },
  {
    targetOwner: "tizza@myplaythrough.local",
    slug: "cyberpunk",
    authorEmail: "sequian@myplaythrough.local",
    cuerpo:
      "Lo dejé en su día por bugs; ahora con parches es otra historia. Los personajes secundarios están muy trabajados.",
  },
  {
    targetOwner: "tizza@myplaythrough.local",
    slug: "stardew",
    authorEmail: "rufleto@myplaythrough.local",
    cuerpo:
      "Ideal para desconectar. No hay prisa y el pixel art aguanta mil horas.",
  },
  {
    targetOwner: "knekro@myplaythrough.local",
    slug: "deadcells",
    authorEmail: "elotro@myplaythrough.local",
    cuerpo:
      "Rápido, exigente, adictivo. Si te gusta repetir runs hasta dominar el ritmo, aquí estás en casa.",
  },
];

/** Votos sobre reseñas (índice en el array COMMENTS, email del votante, 1 o -1). */
const VOTES_ON_COMMENTS = [
  { commentIndex: 0, email: "tizza@myplaythrough.local", val: 1 },
  { commentIndex: 0, email: "demo@myplaythrough.local", val: 1 },
  { commentIndex: 0, email: "elotro@myplaythrough.local", val: 1 },
  { commentIndex: 1, email: "tizza@myplaythrough.local", val: 1 },
  { commentIndex: 1, email: "rufleto@myplaythrough.local", val: -1 },
  { commentIndex: 2, email: "rufleto@myplaythrough.local", val: 1 },
  { commentIndex: 2, email: "tizza@myplaythrough.local", val: 1 },
  { commentIndex: 3, email: "laquete@myplaythrough.local", val: 1 },
  { commentIndex: 4, email: "tizza@myplaythrough.local", val: 1 },
  { commentIndex: 5, email: "knekro@myplaythrough.local", val: 1 },
  { commentIndex: 6, email: "tizza@myplaythrough.local", val: -1 },
  { commentIndex: 7, email: "sequian@myplaythrough.local", val: 1 },
  { commentIndex: 8, email: "demo@myplaythrough.local", val: 1 },
  { commentIndex: 9, email: "tizza@myplaythrough.local", val: 1 },
  { commentIndex: 10, email: "demo@myplaythrough.local", val: 1 },
  { commentIndex: 11, email: "laquete@myplaythrough.local", val: 1 },
  { commentIndex: 12, email: "rufleto@myplaythrough.local", val: 1 },
  { commentIndex: 13, email: "elotro@myplaythrough.local", val: 1 },
  { commentIndex: 14, email: "knekro@myplaythrough.local", val: 1 },
  { commentIndex: 15, email: "demo@myplaythrough.local", val: 1 },
  { commentIndex: 16, email: "tizza@myplaythrough.local", val: 1 },
];

/** [seguidor, seguido] */
const FOLLOWS = [
  ["rufleto@myplaythrough.local", "tizza@myplaythrough.local"],
  ["tizza@myplaythrough.local", "rufleto@myplaythrough.local"],
  ["rufleto@myplaythrough.local", "elotro@myplaythrough.local"],
  ["tizza@myplaythrough.local", "demo@myplaythrough.local"],
  ["elotro@myplaythrough.local", "knekro@myplaythrough.local"],
  ["knekro@myplaythrough.local", "sequian@myplaythrough.local"],
  ["sequian@myplaythrough.local", "laquete@myplaythrough.local"],
  ["laquete@myplaythrough.local", "rufleto@myplaythrough.local"],
  ["demo@myplaythrough.local", "tizza@myplaythrough.local"],
  ["demo@myplaythrough.local", "elotro@myplaythrough.local"],
  ["laquete@myplaythrough.local", "tizza@myplaythrough.local"],
];

/** remitente debe seguir a destinatario. [from, to, slug, mensaje] */
const RECOS = [
  [
    "tizza@myplaythrough.local",
    "rufleto@myplaythrough.local",
    "hades",
    "Tenías que probarlo, el ritmo de combate es adictivo.",
  ],
  [
    "rufleto@myplaythrough.local",
    "tizza@myplaythrough.local",
    "portal2",
    "Cortito pero redondo, ideal si quieres algo distinto.",
  ],
  [
    "tizza@myplaythrough.local",
    "elotro@myplaythrough.local",
    "celeste",
    "Si te gusta el plataformeo difícil, esto es de manual.",
  ],
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
    [
      row.titulo,
      row.url_imagen,
      row.rawg_id,
      row.steam_app_id,
    ],
  );
  return ins.rows[0].id;
}

async function main() {
  const hash = await bcrypt.hash(PASS, 10);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Un solo usuario con nombre público "Rufleto" (el del seed); borra duplicados (p. ej. otra cuenta con el mismo nick).
    await client.query(
      `DELETE FROM usuarios
       WHERE LOWER(TRIM(nombre_usuario)) = 'rufleto'
         AND LOWER(TRIM(email)) <> LOWER($1)`,
      ["rufleto@myplaythrough.local"],
    );

    await client.query(
      `ALTER TABLE juegos DROP CONSTRAINT IF EXISTS titulo_unico;
       ALTER TABLE juegos DROP CONSTRAINT IF EXISTS juegos_titulo_key;
       ALTER TABLE juegos DROP CONSTRAINT IF EXISTS juegos_titulo_unique;
       ALTER TABLE juegos DROP CONSTRAINT IF EXISTS juegos_usuario_id_titulo_key;
       ALTER TABLE juegos DROP CONSTRAINT IF EXISTS juegos_usuario_id_titulo_unique;`,
    );

    const catalogIds = {};
    for (const row of CATALOG) {
      catalogIds[row.slug] = await ensureCatalog(client, row);
    }

    const userIds = {};

    for (const u of SEED_USERS) {
      const ex = await client.query(
        "SELECT id FROM usuarios WHERE LOWER(TRIM(email)) = LOWER($1)",
        [u.email],
      );
      if (ex.rows.length) {
        await client.query(
          `UPDATE usuarios
           SET password_hash = $1, nombre_usuario = $2, rol = $3, avatar_id = $4
           WHERE id = $5`,
          [hash, u.nombre_usuario, u.rol, u.avatar_id, ex.rows[0].id],
        );
        userIds[u.email] = ex.rows[0].id;
      } else {
        const ins = await client.query(
          `INSERT INTO usuarios (nombre_usuario, email, password_hash, rol, avatar_id)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [u.nombre_usuario, u.email, hash, u.rol, u.avatar_id],
        );
        userIds[u.email] = ins.rows[0].id;
      }
    }

    const seedIdList = Object.values(userIds);

    await client.query(
      `DELETE FROM juego_recomendaciones
       WHERE remitente_id = ANY($1::int[]) OR destinatario_id = ANY($1::int[])`,
      [seedIdList],
    );
    await client.query(
      `DELETE FROM lfg_publicaciones WHERE usuario_id = ANY($1::int[])`,
      [seedIdList],
    );
    await client.query(
      `DELETE FROM usuario_seguimientos
       WHERE seguidor_id = ANY($1::int[]) OR seguido_id = ANY($1::int[])`,
      [seedIdList],
    );
    await client.query(
      `DELETE FROM juego_comentarios WHERE juego_id IN (
         SELECT id FROM juegos WHERE usuario_id = ANY($1::int[])
       )`,
      [seedIdList],
    );
    await client.query(
      `CREATE TABLE IF NOT EXISTS juego_comentario_votos (
         comentario_id INTEGER NOT NULL REFERENCES juego_comentarios(id) ON DELETE CASCADE,
         usuario_id    INTEGER NOT NULL REFERENCES usuarios(id)         ON DELETE CASCADE,
         valor         SMALLINT NOT NULL CHECK (valor IN (-1, 1)),
         PRIMARY KEY (comentario_id, usuario_id)
       )`,
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_comentario_votos_comentario
       ON juego_comentario_votos (comentario_id)`,
    );
    await client.query(
      `DELETE FROM juegos WHERE usuario_id = ANY($1::int[])`,
      [seedIdList],
    );

    const gameRowIds = {};

    for (const [email, slugs] of Object.entries(GAMES_BY_EMAIL)) {
      const uid = userIds[email];
      if (!uid) continue;
      for (const slug of slugs) {
        const catId = catalogIds[slug];
        const st = GAME_STATS[slug] || {
          estado: "Jugando",
          puntuacion: 8,
          horas: 10,
        };
        const cat = CATALOG.find((c) => c.slug === slug);
        const ins = await client.query(
          `INSERT INTO juegos (usuario_id, titulo, estado, plataforma, puntuacion, horas_jugadas, catalogo_id, url_imagen)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [
            uid,
            cat.titulo,
            st.estado,
            "PC",
            st.puntuacion,
            st.horas,
            catId,
            cat.url_imagen,
          ],
        );
        const key = `${email}::${slug}`;
        gameRowIds[key] = ins.rows[0].id;
      }
    }

    const insertedCommentIds = [];
    for (let idx = 0; idx < COMMENTS.length; idx++) {
      const c = COMMENTS[idx];
      const jid = gameRowIds[`${c.targetOwner}::${c.slug}`];
      const uid = userIds[c.authorEmail];
      if (jid && uid) {
        const ins = await client.query(
          `INSERT INTO juego_comentarios (juego_id, usuario_id, cuerpo)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [jid, uid, c.cuerpo],
        );
        insertedCommentIds[idx] = ins.rows[0].id;
      } else {
        insertedCommentIds[idx] = null;
      }
    }

    for (const v of VOTES_ON_COMMENTS) {
      const cid = insertedCommentIds[v.commentIndex];
      const vid = userIds[v.email];
      if (cid != null && vid != null) {
        await client.query(
          `INSERT INTO juego_comentario_votos (comentario_id, usuario_id, valor)
           VALUES ($1, $2, $3)
           ON CONFLICT (comentario_id, usuario_id) DO UPDATE SET valor = EXCLUDED.valor`,
          [cid, vid, v.val],
        );
      }
    }

    for (const [a, b] of FOLLOWS) {
      const sa = userIds[a];
      const sb = userIds[b];
      if (sa && sb && sa !== sb) {
        await client.query(
          `INSERT INTO usuario_seguimientos (seguidor_id, seguido_id)
           VALUES ($1, $2)
           ON CONFLICT (seguidor_id, seguido_id) DO NOTHING`,
          [sa, sb],
        );
      }
    }

    for (const [fromE, toE, slug, msg] of RECOS) {
      const from = userIds[fromE];
      const to = userIds[toE];
      const juegoOwner = fromE;
      const juegoId = gameRowIds[`${juegoOwner}::${slug}`];
      if (from && to && juegoId) {
        await client.query(
          `INSERT INTO juego_recomendaciones (remitente_id, destinatario_id, juego_id, mensaje, leida)
           VALUES ($1, $2, $3, $4, FALSE)`,
          [from, to, juegoId, msg],
        );
      }
    }

    await client.query(
      "UPDATE usuarios SET password_hash = $1 WHERE id > 0",
      [hash],
    );

    await client.query(
      `UPDATE usuarios SET rol = 'user' WHERE LOWER(TRIM(email)) = LOWER($1)`,
      ["ikihga2223@gmail.com"],
    );

    await client.query("COMMIT");
    console.log("OK: datos de presentación cargados.");
    console.log("Contraseña de todas las cuentas:", PASS);
    console.log(
      "Admins: Tizza, Rufleto, Demo Jurado — ikihga2223@gmail.com queda como usuario si existe.",
    );
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
