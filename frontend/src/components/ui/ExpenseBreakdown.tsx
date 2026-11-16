import { formatCurrency } from "@/lib/format";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import type { Expense } from "@/lib/types";

export function ExpenseBreakdown({
  expense,
  memberName,
}: {
  expense: Expense;
  memberName: (id: number) => string;
}) {
  const paidCount = expense.shares.filter((s) => s.status === "paid").length;
  const progress = expense.shares.length > 0 ? (paidCount / expense.shares.length) * 100 : 0;

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="font-semibold text-ink">{expense.description}</h4>
          <p className="text-xs text-ink-secondary">
            Split equally among {expense.shares.length} member{expense.shares.length !== 1 && "s"} ·{" "}
            {formatCurrency(Number(expense.total_amount) / Math.max(expense.shares.length, 1))} each
          </p>
        </div>
        <p className="text-base font-semibold text-ink">{formatCurrency(expense.total_amount)}</p>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-bg">
        <div
          className="h-full rounded-full bg-brand-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-ink-muted">
        {paidCount} of {expense.shares.length} paid
      </p>

      <table className="mt-3 w-full text-xs">
        <thead>
          <tr className="text-left text-ink-muted">
            <th className="py-1 font-medium">Member</th>
            <th className="py-1 font-medium">Due</th>
            <th className="py-1 font-medium">Paid</th>
            <th className="py-1 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {expense.shares.map((share) => (
            <tr key={share.id} className="border-t border-border/60">
              <td className="py-1.5 text-ink">{memberName(share.member_id)}</td>
              <td className="py-1.5 text-ink-secondary">{formatCurrency(share.amount_due)}</td>
              <td className="py-1.5 text-ink-secondary">{formatCurrency(share.amount_paid)}</td>
              <td className="py-1.5">
                <StatusBadge tone={statusTone(share.status)}>{share.status}</StatusBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
