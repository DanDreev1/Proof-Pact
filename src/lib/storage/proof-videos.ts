export function buildProofVideoPath(pairId: string, proofRequestId: string, extension = "webm") {
  return `${pairId}/${proofRequestId}/proof.${extension}`;
}
