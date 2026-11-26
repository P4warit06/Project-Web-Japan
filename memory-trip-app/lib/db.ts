import "server-only";
import { createPrismaClient, type Db } from "@/lib/db-client";

// One client per server process. In dev, hot reload re-evaluates modules, so the
// client is cached on globalThis to avoid opening a new connection on every edit.
// https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help
const globalForDb = globalThis as unknown as { db?: Db };

export const db = globalForDb.db ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}
