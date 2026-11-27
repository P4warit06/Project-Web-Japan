// The real photo uploader POSTs to /api/media. GitHub Pages has no server, so the demo
// answers that one request itself: it shrinks the photo again (small enough for the
// browser's ~5 MB of storage) and keeps it in the demo store. Every other request goes
// to the real network function untouched.
import { addMedia, type MediaRec } from "./data";
import { newId } from "./actions";
import { demoStore } from "./store";

const FULL_SIDE = 1280;
const THUMB_SIDE = 360;

type Fail = { ok: false; error: string; status: number };
const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const fail = (error: string, status: number): Response => json({ ok: false, error, status } satisfies Fail, status);

async function toJpegDataUrl(bitmap: ImageBitmap, maxSide: number, quality: number) {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.drawImage(bitmap, 0, 0, width, height);
  return { url: canvas.toDataURL("image/jpeg", quality), width, height };
}

async function handleUpload(body: BodyInit | null | undefined): Promise<Response> {
  if (!(body instanceof FormData)) return fail("errors.uploadFailed", 400);
  const file = body.get("file");
  const tripId = body.get("tripId");
  const memoryId = body.get("memoryId");
  if (!(file instanceof Blob) || typeof tripId !== "string") return fail("errors.uploadFailed", 400);
  if (!file.type.startsWith("image/")) return fail("errors.unsupportedImage", 415);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return fail("errors.unsupportedImage", 415);
  }
  try {
    const full = await toJpegDataUrl(bitmap, FULL_SIDE, 0.72);
    const thumb = await toJpegDataUrl(bitmap, THUMB_SIDE, 0.7);
    const media: MediaRec = {
      id: newId(),
      tripId,
      memoryId: typeof memoryId === "string" && memoryId ? memoryId : null,
      width: full.width,
      height: full.height,
      createdAt: new Date().toISOString(),
      thumbUrl: thumb.url,
      fullUrl: full.url,
    };
    const next = addMedia(demoStore.get(), media);
    if (!next) return fail("errors.notFound", 404);
    if (!demoStore.commit(next)) return fail("errors.uploadFailed", 507); // browser storage is full
    return json({ ok: true, media }, 201);
  } catch {
    return fail("errors.uploadFailed", 500);
  } finally {
    bitmap.close();
  }
}

export function installFakeApi() {
  const realFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const method = (init?.method ?? "GET").toUpperCase();
    if (method === "POST") {
      const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (new URL(raw, window.location.href).pathname.endsWith("/api/media")) return handleUpload(init?.body);
    }
    return realFetch(input, init);
  };
}
