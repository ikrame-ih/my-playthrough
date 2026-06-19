import { Link } from "react-router-dom";
import { displayCoverUrl } from "../coverUrl";
import { estadoBadgeClass, labelEstado } from "../gameLabels";
import { IconGift, IconImage, IconPencil, IconTrash } from "./icons";

/**
 * Vista compacta (lista) de una ficha de juego.
 */
export default function GameListRow({
  game,
  showActions,
  onDelete,
  onRecommend,
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
        <h3 className="truncate text-base font-semibold text-white sm:text-[1.05rem]">
          {game.titulo}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="rounded-md bg-slate-800/80 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200 ring-1 ring-white/10">
            {game.plataforma?.trim() || "No platform"}
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span aria-hidden className="text-base leading-none opacity-90">
              ⏱
            </span>
            <span className="font-semibold tabular-nums text-slate-200">
              {game.horas_jugadas ?? 0} h
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="text-base leading-none text-amber-400/90">
              ★
            </span>
            <span className="font-semibold tabular-nums text-amber-400">
              {game.puntuacion ?? "—"}/10
            </span>
          </span>
        </div>
      </div>
      <span
        className={`inline-flex shrink-0 rounded-md border px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide ${estadoBadgeClass(game.estado)}`}
      >
        {labelEstado(game.estado)}
      </span>
      <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
        {discussionTo && (
          <Link
            to={discussionTo}
            className="text-xs font-semibold text-brand-accent hover:text-teal-300"
          >
            Discussion
          </Link>
        )}
        {showActions && (
          <>
            {onRecommend && (
              <button
                type="button"
                onClick={() => onRecommend(game)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-brand-accent"
                title="Recommend"
                aria-label={`Recommend ${game.titulo}`}
              >
                <IconGift className="h-4 w-4" />
              </button>
            )}
            <Link
              to={`/edit/${game.id}`}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
              title="Edit"
              aria-label={`Edit ${game.titulo}`}
            >
              <IconPencil className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => onDelete?.(game.id, game.titulo)}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
              title="Delete"
              aria-label={`Delete ${game.titulo}`}
            >
              <IconTrash className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </article>
  );
}
