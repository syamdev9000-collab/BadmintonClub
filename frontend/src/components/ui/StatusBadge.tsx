import { cn } from "@/lib/cn";

type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "brand";

const toneClasses: Record<Tone, string> = {
  success: "bg-success-50 text-success-600",
  warning: "bg-warning-50 text-warning-600",
  danger: "bg-danger-50 text-danger-600",
  info: "bg-info-50 text-info-600",
  neutral: "bg-bg text-ink-secondary",
  brand: "bg-brand-50 text-brand-700",
};

export function StatusBadge({
  children,
  tone = "neutral",
  dot = true,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize",
        toneClasses[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Maps common domain statuses to a sensible tone automatically. */
export function statusTone(status: string): Tone {
  const normalized = status.toLowerCase();
  if (["active", "success", "paid"].includes(normalized)) return "success";
  if (["pending", "partial", "pending deposit"].includes(normalized)) return "warning";
  if (["failed", "inactive", "removed"].includes(normalized)) return "danger";
  return "neutral";
}
