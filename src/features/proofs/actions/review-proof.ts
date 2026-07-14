"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/validation/result";
import { sendPushToUser } from "@/features/notifications/server/send-push";

const decisionSchema = z.object({
  requestId: z.string().uuid(),
  decisionComment: z.string().trim().max(300).optional(),
});

async function decideProofRequest(
  status: "approved" | "rejected",
  formData: FormData,
): Promise<ActionResult<{ requestId: string }>> {
  const user = await requireUser();
  const parsed = decisionSchema.safeParse({
    requestId: formData.get("requestId"),
    decisionComment: formData.get("decisionComment") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: "Invalid review request." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: request, error: requestError } = await supabase
    .from("proof_requests")
    .select("id, title, requester_id, reviewer_id, status, video_expires_at")
    .eq("id", parsed.data.requestId)
    .eq("reviewer_id", user.id)
    .maybeSingle();

  if (requestError || !request) {
    return { ok: false, error: requestError?.message ?? "Proof request was not found." };
  }

  if (request.requester_id === user.id) {
    return { ok: false, error: "You cannot review your own proof." };
  }

  if (request.status !== "pending") {
    return { ok: false, error: "Only pending proof requests can be reviewed." };
  }

  if (new Date(request.video_expires_at).getTime() < Date.now()) {
    return { ok: false, error: "This proof video has expired." };
  }

  const { error: updateError } = await supabase
    .from("proof_requests")
    .update({
      status,
      decision_comment: parsed.data.decisionComment ?? null,
      decided_at: new Date().toISOString(),
    })
    .eq("id", request.id)
    .eq("reviewer_id", user.id)
    .eq("status", "pending");

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  revalidatePath("/");
  revalidatePath(`/review/${request.id}`);
  revalidatePath(`/proof/${request.id}`);
  await sendPushToUser(request.requester_id, {
    title: status === "approved" ? "Proof approved" : "Proof rejected",
    body: request.title,
    url: `/proof/${request.id}`,
  });

  return { ok: true, data: { requestId: request.id } };
}

export async function approveProofRequest(formData: FormData): Promise<ActionResult<{ requestId: string }>> {
  return decideProofRequest("approved", formData);
}

export async function rejectProofRequest(formData: FormData): Promise<ActionResult<{ requestId: string }>> {
  return decideProofRequest("rejected", formData);
}
