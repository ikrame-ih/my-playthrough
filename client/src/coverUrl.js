import { API_BASE } from "./api";

/**
 * Transforma una URL de carátula para que se sirva a través del proxy del backend.
 *
 * Los CDN de Steam y RAWG bloquean peticiones directas desde el navegador
 * (política CORS + hotlink protection). Esta función redirige la carga de
 * imágenes a `/api/covers/proxy?u=<url>`, donde el servidor actúa de intermediario.
 *
 * Casos especiales manejados:
 * - URLs `data:` (base64): se devuelven tal cual, no necesitan proxy.
 * - URLs que ya pasan por el proxy: no se duplica el envoltorio.
 * - URLs con protocolo no http(s): se devuelven sin modificar.
 *
 * @param {string} url - URL original de la carátula.
 * @returns {string} URL que apunta al proxy, o la original si no necesita proxy.
 */
export function displayCoverUrl(url) {
  const u = (url || "").trim();
  if (!u) return "";
  if (u.startsWith("data:")) return u;
  try {
    const parsed = new URL(u);
    if (parsed.pathname.includes("/api/covers/proxy")) return u;
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return u;
    return `${API_BASE}/api/covers/proxy?u=${encodeURIComponent(parsed.href)}`;
  } catch {
    return u;
  }
}
