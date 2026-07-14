"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/validation/result";

type DeleteProofSuccess = {
  requestId: string;
};

const deleteProofSchema = z.object({
  requestId: z.string().uuid(),
  title: z.string().trim().min(1),
  confirmTitle: z.string().trim().min(1, "Type the proof title to delete it."),
});

export async function deleteProofRequestAction(
  _previousState: ActionResult<DeleteProofSuccess>,
  formData: FormData,
): Promise<ActionResult<DeleteProofSuccess>> {
  const user = await requireUser();
  const parsed = deleteProofSchema.safeParse({
    requestId: formData.get("requestId"),
    title: formData.get("title"),
    confirmTitle: formData.get("confirmTitle"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Confirmation is required.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (parsed.data.title !== parsed.data.confirmTitle) {
    return { ok: false, error: "Proof title does not match." };
  }

  let admin: ReturnType<typeof createSupabaseAdminClient>;

  try {
    admin = createSupabaseAdminClient();
  } catch {
    return { ok: false, error: "Service role key is required to delete proof requests." };
  }

  const { data: request, error: requestError } = await admin
    .from("proof_requests")
    .select("id, requester_id, video_path")
    .eq("id", parsed.data.requestId)
    .maybeSingle();

  if (requestError || !request) {
    return { ok: false, error: requestError?.message ?? "Proof request was not found." };
  }

  if (request.requester_id !== user.id) {
    return { ok: false, error: "Only the requester can delete this proof request." };
  }

  if (request.video_path) {
    const { error: removeError } = await admin.storage.from("proof-videos").remove([request.video_path]);

    if (removeError) {
      return { ok: false, error: removeError.message };
    }
  }

  const { error: deleteError } = await admin
    .from("proof_requests")
    .delete()
    .eq("id", request.id);

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/create");

  redirect("/");
}
