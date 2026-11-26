// HTTP handlers for the photo routes, written as plain functions with injected dependencies
// so they can be tested without starting Next.js.
import { idField } from "@/features/common/form";
import type { CurrentUser } from "@/features/auth/dal";
import type { Db } from "@/lib/db-client";
import { isSameOrigin } from "@/lib/security/origin";
import type { RateLimiter } from "@/lib/security/rate-limit";
import type { StorageProvider } from "@/lib/storage/types";
import { createMediaFor, readMediaFileFor } from "./core";
import { MediaError } from "./errors";
import { MAX_UPLOAD_BYTES, type UploadResponse } from "./types";

export type MediaHttpDeps = {
  getUser: () => Promise<CurrentUser | null>;
  db: Db;
  storage: StorageProvider;
  limiter: RateLimiter;
};

// Multipart framing adds a little to the file itself.
const MAX_BODY_BYTES = MAX_UPLOAD_BYTES + 64 * 1024;

const json = (body: UploadResponse, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const fail = (error: string, status: number) => json({ ok: false, error, status }, status);

export async function handleUpload(request: Request, deps: MediaHttpDeps): Promise<Response> {
  if (!isSameOrigin(request)) return fail("errors.invalid", 403);

  const user = await deps.getUser();
  if (!user) return fail("errors.generic", 401);

  if (!deps.limiter.allow(user.id)) return fail("errors.tooManyRequests", 429);

  // Refuse oversized bodies before reading them into memory.
  const declared = Number(request.headers.get("content-length"));
  if (!Number.isFinite(declared) || declared <= 0) return fail("errors.invalid", 411);
  if (declared > MAX_BODY_BYTES) return fail("errors.fileTooLarge", 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("errors.invalid", 400);
  }

  const file = form.get("file");
  const tripId = idField.safeParse(form.get("tripId"));
  const memoryRaw = form.get("memoryId");
  const memoryId = memoryRaw === null || memoryRaw === "" ? null : idField.safeParse(memoryRaw);

  if (!(file instanceof File) || !tripId.success || (memoryId !== null && !memoryId.success)) {
    return fail("errors.invalid", 400);
  }
  if (file.size > MAX_UPLOAD_BYTES) return fail("errors.fileTooLarge", 413);
  if (file.size === 0) return fail("errors.unsupportedImage", 415);

  try {
    const media = await createMediaFor(
      deps.db,
      deps.storage,
      { coupleSpaceId: user.coupleSpaceId, userId: user.id },
      {
        tripId: tripId.data,
        memoryId: memoryId === null ? null : (memoryId as { data: string }).data,
        file: Buffer.from(await file.arrayBuffer()),
      },
    );
    return json({ ok: true, media }, 201);
  } catch (err) {
    if (err instanceof MediaError) return fail(err.key, err.status);
    console.error("media upload failed:", err instanceof Error ? err.message : "unknown error");
    return fail("errors.uploadFailed", 500);
  }
}

const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

export async function handleMediaGet(
  request: Request,
  id: string,
  deps: Pick<MediaHttpDeps, "getUser" | "db" | "storage">,
): Promise<Response> {
  const user = await deps.getUser();
  if (!user) return new Response("Unauthorized", { status: 401, headers: { "Cache-Control": "no-store" } });

  if (!idField.safeParse(id).success) return notFound();
  const size = new URL(request.url).searchParams.get("size") === "thumb" ? "thumb" : "full";

  // Another couple's photo is indistinguishable from a missing one: both are 404.
  const file = await readMediaFileFor(deps.db, deps.storage, user.coupleSpaceId, id, size);
  if (!file) return notFound();

  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.data.length),
      // Bytes for an id never change; "private" keeps shared caches/CDNs from storing a private photo.
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Content-Disposition": "inline",
    },
  });
}
