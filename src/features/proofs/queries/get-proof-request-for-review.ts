import { getProofRequestDetails } from "./get-proof-request-details";

export async function getProofRequestForReview(requestId: string, userId: string) {
  const request = await getProofRequestDetails(requestId, userId);

  if (!request || request.reviewer_id !== userId) return null;

  return request;
}
