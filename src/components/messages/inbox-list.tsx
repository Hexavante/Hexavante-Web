"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { redirectOnUnauthorized } from "@/lib/client-auth";
import { formatMessageTime } from "@/lib/message-thread-format";
import { usePollFeedback } from "@/hooks/use-poll-feedback";
import { listInboxConversationsAction } from "@/app/actions/messages";

export type InboxConversation = {
  id: string;
  otherUser: {
    id: string;
    username: string | null;
    fullName: string;
    avatarUrl: string | null;
  };
  lastMessage: {
    id: string;
    body: string;
    senderId: string;
    createdAt: string;
    readAt: string | null;
  } | null;
  unreadCount: number;
  lastMessageAt: string | null;
  createdAt: string;
};

type Props = {
  initialConversations: InboxConversation[];
  activeConversationId?: string;
  currentUserId: string;
};

const POLL_INTERVAL_MS = 6000;

function formatInboxTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (sameDay) return formatMessageTime(value);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return "Ontem";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function InboxList({ initialConversations, activeConversationId, currentUserId }: Props) {
  const [conversations, setConversations] = useState(initialConversations);
  const pathname = usePathname();
  const { onSuccess, onFailure } = usePollFeedback("atualização da caixa de entrada");

  const refresh = useCallback(async () => {
    try {
      const data = await listInboxConversationsAction();
      if (!data.success) {
        if (data.unauthorized) redirectOnUnauthorized();
        else onFailure();
        return;
      }
      setConversations(data.conversations);
      onSuccess();
    } catch {
      onFailure();
    }
  }, [onSuccess, onFailure]);

  useEffect(() => {
    const interval = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
        <MessageCircle className="h-9 w-9 text-slate-600" />
        <p className="mt-3 text-sm font-semibold text-slate-300">Nenhuma conversa ainda</p>
        <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
          Visite um perfil e toque em Mensagem para iniciar.
        </p>
      </div>
    );
  }

  return (
    <ul>
      {conversations.map((conversation) => {
        const isActive =
          activeConversationId === conversation.id ||
          pathname === `/mensagens/${conversation.id}`;
        const youSentLast = conversation.lastMessage?.senderId === currentUserId;
        // body already filtered server-side
        const preview = conversation.lastMessage
          ? `${youSentLast ? "Você: " : ""}${conversation.lastMessage.body}`
          : "Inicie a conversa";
        const previewTime = formatInboxTime(conversation.lastMessageAt ?? conversation.createdAt);
        const displayName =
          conversation.otherUser?.fullName ?? conversation.otherUser?.username ?? "Usuário";
        const hasUnread = conversation.unreadCount > 0 && !isActive;

        return (
          <li key={conversation.id}>
            <Link
              href={`/mensagens/${conversation.id}`}
              className={cn(
                "flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 transition",
                isActive ? "bg-sky-400/10" : "hover:bg-white/[0.03]",
              )}
            >
              <Avatar
                src={conversation.otherUser?.avatarUrl ?? null}
                alt={conversation.otherUser?.username ?? "Usuário"}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      "truncate text-sm",
                      hasUnread ? "font-bold text-white" : "font-semibold text-slate-200",
                    )}
                  >
                    {displayName}
                  </p>
                  <span className="shrink-0 text-[11px] text-slate-500">{previewTime}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-400">{preview}</p>
              </div>
              {hasUnread ? (
                <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                  {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
