import { PairSetupCard } from "@/features/pairs/components/PairSetupCard";
import { getCurrentPair } from "@/features/pairs/queries/get-current-pair";
import { requireUser } from "@/lib/auth/require-user";

export default async function PairPage() {
  const user = await requireUser();
  const pair = await getCurrentPair(user.id);

  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm text-slate-400">Pair</p>
        <h1 className="text-2xl font-bold">Partner connection</h1>
      </header>

      <PairSetupCard pair={pair} />
    </div>
  );
}
