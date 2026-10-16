"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { markAllNotificationsReadAction } from "@/app/actions/notifications";
import {
  NotificationItem,
  type NotificationView,
} from "@/components/notifications/notification-item";
import { cn } from "@/lib/cn";
import { themeUi } from "@/lib/theme-ui";

type Props = {
  initialNotifications: NotificationView[];
  initialUnreadCount: number;
};

export function NotificationCenter({ initialNotifications, initialUnreadCount }: Props) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [pending, startTransition] = useTransition();

  const visible =
    filter === "unread" ? notifications.filter((item) => !item.readAt) : notifications;

  const markRead = useCallback((id: string) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item,
      ),
    );
    setUnreadCount((count) => Math.max(count - 1, 0));

    void fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
  }, []);

  const markAllRead = () => {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if (!result.success) return;
      setUnreadCount(0);
      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      );
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["all", "unread"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition hx-filter-pill",
                filter === value ? themeUi.filterActive : themeUi.filterInactive,
              )}
            >
              {value === "all" ? "Todas" : `Não lidas (${unreadCount})`}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            disabled={pending}
            onClick={markAllRead}
            className="text-sm font-semibold hx-accent-link hover:underline disabled:opacity-60"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[hsl(var(--sidebar-border))] p-10 text-center">
            <p className="text-sm text-slate-400">
              {filter === "unread"
                ? "Você está em dia — nenhuma notificação pendente."
                : "Nenhuma notificação por aqui ainda."}
            </p>
            <Link href="/configuracoes/notificacoes" className="mt-4 inline-block text-sm hx-accent-link hover:underline">
              Ajustar preferências
            </Link>
          </div>
        ) : (
          visible.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={markRead}
            />
          ))
        )}
      </div>
    </div>
  );
}
