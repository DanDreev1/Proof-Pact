"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentPair } from "../queries/get-current-pair";
import type { ActionResult } from "@/lib/validation/result";

type LeavePairSuccess = {
  pairId: string;
};

const leavePairSchema = z.object({
  partnerName: z.string().trim().min(1, "Enter your partner display name."),
});

export async function leavePairAction(
  _previousState: ActionResult<LeavePairSuccess>,
  formData: FormData,
): Promise<ActionResult<LeavePairSuccess>> {
  const user = await requireUser();
  const pair = await getCurrentPair(user.id);

  if (!pair) {
    return { ok: false, error: "Active pair was not found." };
  }

  if (!pair.partner) {
    return { ok: false, error: "There is no connected partner yet." };
  }

  const parsed = leavePairSchema.safeParse({
    partnerName: formData.get("partnerName"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Confirmation is required.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (parsed.data.partnerName.toLocaleLowerCase() !== pair.partner.displayName.toLocaleLowerCase()) {
    return { ok: false, error: "Partner display name does not match." };
  }

  let admin: ReturnType<typeof createSupabaseAdminClient>;

  try {
    admin = createSupabaseAdminClient();
  } catch {
    return { ok: false, error: "Service role key is required to delete shared pair data." };
  }
  const { data: proofRequests, error: proofRequestsError } = await admin
    .from("proof_requests")
    .select("video_path")
    .eq("pair_id", pair.id);

  if (proofRequestsError) {
    return { ok: false, error: proofRequestsError.message };
  }

  const videoPaths = proofRequests
    .map((proofRequest) => proofRequest.video_path)
    .filter((videoPath): videoPath is string => Boolean(videoPath));

  if (videoPaths.length > 0) {
    const { error: removeError } = await admin.storage.from("proof-videos").remove(videoPaths);

    if (removeError) {
      return { ok: false, error: removeError.message };
    }
  }

  const { error: deleteError } = await admin
    .from("accountability_pairs")
    .delete()
    .eq("id", pair.id);

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  revalidatePath("/");
  revalidatePath("/pair");
  revalidatePath("/calendar");
  revalidatePath("/create");

  return { ok: true, data: { pairId: pair.id } };
}
