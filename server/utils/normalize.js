// Input normalisation before validation/DB writes. Pure helpers — no I/O.

const normalizeEmail = (email) =>
  String(email ?? "")
    .trim()
    .toLowerCase();

function passwordPolicyMessage(password) {
  const p = String(password ?? "");
  if (p.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (!/[a-zñáéíóúü]/.test(p)) {
    return "Include at least one lowercase letter.";
  }
  if (!/[A-ZÑÁÉÍÓÚÜ]/.test(p)) {
    return "Include at least one uppercase letter.";
  }
  if (!/[0-9]/.test(p)) {
    return "Include at least one number.";
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(p)) {
    return "Include at least one special character (e.g. ! ? #).";
  }
  return null;
}

function normalizeGameTitle(t) {
  return String(t ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function titleMatchKey(t) {
  return normalizeGameTitle(t).toLowerCase();
}

function normalizePlataforma(p) {
  const s = String(p ?? "").trim();
  return s || "PC";
}

// Accepts Spanish DB values and English aliases from the form.
function normalizeEstadoForDb(estado) {
  const s = String(estado ?? "").trim();
  const map = {
    Pendiente: "Pendiente",
    Jugando: "Jugando",
    Completado: "Completado",
    Backlog: "Pendiente",
    Playing: "Jugando",
    Completed: "Completado",
  };
  return map[s] || s;
}

function parseCatalogoRef(body) {
  const ref = body?.catalogo_ref;
  if (!ref || typeof ref !== "object") return null;

  const source = String(ref.source ?? "").toLowerCase();
  const id = ref.id;

  if (source !== "rawg" && source !== "steam") return null;

  const num = Number(id);
  if (!Number.isFinite(num) || num <= 0) return null;

  return { source, id: num };
}

function serverErrorPayload(err, fallbackMsg) {
  const out = { error: fallbackMsg };
  if (process.env.NODE_ENV !== "production" && err?.message) {
    out.detail = err.message;
  }
  if (err?.code) out.code = err.code;
  return out;
}

function fetchTimeoutMs(ms) {
  if (
    typeof AbortSignal !== "undefined" &&
    typeof AbortSignal.timeout === "function"
  ) {
    return AbortSignal.timeout(ms);
  }
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

module.exports = {
  normalizeEmail,
  passwordPolicyMessage,
  normalizeGameTitle,
  titleMatchKey,
  normalizePlataforma,
  normalizeEstadoForDb,
  parseCatalogoRef,
  serverErrorPayload,
  fetchTimeoutMs,
};
