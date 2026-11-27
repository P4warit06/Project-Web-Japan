// Sample "photos" for the demo. Real photos cannot be shipped (no rights, no network), and flat
// clip-art looks cheap next to a print, so these are soft-focus scenes with film grain and a
// vignette: out-of-focus lights, ridges fading into mist, a hazy sunset. They are generated
// SVG, so the repository holds no photos and the page makes no network requests.
// Same input -> same picture.

export type Palette = {
  top: string; // sky / background, top
  bottom: string; // sky / background, bottom
  glow: string; // the brightest light
  lights: string[]; // colours of out-of-focus lights
  far: string; // distant land (pale)
  near: string; // nearest land (dark)
};

export const PALETTES = {
  spring: { top: "#9fb4cf", bottom: "#f3d3d6", glow: "#fff0dc", lights: ["#ffd5dc", "#fff4ee", "#f4a7bb", "#ffe3c4"], far: "#aebdd2", near: "#4d5f7a" },
  dusk: { top: "#3a4a82", bottom: "#ee9a72", glow: "#ffd78a", lights: ["#ffb86b", "#ff8a5c", "#ffd9a0", "#d9576a"], far: "#8a7aa0", near: "#2b2540" },
  night: { top: "#0c1430", bottom: "#27315f", glow: "#ffd59a", lights: ["#ffb347", "#ff6b3d", "#ffd9a0", "#e8452c", "#7fd0e0"], far: "#2b3768", near: "#0a0e22" },
  winter: { top: "#9db4d3", bottom: "#f1f5fa", glow: "#ffffff", lights: ["#ffffff", "#dbe6f4", "#c2d3ea"], far: "#bccbe0", near: "#7d93b4" },
} satisfies Record<string, Palette>;

/** Small deterministic random numbers (mulberry32). */
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

/** Out-of-focus lights ("bokeh"): many soft discs, a few sharper ones for depth. */
function bokeh(w: number, h: number, p: Palette, seed: number, count: number, yMin: number, yMax: number): string {
  const r = rng(seed);
  let soft = "";
  let sharp = "";
  for (let i = 0; i < count; i++) {
    const x = r() * w;
    const y = h * (yMin + r() * (yMax - yMin));
    const rad = w * (0.025 + r() * r() * 0.11);
    const col = p.lights[Math.floor(r() * p.lights.length)];
    const op = 0.25 + r() * 0.55;
    const disc = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="${col}" opacity="${f(op)}"/>`;
    if (i % 5 === 0) sharp += disc;
    else soft += disc;
  }
  return `<g filter="url(#soft${seed})">${soft}</g><g filter="url(#crisp${seed})">${sharp}</g>`;
}

/** Ridges fading into mist: far ridges pale, near ridges dark, haze between them. */
function ridges(w: number, h: number, p: Palette, seed: number): string {
  const r = rng(seed);
  let out = `<circle cx="${f(w * (0.3 + r() * 0.4))}" cy="${f(h * 0.3)}" r="${f(h * 0.16)}" fill="${p.glow}" opacity=".85" filter="url(#soft${seed})"/>`;
  const layers = 5;
  for (let l = 0; l < layers; l++) {
    const t = l / (layers - 1); // 0 far .. 1 near
    const base = h * (0.42 + t * 0.4);
    const amp = h * (0.05 + t * 0.07);
    let d = `M0 ${h} L0 ${f(base)}`;
    const steps = 7;
    for (let i = 1; i <= steps; i++) {
      const x = (i / steps) * w;
      const y = base - amp * (0.2 + r() * 0.8);
      d += ` Q ${f(x - w / steps / 2)} ${f(y - amp * 0.6)} ${f(x)} ${f(y)}`;
    }
    d += ` L${w} ${h} Z`;
    const col = mix(p.far, p.near, t);
    out += `<path d="${d}" fill="${col}"/>`;
    if (l < layers - 1) {
      out += `<rect y="${f(base - amp)}" width="${w}" height="${f(h * 0.22)}" fill="url(#mist${seed})" opacity="${f(0.55 - t * 0.35)}"/>`;
    }
  }
  return out;
}

/** A low sun on a hazy horizon with a dark strip of land. */
function horizon(w: number, h: number, p: Palette, seed: number): string {
  const r = rng(seed);
  const y = h * 0.62;
  let land = `M0 ${h} L0 ${f(y)}`;
  for (let i = 1; i <= 12; i++) land += ` L${f((i / 12) * w)} ${f(y + (r() - 0.5) * h * 0.035)}`;
  land += ` L${w} ${h} Z`;
  return (
    `<circle cx="${f(w * 0.5)}" cy="${f(y - h * 0.05)}" r="${f(h * 0.3)}" fill="${p.glow}" opacity=".55" filter="url(#soft${seed})"/>` +
    `<circle cx="${f(w * 0.5)}" cy="${f(y - h * 0.04)}" r="${f(h * 0.075)}" fill="${p.glow}" filter="url(#crisp${seed})"/>` +
    `<rect y="${f(y - h * 0.12)}" width="${w}" height="${f(h * 0.2)}" fill="url(#mist${seed})" opacity=".6"/>` +
    `<path d="${land}" fill="${p.near}" filter="url(#crisp${seed})"/>`
  );
}

function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

export type SceneKind = "lanterns" | "blossom" | "ridges" | "horizon";

/** Returns an SVG picture as a data URL, ready for <img src>. */
export function scene(kind: SceneKind, p: Palette, width = 1200, height = 900, seed = 1): string {
  const w = width;
  const h = height;
  const body =
    kind === "lanterns" ? bokeh(w, h, p, seed, 34, 0.05, 0.85)
    : kind === "blossom" ? bokeh(w, h, p, seed, 46, 0.0, 0.8)
    : kind === "ridges" ? ridges(w, h, p, seed)
    : horizon(w, h, p, seed);
  const ground = kind === "lanterns" ? `<rect y="${f(h * 0.82)}" width="${w}" height="${f(h * 0.18)}" fill="${p.near}" opacity=".9"/>` : "";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
    `<defs>` +
    `<linearGradient id="sky${seed}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.top}"/><stop offset="1" stop-color="${p.bottom}"/></linearGradient>` +
    `<linearGradient id="mist${seed}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.bottom}" stop-opacity="0"/><stop offset=".6" stop-color="${p.bottom}"/><stop offset="1" stop-color="${p.bottom}" stop-opacity="0"/></linearGradient>` +
    `<radialGradient id="vig${seed}" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></radialGradient>` +
    `<filter id="soft${seed}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${f(w * 0.011)}"/></filter>` +
    `<filter id="crisp${seed}"><feGaussianBlur stdDeviation="${f(w * 0.0025)}"/></filter>` +
    `<filter id="grain${seed}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="${seed}"/><feColorMatrix type="saturate" values="0"/></filter>` +
    `</defs>` +
    `<rect width="${w}" height="${h}" fill="url(#sky${seed})"/>${body}${ground}` +
    `<rect width="${w}" height="${h}" filter="url(#grain${seed})" opacity=".16" style="mix-blend-mode:overlay"/>` +
    `<rect width="${w}" height="${h}" fill="url(#vig${seed})"/>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
