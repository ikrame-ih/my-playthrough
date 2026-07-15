// Loading placeholders sized to match real cards (avoids layout jump).

export function GameCardSkeleton() {
  return (
    <div
      className="flex h-full animate-pulse flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-brand-panel shadow-figma ring-1 ring-white/[0.04]"
      aria-hidden="true"
    >
      <div className="h-48 bg-slate-800/80" />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex min-h-[3.25rem] items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-slate-700/80" />
            <div className="h-3 w-1/2 rounded bg-slate-700/50" />
          </div>
          <div className="h-6 w-16 shrink-0 rounded-md bg-slate-700/80" />
        </div>

        <div className="mt-auto">
          <div className="min-h-[2.25rem] border-t border-white/[0.06] pt-3">
            <div className="h-3 w-28 rounded bg-slate-700/50" />
          </div>
          <div className="grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-4">
            <div className="h-4 w-10 rounded bg-slate-700/60" />
            <div className="mx-auto h-4 w-12 rounded bg-slate-700/60" />
            <div className="ml-auto h-4 w-16 rounded bg-slate-700/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

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

export function ProfileHeaderSkeleton() {
  return (
    <div className="animate-pulse mb-10 space-y-3" aria-hidden="true">
      <div className="h-1 w-14 rounded-full bg-slate-700/60" />
      <div className="h-8 w-56 rounded bg-slate-700/80" />
      <div className="h-4 w-80 rounded bg-slate-700/50" />
    </div>
  );
}
