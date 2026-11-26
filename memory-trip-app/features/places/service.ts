import "server-only";
import { requireMember } from "@/features/auth/dal";
import type { Page } from "@/features/common/types";
import { db } from "@/lib/db";
import { listPlacesFor } from "./core";
import type { PlaceWithTrip } from "./types";

export async function listPlaces(cursor?: string): Promise<Page<PlaceWithTrip>> {
  const { coupleSpaceId } = await requireMember();
  return listPlacesFor(db, coupleSpaceId, cursor);
}
