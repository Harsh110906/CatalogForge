import { PrismaClient } from '@prisma/client';
import path from 'path';

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && envUrl.trim() !== '') {
    if (envUrl === 'file:./dev.db') {
      return `file:${path.resolve(process.cwd(), 'prisma/dev.db')}`;
    }
    return envUrl;
  }
  const dbPath = path.resolve(process.cwd(), 'prisma/dev.db');
  return `file:${dbPath}`;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
