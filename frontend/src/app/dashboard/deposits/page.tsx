"use client";

import { useEffect, useState } from "react";
import { Wallet, IndianRupee, Undo2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { Panel } from "@/components/ui/Panel";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import { useToast } from "@/components/ui/Toast";
import { api, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { Member, Transaction } from "@/lib/types";

export default function DepositsWalletPage() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [mode, setMode] = useState<"deposit" | "refund">("deposit");
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("500");
  const [provider, setProvider] = useState("upi_manual");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { show } = useToast();

  function load() {
    api.get<Member[]>("/members").then(setMembers).catch(() => setMembers([]));
    api.get<Transaction[]>("/payments").then(setTransactions).catch(() => setTransactions([]));
  }

  useEffect(load, []);

  const totalDeposit = members?.reduce((sum, m) => sum + Number(m.deposit_balance), 0) ?? 0;
  const totalDeposited =
    transactions
      ?.filter((t) => t.type === "deposit" && t.status === "success")
      .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;
  const totalRefunds =
    transactions
      ?.filter((t) => t.type === "refund")
      .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;
  const belowMinimum = members?.filter((m) => Number(m.deposit_balance) < 500).length ?? 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === "deposit") {
        const res = await api.post<{ transaction: Transaction }>("/payments/deposits", {
          member_id: Number(memberId),
          amount,
          provider,
        });
        // Manual/cash deposits are recorded as pending, then the admin
        // confirms receipt immediately here (vs. PhonePe, which confirms
        // itself via webhook).
        await api.post(`/payments/deposits/${res.transaction.id}/confirm-manual`);
        show("Deposit recorded and balance updated", "success");
      } else {
        await api.post("/payments/refunds", { member_id: Number(memberId), amount });
        show("Refund issued", "success");
      }
      setAmount("500");
      setMemberId("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deposits & Wallet"
        description="Track member deposit balances and record top-ups or refunds."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard label="Total Deposit Balance" value={formatCurrency(totalDeposit)} icon={Wallet} tone="brand" />
        <DashboardCard label="Total Deposited" value={formatCurrency(totalDeposited)} icon={IndianRupee} tone="info" />
        <DashboardCard label="Total Refunds" value={formatCurrency(totalRefunds)} icon={Undo2} tone="warning" />
        <DashboardCard label="Below Minimum" value={belowMinimum} icon={AlertTriangle} tone="danger" />
      </div>

      <Panel title="Record a deposit or refund">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Select label="Action" value={mode} onChange={(e) => setMode(e.target.value as "deposit" | "refund")}>
            <option value="deposit">Record deposit</option>
            <option value="refund">Issue refund</option>
          </Select>
          <Select label="Member" required value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            <option value="">Select member</option>
            {members?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} · {m.mobile_number}
              </option>
            ))}
          </Select>
          <Input
            label="Amount (Rs.)"
            type="number"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {mode === "deposit" ? (
            <Select label="Method" value={provider} onChange={(e) => setProvider(e.target.value)}>
              <option value="upi_manual">UPI (manual)</option>
              <option value="cash">Cash</option>
            </Select>
          ) : (
            <div />
          )}
          {error && <p className="sm:col-span-4 text-sm font-medium text-danger-600">{error}</p>}
          <div className="sm:col-span-4">
            <Button type="submit" isLoading={isSubmitting}>
              {mode === "deposit" ? "Record deposit" : "Issue refund"}
            </Button>
          </div>
        </form>
      </Panel>

      <Panel title="Member Balances">
        <DataTable
          isLoading={!members}
          data={members ?? []}
          getRowKey={(m) => m.id}
          emptyTitle="No members yet"
          columns={[
            {
              key: "name",
              header: "Member",
              render: (m) => (
                <div className="flex items-center gap-2">
                  <MemberAvatar name={m.name} size="sm" />
                  <span className="font-medium text-ink">{m.name}</span>
                </div>
              ),
            },
            { key: "balance", header: "Balance", render: (m) => formatCurrency(m.deposit_balance) },
            {
              key: "status",
              header: "Status",
              render: (m) =>
                Number(m.deposit_balance) < 500 ? (
                  <StatusBadge tone="danger">Below minimum</StatusBadge>
                ) : (
                  <StatusBadge tone="success">Healthy</StatusBadge>
                ),
            },
          ]}
        />
      </Panel>
    </div>
  );
}
