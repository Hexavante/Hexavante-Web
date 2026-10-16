import {
  ContentPolicyError,
  findBlockedContent,
  findSequenceEvasion,
  findBlockedUsername,
} from "@/lib/profanity-filter";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export type ContentPolicyContext =
  | "REGISTER"
  | "PROFILE"
  | "DIRECT_MESSAGE"
  | "COMMUNITY_POST"
  | "COMMUNITY_COMMENT"
  | "COMMUNITY_TAG"
  | "LIVE_CHAT"
  | "LIVE_ROOM"
  | "INSTRUCTOR_APPLICATION"
  | "COURSE";

function sanitizePreview(text: string, max = 180): string {
  return text.trim().replace(/\s+/g, " ").slice(0, max);
}

export async function logContentPolicyViolation(input: {
  userId?: string | null;
  context: ContentPolicyContext;
  field: string;
  text: string;
  matched: string;
  identifier?: string | null;
}) {
  try {
    await prisma.contentPolicyViolation.create({
      data: {
        userId: input.userId ?? null,
        context: input.context,
        field: input.field,
        preview: sanitizePreview(input.text),
        matchedTerm: input.matched.slice(0, 80),
        identifier: input.identifier ?? null,
      },
    });
  } catch (error) {
    logger.warn("Falha ao registrar violação de conteúdo", {
      context: input.context,
      error,
    });
  }
}

export async function enforceCleanContent(input: {
  userId?: string | null;
  text: string;
  fieldLabel: string;
  context: ContentPolicyContext;
  identifier?: string | null;
}): Promise<void> {
  const matched = findBlockedContent(input.text);
  if (!matched) return;

  if (input.userId) {
    const recentViolations = await prisma.contentPolicyViolation.count({
      where: {
        userId: input.userId,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });

    if (recentViolations >= 12) {
      throw new ContentPolicyError(
        "Muitas tentativas bloqueadas na última hora. Aguarde um pouco antes de publicar novamente.",
      );
    }
  }

  await logContentPolicyViolation({
    userId: input.userId,
    context: input.context,
    field: input.fieldLabel,
    text: input.text,
    matched,
    identifier: input.identifier,
  });

  throw new ContentPolicyError(
    `Sua ${input.fieldLabel} contém linguagem não permitida. Revise o texto e tente novamente.`,
  );
}

/** Bloqueia a mensagem atual; combina só fragmentos curtos recentes (evasão por sequência). */
export async function enforceCleanMessageSequence(input: {
  userId?: string | null;
  text: string;
  recentFragments: string[];
  fieldLabel: string;
  context: ContentPolicyContext;
  identifier?: string | null;
}): Promise<void> {
  const matchedCurrent = findBlockedContent(input.text);
  if (matchedCurrent) {
    await logContentPolicyViolation({
      userId: input.userId,
      context: input.context,
      field: input.fieldLabel,
      text: input.text,
      matched: matchedCurrent,
      identifier: input.identifier,
    });
    throw new ContentPolicyError(
      `Sua ${input.fieldLabel} contém linguagem não permitida. Revise o texto e tente novamente.`,
    );
  }

  const matchedSequence = findSequenceEvasion(input.recentFragments, input.text);
  if (!matchedSequence) return;

  await logContentPolicyViolation({
    userId: input.userId,
    context: input.context,
    field: input.fieldLabel,
    text: [...input.recentFragments, input.text].join(" | "),
    matched: matchedSequence,
    identifier: input.identifier,
  });

  throw new ContentPolicyError(
    "Sua mensagem forma uma expressão ofensiva em sequência com mensagens recentes.",
  );
}

export async function enforceCleanUsername(input: {
  username: string | null;
  userId?: string | null;
  identifier?: string | null;
}): Promise<void> {
  const matched = input.username ? findBlockedUsername(input.username) : null;
  if (!matched) return;

  await logContentPolicyViolation({
    userId: input.userId,
    context: "REGISTER",
    field: "nome de usuário",
    text: input.username ?? "",
    matched,
    identifier: input.identifier,
  });

  throw new ContentPolicyError("Este nome de usuário não é permitido.");
}

export async function listRecentContentPolicyViolations(limit = 20) {
  return prisma.contentPolicyViolation.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: { id: true, username: true, fullName: true },
      },
    },
  });
}

export { ContentPolicyError, filterProfanity } from "@/lib/profanity-filter";
