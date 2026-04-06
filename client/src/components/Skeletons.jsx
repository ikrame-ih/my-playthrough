/**
 * Componentes "esqueleto" que se muestran mientras los datos están cargando.
 * Tienen exactamente las mismas medidas que los componentes reales para evitar
 * Cumulative Layout Shift (CLS): el layout no salta cuando los datos llegan.
 * Todos llevan `aria-hidden="true"` para que los lectores de pantalla los ignoren;
 * el propio contenedor padre usa `aria-busy="true"` y `aria-label` en su lugar.
 * La animación `animate-pulse` de Tailwind crea el efecto de "respiración".
 */

/**
 * Esqueleto de la tarjeta de juego. Replica la estructura visual de `GameCard`.
 * @component
 */
export function GameCardSkeleton() {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-2xl border border-white/[0.06] bg-brand-panel shadow-figma ring-1 ring-white/[0.04]"
      aria-hidden="true"
    >
      <div className="h-44 bg-slate-800/80" />

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-slate-700/80" />
            <div className="h-3 w-1/2 rounded bg-slate-700/50" />
          </div>
          <div className="h-6 w-16 shrink-0 rounded-md bg-slate-700/80" />
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
          <div className="h-4 w-10 rounded bg-slate-700/60" />
          <div className="h-4 w-12 rounded bg-slate-700/60" />
        </div>
      </div>
    </div>
  );
}

/**
 * Esqueleto de la tarjeta de miembro de comunidad. Replica la estructura de la
 * tarjeta de usuario con avatar circular y dos líneas de texto.
 * @component
 */
export function CommunityMemberSkeleton() {
  return (
    <div
      className="figma-panel animate-pulse flex items-center gap-4 p-4"
      aria-hidden="true"
    >
      <div className="h-12 w-12 shrink-0 rounded-full bg-slate-700/80" />

      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-2/3 rounded bg-slate-700/80" />
        <div className="h-3 w-1/2 rounded bg-slate-700/50" />
      </div>
    </div>
  );
}

/**
 * Esqueleto del encabezado del perfil público de usuario.
 * Replica la línea decorativa, el título y el subtítulo de `UserPublicProfile`.
 * @component
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
