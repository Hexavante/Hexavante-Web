"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TASK_PREFIX, readLiveTask } from "@/lib/live-task";
import { ClipboardList } from "lucide-react";
import { LiveChat, type ChatMessage } from "./live-chat";
import { sendChatMessageAction } from "@/app/actions/live-room";
import { useToast } from "@/components/ui/toast";
import { usePollFeedback } from "@/hooks/use-poll-feedback";

type Props = {
  instructorId: string;
  initialTask: string | null;
  roomId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  disabled?: boolean;
};

const POLL_INTERVAL_MS = 4000;

export function LiveChatWrapper({ roomId, currentUserId, instructorId, initialTask, initialMessages, disabled }: Props) {
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const task = messages.reduce<string | null>((latest, entry) => readLiveTask(entry, instructorId) ?? latest, initialTask);
  const messagesRef = useRef(messages);
  const { toast } = useToast();
  const { onSuccess, onFailure } = usePollFeedback("atualização do chat ao vivo");

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const timer = window.setTimeout(() => setMessages(initialMessages), 0);
    return () => window.clearTimeout(timer);
  }, [initialMessages]);

  const mergeMessages = useCallback((incoming: ChatMessage[]) => {
    if (incoming.length === 0) return;
    setMessages((current) => {
      const known = new Set(current.map((msg) => msg.id));
      const merged = [...current];
      for (const msg of incoming) {
        if (!known.has(msg.id)) merged.push(msg);
      }
      return merged;
    });
  }, []);

  useEffect(() => {
    if (disabled) return;

    const poll = async () => {
      const last = messagesRef.current[messagesRef.current.length - 1];
      const since = last ? new Date(last.createdAt).toISOString() : "";
      const url = since
        ? `/api/live-rooms/${roomId}/messages?since=${encodeURIComponent(since)}`
        : `/api/live-rooms/${roomId}/messages`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          onFailure();
          return;
        }
        const data = (await response.json()) as Array<{
          id: string;
          userId: string;
          username: string | null;
          fullName: string;
          message: string;
          createdAt: string;
        }>;
        mergeMessages(
          data.map((msg) => ({
            ...msg,
            createdAt: new Date(msg.createdAt),
          })),
        );
        onSuccess();
      } catch {
        onFailure();
      }
    };

    void poll();
    const interval = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [roomId, disabled, mergeMessages, onSuccess, onFailure]);

  const handleSendMessage = async (message: string) => {
    setIsSending(true);
    try {
      const result = await sendChatMessageAction(roomId, message);
      if (result.success && result.message) {
        mergeMessages([result.message]);
        return true;
      } else {
        toast(result.error || "Erro ao enviar mensagem", "error");
      }
    } catch {
      toast("Erro ao enviar mensagem", "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <section aria-label="Tarefa da aula" className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
        <h2 className="flex items-center gap-2 font-bold"><ClipboardList size={17} className="hx-accent-soft" /> Tarefa da aula</h2>
        <p aria-live="polite" className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-words text-sm">{task ?? "As instruções do professor aparecerão aqui."}</p>
        {currentUserId === instructorId && !disabled && <form className="mt-3 grid gap-2" onSubmit={async event => {
          event.preventDefault();
          if (!draft.trim() || isSending) return;
          if (await handleSendMessage(TASK_PREFIX + draft.trim())) setDraft("");
        }}>
          <textarea aria-label="Instruções da nova tarefa" placeholder="O que a turma deve fazer?" rows={2} maxLength={500 - TASK_PREFIX.length} value={draft} disabled={isSending} onChange={e => setDraft(e.target.value)} className="rounded-lg border border-[var(--border)] bg-transparent p-2 text-sm" />
          <button className="hx-btn-primary justify-self-start disabled:opacity-50" disabled={isSending || !draft.trim()}>Enviar tarefa à turma</button>
        </form>}
      </section>
      <div className="min-h-64 flex-1"><LiveChat
      roomId={roomId}
      currentUserId={currentUserId}
      messages={messages}
      onSendMessage={handleSendMessage}
      disabled={disabled || isSending}
      isSending={isSending}
    /></div></div>
  );
}
