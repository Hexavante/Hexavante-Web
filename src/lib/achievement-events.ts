/**
 * Utilitário cliente para disparar o evento customizado de conquistas
 * desbloqueadas. Usado pelos Client Components após receber o retorno
 * de Server Actions que incluem `newAchievementKeys`.
 *
 * Nunca chame no servidor — o guard `typeof window !== 'undefined'` protege
 * contra SSR, mas idealmente importe somente em Client Components.
 */
export const ACHIEVEMENT_UNLOCKED_EVENT = "hx:achievement-unlocked";

export type AchievementUnlockedPayload = {
  keys: string[];
};

/**
 * Dispara o evento `hx:achievement-unlocked` na window com as chaves
 * das conquistas recém-desbloqueadas.
 *
 * Seguro chamar em Client Components logo após uma Server Action retornar
 * `newAchievementKeys`. Não faz nada se chamado no SSR.
 */
export function dispatchAchievementUnlocked(keys: string[]): void {
  if (typeof window === "undefined") return;
  if (keys.length === 0) return;

  window.dispatchEvent(
    new CustomEvent<AchievementUnlockedPayload>(ACHIEVEMENT_UNLOCKED_EVENT, {
      detail: { keys },
    }),
  );
}
