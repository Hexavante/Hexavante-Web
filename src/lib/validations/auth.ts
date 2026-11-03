// Importações necessárias para validação
import { z } from "zod"; // Biblioteca de validação de schemas

// Schema de validação para registro de usuário
// Define regras para cada campo do formulário de registro
export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(30, "Máximo 30 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Use apenas letras, números e _"),
  fullName: z.string().min(2, "Nome muito curto"),
  email: z.string().trim().pipe(z.email("E-mail inválido")).transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  confirmPassword: z.string().min(1, "Confirme a senha"),
  birthDate: z.coerce.date({
    error: "Data de nascimento inválida",
  }),
  phone: z
    .string()
    .max(20, "Telefone muito longo")
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
  city: z
    .string()
    .max(80, "Cidade muito longa")
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
  state: z
    .string()
    .max(40, "Estado muito longo")
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
  terms: z
    .string()
    .optional()
    .transform((value) => value === "on" || value === "true")
    .refine((value) => value === true, "Você precisa aceitar os termos para continuar."),
  accountType: z.enum(["STUDENT", "INSTRUCTOR"]).default("STUDENT"),
  studyGoal: z.enum(["ENEM", "VESTIBULAR", "SCHOOL", "CAREER", "OTHER"]).optional(),
  studyInterests: z
    .string()
    .optional()
    .transform((value) => (value ?? "").split(",").map((item) => item.trim()).filter(Boolean).slice(0, 6)),
  instructorMotivation: z.string().max(500, "Conte no máximo 500 caracteres.").optional(),
  instructorExperience: z.string().max(500, "Descreva sua experiência em no máximo 500 caracteres.").optional(),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confirmPassword"],
      message: "As senhas não coincidem.",
    });
  }

  const today = new Date();
  let age = today.getFullYear() - data.birthDate.getFullYear();
  const monthDiff = today.getMonth() - data.birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < data.birthDate.getDate())) {
    age--;
  }

  if (age < 13) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["birthDate"],
      message: "É necessário ter no mínimo 13 anos para se cadastrar.",
    });
  }

});

// Schema de validação para login
// Define regras para email e senha
export const loginSchema = z.object({
  email: z.string().trim().pipe(z.email("E-mail inválido")).transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Informe a senha"),
});

// Tipos inferidos dos schemas para uso no código
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
