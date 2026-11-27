"use client";

import { m } from "motion/react";
import { BrushEdge, Crane, PrintStack, Sparkle } from "@/components/art/doodles";

/** A crane that sways on its thread (pivot at the top of the thread). */
function Sway({ className, delay = 0, children }: { className: string; delay?: number; children: React.ReactNode }) {
  return (
    <m.div
      className={className}
      style={{ transformOrigin: "50% 0%" }}
      animate={{ rotate: [-3.5, 3.5] }}
      transition={{ duration: 3.4, delay, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
    >
      {children}
    </m.div>
  );
}

/** A big, left-aligned sentence on the light grey band: plain serif, then one phrase in italic
 *  under a red wavy underline. Cranes and a stack of prints are drawn around it. The sentence
 *  rises into place once, when it scrolls into view. */
export function Statement({ lead, emphasis }: { lead: string; emphasis: string }) {
  return (
    <section
      aria-label={`${lead} ${emphasis}`}
      className="relative left-1/2 w-screen -translate-x-1/2 bg-surface-2 text-ink"
    >
      <Sway className="absolute top-0 right-[5%] hidden w-32 sm:block lg:w-44">
        <Crane thread={110} seed={3} className="w-full" />
      </Sway>
      <Sway className="absolute top-32 right-[17%] hidden w-24 sm:block lg:top-44 lg:w-32" delay={0.9}>
        <Crane thread={40} seed={8} className="w-full" />
      </Sway>
      <Sparkle seed={2} className="absolute top-12 right-[26%] hidden h-5 w-5 sm:block" />
      <Sparkle seed={5} className="absolute top-60 right-[4%] hidden h-4 w-4 sm:block" />
      <div className="relative mx-auto max-w-[64rem] px-6 pt-6 pb-28 sm:pt-10 lg:pb-40">
        <m.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -12% 0px" }}
          transition={{ duration: 0.8, ease: [0.22, 0.8, 0.3, 1] }}
        >
          <PrintStack className="mb-6 w-32 sm:w-44" />
          <p className="display max-w-[46rem] text-[clamp(2rem,5.6vw,4.25rem)]">
            {lead} <em className="squiggle">{emphasis}</em>
          </p>
        </m.div>
      </div>
      <BrushEdge className="absolute inset-x-0 -bottom-px h-8 text-paper sm:h-14" seed={21} />
    </section>
  );
}
