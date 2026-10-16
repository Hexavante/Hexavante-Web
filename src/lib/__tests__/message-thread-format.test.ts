import { describe, expect, it } from "vitest";
import { groupMessagesForThread } from "@/lib/message-thread-format";
import type { SerializedDirectMessage } from "@/services/direct-message.service";

function msg(
  id: string,
  senderId: string,
  createdAt: string,
  body = "oi",
): SerializedDirectMessage {
  return {
    id,
    conversationId: "c1",
    senderId,
    body,
    createdAt,
    readAt: null,
    sender: {
      id: senderId,
      username: "user",
      fullName: "User",
      avatarUrl: null,
    },
  };
}

describe("message-thread-format", () => {
  it("agrupa mensagens consecutivas do mesmo remetente", () => {
    const blocks = groupMessagesForThread([
      msg("1", "a", "2026-06-20T10:00:00.000Z"),
      msg("2", "a", "2026-06-20T10:01:00.000Z"),
      msg("3", "b", "2026-06-20T10:02:00.000Z"),
    ]);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.clusters).toHaveLength(2);
    expect(blocks[0]?.clusters[0]?.messages).toHaveLength(2);
  });

  it("separa blocos por dia", () => {
    const blocks = groupMessagesForThread([
      msg("1", "a", "2026-06-19T22:00:00.000Z"),
      msg("2", "a", "2026-06-20T10:00:00.000Z"),
    ]);

    expect(blocks).toHaveLength(2);
  });
});
