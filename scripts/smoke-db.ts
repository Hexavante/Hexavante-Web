import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const checks: Array<[string, () => Promise<unknown>]> = [
    ["courses", () => prisma.course.findMany({ take: 1 })],
    ["exams", () => prisma.exam.findMany({ take: 1 })],
    ["users", () => prisma.user.findMany({ take: 1, select: { id: true } })],
    ["liveRooms", () => prisma.liveRoom.findMany({ take: 1 })],
    ["certificates", () => prisma.certificate.findMany({ take: 1 })],
    ["xp", () => prisma.userXP.findMany({ take: 1 })],
  ];

  for (const [name, fn] of checks) {
    try {
      await fn();
      console.log(`OK  ${name}`);
    } catch (error) {
      console.error(`ERR ${name}:`, error instanceof Error ? error.message : error);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
