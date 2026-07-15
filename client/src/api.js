export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Central fetch: JSON + Bearer. On 401, clear session and reload so components
// don't each handle expired tokens.
export async function apiFetch(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      ...authHeaders(),
      ...opts.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
    throw new Error("Session expired");
  }

  return res;
}
