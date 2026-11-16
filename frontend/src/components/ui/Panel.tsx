import { cn } from "@/lib/cn";

export function Panel({
  title,
  description,
  action,
  children,
  className,
  padded = true,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(23,34,29,0.04)]",
        className
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            {title && <h3 className="text-sm font-semibold text-ink">{title}</h3>}
            {description && <p className="mt-0.5 text-xs text-ink-secondary">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}
