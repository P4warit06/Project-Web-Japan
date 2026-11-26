// Photo data logic. Pure of Next.js: db, storage and the couple space are arguments, so tests
// can prove tenant isolation and that files are really removed.
import { randomUUID } from "node:crypto";
import { PAGE_SIZE, toPage } from "@/features/common/pagination";
import type { Page } from "@/features/common/types";
import type { Db } from "@/lib/db-client";
import type { StorageProvider } from "@/lib/storage/types";
import { MediaError } from "./errors";
import { processImage } from "./image";
import { mediaSelect, toMediaDTO } from "./mapper";
import type { MediaDTO, MediaWithTrip } from "./types";

export type MediaCtx = { coupleSpaceId: string; userId: string };

const withTrip = { ...mediaSelect, trip: { select: { title: true } } } as const;

function toMediaWithTrip(row: Parameters<typeof toMediaDTO>[0] & { trip: { title: string } }): MediaWithTrip {
  return { ...toMediaDTO(row), tripTitle: row.trip.title };
}

/** Validates, re-encodes and stores one photo. Throws MediaError for expected failures. */
export async function createMediaFor(
  db: Db,
  storage: StorageProvider,
  ctx: MediaCtx,
  input: { tripId: string; memoryId: string | null; file: Buffer },
): Promise<MediaDTO> {
  const trip = await db.trip.findFirst({
    where: { id: input.tripId, coupleSpaceId: ctx.coupleSpaceId },
    select: { id: true, coverMediaId: true },
  });
  if (!trip) throw new MediaError("errors.notFound", 404);

  if (input.memoryId) {
    const memory = await db.memoryEntry.findFirst({
      where: { id: input.memoryId, tripId: trip.id },
      select: { id: true },
    });
    if (!memory) throw new MediaError("errors.notFound", 404);
  }

  const image = await processImage(input.file);

  // Random keys: the original file name is never used for storage (no path tricks, no leaks).
  const base = `${ctx.coupleSpaceId}/${randomUUID()}`;
  const storageKey = `${base}.webp`;
  const thumbnailKey = `${base}-thumb.webp`;

  await storage.put(storageKey, image.full, image.mimeType);
  try {
    await storage.put(thumbnailKey, image.thumb, image.mimeType);
    const row = await db.mediaAsset.create({
      data: {
        coupleSpaceId: ctx.coupleSpaceId,
        tripId: trip.id,
        memoryEntryId: input.memoryId,
        uploadedById: ctx.userId,
        storageKey,
        thumbnailKey,
        mimeType: image.mimeType,
        sizeBytes: image.full.length,
        width: image.width,
        height: image.height,
      },
      select: mediaSelect,
    });
    // The first photo of a trip becomes its cover automatically.
    if (!trip.coverMediaId) {
      await db.trip.update({ where: { id: trip.id }, data: { coverMediaId: row.id } });
    }
    return toMediaDTO(row);
  } catch (err) {
    await Promise.allSettled([storage.delete(storageKey), storage.delete(thumbnailKey)]);
    throw err;
  }
}

export async function listMediaFor(
  db: Db,
  coupleSpaceId: string,
  opts: { tripId?: string; cursor?: string } = {},
): Promise<Page<MediaWithTrip>> {
  const where = { coupleSpaceId, ...(opts.tripId ? { tripId: opts.tripId } : {}) };
  if (opts.cursor && !(await db.mediaAsset.findFirst({ where: { id: opts.cursor, ...where }, select: { id: true } }))) {
    return { items: [], nextCursor: null };
  }
  const rows = await db.mediaAsset.findMany({
    where,
    select: withTrip,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
  });
  return toPage(rows, toMediaWithTrip);
}

export async function getMediaFor(db: Db, coupleSpaceId: string, id: string): Promise<MediaWithTrip | null> {
  const row = await db.mediaAsset.findFirst({ where: { id, coupleSpaceId }, select: withTrip });
  return row ? toMediaWithTrip(row) : null;
}

/** Image bytes for the authenticated route. Null if missing OR not in this couple space. */
export async function readMediaFileFor(
  db: Db,
  storage: StorageProvider,
  coupleSpaceId: string,
  id: string,
  size: "thumb" | "full",
): Promise<{ data: Buffer; mimeType: string } | null> {
  const row = await db.mediaAsset.findFirst({
    where: { id, coupleSpaceId },
    select: { storageKey: true, thumbnailKey: true, mimeType: true },
  });
  if (!row) return null;
  const data = await storage.get(size === "thumb" ? row.thumbnailKey : row.storageKey);
  return data ? { data, mimeType: row.mimeType } : null;
}

/** Deletes the row, then its files. Returns the trip id (for redirects) or null if not found. */
export async function deleteMediaFor(
  db: Db,
  storage: StorageProvider,
  coupleSpaceId: string,
  id: string,
): Promise<string | null> {
  const row = await db.mediaAsset.findFirst({
    where: { id, coupleSpaceId },
    select: { tripId: true, storageKey: true, thumbnailKey: true },
  });
  if (!row) return null;
  await db.mediaAsset.delete({ where: { id } }); // trips pointing at it as cover are cleared (SetNull)
  await deleteStoredKeys(storage, [row.storageKey, row.thumbnailKey]);
  return row.tripId;
}

/** Sets (or with mediaId=null clears) the cover. The photo must belong to that trip. */
export async function setTripCoverFor(
  db: Db,
  coupleSpaceId: string,
  tripId: string,
  mediaId: string | null,
): Promise<boolean> {
  const trip = await db.trip.findFirst({ where: { id: tripId, coupleSpaceId }, select: { id: true } });
  if (!trip) return false;
  if (mediaId) {
    const media = await db.mediaAsset.findFirst({
      where: { id: mediaId, tripId, coupleSpaceId },
      select: { id: true },
    });
    if (!media) return false;
  }
  await db.trip.update({ where: { id: tripId }, data: { coverMediaId: mediaId } });
  return true;
}

/** Storage keys of every photo of a trip. Call BEFORE deleting the trip (rows cascade away). */
export async function collectTripMediaKeys(db: Db, coupleSpaceId: string, tripId: string): Promise<string[]> {
  const rows = await db.mediaAsset.findMany({
    where: { tripId, coupleSpaceId },
    select: { storageKey: true, thumbnailKey: true },
  });
  return rows.flatMap((r) => [r.storageKey, r.thumbnailKey]);
}

/** Best effort: a failed delete leaves an orphan file, never a broken request. */
export async function deleteStoredKeys(storage: StorageProvider, keys: string[]): Promise<void> {
  const results = await Promise.allSettled(keys.map((k) => storage.delete(k)));
  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed) console.error(`media: ${failed} stored file(s) could not be deleted`);
}
