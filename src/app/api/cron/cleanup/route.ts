import { NextResponse } from "next/server";
import { getCurrentSeason } from "@/features/seasons/server/get-season";
import { getRetainedSeasonRanges } from "@/features/seasons/server/season-range";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;

  if (!expected || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const currentSeason = getCurrentSeason(new Date(), "Europe/London");
  const { oldestRetainedDate } = getRetainedSeasonRanges(currentSeason.season, currentSeason.seasonYear);

  const { data: expiredVideoRequests, error: expiredVideoError } = await supabase
    .from("proof_requests")
    .select("id, video_path")
    .not("video_path", "is", null)
    .lt("video_expires_at", nowIso);

  if (expiredVideoError) {
    return NextResponse.json({ ok: false, error: expiredVideoError.message }, { status: 500 });
  }

  const expiredVideoPaths = expiredVideoRequests
    .map((proofRequest) => proofRequest.video_path)
    .filter((videoPath): videoPath is string => Boolean(videoPath));

  let deletedVideoCount = 0;

  if (expiredVideoPaths.length > 0) {
    const { data: removedFiles, error: removeError } = await supabase.storage
      .from("proof-videos")
      .remove(expiredVideoPaths);

    if (removeError) {
      return NextResponse.json({ ok: false, error: removeError.message }, { status: 500 });
    }

    deletedVideoCount = removedFiles?.length ?? 0;
  }

  if (expiredVideoRequests.length > 0) {
    const { error: clearVideoPathError } = await supabase
      .from("proof_requests")
      .update({ video_path: null })
      .in("id", expiredVideoRequests.map((proofRequest) => proofRequest.id));

    if (clearVideoPathError) {
      return NextResponse.json({ ok: false, error: clearVideoPathError.message }, { status: 500 });
    }
  }

  const { count: expiredPendingCount, error: expirePendingError } = await supabase
    .from("proof_requests")
    .update({ status: "expired" }, { count: "exact" })
    .eq("status", "pending")
    .lt("video_expires_at", nowIso);

  if (expirePendingError) {
    return NextResponse.json({ ok: false, error: expirePendingError.message }, { status: 500 });
  }

  const { data: abandonedDrafts, error: abandonedDraftsError } = await supabase
    .from("proof_requests")
    .select("id, video_path")
    .eq("status", "draft")
    .lt("draft_expires_at", nowIso);

  if (abandonedDraftsError) {
    return NextResponse.json({ ok: false, error: abandonedDraftsError.message }, { status: 500 });
  }

  const abandonedDraftVideoPaths = abandonedDrafts
    .map((proofRequest) => proofRequest.video_path)
    .filter((videoPath): videoPath is string => Boolean(videoPath));

  if (abandonedDraftVideoPaths.length > 0) {
    const { error: removeDraftVideosError } = await supabase.storage
      .from("proof-videos")
      .remove(abandonedDraftVideoPaths);

    if (removeDraftVideosError) {
      return NextResponse.json({ ok: false, error: removeDraftVideosError.message }, { status: 500 });
    }
  }

  let deletedDraftCount = 0;

  if (abandonedDrafts.length > 0) {
    const { count, error: deleteDraftsError } = await supabase
      .from("proof_requests")
      .delete({ count: "exact" })
      .in("id", abandonedDrafts.map((proofRequest) => proofRequest.id));

    if (deleteDraftsError) {
      return NextResponse.json({ ok: false, error: deleteDraftsError.message }, { status: 500 });
    }

    deletedDraftCount = count ?? 0;
  }

  const { data: oldProofs, error: oldProofsError } = await supabase
    .from("proof_requests")
    .select("id, video_path")
    .lt("proof_date", oldestRetainedDate);

  if (oldProofsError) {
    return NextResponse.json({ ok: false, error: oldProofsError.message }, { status: 500 });
  }

  const oldProofVideoPaths = oldProofs
    .map((proofRequest) => proofRequest.video_path)
    .filter((videoPath): videoPath is string => Boolean(videoPath));

  if (oldProofVideoPaths.length > 0) {
    const { error: removeOldVideosError } = await supabase.storage
      .from("proof-videos")
      .remove(oldProofVideoPaths);

    if (removeOldVideosError) {
      return NextResponse.json({ ok: false, error: removeOldVideosError.message }, { status: 500 });
    }
  }

  let deletedOldProofCount = 0;

  if (oldProofs.length > 0) {
    const { count, error: deleteOldProofsError } = await supabase
      .from("proof_requests")
      .delete({ count: "exact" })
      .in("id", oldProofs.map((proofRequest) => proofRequest.id));

    if (deleteOldProofsError) {
      return NextResponse.json({ ok: false, error: deleteOldProofsError.message }, { status: 500 });
    }

    deletedOldProofCount = count ?? 0;
  }

  return NextResponse.json({
    ok: true,
    deletedVideoCount,
    expiredPendingCount: expiredPendingCount ?? 0,
    deletedDraftCount: deletedDraftCount ?? 0,
    deletedOldProofCount: deletedOldProofCount ?? 0,
    oldestRetainedDate,
  });
}
