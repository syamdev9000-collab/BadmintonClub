import { ArrowDownLeft, ArrowUpRight, Undo2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import type { Transaction } from "@/lib/types";

const TYPE_META: Record<Transaction["type"], { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  deposit: { label: "Deposit", icon: ArrowDownLeft, tone: "bg-success-50 text-success-600" },
  expense_payment: { label: "Expense payment", icon: ArrowUpRight, tone: "bg-info-50 text-info-600" },
  refund: { label: "Refund", icon: Undo2, tone: "bg-warning-50 text-warning-600" },
};

export function TransactionItem({ transaction }: { transaction: Transaction }) {
  const meta = TYPE_META[transaction.type];
  const Icon = meta.icon;

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-3">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-full", meta.tone)}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-ink">{meta.label}</p>
          <p className="text-xs text-ink-secondary">{formatDateTime(transaction.created_at)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-ink">{formatCurrency(transaction.amount)}</p>
        <StatusBadge tone={statusTone(transaction.status)} className="mt-0.5">
          {transaction.status}
        </StatusBadge>
      </div>
    </div>
  );
}
