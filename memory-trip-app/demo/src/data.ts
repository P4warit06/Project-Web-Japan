// The demo's whole "database": plain data plus pure functions. No React, no browser APIs,
// so it is unit-tested (tests/demo-data.test.ts). Shapes match the real app's DTOs
// (features/*/types.ts), which is what lets the demo reuse the real UI components.
import type { Dashboard } from "@/features/dashboard/types";
import type { MediaDTO, MediaWithTrip } from "@/features/media/types";
import type { MemoryDTO, Mood } from "@/features/memories/types";
import type { PlaceDTO, PlaceWithTrip } from "@/features/places/types";
import type { TripDetail, TripSummary } from "@/features/trips/types";

export type TripRec = {
  id: string;
  title: string;
  description: string | null;
  startDate: string | null; // "YYYY-MM-DD"
  endDate: string | null;
  coverMediaId: string | null;
  createdAt: string;
};
export type PlaceRec = Omit<PlaceDTO, "tripId"> & { tripId: string; createdAt: string };
export type MemoryRec = {
  id: string;
  tripId: string;
  title: string;
  content: string;
  happenedAt: string; // ISO datetime, floating (read as UTC)
  mood: Mood | null;
  tags: string[];
  createdAt: string;
};
export type MediaRec = MediaDTO;

export type DemoState = {
  version: 1;
  trips: TripRec[];
  places: PlaceRec[];
  memories: MemoryRec[];
  media: MediaRec[];
};

export const STATE_VERSION = 1;
export const emptyState = (): DemoState => ({ version: 1, trips: [], places: [], memories: [], media: [] });

// ---- small helpers ----------------------------------------------------------

const byDesc = <T,>(key: (x: T) => string) => (a: T, b: T) => (key(a) < key(b) ? 1 : key(a) > key(b) ? -1 : 0);

const thumbOf = (m: MediaRec) => m.thumbUrl;

// ---- reading ----------------------------------------------------------------

function summary(s: DemoState, t: TripRec): TripSummary {
  const cover = t.coverMediaId ? s.media.find((m) => m.id === t.coverMediaId) : undefined;
  return {
    id: t.id,
    title: t.title,
    startDate: t.startDate,
    endDate: t.endDate,
    placeCount: s.places.filter((p) => p.tripId === t.id).length,
    memoryCount: s.memories.filter((m) => m.tripId === t.id).length,
    coverThumbUrl: cover ? thumbOf(cover) : null,
  };
}

/** Newest trips first; trips without a start date go last (same rule as the real app). */
function sortedTrips(s: DemoState): TripRec[] {
  return [...s.trips].sort((a, b) => {
    if (a.startDate && !b.startDate) return -1;
    if (!a.startDate && b.startDate) return 1;
    return byDesc<TripRec>((x) => `${x.startDate ?? ""}|${x.createdAt}|${x.id}`)(a, b);
  });
}

export const listTrips = (s: DemoState): TripSummary[] => sortedTrips(s).map((t) => summary(s, t));

function memoryDto(s: DemoState, m: MemoryRec): MemoryDTO {
  return {
    id: m.id,
    tripId: m.tripId,
    tripTitle: s.trips.find((t) => t.id === m.tripId)?.title ?? "",
    title: m.title,
    content: m.content,
    happenedAt: m.happenedAt,
    mood: m.mood,
    tags: m.tags,
    media: s.media.filter((x) => x.memoryId === m.id).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)),
  };
}

const placeDto = (p: PlaceRec): PlaceDTO => ({
  id: p.id,
  tripId: p.tripId,
  name: p.name,
  address: p.address,
  note: p.note,
  latitude: p.latitude,
  longitude: p.longitude,
});

export function getTrip(s: DemoState, id: string): TripDetail | null {
  const t = s.trips.find((x) => x.id === id);
  if (!t) return null;
  return {
    ...summary(s, t),
    description: t.description,
    places: s.places
      .filter((p) => p.tripId === id)
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
      .map(placeDto),
    memories: s.memories
      .filter((m) => m.tripId === id)
      .sort(byDesc((m) => m.happenedAt))
      .map((m) => memoryDto(s, m)),
    media: s.media.filter((m) => m.tripId === id).sort(byDesc((m) => m.createdAt)),
  };
}

export const listMemories = (s: DemoState): MemoryDTO[] =>
  [...s.memories].sort(byDesc((m) => m.happenedAt)).map((m) => memoryDto(s, m));

export function getMemory(s: DemoState, id: string): MemoryDTO | null {
  const m = s.memories.find((x) => x.id === id);
  return m ? memoryDto(s, m) : null;
}

export const listPlaces = (s: DemoState): PlaceWithTrip[] =>
  [...s.places].sort(byDesc((p) => p.createdAt)).map((p) => ({
    ...placeDto(p),
    tripTitle: s.trips.find((t) => t.id === p.tripId)?.title ?? "",
  }));

export function listMedia(s: DemoState, tripId?: string): MediaWithTrip[] {
  return s.media
    .filter((m) => !tripId || m.tripId === tripId)
    .sort(byDesc((m) => m.createdAt))
    .map((m) => ({ ...m, tripTitle: s.trips.find((t) => t.id === m.tripId)?.title ?? "" }));
}

export function getMedia(s: DemoState, id: string): MediaWithTrip | null {
  const m = s.media.find((x) => x.id === id);
  return m ? { ...m, tripTitle: s.trips.find((t) => t.id === m.tripId)?.title ?? "" } : null;
}

export function dashboard(s: DemoState): Dashboard {
  return {
    latestTrips: listTrips(s).slice(0, 3),
    recentMemories: listMemories(s).slice(0, 5),
    counts: { trips: s.trips.length, places: s.places.length, memories: s.memories.length },
  };
}

// ---- writing (each returns a NEW state; the input is never changed) -----------

export type TripInput = {
  title: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
};
export type PlaceInput = {
  name: string;
  address: string | null;
  note: string | null;
  latitude: number | null;
  longitude: number | null;
};
export type MemoryInput = {
  title: string;
  content: string;
  happenedAt: Date;
  mood: Mood | null;
  tags: string[];
};

const dateOnly = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
type Stamp = { id: string; now: string };

export function createTrip(s: DemoState, input: TripInput, { id, now }: Stamp): DemoState {
  const trip: TripRec = {
    id,
    title: input.title,
    description: input.description,
    startDate: dateOnly(input.startDate),
    endDate: dateOnly(input.endDate),
    coverMediaId: null,
    createdAt: now,
  };
  return { ...s, trips: [...s.trips, trip] };
}

export function updateTrip(s: DemoState, id: string, input: TripInput): DemoState | null {
  if (!s.trips.some((t) => t.id === id)) return null;
  return {
    ...s,
    trips: s.trips.map((t) =>
      t.id === id
        ? { ...t, title: input.title, description: input.description, startDate: dateOnly(input.startDate), endDate: dateOnly(input.endDate) }
        : t,
    ),
  };
}

/** Removes the trip and everything inside it (places, memories, photos). */
export function deleteTrip(s: DemoState, id: string): DemoState {
  return {
    ...s,
    trips: s.trips.filter((t) => t.id !== id),
    places: s.places.filter((p) => p.tripId !== id),
    memories: s.memories.filter((m) => m.tripId !== id),
    media: s.media.filter((m) => m.tripId !== id),
  };
}

export function createPlace(s: DemoState, tripId: string, input: PlaceInput, { id, now }: Stamp): DemoState | null {
  if (!s.trips.some((t) => t.id === tripId)) return null;
  return { ...s, places: [...s.places, { id, tripId, createdAt: now, ...input }] };
}

export function updatePlace(s: DemoState, id: string, input: PlaceInput): { state: DemoState; tripId: string } | null {
  const place = s.places.find((p) => p.id === id);
  if (!place) return null;
  return { state: { ...s, places: s.places.map((p) => (p.id === id ? { ...p, ...input } : p)) }, tripId: place.tripId };
}

export function deletePlace(s: DemoState, id: string): { state: DemoState; tripId: string | null } {
  const place = s.places.find((p) => p.id === id);
  return { state: { ...s, places: s.places.filter((p) => p.id !== id) }, tripId: place?.tripId ?? null };
}

export function createMemory(s: DemoState, tripId: string, input: MemoryInput, { id, now }: Stamp): DemoState | null {
  if (!s.trips.some((t) => t.id === tripId)) return null;
  const memory: MemoryRec = {
    id,
    tripId,
    title: input.title,
    content: input.content,
    happenedAt: input.happenedAt.toISOString(),
    mood: input.mood,
    tags: input.tags,
    createdAt: now,
  };
  return { ...s, memories: [...s.memories, memory] };
}

export function updateMemory(s: DemoState, id: string, input: MemoryInput): { state: DemoState; tripId: string } | null {
  const memory = s.memories.find((m) => m.id === id);
  if (!memory) return null;
  const next: MemoryRec = {
    ...memory,
    title: input.title,
    content: input.content,
    happenedAt: input.happenedAt.toISOString(),
    mood: input.mood,
    tags: input.tags,
  };
  return { state: { ...s, memories: s.memories.map((m) => (m.id === id ? next : m)) }, tripId: memory.tripId };
}

/** Photos of a deleted memory stay in the trip (they just lose the link), like the real app. */
export function deleteMemory(s: DemoState, id: string): { state: DemoState; tripId: string | null } {
  const memory = s.memories.find((m) => m.id === id);
  return {
    state: {
      ...s,
      memories: s.memories.filter((m) => m.id !== id),
      media: s.media.map((m) => (m.memoryId === id ? { ...m, memoryId: null } : m)),
    },
    tripId: memory?.tripId ?? null,
  };
}

export function addMedia(s: DemoState, media: MediaRec): DemoState | null {
  if (!s.trips.some((t) => t.id === media.tripId)) return null;
  if (media.memoryId) {
    const memory = s.memories.find((m) => m.id === media.memoryId);
    if (!memory || memory.tripId !== media.tripId) return null; // a photo can only join a memory of its own trip
  }
  return { ...s, media: [...s.media, media] };
}

export function deleteMedia(s: DemoState, id: string): DemoState {
  return {
    ...s,
    media: s.media.filter((m) => m.id !== id),
    trips: s.trips.map((t) => (t.coverMediaId === id ? { ...t, coverMediaId: null } : t)),
  };
}

/** `mediaId` null removes the cover. The photo must belong to that trip. */
export function setCover(s: DemoState, tripId: string, mediaId: string | null): DemoState | null {
  if (!s.trips.some((t) => t.id === tripId)) return null;
  if (mediaId && !s.media.some((m) => m.id === mediaId && m.tripId === tripId)) return null;
  return { ...s, trips: s.trips.map((t) => (t.id === tripId ? { ...t, coverMediaId: mediaId } : t)) };
}

// ---- loading from storage ----------------------------------------------------

const isArr = Array.isArray;
const isDataImage = (v: unknown) => typeof v === "string" && /^data:image\/(svg\+xml|jpeg|png|webp)[;,]/.test(v);

/** Accepts saved data only if it looks right. Anything else (old version, hand-edited,
 *  corrupted) returns null and the caller starts again from the sample data. */
export function parseState(raw: unknown): DemoState | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Partial<DemoState>;
  if (s.version !== STATE_VERSION || !isArr(s.trips) || !isArr(s.places) || !isArr(s.memories) || !isArr(s.media)) {
    return null;
  }
  const okTrips = s.trips.every((t) => t && typeof t.id === "string" && typeof t.title === "string");
  const okPlaces = s.places.every((p) => p && typeof p.id === "string" && typeof p.tripId === "string");
  const okMemories = s.memories.every(
    (m) => m && typeof m.id === "string" && typeof m.tripId === "string" && isArr(m.tags) && typeof m.happenedAt === "string",
  );
  const okMedia = s.media.every((m) => m && typeof m.id === "string" && isDataImage(m.thumbUrl) && isDataImage(m.fullUrl));
  return okTrips && okPlaces && okMemories && okMedia ? (s as DemoState) : null;
}
