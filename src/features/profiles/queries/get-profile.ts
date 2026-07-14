import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getProfile(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}
