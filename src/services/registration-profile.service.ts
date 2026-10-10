import { prisma } from "@/lib/prisma";
import type { RegisterInput } from "@/lib/validations/auth";

/** Persiste escolhas do cadastro e libera o perfil de instrutor quando escolhido. */
export async function saveRegistrationProfile(userId: string, input: RegisterInput) {
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        registrationIntent: input.accountType,
        registrationPreferences: {
          studyGoal: input.studyGoal ?? null,
          studyInterests: input.studyInterests,
        },
      },
    });

    if (input.accountType !== "INSTRUCTOR") return;
    const instructorRole = await tx.role.findUnique({ where: { name: "INSTRUCTOR" } });
    if (!instructorRole) throw new Error("Papel INSTRUCTOR não encontrado. Execute o seed do banco.");
    await tx.userRole.upsert({
      where: { userId_roleId: { userId, roleId: instructorRole.id } },
      create: { userId, roleId: instructorRole.id },
      update: {},
    });
  });
}
