/**
 * Componentes de skeleton loading para la aplicación MyPlaythrough.
 *
 * Un skeleton es una "silueta" inerte del componente real que se muestra
 * mientras los datos cargan desde la API. La animación `animate-pulse` de
 * Tailwind hace que los bloques grises oscilen de opacidad, dando feedback
 * visual sin necesidad de un spinner que distraiga.
 *
 * La estructura de cada skeleton imita exactamente las dimensiones y el
 * layout del componente que reemplaza (GameCard, tarjeta de miembro, etc.)
 * para evitar el salto de layout (CLS) cuando llegan los datos reales.
 */

/**
 * Placeholder de una GameCard completa.
 * Replica: área de portada (h-44) + bloque de título/badge + fila de stats.
 */
export function GameCardSkeleton() {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-2xl border border-white/[0.06] bg-brand-panel shadow-figma ring-1 ring-white/[0.04]"
      aria-hidden="true"
    >
      {/* Zona de portada */}
      <div className="h-44 bg-slate-800/80" />

      {/* Zona de contenido */}
      <div className="space-y-4 p-5">
        {/* Fila título + badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-slate-700/80" />
            <div className="h-3 w-1/2 rounded bg-slate-700/50" />
          </div>
          <div className="h-6 w-16 shrink-0 rounded-md bg-slate-700/80" />
        </div>

        {/* Fila stats (horas / puntuación) */}
        <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
          <div className="h-4 w-10 rounded bg-slate-700/60" />
          <div className="h-4 w-12 rounded bg-slate-700/60" />
        </div>
      </div>
    </div>
  );
}

/**
 * Placeholder de una tarjeta de miembro en la vista Comunidad.
 * Replica: avatar circular + dos líneas de texto (nombre / estadísticas).
 */
export function CommunityMemberSkeleton() {
  return (
    <div
      className="figma-panel animate-pulse flex items-center gap-4 p-4"
      aria-hidden="true"
    >
      {/* Avatar */}
      <div className="h-12 w-12 shrink-0 rounded-full bg-slate-700/80" />

      {/* Texto */}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-2/3 rounded bg-slate-700/80" />
        <div className="h-3 w-1/2 rounded bg-slate-700/50" />
      </div>
    </div>
  );
}

/**
 * Placeholder del encabezado del perfil público (nombre + subtítulo).
 * Se usa en UserPublicProfile mientras llega el nombre real del usuario.
 */
export function ProfileHeaderSkeleton() {
  return (
    <div className="animate-pulse mb-10 space-y-3" aria-hidden="true">
      <div className="h-1 w-14 rounded-full bg-slate-700/60" />
      <div className="h-8 w-56 rounded bg-slate-700/80" />
      <div className="h-4 w-80 rounded bg-slate-700/50" />
    </div>
  );
}
