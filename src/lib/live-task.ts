export const TASK_PREFIX = "Tarefa da aula: ";
export function readLiveTask(entry: { userId: string; message: string }, hostId: string) {
  if (entry.userId !== hostId || !entry.message.startsWith(TASK_PREFIX)) return null;
  return entry.message.slice(TASK_PREFIX.length).trim() || null;
}
