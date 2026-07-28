export function PageLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col border-x border-white/10 bg-slate-950/80">
      <div className="flex-1 space-y-5 px-4 pb-24 pt-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-20 animate-soft-pulse rounded bg-slate-800" />
            <div className="h-8 w-44 animate-soft-pulse rounded bg-slate-800" />
          </div>
          <div className="relative flex h-12 w-12 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-sky-300/20" />
            <div className="absolute inset-1 animate-loading-ring rounded-full border-2 border-transparent border-t-sky-300 border-r-emerald-300" />
            <div className="h-3 w-3 animate-soft-pulse rounded-full bg-amber-200" />
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
          <div className="space-y-5 p-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">Loading</p>
              <h1 className="text-2xl font-black text-white">Preparing proof</h1>
              <p className="text-sm text-slate-400">Syncing your latest pact state.</p>
            </div>

            <div className="relative h-24 overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
              <div className="absolute left-4 top-4 h-12 w-12 animate-proof-float rounded-xl border border-sky-300/30 bg-sky-300/10" />
              <div className="absolute left-20 top-8 h-8 w-28 animate-soft-pulse rounded bg-slate-800" />
              <div className="absolute bottom-4 left-20 h-3 w-40 animate-soft-pulse rounded bg-slate-800" />
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-sky-300 via-emerald-300 to-amber-200" />
              <div className="absolute inset-0 animate-loading-shine bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            <div className="space-y-3">
              <div className="h-11 animate-soft-pulse rounded-2xl bg-slate-800" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-16 animate-soft-pulse rounded-xl bg-slate-800/80" />
                <div className="h-16 animate-soft-pulse rounded-xl bg-slate-800/70 [animation-delay:120ms]" />
                <div className="h-16 animate-soft-pulse rounded-xl bg-slate-800/60 [animation-delay:240ms]" />
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-3">
          <div className="h-4 w-28 animate-soft-pulse rounded bg-slate-800" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 21 }, (_, index) => (
              <div
                className="aspect-square animate-soft-pulse rounded-lg bg-slate-900"
                key={index}
                style={{ animationDelay: `${(index % 7) * 55}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
