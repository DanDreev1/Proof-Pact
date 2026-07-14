"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import type { CalendarProofRecord } from "../queries/get-season-proof-records";

type SeasonCalendarProps = {
  dates: string[];
  records: CalendarProofRecord[];
  currentUserId: string;
  nowIso: string;
};

const statusClasses = {
  approved: "bg-emerald-400",
  rejected: "bg-red-400",
  pending: "bg-amber-300",
  expired: "bg-slate-500",
  draft: "bg-slate-700",
};

function getMonthLabel(monthKey: string) {
  const date = new Date(`${monthKey}-01T00:00:00.000Z`);
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

function getMondayOffset(date: string) {
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return day === 0 ? 6 : day - 1;
}

export function SeasonCalendar({ dates, records, currentUserId, nowIso }: SeasonCalendarProps) {
  const nowTime = new Date(nowIso).getTime();
  const today = nowIso.slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);

  const recordsByDate = useMemo(() => {
    return records.reduce<Record<string, CalendarProofRecord[]>>((acc, record) => {
      acc[record.proofDate] ??= [];
      acc[record.proofDate].push(record);
      return acc;
    }, {});
  }, [records]);

  const monthGroups = useMemo(() => {
    return dates.reduce<Record<string, string[]>>((acc, date) => {
      const monthKey = date.slice(0, 7);
      acc[monthKey] ??= [];
      acc[monthKey].push(date);
      return acc;
    }, {});
  }, [dates]);

  const selectedRecords = recordsByDate[selectedDate] ?? [];

  return (
    <Card>
      <CardContent className="space-y-5">
        {Object.entries(monthGroups).map(([monthKey, monthDates]) => {
          const offset = getMondayOffset(monthDates[0]);

          return (
            <section className="space-y-2" key={monthKey}>
              <p className="text-sm font-semibold">{getMonthLabel(monthKey)}</p>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-slate-500">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                  <span key={`${day}-${index}`}>{day}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: offset }, (_, index) => (
                  <span aria-hidden="true" key={`${monthKey}-empty-${index}`} />
                ))}
                {monthDates.map((date) => {
                  const dayRecords = recordsByDate[date] ?? [];
                  const day = Number(date.slice(8, 10));
                  const isSelected = selectedDate === date;

                  return (
                    <button
                      className={[
                        "flex aspect-square min-h-11 flex-col items-center justify-center rounded-xl border text-sm transition",
                        isSelected
                          ? "border-white bg-white text-slate-950"
                          : "border-white/10 bg-slate-900 text-slate-200",
                      ].join(" ")}
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      type="button"
                    >
                      <span>{day}</span>
                      <span className="mt-1 flex h-1.5 gap-0.5">
                        {dayRecords.slice(0, 3).map((record) => (
                          <span className={`h-1.5 w-1.5 rounded-full ${statusClasses[record.status]}`} key={record.id} />
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}

        <div className="space-y-3 border-t border-white/10 pt-4">
          <p className="text-sm font-semibold">{selectedDate}</p>
          {selectedRecords.length > 0 ? (
            selectedRecords.map((record) => {
              const isReviewer = record.reviewerId === currentUserId;
              const videoExpired = new Date(record.videoExpiresAt).getTime() < nowTime;

              return (
                <div className="rounded-2xl bg-slate-900 p-3 text-sm" key={record.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{record.title}</p>
                    <span className="capitalize text-slate-400">{record.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {isReviewer ? "You review this" : "Your proof"} - {videoExpired ? "Video expired" : "Video available"}
                  </p>
                  {isReviewer && record.status === "pending" ? (
                    <Button asChild className="mt-3 w-full" href={`/review/${record.id}`} variant="secondary">
                      Review
                    </Button>
                  ) : null}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-400">No proof records for this day.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
