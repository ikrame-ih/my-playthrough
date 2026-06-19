/**
 * Same rules as `server/utils/normalize.js` (passwordPolicyMessage).
 */
export function passwordPolicyMessage(password) {
  const p = String(password ?? "");
  if (p.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (!/[a-z]/.test(p)) {
    return "Include at least one lowercase letter.";
  }
  if (!/[A-Z]/.test(p)) {
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
