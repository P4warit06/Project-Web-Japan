// Optimistic check only: "is there a session cookie?". It does NOT prove the session is
// valid. Real authorization happens in features/auth/dal.ts (requireMember) on every request.
// Next 16 renamed middleware -> proxy: node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasCookie = request.cookies.has(SESSION_COOKIE);

  if (!hasCookie && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Skip Next internals and files with an extension (favicon, images, fonts).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
