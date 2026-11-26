import { describe, expect, it } from "vitest";
import { parseFloatingDate, parseForm } from "@/features/common/form";
import { normalizeTags } from "@/features/memories/core";
import { createMemorySchema } from "@/features/memories/schema";
import { createPlaceSchema } from "@/features/places/schema";
import { createTripSchema, updateTripSchema } from "@/features/trips/schema";

const fd = (obj: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) f.set(k, v);
  return f;
};

describe("floating dates", () => {
  it("parses date and datetime as UTC", () => {
    expect(parseFloatingDate("2026-04-02")?.toISOString()).toBe("2026-04-02T00:00:00.000Z");
    expect(parseFloatingDate("2026-04-02T21:05")?.toISOString()).toBe("2026-04-02T21:05:00.000Z");
  });
  it("rejects impossible dates", () => {
    for (const bad of ["2026-02-30", "2026-13-01", "2026-04-02T25:00", "tomorrow", ""]) {
      expect(parseFloatingDate(bad)).toBeNull();
    }
  });
});

describe("trip form", () => {
  it("accepts a minimal trip", () => {
    const r = parseForm(createTripSchema, fd({ title: "  Tokyo  " }));
    expect(r).toMatchObject({ ok: true, data: { title: "Tokyo", description: null, startDate: null, endDate: null } });
  });
  it("requires a title and reports an i18n key", () => {
    const r = parseForm(createTripSchema, fd({ title: "   " }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.state.fieldErrors).toEqual({ title: "errors.required" });
  });
  it("flags a title that is too long and echoes the values", () => {
    const r = parseForm(createTripSchema, fd({ title: "x".repeat(121) }));
    if (r.ok) throw new Error("should fail");
    expect(r.state.fieldErrors?.title).toBe("errors.tooLong");
    expect(r.state.values?.title).toHaveLength(121);
  });
  it("rejects an end date before the start date", () => {
    const r = parseForm(createTripSchema, fd({ title: "t", startDate: "2026-05-02", endDate: "2026-05-01" }));
    if (r.ok) throw new Error("should fail");
    expect(r.state.fieldErrors).toEqual({ endDate: "errors.invalid" });
  });
  it("rejects an unsafe id on update", () => {
    const r = parseForm(updateTripSchema, fd({ id: "../etc/passwd", title: "t" }));
    if (r.ok) throw new Error("should fail");
    expect(r.state.fieldErrors?.id).toBe("errors.invalid");
  });
});

describe("place form", () => {
  const base = { tripId: "abc123", name: "Castle" };
  it("accepts no coordinates", () => {
    expect(parseForm(createPlaceSchema, fd(base)).ok).toBe(true);
  });
  it("needs both coordinates or neither", () => {
    const r = parseForm(createPlaceSchema, fd({ ...base, latitude: "35.6" }));
    if (r.ok) throw new Error("should fail");
    expect(r.state.fieldErrors).toEqual({ longitude: "errors.required" });
  });
  it("rejects out-of-range or non-numeric coordinates", () => {
    for (const [lat, lng] of [["91", "0"], ["0", "181"], ["abc", "0"]]) {
      expect(parseForm(createPlaceSchema, fd({ ...base, latitude: lat, longitude: lng })).ok).toBe(false);
    }
  });
});

describe("memory form", () => {
  const base = { tripId: "abc123", title: "Ramen", content: "yum", happenedAt: "2026-04-02T19:30" };
  it("parses mood and tags", () => {
    const r = parseForm(createMemorySchema, fd({ ...base, mood: "happy", tags: "Food, #Night ,food" }));
    expect(r).toMatchObject({ ok: true, data: { mood: "happy", tags: ["food", "night"] } });
  });
  it("rejects an unknown mood", () => {
    expect(parseForm(createMemorySchema, fd({ ...base, mood: "angry" })).ok).toBe(false);
  });
  it("requires content and a valid date", () => {
    const r = parseForm(createMemorySchema, fd({ ...base, content: "", happenedAt: "nope" }));
    if (r.ok) throw new Error("should fail");
    expect(Object.keys(r.state.fieldErrors ?? {}).sort()).toEqual(["content", "happenedAt"]);
  });
  it("limits tag count and length", () => {
    expect(normalizeTags(Array.from({ length: 11 }, (_, i) => `t${i}`).join(","))).toBeNull();
    expect(normalizeTags("x".repeat(31))).toBeNull();
    expect(normalizeTags("ราเมน, เกียวโต")).toEqual(["ราเมน", "เกียวโต"]);
  });
});
