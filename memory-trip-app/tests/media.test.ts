import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { collectTripMediaKeys, createMediaFor, deleteMediaFor, deleteStoredKeys, getMediaFor, listMediaFor, readMediaFileFor, setTripCoverFor } from "@/features/media/core";
import { deleteMemoryFor } from "@/features/memories/core";
import { deleteTripFor } from "@/features/trips/core";
import { LocalStorage } from "@/lib/storage/local";
import { makeJpeg } from "./support/images";
import { resetDb, seedTwoCouples, testDb } from "./support/db";

const db = testDb();
let dir: string;
let storage: LocalStorage;
let s: Awaited<ReturnType<typeof seedTwoCouples>>;

beforeEach(async () => {
  await resetDb(db);
  s = await seedTwoCouples(db);
  dir = await mkdtemp(join(tmpdir(), "mt-media-"));
  storage = new LocalStorage(dir);
});
afterEach(() => rm(dir, { recursive: true, force: true }));

const exists = (key: string) => access(join(dir, key)).then(() => true, () => false);
const ctxA = () => ({ coupleSpaceId: s.a.space.id, userId: s.a.user.id });
const upload = async (tripId = s.a.trip.id, memoryId: string | null = null) =>
  createMediaFor(db, storage, ctxA(), { tripId, memoryId, file: await makeJpeg(640, 480) });
const keysOf = async (id: string) => db.mediaAsset.findUniqueOrThrow({ where: { id }, select: { storageKey: true, thumbnailKey: true } });

describe("upload", () => {
  it("stores two files, saves metadata only, and returns URLs without storage keys", async () => {
    const dto = await upload();
    const row = await db.mediaAsset.findUniqueOrThrow({ where: { id: dto.id } });
    expect(await exists(row.storageKey)).toBe(true);
    expect(await exists(row.thumbnailKey)).toBe(true);
    expect(row.storageKey.startsWith(`${s.a.space.id}/`)).toBe(true);
    expect(row).toMatchObject({ mimeType: "image/webp", width: 640, height: 480, uploadedById: s.a.user.id });
    expect(dto.thumbUrl).toBe(`/api/media/${dto.id}?size=thumb`);
    expect(JSON.stringify(dto)).not.toContain(row.storageKey);
  });

  it("makes the first photo the trip cover, and keeps it when more arrive", async () => {
    const first = await upload();
    await upload();
    expect((await db.trip.findUniqueOrThrow({ where: { id: s.a.trip.id } })).coverMediaId).toBe(first.id);
  });

  it("rejects a non-image and stores nothing", async () => {
    await expect(createMediaFor(db, storage, ctxA(), { tripId: s.a.trip.id, memoryId: null, file: Buffer.from("MZ fake") })).rejects.toMatchObject({ status: 415 });
    expect(await db.mediaAsset.count({ where: { tripId: s.a.trip.id } })).toBe(0);
  });

  it("attaches to a memory of the same trip, and rejects a memory from another trip", async () => {
    const ok = await upload(s.a.trip.id, s.a.memory.id);
    expect(ok.memoryId).toBe(s.a.memory.id);
    const otherTrip = await db.trip.create({ data: { coupleSpaceId: s.a.space.id, title: "Other" } });
    await expect(upload(otherTrip.id, s.a.memory.id)).rejects.toMatchObject({ status: 404 });
  });

  it("removes the files again if saving the row fails", async () => {
    const broken = { ...db, mediaAsset: { create: async () => { throw new Error("db down"); } }, trip: db.trip, memoryEntry: db.memoryEntry } as unknown as typeof db;
    await expect(createMediaFor(broken, storage, ctxA(), { tripId: s.a.trip.id, memoryId: null, file: await makeJpeg() })).rejects.toThrow("db down");
    await expect(access(join(dir, s.a.space.id))).resolves.toBeUndefined(); // folder may exist...
    const { readdir } = await import("node:fs/promises");
    expect(await readdir(join(dir, s.a.space.id))).toEqual([]); // ...but holds no orphan files
  });
});

describe("SECURITY: one couple cannot touch another couple's photos", () => {
  it("cannot upload into a foreign trip or attach to a foreign memory", async () => {
    await expect(upload(s.b.trip.id)).rejects.toMatchObject({ status: 404 });
    await expect(upload(s.a.trip.id, s.b.memory.id)).rejects.toMatchObject({ status: 404 });
    expect(await db.mediaAsset.count({ where: { coupleSpaceId: s.b.space.id } })).toBe(0);
  });

  it("cannot read, list, delete or cover with someone else's photo", async () => {
    const mine = await upload();
    const b = s.b.space.id;
    expect(await readMediaFileFor(db, storage, b, mine.id, "full")).toBeNull();
    expect(await readMediaFileFor(db, storage, b, mine.id, "thumb")).toBeNull();
    expect(await getMediaFor(db, b, mine.id)).toBeNull();
    expect((await listMediaFor(db, b)).items).toEqual([]);
    expect(await listMediaFor(db, b, { cursor: mine.id })).toEqual({ items: [], nextCursor: null });
    expect(await deleteMediaFor(db, storage, b, mine.id)).toBeNull();
    expect(await setTripCoverFor(db, b, s.b.trip.id, mine.id)).toBe(false);
    expect(await setTripCoverFor(db, b, s.a.trip.id, null)).toBe(false);
    expect(await exists((await keysOf(mine.id)).storageKey)).toBe(true);
  });

  it("the owner can read the bytes", async () => {
    const mine = await upload();
    const file = await readMediaFileFor(db, storage, s.a.space.id, mine.id, "thumb");
    expect(file?.mimeType).toBe("image/webp");
    expect(file?.data.length).toBeGreaterThan(0);
  });
});

describe("delete and cover", () => {
  it("deleting a photo removes both files and clears it as cover", async () => {
    const dto = await upload();
    const keys = await keysOf(dto.id);
    expect(await deleteMediaFor(db, storage, s.a.space.id, dto.id)).toBe(s.a.trip.id);
    expect(await exists(keys.storageKey)).toBe(false);
    expect(await exists(keys.thumbnailKey)).toBe(false);
    expect((await db.trip.findUniqueOrThrow({ where: { id: s.a.trip.id } })).coverMediaId).toBeNull();
  });

  it("sets and clears the cover, only with a photo of that trip", async () => {
    const a1 = await upload();
    const a2 = await upload();
    expect(await setTripCoverFor(db, s.a.space.id, s.a.trip.id, a2.id)).toBe(true);
    expect((await db.trip.findUniqueOrThrow({ where: { id: s.a.trip.id } })).coverMediaId).toBe(a2.id);
    const otherTrip = await db.trip.create({ data: { coupleSpaceId: s.a.space.id, title: "Other" } });
    expect(await setTripCoverFor(db, s.a.space.id, otherTrip.id, a1.id)).toBe(false); // photo of another trip
    expect(await setTripCoverFor(db, s.a.space.id, s.a.trip.id, null)).toBe(true);
    expect((await db.trip.findUniqueOrThrow({ where: { id: s.a.trip.id } })).coverMediaId).toBeNull();
  });

  it("deleting a trip removes its photos and files; the other couple's stay", async () => {
    const a = await upload();
    const bDto = await createMediaFor(db, storage, { coupleSpaceId: s.b.space.id, userId: s.b.user.id }, { tripId: s.b.trip.id, memoryId: null, file: await makeJpeg() });
    const aKeys = await keysOf(a.id);
    const bKeys = await keysOf(bDto.id);

    const keys = await collectTripMediaKeys(db, s.a.space.id, s.a.trip.id);
    expect(keys.sort()).toEqual([aKeys.storageKey, aKeys.thumbnailKey].sort());
    expect(await collectTripMediaKeys(db, s.a.space.id, s.b.trip.id)).toEqual([]); // foreign trip: nothing
    expect(await deleteTripFor(db, s.a.space.id, s.a.trip.id)).toBe(true);
    await deleteStoredKeys(storage, keys);

    expect(await db.mediaAsset.count({ where: { id: a.id } })).toBe(0);
    expect(await exists(aKeys.storageKey)).toBe(false);
    expect(await exists(bKeys.storageKey)).toBe(true);
    expect(await db.mediaAsset.count({ where: { id: bDto.id } })).toBe(1);
  });

  it("deleting a memory keeps its photos on the trip", async () => {
    const dto = await upload(s.a.trip.id, s.a.memory.id);
    await deleteMemoryFor(db, s.a.space.id, s.a.memory.id);
    expect((await getMediaFor(db, s.a.space.id, dto.id))?.memoryId).toBeNull();
  });

  it("a failing file delete is swallowed, not thrown", async () => {
    const failing = { put: async () => {}, get: async () => null, delete: async () => { throw new Error("disk error"); } };
    await expect(deleteStoredKeys(failing, ["a/b.webp"])).resolves.toBeUndefined();
  });
});

describe("list", () => {
  it("lists newest first with the trip title, filtered by trip", async () => {
    const first = await upload();
    const second = await upload();
    const page = await listMediaFor(db, s.a.space.id);
    expect(page.items.map((m) => m.id)).toEqual([second.id, first.id]);
    expect(page.items[0].tripTitle).toBe("Trip A");
    expect((await listMediaFor(db, s.a.space.id, { tripId: s.b.trip.id })).items).toEqual([]);
  });
});
