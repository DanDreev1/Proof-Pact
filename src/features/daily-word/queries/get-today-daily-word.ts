import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DailyWordResult =
  | {
      ok: true;
      data: {
        id: string;
        proof_date: string;
        word: string;
      };
    }
  | {
      ok: false;
      error: string;
      code?: string;
    };

export async function getTodayDailyWord(proofDate: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_or_create_daily_word", {
    target_proof_date: proofDate,
  });

  if (error) {
    return {
      ok: false,
      error: error.message,
      code: error.code,
    } satisfies DailyWordResult;
  }

  if (!data?.[0]) {
    return {
      ok: false,
      error: "Daily word function returned no rows.",
    } satisfies DailyWordResult;
  }

  return {
    ok: true,
    data: data[0],
  } satisfies DailyWordResult;
}
