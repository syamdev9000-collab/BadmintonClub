"use client";

import { useEffect, useState } from "react";
import { Wallet as WalletIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { WalletCard } from "@/components/ui/WalletCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TransactionItem } from "@/components/ui/TransactionItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { DepositInfo, Transaction } from "@/lib/types";

export default function MemberWalletPage() {
  const { member } = useAuth();
  const [deposit, setDeposit] = useState<DepositInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [amount, setAmount] = useState("500");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { show } = useToast();

  function load() {
    api.get<DepositInfo>("/members/me/deposit").then(setDeposit).catch(() => setDeposit(null));
    api.get<Transaction[]>("/payments/me").then(setTransactions).catch(() => setTransactions([]));
  }

  useEffect(load, []);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!member) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await api.post<{ redirect_url: string | null }>("/payments/deposits", {
        member_id: member.id,
        amount,
        provider: "phonepe",
      });
      if (res.redirect_url) {
        window.location.assign(res.redirect_url);
      } else {
        show("Deposit initiated", "success");
        load();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong initiating the payment");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Wallet" description="Your deposit balance and transaction history." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          {deposit ? <WalletCard deposit={deposit} /> : <SkeletonCard />}

          <Panel title="Top up deposit">
            <form onSubmit={handlePay} className="space-y-4">
              <Input
                label="Amount (Rs.)"
                type="number"
                min={1}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-xs text-ink-secondary">
                You&apos;ll be redirected to PhonePe to complete the payment securely.
              </p>
              {error && <p className="text-sm font-medium text-danger-600">{error}</p>}
              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                Pay with PhonePe
              </Button>
            </form>
          </Panel>
        </div>

        <Panel title="Transaction History" className="lg:col-span-2">
          {!transactions ? (
            <div className="space-y-2">
              <div className="h-14 skeleton rounded-lg" />
              <div className="h-14 skeleton rounded-lg" />
              <div className="h-14 skeleton rounded-lg" />
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState icon={WalletIcon} title="No transactions yet" description="Your deposits and payments will show up here." />
          ) : (
            <div className="divide-y divide-border">
              {transactions.map((t) => (
                <TransactionItem key={t.id} transaction={t} />
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
