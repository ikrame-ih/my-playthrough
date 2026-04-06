/**
 * @module covers.routes
 * @description Proxy de imágenes y búsqueda de carátulas.
 *
 * El proxy existe porque los CDN de Steam y RAWG bloquean peticiones de imagen
 * que vienen directamente desde el navegador (política CORS + hotlink protection).
 * Al hacer la petición desde el servidor, evitamos ese bloqueo.
 *
 * Rutas definidas:
 *   GET /api/covers/proxy        → proxy de imagen (sin auth, la usan etiquetas <img>)
 *   GET /api/games/cover-search  → búsqueda RAWG + Steam combinada (requiere auth)
 *
 * NOTA: cover-search está montado en /api/games/ pero se gestiona aquí porque
 * pertenece a la misma lógica de carátulas y debe registrarse ANTES de /api/games/:id
 * para que Express no confunda "cover-search" con un ID numérico.
 */

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

/**
 * Reescribe una URL de media.rawg.io a su variante recortada (600×400 px).
 * Las imágenes originales de RAWG pesan ~8 MB. Insertando `/crop/600/400/`
 * en la ruta se obtiene la misma imagen redimensionada a ~50 KB, lo que
 * reduce drásticamente el tiempo de carga de las carátulas.
 *
 * @param {string} url - URL original de la imagen.
 * @returns {string} URL con el recorte aplicado, o la original si no es de RAWG.
 */
function toRawgCropUrl(url) {
  const RAWG_HOST = "media.rawg.io";
  const CROP = "/media/crop/600/400/";
  try {
    const u = new URL(url);
    if (u.hostname !== RAWG_HOST) return url;
    if (u.pathname.startsWith("/media/crop/")) return url; // ya tiene recorte
    if (!u.pathname.startsWith("/media/")) return url;
    u.pathname = CROP + u.pathname.slice("/media/".length);
    return u.href;
  } catch {
    return url;
  }
}

/**
 * Descarga una imagen de los CDN permitidos y la reenvía al cliente.
 * No requiere autenticación porque las etiquetas `<img>` del HTML no pueden
 * enviar cabeceras `Authorization`. La seguridad la da la lista blanca de hosts.
 * Las carátulas se cachean 24h en el navegador (`Cache-Control: max-age=86400`).
 *
 * @route  GET /api/covers/proxy?u=<url>
 * @access Public (sin auth, protegido por lista blanca de hosts)
 * @param  {string} req.query.u - URL de la imagen a proxear.
 * @returns {Buffer} Imagen en su formato original | 400/403/502 en caso de error.
 */
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

  // Si es de RAWG, reescribimos a la variante comprimida antes de hacer fetch
  const fetchUrl = toRawgCropUrl(target.href);

  try {
    const upstream = await fetch(fetchUrl, {
      headers: COVER_IMAGE_FETCH_HEADERS,
      signal: fetchTimeoutMs(20000),
    });
    if (!upstream.ok) return res.status(502).end();

    const ct = upstream.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await upstream.arrayBuffer());

    // 10 MB como límite de seguridad (evita abusos con imágenes gigantes)
    if (buf.length > 10 * 1024 * 1024) return res.status(502).end();

    res.setHeader("Content-Type", ct);
    // Las carátulas no cambian, podemos cachearlas 24h en el navegador
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(buf);
  } catch (e) {
    console.error("[cover proxy]", e.message);
    res.status(502).end();
  }
});

/**
 * Busca carátulas de juegos combinando RAWG y Steam.
 * Requiere autenticación para evitar que bots externos usen la ruta como
 * buscador gratuito consumiendo nuestra cuota de la API de RAWG.
 * Si `RAWG_API_KEY` no está configurada, solo se usa Steam como fallback.
 *
 * @route  GET /api/games/cover-search?q=<término>
 * @access Private (requiere JWT válido)
 * @param  {string} req.query.q - Término de búsqueda (mínimo 2 caracteres).
 * @returns {object} 200 – `{ results: [...] }` | 400 – parámetro inválido | 500 – error externo.
 */
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
