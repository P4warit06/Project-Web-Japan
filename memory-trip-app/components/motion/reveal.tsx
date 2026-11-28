"use client";

import { m } from "motion/react";
import type { ReactNode } from "react";

// Same rule as the page transition (app/(liff)/template.tsx): content must stay readable if
// the animation engine has not loaded yet (it loads on demand), so things start slightly
// dimmed and low, never invisible.
const EASE = [0.22, 0.8, 0.3, 1] as const; // quick start, soft landing
const VIEWPORT = { once: true, margin: "0px 0px -8% 0px" } as const;

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

/** Variants for the children of <Stagger>: set `variants={itemVariants}` on an `m.*` child. */
export const itemVariants = {
  hidden: { opacity: 0.4, y: 18, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE } },
};

/** A list whose items settle one after another when it scrolls into view. */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <m.ul className={className} variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT}>
      {children}
    </m.ul>
  );
}
