import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProofStatus } from "@/features/proofs/types";
import type { Season } from "@/features/seasons/types";

export type CalendarProofRecord = {
  id: string;
  title: string;
  status: ProofStatus;
  proofDate: string;
  videoExpiresAt: string;
  requesterId: string;
  requesterName: string;
  reviewerId: string;
  reviewerName: string;
};

export async function getSeasonProofRecords(userId: string, season: Season, seasonYear: number) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("proof_requests")
    .select("id, title, status, proof_date, video_expires_at, requester_id, reviewer_id")
    .eq("season", season)
    .eq("season_year", seasonYear)
    .or(`requester_id.eq.${userId},reviewer_id.eq.${userId}`)
    .neq("status", "draft")
    .order("proof_date", { ascending: true });

  if (error) {
    return [];
  }

  const participantIds = Array.from(
    new Set(data.flatMap((record) => [record.requester_id, record.reviewer_id])),
  );
  const profilesById = new Map<string, string>();

  if (participantIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", participantIds);

    profiles?.forEach((profile) => {
      profilesById.set(profile.id, profile.display_name);
    });
  }

  return data.map((record) => ({
    id: record.id,
    title: record.title,
    status: record.status,
    proofDate: record.proof_date,
    videoExpiresAt: record.video_expires_at,
    requesterId: record.requester_id,
    requesterName: profilesById.get(record.requester_id) ?? "Requester",
    reviewerId: record.reviewer_id,
    reviewerName: profilesById.get(record.reviewer_id) ?? "Reviewer",
  })) satisfies CalendarProofRecord[];
}
