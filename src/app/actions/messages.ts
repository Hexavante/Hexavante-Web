"use server";

import { auth } from "@/auth";
import {
  getConversationMessages,
  getUnreadDirectMessageCount,
  getOrCreateConversation,
  getOrCreateConversationByUsername,
  listInboxConversations,
  markConversationRead,
  sendDirectMessage,
  serializeDirectMessage,
} from "@/services/direct-message.service";
import { revalidatePath } from "next/cache";

export type MessageActionResult = {
  success: boolean;
  error?: string;
  conversationId?: string;
  message?: ReturnType<typeof serializeDirectMessage>;
};

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

export async function listInboxConversationsAction(): Promise<{
  success: boolean;
  unauthorized?: boolean;
  conversations: InboxConversation[];
  unreadCount: number;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, unauthorized: true, conversations: [], unreadCount: 0 };
  }

  const [conversations, unreadCount] = await Promise.all([
    listInboxConversations(session.user.id),
    getUnreadDirectMessageCount(session.user.id),
  ]);

  return {
    success: true,
    conversations: conversations.map((item) => ({
      id: item.id,
      otherUser: item.otherUser,
      lastMessage: item.lastMessage
        ? {
            ...item.lastMessage,
            createdAt: item.lastMessage.createdAt.toISOString(),
            readAt: item.lastMessage.readAt?.toISOString() ?? null,
          }
        : null,
      unreadCount: item.unreadCount,
      lastMessageAt: item.lastMessageAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
    })),
    unreadCount,
  };
}

export async function getConversationMessagesAction(
  conversationId: string,
  since?: string,
): Promise<{
  success: boolean;
  unauthorized?: boolean;
  messages: ReturnType<typeof serializeDirectMessage>[];
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, unauthorized: true, messages: [], error: "Não autorizado." };
  }

  const parsedSince = since ? new Date(since) : undefined;
  if (parsedSince && Number.isNaN(parsedSince.getTime())) {
    return { success: false, messages: [], error: "Data de atualização inválida." };
  }

  try {
    const messages = await getConversationMessages(conversationId, session.user.id, {
      since: parsedSince,
      limit: 100,
    });
    if (!parsedSince) await markConversationRead(conversationId, session.user.id);
    return { success: true, messages: messages.map(serializeDirectMessage) };
  } catch (err) {
    return {
      success: false,
      messages: [],
      error: err instanceof Error ? err.message : "Erro ao carregar mensagens.",
    };
  }
}

export async function getUnreadMessageCountAction(): Promise<{ unreadCount: number }> {
  const session = await auth();
  if (!session?.user?.id) return { unreadCount: 0 };
  return { unreadCount: await getUnreadDirectMessageCount(session.user.id) };
}

export async function startConversationAction(
  recipientUserId: string,
): Promise<MessageActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Faça login para enviar mensagens." };
  }

  try {
    const conversation = await getOrCreateConversation(session.user.id, recipientUserId);
    revalidatePath("/mensagens");
    return { success: true, conversationId: conversation.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao iniciar conversa.",
    };
  }
}

export async function startConversationByUsernameAction(
  username: string,
): Promise<MessageActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Faça login para enviar mensagens." };
  }

  try {
    const conversation = await getOrCreateConversationByUsername(session.user.id, username);
    revalidatePath("/mensagens");
    return { success: true, conversationId: conversation.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao iniciar conversa.",
    };
  }
}

export async function sendDirectMessageAction(
  conversationId: string,
  body: string,
): Promise<MessageActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Faça login para enviar mensagens." };
  }

  try {
    const message = await sendDirectMessage(conversationId, session.user.id, body);
    revalidatePath("/mensagens");
    revalidatePath(`/mensagens/${conversationId}`);
    return { success: true, message: serializeDirectMessage(message) };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao enviar mensagem.",
    };
  }
}
