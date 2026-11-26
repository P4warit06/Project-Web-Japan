import type { Db } from "@/lib/db-client";
import { memorySelect, toMemoryDTO } from "@/features/memories/core";
import { toTripSummary } from "@/features/trips/core";
import type { Dashboard } from "./types";

export async function getDashboardFor(db: Db, coupleSpaceId: string): Promise<Dashboard> {
  const [trips, memories, tripCount, placeCount, memoryCount] = await Promise.all([
    db.trip.findMany({
      where: { coupleSpaceId },
      select: {
        id: true, title: true, startDate: true, endDate: true, coverMediaId: true,
        _count: { select: { places: true, memories: true } },
      },
      orderBy: [{ startDate: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }, { id: "desc" }],
      take: 3,
    }),
    db.memoryEntry.findMany({
      where: { trip: { coupleSpaceId } },
      select: memorySelect,
      orderBy: [{ happenedAt: "desc" }, { id: "desc" }],
      take: 5,
    }),
    db.trip.count({ where: { coupleSpaceId } }),
    db.place.count({ where: { trip: { coupleSpaceId } } }),
    db.memoryEntry.count({ where: { trip: { coupleSpaceId } } }),
  ]);
  return {
    latestTrips: trips.map(toTripSummary),
    recentMemories: memories.map(toMemoryDTO),
    counts: { trips: tripCount, places: placeCount, memories: memoryCount },
  };
}
