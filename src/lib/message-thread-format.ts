import type { SerializedDirectMessage } from "@/services/direct-message.service";

const GROUP_GAP_MS = 5 * 60 * 1000;

export type MessageCluster = {
  senderId: string;
  messages: SerializedDirectMessage[];
};

export type DatedMessageBlock = {
  dateKey: string;
  label: string;
  clusters: MessageCluster[];
};

function dateKey(value: string | Date): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function formatMessageDayLabel(value: string | Date): string {
  const date = new Date(value);
  const now = new Date();
  const today = dateKey(now);
  const target = dateKey(date);

  if (target === today) return "Hoje";

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (target === dateKey(yesterday)) return "Ontem";

  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function formatMessageTime(value: string | Date): string {
  return new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function groupMessagesForThread(messages: SerializedDirectMessage[]): DatedMessageBlock[] {
  if (messages.length === 0) return [];

  const blocks: DatedMessageBlock[] = [];

  for (const message of messages) {
    const key = dateKey(message.createdAt);
    let block = blocks.find((entry) => entry.dateKey === key);

    if (!block) {
      block = {
        dateKey: key,
        label: formatMessageDayLabel(message.createdAt),
        clusters: [],
      };
      blocks.push(block);
    }

    const lastCluster = block.clusters[block.clusters.length - 1];
    const lastMessage = lastCluster?.messages[lastCluster.messages.length - 1];

    const sameSender = lastCluster?.senderId === message.senderId;
    const withinGap =
      lastMessage &&
      new Date(message.createdAt).getTime() - new Date(lastMessage.createdAt).getTime() <= GROUP_GAP_MS;

    if (lastCluster && sameSender && withinGap) {
      lastCluster.messages.push(message);
    } else {
      block.clusters.push({ senderId: message.senderId, messages: [message] });
    }
  }

  return blocks;
}
