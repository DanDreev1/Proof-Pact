export type ProofStatus = "draft" | "pending" | "approved" | "rejected" | "expired";

export type ProofRequest = {
  id: string;
  title: string;
  description: string | null;
  status: ProofStatus;
  proofDate: string;
  videoPath: string | null;
};
