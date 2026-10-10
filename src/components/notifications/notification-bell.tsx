"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  NotificationItem,
  type NotificationView,
} from "@/components/notifications/notification-item";
import { cn } from "@/lib/cn";
import {
  listRecentNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/notifications";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationView[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await listRecentNotificationsAction();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Ignora falhas temporárias
    }
  }, []);

  useEffect(() => {
    const run = () => {
      void loadNotifications();
    };

    const timer = window.setTimeout(run, 0);
    const interval = window.setInterval(() => {
      if (!document.hidden) run();
    }, 30000);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const markAllRead = async () => {
    try {
      const result = await markAllNotificationsReadAction();
      if (!result.success) return;
      setUnreadCount(0);
      setNotifications((current) =>
        current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })),
      );
    } catch {
      // Ignora falhas temporárias de rede
    }
  };

  const markRead = useCallback((id: string) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item,
      ),
    );
    setUnreadCount((count) => Math.max(count - 1, 0));
    void markNotificationReadAction(id).catch(() => undefined);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) void loadNotifications();
        }}
        className="hx-header-action relative"
        aria-label="Notificações"
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="hx-header-action-badge absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-semibold text-white">Notificações</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="hx-accent-link text-xs hover:underline"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">Nenhuma notificação.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {notifications.map((item) => (
                <li key={item.id} className="border-b border-white/5 last:border-b-0">
                  <NotificationItem
                    notification={item}
                    compact
                    onRead={markRead}
                    onNavigate={() => setOpen(false)}
                  />
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-white/10 px-4 py-3">
            <Link
              href="/notificacoes"
              onClick={() => setOpen(false)}
              className={cn(
                "hx-accent-link block text-center text-xs font-semibold transition hover:opacity-90",
              )}
            >
              Ver todas
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
