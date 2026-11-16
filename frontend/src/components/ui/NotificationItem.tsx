import { Bell, IndianRupee, AlertTriangle, CalendarClock, Info } from "lucide-react";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/format";
import type { ClubNotification, NotificationType } from "@/lib/types";

const META: Record<NotificationType, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  expense_added: { icon: IndianRupee, tone: "bg-info-50 text-info-600" },
  payment_reminder: { icon: Bell, tone: "bg-warning-50 text-warning-600" },
  low_deposit: { icon: AlertTriangle, tone: "bg-danger-50 text-danger-600" },
  schedule_update: { icon: CalendarClock, tone: "bg-brand-50 text-brand-700" },
  general: { icon: Info, tone: "bg-bg text-ink-secondary" },
};

export function NotificationItem({
  notification,
  onClick,
}: {
  notification: ClubNotification;
  onClick?: () => void;
}) {
  const meta = META[notification.type];
  const Icon = meta.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-bg",
        !notification.is_read && "bg-brand-50/40"
      )}
    >
      <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", meta.tone)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm", notification.is_read ? "text-ink-secondary" : "font-medium text-ink")}>
          {notification.message}
        </p>
        <p className="mt-0.5 text-xs text-ink-muted">{timeAgo(notification.created_at)}</p>
      </div>
      {!notification.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
    </button>
  );
}
