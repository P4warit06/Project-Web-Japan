// Dates are ISO strings (trip dates: "YYYY-MM-DD"). Never Date objects, so they can
// cross the server/client boundary safely.
import type { MediaDTO } from "@/features/media/types";
import type { MemoryDTO } from "@/features/memories/types";
import type { PlaceDTO } from "@/features/places/types";

export type TripSummary = {
  id: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  placeCount: number;
  memoryCount: number;
  /** Thumbnail URL of the cover photo, or null when none is set. */
  coverThumbUrl: string | null;
};

export type TripDetail = TripSummary & {
  description: string | null;
  places: PlaceDTO[];
  memories: MemoryDTO[]; // newest first, max 100
  /** All photos of this trip, newest first, max 200. */
  media: MediaDTO[];
};
