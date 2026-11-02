type Candidate = { id: string; subject: string | null };
type Mistake = { questionId: string; question: { subject: string | null } };

/** Prefere novas perguntas dos assuntos mais errados, sem repetir IDs no treino. */
export function selectLightningIds(candidates: Candidate[], mistakes: Mistake[], count: number, random = Math.random): string[] {
  const failures = new Map<string, number>();
  const wrongIds = new Set(mistakes.map((entry) => entry.questionId));
  for (const { question } of mistakes) {
    if (question.subject) failures.set(question.subject, (failures.get(question.subject) ?? 0) + 1);
  }
  const pool = [...new Map(candidates.map((question) => [question.id, question])).values()];
  const priorities = pool.filter((q) => (q.subject && failures.has(q.subject)) || wrongIds.has(q.id));
  const selected: string[] = [];
  const pick = (source: Candidate[]) => {
    const available = source.filter((q) => !selected.includes(q.id));
    const weights = available.map((q) => (1 + (failures.get(q.subject ?? "") ?? 0)) * (wrongIds.has(q.id) ? 1 : 3));
    let ticket = random() * weights.reduce((sum, value) => sum + value, 0);
    const index = weights.findIndex((weight) => (ticket -= weight) < 0);
    const item = available[index < 0 ? available.length - 1 : index];
    if (item) selected.push(item.id);
  };
  // Quatro questões de reforço e uma surpresa geral, quando o banco permitir.
  for (let i = 0; i < Math.min(count - 1, priorities.length); i++) pick(priorities);
  while (selected.length < Math.min(count, pool.length)) pick(pool);
  // Mistura a posição do reforço e da questão geral.
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }
  return selected;
}
