import { vi } from "vitest";

export const prismaMock = {
  user: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  userBan: {
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    findFirst: vi.fn().mockResolvedValue(null),
  },
  userMute: {
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    findFirst: vi.fn().mockResolvedValue(null),
  },
  role: {
    findUnique: vi.fn(),
  },
  userXP: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  xpTransaction: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    groupBy: vi.fn(),
    aggregate: vi.fn(),
  },
  courseEnrollment: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
  lessonProgress: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
  examAttempt: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
  certificate: {
    count: vi.fn(),
  },
  coinTransaction: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
  },
  lightningChallengeAttempt: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  examQuestion: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  storeItem: {
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    upsert: vi.fn().mockResolvedValue({}),
    findUnique: vi.fn().mockResolvedValue({ id: 'theme-hexavante-id' }),
  },
  userInventory: {
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    upsert: vi.fn().mockResolvedValue({}),
  },
  $transaction: vi.fn(),
};
