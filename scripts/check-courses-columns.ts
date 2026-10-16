import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const columns = await prisma.$queryRawUnsafe<{ Field: string }[]>(
    "SHOW COLUMNS FROM courses WHERE Field IN ('level', 'estimated_hours')",
  );
  console.log("Colunas:", columns.map((c) => c.Field).join(", ") || "(nenhuma)");

  const count = await prisma.course.count();
  console.log("Cursos no banco:", count);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
