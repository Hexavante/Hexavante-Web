// Cliente Prisma singleton — usar após: npm install @prisma/client && npx prisma generate
// Evita múltiplas instâncias em desenvolvimento com hot reload

import { PrismaClient } from "@prisma/client";

// Incremente ao alterar prisma/schema.prisma para invalidar cache em dev.
const PRISMA_SINGLETON_KEY = "hexavante_prisma_notebook_pages_v1";

type PrismaGlobal = typeof globalThis & {
  [PRISMA_SINGLETON_KEY]?: PrismaClient;
};

const globalForPrisma = globalThis as PrismaGlobal;

export const prisma = globalForPrisma[PRISMA_SINGLETON_KEY] ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma[PRISMA_SINGLETON_KEY] = prisma;
}
