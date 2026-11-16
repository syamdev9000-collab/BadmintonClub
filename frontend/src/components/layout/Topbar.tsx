"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Trophy, LogOut } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import type { NavItem } from "@/components/layout/nav-config";

export function Topbar({ links, title }: { links: NavItem[]; title: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const { member, logout } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur lg:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-secondary hover:bg-bg lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-600 lg:hidden">
              Badminton Club
            </p>
            <h1 className="text-base font-semibold text-ink lg:text-lg">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MemberAvatar name={member?.name ?? "?"} size="sm" className="lg:hidden" />
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface shadow-xl">
            <div className="flex items-center justify-between px-5 py-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
                  <Trophy className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-sm font-semibold leading-tight text-ink">Badminton Club</p>
                  <p className="text-xs text-ink-secondary">Hyderabad</p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-bg"
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
              {links.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setDrawerOpen(false)}
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
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-danger-50 hover:text-danger-600"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
