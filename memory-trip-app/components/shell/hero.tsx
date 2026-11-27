"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { m, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { BrushEdge, Cursor } from "@/components/art/doodles";
import { rng } from "@/components/art/sketch";
import { useLocale } from "@/components/i18n/locale-provider";

/** Splits text into what a person sees as characters (Thai vowel and tone marks stay attached). */
function graphemes(text: string, locale: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return Array.from(new Intl.Segmenter(locale, { granularity: "grapheme" }).segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

const LETTER_COUNT = 34;

/** Faint letters drifting in the dark. Positions come from a fixed seed: the server and the
 *  browser draw the same ones. They are decoration only. */
function FloatingLetters({ pool }: { pool: string[] }) {
  const items = useMemo(() => {
    if (pool.length === 0) return [];
    const r = rng(7);
    return Array.from({ length: LETTER_COUNT }, (_, i) => ({
      key: i,
      ch: pool[Math.floor(r() * pool.length)],
      left: (r() * 96 + 2).toFixed(1),
      top: (r() * 88 + 4).toFixed(1),
      size: (12 + r() * 8).toFixed(0),
      dx: ((r() - 0.3) * 24).toFixed(0),
      dy: (-(10 + r() * 34)).toFixed(0),
      dur: (11 + r() * 10).toFixed(1),
      delay: (-r() * 12).toFixed(1),
      opacity: (0.3 + r() * 0.5).toFixed(2),
    }));
  }, [pool]);
  return (
    <div aria-hidden="true" className="absolute inset-0">
      {items.map((l) => (
        <span
          key={l.key}
          className="letter"
          style={
            {
              left: `${l.left}%`,
              top: `${l.top}%`,
              fontSize: `${l.size}px`,
              opacity: l.opacity,
              "--dx": `${l.dx}px`,
              "--dy": `${l.dy}px`,
              "--dur": `${l.dur}s`,
              "--delay": `${l.delay}s`,
            } as React.CSSProperties
          }
        >
          {l.ch}
        </span>
      ))}
    </div>
  );
}

/** Dark opening band: a big headline that types itself once, a short line, one button, two
 *  cursors (the two of you) and a hand-painted edge into the page. */
export function Hero({
  title,
  sub,
  cta,
}: {
  title: string;
  sub: string;
  cta: ReactNode;
}) {
  const locale = useLocale();
  const chars = useMemo(() => graphemes(title, locale), [title, locale]);
  const pool = useMemo(() => Array.from(new Set(graphemes(`${title}${sub}`, locale).filter((c) => /\S/.test(c) && !/[.,!?]/.test(c)))), [title, sub, locale]);
  // Server and first paint show the whole headline (works without JavaScript); the typing
  // replays it once, and only for people who have not asked for less motion.
  // `typed` is null while everything is shown. State only changes inside timer callbacks.
  const [typed, setTyped] = useState<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let n = 0;
    const start = window.setTimeout(() => setTyped(0), 0);
    const id = window.setInterval(() => {
      n += 1;
      if (n >= chars.length) {
        window.clearInterval(id);
        setTyped(null);
      } else {
        setTyped(n);
      }
    }, 70);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(id);
    };
  }, [chars]);
  const shown = typed ?? chars.length;

  // The two cursors lean toward the pointer, one the other way, like two people in the same
  // document. Springs keep them soft. Skipped when the system asks for reduced motion.
  const reduce = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 70, damping: 16 });
  const sy = useSpring(py, { stiffness: 70, damping: 16 });
  const ax = useTransform(sx, [-0.5, 0.5], [34, -34]);
  const ay = useTransform(sy, [-0.5, 0.5], [24, -24]);
  const bx = useTransform(sx, [-0.5, 0.5], [-48, 48]);
  const by = useTransform(sy, [-0.5, 0.5], [-30, 30]);
  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  // The line under the headline and the button arrive once the typing is nearly done.
  const settle = Math.min(chars.length * 0.07, 1.4);

  return (
    <section
      aria-labelledby="hero-title"
      onPointerMove={onPointerMove}
      className="hero relative left-1/2 -mt-[calc(1.5rem+env(safe-area-inset-top))] w-screen -translate-x-1/2 lg:-mt-12"
    >
      <FloatingLetters pool={pool} />
      <m.div style={{ x: ax, y: ay }} className="absolute bottom-[14%] left-[4%] hidden w-24 sm:block lg:w-32">
        <Cursor variant="outline" className="cursor-a w-full" seed={4} />
      </m.div>
      <m.div style={{ x: bx, y: by }} className="absolute top-[55%] right-[5%] w-12 sm:w-16 lg:w-20">
        <Cursor variant="filled" className="cursor-b w-full" seed={9} />
      </m.div>
      <div className="relative mx-auto flex min-h-[32rem] max-w-[60rem] flex-col items-center justify-center px-6 pt-24 pb-32 text-center lg:min-h-[38rem]">
        <h1 id="hero-title" className="display text-[clamp(2.75rem,9vw,6.5rem)]">
          <span className="sr-only">{title}</span>
          <span aria-hidden="true">
            {chars.slice(0, shown).join("")}
            <span className="opacity-0">{chars.slice(shown).join("")}</span>
            <span className="caret" />
          </span>
        </h1>
        <m.p
          className="mt-8 max-w-[32rem] text-[1.1875rem] leading-snug sm:text-[1.5rem]"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: settle, ease: [0.22, 0.8, 0.3, 1] }}
        >
          {sub}
        </m.p>
        <m.div
          className="mt-10"
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: settle + 0.25 }}
        >
          {cta}
        </m.div>
      </div>
      <BrushEdge className="absolute inset-x-0 -bottom-px h-8 text-surface-2 sm:h-14" seed={11} />
    </section>
  );
}
