import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DeleteProofRequestForm } from "@/features/proofs/components/DeleteProofRequestForm";
import { getProofRequestDetails } from "@/features/proofs/queries/get-proof-request-details";
import { requireUser } from "@/lib/auth/require-user";

export default async function ProofRequestPage({ params }: { params: Promise<{ requestId: string }> }) {
  const user = await requireUser();
  const { requestId } = await params;
  const request = await getProofRequestDetails(requestId, user.id);

  if (!request) {
    notFound();
  }

  const role = request.requester_id === user.id ? "Your proof" : "Proof to review";
  const isRequester = request.requester_id === user.id;

  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm text-slate-400">{role}</p>
        <h1 className="text-2xl font-bold">{request.title}</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Status: <span className="capitalize">{request.status}</span></CardTitle>
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
            {request.submitted_at ? <p>Submitted: {new Date(request.submitted_at).toLocaleString()}</p> : null}
            {request.decided_at ? <p>Decided: {new Date(request.decided_at).toLocaleString()}</p> : null}
          </div>

          {request.description ? <p className="text-sm text-slate-400">{request.description}</p> : null}
          {request.decision_comment ? (
            <div className="rounded-2xl bg-slate-900 p-3 text-sm text-slate-300">
              {request.decision_comment}
            </div>
          ) : null}

          {isRequester ? <DeleteProofRequestForm requestId={request.id} title={request.title} /> : null}
        </CardContent>
      </Card>
    </div>
  );
}
