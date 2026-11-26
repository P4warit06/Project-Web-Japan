import "server-only";
import { requireMember } from "@/features/auth/dal";
import type { Page } from "@/features/common/types";
import { db } from "@/lib/db";
import { getMediaFor, listMediaFor } from "./core";
import type { MediaWithTrip } from "./types";

/** Newest first. Optional tripId filter. Scoped to the logged-in couple automatically. */
export async function listMedia(opts?: { tripId?: string; cursor?: string }): Promise<Page<MediaWithTrip>> {
  const { coupleSpaceId } = await requireMember();
  return listMediaFor(db, coupleSpaceId, opts);
}

/** Null if missing OR owned by another couple. Pages should call notFound(). */
export async function getMedia(id: string): Promise<MediaWithTrip | null> {
  const { coupleSpaceId } = await requireMember();
  return getMediaFor(db, coupleSpaceId, id);
}
