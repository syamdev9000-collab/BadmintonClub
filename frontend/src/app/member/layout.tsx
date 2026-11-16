"use client";

import { useRequireRole } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { MEMBER_NAV } from "@/components/layout/nav-config";
import { SkeletonCard } from "@/components/ui/Skeleton";

export default function MemberDashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, member } = useRequireRole("member");

  if (isLoading || !member) {
    return (
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 p-6 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return <AppShell links={MEMBER_NAV}>{children}</AppShell>;
}
