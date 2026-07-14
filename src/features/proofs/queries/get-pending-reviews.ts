import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getPendingReviews(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("proof_requests")
    .select("id, title, proof_date, created_at, requester_id")
    .eq("reviewer_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return [];
  }

  return data;
}
