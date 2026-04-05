/**
 * covers.js
 *
 * Lógica para buscar y servir carátulas de videojuegos.
 * Combina dos fuentes externas: RAWG (mejor para consolas y PC) y Steam
 * (necesario para títulos que solo aparecen en su plataforma propia).
 * También gestiona el upsert en la tabla catalogo_juegos, que actúa como
 * caché local de los metadatos de juegos ya buscados.
 */

const { fetchTimeoutMs } = require("./normalize");

/**
 * Lista blanca de dominios desde los que el proxy de imágenes acepta peticiones.
 * Limitar los hosts evita que el servidor sea usado como proxy abierto
 * para cualquier URL arbitraria (SSRF - Server-Side Request Forgery).
 */
const ALLOWED_COVER_HOSTS = new Set([
  "media.rawg.io",
  "cdn.cloudflare.steamstatic.com",
  "steamcdn-a.akamaihd.net",
  "shared.akamai.steamstatic.com",
  "cdn.akamai.steamstatic.com",
  "store.akamai.steamstatic.com",
  "cdn.steamstatic.com",
]);

// Cabeceras que enviamos al hacer fetch a APIs externas.
// Identificarnos con un User-Agent descriptivo es una buena práctica
// y algunos servicios lo exigen para no bloquear la petición.
const COVER_FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; MyPlaythrough/1.0; +https://github.com/)",
  Accept: "application/json",
};

// Para las peticiones de imagen aceptamos formatos modernos (avif, webp)
// además del jpeg/png clásico, para reducir el tamaño de las transferencias.
const COVER_IMAGE_FETCH_HEADERS = {
  "User-Agent": COVER_FETCH_HEADERS["User-Agent"],
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
};

/**
 * Busca juegos en RAWG y devuelve los resultados normalizados.
 * RAWG tiene la base de datos más completa para juegos de consola y PC.
 * Requiere una API key (gratuita) configurada en la variable RAWG_API_KEY.
 */
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

  // Filtramos los juegos sin imagen para no mostrar tarjetas vacías en la UI.
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

/**
 * Busca juegos en la tienda de Steam y enriquece cada resultado
 * con la imagen de cabecera de alta calidad (header_image).
 * Steam no requiere API key, pero su buscador no es tan preciso como RAWG.
 */
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

  // Para cada resultado hacemos una segunda llamada a la API de detalles
  // para obtener la imagen de alta calidad. Usamos Promise.all para
  // ejecutar todas las peticiones en paralelo y no esperar una por una.
  const enriched = await Promise.all(
    items.map(async (item) => {
      if (!item.id || !item.name) return null;
      let background_image = item.tiny_image; // imagen de baja calidad como fallback
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
        // Si la petición de detalles falla, seguimos con tiny_image.
      }
      if (!background_image) return null;
      return { id: item.id, name: item.name, background_image, source: "steam" };
    }),
  );

  return enriched.filter(Boolean);
}

/**
 * Combina los resultados de RAWG y Steam eliminando duplicados por nombre.
 * RAWG va primero porque suele tener imágenes de mejor calidad.
 * Steam solo aporta los títulos que no estén ya en la lista de RAWG.
 * Limitamos el total a 30 resultados para no saturar la UI.
 */
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

/**
 * Inserta o actualiza el juego en la tabla catalogo_juegos.
 * Usa ON CONFLICT para que si el juego ya existe (por rawg_id o steam_app_id)
 * simplemente actualice el título y la imagen sin crear un duplicado.
 * Devuelve el id interno de la fila en catalogo_juegos, que se guarda
 * como clave foránea en la tabla juegos del usuario.
 */
async function upsertCatalogoGame(client, { source, id, titulo, url_imagen }) {
  const { normalizeGameTitle } = require("./normalize");
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
         titulo     = EXCLUDED.titulo,
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
         titulo     = EXCLUDED.titulo,
         url_imagen = COALESCE(EXCLUDED.url_imagen, catalogo_juegos.url_imagen)
       RETURNING id`,
      [t, url, id],
    );
    return r.rows[0]?.id ?? null;
  }

  return null;
}

module.exports = {
  ALLOWED_COVER_HOSTS,
  COVER_FETCH_HEADERS,
  COVER_IMAGE_FETCH_HEADERS,
  fetchRawgCovers,
  fetchSteamCovers,
  mergeCoverResults,
  upsertCatalogoGame,
};
