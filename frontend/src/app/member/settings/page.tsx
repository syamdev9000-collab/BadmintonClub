"use client";

import { Phone, Mail, Calendar, LogOut, User } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";

export default function MemberSettingsPage() {
  const { member, logout } = useAuth();

  if (!member) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your personal information." />

      <Panel title="Profile">
        <div className="flex items-center gap-4">
          <MemberAvatar name={member.name} size="lg" />
          <div>
            <p className="text-base font-semibold text-ink">{member.name}</p>
            <p className="flex items-center gap-1.5 text-sm text-ink-secondary">
              <User className="h-3.5 w-3.5" /> Member
            </p>
          </div>
          <StatusBadge tone={member.is_active ? "success" : "warning"} className="ml-auto">
            {member.is_active ? "Active" : "Pending deposit"}
          </StatusBadge>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-secondary">
              <Phone className="h-3.5 w-3.5" /> Mobile number
            </dt>
            <dd className="mt-1 text-sm font-medium text-ink">{member.mobile_number}</dd>
          </div>
          <div className="rounded-lg border border-border p-4">
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-secondary">
              <Mail className="h-3.5 w-3.5" /> Email
            </dt>
            <dd className="mt-1 text-sm font-medium text-ink">{member.email ?? "Not set"}</dd>
          </div>
          <div className="rounded-lg border border-border p-4">
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-secondary">
              <Calendar className="h-3.5 w-3.5" /> Member since
            </dt>
            <dd className="mt-1 text-sm font-medium text-ink">{formatDate(member.registration_date)}</dd>
          </div>
          <div className="rounded-lg border border-border p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-secondary">Deposit balance</dt>
            <dd className="mt-1 text-sm font-medium text-ink">{formatCurrency(member.deposit_balance)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-ink-muted">
          To update your profile details, please contact an admin.
        </p>
      </Panel>

      <Panel title="Session">
        <p className="text-sm text-ink-secondary">Log out to end your session on this device.</p>
        <Button variant="danger" className="mt-4" icon={<LogOut className="h-4 w-4" />} onClick={logout}>
          Log out
        </Button>
      </Panel>
    </div>
  );
}
