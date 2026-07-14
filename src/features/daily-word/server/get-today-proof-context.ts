import { getTodayDailyWord } from "../queries/get-today-daily-word";
import { getCurrentSeason } from "@/features/seasons/server/get-season";

export async function getTodayProofContext(timezone: string) {
  const season = getCurrentSeason(new Date(), timezone);
  const dailyWordResult = await getTodayDailyWord(season.proofDate);

  if (!dailyWordResult.ok) {
    return {
      ok: false,
      error: dailyWordResult.error,
      code: dailyWordResult.code,
      proofDate: season.proofDate,
      season: season.season,
      seasonYear: season.seasonYear,
    } as const;
  }

  return {
    ok: true,
    dailyWord: dailyWordResult.data,
    proofDate: season.proofDate,
    season: season.season,
    seasonYear: season.seasonYear,
  } as const;
}
