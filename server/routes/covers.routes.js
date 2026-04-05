/**
 * covers.routes.js
 *
 * Proxy de imágenes y búsqueda de carátulas.
 * El proxy existe porque los CDN de Steam bloquean las peticiones de imagen
 * que vienen directamente desde el navegador (política CORS + hotlink protection).
 * Al hacer la petición desde el servidor, evitamos ese bloqueo.
 *
 * Rutas definidas aquí:
 *   GET /api/covers/proxy        → proxy de imagen (sin auth, la usan etiquetas <img>)
 *   GET /api/games/cover-search  → búsqueda RAWG + Steam combinada
 *
 * NOTA: cover-search está en /api/games/ pero lo gestiono aquí porque
 * pertenece a la misma lógica de carátulas y debe registrarse ANTES
 * de la ruta /api/games/:id para que Express no lo confunda con un ID.
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
 * GET /api/covers/proxy?u=<url>
 * Descarga una imagen de los CDN permitidos y la reenvía al cliente.
 * No requiere autenticación porque las etiquetas <img> del HTML no pueden
 * enviar cabeceras Authorization. La protección la da la lista blanca de hosts.
 * Limitamos el tamaño de la respuesta a 6 MB para evitar abusos.
 */
/**
 * Transforma una URL de media.rawg.io a su variante recortada (600×400 px).
 * RAWG sirve las imágenes originales en resolución completa (~8 MB), pero
 * ofrece un servicio de redimensionado en la misma CDN: basta con insertar
 * /crop/<ancho>/<alto>/ después de /media/.
 *
 * Ejemplo:
 *   original → https://media.rawg.io/media/games/xxx.jpg  (~8 MB)
 *   recortada → https://media.rawg.io/media/crop/600/400/games/xxx.jpg  (~50 KB)
 *
 * Solo aplicamos esto cuando la URL no tiene ya un segmento de recorte,
 * para no duplicar la transformación.
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

  // Si es de RAWG, reescribimos a la variante comprimida antes de hacer fetch.
  // Esto reduce el tamaño de ~8 MB a ~50 KB y acelera la carga de carátulas.
  const fetchUrl = toRawgCropUrl(target.href);

  try {
    const upstream = await fetch(fetchUrl, {
      headers: COVER_IMAGE_FETCH_HEADERS,
      signal: fetchTimeoutMs(20000),
    });
    if (!upstream.ok) return res.status(502).end();

    const ct = upstream.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await upstream.arrayBuffer());

    // 10 MB como límite de seguridad (Steam HDR covers pueden ser grandes).
    if (buf.length > 10 * 1024 * 1024) return res.status(502).end();

    res.setHeader("Content-Type", ct);
    // Cache-Control: las carátulas no cambian, podemos cachearlas 24h en el navegador.
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(buf);
  } catch (e) {
    console.error("[cover proxy]", e.message);
    res.status(502).end();
  }
});

/**
 * GET /api/games/cover-search?q=<término>
 * Busca carátulas combinando RAWG y Steam. Requiere autenticación para
 * evitar que bots externos usen la ruta como buscador gratuito.
 * La clave RAWG es opcional: si no está configurada, solo se usa Steam.
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
