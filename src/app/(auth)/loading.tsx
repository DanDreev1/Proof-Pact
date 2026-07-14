export default function AuthLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] items-center px-4">
      <div className="w-full rounded-2xl border border-white/10 bg-slate-950/80 p-5">
        <div className="space-y-4">
          <div className="h-6 w-24 animate-pulse rounded bg-slate-800" />
          <div className="h-12 animate-pulse rounded-2xl bg-slate-800" />
          <div className="h-12 animate-pulse rounded-2xl bg-slate-800" />
          <div className="h-12 animate-pulse rounded-2xl bg-slate-800" />
        </div>
      </div>
    </main>
  );
}
