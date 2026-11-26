// Dates are ISO strings (trip dates: "YYYY-MM-DD"). Never Date objects, so they can
// cross the server/client boundary safely.
import type { MemoryDTO } from "@/features/memories/types";
import type { PlaceDTO } from "@/features/places/types";

export type TripSummary = {
  id: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  placeCount: number;
  memoryCount: number;
};

export type TripDetail = TripSummary & {
  description: string | null;
  places: PlaceDTO[];
  memories: MemoryDTO[]; // newest first, max 100
};
