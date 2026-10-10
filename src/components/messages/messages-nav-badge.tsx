"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { usePollFeedback } from "@/hooks/use-poll-feedback";
import { getUnreadMessageCountAction } from "@/app/actions/messages";

export function MessagesNavBadge() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { onSuccess, onFailure } = usePollFeedback("contagem de mensagens");

  const load = useCallback(async () => {
    try {
      const data = await getUnreadMessageCountAction();
      setUnreadCount(data.unreadCount ?? 0);
      onSuccess();
    } catch {
      onFailure();
    }
  }, [onSuccess, onFailure]);

  useEffect(() => {
    const run = () => void load();
    const timer = window.setTimeout(run, 0);
    const interval = window.setInterval(() => {
      if (!document.hidden) run();
    }, 15000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [load]);

  return (
    <Link
      href="/mensagens"
      className={cn(
        "relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-sky-400/30 hover:text-sky-200",
      )}
      aria-label={unreadCount > 0 ? `Mensagens (${unreadCount} não lidas)` : "Mensagens"}
    >
      <MessageCircle className="h-4 w-4" />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
