import { Button } from "@/components/ui/Button";
import { SeasonCalendar } from "@/features/calendar/components/SeasonCalendar";
import { getSeasonProofRecords } from "@/features/calendar/queries/get-season-proof-records";
import { getCurrentPair } from "@/features/pairs/queries/get-current-pair";
import { getCurrentSeason } from "@/features/seasons/server/get-season";
import { getPreviousSeason, getSeasonRange, listSeasonDates } from "@/features/seasons/server/season-range";
import { requireUser } from "@/lib/auth/require-user";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await requireUser();
  const pair = await getCurrentPair(user.id);
  const currentSeason = getCurrentSeason(new Date(), pair?.timezone ?? "Europe/London");
  const currentRange = getSeasonRange(currentSeason.season, currentSeason.seasonYear);
  const previousRange = getPreviousSeason(currentSeason.season, currentSeason.seasonYear);
  const { view } = await searchParams;
  const selectedRange = view === "previous" ? previousRange : currentRange;
  const records = await getSeasonProofRecords(user.id, selectedRange.season, selectedRange.seasonYear);

  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm text-slate-400">Calendar</p>
        <h1 className="text-2xl font-bold capitalize">{selectedRange.season} {selectedRange.seasonYear}</h1>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild href="/calendar" variant={view === "previous" ? "secondary" : "primary"}>
          Current
        </Button>
        <Button asChild href="/calendar?view=previous" variant={view === "previous" ? "primary" : "secondary"}>
          Previous
        </Button>
      </div>

      <SeasonCalendar
        currentUserId={user.id}
        dates={listSeasonDates(selectedRange)}
        nowIso={new Date().toISOString()}
        records={records}
      />
    </div>
  );
}
