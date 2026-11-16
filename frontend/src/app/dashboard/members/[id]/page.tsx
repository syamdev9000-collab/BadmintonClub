"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Phone, CalendarClock, Receipt, Wallet } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Expense, Member, PlayingSession, Transaction } from "@/lib/types";

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const memberId = Number(id);

  const [member, setMember] = useState<Member | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [sessions, setSessions] = useState<PlayingSession[] | null>(null);

  useEffect(() => {
    api.get<Member>(`/members/${memberId}`).then(setMember).catch(() => setMember(null));
    api.get<Transaction[]>("/payments").then(setTransactions).catch(() => setTransactions([]));
    api.get<Expense[]>("/expenses").then(setExpenses).catch(() => setExpenses([]));
    api.get<PlayingSession[]>("/sessions").then(setSessions).catch(() => setSessions([]));
  }, [memberId]);

  const myTransactions = useMemo(
    () => (transactions ?? []).filter((t) => t.member_id === memberId),
    [transactions, memberId]
  );
  const myShares = useMemo(
    () =>
      (expenses ?? [])
        .flatMap((expense) =>
          expense.shares
            .filter((s) => s.member_id === memberId)
            .map((share) => ({ expense, share }))
        ),
    [expenses, memberId]
  );
  const mySessions = useMemo(
    () => (sessions ?? []).filter((s) => s.participant_member_ids.includes(memberId)),
    [sessions, memberId]
  );

  const outstanding = myShares.reduce(
    (sum, row) => sum + Math.max(Number(row.share.amount_due) - Number(row.share.amount_paid), 0),
    0
  );

  if (!member) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/members"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-secondary hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to members
      </Link>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <MemberAvatar name={member.name} size="lg" />
          <div>
            <h1 className="text-lg font-semibold text-ink">{member.name}</h1>
            <p className="flex items-center gap-1.5 text-sm text-ink-secondary">
              <Phone className="h-3.5 w-3.5" /> {member.mobile_number}
            </p>
            <p className="text-xs text-ink-muted">Registered {formatDate(member.registration_date)}</p>
          </div>
        </div>
        <StatusBadge tone={member.is_active ? "success" : "warning"} className="self-start">
          {member.is_active ? "Active" : "Pending deposit"}
        </StatusBadge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-secondary">
            <Wallet className="h-3.5 w-3.5" /> Deposit balance
          </p>
          <p className="mt-2 text-2xl font-semibold text-ink">{formatCurrency(member.deposit_balance)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-secondary">
            <Receipt className="h-3.5 w-3.5" /> Outstanding
          </p>
          <p className="mt-2 text-2xl font-semibold text-danger-600">{formatCurrency(outstanding)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-secondary">
            <CalendarClock className="h-3.5 w-3.5" /> Sessions played
          </p>
          <p className="mt-2 text-2xl font-semibold text-ink">{mySessions.length}</p>
        </div>
      </div>

      <Panel title="Transaction Timeline">
        <DataTable
          isLoading={!transactions}
          data={myTransactions}
          getRowKey={(t) => t.id}
          emptyTitle="No transactions yet"
          columns={[
            { key: "type", header: "Type", render: (t) => <span className="capitalize">{t.type.replace("_", " ")}</span> },
            { key: "amount", header: "Amount", render: (t) => formatCurrency(t.amount) },
            { key: "method", header: "Method", render: (t) => <span className="capitalize">{t.provider.replace("_", " ")}</span> },
            { key: "status", header: "Status", render: (t) => <StatusBadge tone={statusTone(t.status)}>{t.status}</StatusBadge> },
            { key: "date", header: "Date", render: (t) => formatDate(t.created_at) },
          ]}
        />
      </Panel>

      <Panel title="Expense Contribution History">
        <DataTable
          isLoading={!expenses}
          data={myShares}
          getRowKey={(row) => row.share.id}
          emptyTitle="No expense contributions yet"
          columns={[
            { key: "expense", header: "Expense", render: (row) => row.expense.description },
            { key: "due", header: "Due", render: (row) => formatCurrency(row.share.amount_due) },
            { key: "paid", header: "Paid", render: (row) => formatCurrency(row.share.amount_paid) },
            {
              key: "status",
              header: "Status",
              render: (row) => <StatusBadge tone={statusTone(row.share.status)}>{row.share.status}</StatusBadge>,
            },
          ]}
        />
      </Panel>

      <Panel title="Playing Session History">
        <DataTable
          isLoading={!sessions}
          data={mySessions}
          getRowKey={(s) => s.id}
          emptyTitle="No sessions played yet"
          columns={[
            { key: "court", header: "Court", render: (s) => s.court.name },
            { key: "date", header: "Date", render: (s) => formatDate(s.session_date) },
            { key: "time", header: "Time", render: (s) => `${s.start_time}–${s.end_time}` },
          ]}
        />
      </Panel>
    </div>
  );
}
