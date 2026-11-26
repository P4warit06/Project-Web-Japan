import "server-only";
import type { Page } from "@/features/common/types";
import type { MediaWithTrip } from "./types";

/** Newest first. Optional tripId filter. Scoped to the logged-in couple automatically. */
export async function listMedia(_opts?: { tripId?: string; cursor?: string }): Promise<Page<MediaWithTrip>> {
  throw new Error("not implemented yet (backend in progress)");
}

/** Null if missing OR owned by another couple. Pages should call notFound(). */
export async function getMedia(_id: string): Promise<MediaWithTrip | null> {
  throw new Error("not implemented yet (backend in progress)");
}
