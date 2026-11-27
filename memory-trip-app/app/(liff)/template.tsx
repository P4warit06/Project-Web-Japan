"use client";

import { m } from "motion/react";

/** A template (unlike a layout) is created again on every navigation, so each page settles in
 *  with a small rise. Only movement, no fade: the server-rendered page stays visible while
 *  JavaScript loads. Skipped for people who ask for reduced motion (see MotionProvider).
 *  Docs: https://nextjs.org/docs/app/api-reference/file-conventions/template */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <m.div initial={{ y: 10 }} animate={{ y: 0 }} transition={{ duration: 0.35, ease: [0.22, 0.8, 0.3, 1] }}>
      {children}
    </m.div>
  );
}
