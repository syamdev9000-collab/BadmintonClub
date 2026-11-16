"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Users, Search, Plus, Trash2, Eye } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { api, ApiError } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Member } from "@/lib/types";

type StatusFilter = "all" | "active" | "pending";

export default function MembersPage() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showAddForm, setShowAddForm] = useState(false);

  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const { show } = useToast();

  function loadMembers() {
    api
      .get<Member[]>("/members")
      .then(setMembers)
      .catch(() => setMembers([]));
  }

  useEffect(loadMembers, []);

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    return members.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) || m.mobile_number.includes(search);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && m.is_active) ||
        (statusFilter === "pending" && !m.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [members, search, statusFilter]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await api.post("/members", { name, mobile_number: mobileNumber, email: email || null });
      setName("");
      setMobileNumber("");
      setEmail("");
      setShowAddForm(false);
      loadMembers();
      show(`${name} has been registered`, "success");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setIsRemoving(true);
    try {
      await api.delete(`/members/${removeTarget.id}`);
      show(`${removeTarget.name} was removed`, "success");
      setRemoveTarget(null);
      loadMembers();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Could not remove member", "error");
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description={`${members?.length ?? 0} registered · manage profiles, deposits & status`}
        action={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowAddForm((v) => !v)}>
            {showAddForm ? "Cancel" : "Add member"}
          </Button>
        }
      />

      {showAddForm && (
        <Panel title="Register a new member">
          <form onSubmit={handleRegister} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              label="Mobile number"
              required
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
            />
            <Input
              label="Email (optional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {formError && <p className="sm:col-span-3 text-sm font-medium text-danger-600">{formError}</p>}
            <div className="sm:col-span-3">
              <Button type="submit" isLoading={isSubmitting}>
                Register member
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel padded={false}>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or mobile..."
              className="w-full rounded-lg border border-border-strong bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="sm:w-48"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending deposit</option>
          </Select>
        </div>

        <div className="p-4">
          <DataTable
            isLoading={!members}
            data={filteredMembers}
            getRowKey={(m) => m.id}
            emptyIcon={Users}
            emptyTitle="No members found"
            emptyDescription="Try a different search or filter, or add a new member."
            columns={[
              {
                key: "name",
                header: "Member",
                render: (m) => (
                  <div className="flex items-center gap-3">
                    <MemberAvatar name={m.name} />
                    <div>
                      <p className="font-medium text-ink">{m.name}</p>
                      <p className="text-xs text-ink-secondary">{m.mobile_number}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "registered",
                header: "Registered",
                render: (m) => <span className="text-ink-secondary">{formatDate(m.registration_date)}</span>,
              },
              {
                key: "deposit",
                header: "Deposit",
                render: (m) => formatCurrency(m.deposit_balance),
              },
              {
                key: "status",
                header: "Status",
                render: (m) => (
                  <StatusBadge tone={m.is_active ? "success" : "warning"}>
                    {m.is_active ? "Active" : "Pending deposit"}
                  </StatusBadge>
                ),
              },
              {
                key: "actions",
                header: "",
                className: "text-right",
                render: (m) => (
                  <div className="flex justify-end gap-2">
                    <Link href={`/dashboard/members/${m.id}`}>
                      <Button variant="ghost" size="sm" icon={<Eye className="h-3.5 w-3.5" />}>
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                      className="text-danger-600 hover:bg-danger-50"
                      onClick={() => setRemoveTarget(m)}
                    >
                      Remove
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Panel>

      <ConfirmDialog
        open={!!removeTarget}
        title={`Remove ${removeTarget?.name}?`}
        description="This permanently deletes their membership record. This action cannot be undone."
        confirmLabel="Remove member"
        isLoading={isRemoving}
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
