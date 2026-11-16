"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import type { NavItem } from "@/components/layout/nav-config";

export function Sidebar({ links }: { links: NavItem[] }) {
  const pathname = usePathname();
  const { member, logout } = useAuth();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Trophy className="h-4.5 w-4.5" />
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight text-ink">Badminton Club</p>
          <p className="text-xs text-ink-secondary">Hyderabad</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-ink-secondary hover:bg-bg hover:text-ink"
              )}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <MemberAvatar name={member?.name ?? "?"} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{member?.name}</p>
            <p className="truncate text-xs capitalize text-ink-secondary">{member?.role}</p>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-danger-50 hover:text-danger-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
