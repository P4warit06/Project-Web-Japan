// Creates a fresh SQLite database from the real migrations before the suite runs.
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export default function setup() {
  const dir = mkdtempSync(join(tmpdir(), "memory-trip-test-"));
  const url = `file:${join(dir, "test.db")}`;
  process.env.TEST_DATABASE_URL = url;
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });
  return () => rmSync(dir, { recursive: true, force: true });
}
