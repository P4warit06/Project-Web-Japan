// Browser-side photo shrinking. Runs before upload so every request stays far below the
// 4 MB server limit (Vercel rejects larger bodies). Re-encoding through a canvas also drops
// EXIF metadata such as GPS location. Pure client code: never import from a Server Component.

export const MAX_SIDE = 2048;
export const TARGET_BYTES = 2.5 * 1024 * 1024;
const QUALITIES = [0.85, 0.75, 0.65, 0.55];

export type ShrinkResult =
  | { ok: true; blob: Blob }
  | { ok: false; error: "errors.unsupportedImage" | "errors.fileTooLarge" };

type Drawable = { source: CanvasImageSource; width: number; height: number; close: () => void };

async function decode(file: File): Promise<Drawable | null> {
  // Preferred path: applies the EXIF orientation, so tall phone photos stay upright.
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      // fall through to <img> decoding (older WebViews, some HEIC cases)
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    // Browsers apply EXIF orientation to <img> by default.
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => {} };
  } catch {
    return null;
  } finally {
    // The decoded image keeps its pixels; the URL itself is no longer needed.
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

export async function shrinkPhoto(file: File): Promise<ShrinkResult> {
  if (file.type && !file.type.startsWith("image/")) return { ok: false, error: "errors.unsupportedImage" };
  const drawable = await decode(file);
  if (!drawable || drawable.width === 0 || drawable.height === 0) {
    return { ok: false, error: "errors.unsupportedImage" };
  }
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(drawable.width, drawable.height));
    const w = Math.max(1, Math.round(drawable.width * scale));
    const h = Math.max(1, Math.round(drawable.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { ok: false, error: "errors.unsupportedImage" };
    // JPEG has no alpha: paint white first so transparent PNGs do not turn black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(drawable.source, 0, 0, w, h);
    for (const q of QUALITIES) {
      const blob = await toBlob(canvas, q);
      if (!blob) return { ok: false, error: "errors.unsupportedImage" };
      if (blob.size <= TARGET_BYTES) return { ok: true, blob };
    }
    return { ok: false, error: "errors.fileTooLarge" };
  } finally {
    drawable.close();
  }
}
