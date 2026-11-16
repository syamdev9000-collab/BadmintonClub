"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserCheck,
  Wallet,
  IndianRupee,
  AlertTriangle,
  Receipt,
  CalendarClock,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { Panel } from "@/components/ui/Panel";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, timeAgo } from "@/lib/format";
import type { Expense, Member, PlayingSession, Transaction } from "@/lib/types";

interface Activity {
  id: string;
  message: string;
  timestamp: string;
}

export default function AdminOverviewPage() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [sessions, setSessions] = useState<PlayingSession[] | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  useEffect(() => {
    api.get<Member[]>("/members").then(setMembers).catch(() => setMembers([]));
    api.get<Expense[]>("/expenses").then(setExpenses).catch(() => setExpenses([]));
    api.get<PlayingSession[]>("/sessions").then(setSessions).catch(() => setSessions([]));
    api.get<Transaction[]>("/payments").then(setTransactions).catch(() => setTransactions([]));
  }, []);

  const isLoading = !members || !expenses || !sessions || !transactions;

  const memberById = useMemo(() => {
    const map = new Map<number, Member>();
    members?.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  const activeMembers = members?.filter((m) => m.is_active).length ?? 0;
  const totalDeposit = members?.reduce((sum, m) => sum + Number(m.deposit_balance), 0) ?? 0;
  const totalCollected =
    transactions
      ?.filter((t) => t.status === "success" && (t.type === "deposit" || t.type === "expense_payment"))
      .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;
  const pendingShares =
    expenses?.reduce(
      (count, expense) => count + expense.shares.filter((s) => s.status !== "paid").length,
      0
    ) ?? 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.total_amount), 0) ?? 0;

  const recentTransactions = transactions?.slice(0, 6) ?? [];

  const pendingContributions = (expenses ?? [])
    .flatMap((expense) =>
      expense.shares
        .filter((s) => s.status !== "paid")
        .map((s) => ({ expense, share: s }))
    )
    .slice(0, 6);

  const upcomingSessions = (sessions ?? []).slice(0, 5);

  const activities: Activity[] = useMemo(() => {
    const items: Activity[] = [];
    members?.forEach((m) =>
      items.push({
        id: `member-${m.id}`,
        message: `${m.name} registered as a new member`,
        timestamp: m.registration_date,
      })
    );
    expenses?.forEach((e) =>
      items.push({
        id: `expense-${e.id}`,
        message: `New expense "${e.description}" added (${formatCurrency(e.total_amount)})`,
        timestamp: e.created_at,
      })
    );
    transactions
      ?.filter((t) => t.status === "success")
      .forEach((t) =>
        items.push({
          id: `txn-${t.id}`,
          message: `${memberById.get(t.member_id)?.name ?? "A member"} ${
            t.type === "deposit" ? "added a deposit" : t.type === "refund" ? "received a refund" : "made a payment"
          } of ${formatCurrency(t.amount)}`,
          timestamp: t.created_at,
        })
      );
    return items.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)).slice(0, 8);
  }, [members, expenses, transactions, memberById]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="A snapshot of your club's members, finances, and schedules."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <DashboardCard label="Total Members" value={members!.length} icon={Users} tone="brand" />
            <DashboardCard
              label="Active Members"
              value={activeMembers}
              icon={UserCheck}
              tone="brand"
              trendLabel={`${members!.length - activeMembers} pending deposit`}
              trend="neutral"
            />
            <DashboardCard
              label="Total Deposit Balance"
              value={formatCurrency(totalDeposit)}
              icon={Wallet}
              tone="info"
            />
            <DashboardCard
              label="Total Collected"
              value={formatCurrency(totalCollected)}
              icon={IndianRupee}
              tone="accent"
            />
            <DashboardCard
              label="Pending Payments"
              value={pendingShares}
              icon={AlertTriangle}
              tone="warning"
            />
            <DashboardCard
              label="Total Expenses"
              value={formatCurrency(totalExpenses)}
              icon={Receipt}
              tone="danger"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Recent Transactions" className="xl:col-span-2">
          <DataTable
            isLoading={isLoading}
            data={recentTransactions}
            getRowKey={(t) => t.id}
            emptyTitle="No transactions yet"
            emptyIcon={IndianRupee}
            columns={[
              {
                key: "member",
                header: "Member",
                render: (t) => (
                  <div className="flex items-center gap-2">
                    <MemberAvatar name={memberById.get(t.member_id)?.name ?? "?"} size="sm" />
                    <span className="font-medium text-ink">
                      {memberById.get(t.member_id)?.name ?? `#${t.member_id}`}
                    </span>
                  </div>
                ),
              },
              {
                key: "type",
                header: "Type",
                render: (t) => <span className="capitalize text-ink-secondary">{t.type.replace("_", " ")}</span>,
              },
              { key: "amount", header: "Amount", render: (t) => formatCurrency(t.amount) },
              {
                key: "method",
                header: "Method",
                render: (t) => <span className="capitalize text-ink-secondary">{t.provider.replace("_", " ")}</span>,
              },
              {
                key: "status",
                header: "Status",
                render: (t) => <StatusBadge tone={statusTone(t.status)}>{t.status}</StatusBadge>,
              },
              {
                key: "date",
                header: "Date",
                render: (t) => <span className="text-ink-secondary">{formatDate(t.created_at)}</span>,
              },
            ]}
          />
        </Panel>

        <Panel title="Recent Activity">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 skeleton rounded-lg" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <EmptyState title="No activity yet" />
          ) : (
            <ul className="space-y-4">
              {activities.map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                  <div>
                    <p className="text-ink">{a.message}</p>
                    <p className="text-xs text-ink-muted">{timeAgo(a.timestamp)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Upcoming Playing Sessions">
          <DataTable
            isLoading={isLoading}
            data={upcomingSessions}
            getRowKey={(s) => s.id}
            emptyTitle="No sessions scheduled"
            emptyIcon={CalendarClock}
            columns={[
              { key: "court", header: "Court", render: (s) => <span className="font-medium text-ink">{s.court.name}</span> },
              { key: "date", header: "Date", render: (s) => formatDate(s.session_date) },
              { key: "time", header: "Time", render: (s) => `${s.start_time}–${s.end_time}` },
              {
                key: "participants",
                header: "Participants",
                render: (s) => `${s.participant_member_ids.length} members`,
              },
            ]}
          />
        </Panel>

        <Panel title="Pending Contributions">
          <DataTable
            isLoading={isLoading}
            data={pendingContributions}
            getRowKey={(row) => `${row.expense.id}-${row.share.id}`}
            emptyTitle="Everyone is paid up"
            emptyDescription="No pending contributions right now."
            emptyIcon={Receipt}
            columns={[
              {
                key: "member",
                header: "Member",
                render: (row) => memberById.get(row.share.member_id)?.name ?? `#${row.share.member_id}`,
              },
              { key: "expense", header: "Expense", render: (row) => row.expense.description },
              {
                key: "amount",
                header: "Outstanding",
                render: (row) =>
                  formatCurrency(Number(row.share.amount_due) - Number(row.share.amount_paid)),
              },
              {
                key: "status",
                header: "Status",
                render: (row) => <StatusBadge tone={statusTone(row.share.status)}>{row.share.status}</StatusBadge>,
              },
            ]}
          />
        </Panel>
      </div>
    </div>
  );
}
