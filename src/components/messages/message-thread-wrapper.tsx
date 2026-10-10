"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageThread } from "@/components/messages/message-thread";
import { useToast } from "@/components/ui/toast";
import { usePollFeedback } from "@/hooks/use-poll-feedback";
import { redirectOnUnauthorized } from "@/lib/client-auth";
import type { SerializedDirectMessage } from "@/services/direct-message.service";
import {
  getConversationMessagesAction,
  sendDirectMessageAction,
} from "@/app/actions/messages";

type Props = {
  conversationId: string;
  currentUserId: string;
  initialMessages: SerializedDirectMessage[];
};

const POLL_INTERVAL_MS = 5000;

export function MessageThreadWrapper({ conversationId, currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [isSending, setIsSending] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(conversationId);
  const messagesRef = useRef(messages);
  const { toast } = useToast();
  const { onSuccess, onFailure } = usePollFeedback("atualização de mensagens");

  // Stable refs so the poll closure never goes stale without recreating the interval
  const onSuccessRef = useRef(onSuccess);
  const onFailureRef = useRef(onFailure);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onFailureRef.current = onFailure; }, [onFailure]);

  if (activeConversationId !== conversationId) {
    setActiveConversationId(conversationId);
    setMessages(initialMessages);
  }

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const mergeMessages = useCallback((incoming: SerializedDirectMessage[]) => {
    if (incoming.length === 0) return;
    setMessages((current) => {
      const known = new Set(current.map((msg) => msg.id));
      const newOnes = incoming.filter((msg) => !known.has(msg.id));
      if (newOnes.length === 0) return current;
      return [...current, ...newOnes].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    });
  }, []);

  useEffect(() => {
    let active = true;

    const poll = async () => {
      const last = messagesRef.current[messagesRef.current.length - 1];

      try {
        const response = await getConversationMessagesAction(conversationId, last?.createdAt);
        if (!active) return;
        if (!response.success) {
          if (response.unauthorized) redirectOnUnauthorized();
          else onFailureRef.current();
          return;
        }
        mergeMessages(response.messages);
        onSuccessRef.current();
      } catch {
        if (active) onFailureRef.current();
      }
    };

    void poll();
    const interval = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => { active = false; clearInterval(interval); };
    // Only restart if conversationId or merge fn changes — not callbacks
  }, [conversationId, mergeMessages]);

  const handleSend = async (body: string) => {
    setIsSending(true);
    const optimisticId = `pending-${Date.now()}`;
    const optimisticMsg: SerializedDirectMessage = {
      id: optimisticId,
      conversationId,
      senderId: currentUserId,
      body,
      createdAt: new Date().toISOString(),
      readAt: null,
      sender: { id: currentUserId, username: "", fullName: "Você", avatarUrl: null },
    };
    setMessages((c) => [...c, optimisticMsg]);

    try {
      const result = await sendDirectMessageAction(conversationId, body);

      if (!result.success && result.error === "Faça login para enviar mensagens.") {
        setMessages((c) => c.filter((m) => m.id !== optimisticId));
        redirectOnUnauthorized();
        return;
      }

      if (!result.success) {
        setMessages((c) => c.filter((m) => m.id !== optimisticId));
        toast(result.error ?? "Erro ao enviar mensagem", "error");
        return;
      }

      if (result.message) {
        setMessages((c) => c.map((m) => (m.id === optimisticId ? result.message! : m)));
      }
    } catch {
      setMessages((c) => c.filter((m) => m.id !== optimisticId));
      toast("Erro ao enviar mensagem", "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <MessageThread
      conversationId={conversationId}
      currentUserId={currentUserId}
      messages={messages}
      onSendMessage={handleSend}
      disabled={isSending}
      isSending={isSending}
    />
  );
}
