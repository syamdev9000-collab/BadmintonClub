import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-16" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 py-3">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </div>
  );
}
