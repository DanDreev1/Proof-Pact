"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { approveProofRequest, rejectProofRequest } from "../actions/review-proof";

type ProofReviewActionsProps = {
  requestId: string;
  disabled: boolean;
};

export function ProofReviewActions({ requestId, disabled }: ProofReviewActionsProps) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState<"approved" | "rejected" | null>(null);

  async function submitDecision(decision: "approved" | "rejected") {
    setError("");
    setSuccess("");
    setPending(decision);

    try {
      const formData = new FormData();
      formData.set("requestId", requestId);
      formData.set("decisionComment", comment);

      const result = decision === "approved"
        ? await approveProofRequest(formData)
        : await rejectProofRequest(formData);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSuccess(decision === "approved" ? "Proof approved." : "Proof rejected.");
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        maxLength={300}
        name="decisionComment"
        onChange={(event) => setComment(event.target.value)}
        placeholder="Optional decision note"
        value={comment}
      />

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

      <div className="grid grid-cols-2 gap-3">
        <Button
          disabled={disabled || pending !== null}
          onClick={() => void submitDecision("rejected")}
          type="button"
          variant="secondary"
        >
          {pending === "rejected" ? "Rejecting..." : "Reject"}
        </Button>
        <Button disabled={disabled || pending !== null} onClick={() => void submitDecision("approved")} type="button">
          {pending === "approved" ? "Approving..." : "Approve"}
        </Button>
      </div>
    </div>
  );
}
