import "server-only";
// Data Access Layer for identity. EVERY page, Server Action and Route Handler that touches
// private data must call requireMember(); proxy.ts is only an optimistic redirect.
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isDevLoginAllowed } from "./dev-login";
import { readSession } from "./session";

export type CurrentUser = { id: string; displayName: string; coupleSpaceId: string };

/** Current logged-in user, or null. Memoized per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await readSession();
  if (!session) return null;

  // Single-couple app: a user belongs to at most one couple space.
  const membership = await db.coupleMember.findFirst({
    where: { userId: session.userId },
    select: {
      coupleSpaceId: true,
      user: { select: { id: true, displayName: true } },
    },
  });
  if (!membership) return null;

  return {
    id: membership.user.id,
    displayName: membership.user.displayName,
    coupleSpaceId: membership.coupleSpaceId,
  };
});

/** Use at the top of every private page/action. Redirects to /login when not signed in. */
export async function requireMember(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Dev-only: users the login page may offer. [] unless the mock login is allowed (see dev-login.ts). */
export async function listDevUsers(): Promise<{ id: string; displayName: string }[]> {
  if (!isDevLoginAllowed()) return [];
  const members = await db.coupleMember.findMany({
    select: { user: { select: { id: true, displayName: true } } },
    orderBy: { user: { displayName: "asc" } },
  });
  return members.map((m) => m.user);
}
