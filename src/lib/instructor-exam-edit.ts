import { z } from "zod";
export const instructorExamEditSchema = z.object({
  title: z.string().trim().min(3).max(140),
  examType: z.enum(["ENEM", "VESTIBULAR", "TECNOLOGIA"]),
  description: z.string().max(20000),
  timeLimit: z.number().int().min(1).max(300).nullable(),
  questions: z
    .array(
      z.object({
        id: z.string().optional(),
        statement: z.string().trim().min(5).max(5000),
        alternatives: z.array(z.string().trim().min(1).max(1500)).max(6),
        correct: z.number().int().min(-1).max(5),
        expectedAnswer: z.string().max(10000).optional(),
      }),
    )
    .min(1)
    .max(200),
});
export type InstructorExamEditInput = z.infer<typeof instructorExamEditSchema>;
