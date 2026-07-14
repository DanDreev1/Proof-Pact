"use server";

import { revalidatePath } from "next/cache";
import { getTodayProofContext } from "@/features/daily-word/server/get-today-proof-context";
import { getCurrentPair } from "@/features/pairs/queries/get-current-pair";
import { requireUser } from "@/lib/auth/require-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildProofVideoPath } from "@/lib/storage/proof-videos";
import type { ActionResult } from "@/lib/validation/result";
import { sendPushToUser } from "@/features/notifications/server/send-push";
import { createProofUploadIntentSchema } from "../schemas/create-proof-schema";

type UploadIntentSuccess = {
  requestId: string;
  videoPath: string;
  uploadToken: string;
};

type FinalizeProofSuccess = {
  requestId: string;
};

function getVideoExtension(fileName: string, fileType: string) {
  if (fileType === "video/mp4") return "mp4";
  if (fileType === "video/quicktime") return "mov";
  if (fileType === "video/webm") return "webm";

  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension && /^[a-z0-9]+$/.test(extension) ? extension : "webm";
}

export async function createProofUploadIntent(formData: FormData): Promise<ActionResult<UploadIntentSuccess>> {
  const user = await requireUser();
  const parsed = createProofUploadIntentSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    videoName: formData.get("videoName"),
    videoType: formData.get("videoType"),
    videoSize: formData.get("videoSize"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid proof data.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const pair = await getCurrentPair(user.id);

  if (!pair || pair.memberCount < 2) {
    return { ok: false, error: "Connect with a partner before creating proof requests." };
  }

  const proofContext = await getTodayProofContext(pair.timezone);

  if (!proofContext.ok) {
    return { ok: false, error: proofContext.error };
  }

  const supabase = await createSupabaseServerClient();
  const { data: reviewerRows, error: reviewerError } = await supabase
    .from("pair_members")
    .select("user_id")
    .eq("pair_id", pair.id)
    .neq("user_id", user.id)
    .limit(1);

  if (reviewerError || !reviewerRows?.[0]) {
    return { ok: false, error: reviewerError?.message ?? "Pair reviewer was not found." };
  }

  const now = new Date();
  const draftExpiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  const videoExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: request, error: insertError } = await supabase
    .from("proof_requests")
    .insert({
      pair_id: pair.id,
      requester_id: user.id,
      reviewer_id: reviewerRows[0].user_id,
      daily_word_id: proofContext.dailyWord.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      proof_date: proofContext.proofDate,
      season: proofContext.season,
      season_year: proofContext.seasonYear,
      status: "draft",
      draft_expires_at: draftExpiresAt,
      video_expires_at: videoExpiresAt,
    })
    .select("id")
    .single();

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  const videoPath = buildProofVideoPath(pair.id, request.id, getVideoExtension(parsed.data.videoName, parsed.data.videoType));
  const { data: signedUpload, error: signedUploadError } = await supabase.storage
    .from("proof-videos")
    .createSignedUploadUrl(videoPath);

  if (signedUploadError || !signedUpload) {
    return { ok: false, error: signedUploadError?.message ?? "Could not create upload URL." };
  }

  const { error: updateError } = await supabase
    .from("proof_requests")
    .update({ video_path: videoPath })
    .eq("id", request.id)
    .eq("requester_id", user.id)
    .eq("status", "draft");

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return {
    ok: true,
    data: {
      requestId: request.id,
      videoPath,
      uploadToken: signedUpload.token,
    },
  };
}

export async function finalizeProofRequest(requestId: string): Promise<ActionResult<FinalizeProofSuccess>> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: request, error: requestError } = await supabase
    .from("proof_requests")
    .select("id, requester_id, reviewer_id, title, status, video_path, draft_expires_at")
    .eq("id", requestId)
    .eq("requester_id", user.id)
    .maybeSingle();

  if (requestError || !request) {
    return { ok: false, error: requestError?.message ?? "Proof request was not found." };
  }

  if (request.status !== "draft") {
    return { ok: false, error: "Only draft proof requests can be finalized." };
  }

  if (new Date(request.draft_expires_at).getTime() < Date.now()) {
    return { ok: false, error: "Draft expired. Create a new proof request." };
  }

  if (!request.video_path) {
    return { ok: false, error: "Video upload path is missing." };
  }

  const { data: videoExists, error: videoExistsError } = await supabase.storage
    .from("proof-videos")
    .exists(request.video_path);

  if (videoExistsError || !videoExists) {
    return { ok: false, error: videoExistsError?.message ?? "Video upload was not found." };
  }

  const { error: updateError } = await supabase
    .from("proof_requests")
    .update({
      status: "pending",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", request.id)
    .eq("requester_id", user.id)
    .eq("status", "draft");

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  revalidatePath("/");
  revalidatePath("/create");
  await sendPushToUser(request.reviewer_id, {
    title: "New proof request",
    body: request.title,
    url: `/review/${request.id}`,
  });

  return {
    ok: true,
    data: {
      requestId: request.id,
    },
  };
}
