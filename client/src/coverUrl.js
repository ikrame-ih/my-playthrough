import { API_BASE } from "./api";

/**
 * Convierte la URL de una carátula para que el navegador la pida a través de nuestro servidor.
 *
 * Steam y RAWG bloquean las peticiones de imagen que vienen directamente del navegador,
 * así que en lugar de pedir la imagen al CDN directamente, el navegador se la pide
 * a nuestro backend (`/api/covers/proxy`), que la descarga y la reenvía.
 *
 * Casos en los que no se aplica el proxy:
 * - Imágenes en base64 (`data:`): ya están en el navegador, no necesitan descargarse.
 * - URLs que ya pasan por el proxy: para no anidar dos llamadas.
 * - URLs que no son http/https: no se procesan.
 *
 * @param {string} url - URL original de la carátula.
 * @returns {string} URL que apunta al proxy, o la original si no necesita cambios.
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
