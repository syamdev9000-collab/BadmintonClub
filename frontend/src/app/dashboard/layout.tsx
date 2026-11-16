"use client";

import { useRequireRole } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { ADMIN_NAV } from "@/components/layout/nav-config";
import { SkeletonCard } from "@/components/ui/Skeleton";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, member } = useRequireRole("admin");

  if (isLoading || !member) {
    return (
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return <AppShell links={ADMIN_NAV}>{children}</AppShell>;
}
