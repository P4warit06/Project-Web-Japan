import "server-only";
import { requireMember } from "@/features/auth/dal";
import { db } from "@/lib/db";
import { getDashboardFor } from "./core";
import type { Dashboard } from "./types";

export async function getDashboard(): Promise<Dashboard> {
  const { coupleSpaceId } = await requireMember();
  return getDashboardFor(db, coupleSpaceId);
}
