// Constantes de recompensas de XP para diferentes ações
export const XP_REWARDS = {
  LESSON: 10, // XP por concluir aula
  MODULE: 25, // XP por concluir módulo
  COURSE: 100, // XP por concluir curso
  EXAM: 20, // XP por finalizar simulado
  EXAM_PASS_BONUS: 30, // Bônus por passar no simulado
} as const;

export const COIN_REWARDS = {
  EXAM_CORRECT: 5,
  LESSON: 3,
  MODULE: 10,
  COURSE: 25,
} as const;

// Pontuação mínima para aprovação em simulados
export const EXAM_PASS_SCORE = 70;

// Função para calcular XP necessário para um nível
// Retorna XP necessário para subir do nível atual para o próximo
export function xpRequiredForLevel(level: number): number {
  return level * 100;
}

// Função para aplicar XP ao usuário
// Calcula novo nível e XP após ganhar XP
export function applyXp(level: number, currentXp: number, totalXp: number, amount: number) {
  let newLevel = level;
  let newCurrentXp = currentXp + amount;
  const newTotalXp = totalXp + amount;

  // Verifica se XP atual é suficiente para subir de nível
  while (newCurrentXp >= xpRequiredForLevel(newLevel)) {
    newCurrentXp -= xpRequiredForLevel(newLevel); // Subtrai XP necessário para o nível
    newLevel += 1; // Sobe de nível
  }

  return { level: newLevel, currentXp: newCurrentXp, totalXp: newTotalXp };
}

/**
 * Nível e XP do nível atual a partir do XP total. Usado quando o XP pode
 * diminuir (ajuste da moderação): `applyXp` só sabe subir de nível.
 */
export function levelFromTotalXp(totalXp: number): { level: number; currentXp: number; totalXp: number } {
  const total = Math.max(0, Math.floor(totalXp));
  let level = 1;
  let spent = 0;
  while (spent + xpRequiredForLevel(level) <= total && level < 999) {
    spent += xpRequiredForLevel(level);
    level += 1;
  }
  return { level, currentXp: total - spent, totalXp: total };
}

// Função para calcular porcentagem de progresso para próximo nível
// Retorna porcentagem de XP atual em relação ao necessário
export function xpProgressPercent(level: number, currentXp: number): number {
  const needed = xpRequiredForLevel(level);
  return needed > 0 ? Math.min(100, Math.round((currentXp / needed) * 100)) : 0;
}

// Rótulos para fontes de XP
export const XP_SOURCE_LABELS: Record<string, string> = {
  LESSON: "Aula concluída",
  MODULE: "Módulo concluído",
  COURSE: "Curso concluído",
  EXAM: "Simulado finalizado",
  ADMIN: "Ajuste administrativo",
};

export const COIN_SOURCE_LABELS: Record<string, string> = {
  EXAM_CORRECT: "Questão correta",
  SHOP_PURCHASE: "Compra na loja",
  LESSON: "Aula concluída",
  MODULE: "Módulo concluído",
  COURSE: "Curso concluído",
  PREMIUM_GRANT: "Bônus Premium",
  LEAGUE_REWARD: "Recompensa de liga",
  ADMIN: "Ajuste administrativo",
};
