// Hand-drawn line art in the spirit of ellipsus.com (paper cranes, a stack of papers, sparkles,
// two cursors), drawn for this app. All decorative: hidden from screen readers.
import { brushEdge, rotatedRect, sketch, type Pt } from "./sketch";

type Art = { className?: string };

const common = { "aria-hidden": true, focusable: false } as const;

/** An origami crane hanging from a thread: wings up, long neck, raised tail. */
export function Crane({ className, thread = 70, seed = 3 }: Art & { thread?: number; seed?: number }) {
  const paper = "var(--surface-2)";
  // drawn back to front, so each piece hides the lines of the one behind it
  const shapes: { pts: Pt[]; closed: boolean }[] = [
    { pts: [[96, 54], [122, 30], [126, 38], [104, 62]], closed: true }, // neck
    { pts: [[122, 30], [136, 36], [126, 38]], closed: true }, // head and beak
    { pts: [[42, 58], [14, 80], [52, 66]], closed: true }, // tail
    { pts: [[40, 58], [72, 44], [102, 58], [72, 78]], closed: true }, // body
    { pts: [[70, 44], [34, 8], [52, 56]], closed: true }, // left wing
    { pts: [[74, 44], [112, 12], [96, 58]], closed: true }, // right wing
  ];
  return (
    <svg {...common} viewBox={`0 ${-thread} 140 ${100 + thread}`} className={className}>
      <path className="doodle" d={sketch([[72, -thread], [72, 46]], seed, { wobble: 0.5 })} />
      {shapes.map((s, i) => (
        <path key={i} className="doodle" fill={paper} d={sketch(s.pts, seed + i, { closed: s.closed, wobble: 0.9 })} />
      ))}
      <path className="doodle" d={sketch([[70, 44], [64, 70]], seed + 20, { wobble: 0.5 })} />
    </svg>
  );
}

/** A small stack of prints, tilted a little each, with a photo window on the top one. */
export function PrintStack({ className, seed = 5 }: Art & { seed?: number }) {
  const paper = "var(--paper)";
  const cards = [
    { pts: rotatedRect(80, 84, 120, 78, -7), fill: "var(--surface)" },
    { pts: rotatedRect(78, 70, 120, 78, 4), fill: "var(--surface)" },
    { pts: rotatedRect(82, 54, 120, 78, -2), fill: paper },
  ];
  return (
    <svg {...common} viewBox="0 0 170 140" className={className}>
      {cards.map((c, i) => (
        <path key={i} className="doodle" fill={c.fill} d={sketch(c.pts, seed + i, { closed: true, wobble: 1.4 })} />
      ))}
      <path className="doodle" d={sketch(rotatedRect(82, 50, 92, 46, -2), seed + 9, { closed: true })} />
      <path className="doodle" d={sketch([[40, 86], [100, 88]], seed + 12, { wobble: 0.8 })} />
      <path className="doodle" d={sketch([[44, 94], [84, 95]], seed + 13, { wobble: 0.8 })} />
    </svg>
  );
}

/** A little "x" star. */
export function Sparkle({ className, seed = 1 }: Art & { seed?: number }) {
  return (
    <svg {...common} viewBox="-10 -10 20 20" className={className}>
      <path className="doodle" strokeWidth={1.6} d={sketch([[-7, -7], [7, 7]], seed, { wobble: 0.6 })} />
      <path className="doodle" strokeWidth={1.6} d={sketch([[7, -7], [-7, 7]], seed + 1, { wobble: 0.6 })} />
    </svg>
  );
}

const CURSOR: Pt[] = [[8, 6], [56, 34], [34, 40], [24, 66]];

/** A mouse-pointer arrow: the two people writing in the same book. */
export function Cursor({ className, variant, seed = 2 }: Art & { variant: "filled" | "outline"; seed?: number }) {
  const filled = variant === "filled";
  return (
    <svg {...common} viewBox="0 0 64 74" className={className}>
      <path
        d={sketch(CURSOR, seed, { closed: true, wobble: filled ? 0.9 : 1.6 })}
        fill={filled ? "var(--accent-bright)" : "none"}
        stroke={filled ? "var(--accent-bright)" : "var(--on-night)"}
        strokeWidth={filled ? 3 : 2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A hand-painted edge between two bands. Colour it with `text-*`; it is drawn in currentColor. */
export function BrushEdge({ className, seed = 11 }: Art & { seed?: number }) {
  const { fill, streaks } = brushEdge(1440, 70, seed);
  return (
    <svg {...common} viewBox="0 0 1440 70" preserveAspectRatio="none" className={`w-full ${className ?? ""}`}>
      <path d={fill} fill="currentColor" />
      {streaks.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".55" />
      ))}
    </svg>
  );
}
