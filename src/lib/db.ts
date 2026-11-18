import 'server-only';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

const globalDb = globalThis as unknown as { saugaatPrisma?: PrismaClient };
function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured');
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}
export const db = globalDb.saugaatPrisma ?? createClient();
if (process.env.NODE_ENV !== 'production') globalDb.saugaatPrisma = db;
