// Checks an environment BEFORE you deploy.
//   npm run preflight -- --target production --env-file .env.vercel.production --live
// Never prints secret values. Exit code 1 if any check fails.
import { readdirSync } from "node:fs";
import { config } from "dotenv";
import { evaluateEnv, summarize, type Result, type Target } from "./checks";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const value = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const target = (value("target") ?? "local") as Target;
if (!["local", "preview", "production"].includes(target)) {
  console.error('--target must be "local", "preview" or "production"');
  process.exit(2);
}
const envFile = value("env-file");
if (envFile) {
  // override: values in the file are what we want to inspect, not the shell's.
  config({ path: envFile, override: true, quiet: true });
} else {
  config({ path: [".env.local", ".env"], quiet: true });
}

const icon = { pass: "✓", warn: "!", fail: "✗" } as const;
const print = (x: Result) => {
  console.log(`  ${icon[x.level]} ${x.message}`);
  if (x.hint && x.level !== "pass") console.log(`      → ${x.hint}`);
};

async function live(results: Result[]) {
  const env = process.env;
  // Database: connect, then compare applied migrations with the ones in the repo.
  try {
    const { createPrismaClient } = await import("../../lib/db-client");
    const db = createPrismaClient(env.DIRECT_URL || env.DATABASE_URL);
    try {
      await db.$queryRaw`select 1`;
      results.push({ id: "db-connect", level: "pass", message: "Database connection works" });
      const expected = readdirSync("prisma/migrations", { withFileTypes: true }).filter((d) => d.isDirectory()).length;
      const rows = await db.$queryRaw<{ n: bigint }[]>`select count(*) as n from _prisma_migrations where finished_at is not null and rolled_back_at is null`.catch(() => null);
      if (!rows) {
        results.push({ id: "db-migrations", level: "fail", message: "No migrations table: the database is empty", hint: "Run: DIRECT_URL=<direct string> npm run db:deploy" });
      } else {
        const applied = Number(rows[0].n);
        results.push(applied === expected
          ? { id: "db-migrations", level: "pass", message: `All ${expected} migrations are applied` }
          : { id: "db-migrations", level: "fail", message: `${applied} of ${expected} migrations applied`, hint: "Run: DIRECT_URL=<direct string> npm run db:deploy" });
      }
    } finally {
      await db.$disconnect();
    }
  } catch (err) {
    results.push({ id: "db-connect", level: "fail", message: `Cannot connect to the database (${(err as Error).name})`, hint: "Check the URL, that the Neon project is awake, and SSL settings." });
  }

  // Photo storage: write, read back and delete a tiny test object.
  if ((env.STORAGE_PROVIDER || "local") === "r2") {
    try {
      const { createR2Storage } = await import("../../lib/storage/r2");
      const { randomUUID } = await import("node:crypto");
      const storage = createR2Storage(env);
      const key = `preflight-check/${randomUUID()}.txt`;
      await storage.put(key, Buffer.from("preflight"), "text/plain");
      const back = await storage.get(key);
      await storage.delete(key);
      results.push(back?.toString() === "preflight"
        ? { id: "r2-roundtrip", level: "pass", message: "R2 bucket accepts, returns and deletes objects" }
        : { id: "r2-roundtrip", level: "fail", message: "R2 returned different data than was written" });
    } catch (err) {
      results.push({ id: "r2-roundtrip", level: "fail", message: `R2 test failed (${(err as Error).name})`, hint: "Check the token permissions (Object Read & Write on this bucket) and the account/bucket names." });
    }
  }
}

async function main() {
  console.log(`Preflight for "${target}"${envFile ? ` using ${envFile}` : ""}\n`);
  const results = evaluateEnv(process.env, target, process.version);
  if (flag("live")) await live(results);
  else console.log("  (skipping live database/R2 checks; add --live to run them)\n");
  results.forEach(print);
  const { pass, warn, fail } = summarize(results);
  console.log(`\n${pass} passed, ${warn} warning(s), ${fail} failed`);
  if (fail) console.log("Do not deploy yet: fix the failures above.");
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
