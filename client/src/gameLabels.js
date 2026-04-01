/** Etiquetas en pantalla alineadas con el prototipo Figma (Backlog = Pendiente en BD). */
export function labelEstado(valorBd) {
  if (valorBd === "Pendiente") return "BACKLOG";
  if (valorBd === "Jugando") return "JUGANDO";
  if (valorBd === "Completado") return "COMPLETADO";
  return valorBd;
}

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
