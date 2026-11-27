// The animation engine, loaded on demand (a separate file, not part of the first page load).
// domMax adds layout animations (the sliding pill in the top bar) on top of domAnimation.
// Docs: https://motion.dev/docs/react-lazy-motion
import { domMax } from "motion/react";

export default domMax;
