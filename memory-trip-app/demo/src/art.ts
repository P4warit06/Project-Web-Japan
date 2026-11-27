// Sample "photos" for the demo: small generated SVG pictures, so the repository holds no
// real photos and the page makes no network requests. Same input -> same picture.

export type Palette = { skyTop: string; skyBottom: string; sun: string; far: string; near: string; accent: string };

export const PALETTES = {
  spring: { skyTop: "#f7c6d4", skyBottom: "#fdeee6", sun: "#fff4d6", far: "#9fb4d6", near: "#4c6a8f", accent: "#e8739a" },
  dusk: { skyTop: "#2b3a78", skyBottom: "#f19a6b", sun: "#ffd27a", far: "#5a4a7a", near: "#241c3a", accent: "#c4301c" },
  night: { skyTop: "#0c1230", skyBottom: "#2a2f66", sun: "#f5f1d8", far: "#1a2150", near: "#0b0f26", accent: "#f2a1c0" },
  winter: { skyTop: "#a9c4e8", skyBottom: "#eef4fb", sun: "#ffffff", far: "#c9d7ea", near: "#8aa0c0", accent: "#4a6fa5" },
} satisfies Record<string, Palette>;

/** Small deterministic random numbers (mulberry32), so a picture never changes between runs. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => Math.round(n * 10) / 10;

function frame(w: number, h: number, p: Palette, body: string, id: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${p.skyTop}"/><stop offset="1" stop-color="${p.skyBottom}"/></linearGradient></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#${id})"/>${body}</svg>`
  );
}

/** A big mountain with a snow cap and a low sun. */
function mountain(w: number, h: number, p: Palette, seed: number): string {
  const r = rng(seed);
  const peakX = w * (0.45 + r() * 0.15);
  const peakY = h * 0.34;
  const baseY = h * 0.72;
  const half = w * 0.52;
  const snowY = peakY + h * 0.13;
  const snowHalf = half * ((snowY - peakY) / (baseY - peakY));
  return (
    `<circle cx="${f(w * 0.22)}" cy="${f(h * 0.3)}" r="${f(h * 0.09)}" fill="${p.sun}" opacity=".9"/>` +
    `<polygon points="${f(peakX - half)},${f(baseY)} ${f(peakX)},${f(peakY)} ${f(peakX + half)},${f(baseY)}" fill="${p.far}"/>` +
    `<polygon points="${f(peakX - snowHalf)},${f(snowY)} ${f(peakX)},${f(peakY)} ${f(peakX + snowHalf)},${f(snowY)} ${f(peakX + snowHalf * 0.4)},${f(snowY + h * 0.03)} ${f(peakX)},${f(snowY - h * 0.01)} ${f(peakX - snowHalf * 0.45)},${f(snowY + h * 0.035)}" fill="#fff" opacity=".92"/>` +
    `<path d="M0 ${f(h * 0.82)} Q ${f(w * 0.3)} ${f(h * 0.7)} ${f(w * 0.6)} ${f(h * 0.8)} T ${w} ${f(h * 0.78)} V ${h} H0 Z" fill="${p.near}"/>`
  );
}

/** A torii gate against a setting sun. */
function torii(w: number, h: number, p: Palette): string {
  const cx = w / 2;
  const top = h * 0.3;
  const span = w * 0.5;
  const post = w * 0.035;
  const ground = h * 0.82;
  return (
    `<circle cx="${f(cx)}" cy="${f(h * 0.46)}" r="${f(h * 0.2)}" fill="${p.sun}" opacity=".85"/>` +
    `<path d="M0 ${f(ground)} Q ${f(w * 0.5)} ${f(h * 0.76)} ${w} ${f(ground)} V ${h} H0 Z" fill="${p.near}"/>` +
    `<rect x="${f(cx - span / 2)}" y="${f(top)}" width="${f(span)}" height="${f(h * 0.045)}" rx="6" fill="${p.accent}"/>` +
    `<rect x="${f(cx - span / 2 - w * 0.03)}" y="${f(top - h * 0.03)}" width="${f(span + w * 0.06)}" height="${f(h * 0.035)}" rx="6" fill="${p.accent}"/>` +
    `<rect x="${f(cx - span * 0.36)}" y="${f(top + h * 0.11)}" width="${f(span * 0.72)}" height="${f(h * 0.03)}" fill="${p.accent}"/>` +
    `<rect x="${f(cx - span * 0.36 - post / 2)}" y="${f(top)}" width="${f(post)}" height="${f(ground - top)}" fill="${p.accent}"/>` +
    `<rect x="${f(cx + span * 0.36 - post / 2)}" y="${f(top)}" width="${f(post)}" height="${f(ground - top)}" fill="${p.accent}"/>`
  );
}

/** A moon and a branch full of blossoms. */
function blossom(w: number, h: number, p: Palette, seed: number): string {
  const r = rng(seed);
  let out = `<circle cx="${f(w * 0.74)}" cy="${f(h * 0.24)}" r="${f(h * 0.1)}" fill="${p.sun}"/>`;
  for (let i = 0; i < 40; i++) {
    out += `<circle cx="${f(r() * w)}" cy="${f(r() * h * 0.55)}" r="${f(1 + r() * 2)}" fill="#fff" opacity="${f(0.3 + r() * 0.6)}"/>`;
  }
  out += `<path d="M${f(-10)} ${f(h * 0.9)} C ${f(w * 0.25)} ${f(h * 0.6)}, ${f(w * 0.5)} ${f(h * 0.7)}, ${f(w * 0.75)} ${f(h * 0.4)} S ${f(w * 0.95)} ${f(h * 0.3)} ${f(w + 10)} ${f(h * 0.2)}" fill="none" stroke="${p.near}" stroke-width="${f(w * 0.014)}" stroke-linecap="round"/>`;
  for (let i = 0; i < 70; i++) {
    const t = r();
    const x = t * w;
    const y = h * (0.9 - t * 0.62) + (r() - 0.5) * h * 0.22;
    out += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(w * (0.012 + r() * 0.018))}" fill="${p.accent}" opacity="${f(0.55 + r() * 0.4)}"/>`;
  }
  return out;
}

/** A street of paper lanterns. */
function lanterns(w: number, h: number, p: Palette, seed: number): string {
  const r = rng(seed);
  let out = `<rect y="${f(h * 0.78)}" width="${w}" height="${f(h * 0.22)}" fill="${p.near}"/>`;
  for (let row = 0; row < 3; row++) {
    const y = h * (0.2 + row * 0.2);
    out += `<line x1="0" y1="${f(y - h * 0.05)}" x2="${w}" y2="${f(y - h * 0.02)}" stroke="${p.far}" stroke-width="2"/>`;
    const n = 4 + row;
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5 + (r() - 0.5) * 0.3) * (w / n);
      const rad = w * (0.05 + r() * 0.02);
      out +=
        `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad * 2.1)}" fill="#ffb347" opacity=".12"/>` +
        `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rad)}" ry="${f(rad * 1.25)}" fill="#e8452c"/>` +
        `<rect x="${f(x - rad * 0.55)}" y="${f(y - rad * 1.4)}" width="${f(rad * 1.1)}" height="${f(rad * 0.25)}" fill="#2a1a1a"/>`;
    }
  }
  return out;
}

export type SceneKind = "mountain" | "torii" | "blossom" | "lanterns";

/** Returns an SVG picture as a data URL, ready for <img src>. */
export function scene(kind: SceneKind, palette: Palette, width = 1200, height = 900, seed = 1): string {
  const body =
    kind === "mountain" ? mountain(width, height, palette, seed)
    : kind === "torii" ? torii(width, height, palette)
    : kind === "blossom" ? blossom(width, height, palette, seed)
    : lanterns(width, height, palette, seed);
  const svg = frame(width, height, palette, body, `g${seed}`);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
