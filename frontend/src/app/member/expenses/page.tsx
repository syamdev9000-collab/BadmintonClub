"use client";

import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import type { Expense, ExpenseShare } from "@/lib/types";

export default function MyExpensesPage() {
  const { member } = useAuth();
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [payingShareId, setPayingShareId] = useState<number | null>(null);
  const { show } = useToast();

  function load() {
    api.get<Expense[]>("/expenses/me").then(setExpenses).catch(() => setExpenses([]));
  }

  useEffect(load, []);

  function myShare(expense: Expense): ExpenseShare | undefined {
    return expense.shares.find((s) => s.member_id === member?.id);
  }

  async function handlePay(share: ExpenseShare) {
    setPayingShareId(share.id);
    try {
      const remaining = (Number(share.amount_due) - Number(share.amount_paid)).toFixed(2);
      const res = await api.post<{ redirect_url: string | null }>("/payments/expenses", {
        expense_share_id: share.id,
        amount: remaining,
        provider: "phonepe",
      });
      if (res.redirect_url) {
        window.location.assign(res.redirect_url);
      } else {
        show("Payment initiated", "success");
        load();
      }
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Something went wrong initiating the payment", "error");
    } finally {
      setPayingShareId(null);
    }
  }

  const rows = (expenses ?? [])
    .map((expense) => ({ expense, share: myShare(expense) }))
    .filter((r): r is { expense: Expense; share: ExpenseShare } => !!r.share);

  const totalOutstanding = rows.reduce(
    (sum, r) => sum + Math.max(Number(r.share.amount_due) - Number(r.share.amount_paid), 0),
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Payments"
        description={
          totalOutstanding > 0
            ? `You have ${formatCurrency(totalOutstanding)} in pending contributions`
            : "You're all caught up on expense contributions"
        }
      />

      <Panel>
        {!expenses ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Receipt} title="No expenses assigned to you yet" />
        ) : (
          <div className="space-y-3">
            {rows.map(({ expense, share }) => (
              <div
                key={expense.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
              >
                <div>
                  <p className="font-medium text-ink">{expense.description}</p>
                  <p className="text-xs text-ink-secondary">
                    Due: {formatCurrency(share.amount_due)} · Paid: {formatCurrency(share.amount_paid)}
                  </p>
                </div>
                {share.status === "paid" ? (
                  <StatusBadge tone={statusTone("paid")}>Paid</StatusBadge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handlePay(share)}
                    isLoading={payingShareId === share.id}
                  >
                    Pay via PhonePe
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
