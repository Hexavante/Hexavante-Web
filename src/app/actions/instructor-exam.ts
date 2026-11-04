"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isInstructor } from "@/lib/permissions";
import { slugify } from "@/lib/slug";

const question = z.object({
  statement: z
    .string()
    .trim()
    .min(5, "Escreva um enunciado de pelo menos 5 caracteres.")
    .max(5000),
  alternatives: z
    .array(
      z.string().trim().min(1, "Preencha todas as alternativas.").max(1500),
    )
    .length(4),
  correct: z.number().int().min(0).max(3),
});
const submission = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Informe um título com pelo menos 3 caracteres.")
    .max(140),
  examType: z.enum(["ENEM", "VESTIBULAR", "TECNOLOGIA"]),
  questions: z.array(question).min(1).max(50),
});

export async function submitInstructorExam(
  requestId: string,
  input: z.input<typeof submission>,
) {
  const session = await auth();
  if (!session?.user?.id || !isInstructor(session.user.roles))
    return { error: "Entre com uma conta de instrutor." };
  if (!z.uuid().safeParse(requestId).success)
    return { error: "Reabra o formulário e tente novamente." };
  const parsed = submission.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const authorId = session.user.id;
  const { title, examType, questions } = parsed.data;
  const slug = (slugify(title).slice(0, 80) || "simulado") + "-" + requestId;
  try {
    await prisma.exam.create({
      data: {
        title,
        slug,
        examType,
        isPublished: false,
        submission: { create: { authorId } },
        questions: {
          create: questions.map((item, index) => ({
            statement: item.statement,
            orderNumber: index + 1,
            alternatives: {
              create: item.alternatives.map((text, i) => ({
                text,
                isCorrect: i === item.correct,
              })),
            },
          })),
        },
      },
    });
  } catch (error) {
    if (
      !(
        error instanceof Error &&
        "code" in error &&
        error.code === "P2002" &&
        (await prisma.exam.findFirst({
          where: { slug, submission: { authorId } },
          select: { id: true },
        }))
      )
    ) {
      return { error: "Não foi possível enviar o simulado. Tente novamente." };
    }
  }
  revalidatePath("/instructor/simulados");
  revalidatePath("/instructor/gerenciar");
  return { success: true };
}
