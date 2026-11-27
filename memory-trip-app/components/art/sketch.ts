// Pencil-line helpers for the hand-drawn doodles. Pure and deterministic (same input, same
// drawing), so server and browser render exactly the same SVG and tests can check it.

export type Pt = [number, number];

/** Small deterministic random numbers (mulberry32). */
export function rng(seed: number): () => number {
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

/** One wobbly pass through the points: every segment is a slightly bent curve. */
function pass(points: Pt[], closed: boolean, wobble: number, rand: () => number): string {
  const pts = closed ? [...points, points[0]] : points;
  const j = () => (rand() - 0.5) * 2 * wobble;
  let d = `M${f(pts[0][0] + j())} ${f(pts[0][1] + j())}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    d += ` Q${f((x0 + x1) / 2 + j() * 1.6)} ${f((y0 + y1) / 2 + j() * 1.6)} ${f(x1 + j())} ${f(y1 + j())}`;
  }
  return d;
}

/** A pencil line: drawn twice with a little wobble, like going over a shape again. */
export function sketch(points: Pt[], seed: number, opts: { closed?: boolean; wobble?: number } = {}): string {
  if (points.length < 2) return "";
  const { closed = false, wobble = 1.1 } = opts;
  const rand = rng(seed);
  return `${pass(points, closed, wobble, rand)} ${pass(points, closed, wobble * 0.8, rand)}`;
}

/** Corners of a rectangle turned by `deg` degrees around its centre. */
export function rotatedRect(cx: number, cy: number, w: number, h: number, deg: number): Pt[] {
  const a = (deg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return ([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]] as Pt[]).map(([x, y]) => [
    f(cx + x * cos - y * sin),
    f(cy + x * sin + y * cos),
  ]);
}

/** The top edge of a hand-painted brush stroke across `width` units, `height` tall. */
export function brushEdge(width: number, height: number, seed: number): { fill: string; streaks: string[] } {
  const rand = rng(seed);
  const steps = 14;
  const ys: number[] = [];
  for (let i = 0; i <= steps; i++) ys.push(height * (0.28 + rand() * 0.42));
  let fill = `M0 ${height} L0 ${f(ys[0])}`;
  for (let i = 1; i <= steps; i++) {
    const x = (i / steps) * width;
    const px = ((i - 0.5) / steps) * width;
    fill += ` Q${f(px)} ${f((ys[i - 1] + ys[i]) / 2 + (rand() - 0.5) * height * 0.35)} ${f(x)} ${f(ys[i])}`;
  }
  fill += ` L${width} ${height} Z`;
  // thin dry-brush streaks just above the edge
  const streaks: string[] = [];
  for (let k = 0; k < 4; k++) {
    const x0 = rand() * width * 0.8;
    const len = width * (0.08 + rand() * 0.14);
    const y = height * (0.18 + rand() * 0.2);
    streaks.push(`M${f(x0)} ${f(y)} Q${f(x0 + len / 2)} ${f(y - 2 - rand() * 3)} ${f(x0 + len)} ${f(y + rand() * 2)}`);
  }
  return { fill, streaks };
}
