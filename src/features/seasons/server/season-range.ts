import type { Season } from "../types";

export type SeasonRange = {
  season: Season;
  seasonYear: number;
  startDate: string;
  endDate: string;
};

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function getSeasonRange(season: Season, seasonYear: number): SeasonRange {
  if (season === "spring") {
    return { season, seasonYear, startDate: toIsoDate(seasonYear, 3, 1), endDate: toIsoDate(seasonYear, 5, 31) };
  }

  if (season === "summer") {
    return { season, seasonYear, startDate: toIsoDate(seasonYear, 6, 1), endDate: toIsoDate(seasonYear, 8, 31) };
  }

  if (season === "autumn") {
    return { season, seasonYear, startDate: toIsoDate(seasonYear, 9, 1), endDate: toIsoDate(seasonYear, 11, 30) };
  }

  return {
    season,
    seasonYear,
    startDate: toIsoDate(seasonYear, 12, 1),
    endDate: toIsoDate(seasonYear + 1, 2, lastDayOfMonth(seasonYear + 1, 2)),
  };
}

export function getPreviousSeason(season: Season, seasonYear: number) {
  if (season === "spring") return getSeasonRange("winter", seasonYear - 1);
  if (season === "summer") return getSeasonRange("spring", seasonYear);
  if (season === "autumn") return getSeasonRange("summer", seasonYear);
  return getSeasonRange("autumn", seasonYear);
}

export function getRetainedSeasonRanges(season: Season, seasonYear: number) {
  const currentSeason = getSeasonRange(season, seasonYear);
  const previousSeason = getPreviousSeason(season, seasonYear);

  return {
    currentSeason,
    previousSeason,
    oldestRetainedDate: previousSeason.startDate,
  };
}

export function listSeasonDates(range: SeasonRange) {
  const dates: string[] = [];
  const cursor = new Date(`${range.startDate}T00:00:00.000Z`);
  const end = new Date(`${range.endDate}T00:00:00.000Z`);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}
