// Prisma client factory. No "server-only" here on purpose: scripts (prisma/seed.ts,
// tests) import this outside Next.js. App code must import `db` from "@/lib/db" instead.
//
// PostgreSQL through a driver adapter (required by Prisma 7):
// https://www.prisma.io/docs/orm/overview/databases/postgresql
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

export function createPrismaClient(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.",
    );
  }
  if (!/^postgres(ql)?:\/\//.test(databaseUrl)) {
    throw new Error("DATABASE_URL must be a PostgreSQL connection string (postgresql://...).");
  }
  // Serverless functions each hold their own pool, so keep it small. Use Neon's pooled
  // connection string (host contains "-pooler") in production.
  const max = Number(process.env.DB_POOL_MAX ?? 5);
  const adapter = new PrismaPg({ connectionString: databaseUrl, max });
  return new PrismaClient({ adapter });
}

export type Db = ReturnType<typeof createPrismaClient>;
