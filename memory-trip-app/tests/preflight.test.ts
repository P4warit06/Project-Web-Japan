import { describe, expect, it } from "vitest";
import { evaluateEnv, summarize, type Env, type Target } from "@/scripts/preflight/checks";

const GOOD_SECRET = "Zk3pQ9vXn2LmT7wRb5YhC8dJfA1sUeG4oPiNq6xVtMy=";
const goodProd: Env = {
  DATABASE_URL: "postgresql://u:p@ep-cool-123-pooler.ap-southeast-1.aws.neon.tech/db?sslmode=require",
  DIRECT_URL: "postgresql://u:p@ep-cool-123.ap-southeast-1.aws.neon.tech/db?sslmode=require",
  SESSION_SECRET: GOOD_SECRET,
  STORAGE_PROVIDER: "r2",
  R2_ACCOUNT_ID: "0123456789abcdef0123456789abcdef",
  R2_ACCESS_KEY_ID: "key",
  R2_SECRET_ACCESS_KEY: "secret",
  R2_BUCKET: "memory-trip-photos",
  NEXT_PUBLIC_APP_URL: "https://keepmemoryiceandjapan.vercel.app",
};

const run = (env: Env, target: Target = "production", node = "v22.1.0") => evaluateEnv(env, target, node);
const level = (rs: ReturnType<typeof run>, id: string) => rs.find((x) => x.id === id)?.level;
const fails = (rs: ReturnType<typeof run>) => rs.filter((x) => x.level === "fail").map((x) => x.id);

describe("a correct production environment", () => {
  it("has no failures and only the expected LINE warning", () => {
    const rs = run(goodProd);
    expect(fails(rs)).toEqual([]);
    expect(rs.filter((x) => x.level === "warn").map((x) => x.id)).toEqual(["line"]);
  });
});

describe("catches the mistakes that break or endanger a deployment", () => {
  it("missing DATABASE_URL, wrong scheme, or a localhost database on Vercel", () => {
    expect(level(run({ ...goodProd, DATABASE_URL: undefined }), "database-url")).toBe("fail");
    expect(level(run({ ...goodProd, DATABASE_URL: "mysql://u:p@h/db" }), "database-url")).toBe("fail");
    expect(level(run({ ...goodProd, DATABASE_URL: "postgresql://u:p@localhost:5432/db" }), "database-url")).toBe("fail");
    expect(level(run({ ...goodProd, DATABASE_URL: "postgresql://u:p@localhost:5432/db" }, "local"), "database-url")).toBe("pass");
  });
  it("warns about missing SSL or a non-pooled app URL, fails a pooled DIRECT_URL", () => {
    const noSsl = { ...goodProd, DATABASE_URL: "postgresql://u:p@ep-1-pooler.neon.tech/db" };
    expect(level(run(noSsl), "database-ssl")).toBe("warn");
    expect(level(run({ ...goodProd, DATABASE_URL: goodProd.DIRECT_URL }), "database-pooled")).toBe("warn");
    expect(level(run({ ...goodProd, DIRECT_URL: goodProd.DATABASE_URL }), "direct-url")).toBe("fail");
  });
  it("rejects weak, short, example and CI session secrets", () => {
    for (const bad of [undefined, "short", "x".repeat(40), "ci-only-secret-ci-only-secret-ci-only-secret", "change-me-change-me-change-me-change-me", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab"]) {
      expect(["fail", "warn"]).toContain(level(run({ ...goodProd, SESSION_SECRET: bad }), "session-secret"));
    }
    expect(level(run({ ...goodProd, SESSION_SECRET: "x".repeat(40) }), "session-secret")).not.toBe("pass");
  });
  it("requires r2 storage and all R2 variables on Vercel", () => {
    expect(level(run({ ...goodProd, STORAGE_PROVIDER: "local" }), "storage-provider")).toBe("fail");
    expect(level(run({ ...goodProd, STORAGE_PROVIDER: undefined }), "storage-provider")).toBe("fail");
    expect(level(run({ ...goodProd, R2_BUCKET: "" }), "r2-vars")).toBe("fail");
    expect(level(run({ ...goodProd, R2_ACCOUNT_ID: "nope" }), "r2-account-id")).toBe("warn");
    expect(level(run({ SESSION_SECRET: GOOD_SECRET, DATABASE_URL: "postgresql://u:p@localhost/db" }, "local"), "storage-provider")).toBe("pass");
  });
  it("never lets the mock login be set in Production, and warns on Preview", () => {
    expect(level(run({ ...goodProd, ALLOW_DEV_LOGIN: "true" }), "dev-login")).toBe("fail");
    expect(level(run({ ...goodProd, ALLOW_DEV_LOGIN: "true" }, "preview"), "dev-login")).toBe("warn");
    expect(level(run(goodProd, "preview"), "dev-login")).toBe("pass");
  });
  it("needs an https public URL in Production", () => {
    for (const bad of [undefined, "http://keep.vercel.app", "https://localhost:3000"]) {
      expect(level(run({ ...goodProd, NEXT_PUBLIC_APP_URL: bad }), "app-url")).toBe("fail");
    }
  });
  it("fails when a secret would be shipped to the browser", () => {
    const rs = run({ ...goodProd, NEXT_PUBLIC_API_KEY: "abc", NEXT_PUBLIC_SESSION_SECRET: "x" });
    expect(level(rs, "public-secrets")).toBe("fail");
    expect(rs.find((x) => x.id === "public-secrets")?.message).toContain("NEXT_PUBLIC_API_KEY");
    expect(level(run({ ...goodProd, NEXT_PUBLIC_APP_URL: goodProd.NEXT_PUBLIC_APP_URL }), "public-secrets")).toBe("pass");
  });
  it("fails on an old Node and on a real AI provider without a key", () => {
    expect(level(run(goodProd, "production", "v20.11.0"), "node")).toBe("fail");
    expect(level(run({ ...goodProd, AI_PROVIDER: "claude" }), "ai")).toBe("fail");
    expect(level(run({ ...goodProd, AI_PROVIDER: "claude", AI_API_KEY: "k" }), "ai")).toBeUndefined();
  });
});

describe("output safety", () => {
  it("never repeats a secret value in any message or hint", () => {
    const env = { ...goodProd, NEXT_PUBLIC_TOKEN: "super-secret-token-value", SESSION_SECRET: "short-secret-value-123" };
    const text = JSON.stringify(run(env));
    for (const secret of ["super-secret-token-value", "short-secret-value-123", "u:p@"]) {
      expect(text).not.toContain(secret);
    }
  });
  it("summarize counts levels", () => {
    expect(summarize(run(goodProd))).toMatchObject({ fail: 0, warn: 1 });
  });
});
