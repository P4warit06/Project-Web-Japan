// The doodles are drawn from pure functions, so the server and the browser must draw the same
// picture (otherwise React reports a hydration mismatch) and the output must stay well-formed.
import { describe, expect, it } from "vitest";
import { brushEdge, rng, rotatedRect, sketch } from "../components/art/sketch";

describe("sketch helpers", () => {
  it("random numbers are repeatable and in range", () => {
    const a = rng(5);
    const b = rng(5);
    const xs = Array.from({ length: 50 }, () => a());
    expect(xs).toEqual(Array.from({ length: 50 }, () => b()));
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
    expect(rng(6)()).not.toBe(rng(5)());
  });

  it("draws the same pencil line every time, and a different one for another seed", () => {
    const pts: [number, number][] = [[0, 0], [10, 10], [20, 0]];
    expect(sketch(pts, 1)).toBe(sketch(pts, 1));
    expect(sketch(pts, 1)).not.toBe(sketch(pts, 2));
  });

  it("returns a well-formed path (numbers only, starts with a move) and nothing for one point", () => {
    const d = sketch([[0, 0], [30, 5], [12, 40]], 3, { closed: true });
    expect(d.startsWith("M")).toBe(true);
    expect(d).not.toMatch(/NaN|undefined|Infinity/);
    expect(sketch([[1, 1]], 1)).toBe("");
  });

  it("a closed shape has one more segment than an open one", () => {
    const pts: [number, number][] = [[0, 0], [10, 0], [10, 10]];
    const segments = (d: string) => (d.match(/Q/g) ?? []).length;
    expect(segments(sketch(pts, 1, { closed: true }))).toBe(segments(sketch(pts, 1)) + 2); // two passes
  });

  it("rotates a rectangle around its centre", () => {
    const [a, b, c, d] = rotatedRect(50, 50, 20, 10, 0);
    expect([a, b, c, d]).toEqual([[40, 45], [60, 45], [60, 55], [40, 55]]);
    const turned = rotatedRect(50, 50, 20, 10, 90);
    expect(turned[0]).toEqual([55, 40]);
  });

  it("brush edge stays inside its box and is repeatable", () => {
    const e = brushEdge(1440, 70, 11);
    expect(e).toEqual(brushEdge(1440, 70, 11));
    expect(e.fill.endsWith("Z")).toBe(true);
    expect(e.fill).not.toMatch(/NaN/);
    expect(e.streaks).toHaveLength(4);
  });
});
