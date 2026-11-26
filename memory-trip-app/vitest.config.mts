import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": root,
      // `server-only` throws outside Next's server bundles. Tests import core logic only,
      // but stub it so a stray import cannot break the suite.
      "server-only": fileURLToPath(new URL("./tests/support/empty.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["./tests/support/global-setup.ts"],
    // One SQLite file shared by all test files: run them one at a time.
    fileParallelism: false,
  },
});
