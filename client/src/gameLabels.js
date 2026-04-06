/**
 * Traduce el valor de estado almacenado en la BD al texto que ve el usuario.
 * "Pendiente" se muestra como "BACKLOG" porque es el término estándar
 * en la comunidad gamer (lista de juegos comprados pero sin empezar).
 *
 * @param {string} valorBd - Valor del campo `estado` de la BD ('Pendiente' | 'Jugando' | 'Completado').
 * @returns {string} Etiqueta en mayúsculas para mostrar en la UI.
 */
export function labelEstado(valorBd) {
  if (valorBd === "Pendiente") return "BACKLOG";
  if (valorBd === "Jugando") return "JUGANDO";
  if (valorBd === "Completado") return "COMPLETADO";
  return valorBd;
}

/**
 * Devuelve las clases de Tailwind para el badge de estado de un juego.
 * Los estados activos (Jugando, Completado) usan el color de acento `brand-tealBtn`,
 * mientras que Backlog usa un gris neutro para no distraer visualmente.
 *
 * @param {string} valorBd - Valor del campo `estado` de la BD.
 * @returns {string} Clases de Tailwind CSS para aplicar al badge.
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
