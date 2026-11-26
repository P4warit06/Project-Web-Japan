// Image validation and re-encoding. Treat every upload as hostile: check the real file type,
// cap the pixel count (decompression bombs), fix rotation, and re-encode so that EXIF data
// (GPS location, camera serial) and any hidden payload are dropped.
import sharp from "sharp";
import { MediaError } from "./errors";

export const MAX_PIXELS = 48_000_000; // 48 megapixels covers current phone cameras
export const FULL_MAX_SIDE = 2048;
export const THUMB_MAX_SIDE = 480;

export type ProcessedImage = {
  full: Buffer;
  thumb: Buffer;
  width: number;
  height: number;
  mimeType: "image/webp";
};

/** Detects JPEG, PNG or WebP from the first bytes (never from the file name or claimed type). */
export function sniffImageType(b: Buffer): "jpeg" | "png" | "webp" | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

export async function processImage(input: Buffer): Promise<ProcessedImage> {
  if (!sniffImageType(input)) throw new MediaError("errors.unsupportedImage", 415);

  try {
    const open = () => sharp(input, { limitInputPixels: MAX_PIXELS, failOn: "error" });

    // rotate() with no argument applies the EXIF orientation. Output carries no metadata.
    const fullPipeline = open()
      .rotate()
      .resize(FULL_MAX_SIDE, FULL_MAX_SIDE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 });
    const { data: full, info } = await fullPipeline.toBuffer({ resolveWithObject: true });

    const thumb = await open()
      .rotate()
      .resize(THUMB_MAX_SIDE, THUMB_MAX_SIDE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();

    return { full, thumb, width: info.width, height: info.height, mimeType: "image/webp" };
  } catch (err) {
    if (err instanceof MediaError) throw err;
    // Corrupt file, too many pixels, or a format that fails to decode.
    throw new MediaError("errors.unsupportedImage", 415);
  }
}
