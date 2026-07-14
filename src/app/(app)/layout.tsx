import { BottomNav } from "@/components/ui/BottomNav";
import { requireUser } from "@/lib/auth/require-user";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col border-x border-white/10 bg-slate-950/80">
      <div className="flex-1 px-4 pb-24 pt-5">{children}</div>
      <BottomNav />
    </main>
  );
}
