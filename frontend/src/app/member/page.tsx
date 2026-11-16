"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bell, CalendarClock, Receipt } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { WalletCard } from "@/components/ui/WalletCard";
import { NotificationItem } from "@/components/ui/NotificationItem";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatTime } from "@/lib/format";
import type { ClubNotification, DepositInfo, Expense, PlayingSession } from "@/lib/types";

export default function MemberHomePage() {
  const { member } = useAuth();
  const [deposit, setDeposit] = useState<DepositInfo | null>(null);
  const [notifications, setNotifications] = useState<ClubNotification[] | null>(null);
  const [sessions, setSessions] = useState<PlayingSession[] | null>(null);
  const [expenses, setExpenses] = useState<Expense[] | null>(null);

  useEffect(() => {
    api.get<DepositInfo>("/members/me/deposit").then(setDeposit).catch(() => setDeposit(null));
    api.get<ClubNotification[]>("/notifications").then(setNotifications).catch(() => setNotifications([]));
    api.get<PlayingSession[]>("/sessions").then(setSessions).catch(() => setSessions([]));
    api.get<Expense[]>("/expenses/me").then(setExpenses).catch(() => setExpenses([]));
  }, []);

  const pendingShares = (expenses ?? [])
    .flatMap((e) => e.shares.filter((s) => s.member_id === member?.id && s.status !== "paid"))
    .length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          Hi {member?.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">Here&apos;s what&apos;s happening in your club.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {deposit ? <WalletCard deposit={deposit} /> : <SkeletonCard />}
        </div>
        <Link
          href="/member/expenses"
          className="flex items-center justify-between rounded-xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-brand-300"
        >
          <div>
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-secondary">
              <Receipt className="h-3.5 w-3.5" /> Pending payments
            </p>
            <p className="mt-2 text-2xl font-semibold text-ink">{pendingShares}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-ink-muted" />
        </Link>
        <Link
          href="/member/sessions"
          className="flex items-center justify-between rounded-xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-brand-300"
        >
          <div>
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-secondary">
              <CalendarClock className="h-3.5 w-3.5" /> Upcoming sessions
            </p>
            <p className="mt-2 text-2xl font-semibold text-ink">{sessions?.length ?? "–"}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-ink-muted" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="Notifications"
          action={
            <Link href="/member/notifications" className="text-xs font-medium text-brand-600 hover:underline">
              View all
            </Link>
          }
        >
          {!notifications ? (
            <div className="space-y-2">
              <div className="h-12 skeleton rounded-lg" />
              <div className="h-12 skeleton rounded-lg" />
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications yet" />
          ) : (
            <div className="space-y-1">
              {notifications.slice(0, 4).map((n) => (
                <NotificationItem key={n.id} notification={n} />
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Upcoming Playing Sessions"
          action={
            <Link href="/member/sessions" className="text-xs font-medium text-brand-600 hover:underline">
              View all
            </Link>
          }
        >
          {!sessions ? (
            <div className="space-y-2">
              <div className="h-12 skeleton rounded-lg" />
              <div className="h-12 skeleton rounded-lg" />
            </div>
          ) : sessions.length === 0 ? (
            <EmptyState icon={CalendarClock} title="No sessions scheduled" />
          ) : (
            <ul className="divide-y divide-border">
              {sessions.slice(0, 4).map((s) => (
                <li key={s.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-ink">{s.court.name}</p>
                    <p className="text-xs text-ink-secondary">
                      {formatDate(s.session_date)} · {formatTime(s.start_time)}
                    </p>
                  </div>
                  <StatusBadge tone="brand">Scheduled</StatusBadge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
