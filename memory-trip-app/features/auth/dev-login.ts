/** When the mock "pick a user" login may exist.
 *  - Local development and tests: yes.
 *  - Vercel Preview deployments: only if ALLOW_DEV_LOGIN=true (those are behind Vercel's own login).
 *  - Production: NEVER, whatever the variables say. Real login arrives with LINE (milestone M7). */
export function isDevLoginAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.VERCEL_ENV === "production") return false;
  if (env.NODE_ENV !== "production") return true;
  return env.ALLOW_DEV_LOGIN === "true" && env.VERCEL_ENV === "preview";
}
