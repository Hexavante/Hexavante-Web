"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { claimSeasonReward } from "@/services/ranking-season.service";

export type RankingSeasonActionResult = {
  success: boolean;
  error?: string;
  coins?: number;
};

export async function claimSeasonRewardAction(
  seasonKey: string,
): Promise<RankingSeasonActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Faça login para continuar." };
  }

  try {
    const result = await claimSeasonReward(session.user.id, seasonKey);
    if (!result) {
      return { success: false, error: "Recompensa indisponível ou já resgatada." };
    }

    revalidatePath("/ranking");
    revalidatePath("/perfil");
    revalidatePath("/shop");
    return { success: true, coins: result.coins };
  } catch {
    return { success: false, error: "Não foi possível resgatar a recompensa." };
  }
}
