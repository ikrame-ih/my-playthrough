/**
 * Maps DB `estado` values to user-facing labels.
 * "Pendiente" is shown as "BACKLOG" (standard gaming term).
 */
export function labelEstado(valorBd) {
  if (valorBd === "Pendiente") return "BACKLOG";
  if (valorBd === "Jugando") return "PLAYING";
  if (valorBd === "Completado") return "COMPLETED";
  return valorBd;
}

/**
 * Tailwind classes for game status badges.
 */
export function estadoBadgeClass(valorBd) {
  switch (valorBd) {
    case "Jugando":
    case "Completado":
      return "border-transparent bg-brand-tealBtn text-black";
    case "Pendiente":
    default:
      return "border-white/10 bg-slate-700/80 text-slate-200";
  }
}
