// SECURITY: one couple must never read, change or delete another couple's data (IDOR).
import { beforeEach, describe, expect, it } from "vitest";
import { getDashboardFor } from "@/features/dashboard/core";
import { createMemoryFor, deleteMemoryFor, getMemoryFor, listMemoriesFor, updateMemoryFor } from "@/features/memories/core";
import { createPlaceFor, deletePlaceFor, listPlacesFor, updatePlaceFor } from "@/features/places/core";
import { createTripFor, deleteTripFor, getTripFor, listTripsFor, updateTripFor } from "@/features/trips/core";
import { resetDb, seedTwoCouples, testDb } from "./support/db";

const db = testDb();
type Seed = Awaited<ReturnType<typeof seedTwoCouples>>;
let s: Seed;

const tripInput = { title: "Hacked", description: null, startDate: null, endDate: null };
const placeInput = { name: "Hacked", address: null, note: null, latitude: null, longitude: null };
const memoryInput = { title: "Hacked", content: "x", happenedAt: new Date(), mood: null, tags: [] };

beforeEach(async () => {
  await resetDb(db);
  s = await seedTwoCouples(db);
});

describe("trips", () => {
  it("lists only own trips", async () => {
    const page = await listTripsFor(db, s.a.space.id);
    expect(page.items.map((t) => t.id)).toEqual([s.a.trip.id]);
  });
  it("cannot read another couple's trip", async () => {
    expect(await getTripFor(db, s.a.space.id, s.b.trip.id)).toBeNull();
  });
  it("cannot update another couple's trip", async () => {
    expect(await updateTripFor(db, s.a.space.id, s.b.trip.id, tripInput)).toBe(false);
    expect((await db.trip.findUniqueOrThrow({ where: { id: s.b.trip.id } })).title).toBe("Trip B");
  });
  it("cannot delete another couple's trip", async () => {
    expect(await deleteTripFor(db, s.a.space.id, s.b.trip.id)).toBe(false);
    expect(await db.trip.count({ where: { id: s.b.trip.id } })).toBe(1);
  });
  it("ignores a cursor that belongs to another couple", async () => {
    const page = await listTripsFor(db, s.a.space.id, s.b.trip.id);
    expect(page).toEqual({ items: [], nextCursor: null });
  });
});

describe("places", () => {
  it("lists only own places", async () => {
    const page = await listPlacesFor(db, s.a.space.id);
    expect(page.items.map((p) => p.id)).toEqual([s.a.place.id]);
  });
  it("cannot add a place to another couple's trip", async () => {
    expect(await createPlaceFor(db, s.a.space.id, s.b.trip.id, placeInput)).toBeNull();
    expect(await db.place.count({ where: { tripId: s.b.trip.id } })).toBe(1);
  });
  it("cannot update or delete another couple's place", async () => {
    expect(await updatePlaceFor(db, s.a.space.id, s.b.place.id, placeInput)).toBeNull();
    expect(await deletePlaceFor(db, s.a.space.id, s.b.place.id)).toBeNull();
    expect((await db.place.findUniqueOrThrow({ where: { id: s.b.place.id } })).name).toBe("Place B");
  });
});

describe("memories", () => {
  it("lists only own memories, even when filtering by a foreign trip id", async () => {
    expect((await listMemoriesFor(db, s.a.space.id)).items.map((m) => m.id)).toEqual([s.a.memory.id]);
    expect((await listMemoriesFor(db, s.a.space.id, { tripId: s.b.trip.id })).items).toEqual([]);
  });
  it("cannot read another couple's memory", async () => {
    expect(await getMemoryFor(db, s.a.space.id, s.b.memory.id)).toBeNull();
  });
  it("cannot add a memory to another couple's trip", async () => {
    expect(await createMemoryFor(db, s.a.space.id, s.b.trip.id, memoryInput)).toBeNull();
  });
  it("cannot update or delete another couple's memory", async () => {
    expect(await updateMemoryFor(db, s.a.space.id, s.b.memory.id, memoryInput)).toBeNull();
    expect(await deleteMemoryFor(db, s.a.space.id, s.b.memory.id)).toBeNull();
    expect((await db.memoryEntry.findUniqueOrThrow({ where: { id: s.b.memory.id } })).title).toBe("Memory B");
  });
});

describe("dashboard and tags", () => {
  it("counts only own data", async () => {
    const d = await getDashboardFor(db, s.a.space.id);
    expect(d.counts).toEqual({ trips: 1, places: 1, memories: 1 });
    expect(d.latestTrips[0].id).toBe(s.a.trip.id);
  });
  it("keeps tags separate per couple", async () => {
    expect(await db.tag.count({ where: { name: "food" } })).toBe(2);
    await deleteMemoryFor(db, s.a.space.id, s.a.memory.id);
    // A's unused tag is pruned; B's identical tag name must survive.
    expect(await db.tag.count({ where: { coupleSpaceId: s.a.space.id } })).toBe(0);
    expect(await db.tag.count({ where: { coupleSpaceId: s.b.space.id } })).toBe(1);
  });
});

describe("creation is always scoped to the given couple", () => {
  it("creates the trip inside the caller's space", async () => {
    const id = await createTripFor(db, s.a.space.id, tripInput);
    expect((await db.trip.findUniqueOrThrow({ where: { id } })).coupleSpaceId).toBe(s.a.space.id);
  });
});
