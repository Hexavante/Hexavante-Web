import { prisma } from "@/lib/prisma";

export async function shouldShowOnboardingTour(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardingCompletedAt: true },
  });
  return !user?.onboardingCompletedAt;
}
