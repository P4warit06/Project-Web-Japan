// Pure environment checks (no network, no secrets printed). Used by `npm run preflight`.
// A check never includes a secret VALUE in its message: only names and yes/no facts.
export type Target = "local" | "preview" | "production";
export type Level = "pass" | "warn" | "fail";
export type Result = { id: string; level: Level; message: string; hint?: string };
export type Env = Record<string, string | undefined>;

const r = (id: string, level: Level, message: string, hint?: string): Result => ({ id, level, message, hint });
const has = (v: string | undefined) => typeof v === "string" && v.trim() !== "";
const isHosted = (t: Target) => t !== "local";

// Values that appear in this repo's examples or CI: never acceptable as a real secret.
const KNOWN_BAD_SECRET = /(ci-only|change.?me|example|your.?secret|password|secret-secret|placeholder|test)/i;
const SECRET_LIKE_PUBLIC = /^NEXT_PUBLIC_.*(SECRET|TOKEN|PASSWORD|PRIVATE|API_?KEY|ACCESS_?KEY)/i;

export function evaluateEnv(env: Env, target: Target, nodeVersion: string): Result[] {
  const out: Result[] = [];

  // ---- runtime
  const major = Number(nodeVersion.replace(/^v/, "").split(".")[0]);
  out.push(
    major >= 22
      ? r("node", "pass", `Node ${nodeVersion} (22 or newer required)`)
      : r("node", "fail", `Node ${nodeVersion} is too old`, "Install Node 22 (package.json engines also pins it for Vercel)."),
  );

  // ---- database
  const db = env.DATABASE_URL;
  if (!has(db)) {
    out.push(r("database-url", "fail", "DATABASE_URL is missing", "Use the Neon POOLED connection string in Vercel."));
  } else if (!/^postgres(ql)?:\/\//.test(db!)) {
    out.push(r("database-url", "fail", "DATABASE_URL is not a PostgreSQL URL (postgresql://...)"));
  } else {
    let host = "";
    let query = "";
    try {
      const u = new URL(db!);
      host = u.hostname;
      query = u.search;
    } catch {
      out.push(r("database-url", "fail", "DATABASE_URL cannot be parsed as a URL", "Special characters in the password must be URL-encoded."));
    }
    if (host) {
      const local = host === "localhost" || host === "127.0.0.1" || host === "::1";
      if (isHosted(target) && local) {
        out.push(r("database-url", "fail", `DATABASE_URL points at ${host}, which is not reachable from Vercel`, "Use your Neon connection string."));
      } else {
        out.push(r("database-url", "pass", `DATABASE_URL is a PostgreSQL URL (host ${local ? "local" : "remote"})`));
      }
      if (isHosted(target) && !local) {
        out.push(/sslmode=(require|verify-full|verify-ca)/.test(query)
          ? r("database-ssl", "pass", "Database connection requires SSL")
          : r("database-ssl", "warn", "DATABASE_URL has no sslmode=require", "Neon strings include ?sslmode=require. Keep it so traffic is encrypted."));
        out.push(host.includes("-pooler")
          ? r("database-pooled", "pass", "DATABASE_URL uses the pooled (-pooler) host")
          : r("database-pooled", "warn", "DATABASE_URL is not the pooled host", "Fine for 2 users, but serverless apps normally use Neon's pooled string (see docs/DEPLOY.md 6b)."));
      }
    }
  }
  const direct = env.DIRECT_URL;
  if (isHosted(target)) {
    if (!has(direct)) out.push(r("direct-url", "warn", "DIRECT_URL is not set", "Needed only to run migrations from your computer."));
    else if (/-pooler/.test(direct!)) out.push(r("direct-url", "fail", "DIRECT_URL uses the pooled host", "Migrations must use the DIRECT (non-pooled) string."));
    else out.push(r("direct-url", "pass", "DIRECT_URL is a direct (non-pooled) string"));
  }
  if (has(env.DB_POOL_MAX) && !(Number(env.DB_POOL_MAX) >= 1 && Number(env.DB_POOL_MAX) <= 10)) {
    out.push(r("db-pool", "warn", "DB_POOL_MAX should be a number between 1 and 10", "Each serverless instance opens its own pool."));
  }

  // ---- session secret
  const s = env.SESSION_SECRET;
  if (!has(s)) out.push(r("session-secret", "fail", "SESSION_SECRET is missing", "Generate one: openssl rand -base64 32"));
  else if (s!.length < 32) out.push(r("session-secret", "fail", `SESSION_SECRET is too short (${s!.length} chars, need 32+)`, "openssl rand -base64 32"));
  else if (KNOWN_BAD_SECRET.test(s!)) out.push(r("session-secret", "fail", "SESSION_SECRET looks like a placeholder or CI value", "Generate a fresh random one for this environment."));
  else if (new Set(s).size < 12) out.push(r("session-secret", "warn", "SESSION_SECRET has very little variety", "Use openssl rand -base64 32."));
  else out.push(r("session-secret", "pass", "SESSION_SECRET is set and long enough"));

  // ---- photo storage
  const sp = env.STORAGE_PROVIDER || "local";
  if (isHosted(target) && sp !== "r2") {
    out.push(r("storage-provider", "fail", `STORAGE_PROVIDER is "${sp}" but Vercel has no persistent disk`, 'Set STORAGE_PROVIDER="r2".'));
  } else if (!["local", "r2"].includes(sp)) {
    out.push(r("storage-provider", "fail", `STORAGE_PROVIDER "${sp}" is not "local" or "r2"`));
  } else {
    out.push(r("storage-provider", "pass", `STORAGE_PROVIDER is "${sp}"`));
  }
  if (sp === "r2") {
    const missing = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"].filter((k) => !has(env[k]));
    out.push(missing.length
      ? r("r2-vars", "fail", `Missing R2 variables: ${missing.join(", ")}`, "Cloudflare dashboard > R2 > API tokens.")
      : r("r2-vars", "pass", "All four R2 variables are set"));
    if (has(env.R2_ACCOUNT_ID) && !/^[0-9a-f]{32}$/i.test(env.R2_ACCOUNT_ID!)) {
      out.push(r("r2-account-id", "warn", "R2_ACCOUNT_ID is not 32 hex characters", "Copy the Account ID from the Cloudflare dashboard."));
    }
  }

  // ---- mock login
  const dev = env.ALLOW_DEV_LOGIN;
  if (target === "production" && has(dev)) {
    out.push(r("dev-login", "fail", "ALLOW_DEV_LOGIN is set in Production", "Remove it. The code ignores it in Production, but it signals a mix-up between environments."));
  } else if (target === "preview" && dev === "true") {
    out.push(r("dev-login", "warn", "Mock login is ON for Preview", "Only acceptable if Vercel Authentication protects Preview deployments (Settings > Deployment Protection)."));
  } else {
    out.push(r("dev-login", "pass", "Mock login flag is not enabled here"));
  }

  // ---- public URL
  const url = env.NEXT_PUBLIC_APP_URL;
  if (target === "production") {
    if (!has(url) || !/^https:\/\//.test(url!) || /localhost|127\.0\.0\.1/.test(url!)) {
      out.push(r("app-url", "fail", "NEXT_PUBLIC_APP_URL must be your https production URL", "For example https://keepmemoryiceandjapan.vercel.app"));
    } else out.push(r("app-url", "pass", "NEXT_PUBLIC_APP_URL is an https URL"));
  }

  // ---- secrets leaking into the browser bundle
  const leaks = Object.keys(env).filter((k) => SECRET_LIKE_PUBLIC.test(k) && has(env[k]));
  out.push(leaks.length
    ? r("public-secrets", "fail", `Secret-looking variable(s) exposed to the browser: ${leaks.join(", ")}`, "Variables starting with NEXT_PUBLIC_ are shipped to every visitor. Rename them.")
    : r("public-secrets", "pass", "No secret-looking NEXT_PUBLIC_ variables"));

  // ---- optional features
  if ((env.AI_PROVIDER || "mock") !== "mock" && !has(env.AI_API_KEY)) {
    out.push(r("ai", "fail", `AI_PROVIDER is "${env.AI_PROVIDER}" but AI_API_KEY is missing`));
  }
  const line = ["LINE_CHANNEL_ID", "LINE_CHANNEL_SECRET", "LINE_LIFF_ID"].every((k) => has(env[k]));
  if (target === "production" && !line) {
    out.push(r("line", "warn", "LINE is not configured", "Expected until milestone M7. Production has no way to log in until then."));
  }

  return out;
}

export const summarize = (results: Result[]) => ({
  pass: results.filter((x) => x.level === "pass").length,
  warn: results.filter((x) => x.level === "warn").length,
  fail: results.filter((x) => x.level === "fail").length,
});
