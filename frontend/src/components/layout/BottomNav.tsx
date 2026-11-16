"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { NavItem } from "@/components/layout/nav-config";

export function BottomNav({ links }: { links: NavItem[] }) {
  const pathname = usePathname();
  const items = links.filter((l) => l.showInBottomNav);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface/95 backdrop-blur lg:hidden">
      {items.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
              isActive ? "text-brand-600" : "text-ink-muted"
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
