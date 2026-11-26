// SECURITY: uploads are hostile until proven otherwise.
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { MediaError } from "@/features/media/errors";
import { MAX_PIXELS, processImage, sniffImageType } from "@/features/media/image";
import { makeJpeg, makePng, makeWebp } from "./support/images";

describe("sniffImageType", () => {
  it("detects real formats from bytes", async () => {
    expect(sniffImageType(await makeJpeg())).toBe("jpeg");
    expect(sniffImageType(await makePng())).toBe("png");
    expect(sniffImageType(await makeWebp())).toBe("webp");
  });
  it("rejects everything else", () => {
    for (const bad of [Buffer.from("MZ\x90\x00 fake exe"), Buffer.from("<svg onload=alert(1)>"), Buffer.from("GIF89a"), Buffer.alloc(0), Buffer.from("%PDF-1.7")]) {
      expect(sniffImageType(bad)).toBeNull();
    }
  });
});

describe("processImage", () => {
  it("outputs WebP, caps size at 2048 and makes a 480px thumbnail", async () => {
    const out = await processImage(await makeJpeg(4000, 3000));
    expect(out.mimeType).toBe("image/webp");
    expect([out.width, out.height]).toEqual([2048, 1536]);
    expect((await sharp(out.full).metadata()).format).toBe("webp");
    const t = await sharp(out.thumb).metadata();
    expect([t.format, t.width, t.height]).toEqual(["webp", 480, 360]);
  });

  it("never enlarges small images", async () => {
    const out = await processImage(await makeJpeg(100, 50));
    expect([out.width, out.height]).toEqual([100, 50]);
  });

  it("applies EXIF rotation, so the stored picture is upright", async () => {
    const out = await processImage(await makeJpeg(300, 200, { orientation: 6 }));
    expect([out.width, out.height]).toEqual([200, 300]);
  });

  it("strips EXIF metadata such as location or descriptions", async () => {
    const secret = "SECRET-HOME-ADDRESS-12345";
    const input = await makeJpeg(300, 200, { secret });
    expect(input.includes(Buffer.from(secret))).toBe(true); // sanity: the input really has it
    const out = await processImage(input);
    expect(out.full.includes(Buffer.from(secret))).toBe(false);
    expect(out.thumb.includes(Buffer.from(secret))).toBe(false);
    expect((await sharp(out.full).metadata()).exif).toBeUndefined();
  });

  it("accepts PNG (with alpha) and WebP", async () => {
    expect((await processImage(await makePng())).width).toBe(64);
    expect((await processImage(await makeWebp())).width).toBe(64);
  });

  it("rejects a non-image with a JPEG-looking name (415)", async () => {
    await expect(processImage(Buffer.from("MZ\x90\x00 this is an executable"))).rejects.toMatchObject({ key: "errors.unsupportedImage", status: 415 });
  });

  it("rejects a file with valid JPEG magic bytes but garbage inside", async () => {
    const fake = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from("not really a jpeg at all".repeat(20))]);
    await expect(processImage(fake)).rejects.toBeInstanceOf(MediaError);
  });

  it("rejects a decompression bomb (too many pixels)", async () => {
    const side = Math.ceil(Math.sqrt(MAX_PIXELS)) + 100;
    const bomb = await sharp({ create: { width: side, height: side, channels: 3, background: "#fff" } }).png({ compressionLevel: 9 }).toBuffer();
    expect(bomb.length).toBeLessThan(4 * 1024 * 1024); // small on disk, huge when decoded
    await expect(processImage(bomb)).rejects.toMatchObject({ status: 415 });
  }, 30_000);
});
