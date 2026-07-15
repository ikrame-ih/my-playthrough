// Route cover URLs through the API proxy (Steam/RAWG block direct browser fetches).
import { API_BASE } from "./api";

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
