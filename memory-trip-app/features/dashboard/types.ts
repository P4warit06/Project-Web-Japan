import type { MemoryDTO } from "@/features/memories/types";
import type { TripSummary } from "@/features/trips/types";

export type Dashboard = {
  latestTrips: TripSummary[]; // max 3
  recentMemories: MemoryDTO[]; // max 5
  counts: { trips: number; places: number; memories: number };
};
