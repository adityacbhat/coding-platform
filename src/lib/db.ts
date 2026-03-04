import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.warn('DATABASE_URL is not set. Database operations will fail.');
    return new PrismaClient();
  }
  
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new Pool({
      connectionString,
      ssl: connectionString?.includes('supabase') || connectionString?.includes('pooler')
        ? { rejectUnauthorized: false }
        : false,
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      allowExitOnIdle: true,
    });
  }
  
  const adapter = new PrismaPg(globalForPrisma.pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
