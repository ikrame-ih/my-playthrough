const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const pool = require("./config/db");

/** Si la columna no existe aún, INSERT/UPDATE sin url_imagen (migración opcional en docs/). */
async function juegosHasUrlImagenColumn() {
  try {
    const r = await pool.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'juegos' AND column_name = 'url_imagen'`,
    );
    return r.rows.length > 0;
  } catch {
    return false;
  }
}

/** FK a catalogo_juegos — migración docs/add-catalogo-juegos.sql */
async function juegosHasCatalogoIdColumn() {
  try {
    const r = await pool.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'juegos' AND column_name = 'catalogo_id'`,
    );
    return r.rows.length > 0;
  } catch {
    return false;
  }
}

/** Hosts permitidos para GET /api/covers/proxy (evita abuso como proxy abierto). */
const ALLOWED_COVER_HOSTS = new Set([
  "media.rawg.io",
  "cdn.cloudflare.steamstatic.com",
  "steamcdn-a.akamaihd.net",
  "shared.akamai.steamstatic.com",
  "cdn.akamai.steamstatic.com",
  "store.akamai.steamstatic.com",
  "cdn.steamstatic.com",
]);

function normalizePlataforma(p) {
  const s = String(p ?? "").trim();
  return s || "PC";
}

/**
 * Acepta estados en español (UI) o inglés (esquemas alternativos) y devuelve valor para BD.
 */
function normalizeEstadoForDb(estado) {
  const s = String(estado ?? "").trim();
  const map = {
    Pendiente: "Pendiente",
    Jugando: "Jugando",
    Completado: "Completado",
    Backlog: "Pendiente",
    Playing: "Jugando",
    Completed: "Completado",
  };
  return map[s] || s;
}

function parseCatalogoRef(body) {
  const ref = body?.catalogo_ref;
  if (!ref || typeof ref !== "object") return null;
  const source = String(ref.source ?? "").toLowerCase();
  const id = ref.id;
  if (source !== "rawg" && source !== "steam") return null;
  const num = Number(id);
  if (!Number.isFinite(num) || num <= 0) return null;
  return { source, id: num };
}

async function upsertCatalogoGame(client, { source, id, titulo, url_imagen }) {
  const t = normalizeGameTitle(titulo);
  const url =
    typeof url_imagen === "string" && url_imagen.trim() !== ""
      ? url_imagen.trim()
      : null;
  if (!t) return null;
  if (source === "rawg") {
    const r = await client.query(
      `INSERT INTO catalogo_juegos (titulo, url_imagen, rawg_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (rawg_id) DO UPDATE SET
         titulo = EXCLUDED.titulo,
         url_imagen = COALESCE(EXCLUDED.url_imagen, catalogo_juegos.url_imagen)
       RETURNING id`,
      [t, url, id],
    );
    return r.rows[0]?.id ?? null;
  }
  if (source === "steam") {
    const r = await client.query(
      `INSERT INTO catalogo_juegos (titulo, url_imagen, steam_app_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (steam_app_id) DO UPDATE SET
         titulo = EXCLUDED.titulo,
         url_imagen = COALESCE(EXCLUDED.url_imagen, catalogo_juegos.url_imagen)
       RETURNING id`,
      [t, url, id],
    );
    return r.rows[0]?.id ?? null;
  }
  return null;
}

async function queryGamesListForUser(usuarioId) {
  const hasCatalogo = await juegosHasCatalogoIdColumn();
  if (!hasCatalogo) {
    const result = await pool.query(
      "SELECT * FROM juegos WHERE usuario_id = $1 ORDER BY id DESC",
      [usuarioId],
    );
    return result.rows;
  }
  const result = await pool.query(
    `SELECT j.id, j.usuario_id,
      COALESCE(c.titulo, j.titulo) AS titulo,
      j.estado, j.plataforma, j.puntuacion, j.horas_jugadas,
      COALESCE(NULLIF(TRIM(c.url_imagen), ''), NULLIF(TRIM(j.url_imagen), '')) AS url_imagen,
      j.catalogo_id
     FROM juegos j
     LEFT JOIN catalogo_juegos c ON j.catalogo_id = c.id
     WHERE j.usuario_id = $1
     ORDER BY j.id DESC`,
    [usuarioId],
  );
  return result.rows;
}

async function queryOneGameForUser(usuarioId, gameId) {
  const hasCatalogo = await juegosHasCatalogoIdColumn();
  if (!hasCatalogo) {
    const r = await pool.query(
      "SELECT * FROM juegos WHERE id = $1 AND usuario_id = $2",
      [gameId, usuarioId],
    );
    return r.rows[0] ?? null;
  }
  const r = await pool.query(
    `SELECT j.id, j.usuario_id,
      COALESCE(c.titulo, j.titulo) AS titulo,
      j.estado, j.plataforma, j.puntuacion, j.horas_jugadas,
      COALESCE(NULLIF(TRIM(c.url_imagen), ''), NULLIF(TRIM(j.url_imagen), '')) AS url_imagen,
      j.catalogo_id
     FROM juegos j
     LEFT JOIN catalogo_juegos c ON j.catalogo_id = c.id
     WHERE j.id = $1 AND j.usuario_id = $2`,
    [gameId, usuarioId],
  );
  return r.rows[0] ?? null;
}

/** Detalle de una ficha de juego para la comunidad (cualquier usuario logueado). */
async function queryGamePublicById(gameId) {
  const gid = parseInt(gameId, 10);
  if (Number.isNaN(gid)) return null;
  const hasCatalogo = await juegosHasCatalogoIdColumn();
  if (!hasCatalogo) {
    const r = await pool.query(
      `SELECT j.*, u.nombre_usuario AS propietario_nombre
       FROM juegos j
       JOIN usuarios u ON u.id = j.usuario_id
       WHERE j.id = $1`,
      [gid],
    );
    return r.rows[0] ?? null;
  }
  const r = await pool.query(
    `SELECT j.id, j.usuario_id,
      COALESCE(c.titulo, j.titulo) AS titulo,
      j.estado, j.plataforma, j.puntuacion, j.horas_jugadas,
      COALESCE(NULLIF(TRIM(c.url_imagen), ''), NULLIF(TRIM(j.url_imagen), '')) AS url_imagen,
      j.catalogo_id, u.nombre_usuario AS propietario_nombre
     FROM juegos j
     LEFT JOIN catalogo_juegos c ON j.catalogo_id = c.id
     JOIN usuarios u ON u.id = j.usuario_id
     WHERE j.id = $1`,
    [gid],
  );
  return r.rows[0] ?? null;
}

async function juegoComentariosTableExists() {
  try {
    const r = await pool.query(
      `SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'juego_comentarios'`,
    );
    return r.rows.length > 0;
  } catch {
    return false;
  }
}

function serverErrorPayload(err, fallbackMsg) {
  const out = { error: fallbackMsg };
  if (process.env.NODE_ENV !== "production" && err?.message) {
    out.detail = err.message;
  }
  if (err?.code) out.code = err.code;
  return out;
}

const COVER_FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; MyPlaythrough/1.0; +https://github.com/)",
  Accept: "application/json",
};

const COVER_IMAGE_FETCH_HEADERS = {
  "User-Agent": COVER_FETCH_HEADERS["User-Agent"],
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
};

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

app.use(cors());
app.use(express.json());

/**
 * Proxy de carátulas: Steam/CDN suele bloquear hotlink desde el navegador; el servidor pide la imagen.
 * Sin auth (las etiquetas <img> no envían Bearer). Solo hosts permitidos.
 */
app.get("/api/covers/proxy", async (req, res) => {
  const raw = String(req.query.u ?? "").trim();
  if (!raw) {
    return res.status(400).json({ error: "Falta el parámetro u (URL)." });
  }
  let target;
  try {
    target = new URL(raw);
  } catch {
    return res.status(400).json({ error: "URL no válida." });
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return res.status(400).json({ error: "Solo http(s)." });
  }
  if (!ALLOWED_COVER_HOSTS.has(target.hostname)) {
    return res.status(403).json({ error: "Host no permitido." });
  }
  try {
    const upstream = await fetch(target.href, {
      headers: COVER_IMAGE_FETCH_HEADERS,
      signal: fetchTimeoutMs(20000),
    });
    if (!upstream.ok) {
      return res.status(502).end();
    }
    const ct = upstream.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "public, max-age=86400");
    const buf = Buffer.from(await upstream.arrayBuffer());
    if (buf.length > 6 * 1024 * 1024) {
      return res.status(502).end();
    }
    res.send(buf);
  } catch (e) {
    console.error("[cover proxy]", e.message);
    res.status(502).end();
  }
});

// Misma dirección aunque haya espacios o mayúsculas (Gmail y el teclado suelen meter diferencias).
const normalizeEmail = (email) =>
  String(email ?? "")
    .trim()
    .toLowerCase();

/** Título mostrado: espacios normalizados; mayúsculas vienen del catálogo (RAWG/Steam). */
function normalizeGameTitle(t) {
  return String(t ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

/** Clave para comparar duplicados y agrupar comunidad (sin distinguir mayúsculas). */
function titleMatchKey(t) {
  return normalizeGameTitle(t).toLowerCase();
}

function fetchTimeoutMs(ms) {
  if (
    typeof AbortSignal !== "undefined" &&
    typeof AbortSignal.timeout === "function"
  ) {
    return AbortSignal.timeout(ms);
  }
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

// Middleware para rutas privadas. El cliente debe enviar el JWT así:
//   Authorization: Bearer <token>
// "Bearer" es solo la convención HTTP: indica que lo que sigue es un token de acceso.
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Token no proporcionado o formato inválido." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // req.user no existe en Express por defecto; lo rellenamos nosotros aquí.
    // Así en cada ruta protegida puedo usar req.user.id para filtrar por dueño.
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado." });
  }
};

/** Rol actual en BD (el JWT puede llevar un rol antiguo si promoviste admin tras el login). */
async function usuarioEsAdmin(usuarioId) {
  const r = await pool.query("SELECT rol FROM usuarios WHERE id = $1", [
    usuarioId,
  ]);
  return r.rows[0]?.rol === "admin";
}

// En la BD el CHECK permite solo 'user' y 'admin' (no 'usuario' / 'administrador').
const adminMiddleware = async (req, res, next) => {
  try {
    if (!(await usuarioEsAdmin(req.user.id))) {
      return res
        .status(403)
        .json({ error: "Se requieren permisos de administrador." });
    }
    next();
  } catch (e) {
    return res.status(500).json({ error: "Error al comprobar permisos." });
  }
};

// Firmo un JWT con lo mínimo que necesito después en las rutas (id, email, rol).
// Ese payload viaja dentro del token y se recupera arriba con jwt.verify.
const createToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, rol: user.rol || "user" },
    JWT_SECRET,
    { expiresIn: "7d" },
  );

// Ruta de diagnóstico rápida para comprobar que PostgreSQL responde.
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Registro: valida datos básicos, hashea contraseña y devuelve token ya listo.
app.post("/api/auth/register", async (req, res) => {
  try {
    const nombre_usuario = String(req.body.nombre_usuario ?? "").trim();
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!nombre_usuario || !email || !password) {
      return res.status(400).json({
        error: "Nombre de usuario, email y contraseña son obligatorios.",
      });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "La contraseña debe tener al menos 6 caracteres." });
    }

    const byEmail = await pool.query(
      "SELECT id FROM usuarios WHERE LOWER(TRIM(email)) = $1",
      [email],
    );
    if (byEmail.rows.length > 0) {
      return res.status(400).json({
        error:
          "Ese email ya está registrado. Usa «Inicia sesión» con esa cuenta.",
      });
    }

    const byName = await pool.query(
      "SELECT id FROM usuarios WHERE LOWER(TRIM(nombre_usuario)) = LOWER(TRIM($1))",
      [nombre_usuario],
    );
    if (byName.rows.length > 0) {
      return res.status(400).json({
        error:
          "Ese nombre de usuario ya está en uso (por otra cuenta). Prueba otro nombre; tu email aún puede ser nuevo.",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      "INSERT INTO usuarios (nombre_usuario, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre_usuario, email, rol",
      [nombre_usuario, email, password_hash, "user"],
    );

    const token = createToken(newUser.rows[0]);
    return res
      .status(201)
      .json({ success: true, token, user: newUser.rows[0] });
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    // Código PostgreSQL: violación de unicidad (email o nombre duplicado a nivel de índice)
    if (error.code === "23505") {
      return res.status(400).json({
        error:
          "Ese email o nombre de usuario ya existe en la base de datos. Prueba a iniciar sesión o usa otro nombre.",
        detail: error.detail,
      });
    }
    if (error.code === "23514") {
      return res.status(400).json({
        error: "Datos no válidos para el rol de usuario.",
        detail: error.message,
      });
    }
    return res.status(500).json({
      error: "Error al registrar usuario.",
      detail: error.message || String(error),
    });
  }
});

// Login: comprueba credenciales y devuelve token + datos públicos del usuario.
app.post("/api/auth/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email y contraseña son obligatorios." });
    }

    const result = await pool.query(
      "SELECT id, nombre_usuario, email, password_hash, rol FROM usuarios WHERE LOWER(TRIM(email)) = $1",
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error:
          "No existe ninguna cuenta con ese email. Regístrate primero o revisa el correo.",
      });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Contraseña incorrecta." });
    }

    const token = createToken(user);
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        nombre_usuario: user.nombre_usuario,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Error al iniciar sesión." });
  }
});

// Lo uso para comprobar sesión activa (útil al recargar app).
app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, nombre_usuario, email, rol FROM usuarios WHERE id = $1",
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ error: "Error al validar sesión." });
  }
});

// Comunidad: listado de otros miembros (RF-04 / diseño API).
// No expongo email aquí; solo datos útiles para enlazar al perfil público.
app.get("/api/users", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.nombre_usuario,
        (SELECT COUNT(*)::int FROM juegos j WHERE j.usuario_id = u.id) AS num_juegos,
        (SELECT j.plataforma FROM juegos j WHERE j.usuario_id = u.id ORDER BY j.id DESC LIMIT 1) AS plataforma_ejemplo
      FROM usuarios u WHERE u.id <> $1 ORDER BY u.nombre_usuario ASC`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Perfil ajeno: colección en solo lectura (mismo shape que juegos, sin rutas de edición en el cliente).
app.get("/api/users/:userId/games", authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: "ID de usuario inválido." });
    }

    const userExists = await pool.query(
      "SELECT id, nombre_usuario FROM usuarios WHERE id = $1",
      [userId],
    );
    if (userExists.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const games = await queryGamesListForUser(userId);
    res.json({ user: userExists.rows[0], games });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RF-05: nota media por título agregando votos de toda la comunidad.
app.get("/api/community/stats", authMiddleware, async (req, res) => {
  try {
    const hasCatalogo = await juegosHasCatalogoIdColumn();
    const result = hasCatalogo
      ? await pool.query(`
      SELECT MAX(COALESCE(c.titulo, j.titulo)) AS titulo,
             ROUND(AVG(j.puntuacion)::numeric, 2) AS nota_media,
             COUNT(*)::int AS num_votos
      FROM juegos j
      LEFT JOIN catalogo_juegos c ON j.catalogo_id = c.id
      WHERE j.puntuacion IS NOT NULL
      GROUP BY CASE WHEN j.catalogo_id IS NOT NULL THEN 'c:' || j.catalogo_id::text
        ELSE 't:' || LOWER(TRIM(REGEXP_REPLACE(j.titulo, '[[:space:]]+', ' ', 'g')))
        END
      ORDER BY nota_media DESC NULLS LAST, MAX(COALESCE(c.titulo, j.titulo)) ASC
    `)
      : await pool.query(`
      SELECT MAX(titulo) AS titulo,
             ROUND(AVG(puntuacion)::numeric, 2) AS nota_media,
             COUNT(*)::int AS num_votos
      FROM juegos
      WHERE puntuacion IS NOT NULL
      GROUP BY LOWER(TRIM(REGEXP_REPLACE(titulo, '[[:space:]]+', ' ', 'g')))
      ORDER BY nota_media DESC NULLS LAST, MAX(titulo) ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Detalle público de una ficha (para hilo de comentarios); cualquier usuario logueado.
app.get("/api/community/games/:id", authMiddleware, async (req, res) => {
  try {
    const row = await queryGamePublicById(req.params.id);
    if (!row) {
      return res.status(404).json({ error: "Juego no encontrado." });
    }
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RF-06: panel admin — listar cuentas.
app.get(
  "/api/admin/users",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT id, nombre_usuario, email, rol, fecha_registro FROM usuarios ORDER BY id ASC",
      );
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// RF-06: eliminar cuenta (moderación). No permito borrarme a mí mismo por accidente.
app.delete(
  "/api/admin/users/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const targetId = parseInt(req.params.id, 10);
      if (Number.isNaN(targetId)) {
        return res.status(400).json({ error: "ID inválido." });
      }
      if (targetId === req.user.id) {
        return res
          .status(400)
          .json({
            error: "No puedes eliminar tu propia cuenta desde el panel.",
          });
      }

      const deleted = await pool.query(
        "DELETE FROM usuarios WHERE id = $1 RETURNING id",
        [targetId],
      );
      if (deleted.rows.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado." });
      }
      res.json({ success: true, message: "Usuario eliminado." });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Panel admin: listar todas las fichas de juego (moderación).
app.get(
  "/api/admin/games",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const hasCatalogo = await juegosHasCatalogoIdColumn();
      const result = hasCatalogo
        ? await pool.query(
            `SELECT j.id,
            COALESCE(c.titulo, j.titulo) AS titulo,
            j.usuario_id, j.plataforma, j.estado, j.puntuacion,
            u.nombre_usuario, u.email
           FROM juegos j
           JOIN usuarios u ON u.id = j.usuario_id
           LEFT JOIN catalogo_juegos c ON j.catalogo_id = c.id
           ORDER BY j.id DESC`,
          )
        : await pool.query(
            `SELECT j.id, j.titulo, j.usuario_id, j.plataforma, j.estado, j.puntuacion,
            u.nombre_usuario, u.email
           FROM juegos j
           JOIN usuarios u ON u.id = j.usuario_id
           ORDER BY j.id DESC`,
          );
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Eliminar cualquier ficha de juego (moderación).
app.delete(
  "/api/admin/games/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const gameId = parseInt(req.params.id, 10);
      if (Number.isNaN(gameId)) {
        return res.status(400).json({ error: "ID de juego inválido." });
      }
      const deleted = await pool.query(
        "DELETE FROM juegos WHERE id = $1 RETURNING id",
        [gameId],
      );
      if (deleted.rows.length === 0) {
        return res.status(404).json({ error: "Juego no encontrado." });
      }
      res.json({ success: true, message: "Juego eliminado." });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Solo devuelve juegos del usuario logueado (evita mezclar colecciones).
app.get("/api/games", authMiddleware, async (req, res) => {
  try {
    const rows = await queryGamesListForUser(req.user.id);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function fetchRawgCovers(searchQuery, apiKey) {
  const url = new URL("https://api.rawg.io/api/games");
  url.searchParams.set("search", searchQuery);
  url.searchParams.set("page_size", "20");
  url.searchParams.set("key", apiKey);

  const rawgRes = await fetch(url, {
    headers: COVER_FETCH_HEADERS,
    signal: fetchTimeoutMs(15000),
  });
  if (!rawgRes.ok) {
    console.error("RAWG error:", rawgRes.status, await rawgRes.text());
    return [];
  }
  const data = await rawgRes.json();
  return (data.results || [])
    .filter((g) => g.background_image)
    .map((g) => ({
      id: g.id,
      name: g.name,
      released: g.released,
      background_image: g.background_image,
      source: "rawg",
    }));
}

/** Búsqueda pública Steam + appdetails (header_image). */
async function fetchSteamCovers(searchQuery) {
  const searchUrl = new URL("https://store.steampowered.com/api/storesearch/");
  searchUrl.searchParams.set("term", searchQuery);
  searchUrl.searchParams.set("cc", "US");
  searchUrl.searchParams.set("l", "english");

  let data;
  try {
    const r = await fetch(searchUrl, {
      headers: COVER_FETCH_HEADERS,
      signal: fetchTimeoutMs(15000),
    });
    if (!r.ok) return [];
    data = await r.json();
  } catch (e) {
    console.error("Steam storesearch:", e.message);
    return [];
  }

  const items = (data.items || []).slice(0, 15);

  const enriched = await Promise.all(
    items.map(async (item) => {
      if (!item.id || !item.name) return null;
      let background_image = item.tiny_image;
      try {
        const dr = await fetch(
          `https://store.steampowered.com/api/appdetails?appids=${item.id}&l=english`,
          {
            headers: COVER_FETCH_HEADERS,
            signal: fetchTimeoutMs(12000),
          },
        );
        if (dr.ok) {
          const dj = await dr.json();
          const d = dj[String(item.id)]?.data;
          if (d?.header_image) background_image = d.header_image;
        }
      } catch (_) {
        /* tiny_image */
      }
      if (!background_image) return null;
      return {
        id: item.id,
        name: item.name,
        background_image,
        source: "steam",
      };
    }),
  );

  return enriched.filter(Boolean);
}

/** RAWG primero (mejor para consolas); Steam añade títulos que no estén ya por nombre. */
function mergeCoverResults(rawg, steam) {
  const seen = new Set(
    rawg.map((r) => r.name.toLowerCase().replace(/\s+/g, " ").trim()),
  );
  const out = [...rawg];
  for (const s of steam) {
    const n = s.name.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(s);
  }
  return out.slice(0, 30);
}

// RAWG (si hay clave) + Steam combinados; el cliente muestra lista para elegir.
// Debe ir antes de /api/games/:id.
app.get("/api/games/cover-search", authMiddleware, async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (q.length < 2) {
    return res.status(400).json({ error: "Escribe al menos 2 caracteres." });
  }

  try {
    const key = process.env.RAWG_API_KEY;
    const rawg = key ? await fetchRawgCovers(q, key) : [];
    const steam = await fetchSteamCovers(q);
    const results = mergeCoverResults(rawg, steam);

    res.json({ results });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al buscar la carátula." });
  }
});

// Añadir juego: duplicado por catálogo (RAWG/Steam) o por título normalizado.
app.post("/api/games", authMiddleware, async (req, res) => {
  try {
    const {
      titulo,
      estado,
      plataforma,
      puntuacion,
      horas_jugadas,
      url_imagen,
    } = req.body;

    const estadoVal = normalizeEstadoForDb(estado);
    const plataformaVal = normalizePlataforma(plataforma);
    const catalogoRef = parseCatalogoRef(req.body);
    const hasCatalogoCol = await juegosHasCatalogoIdColumn();

    const tituloNorm = normalizeGameTitle(titulo);
    if (!tituloNorm) {
      return res.status(400).json({
        success: false,
        error: "El título es obligatorio.",
      });
    }

    const tituloKey = titleMatchKey(tituloNorm);

    const url =
      typeof url_imagen === "string" && url_imagen.trim() !== ""
        ? url_imagen.trim()
        : null;

    const pNum = Number(puntuacion);
    const hNum = Number(horas_jugadas);
    const puntuacionVal = Number.isFinite(pNum) ? pNum : 0;
    const horasVal = Number.isFinite(hNum) ? Math.max(0, hNum) : 0;

    const hasImgCol = await juegosHasUrlImagenColumn();

    if (hasCatalogoCol && catalogoRef) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const catId = await upsertCatalogoGame(client, {
          source: catalogoRef.source,
          id: catalogoRef.id,
          titulo: tituloNorm,
          url_imagen: url,
        });
        if (!catId) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            success: false,
            error: "No se pudo registrar el juego en el catálogo.",
          });
        }
        const dup = await client.query(
          `SELECT id FROM juegos WHERE usuario_id = $1 AND catalogo_id = $2`,
          [req.user.id, catId],
        );
        if (dup.rows.length > 0) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            success: false,
            error: "Este juego ya está en tu colección.",
          });
        }
        let ins;
        if (hasImgCol) {
          ins = await client.query(
            `INSERT INTO juegos (usuario_id, titulo, estado, plataforma, puntuacion, horas_jugadas, url_imagen, catalogo_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [
              req.user.id,
              tituloNorm,
              estadoVal,
              plataformaVal,
              puntuacionVal,
              horasVal,
              url,
              catId,
            ],
          );
        } else {
          ins = await client.query(
            `INSERT INTO juegos (usuario_id, titulo, estado, plataforma, puntuacion, horas_jugadas, catalogo_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [
              req.user.id,
              tituloNorm,
              estadoVal,
              plataformaVal,
              puntuacionVal,
              horasVal,
              catId,
            ],
          );
        }
        await client.query("COMMIT");
        const row = await queryOneGameForUser(req.user.id, ins.rows[0].id);
        return res.status(201).json({ success: true, data: row });
      } catch (e) {
        try {
          await client.query("ROLLBACK");
        } catch (_) {
          /* */
        }
        throw e;
      } finally {
        client.release();
      }
    }

    const checkJuego = await pool.query(
      `SELECT id FROM juegos
       WHERE LOWER(TRIM(REGEXP_REPLACE(titulo, '[[:space:]]+', ' ', 'g'))) = $1
         AND usuario_id = $2`,
      [tituloKey, req.user.id],
    );

    if (checkJuego.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Este juego ya está en tu colección.",
      });
    }

    const nuevoJuego = hasImgCol
      ? await pool.query(
          "INSERT INTO juegos (usuario_id, titulo, estado, plataforma, puntuacion, horas_jugadas, url_imagen) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
          [
            req.user.id,
            tituloNorm,
            estadoVal,
            plataformaVal,
            puntuacionVal,
            horasVal,
            url,
          ],
        )
      : await pool.query(
          "INSERT INTO juegos (usuario_id, titulo, estado, plataforma, puntuacion, horas_jugadas) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
          [
            req.user.id,
            tituloNorm,
            estadoVal,
            plataformaVal,
            puntuacionVal,
            horasVal,
          ],
        );

    const row = await queryOneGameForUser(req.user.id, nuevoJuego.rows[0].id);
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    console.error("[POST /api/games]", err);
    const payload = serverErrorPayload(
      err,
      "Error de servidor al guardar el juego",
    );
    res.status(500).json(payload);
  }
});

// Borrado seguro: solo puede borrar sus propios juegos.
app.delete("/api/games/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM juegos WHERE id = $1 AND usuario_id = $2 RETURNING id",
      [id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Juego no encontrado." });
    }

    res.json({ success: true, message: "Juego eliminado correctamente" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al intentar eliminar el juego" });
  }
});

// Hilos de comentarios (rutas específicas antes de GET /api/games/:id).
app.get("/api/games/:gameId/comments", authMiddleware, async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId, 10);
    if (Number.isNaN(gameId)) {
      return res.status(400).json({ error: "ID inválido." });
    }
    const exists = await pool.query("SELECT 1 FROM juegos WHERE id = $1", [
      gameId,
    ]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: "Juego no encontrado." });
    }
    if (!(await juegoComentariosTableExists())) {
      return res.status(503).json({
        error:
          "Los comentarios no están activos. Ejecuta docs/add-juego-comentarios.sql en PostgreSQL.",
      });
    }
    const result = await pool.query(
      `SELECT c.id, c.juego_id, c.usuario_id, c.parent_id, c.cuerpo, c.fecha_creacion,
              u.nombre_usuario AS autor_nombre
       FROM juego_comentarios c
       JOIN usuarios u ON u.id = c.usuario_id
       WHERE c.juego_id = $1
       ORDER BY c.fecha_creacion ASC`,
      [gameId],
    );
    res.json({ comments: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/games/:gameId/comments", authMiddleware, async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId, 10);
    if (Number.isNaN(gameId)) {
      return res.status(400).json({ error: "ID inválido." });
    }
    if (!(await juegoComentariosTableExists())) {
      return res.status(503).json({
        error:
          "Los comentarios no están activos. Ejecuta docs/add-juego-comentarios.sql en PostgreSQL.",
      });
    }
    const cuerpo = String(req.body?.cuerpo ?? "").trim();
    if (!cuerpo || cuerpo.length > 8000) {
      return res.status(400).json({
        error: "El mensaje es obligatorio (máx. 8000 caracteres).",
      });
    }
    const g = await pool.query("SELECT id FROM juegos WHERE id = $1", [gameId]);
    if (g.rows.length === 0) {
      return res.status(404).json({ error: "Juego no encontrado." });
    }
    let parentId = null;
    if (req.body?.parent_id != null && req.body.parent_id !== "") {
      const p = parseInt(req.body.parent_id, 10);
      if (Number.isNaN(p)) {
        return res.status(400).json({ error: "parent_id inválido." });
      }
      const pr = await pool.query(
        "SELECT id FROM juego_comentarios WHERE id = $1 AND juego_id = $2",
        [p, gameId],
      );
      if (pr.rows.length === 0) {
        return res
          .status(400)
          .json({ error: "Comentario padre no encontrado." });
      }
      parentId = p;
    }
    const ins = await pool.query(
      `INSERT INTO juego_comentarios (juego_id, usuario_id, parent_id, cuerpo)
       VALUES ($1, $2, $3, $4)
       RETURNING id, juego_id, usuario_id, parent_id, cuerpo, fecha_creacion`,
      [gameId, req.user.id, parentId, cuerpo],
    );
    const nombre = await pool.query(
      "SELECT nombre_usuario FROM usuarios WHERE id = $1",
      [req.user.id],
    );
    const row = ins.rows[0];
    res.status(201).json({
      comment: {
        ...row,
        autor_nombre: nombre.rows[0]?.nombre_usuario ?? "",
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete(
  "/api/games/:gameId/comments/:commentId",
  authMiddleware,
  async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId, 10);
      const commentId = parseInt(req.params.commentId, 10);
      if (Number.isNaN(gameId) || Number.isNaN(commentId)) {
        return res.status(400).json({ error: "ID inválido." });
      }
      if (!(await juegoComentariosTableExists())) {
        return res.status(503).json({ error: "Comentarios no disponibles." });
      }
      const row = await pool.query(
        `SELECT c.id, c.usuario_id, j.usuario_id AS juego_owner
         FROM juego_comentarios c
         JOIN juegos j ON j.id = c.juego_id
         WHERE c.id = $1 AND c.juego_id = $2`,
        [commentId, gameId],
      );
      if (row.rows.length === 0) {
        return res.status(404).json({ error: "Comentario no encontrado." });
      }
      const r = row.rows[0];
      const isAuthor = r.usuario_id === req.user.id;
      const isGameOwner = r.juego_owner === req.user.id;
      const isAdmin = await usuarioEsAdmin(req.user.id);
      if (!isAuthor && !isGameOwner && !isAdmin) {
        return res
          .status(403)
          .json({ error: "No puedes eliminar este comentario." });
      }
      await pool.query("DELETE FROM juego_comentarios WHERE id = $1", [
        commentId,
      ]);
      res.json({ success: true, message: "Comentario eliminado." });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Carga de detalle para edición (también filtrado por dueño).
app.get("/api/games/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const row = await queryOneGameForUser(req.user.id, id);
    if (!row) {
      return res.status(404).json({ error: "Juego no encontrado" });
    }
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualización con control de duplicados y ownership.
app.put("/api/games/:id", authMiddleware, async (req, res) => {
  try {
    const gameRowId = parseInt(req.params.id, 10);
    if (Number.isNaN(gameRowId)) {
      return res.status(400).json({ error: "ID de juego inválido." });
    }
    const id = gameRowId;
    const {
      titulo,
      estado,
      plataforma,
      puntuacion,
      horas_jugadas,
      url_imagen,
    } = req.body;

    const estadoVal = normalizeEstadoForDb(estado);
    const plataformaVal = normalizePlataforma(plataforma);
    const catalogoRef = parseCatalogoRef(req.body);
    const hasCatalogoCol = await juegosHasCatalogoIdColumn();

    const tituloNorm = normalizeGameTitle(titulo);
    if (!tituloNorm) {
      return res.status(400).json({ error: "El título es obligatorio." });
    }

    const tituloKey = titleMatchKey(tituloNorm);

    const url =
      typeof url_imagen === "string" && url_imagen.trim() !== ""
        ? url_imagen.trim()
        : null;

    const pNum = Number(puntuacion);
    const hNum = Number(horas_jugadas);
    const puntuacionVal = Number.isFinite(pNum) ? pNum : 0;
    const horasVal = Number.isFinite(hNum) ? Math.max(0, hNum) : 0;

    const hasImgCol = await juegosHasUrlImagenColumn();

    const prev = await pool.query(
      "SELECT id FROM juegos WHERE id = $1 AND usuario_id = $2",
      [id, req.user.id],
    );
    if (prev.rows.length === 0) {
      return res.status(404).json({ error: "Juego no encontrado." });
    }

    // Otra ficha con el mismo título canónico o la misma clave normalizada (la UI puede mostrar
    // el nombre del catálogo aunque en BD el título guardado sea distinto, p. ej. DLC largo vs base).
    const mergeDup = req.body.merge_duplicate === true;
    const conflictingRows = await pool.query(
      `SELECT id FROM juegos
       WHERE usuario_id = $1 AND id <> $2 AND (
         LOWER(TRIM(REGEXP_REPLACE(titulo, '[[:space:]]+', ' ', 'g'))) = $3
         OR titulo = $4
       )`,
      [req.user.id, id, tituloKey, tituloNorm],
    );
    if (conflictingRows.rows.length > 0) {
      if (mergeDup) {
        const ids = conflictingRows.rows.map((r) => r.id);
        await pool.query(
          `DELETE FROM juegos WHERE usuario_id = $1 AND id = ANY($2::int[])`,
          [req.user.id, ids],
        );
      } else {
        return res.status(400).json({
          error:
            "Ya tienes otra ficha que usaría el mismo título al guardar (a veces la tarjeta muestra el nombre del catálogo y en base de datos el texto del título sigue siendo distinto, p. ej. DLC vs juego base). " +
            "Marca «Eliminar la otra ficha duplicada» y guarda de nuevo, o borra manualmente la entrada que sobren en Mi colección.",
          merge_available: true,
        });
      }
    }

    if (hasCatalogoCol && catalogoRef) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const catId = await upsertCatalogoGame(client, {
          source: catalogoRef.source,
          id: catalogoRef.id,
          titulo: tituloNorm,
          url_imagen: url,
        });
        if (!catId) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: "No se pudo actualizar el catálogo del juego.",
          });
        }
        const dup = await client.query(
          `SELECT id FROM juegos WHERE usuario_id = $1 AND catalogo_id = $2 AND id <> $3`,
          [req.user.id, catId, id],
        );
        if (dup.rows.length > 0) {
          if (mergeDup) {
            const ids = dup.rows.map((r) => r.id);
            await client.query(
              `DELETE FROM juegos WHERE usuario_id = $1 AND id = ANY($2::int[])`,
              [req.user.id, ids],
            );
          } else {
            await client.query("ROLLBACK");
            return res.status(400).json({
              error:
                "Ya tienes otra ficha enlazada al mismo juego del catálogo. Marca «Eliminar la otra ficha duplicada» y guarda de nuevo, o borra la entrada duplicada en Mi colección.",
              merge_available: true,
            });
          }
        }
        if (hasImgCol) {
          await client.query(
            `UPDATE juegos SET titulo = $1, estado = $2, plataforma = $3, puntuacion = $4, horas_jugadas = $5, url_imagen = $6, catalogo_id = $7
             WHERE id = $8 AND usuario_id = $9`,
            [
              tituloNorm,
              estadoVal,
              plataformaVal,
              puntuacionVal,
              horasVal,
              url,
              catId,
              id,
              req.user.id,
            ],
          );
        } else {
          await client.query(
            `UPDATE juegos SET titulo = $1, estado = $2, plataforma = $3, puntuacion = $4, horas_jugadas = $5, catalogo_id = $6
             WHERE id = $7 AND usuario_id = $8`,
            [
              tituloNorm,
              estadoVal,
              plataformaVal,
              puntuacionVal,
              horasVal,
              catId,
              id,
              req.user.id,
            ],
          );
        }
        await client.query("COMMIT");
        const row = await queryOneGameForUser(req.user.id, id);
        return res.json({ success: true, data: row });
      } catch (e) {
        try {
          await client.query("ROLLBACK");
        } catch (_) {
          /* */
        }
        throw e;
      } finally {
        client.release();
      }
    }

    const result = hasImgCol
      ? await pool.query(
          "UPDATE juegos SET titulo = $1, estado = $2, plataforma = $3, puntuacion = $4, horas_jugadas = $5, url_imagen = $6 WHERE id = $7 AND usuario_id = $8 RETURNING id",
          [
            tituloNorm,
            estadoVal,
            plataformaVal,
            puntuacionVal,
            horasVal,
            url,
            id,
            req.user.id,
          ],
        )
      : await pool.query(
          "UPDATE juegos SET titulo = $1, estado = $2, plataforma = $3, puntuacion = $4, horas_jugadas = $5 WHERE id = $6 AND usuario_id = $7 RETURNING id",
          [
            tituloNorm,
            estadoVal,
            plataformaVal,
            puntuacionVal,
            horasVal,
            id,
            req.user.id,
          ],
        );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Juego no encontrado." });
    }

    const row = await queryOneGameForUser(req.user.id, id);
    res.json({ success: true, data: row });
  } catch (err) {
    console.error("[PUT /api/games]", err);
    if (err.code === "23505") {
      return res.status(400).json({
        error:
          "Ese título o juego ya está en tu colección en otra ficha (restricción única en la base de datos). " +
          "Elimina la entrada duplicada o el DLC si ya tienes el juego base.",
        detail: err.detail,
      });
    }
    res
      .status(500)
      .json(serverErrorPayload(err, "Error al actualizar el juego"));
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
