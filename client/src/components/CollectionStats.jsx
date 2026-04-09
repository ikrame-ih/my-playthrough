/**
 * Resumen numérico rápido de la colección (horas, completados, total).
 */
export default function CollectionStats({ games }) {
  const total = games.length;
  const horas = games.reduce(
    (s, g) => s + (Number.isFinite(Number(g.horas_jugadas)) ? Number(g.horas_jugadas) : 0),
    0,
  );
  const completados = games.filter((g) => g.estado === "Completado").length;

  return (
    <div
      className="mb-6 flex flex-wrap gap-3 sm:gap-4"
      role="region"
      aria-label="Resumen de la colección"
    >
      <div className="figma-panel min-w-[8rem] flex-1 px-4 py-3 sm:px-5">
        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">
          Juegos
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-white">{total}</p>
      </div>
      <div className="figma-panel min-w-[8rem] flex-1 px-4 py-3 sm:px-5">
        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">
          Horas registradas
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-brand-accent">
          {horas}
        </p>
      </div>
      <div className="figma-panel min-w-[8rem] flex-1 px-4 py-3 sm:px-5">
        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">
          Completados
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-white">
          {completados}
        </p>
      </div>
    </div>
  );
}
