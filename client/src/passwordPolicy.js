/**
 * Misma lógica que `server/utils/normalize.js` (passwordPolicyMessage).
 */
export function passwordPolicyMessage(password) {
  const p = String(password ?? "");
  if (p.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  if (!/[a-zñáéíóúü]/.test(p)) {
    return "Incluye al menos una letra minúscula.";
  }
  if (!/[A-ZÑÁÉÍÓÚÜ]/.test(p)) {
    return "Incluye al menos una letra mayúscula.";
  }
  if (!/[0-9]/.test(p)) {
    return "Incluye al menos un número.";
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(p)) {
    return "Incluye al menos un símbolo especial (por ejemplo ! ? #).";
  }
  return null;
}
