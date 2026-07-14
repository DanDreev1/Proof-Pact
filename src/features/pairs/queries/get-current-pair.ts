import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CurrentPair = {
  id: string;
  inviteCode: string | null;
  status: "active" | "archived";
  timezone: string;
  memberCount: number;
  createdAt: string;
  partner: {
    id: string;
    displayName: string;
  } | null;
};

export async function getCurrentPair(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: membership, error: membershipError } = await supabase
    .from("pair_members")
    .select("pair_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (membershipError || !membership?.[0]) {
    return null;
  }

  const pairId = membership[0].pair_id;
  const { data: pair, error: pairError } = await supabase
    .from("accountability_pairs")
    .select("id, invite_code, status, timezone, created_at")
    .eq("id", pairId)
    .eq("status", "active")
    .maybeSingle();

  if (pairError || !pair) {
    return null;
  }

  const { count } = await supabase
    .from("pair_members")
    .select("pair_id", { count: "exact", head: true })
    .eq("pair_id", pair.id);

  const { data: partnerMembership } = await supabase
    .from("pair_members")
    .select("user_id")
    .eq("pair_id", pair.id)
    .neq("user_id", userId)
    .limit(1);

  const partnerId = partnerMembership?.[0]?.user_id ?? null;
  let partner: CurrentPair["partner"] = null;

  if (partnerId) {
    const { data: partnerProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", partnerId)
      .maybeSingle();

    partner = {
      id: partnerId,
      displayName: partnerProfile?.display_name ?? "Partner",
    };
  }

  return {
    id: pair.id,
    inviteCode: pair.invite_code,
    status: pair.status,
    timezone: pair.timezone,
    memberCount: count ?? 1,
    createdAt: pair.created_at,
    partner,
  } satisfies CurrentPair;
}
