import { beforeEach, describe, expect, it } from "vitest";
import { PAGE_SIZE } from "@/features/common/pagination";
import { createMemoryFor, deleteMemoryFor, getMemoryFor, listMemoriesFor, updateMemoryFor } from "@/features/memories/core";
import { createPlaceFor, deletePlaceFor, listPlacesFor, updatePlaceFor } from "@/features/places/core";
import { createTripFor, deleteTripFor, getTripFor, listTripsFor, updateTripFor } from "@/features/trips/core";
import { resetDb, seedTwoCouples, testDb } from "./support/db";

const db = testDb();
let space: string;

beforeEach(async () => {
  await resetDb(db);
  space = (await seedTwoCouples(db)).a.space.id;
  await db.trip.deleteMany({ where: { coupleSpaceId: space } }); // start A empty
});

const trip = (title: string, start: string | null) => ({
  title,
  description: null,
  startDate: start ? new Date(`${start}T00:00:00Z`) : null,
  endDate: null,
});

describe("trips", () => {
  it("creates, reads, updates", async () => {
    const id = await createTripFor(db, space, { ...trip("Tokyo", "2026-04-01"), description: "Spring" });
    expect((await getTripFor(db, space, id))?.description).toBe("Spring");
    expect(await updateTripFor(db, space, id, trip("Tokyo 2", "2026-04-02"))).toBe(true);
    const t = await getTripFor(db, space, id);
    expect(t).toMatchObject({ title: "Tokyo 2", startDate: "2026-04-02", description: null });
  });

  it("orders newest start date first and trips without a date last", async () => {
    await createTripFor(db, space, trip("none", null));
    await createTripFor(db, space, trip("old", "2025-01-01"));
    await createTripFor(db, space, trip("new", "2026-06-01"));
    expect((await listTripsFor(db, space)).items.map((t) => t.title)).toEqual(["new", "old", "none"]);
  });

  it("paginates without gaps or duplicates", async () => {
    for (let i = 0; i < PAGE_SIZE + 5; i++) {
      await createTripFor(db, space, trip(`t${i}`, `2026-01-${String((i % 28) + 1).padStart(2, "0")}`));
    }
    const p1 = await listTripsFor(db, space);
    expect(p1.items).toHaveLength(PAGE_SIZE);
    expect(p1.nextCursor).not.toBeNull();
    const p2 = await listTripsFor(db, space, p1.nextCursor!);
    expect(p2.items).toHaveLength(5);
    expect(p2.nextCursor).toBeNull();
    const ids = [...p1.items, ...p2.items].map((t) => t.id);
    expect(new Set(ids).size).toBe(PAGE_SIZE + 5);
  });

  it("deleting a trip removes its places, memories and now-unused tags", async () => {
    const id = await createTripFor(db, space, trip("Kyoto", "2026-05-01"));
    await createPlaceFor(db, space, id, { name: "Temple", address: null, note: null, latitude: 35, longitude: 135 });
    await createMemoryFor(db, space, id, { title: "m", content: "c", happenedAt: new Date(), mood: "happy", tags: ["temple"] });
    expect(await deleteTripFor(db, space, id)).toBe(true);
    expect(await db.place.count()).toBe(1); // only couple B's place remains
    expect(await db.memoryEntry.count({ where: { tripId: id } })).toBe(0);
    expect(await db.tag.count({ where: { coupleSpaceId: space } })).toBe(0);
    expect(await deleteTripFor(db, space, id)).toBe(false); // already gone
  });
});

describe("places", () => {
  it("creates, lists with trip title, updates, deletes", async () => {
    const tripId = await createTripFor(db, space, trip("Osaka", "2026-07-01"));
    const id = (await createPlaceFor(db, space, tripId, { name: "Castle", address: "1-1", note: null, latitude: null, longitude: null }))!;
    expect((await listPlacesFor(db, space)).items[0]).toMatchObject({ name: "Castle", tripTitle: "Osaka" });
    expect(await updatePlaceFor(db, space, id, { name: "Osaka Castle", address: null, note: "n", latitude: 34.6, longitude: 135.5 })).toBe(tripId);
    expect((await getTripFor(db, space, tripId))?.places[0]).toMatchObject({ name: "Osaka Castle", latitude: 34.6 });
    expect(await deletePlaceFor(db, space, id)).toBe(tripId);
    expect((await getTripFor(db, space, tripId))?.places).toEqual([]);
  });
});

describe("memories", () => {
  const input = (tags: string[]) => ({ title: "Ramen", content: "so good", happenedAt: new Date("2026-04-02T19:30:00Z"), mood: "happy" as const, tags });

  it("round-trips floating time as UTC and sorts newest first", async () => {
    const tripId = await createTripFor(db, space, trip("Tokyo", "2026-04-01"));
    await createMemoryFor(db, space, tripId, { ...input([]), title: "older", happenedAt: new Date("2026-04-01T08:00:00Z") });
    const id = (await createMemoryFor(db, space, tripId, input(["food"])))!;
    const m = await getMemoryFor(db, space, id);
    expect(m?.happenedAt).toBe("2026-04-02T19:30:00.000Z");
    expect(m?.tripTitle).toBe("Tokyo");
    expect((await listMemoriesFor(db, space, { tripId })).items.map((x) => x.title)).toEqual(["Ramen", "older"]);
  });

  it("replaces tags on update and prunes unused ones", async () => {
    const tripId = await createTripFor(db, space, trip("Tokyo", "2026-04-01"));
    const id = (await createMemoryFor(db, space, tripId, input(["food", "night"])))!;
    expect((await getMemoryFor(db, space, id))?.tags).toEqual(["food", "night"]);
    await updateMemoryFor(db, space, id, input(["food", "ramen"]));
    expect((await getMemoryFor(db, space, id))?.tags).toEqual(["food", "ramen"]);
    expect(await db.tag.count({ where: { coupleSpaceId: space, name: "night" } })).toBe(0);
    await deleteMemoryFor(db, space, id);
    expect(await db.tag.count({ where: { coupleSpaceId: space } })).toBe(0);
  });
});
