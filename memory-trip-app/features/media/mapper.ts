import { fullUrl, thumbUrl } from "./urls";
import type { MediaDTO } from "./types";

export const mediaSelect = {
  id: true,
  tripId: true,
  memoryEntryId: true,
  width: true,
  height: true,
  createdAt: true,
} as const;

type MediaRow = {
  id: string;
  tripId: string;
  memoryEntryId: string | null;
  width: number;
  height: number;
  createdAt: Date;
};

export function toMediaDTO(m: MediaRow): MediaDTO {
  return {
    id: m.id,
    tripId: m.tripId,
    memoryId: m.memoryEntryId,
    width: m.width,
    height: m.height,
    createdAt: m.createdAt.toISOString(),
    thumbUrl: thumbUrl(m.id),
    fullUrl: fullUrl(m.id),
  };
}
