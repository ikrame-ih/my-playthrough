// Cover image proxy + RAWG/Steam search. Proxy is public (img tags can't send Bearer);
// search requires auth. cover-search is mounted on /api/games before /:id.

const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const {
  ALLOWED_COVER_HOSTS,
  COVER_IMAGE_FETCH_HEADERS,
  fetchRawgCovers,
  fetchSteamCovers,
  mergeCoverResults,
} = require("../utils/covers");
const { fetchTimeoutMs } = require("../utils/normalize");

const router = express.Router();

// RAWG originals are huge; /crop/600/400/ keeps payloads reasonable.
function toRawgCropUrl(url) {
  const RAWG_HOST = "media.rawg.io";
  const CROP = "/media/crop/600/400/";
  try {
    const u = new URL(url);
    if (u.hostname !== RAWG_HOST) return url;
    if (u.pathname.startsWith("/media/crop/")) return url;
    if (!u.pathname.startsWith("/media/")) return url;
    u.pathname = CROP + u.pathname.slice("/media/".length);
    return u.href;
  } catch {
    return url;
  }
}

router.get("/proxy", async (req, res) => {
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
    return res.status(400).json({ error: "Solo se permiten URLs http(s)." });
  }
  if (!ALLOWED_COVER_HOSTS.has(target.hostname)) {
    return res.status(403).json({ error: "Host no permitido." });
  }

  const fetchUrl = toRawgCropUrl(target.href);

  try {
    const upstream = await fetch(fetchUrl, {
      headers: COVER_IMAGE_FETCH_HEADERS,
      signal: fetchTimeoutMs(20000),
    });
    if (!upstream.ok) return res.status(502).end();

    const ct = upstream.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await upstream.arrayBuffer());

    if (buf.length > 10 * 1024 * 1024) return res.status(502).end();

    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(buf);
  } catch (e) {
    console.error("[cover proxy]", e.message);
    res.status(502).end();
  }
});

router.get("/cover-search", authMiddleware, async (req, res) => {
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

module.exports = router;
