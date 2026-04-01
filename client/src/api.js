/** Base URL del backend (Vite inyecta import.meta.env en el cliente). */
export const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

export function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
