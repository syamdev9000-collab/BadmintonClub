"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Input";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Expense, Member, PlayingSession, Transaction } from "@/lib/types";

type Granularity = "daily" | "weekly" | "monthly";

function periodKey(dateStr: string, granularity: Granularity): string {
  const date = new Date(dateStr);
  if (granularity === "daily") return date.toISOString().slice(0, 10);
  if (granularity === "monthly") return date.toISOString().slice(0, 7);
  // weekly: ISO week start (Monday)
  const day = date.getDay() || 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - day + 1);
  return monday.toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [sessions, setSessions] = useState<PlayingSession[] | null>(null);
  const [granularity, setGranularity] = useState<Granularity>("weekly");

  useEffect(() => {
    api.get<Expense[]>("/expenses").then(setExpenses).catch(() => setExpenses([]));
    api.get<Transaction[]>("/payments").then(setTransactions).catch(() => setTransactions([]));
    api.get<Member[]>("/members").then(setMembers).catch(() => setMembers([]));
    api.get<PlayingSession[]>("/sessions").then(setSessions).catch(() => setSessions([]));
  }, []);

  const memberById = useMemo(() => {
    const map = new Map<number, Member>();
    members?.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  const sessionById = useMemo(() => {
    const map = new Map<number, PlayingSession>();
    sessions?.forEach((s) => map.set(s.id, s));
    return map;
  }, [sessions]);

  // Expense report: grouped by period
  const expenseChartData = useMemo(() => {
    const totals = new Map<string, number>();
    (expenses ?? []).forEach((e) => {
      const key = periodKey(e.created_at, granularity);
      totals.set(key, (totals.get(key) ?? 0) + Number(e.total_amount));
    });
    return Array.from(totals.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, amount]) => ({ period: formatDate(period), amount }));
  }, [expenses, granularity]);

  // Member contribution report: paid vs due per member
  const contributionRows = useMemo(() => {
    const totals = new Map<number, { due: number; paid: number }>();
    (expenses ?? []).forEach((e) =>
      e.shares.forEach((s) => {
        const entry = totals.get(s.member_id) ?? { due: 0, paid: 0 };
        entry.due += Number(s.amount_due);
        entry.paid += Number(s.amount_paid);
        totals.set(s.member_id, entry);
      })
    );
    return Array.from(totals.entries()).map(([memberId, v]) => ({
      memberId,
      name: memberById.get(memberId)?.name ?? `#${memberId}`,
      due: v.due,
      paid: v.paid,
      outstanding: v.due - v.paid,
    }));
  }, [expenses, memberById]);

  const contributionChartData = contributionRows.map((r) => ({ name: r.name, Paid: r.paid, Outstanding: r.outstanding }));

  // Deposit report
  const depositRows = (members ?? []).map((m) => ({
    memberId: m.id,
    name: m.name,
    balance: Number(m.deposit_balance),
    status: Number(m.deposit_balance) < 500 ? "below minimum" : "healthy",
  }));

  // Outstanding payments report
  const outstandingRows = contributionRows.filter((r) => r.outstanding > 0);

  // Court expense report
  const courtExpenseRows = useMemo(() => {
    const totals = new Map<string, number>();
    (expenses ?? []).forEach((e) => {
      const courtName = e.session_id ? sessionById.get(e.session_id)?.court.name ?? "Unassigned" : "Unassigned";
      totals.set(courtName, (totals.get(courtName) ?? 0) + Number(e.total_amount));
    });
    return Array.from(totals.entries()).map(([court, amount]) => ({ court, amount }));
  }, [expenses, sessionById]);

  const isLoading = !expenses || !transactions || !members || !sessions;

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" description="Financial trends and club performance at a glance." />

      <Panel
        title="Expense Report"
        action={
          <Select value={granularity} onChange={(e) => setGranularity(e.target.value as Granularity)} className="w-36">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </Select>
        }
      >
        {isLoading ? (
          <div className="h-64 skeleton rounded-lg" />
        ) : expenseChartData.length === 0 ? (
          <EmptyState icon={BarChart3} title="No expense data yet" />
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="period" tick={{ fontSize: 12, fill: "var(--color-ink-secondary)" }} />
                <YAxis tick={{ fontSize: 12, fill: "var(--color-ink-secondary)" }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="amount" fill="var(--color-brand-600)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <Panel title="Member Contribution Report">
        {isLoading ? (
          <div className="h-64 skeleton rounded-lg" />
        ) : contributionChartData.length === 0 ? (
          <EmptyState icon={BarChart3} title="No contribution data yet" />
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contributionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--color-ink-secondary)" }} />
                <YAxis tick={{ fontSize: 12, fill: "var(--color-ink-secondary)" }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="Paid" stackId="a" fill="var(--color-brand-600)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Outstanding" stackId="a" fill="var(--color-warning-600)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Deposit Report">
          <DataTable
            isLoading={isLoading}
            data={depositRows}
            getRowKey={(r) => r.memberId}
            emptyTitle="No members yet"
            columns={[
              { key: "name", header: "Member", render: (r) => r.name },
              { key: "balance", header: "Balance", render: (r) => formatCurrency(r.balance) },
              {
                key: "status",
                header: "Status",
                render: (r) => <StatusBadge tone={statusTone(r.status === "healthy" ? "active" : "pending")}>{r.status}</StatusBadge>,
              },
            ]}
          />
        </Panel>

        <Panel title="Outstanding Payment Report">
          <DataTable
            isLoading={isLoading}
            data={outstandingRows}
            getRowKey={(r) => r.memberId}
            emptyTitle="No outstanding payments"
            columns={[
              { key: "name", header: "Member", render: (r) => r.name },
              { key: "outstanding", header: "Outstanding", render: (r) => formatCurrency(r.outstanding) },
            ]}
          />
        </Panel>
      </div>

      <Panel title="Court Expense Report">
        <DataTable
          isLoading={isLoading}
          data={courtExpenseRows}
          getRowKey={(r) => r.court}
          emptyTitle="No court expenses yet"
          columns={[
            { key: "court", header: "Court", render: (r) => r.court },
            { key: "amount", header: "Total Expense", render: (r) => formatCurrency(r.amount) },
          ]}
        />
      </Panel>
    </div>
  );
}
