"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, XCircle, IndianRupee, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Input";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import { api } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Member, Transaction } from "@/lib/types";

type StatusFilter = "all" | "success" | "pending" | "failed";

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [memberFilter, setMemberFilter] = useState("all");

  useEffect(() => {
    api.get<Transaction[]>("/payments").then(setTransactions).catch(() => setTransactions([]));
    api.get<Member[]>("/members").then(setMembers).catch(() => setMembers([]));
  }, []);

  const memberById = useMemo(() => {
    const map = new Map<number, Member>();
    members?.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  const filtered = useMemo(() => {
    return (transactions ?? []).filter((t) => {
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      const matchesMember = memberFilter === "all" || t.member_id === Number(memberFilter);
      return matchesStatus && matchesMember;
    });
  }, [transactions, statusFilter, memberFilter]);

  const successTotal =
    transactions?.filter((t) => t.status === "success").reduce((s, t) => s + Number(t.amount), 0) ?? 0;
  const pendingCount = transactions?.filter((t) => t.status === "pending").length ?? 0;
  const failedCount = transactions?.filter((t) => t.status === "failed").length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Every transaction across every member, in one place." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard label="Total Collected" value={formatCurrency(successTotal)} icon={IndianRupee} tone="brand" />
        <DashboardCard label="Successful" value={transactions?.filter((t) => t.status === "success").length ?? 0} icon={CheckCircle2} tone="info" />
        <DashboardCard label="Pending" value={pendingCount} icon={Clock} tone="warning" />
        <DashboardCard label="Failed" value={failedCount} icon={XCircle} tone="danger" />
      </div>

      <Panel padded={false}>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="sm:w-48"
          >
            <option value="all">All statuses</option>
            <option value="success">Successful</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </Select>
          <Select value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)} className="sm:w-56">
            <option value="all">All members</option>
            {members?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="p-4">
          <DataTable
            isLoading={!transactions}
            data={filtered}
            getRowKey={(t) => t.id}
            emptyIcon={CreditCard}
            emptyTitle="No payments found"
            emptyDescription="Try adjusting your filters."
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
              { key: "id", header: "Transaction ID", render: (t) => <span className="text-ink-muted">#{t.id}</span> },
              { key: "amount", header: "Amount", render: (t) => formatCurrency(t.amount) },
              { key: "method", header: "Method", render: (t) => <span className="capitalize">{t.provider.replace("_", " ")}</span> },
              { key: "date", header: "Date", render: (t) => formatDateTime(t.created_at) },
              { key: "status", header: "Status", render: (t) => <StatusBadge tone={statusTone(t.status)}>{t.status}</StatusBadge> },
            ]}
          />
        </div>
      </Panel>
    </div>
  );
}
