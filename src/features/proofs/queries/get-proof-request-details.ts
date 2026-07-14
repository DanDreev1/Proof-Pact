import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getProofRequestDetails(requestId: string, userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: request, error } = await supabase
    .from("proof_requests")
    .select(`
      id,
      title,
      description,
      proof_date,
      status,
      requester_id,
      reviewer_id,
      daily_word_id,
      video_path,
      video_expires_at,
      decision_comment,
      decided_at,
      submitted_at
    `)
    .eq("id", requestId)
    .or(`requester_id.eq.${userId},reviewer_id.eq.${userId}`)
    .maybeSingle();

  if (error || !request) {
    return null;
  }

  const { data: dailyWord } = await supabase
    .from("daily_words")
    .select("word")
    .eq("id", request.daily_word_id)
    .maybeSingle();

  const videoExpired = new Date(request.video_expires_at).getTime() < Date.now();
  let signedVideoUrl: string | null = null;

  if (request.video_path && !videoExpired) {
    const { data: signedUrl } = await supabase.storage
      .from("proof-videos")
      .createSignedUrl(request.video_path, 60 * 10);

    signedVideoUrl = signedUrl?.signedUrl ?? null;
  }

  return {
    ...request,
    dailyWord: dailyWord?.word ?? null,
    signedVideoUrl,
    videoExpired,
  };
}
