import { PrismaClient } from '@prisma/client';

// Why a singleton?
// PrismaClient opens a connection pool. Creating multiple instances
// wastes connections and can exceed DB limits. One instance, reused everywhere.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
