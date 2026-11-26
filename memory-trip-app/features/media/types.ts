// Photo contract shared by backend and frontend.
import type { MessageKeyString } from "@/features/common/types";

export type MediaDTO = {
  id: string;
  tripId: string;
  /** The memory this photo illustrates, if any. */
  memoryId: string | null;
  width: number;
  height: number;
  /** ISO datetime */
  createdAt: string;
  /** ~480px wide. Use for grids and lists. Requires the session cookie (same origin). */
  thumbUrl: string;
  /** Up to 2048px on the long side. Use for the full-screen view. */
  fullUrl: string;
};

export type MediaWithTrip = MediaDTO & { tripTitle: string };

/** Response body of POST /api/media (multipart/form-data). */
export type UploadResponse =
  | { ok: true; media: MediaDTO }
  | { ok: false; error: MessageKeyString; status: number };

/** Hard server limit per file. The browser must shrink photos below this BEFORE upload
 *  (Vercel rejects request bodies over 4.5 MB). Aim for <= 2.5 MB after resizing. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
/** What the server accepts. The browser should upload image/jpeg or image/webp. */
export const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
