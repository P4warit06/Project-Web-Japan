import "server-only";
import { requireMember } from "@/features/auth/dal";
import type { Page } from "@/features/common/types";
import { db } from "@/lib/db";
import { getTripFor, listTripsFor } from "./core";
import type { TripDetail, TripSummary } from "./types";

/** Newest start date first. Scoped to the logged-in couple automatically. */
export async function listTrips(cursor?: string): Promise<Page<TripSummary>> {
  const { coupleSpaceId } = await requireMember();
  return listTripsFor(db, coupleSpaceId, cursor);
}

/** Returns null if missing OR belongs to another couple. Pages should call notFound(). */
export async function getTrip(tripId: string): Promise<TripDetail | null> {
  const { coupleSpaceId } = await requireMember();
  return getTripFor(db, coupleSpaceId, tripId);
}
