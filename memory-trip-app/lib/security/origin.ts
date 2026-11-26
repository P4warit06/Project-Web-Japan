/** CSRF defence for cookie-authenticated POST routes: the browser always sends `Origin`
 *  on POST, so require it to match the host the request was addressed to. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Only allow redirects to paths on this site: "/trips/abc", never "//evil.com" or "https://...". */
export function safeReturnTo(value: unknown, fallback: string): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 200) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  return value;
}
