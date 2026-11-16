import { cn } from "@/lib/cn";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-bg/60 px-6 py-10 text-center",
        className
      )}
    >
      {Icon && (
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-ink-secondary">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
