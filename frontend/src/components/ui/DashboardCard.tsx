import { cn } from "@/lib/cn";

type Trend = "up" | "down" | "neutral";

export function DashboardCard({
  label,
  value,
  icon: Icon,
  trendLabel,
  trend = "neutral",
  tone = "brand",
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  trendLabel?: string;
  trend?: Trend;
  tone?: "brand" | "accent" | "warning" | "danger" | "info";
}) {
  const toneClasses: Record<string, string> = {
    brand: "bg-brand-50 text-brand-700",
    accent: "bg-accent-300/40 text-brand-800",
    warning: "bg-warning-50 text-warning-600",
    danger: "bg-danger-50 text-danger-600",
    info: "bg-info-50 text-info-600",
  };

  const trendClasses: Record<Trend, string> = {
    up: "text-success-600",
    down: "text-danger-600",
    neutral: "text-ink-muted",
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(23,34,29,0.04)]">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-secondary">{label}</p>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", toneClasses[tone])}>
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">{value}</p>
      {trendLabel && (
        <p className={cn("mt-1.5 text-xs font-medium", trendClasses[trend])}>{trendLabel}</p>
      )}
    </div>
  );
}
