"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

const loadFeatures = () => import("./features").then((mod) => mod.default);

/** Wraps the app once. `m.*` components inside animate only after the engine has loaded, so it
 *  stays out of the first page load. `reducedMotion="user"` makes Motion skip movement (x, y,
 *  scale, rotate, layout) for people whose system asks for less motion; opacity may still fade.
 *  Docs: https://motion.dev/docs/react-accessibility */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
