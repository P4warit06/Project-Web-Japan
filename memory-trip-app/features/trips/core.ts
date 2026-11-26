// Trip data logic (see places/core.ts for the design notes).
import type { Db } from "@/lib/db-client";
import { PAGE_SIZE, toPage } from "@/features/common/pagination";
import type { Page } from "@/features/common/types";
import { mediaSelect, toMediaDTO } from "@/features/media/mapper";
import { thumbUrl } from "@/features/media/urls";
import { memorySelect, pruneUnusedTags, toMemoryDTO } from "@/features/memories/core";
import { placeSelect, toPlaceDTO } from "@/features/places/core";
import type { TripDetail, TripSummary } from "./types";

export type TripInput = {
  title: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
};

const dateOnly = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

const summarySelect = {
  id: true,
  title: true,
  startDate: true,
  endDate: true,
  coverMediaId: true,
  _count: { select: { places: true, memories: true } },
} as const;

type SummaryRow = {
  id: string;
  title: string;
  startDate: Date | null;
  endDate: Date | null;
  coverMediaId: string | null;
  _count: { places: number; memories: number };
};

export function toTripSummary(t: SummaryRow): TripSummary {
  return {
    id: t.id,
    title: t.title,
    startDate: dateOnly(t.startDate),
    endDate: dateOnly(t.endDate),
    placeCount: t._count.places,
    memoryCount: t._count.memories,
    coverThumbUrl: t.coverMediaId ? thumbUrl(t.coverMediaId) : null,
  };
}

// Trips without a start date go last on SQLite AND PostgreSQL (their NULL order differs).
const tripOrder = [
  { startDate: { sort: "desc", nulls: "last" } },
  { createdAt: "desc" },
  { id: "desc" },
] as const;

export async function listTripsFor(
  db: Db,
  coupleSpaceId: string,
  cursor?: string,
): Promise<Page<TripSummary>> {
  if (cursor && !(await db.trip.findFirst({ where: { id: cursor, coupleSpaceId }, select: { id: true } }))) {
    return { items: [], nextCursor: null };
  }
  const rows = await db.trip.findMany({
    where: { coupleSpaceId },
    select: summarySelect,
    orderBy: [...tripOrder],
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  return toPage(rows, toTripSummary);
}

export async function getTripFor(
  db: Db,
  coupleSpaceId: string,
  tripId: string,
): Promise<TripDetail | null> {
  const t = await db.trip.findFirst({
    where: { id: tripId, coupleSpaceId },
    select: {
      ...summarySelect,
      description: true,
      places: { select: placeSelect, orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
      memories: {
        select: memorySelect,
        orderBy: [{ happenedAt: "desc" }, { id: "desc" }],
        take: 100,
      },
      media: {
        select: mediaSelect,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 200,
      },
    },
  });
  if (!t) return null;
  return {
    ...toTripSummary(t),
    description: t.description,
    places: t.places.map(toPlaceDTO),
    memories: t.memories.map(toMemoryDTO),
    media: t.media.map(toMediaDTO),
  };
}

export async function createTripFor(
  db: Db,
  coupleSpaceId: string,
  input: TripInput,
): Promise<string> {
  const trip = await db.trip.create({
    data: { ...input, coupleSpaceId },
    select: { id: true },
  });
  return trip.id;
}

/** Returns false if the trip is not in this couple space. */
export async function updateTripFor(
  db: Db,
  coupleSpaceId: string,
  id: string,
  input: TripInput,
): Promise<boolean> {
  const { count } = await db.trip.updateMany({ where: { id, coupleSpaceId }, data: input });
  return count > 0;
}

/** Deletes the trip with its places and memories (database cascade). False if not found. */
export async function deleteTripFor(
  db: Db,
  coupleSpaceId: string,
  id: string,
): Promise<boolean> {
  const deleted = await db.$transaction(async (tx) => {
    const { count } = await tx.trip.deleteMany({ where: { id, coupleSpaceId } });
    if (count > 0) await pruneUnusedTags(tx, coupleSpaceId);
    return count > 0;
  });
  return deleted;
}
