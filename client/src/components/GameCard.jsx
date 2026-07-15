import { useState } from "react";
import { Link } from "react-router-dom";
import { displayCoverUrl } from "../coverUrl";
import { estadoBadgeClass, labelEstado } from "../gameLabels";
import { IconGift, IconImage, IconPencil, IconTrash } from "./icons";

/**
 * Game card: cover art, platform, status, hours, score, and optional actions.
 */
export default function GameCard({
  game,
  showActions = false,
  onDelete,
  onRecommend,
  discussionTo,
}) {
  const initial = (game.titulo || "?").trim().charAt(0).toUpperCase();
  const [imgError, setImgError] = useState(false);
  const rawCover = game.url_imagen?.trim();
  const coverUrl = rawCover ? displayCoverUrl(rawCover) : "";
  const showCover = Boolean(coverUrl) && !imgError;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-brand-panel/90 shadow-figma ring-1 ring-white/[0.04] transition-all duration-300 hover:-translate-y-1 hover:border-brand-accent/50 hover:shadow-glow-cyan">
      <span aria-hidden className="pointer-events-none absolute left-2 top-2 z-20 h-3 w-3 border-l border-t border-brand-accent/60" />
      <span aria-hidden className="pointer-events-none absolute right-2 top-2 z-20 h-3 w-3 border-r border-t border-brand-accent/60" />

      <div className="scanline relative h-48 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-black">
        <div className="absolute inset-0 bg-card-shine opacity-70" aria-hidden />
        {showCover ? (
          <img
            src={coverUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <IconImage className="h-12 w-12 text-slate-700" />
              <span
                className="select-none text-5xl font-black text-white/[0.06]"
                style={{ fontFamily: '"Space Grotesk", sans-serif' }}
              >
                {initial}
              </span>
            </div>
          </div>
        )}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-brand-panel via-brand-panel/60 to-transparent"
        />

        <span
          className="absolute left-3 top-3 z-10 rounded-md border border-brand-accent/30 bg-black/60 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-brand-accent backdrop-blur-sm"
          style={{ fontFamily: '"JetBrains Mono", monospace' }}
        >
          {game.plataforma?.trim() || "No platform"}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex min-h-[3.25rem] items-start justify-between gap-3">
          <h3
            className="line-clamp-2 min-w-0 flex-1 text-base font-bold leading-snug tracking-tight text-white"
            style={{ fontFamily: '"Space Grotesk", "Plus Jakarta Sans", sans-serif' }}
          >
            {game.titulo}
          </h3>
          <span
            className={`inline-flex shrink-0 rounded-md border px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] ${estadoBadgeClass(game.estado)}`}
          >
            {labelEstado(game.estado)}
          </span>
        </div>

        <div className="mt-auto">
          <div className="flex min-h-[2.25rem] items-center border-t border-white/[0.06] pt-3">
            {discussionTo ? (
              <Link
                to={discussionTo}
                className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-accent transition hover:text-white"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                View discussion →
              </Link>
            ) : null}
          </div>

          <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-3 border-t border-white/[0.06] pt-4 text-sm">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span
                aria-hidden
                className="text-[0.7rem] uppercase tracking-wider text-slate-500"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                HRS
              </span>
              <span className="font-semibold tabular-nums text-slate-200">
                {game.horas_jugadas ?? 0}
              </span>
            </span>
            <span className="flex items-center justify-center gap-1.5">
              <span
                aria-hidden
                className="text-[0.7rem] uppercase tracking-wider text-brand-magenta"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                SCR
              </span>
              <span className="font-bold tabular-nums text-brand-magenta">
                {game.puntuacion ?? "—"}
                <span className="text-slate-500">/10</span>
              </span>
            </span>
            {showActions ? (
              <div className="flex shrink-0 items-center justify-end gap-1">
                {onRecommend && (
                  <button
                    type="button"
                    onClick={() => onRecommend(game)}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-brand-accent/10 hover:text-brand-accent"
                    title="Recommend to someone"
                    aria-label={`Recommend ${game.titulo}`}
                  >
                    <IconGift />
                  </button>
                )}
                <Link
                  to={`/edit/${game.id}`}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-brand-accent/10 hover:text-brand-accent"
                  title="Edit"
                >
                  <IconPencil />
                </Link>
                <button
                  type="button"
                  onClick={() => onDelete?.(game.id, game.titulo)}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-brand-magenta/10 hover:text-brand-magenta"
                  title="Delete"
                >
                  <IconTrash />
                </button>
              </div>
            ) : (
              <span aria-hidden className="block w-0" />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
