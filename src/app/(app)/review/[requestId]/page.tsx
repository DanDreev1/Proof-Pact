import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProofReviewActions } from "@/features/proofs/components/ProofReviewActions";
import { getProofRequestForReview } from "@/features/proofs/queries/get-proof-request-for-review";
import { requireUser } from "@/lib/auth/require-user";

export default async function ReviewRequestPage({ params }: { params: Promise<{ requestId: string }> }) {
  const user = await requireUser();
  const { requestId } = await params;

  if (!requestId) {
    notFound();
  }

  const request = await getProofRequestForReview(requestId, user.id);

  if (!request) {
    notFound();
  }

  const canReview = request.status === "pending" && !request.videoExpired;

  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm text-slate-400">Review</p>
        <h1 className="text-2xl font-bold">Proof request</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{request.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {request.signedVideoUrl ? (
            <video className="aspect-video w-full rounded-2xl bg-black" controls src={request.signedVideoUrl} />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-white/20 bg-slate-900 px-4 text-center text-sm text-slate-400">
              {request.videoExpired ? "Video expired." : "Video is unavailable."}
            </div>
          )}

          <div className="space-y-1 text-sm text-slate-300">
            <p>Proof date: {request.proof_date}</p>
            <p>Daily word: <span className="font-semibold text-white">{request.dailyWord ?? "Unknown"}</span></p>
            <p>Status: <span className="capitalize">{request.status}</span></p>
          </div>

          {request.description ? <p className="text-sm text-slate-400">{request.description}</p> : null}

          <ProofReviewActions disabled={!canReview} requestId={request.id} />
        </CardContent>
      </Card>
    </div>
  );
}
