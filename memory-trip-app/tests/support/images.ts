import sharp from "sharp";

export async function makeJpeg(width = 800, height = 600, opts: { orientation?: number; secret?: string } = {}) {
  let img = sharp({ create: { width, height, channels: 3, background: { r: 200, g: 80, b: 60 } } }).jpeg({ quality: 80 });
  if (opts.secret) img = img.withExif({ IFD0: { ImageDescription: opts.secret } });
  if (opts.orientation) img = img.withMetadata({ orientation: opts.orientation });
  return img.toBuffer();
}

export const makePng = (w = 64, h = 64) =>
  sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 255, alpha: 0.5 } } }).png().toBuffer();

export const makeWebp = (w = 64, h = 64) =>
  sharp({ create: { width: w, height: h, channels: 3, background: "#123456" } }).webp().toBuffer();
