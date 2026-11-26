// Prepares the PostgreSQL TEST database with the real migrations before the suite runs.
// The suite deletes all rows between tests, so this must NEVER point at a real database.
import { execFileSync } from "node:child_process";
import { config } from "dotenv";

const DEFAULT_URL = "postgresql://memorytrip:memorytrip@localhost:5432/memory_trip_test";

export default function setup() {
  config({ path: [".env.test.local", ".env.local"], quiet: true });
  const url = process.env.TEST_DATABASE_URL ?? DEFAULT_URL;

  const dbName = new URL(url).pathname.replace(/^\//, "");
  if (!/test/i.test(dbName)) {
    throw new Error(`Refusing to run tests: database "${dbName}" does not look like a test database (name must contain "test").`);
  }
  if (url === process.env.DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL must differ from DATABASE_URL: the suite wipes its tables.");
  }

  process.env.TEST_DATABASE_URL = url;
  try {
    execFileSync("npx", ["prisma", "migrate", "deploy"], {
      env: { ...process.env, DATABASE_URL: url, DIRECT_URL: "" },
      stdio: "pipe",
    });
  } catch (err) {
    const out = (err as { stderr?: Buffer }).stderr?.toString() ?? "";
    throw new Error(
      `Could not prepare the test database at ${dbName}. Is PostgreSQL running?\n` +
        `Start it with "docker compose up -d" (see docs/DEPLOY.md) or set TEST_DATABASE_URL.\n${out}`,
    );
  }
}
