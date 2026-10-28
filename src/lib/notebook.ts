import { z } from "zod";

export const notebookPageInput = z.object({
  id: z.string().uuid(),
  courseId: z.string().min(1).max(191),
  title: z.string().trim().min(1, "Dê um título à página.").max(120),
  content: z.string().max(50000, "A página pode ter até 50 mil caracteres."),
  version: z.number().int().positive().nullable(),
});
export type NotebookPageInput = z.infer<typeof notebookPageInput>;
export type NotebookPageData = {
  id: string;
  courseId: string;
  title: string;
  content: string;
  version: number;
  updatedAt: string;
};
export type NotebookCourse = { id: string; title: string; slug: string };
export type NotebookData = {
  courses: NotebookCourse[];
  pages: NotebookPageData[];
};
export type NotebookResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
