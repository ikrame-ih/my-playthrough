// RAWG + Steam cover search and shared catalogo_juegos upserts.

const { fetchTimeoutMs } = require("./normalize");

// Proxy allowlist — blocks arbitrary URL fetch through our server.
const ALLOWED_COVER_HOSTS = new Set([
  "media.rawg.io",
  "cdn.cloudflare.steamstatic.com",
  "steamcdn-a.akamaihd.net",
  "shared.akamai.steamstatic.com",
  "cdn.akamai.steamstatic.com",
  "store.akamai.steamstatic.com",
  "cdn.steamstatic.com",
]);

const COVER_FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; MyPlaythrough/1.0; +https://github.com/)",
  Accept: "application/json",
};

const COVER_IMAGE_FETCH_HEADERS = {
  "User-Agent": COVER_FETCH_HEADERS["User-Agent"],
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
};

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

  // Second request per hit for header_image (parallel).
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

// Upsert into catalogo_juegos when user picks a search result.
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
