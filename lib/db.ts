import 'server-only';

import { MockPrismaClient, type AppPrismaClient } from '@/lib/mock-db';

const globalForDb = globalThis as unknown as { prisma?: AppPrismaClient };

export const prisma = globalForDb.prisma ?? new MockPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.prisma = prisma;
}
