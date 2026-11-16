"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Plus, MapPin, Users as UsersIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/format";
import type { Court, Member, PlayingSession } from "@/lib/types";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<PlayingSession[] | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [courtId, setCourtId] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { show } = useToast();

  function loadSessions() {
    api.get<PlayingSession[]>("/sessions").then(setSessions).catch(() => setSessions([]));
  }

  useEffect(() => {
    loadSessions();
    api.get<Court[]>("/courts").then(setCourts).catch(() => setCourts([]));
    api.get<Member[]>("/members").then(setMembers).catch(() => setMembers([]));
  }, []);

  function toggleMember(id: number) {
    setSelectedMemberIds((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  const grouped = useMemo(() => {
    const map = new Map<string, PlayingSession[]>();
    (sessions ?? []).forEach((s) => {
      const list = map.get(s.session_date) ?? [];
      list.push(s);
      map.set(s.session_date, list);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [sessions]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post("/sessions", {
        court_id: Number(courtId),
        session_date: sessionDate,
        start_time: startTime,
        end_time: endTime,
        participant_member_ids: selectedMemberIds,
      });
      setCourtId("");
      setSessionDate("");
      setStartTime("");
      setEndTime("");
      setSelectedMemberIds([]);
      setShowForm(false);
      loadSessions();
      show("Session scheduled", "success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Playing Sessions"
        description="Schedule court bookings and track upcoming sessions."
        action={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "Schedule session"}
          </Button>
        }
      />

      {showForm && (
        <Panel title="Schedule a playing session">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <Select label="Court" required value={courtId} onChange={(e) => setCourtId(e.target.value)}>
                <option value="">Select court</option>
                {courts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Input label="Date" type="date" required value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
              <Input label="Start time" type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <Input label="End time" type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>

            <div>
              <span className="mb-2 block text-sm font-medium text-ink">Participants</span>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <label
                    key={m.id}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      selectedMemberIds.includes(m.id)
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-border-strong text-ink-secondary hover:bg-bg"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedMemberIds.includes(m.id)}
                      onChange={() => toggleMember(m.id)}
                    />
                    {m.name}
                  </label>
                ))}
              </div>
            </div>

            {error && <p className="text-sm font-medium text-danger-600">{error}</p>}
            <Button type="submit" isLoading={isSubmitting}>
              Schedule session
            </Button>
          </form>
        </Panel>
      )}

      <Panel title="Upcoming sessions">
        {!sessions ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No sessions scheduled" description="Schedule one above." />
        ) : (
          <div className="space-y-6">
            {grouped.map(([date, sessionsForDate]) => (
              <div key={date}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">
                  {formatDate(date, { weekday: "long" })}
                </p>
                <div className="space-y-2">
                  {sessionsForDate.map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                          <MapPin className="h-4.5 w-4.5" />
                        </span>
                        <div>
                          <p className="font-medium text-ink">{s.court.name}</p>
                          <p className="text-xs text-ink-secondary">
                            {formatTime(s.start_time)} – {formatTime(s.end_time)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-xs text-ink-secondary">
                          <UsersIcon className="h-3.5 w-3.5" /> {s.participant_member_ids.length} members
                        </span>
                        <StatusBadge tone="brand">Scheduled</StatusBadge>
                      </div>
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
