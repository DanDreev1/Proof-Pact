import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getMyProofRequests(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("proof_requests")
    .select("id, title, proof_date, status, created_at, decided_at")
    .eq("requester_id", userId)
    .neq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return [];
  }

  return data;
}
