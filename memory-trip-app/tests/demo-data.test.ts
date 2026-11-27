// The demo's data layer is pure, so it is tested without a browser or database.
// These tests also guard the demo's promise: sample data is valid, and the same
// "can't reach another trip's things" rules hold as in the real app.
import { describe, expect, it } from "vitest";
import * as d from "../demo/src/data";
import { createSeed } from "../demo/src/seed";
import { matchRoute, parseHash } from "../demo/src/router";
import { parseForm } from "@/features/common/form";
import { createTripSchema } from "@/features/trips/schema";

const stamp = (id: string) => ({ id, now: "2030-01-01T00:00:00.000Z" });
const trip = (title = "T"): d.TripInput => ({ title, description: null, startDate: null, endDate: null });

describe("sample data", () => {
  const s = createSeed();

  it("is accepted by the loader (what gets saved can be read back)", () => {
    expect(d.parseState(JSON.parse(JSON.stringify(s)))).not.toBeNull();
  });

  it("only links things that exist", () => {
    const tripIds = new Set(s.trips.map((t) => t.id));
    const memoryIds = new Set(s.memories.map((m) => m.id));
    expect(s.places.every((p) => tripIds.has(p.tripId))).toBe(true);
    expect(s.memories.every((m) => tripIds.has(m.tripId))).toBe(true);
    for (const m of s.media) {
      expect(tripIds.has(m.tripId)).toBe(true);
      if (m.memoryId) expect(memoryIds.has(m.memoryId)).toBe(true);
    }
    for (const t of s.trips) {
      if (t.coverMediaId) expect(s.media.some((m) => m.id === t.coverMediaId && m.tripId === t.id)).toBe(true);
    }
  });

  it("has unique ids", () => {
    const all = [...s.trips, ...s.places, ...s.memories, ...s.media].map((x) => x.id);
    expect(new Set(all).size).toBe(all.length);
  });

  it("makes no network references (images are data URLs)", () => {
    expect(s.media.every((m) => m.thumbUrl.startsWith("data:image/") && m.fullUrl.startsWith("data:image/"))).toBe(true);
  });
});

describe("reading", () => {
  const s = createSeed();

  it("lists trips newest first and counts places and memories", () => {
    const list = d.listTrips(s);
    expect(list.map((t) => t.id)).toEqual(["kyoto", "osaka", "hokkaido"]);
    expect(list[0]).toMatchObject({ placeCount: 3, memoryCount: 3 });
    expect(list[0].coverThumbUrl).toBe(s.media.find((m) => m.id === "m-kyoto-1")!.thumbUrl);
    expect(list[1].coverThumbUrl).toBeNull();
  });

  it("puts trips without a start date last", () => {
    const next = d.createTrip(s, trip("No date"), stamp("nd"))!;
    expect(d.listTrips(next).at(-1)!.id).toBe("nd");
  });

  it("returns memories newest first with their photos", () => {
    const [first] = d.listMemories(s);
    expect(first.id).toBe("mem-kyoto-3");
    expect(d.getMemory(s, "mem-kyoto-1")!.media).toHaveLength(2);
    expect(d.getMemory(s, "nope")).toBeNull();
  });

  it("filters the gallery by trip", () => {
    expect(d.listMedia(s, "osaka")).toHaveLength(2);
    expect(d.listMedia(s, "osaka").every((m) => m.tripTitle.length > 0)).toBe(true);
    expect(d.listMedia(s)).toHaveLength(s.media.length);
  });

  it("builds the dashboard", () => {
    const dash = d.dashboard(s);
    expect(dash.counts).toEqual({ trips: 3, places: 6, memories: 6 });
    expect(dash.latestTrips).toHaveLength(3);
    expect(dash.recentMemories).toHaveLength(5);
  });
});

describe("writing", () => {
  it("never changes the state it was given", () => {
    const s = createSeed();
    const before = JSON.stringify(s);
    d.createTrip(s, trip(), stamp("x"));
    d.deleteTrip(s, "kyoto");
    d.deleteMemory(s, "mem-kyoto-1");
    d.setCover(s, "kyoto", "m-kyoto-2");
    expect(JSON.stringify(s)).toBe(before);
  });

  it("deleting a trip removes its places, memories and photos", () => {
    const next = d.deleteTrip(createSeed(), "kyoto");
    expect(next.trips.map((t) => t.id)).toEqual(["osaka", "hokkaido"]);
    expect(next.places.some((p) => p.tripId === "kyoto")).toBe(false);
    expect(next.memories.some((m) => m.tripId === "kyoto")).toBe(false);
    expect(next.media.some((m) => m.tripId === "kyoto")).toBe(false);
  });

  it("deleting a memory keeps its photos in the trip", () => {
    const { state, tripId } = d.deleteMemory(createSeed(), "mem-kyoto-1");
    expect(tripId).toBe("kyoto");
    expect(state.memories.some((m) => m.id === "mem-kyoto-1")).toBe(false);
    expect(state.media.find((m) => m.id === "m-kyoto-1")!.memoryId).toBeNull();
  });

  it("deleting the cover photo clears the cover", () => {
    const next = d.deleteMedia(createSeed(), "m-kyoto-1");
    expect(next.trips.find((t) => t.id === "kyoto")!.coverMediaId).toBeNull();
  });

  it("a cover must be a photo of the same trip", () => {
    const s = createSeed();
    expect(d.setCover(s, "kyoto", "m-osaka-1")).toBeNull();
    expect(d.setCover(s, "kyoto", "m-kyoto-2")!.trips.find((t) => t.id === "kyoto")!.coverMediaId).toBe("m-kyoto-2");
    expect(d.setCover(s, "kyoto", null)!.trips.find((t) => t.id === "kyoto")!.coverMediaId).toBeNull();
  });

  it("a photo cannot join a memory of another trip, or a trip that does not exist", () => {
    const s = createSeed();
    const photo = { ...s.media[0], id: "new" };
    expect(d.addMedia(s, { ...photo, tripId: "osaka", memoryId: "mem-kyoto-1" })).toBeNull();
    expect(d.addMedia(s, { ...photo, tripId: "ghost", memoryId: null })).toBeNull();
    expect(d.addMedia(s, { ...photo, tripId: "kyoto", memoryId: "mem-kyoto-1" })!.media).toHaveLength(s.media.length + 1);
  });

  it("memories and places need an existing trip; unknown ids report not found", () => {
    const s = createSeed();
    const memory: d.MemoryInput = { title: "t", content: "c", happenedAt: new Date("2030-01-01T10:00Z"), mood: null, tags: [] };
    const place: d.PlaceInput = { name: "p", address: null, note: null, latitude: null, longitude: null };
    expect(d.createMemory(s, "ghost", memory, stamp("m"))).toBeNull();
    expect(d.createPlace(s, "ghost", place, stamp("p"))).toBeNull();
    expect(d.updateTrip(s, "ghost", trip())).toBeNull();
    expect(d.updateMemory(s, "ghost", memory)).toBeNull();
    expect(d.updatePlace(s, "ghost", place)).toBeNull();
    expect(d.createMemory(s, "kyoto", memory, stamp("m"))!.memories).toHaveLength(s.memories.length + 1);
  });

  it("stores dates the way the real app does", () => {
    const s = d.createTrip(createSeed(), { ...trip(), startDate: new Date("2030-05-01T00:00:00Z"), endDate: new Date("2030-05-04T00:00:00Z") }, stamp("n"))!;
    expect(s.trips.at(-1)).toMatchObject({ startDate: "2030-05-01", endDate: "2030-05-04" });
  });
});

describe("loading saved data", () => {
  it("rejects anything that is not valid saved data", () => {
    expect(d.parseState(null)).toBeNull();
    expect(d.parseState("x")).toBeNull();
    expect(d.parseState({})).toBeNull();
    expect(d.parseState({ ...createSeed(), version: 2 })).toBeNull();
    expect(d.parseState({ ...createSeed(), trips: "nope" })).toBeNull();
  });

  it("rejects photos whose source is not an image data URL", () => {
    const s = createSeed();
    const bad = { ...s, media: [{ ...s.media[0], thumbUrl: "https://example.com/x.png" }] };
    expect(d.parseState(bad)).toBeNull();
    const js = { ...s, media: [{ ...s.media[0], fullUrl: "javascript:alert(1)" }] };
    expect(d.parseState(js)).toBeNull();
  });
});

describe("validation is the real app's", () => {
  it("uses the real trip schema (required title, end not before start)", () => {
    const form = (v: Record<string, string>) => {
      const f = new FormData();
      for (const [k, val] of Object.entries(v)) f.set(k, val);
      return parseForm(createTripSchema, f);
    };
    expect(form({ title: "  " }).ok).toBe(false);
    expect(form({ title: "ok", startDate: "2030-02-02", endDate: "2030-02-01" }).ok).toBe(false);
    expect(form({ title: "ok", startDate: "2030-02-01", endDate: "2030-02-02" }).ok).toBe(true);
  });
});

describe("router helpers", () => {
  it("parses the hash into a path and query", () => {
    expect(parseHash("")).toMatchObject({ path: "/" });
    expect(parseHash("#/trips/abc/")).toMatchObject({ path: "/trips/abc" });
    expect(parseHash("#/memories/new?trip=a%20b").query.get("trip")).toBe("a b");
    expect(parseHash("#main").path).toBe("/"); // not a route: fall back home
  });

  it("matches patterns and decodes params", () => {
    expect(matchRoute("/trips/:tripId/edit", "/trips/a%20b/edit")).toEqual({ tripId: "a b" });
    expect(matchRoute("/trips/:tripId", "/trips")).toBeNull();
    expect(matchRoute("/trips/new", "/trips/abc")).toBeNull();
    expect(matchRoute("/trips/:tripId", "/trips/%E0%A4%A")).toBeNull(); // broken escape: no match, no crash
  });
});
