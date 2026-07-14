import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getTodayProofContext } from "@/features/daily-word/server/get-today-proof-context";
import { getCurrentPair } from "@/features/pairs/queries/get-current-pair";
import { ProofCaptureForm } from "@/features/proofs/components/ProofCaptureForm";
import { requireUser } from "@/lib/auth/require-user";

export default async function CreateProofPage() {
  const user = await requireUser();
  const pair = await getCurrentPair(user.id);
  const proofContext = pair && pair.memberCount >= 2 ? await getTodayProofContext(pair.timezone) : null;

  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm text-slate-400">Create proof</p>
        <h1 className="text-2xl font-bold">Record your proof</h1>
      </header>

      {!pair || pair.memberCount < 2 ? (
        <Card>
          <CardHeader>
            <CardTitle>Partner required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-400">Connect with one partner before creating proof requests.</p>
            <Button asChild href="/pair" className="w-full">
              Open pair setup
            </Button>
          </CardContent>
        </Card>
      ) : !proofContext || !proofContext.ok ? (
        <Card>
          <CardHeader>
            <CardTitle>Daily word unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-400">
              {proofContext?.error ?? "Apply the latest Supabase schema, then reload this page."}
            </p>
            {proofContext?.code ? <p className="text-xs text-slate-500">Supabase code: {proofContext.code}</p> : null}
          </CardContent>
        </Card>
      ) : (
        <ProofCaptureForm dailyWord={proofContext.dailyWord.word} />
      )}
    </div>
  );
}
