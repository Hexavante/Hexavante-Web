import { PREMIUM_TRIAL_DAYS, buildPremiumStatus, isPremiumActive } from "@/lib/premium";
import { prisma } from "@/lib/prisma";
import { canAccessExamWithShopPasses } from "@/services/shop-entitlement.service";

export async function getPremiumStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPremium: true, premiumExpiresAt: true },
  });
  if (!user) return null;
  return buildPremiumStatus(user);
}

/** Campos de premium que podem vir na sessão (contrato da API). */
export type PremiumSessionSnapshot = {
  isPremium?: boolean;
  premiumExpiresAt?: string | Date | null;
};

/**
 * Estado premium mais atual para UI (loja /hexa, retorno de pagamento).
 * Usa os campos da sessão quando a API os expõe; caso contrário cai no banco
 * (mesma fonte usada pela loja), garantindo a data de expiração.
 */
export async function resolvePremiumState(
  userId: string,
  sessionUser?: PremiumSessionSnapshot | null,
): Promise<{ isActive: boolean; expiresAt: Date | null }> {
  if (
    sessionUser &&
    typeof sessionUser.isPremium === "boolean" &&
    "premiumExpiresAt" in sessionUser
  ) {
    const raw = sessionUser.premiumExpiresAt;
    const expiresAt = raw ? new Date(raw) : null;
    if (!expiresAt || !Number.isNaN(expiresAt.getTime())) {
      return {
        isActive: isPremiumActive({
          isPremium: sessionUser.isPremium,
          premiumExpiresAt: expiresAt,
        }),
        expiresAt,
      };
    }
  }

  const status = await getPremiumStatus(userId);
  return {
    isActive: status?.isActive ?? false,
    expiresAt: status?.expiresAt ?? null,
  };
}

export async function canAccessPremiumExam(
  userId: string,
  exam: { slug: string; isPremiumOnly: boolean },
) {
  if (!exam.isPremiumOnly) return true;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPremium: true, premiumExpiresAt: true },
  });
  if (!user) return false;
  if (isPremiumActive(user)) return true;
  return canAccessExamWithShopPasses(userId, exam);
}

export async function activatePremiumTrial(userId: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + PREMIUM_TRIAL_DAYS);

  return prisma.user.update({
    where: { id: userId },
    data: {
      isPremium: true,
      premiumExpiresAt: expiresAt,
    },
    select: {
      isPremium: true,
      premiumExpiresAt: true,
    },
  });
}

export async function deactivateExpiredPremium() {
  const now = new Date();
  await prisma.user.updateMany({
    where: {
      isPremium: true,
      premiumExpiresAt: { lt: now },
    },
    data: { isPremium: false },
  });
}
