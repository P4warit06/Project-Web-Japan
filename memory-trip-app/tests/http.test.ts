// The photo routes, tested through their real handlers with injected dependencies.
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CurrentUser } from "@/features/auth/dal";
import { handleMediaGet, handleUpload, type MediaHttpDeps } from "@/features/media/http";
import { MAX_UPLOAD_BYTES } from "@/features/media/types";
import { RateLimiter } from "@/lib/security/rate-limit";
import { safeReturnTo } from "@/lib/security/origin";
import { LocalStorage } from "@/lib/storage/local";
import { makeJpeg } from "./support/images";
import { resetDb, seedTwoCouples, testDb } from "./support/db";

const db = testDb();
let dir: string;
let s: Awaited<ReturnType<typeof seedTwoCouples>>;
let user: CurrentUser | null;
let deps: MediaHttpDeps;

beforeEach(async () => {
  await resetDb(db);
  s = await seedTwoCouples(db);
  dir = await mkdtemp(join(tmpdir(), "mt-http-"));
  user = { id: s.a.user.id, displayName: "A", coupleSpaceId: s.a.space.id };
  deps = { getUser: async () => user, db, storage: new LocalStorage(dir), limiter: new RateLimiter(30, 60_000) };
});
afterEach(() => rm(dir, { recursive: true, force: true }));

type Opts = { origin?: string | null; length?: string | null; fields?: Record<string, string>; file?: Buffer | null; method?: string };
async function post(o: Opts = {}) {
  const form = new FormData();
  const file = o.file === undefined ? await makeJpeg(400, 300) : o.file;
  if (file) form.set("file", new File([new Uint8Array(file)], "photo.jpg", { type: "image/jpeg" }));
  const fields = o.fields ?? { tripId: s.a.trip.id };
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  const headers = new Headers({ host: "app.test" });
  if (o.origin !== null) headers.set("origin", o.origin ?? "http://app.test");
  const body = new Request("http://app.test/api/media", { method: "POST", body: form });
  const raw = await body.arrayBuffer();
  const ct = body.headers.get("content-type")!;
  headers.set("content-type", ct);
  if (o.length !== null) headers.set("content-length", o.length ?? String(raw.byteLength));
  return handleUpload(new Request("http://app.test/api/media", { method: "POST", headers, body: raw }), deps);
}

describe("POST /api/media", () => {
  it("201 and a MediaDTO for a valid photo", async () => {
    const res = await post();
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.media).toMatchObject({ tripId: s.a.trip.id, memoryId: null });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("403 without an Origin header or from another site (CSRF)", async () => {
    expect((await post({ origin: null })).status).toBe(403);
    expect((await post({ origin: "https://evil.example" })).status).toBe(403);
    expect(await db.mediaAsset.count({ where: { coupleSpaceId: s.a.space.id } })).toBe(0);
  });

  it("401 when not signed in", async () => {
    user = null;
    expect((await post()).status).toBe(401);
  });

  it("411 without a content length, 413 when the declared body is too big", async () => {
    expect((await post({ length: null })).status).toBe(411);
    const res = await post({ length: String(MAX_UPLOAD_BYTES + 1_000_000) });
    expect(res.status).toBe(413);
    expect((await res.json()).error).toBe("errors.fileTooLarge");
  });

  it("413 when the file itself is over the limit", async () => {
    const big = Buffer.alloc(MAX_UPLOAD_BYTES + 1, 1);
    expect((await post({ file: big })).status).toBe(413);
  });

  it("415 for a non-image and for an empty file", async () => {
    const res = await post({ file: Buffer.from("MZ not an image") });
    expect(res.status).toBe(415);
    expect((await res.json()).error).toBe("errors.unsupportedImage");
    expect((await post({ file: Buffer.alloc(0) })).status).toBe(415);
  });

  it("400 for missing or malformed fields", async () => {
    expect((await post({ file: null })).status).toBe(400);
    expect((await post({ fields: {} })).status).toBe(400);
    expect((await post({ fields: { tripId: "../../x" } })).status).toBe(400);
    expect((await post({ fields: { tripId: s.a.trip.id, memoryId: "a b" } })).status).toBe(400);
  });

  it("404 for another couple's trip or memory", async () => {
    expect((await post({ fields: { tripId: s.b.trip.id } })).status).toBe(404);
    expect((await post({ fields: { tripId: s.a.trip.id, memoryId: s.b.memory.id } })).status).toBe(404);
  });

  it("429 after too many uploads", async () => {
    deps.limiter = new RateLimiter(2, 60_000);
    expect((await post()).status).toBe(201);
    expect((await post()).status).toBe(201);
    const res = await post();
    expect(res.status).toBe(429);
    expect((await res.json()).error).toBe("errors.tooManyRequests");
  });
});

describe("GET /api/media/[id]", () => {
  const get = (id: string, q = "") => handleMediaGet(new Request(`http://app.test/api/media/${id}${q}`), id, deps);
  const uploaded = async () => (await (await post()).json()).media.id as string;

  it("serves the photo with safe headers (thumb and full)", async () => {
    const id = (await (await post({ file: await makeJpeg(1600, 1200) })).json()).media.id as string;
    const full = await get(id);
    const thumb = await get(id, "?size=thumb");
    expect([full.status, thumb.status]).toEqual([200, 200]);
    expect(full.headers.get("content-type")).toBe("image/webp");
    expect(full.headers.get("cache-control")).toContain("private");
    expect(full.headers.get("x-content-type-options")).toBe("nosniff");
    expect(full.headers.get("content-security-policy")).toContain("sandbox");
    expect((await sharp(Buffer.from(await full.arrayBuffer())).metadata()).width).toBe(1600);
    expect((await sharp(Buffer.from(await thumb.arrayBuffer())).metadata()).width).toBe(480);
  });

  it("401 when signed out", async () => {
    const id = await uploaded();
    user = null;
    expect((await get(id)).status).toBe(401);
  });

  it("404 (not 403) for another couple's photo, so existence is not revealed", async () => {
    const id = await uploaded();
    user = { id: s.b.user.id, displayName: "B", coupleSpaceId: s.b.space.id };
    expect((await get(id)).status).toBe(404);
    expect((await get(id, "?size=thumb")).status).toBe(404);
  });

  it("404 for unknown ids and path-like ids", async () => {
    expect((await get("nope")).status).toBe(404);
    expect((await get("..%2F..%2Fetc%2Fpasswd")).status).toBe(404);
  });
});

describe("safeReturnTo (open redirect guard)", () => {
  it("allows only same-site paths", () => {
    expect(safeReturnTo("/gallery", "/x")).toBe("/gallery");
    expect(safeReturnTo("/trips/abc?cursor=1", "/x")).toBe("/trips/abc?cursor=1");
    for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)", "gallery", "", "/a\nb", undefined, 42]) {
      expect(safeReturnTo(bad, "/x")).toBe("/x");
    }
  });
});
