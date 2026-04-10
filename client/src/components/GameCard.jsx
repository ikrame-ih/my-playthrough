import { useState } from "react";
import { Link } from "react-router-dom";
import { displayCoverUrl } from "../coverUrl";
import { estadoBadgeClass, labelEstado } from "../gameLabels";
import { IconGift, IconImage, IconPencil, IconTrash } from "./icons";

/**
 * Tarjeta visual de un juego. Muestra la portada (vía proxy), plataforma,
 * título, badge de estado, horas y puntuación. En modo `showActions` añade
 * botones de editar y eliminar para la colección propia del usuario.
 * El `imgError` permite caer a un placeholder con la inicial cuando la imagen
 * no carga correctamente o el proxy devuelve un error.
 *
 * @component
 * @param {object}   props
 * @param {object}   props.game             - Datos del juego.
 * @param {boolean}  [props.showActions]    - Si es `true`, muestra los botones de editar/borrar.
 * @param {Function} [props.onDelete]       - Callback `(id, titulo) => void` para el botón borrar.
 * @param {Function} [props.onRecommend]     - Si existe, muestra botón para abrir el modal de recomendar.
 * @param {string}   [props.discussionTo]   - Ruta de la discusión del juego para el enlace inferior.
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
    <article className="group overflow-hidden rounded-2xl border border-white/[0.06] bg-brand-panel shadow-figma ring-1 ring-white/[0.04] transition hover:-translate-y-0.5 hover:border-brand-accent/20 hover:shadow-figma-lg">
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950">
        <div
          className="absolute inset-0 bg-card-shine opacity-60"
          aria-hidden
        />
        {showCover ? (
          <img
            src={coverUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <IconImage className="h-12 w-12 text-slate-600" />
              <span className="text-4xl font-black text-white/[0.08] select-none">
                {initial}
              </span>
            </div>
          </div>
        )}

        <span className="absolute left-3 top-3 z-10 rounded-md bg-black/55 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-200 backdrop-blur-sm">
          {game.plataforma?.trim() || "Sin plataforma"}
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 min-w-0 flex-1 text-base font-bold leading-snug tracking-tight text-white">
            {game.titulo}
          </h3>
          <span
            className={`inline-flex shrink-0 rounded-md border px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide ${estadoBadgeClass(game.estado)}`}
          >
            {labelEstado(game.estado)}
          </span>
        </div>

        {discussionTo && (
          <div className="border-t border-white/[0.06] pt-3">
            <Link
              to={discussionTo}
              className="text-xs font-semibold text-brand-accent transition hover:text-teal-300"
            >
              Ver discusión →
            </Link>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4 text-sm">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span aria-hidden className="text-base opacity-90">
              ⏱
            </span>
            <span className="font-medium tabular-nums text-slate-300">
              {game.horas_jugadas ?? 0}h
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="text-base text-amber-400/90">
              ★
            </span>
            <span className="font-semibold tabular-nums text-amber-400">
              {game.puntuacion ?? "—"}/10
            </span>
          </span>
          {showActions && (
            <div className="flex shrink-0 items-center gap-1">
              {onRecommend && (
                <button
                  type="button"
                  onClick={() => onRecommend(game)}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-brand-accent"
                  title="Recomendar a alguien"
                  aria-label={`Recomendar ${game.titulo}`}
                >
                  <IconGift />
                </button>
              )}
              <Link
                to={`/edit/${game.id}`}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-brand-accent"
                title="Editar"
              >
                <IconPencil />
              </Link>
              <button
                type="button"
                onClick={() => onDelete?.(game.id, game.titulo)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                title="Eliminar"
              >
                <IconTrash />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
