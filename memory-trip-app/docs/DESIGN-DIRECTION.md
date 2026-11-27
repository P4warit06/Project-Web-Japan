# Design direction

Two earlier versions were rejected as generic. This one follows a reference the owner chose: [ellipsus.com](https://ellipsus.com/), a collaborative writing app. **Only its look and structure are borrowed** (layout, type character, colour feel, kinds of drawings); the drawings, words and wordmark are original to this app.

## What the reference does (read from two screenshots; sections below the fold were not seen)

| Part | Observed |
|---|---|
| Top bar | Full-width off-white bar, 3 px near-black line above it. Wordmark left, five links centre (some with chevrons), outlined "Log in" and solid black "Sign up" right (about 12 px corners). |
| Hero | Charcoal background. Huge, tightly set, high-contrast serif headline in white with a blinking text caret. A short sans subtitle, one white button. Faint letters scattered and drifting; a white outline cursor on the left and a purple cursor on the right (people writing together). |
| Transition | A light grey band with a hand-painted, uneven edge into the off-white page. |
| Statement | A large left-aligned serif sentence; one phrase in italic with a red wavy "spell-check" underline; an accent word in purple in the headline above it. |
| Illustration | Hand-drawn black line art: a stack of books, hanging paper cranes, small x-shaped sparkles. |
| Type | A display serif for statements, a clean grotesque for the interface. |
| Palette | Charcoal `#27282B`, off-white `#F4F4F1`, grey band `#E6E6E2`, near-black buttons, purple accent, red squiggle. |

## What changed here

| Reference | Memory Trip |
|---|---|
| Top bar | Same structure on screens 1024 px and wider (name, links, one primary button, 3 px ink line). Phones keep a bottom tab bar, because the app runs inside the LINE phone browser. |
| Hero with caret | Home opens with the dark hero: "Remember it together." types itself once (not for people who ask for reduced motion; the full text is always in the page for screen readers and no-JavaScript). |
| Floating letters, two cursors | Same idea, drawn from this page's own letters; the two cursors stand for the two of you. |
| Brush edge, grey band | Hand-painted SVG edge between hero, band and page. |
| Statement + squiggle | "Your camera roll keeps where you were. *Not what you talked about.*" (Thai version included). The wavy underline is native CSS (`text-decoration: wavy`). |
| Illustrations | Original line art: hanging **paper cranes** (origami, fitting for Japan), a **stack of prints**, sparkles. Drawn by code with a pencil-wobble helper, so there are no image files. |
| Type | **Instrument Serif** (Latin headlines; Thai headlines fall back to Taviraj), **Manrope** (Latin interface) with **Noto Sans Thai Looped** (Thai interface), Taviraj for the couple's own words. |

Kept from the previous round because it is specific to this subject: photos are **prints** with a white border and the orange film-date imprint (DSEG7), trips are routes with Japanese-named line colours.

## Tokens (`app/globals.css`)

Paper `#F4F4F1`, band `#E6E6E2`, ink `#17171A`, night `#27282B`, deep purple `#8A2AAE` for links and focus (6.3:1 on paper), bright purple `#C85BE8` only for large display text and the cursors (3.1:1, allowed for large text), squiggle `#E8454A`. Dark mode has its own set. Corners are 12 px.

## Accessibility and performance notes

- The hero headline has an `sr-only` copy with the full text; the typed text and the floating letters are `aria-hidden`.
- Motion (typing, drifting letters, floating cursors, caret blink) only runs when the system does not ask for reduced motion.
- Fonts are self-hosted (Next.js font loading in the app, Fontsource in the demo); doodles are inline SVG (no requests).

## Sample pictures in the demo

Soft-focus generated scenes with grain; placeholders. Upload your own photos to judge the real look.

## Not done yet

Station-stamp motif for places, "print the trip as a book" export, the reference's dropdown navigation (we have six flat links), and any sections of the reference below the hero (not seen).
