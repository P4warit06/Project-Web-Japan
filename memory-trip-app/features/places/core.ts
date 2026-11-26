// Place data logic. Pure of Next.js: `db` and `coupleSpaceId` are arguments so tests can
// prove tenant isolation. Every query is scoped through the trip's coupleSpaceId.
import type { Db } from "@/lib/db-client";
import { PAGE_SIZE, toPage } from "@/features/common/pagination";
import type { Page } from "@/features/common/types";
import type { PlaceDTO, PlaceWithTrip } from "./types";

export type PlaceInput = {
  name: string;
  address: string | null;
  note: string | null;
  latitude: number | null;
  longitude: number | null;
};

type PlaceRow = {
  id: string;
  tripId: string;
  name: string;
  address: string | null;
  note: string | null;
  latitude: number | null;
  longitude: number | null;
};

export const placeSelect = {
  id: true,
  tripId: true,
  name: true,
  address: true,
  note: true,
  latitude: true,
  longitude: true,
} as const;

export function toPlaceDTO(p: PlaceRow): PlaceDTO {
  return {
    id: p.id,
    tripId: p.tripId,
    name: p.name,
    address: p.address,
    note: p.note,
    latitude: p.latitude,
    longitude: p.longitude,
  };
}

export async function listPlacesFor(
  db: Db,
  coupleSpaceId: string,
  cursor?: string,
): Promise<Page<PlaceWithTrip>> {
  const where = { trip: { coupleSpaceId } };
  if (cursor && !(await db.place.findFirst({ where: { id: cursor, ...where }, select: { id: true } }))) {
    return { items: [], nextCursor: null };
  }
  const rows = await db.place.findMany({
    where,
    select: { ...placeSelect, trip: { select: { title: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  return toPage(rows, (p) => ({ ...toPlaceDTO(p), tripTitle: p.trip.title }));
}

/** Returns the new id, or null if the trip is not in this couple space. */
export async function createPlaceFor(
  db: Db,
  coupleSpaceId: string,
  tripId: string,
  input: PlaceInput,
): Promise<string | null> {
  const trip = await db.trip.findFirst({
    where: { id: tripId, coupleSpaceId },
    select: { id: true },
  });
  if (!trip) return null;
  const place = await db.place.create({
    data: { ...input, tripId },
    select: { id: true },
  });
  return place.id;
}

/** Returns the trip id (for redirects), or null if not found in this couple space. */
export async function updatePlaceFor(
  db: Db,
  coupleSpaceId: string,
  id: string,
  input: PlaceInput,
): Promise<string | null> {
  const place = await db.place.findFirst({
    where: { id, trip: { coupleSpaceId } },
    select: { tripId: true },
  });
  if (!place) return null;
  await db.place.update({ where: { id }, data: input });
  return place.tripId;
}

/** Returns the trip id (for redirects), or null if not found in this couple space. */
export async function deletePlaceFor(
  db: Db,
  coupleSpaceId: string,
  id: string,
): Promise<string | null> {
  const place = await db.place.findFirst({
    where: { id, trip: { coupleSpaceId } },
    select: { tripId: true },
  });
  if (!place) return null;
  await db.place.delete({ where: { id } });
  return place.tripId;
}
