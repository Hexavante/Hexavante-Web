import { describe, expect, it } from "vitest";
import { applyXp, levelFromTotalXp, xpRequiredForLevel } from "@/lib/gamification";

describe("levelFromTotalXp (moderação removendo/definindo XP)", () => {
  it("bate com applyXp quando o XP só sobe", () => {
    for (const total of [0, 1, 99, 500, 2500, 12345]) {
      const up = applyXp(1, 0, 0, total);
      expect(levelFromTotalXp(total)).toEqual(up);
    }
  });

  it("remover mais que o progresso do nível baixa o nível em vez de deixar XP negativo", () => {
    const before = applyXp(1, 0, 0, xpRequiredForLevel(1) + xpRequiredForLevel(2) + 10); // nível 3, 10 de progresso
    expect(before.level).toBe(3);
    const after = levelFromTotalXp(before.totalXp - 50);
    expect(after.level).toBe(2);
    expect(after.currentXp).toBeGreaterThanOrEqual(0);
    expect(after.currentXp).toBeLessThan(xpRequiredForLevel(after.level));
  });

  it("nunca fica abaixo de zero", () => {
    expect(levelFromTotalXp(-300)).toEqual({ level: 1, currentXp: 0, totalXp: 0 });
  });
});
