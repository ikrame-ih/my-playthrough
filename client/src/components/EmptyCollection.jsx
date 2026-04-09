import { Link } from "react-router-dom";

/**
 * Estado vacío de la colección: copy con voz propia + ilustración ligera (SVG).
 */
export default function EmptyCollection() {
  return (
    <div className="figma-panel relative overflow-hidden px-6 py-14 text-center sm:px-10 sm:py-16">
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-48 w-48 rounded-full bg-brand-accent/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-md flex-col items-center">
        <svg
          className="mb-10 h-36 w-full max-w-[220px] text-brand-accent/90"
          viewBox="0 0 200 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <rect
            x="20"
            y="68"
            width="160"
            height="8"
            rx="2"
            fill="currentColor"
            opacity="0.35"
          />
          <rect
            x="28"
            y="40"
            width="36"
            height="44"
            rx="4"
            stroke="currentColor"
            strokeWidth="2"
            fill="currentColor"
            fillOpacity="0.08"
          />
          <rect
            x="82"
            y="32"
            width="36"
            height="52"
            rx="4"
            stroke="currentColor"
            strokeWidth="2"
            fill="currentColor"
            fillOpacity="0.12"
          />
          <rect
            x="136"
            y="48"
            width="36"
            height="36"
            rx="4"
            stroke="currentColor"
            strokeWidth="2"
            fill="currentColor"
            fillOpacity="0.06"
          />
          <path
            d="M98 18c0-2 2-4 4-4h8c2 0 4 2 4 4v2c0 2-2 4-4 4h-8c-2 0-4-2-4-4v-2z"
            fill="currentColor"
            opacity="0.5"
          />
          <circle cx="46" cy="58" r="3" fill="currentColor" opacity="0.6" />
          <circle cx="100" cy="52" r="3" fill="currentColor" opacity="0.6" />
          <circle cx="154" cy="62" r="3" fill="currentColor" opacity="0.6" />
        </svg>
        <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          Tu estantería está esperando el primer juego
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Añade un título a mano o búscala en Steam y RAWG para traer la
          carátula. Sin cuentas de terceros: tu colección, tu ritmo.
        </p>
        <Link
          to="/game/new"
          className="figma-btn-primary mt-6 px-8 py-3"
        >
          + Añadir mi primer juego
        </Link>
      </div>
    </div>
  );
}
