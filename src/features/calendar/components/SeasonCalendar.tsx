"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, Eye, UserRound, XCircle } from "lucide-react";
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

const statusTextClasses = {
  approved: "text-emerald-300",
  rejected: "text-red-300",
  pending: "text-amber-200",
  expired: "text-slate-400",
  draft: "text-slate-500",
};

const statusIcons = {
  approved: CheckCircle2,
  rejected: XCircle,
  pending: Clock3,
  expired: Clock3,
  draft: Clock3,
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
  const initialSelectedDate = dates.includes(today) ? today : records[0]?.proofDate ?? dates[0] ?? today;
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);

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
                  const hasOwnProof = dayRecords.some((record) => record.requesterId === currentUserId);
                  const hasPartnerProof = dayRecords.some((record) => record.requesterId !== currentUserId);

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
                        {hasOwnProof ? <span className="h-1.5 w-1.5 rounded-full bg-sky-300" title="Your proof" /> : null}
                        {hasPartnerProof ? <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-300" title="Partner proof" /> : null}
                        {dayRecords.slice(0, 2).map((record) => (
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
              const isRequester = record.requesterId === currentUserId;
              const videoExpired = new Date(record.videoExpiresAt).getTime() < nowTime;
              const StatusIcon = statusIcons[record.status];
              const ownerLabel = isRequester ? "You sent this" : `${record.requesterName} sent this`;
              const reviewerLabel = isReviewer ? "You review this" : `${record.reviewerName} reviews this`;

              return (
                <div className="space-y-3 rounded-2xl bg-slate-900 p-3 text-sm" key={record.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{record.title}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <UserRound className="h-3.5 w-3.5" />
                        {ownerLabel}
                      </p>
                    </div>
                    <span className={`flex shrink-0 items-center gap-1 capitalize ${statusTextClasses[record.status]}`}>
                      <StatusIcon className="h-4 w-4" />
                      {record.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    {reviewerLabel} - {videoExpired ? "Video expired" : "Video available"}
                  </p>

                  <div className="grid grid-cols-1 gap-2">
                    {isReviewer && record.status === "pending" ? (
                      <Button asChild className="w-full" href={`/review/${record.id}`} variant="primary">
                        Review
                      </Button>
                    ) : null}
                    <Button asChild className="w-full gap-2" href={`/proof/${record.id}`} variant="secondary">
                      <Eye className="h-4 w-4" />
                      Open proof
                    </Button>
                  </div>
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
