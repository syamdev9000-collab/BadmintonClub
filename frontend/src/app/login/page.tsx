import Link from "next/link";
import { Trophy, ShieldCheck, Smartphone } from "lucide-react";

export default function LoginChoicePage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md">
            <Trophy className="h-6 w-6" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            Badminton Club Hyderabad
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">Welcome back</h1>
          <p className="mt-1.5 text-sm text-ink-secondary">
            Choose how you&apos;d like to sign in.
          </p>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-surface p-3 shadow-sm">
          <Link
            href="/login/member"
            className="group flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/50"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 group-hover:bg-brand-100">
              <Smartphone className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">I&apos;m a Member</p>
              <p className="text-xs text-ink-secondary">Sign in with mobile number + OTP</p>
            </div>
          </Link>

          <Link
            href="/login/admin"
            className="group flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/50"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-bg text-ink-secondary group-hover:bg-brand-100 group-hover:text-brand-700">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">I&apos;m the Admin</p>
              <p className="text-xs text-ink-secondary">Sign in with mobile number + password</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
