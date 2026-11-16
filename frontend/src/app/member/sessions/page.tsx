"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, MapPin } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/format";
import type { PlayingSession } from "@/lib/types";

export default function MySessionsPage() {
  const [sessions, setSessions] = useState<PlayingSession[] | null>(null);

  useEffect(() => {
    api.get<PlayingSession[]>("/sessions").then(setSessions).catch(() => setSessions([]));
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, PlayingSession[]>();
    (sessions ?? []).forEach((s) => {
      const list = map.get(s.session_date) ?? [];
      list.push(s);
      map.set(s.session_date, list);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [sessions]);

  return (
    <div className="space-y-6">
      <PageHeader title="Playing Schedules" description="Upcoming sessions across all courts." />

      <Panel>
        {!sessions ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No sessions scheduled" description="Check back soon." />
        ) : (
          <div className="space-y-6">
            {grouped.map(([date, sessionsForDate]) => (
              <div key={date}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">
                  {formatDate(date, { weekday: "long" })}
                </p>
                <div className="space-y-2">
                  {sessionsForDate.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                          <MapPin className="h-4.5 w-4.5" />
                        </span>
                        <div>
                          <p className="font-medium text-ink">{s.court.name}</p>
                          <p className="text-xs text-ink-secondary">{s.court.location}</p>
                          <p className="text-xs text-ink-secondary">
                            {formatTime(s.start_time)} – {formatTime(s.end_time)}
                          </p>
                        </div>
                      </div>
                      <StatusBadge tone="brand">Scheduled</StatusBadge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
