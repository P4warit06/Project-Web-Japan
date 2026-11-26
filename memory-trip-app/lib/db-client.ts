// Prisma client factory. No "server-only" here on purpose: scripts (prisma/seed.ts,
// tests) import this outside Next.js. App code must import `db` from "@/lib/db" instead.
//
// Dev uses SQLite through a driver adapter (required by Prisma 7):
// https://www.prisma.io/docs/orm/overview/databases/sqlite
// Production switches to PostgreSQL in milestone M9 (docs/PLAN.md).
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/app/generated/prisma/client";

export function createPrismaClient(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.",
    );
  }
  if (!databaseUrl.startsWith("file:")) {
    throw new Error(
      "Only SQLite (file:...) is wired up. PostgreSQL arrives in milestone M9.",
    );
  }
  const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
  return new PrismaClient({ adapter });
}

export type Db = ReturnType<typeof createPrismaClient>;
