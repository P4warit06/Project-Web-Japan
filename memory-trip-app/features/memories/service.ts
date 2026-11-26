import "server-only";
import { requireMember } from "@/features/auth/dal";
import type { Page } from "@/features/common/types";
import { db } from "@/lib/db";
import { getMemoryFor, listMemoriesFor } from "./core";
import type { MemoryDTO } from "./types";

/** Newest first (happenedAt desc). Optional tripId filter. */
export async function listMemories(opts?: { tripId?: string; cursor?: string }): Promise<Page<MemoryDTO>> {
  const { coupleSpaceId } = await requireMember();
  return listMemoriesFor(db, coupleSpaceId, opts);
}

export async function getMemory(memoryId: string): Promise<MemoryDTO | null> {
  const { coupleSpaceId } = await requireMember();
  return getMemoryFor(db, coupleSpaceId, memoryId);
}
