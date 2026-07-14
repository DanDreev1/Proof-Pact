import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getTodayProofContext } from "@/features/daily-word/server/get-today-proof-context";
import { getCurrentPair } from "@/features/pairs/queries/get-current-pair";
import { getMyProofRequests } from "@/features/proofs/queries/get-my-proof-requests";
import { getPendingReviews } from "@/features/proofs/queries/get-pending-reviews";
import { requireUser } from "@/lib/auth/require-user";

export default async function TodayPage() {
  const user = await requireUser();
  const pair = await getCurrentPair(user.id);
  const timezone = pair?.timezone ?? "Europe/London";
  const proofContext = await getTodayProofContext(timezone);
  const pendingReviews = await getPendingReviews(user.id);
  const myProofs = await getMyProofRequests(user.id);

  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm text-slate-400">Today</p>
        <h1 className="text-2xl font-bold">Proof Pact</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Daily word</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl bg-slate-900 p-4">
            <p className="text-sm text-slate-500">Say this in your video</p>
            <p className="mt-1 text-4xl font-black tracking-wide">
              {proofContext?.ok ? proofContext.dailyWord.word : "..."}
            </p>
          </div>
          <p className="text-sm text-slate-400">
            {proofContext?.ok
              ? `Proof date: ${proofContext.proofDate}`
              : proofContext?.error ?? "Daily word is not ready."}
          </p>
          <Button asChild href="/create" className="w-full">
            Create proof
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="space-y-1">
            <p className="text-sm text-slate-500">Pair</p>
          {pair ? (
            <>
                <p className="font-semibold">{pair.memberCount >= 2 ? "Ready" : "Waiting"}</p>
              {pair.partner ? (
                  <p className="truncate text-sm text-slate-400">{pair.partner.displayName}</p>
              ) : (
                  <p className="text-sm tracking-widest text-slate-400">{pair.inviteCode}</p>
              )}
            </>
          ) : (
            <>
                <p className="font-semibold">Not connected</p>
                <p className="text-sm text-slate-400">Pair needed</p>
            </>
          )}
            <Button asChild href="/pair" className="mt-3 w-full" variant="secondary">
              Open
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-1">
            <p className="text-sm text-slate-500">Season</p>
            <p className="font-semibold capitalize">
              {proofContext?.season ?? "Season"} {proofContext?.seasonYear ?? ""}
            </p>
            <p className="text-sm text-slate-400">{pendingReviews.length} reviews</p>
            <Button asChild href="/calendar" className="mt-3 w-full" variant="secondary">
              Calendar
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingReviews.length > 0 ? (
            pendingReviews.map((request) => (
              <Button
                asChild
                className="w-full justify-between"
                href={`/review/${request.id}`}
                key={request.id}
                variant="secondary"
              >
                <span>{request.title}</span>
                <span className="text-xs text-slate-300">{request.proof_date}</span>
              </Button>
            ))
          ) : (
            <p className="text-sm text-slate-400">No proof requests waiting for you.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your proofs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {myProofs.length > 0 ? (
            myProofs.map((request) => (
              <Button
                asChild
                className="w-full justify-between"
                href={`/proof/${request.id}`}
                key={request.id}
                variant="secondary"
              >
                <span>{request.title}</span>
                <span className="text-xs capitalize text-slate-300">{request.status}</span>
              </Button>
            ))
          ) : (
            <p className="text-sm text-slate-400">No proof requests submitted yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
