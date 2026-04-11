/**
 * @module covers
 * @description Lógica para buscar carátulas de videojuegos y mantener el catálogo compartido.
 *
 * Combina dos fuentes externas:
 * - RAWG (rawg.io): base de datos de más de 500.000 juegos. Requiere API key gratuita.
 * - Steam (store.steampowered.com): no necesita key, pero solo cubre títulos de PC en Steam.
 *
 * También guarda los resultados en la tabla `catalogo_juegos` para no repetir la
 * misma búsqueda externa cada vez que alguien añade el mismo juego.
 */

const { fetchTimeoutMs } = require("./normalize");

/**
 * Lista de dominios permitidos para el proxy de imágenes.
 * Solo aceptamos URLs de estos servidores para evitar que alguien use
 * nuestro backend para descargar contenido de cualquier sitio web externo,
 * lo que podría comprometer la seguridad del servidor.
 * @constant {Set<string>}
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

/**
 * Cabeceras para peticiones a APIs externas (JSON).
 * Identificarnos con un User-Agent descriptivo es buena práctica y algunos
 * servicios lo exigen para no bloquear la petición.
 * @constant {object}
 */
const COVER_FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; MyPlaythrough/1.0; +https://github.com/)",
  Accept: "application/json",
};

/**
 * Cabeceras para descargar imágenes de los CDN externos.
 * Indicamos que aceptamos formatos modernos como avif y webp, que pesan menos
 * que jpeg/png y se cargan más rápido cuando el servidor los soporta.
 * @constant {object}
 */
const COVER_IMAGE_FETCH_HEADERS = {
  "User-Agent": COVER_FETCH_HEADERS["User-Agent"],
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
};

/**
 * Busca juegos en RAWG y devuelve los resultados normalizados.
 * RAWG tiene la base de datos más completa para juegos de consola y PC.
 * Filtramos los resultados sin imagen para no mostrar tarjetas vacías en la UI.
 *
 * @param {string} searchQuery - Término de búsqueda introducido por el usuario.
 * @param {string} apiKey      - Clave de API de RAWG (gratuita en rawg.io/apidocs).
 * @returns {Promise<Array<{id: number, name: string, background_image: string, source: "rawg"}>>}
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

  // Filtramos los juegos sin imagen para no mostrar tarjetas vacías en la UI
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
 * Busca juegos en la API pública de Steam y enriquece cada resultado con
 * la imagen HD de portada (`header_image`) mediante una segunda llamada a `appdetails`.
 * No necesita API key pero cubre solo títulos disponibles en Steam.
 *
 * @param {string} searchQuery - Término de búsqueda.
 * @returns {Promise<Array<{id: number, name: string, background_image: string, source: "steam"}>>}
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

  // Pedimos la imagen HD de cada resultado en paralelo para acelerar la respuesta
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
        /* si falla la llamada a appdetails, usamos tiny_image */
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

/**
 * Combina los resultados de RAWG y Steam eliminando duplicados por nombre.
 * RAWG tiene prioridad (sus imágenes son de mayor calidad).
 * El resultado está limitado a 30 elementos para no sobrecargar la UI.
 *
 * @param {object[]} rawg  - Resultados de RAWG.
 * @param {object[]} steam - Resultados de Steam.
 * @returns {object[]} Lista combinada sin duplicados, máximo 30 elementos.
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
 * Guarda un juego en la tabla compartida `catalogo_juegos`.
 * Si el juego ya existía (mismo ID de RAWG o de Steam), actualiza sus datos
 * en lugar de crear un duplicado. Este comportamiento se llama "upsert" en bases de datos:
 * insertar si no existe, actualizar si ya existe.
 * Devuelve el ID del catálogo, que la tabla `juegos` usa para enlazar la ficha personal
 * con el juego del catálogo.
 *
 * @param {import("pg").PoolClient} client     - Conexión de base de datos dentro de una transacción.
 * @param {object}  opts            - Datos del juego a guardar.
 * @param {"rawg"|"steam"} opts.source - De dónde viene el juego (RAWG o Steam).
 * @param {number}  opts.id         - ID del juego en RAWG o Steam.
 * @param {string}  opts.titulo     - Título del juego.
 * @param {string|null} opts.url_imagen - URL de la portada.
 * @returns {Promise<number|null>} ID del registro en el catálogo, o null si algo falló.
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
