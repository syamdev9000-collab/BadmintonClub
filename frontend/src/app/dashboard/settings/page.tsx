"use client";

import { Phone, Mail, Calendar, LogOut, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export default function AdminSettingsPage() {
  const { member, logout } = useAuth();

  if (!member) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your admin account details." />

      <Panel title="Profile">
        <div className="flex items-center gap-4">
          <MemberAvatar name={member.name} size="lg" />
          <div>
            <p className="text-base font-semibold text-ink">{member.name}</p>
            <p className="flex items-center gap-1.5 text-sm text-ink-secondary">
              <ShieldCheck className="h-3.5 w-3.5" /> Administrator
            </p>
          </div>
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
              <Calendar className="h-3.5 w-3.5" /> Registered
            </dt>
            <dd className="mt-1 text-sm font-medium text-ink">{formatDate(member.registration_date)}</dd>
          </div>
        </dl>
      </Panel>

      <Panel title="Session">
        <p className="text-sm text-ink-secondary">
          Signed in as an administrator. Log out to end your session on this device.
        </p>
        <Button variant="danger" className="mt-4" icon={<LogOut className="h-4 w-4" />} onClick={logout}>
          Log out
        </Button>
      </Panel>
    </div>
  );
}
