// Prisma CLI config. Docs: https://www.prisma.io/docs/orm/reference/prisma-config-reference
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma CLI does not read Next.js env files. Load .env.local first (it wins),
// then .env. dotenv never overrides variables that are already set.
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a DIRECT connection. With Neon, DATABASE_URL is the pooled URL used by
    // the running app and DIRECT_URL is the non-pooled one. Locally only DATABASE_URL is set.
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
