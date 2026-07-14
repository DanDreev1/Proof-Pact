export function PageLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col border-x border-white/10 bg-slate-950/80">
      <div className="flex-1 space-y-4 px-4 pb-24 pt-5">
        <div className="space-y-2">
          <div className="h-3 w-16 animate-pulse rounded bg-slate-800" />
          <div className="h-7 w-40 animate-pulse rounded bg-slate-800" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <div className="space-y-4">
            <div className="h-5 w-28 animate-pulse rounded bg-slate-800" />
            <div className="h-20 animate-pulse rounded-2xl bg-slate-800" />
            <div className="h-11 animate-pulse rounded-2xl bg-slate-800" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="h-28 animate-pulse rounded-2xl bg-slate-900" />
          <div className="h-28 animate-pulse rounded-2xl bg-slate-900" />
        </div>
      </div>
    </main>
  );
}
