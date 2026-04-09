import { Link } from "react-router-dom";
import { displayCoverUrl } from "../coverUrl";
import { estadoBadgeClass, labelEstado } from "../gameLabels";
import { IconImage, IconPencil, IconTrash } from "./icons";

/**
 * Vista compacta (lista) de una ficha de juego.
 */
export default function GameListRow({
  game,
  showActions,
  onDelete,
  discussionTo,
}) {
  const rawCover = game.url_imagen?.trim();
  const coverUrl = rawCover ? displayCoverUrl(rawCover) : "";

  return (
    <article
      className="motion-avatar-tile flex flex-wrap items-center gap-4 rounded-xl border border-white/[0.08] bg-brand-panel/60 p-3 transition hover:border-brand-accent/25 sm:flex-nowrap"
      aria-label={game.titulo}
    >
      <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-slate-800 to-slate-950">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <IconImage className="h-8 w-8 text-slate-600" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-white">{game.titulo}</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          {game.plataforma?.trim() || "—"} · {game.horas_jugadas ?? 0} h · Nota{" "}
          {game.puntuacion ?? "—"}
        </p>
      </div>
      <span
        className={`inline-flex shrink-0 rounded-md border px-2 py-1 text-[0.6rem] font-bold uppercase tracking-wide ${estadoBadgeClass(game.estado)}`}
      >
        {labelEstado(game.estado)}
      </span>
      <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
        {discussionTo && (
          <Link
            to={discussionTo}
            className="text-xs font-semibold text-brand-accent hover:text-teal-300"
          >
            Discusión
          </Link>
        )}
        {showActions && (
          <>
            <Link
              to={`/edit/${game.id}`}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
              title="Editar"
              aria-label={`Editar ${game.titulo}`}
            >
              <IconPencil className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => onDelete?.(game.id, game.titulo)}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
              title="Eliminar"
              aria-label={`Eliminar ${game.titulo}`}
            >
              <IconTrash className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </article>
  );
}
