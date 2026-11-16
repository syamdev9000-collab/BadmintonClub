"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { BottomNav } from "@/components/layout/BottomNav";
import type { NavItem } from "@/components/layout/nav-config";

export function AppShell({ links, children }: { links: NavItem[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const current = links.find((l) => l.href === pathname);
  const title = current?.label ?? "Badminton Club";

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar links={links} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar links={links} title={title} />
        <main className="flex-1 px-4 py-6 pb-20 lg:px-8 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl space-y-6">{children}</div>
        </main>
        <BottomNav links={links} />
      </div>
    </div>
  );
}
