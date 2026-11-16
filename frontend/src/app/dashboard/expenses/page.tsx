"use client";

import { useEffect, useState } from "react";
import { Plus, Receipt } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ExpenseBreakdown } from "@/components/ui/ExpenseBreakdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { api, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { Expense, Member, PlayingSession } from "@/lib/types";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [sessions, setSessions] = useState<PlayingSession[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { show } = useToast();

  function loadExpenses() {
    api.get<Expense[]>("/expenses").then(setExpenses).catch(() => setExpenses([]));
  }

  useEffect(() => {
    loadExpenses();
    api.get<PlayingSession[]>("/sessions").then(setSessions).catch(() => setSessions([]));
    api.get<Member[]>("/members").then(setMembers).catch(() => setMembers([]));
  }, []);

  function toggleMember(id: number) {
    setSelectedMemberIds((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  function memberName(id: number) {
    return members.find((m) => m.id === id)?.name ?? `#${id}`;
  }

  const previewCount = sessionId
    ? sessions.find((s) => s.id === Number(sessionId))?.participant_member_ids.length ?? 0
    : selectedMemberIds.length;
  const previewShare =
    previewCount > 0 && totalAmount ? Number(totalAmount) / previewCount : null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post("/expenses", {
        description,
        total_amount: totalAmount,
        session_id: sessionId ? Number(sessionId) : null,
        member_ids: selectedMemberIds,
      });
      setDescription("");
      setTotalAmount("");
      setSessionId("");
      setSelectedMemberIds([]);
      setShowForm(false);
      loadExpenses();
      show("Expense added and split among members", "success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Court bills and shared expenses, split automatically among participants."
        action={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "Add expense"}
          </Button>
        }
      />

      {showForm && (
        <Panel title="Add an expense / court bill">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Description"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tuesday court bill"
              />
              <Input
                label="Total amount (Rs.)"
                type="number"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
              />
              <Select
                label="Session (optional)"
                hint="Defaults the split to that session's participants"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
              >
                <option value="">None — pick members manually</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.court.name} · {s.session_date}
                  </option>
                ))}
              </Select>
            </div>

            {!sessionId && (
              <div>
                <span className="mb-2 block text-sm font-medium text-ink">Split among members</span>
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => (
                    <label
                      key={m.id}
                      className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        selectedMemberIds.includes(m.id)
                          ? "border-brand-600 bg-brand-50 text-brand-700"
                          : "border-border-strong text-ink-secondary hover:bg-bg"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={selectedMemberIds.includes(m.id)}
                        onChange={() => toggleMember(m.id)}
                      />
                      {m.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {previewShare !== null && (
              <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                {formatCurrency(totalAmount)} split among {previewCount} member(s) ={" "}
                <strong>{formatCurrency(previewShare)}</strong> each
              </p>
            )}

            {error && <p className="text-sm font-medium text-danger-600">{error}</p>}
            <Button type="submit" isLoading={isSubmitting}>
              Add expense & split
            </Button>
          </form>
        </Panel>
      )}

      <Panel title={`All expenses${expenses ? ` (${expenses.length})` : ""}`}>
        {!expenses ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses recorded yet"
            description="Add your first court bill to split it among members."
          />
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <ExpenseBreakdown key={expense.id} expense={expense} memberName={memberName} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
