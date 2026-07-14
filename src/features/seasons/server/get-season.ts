import { getDatePartsInTimezone } from "@/lib/date/timezone";
import type { SeasonInfo } from "../types";

export function getCurrentSeason(date: Date, timezone: string): SeasonInfo {
  const { year, month, isoDate } = getDatePartsInTimezone(date, timezone);

  if (month >= 3 && month <= 5) {
    return { season: "spring", seasonYear: year, proofDate: isoDate };
  }

  if (month >= 6 && month <= 8) {
    return { season: "summer", seasonYear: year, proofDate: isoDate };
  }

  if (month >= 9 && month <= 11) {
    return { season: "autumn", seasonYear: year, proofDate: isoDate };
  }

  // December starts winter for the current year.
  // January and February belong to the winter that started in the previous year.
  return {
    season: "winter",
    seasonYear: month === 12 ? year : year - 1,
    proofDate: isoDate,
  };
}
