"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { NotificationItem } from "@/components/ui/NotificationItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import type { ClubNotification } from "@/lib/types";

export default function MemberNotificationsPage() {
  const [notifications, setNotifications] = useState<ClubNotification[] | null>(null);

  function load() {
    api.get<ClubNotification[]>("/notifications").then(setNotifications).catch(() => setNotifications([]));
  }

  useEffect(load, []);

  async function markRead(id: number) {
    await api.post(`/notifications/${id}/read`);
    load();
  }

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
      />

      <Panel padded={false}>
        {!notifications ? (
          <div className="p-5">
            <SkeletonTable rows={4} cols={1} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={Bell} title="No notifications yet" />
          </div>
        ) : (
          <div className="divide-y divide-border p-2">
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onClick={() => !n.is_read && markRead(n.id)} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
