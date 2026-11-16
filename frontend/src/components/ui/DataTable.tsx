import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/Skeleton";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
  hideOnMobileCard?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  isLoading,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyIcon,
  renderMobileCard,
}: {
  columns: Column<T>[];
  data: T[];
  getRowKey: (row: T) => string | number;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ComponentType<{ className?: string }>;
  /** Optional custom mobile card renderer; falls back to a stacked key/value list. */
  renderMobileCard?: (row: T) => React.ReactNode;
}) {
  if (isLoading) {
    return <SkeletonTable cols={columns.length} />;
  }

  if (data.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      {/* Desktop/tablet: real table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-ink-secondary",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={getRowKey(row)} className="border-b border-border/60 last:border-0">
                {columns.map((col) => (
                  <td key={col.key} className={cn("py-3 pr-4 align-middle", col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-3 sm:hidden">
        {data.map((row) =>
          renderMobileCard ? (
            <div key={getRowKey(row)}>{renderMobileCard(row)}</div>
          ) : (
            <div
              key={getRowKey(row)}
              className="rounded-lg border border-border bg-surface p-4 space-y-2"
            >
              {columns
                .filter((c) => !c.hideOnMobileCard)
                .map((col) => (
                  <div key={col.key} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                      {col.header}
                    </span>
                    <span className="text-right text-ink">{col.render(row)}</span>
                  </div>
                ))}
            </div>
          )
        )}
      </div>
    </>
  );
}
