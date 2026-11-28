---
name: ux-ui-check
description: Check a UI change in memory-trip-app against the project's design direction and accessibility rules. Use after building or changing any page, component or style, together with the frontend-design skill.
---

# UX / UI check

Follow `memory-trip-app/docs/DESIGN-DIRECTION.md` (the visual rules) and use the
`frontend-design` skill for new design decisions. This skill is the verification step.

## Check

- **Phone first**: works at 360px wide; phones use bottom tabs, desktop uses the top bar.
- **Contrast**: text at least 4.5:1 (large text 3:1); bright purple only for large display text.
- **Keyboard and screen reader**: every control reachable and visibly focused; images have
  useful `alt` (decorative ones empty); one `h1` per page; form fields have labels.
- **Touch**: tap targets at least 44x44px.
- **Motion**: respects `prefers-reduced-motion`; content stays readable if JS has not loaded.
- **Thai text**: lines do not break mid-word badly; Thai font (Noto Sans Thai Looped / Taviraj) loads.
- **States**: loading, empty, error and success are all designed, not left blank.
- **Speed**: no layout shift; images sized; fonts limited to those already in use.

## Look at it for real

Run the app (`npm run dev` or `npm run demo:dev`) and open it with the Playwright MCP (or
`require('playwright')`). Take screenshots at 390px and 1280px wide, plus a reduced-motion run.
Report what you saw, not what the code suggests.
