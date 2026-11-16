import { Wallet } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import type { DepositInfo } from "@/lib/types";

export function WalletCard({ deposit }: { deposit: DepositInfo }) {
  const isBelowMin = deposit.is_below_minimum;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-6 text-white shadow-md",
        isBelowMin
          ? "bg-gradient-to-br from-amber-500 to-amber-600"
          : "bg-gradient-to-br from-brand-600 to-brand-800"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
          <Wallet className="h-5 w-5" />
        </span>
        {isBelowMin && (
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium">
            Below minimum
          </span>
        )}
      </div>
      <p className="mt-5 text-xs font-medium uppercase tracking-wide text-white/70">
        Deposit balance
      </p>
      <p className="mt-1 text-3xl font-bold tracking-tight">
        {formatCurrency(deposit.deposit_balance)}
      </p>
      <p className="mt-2 text-xs text-white/70">
        Minimum required: {formatCurrency(deposit.minimum_required)}
      </p>
    </div>
  );
}
