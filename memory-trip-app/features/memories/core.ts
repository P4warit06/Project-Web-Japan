// Memory data logic (see places/core.ts for the design notes).
import type { Prisma } from "@/app/generated/prisma/client";
import type { Db } from "@/lib/db-client";
import { PAGE_SIZE, toPage } from "@/features/common/pagination";
import type { Page } from "@/features/common/types";
import { mediaSelect, toMediaDTO } from "@/features/media/mapper";
import { MOODS, type MemoryDTO, type Mood } from "./types";

export type MemoryInput = {
  title: string;
  content: string;
  happenedAt: Date;
  mood: Mood | null;
  tags: string[]; // already normalized (see normalizeTags)
};

export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 30;

/** Splits "Kyoto, #food ,kyoto" into ["kyoto","food"]. Returns null if too many / too long. */
export function normalizeTags(raw: string): string[] | null {
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const name = part.trim().replace(/^#+/, "").replace(/\s+/g, " ").toLocaleLowerCase();
    if (!name) continue;
    if (name.length > MAX_TAG_LENGTH) return null;
    seen.add(name);
  }
  return seen.size > MAX_TAGS ? null : [...seen];
}

const mediaOrder = [{ createdAt: "asc" }, { id: "asc" }] satisfies Prisma.MediaAssetOrderByWithRelationInput[];

export const memorySelect = {
  id: true,
  tripId: true,
  title: true,
  content: true,
  happenedAt: true,
  mood: true,
  trip: { select: { title: true } },
  tags: { select: { name: true }, orderBy: { name: "asc" } },
  media: { select: mediaSelect, orderBy: mediaOrder },
} as const;

type MemoryRow = {
  id: string;
  tripId: string;
  title: string;
  content: string;
  happenedAt: Date;
  mood: string | null;
  trip: { title: string };
  tags: { name: string }[];
  media: Parameters<typeof toMediaDTO>[0][];
};

export function toMemoryDTO(m: MemoryRow): MemoryDTO {
  return {
    id: m.id,
    tripId: m.tripId,
    tripTitle: m.trip.title,
    title: m.title,
    content: m.content,
    happenedAt: m.happenedAt.toISOString(),
    mood: (MOODS as readonly string[]).includes(m.mood ?? "") ? (m.mood as Mood) : null,
    tags: m.tags.map((t) => t.name),
    media: m.media.map(toMediaDTO),
  };
}

export async function listMemoriesFor(
  db: Db,
  coupleSpaceId: string,
  opts: { tripId?: string; cursor?: string } = {},
): Promise<Page<MemoryDTO>> {
  const where = {
    trip: { coupleSpaceId },
    ...(opts.tripId ? { tripId: opts.tripId } : {}),
  };
  if (opts.cursor && !(await db.memoryEntry.findFirst({ where: { id: opts.cursor, ...where }, select: { id: true } }))) {
    return { items: [], nextCursor: null };
  }
  const rows = await db.memoryEntry.findMany({
    where,
    select: memorySelect,
    orderBy: [{ happenedAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
  });
  return toPage(rows, toMemoryDTO);
}

export async function getMemoryFor(
  db: Db,
  coupleSpaceId: string,
  id: string,
): Promise<MemoryDTO | null> {
  const row = await db.memoryEntry.findFirst({
    where: { id, trip: { coupleSpaceId } },
    select: memorySelect,
  });
  return row ? toMemoryDTO(row) : null;
}

const tagLinks = (coupleSpaceId: string, names: string[]) =>
  names.map((name) => ({
    where: { coupleSpaceId_name: { coupleSpaceId, name } },
    create: { coupleSpaceId, name },
  }));

/** Tags no memory uses any more are removed so the table does not grow forever. */
export async function pruneUnusedTags(db: Pick<Db, "tag">, coupleSpaceId: string) {
  await db.tag.deleteMany({ where: { coupleSpaceId, memories: { none: {} } } });
}

/** Returns the new id, or null if the trip is not in this couple space. */
export async function createMemoryFor(
  db: Db,
  coupleSpaceId: string,
  tripId: string,
  input: MemoryInput,
): Promise<string | null> {
  const trip = await db.trip.findFirst({
    where: { id: tripId, coupleSpaceId },
    select: { id: true },
  });
  if (!trip) return null;
  const { tags, ...data } = input;
  const memory = await db.memoryEntry.create({
    data: { ...data, tripId, tags: { connectOrCreate: tagLinks(coupleSpaceId, tags) } },
    select: { id: true },
  });
  return memory.id;
}

/** Returns the trip id (for redirects), or null if not found in this couple space. */
export async function updateMemoryFor(
  db: Db,
  coupleSpaceId: string,
  id: string,
  input: MemoryInput,
): Promise<string | null> {
  const existing = await db.memoryEntry.findFirst({
    where: { id, trip: { coupleSpaceId } },
    select: { tripId: true },
  });
  if (!existing) return null;
  const { tags, ...data } = input;
  await db.$transaction(async (tx) => {
    await tx.memoryEntry.update({ where: { id }, data: { ...data, tags: { set: [] } } });
    await tx.memoryEntry.update({
      where: { id },
      data: { tags: { connectOrCreate: tagLinks(coupleSpaceId, tags) } },
    });
    await pruneUnusedTags(tx, coupleSpaceId);
  });
  return existing.tripId;
}

/** Returns the trip id (for redirects), or null if not found in this couple space. */
export async function deleteMemoryFor(
  db: Db,
  coupleSpaceId: string,
  id: string,
): Promise<string | null> {
  const existing = await db.memoryEntry.findFirst({
    where: { id, trip: { coupleSpaceId } },
    select: { tripId: true },
  });
  if (!existing) return null;
  await db.$transaction(async (tx) => {
    await tx.memoryEntry.delete({ where: { id } });
    await pruneUnusedTags(tx, coupleSpaceId);
  });
  return existing.tripId;
}
