import { Prisma } from "@prisma/client";

export function isPrismaUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * Codes que indicam que a tabela/modelo esperado não existe ou a estrutura
 * do banco diverge da migration/PRISMA_CLIENT gerada a partir do schema.
 * P2021: existing `index` em DB não encontrado no schema.
 * P2022: collation do DB incompatível com a migration.
 * P2025/P2027/P2028: tabela/coluna inexistentes.
 */
const PRISMA_MISSING_TABLE_CODES = new Set(["P2021", "P2022", "P2025", "P2027", "P2028"]);

export function isPrismaMissingTable(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    PRISMA_MISSING_TABLE_CODES.has(error.code)
  );
}
