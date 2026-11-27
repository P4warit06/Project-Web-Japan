# Design direction

Why it changed: the first version (indigo on lavender-grey, rounded white cards, pill buttons, flat clip-art pictures) looked like every generated app. A memory book lives or dies by its **photos**, so the design now starts from the photo print, and everything else stays quiet around it.

## The one memorable thing: the photo print

Every photo is shown as a **print**: a white border, a hairline shadow, and the **orange date imprint of a disposable film camera** in the corner (`'26 3 29`). The imprint uses the DSEG7 seven-segment font ([DSEG](https://www.keshikan.net/fonts-e.html), packaged as [@fontsource/dseg7-classic](https://fontsource.org/fonts/dseg7-classic)). It repeats a date shown elsewhere, so it is hidden from screen readers (`aria-hidden`). Prints stay white in dark mode, like a real print on a dark table.

## Palette (CSS variables in `app/globals.css`)

| Token | Light | Role |
|---|---|---|
| paper | `#E9EBE4` | page: cool grey-green, a station platform in the morning |
| surface | `#F6F6F1` | fields, bars |
| ink | `#1A2528` | text and primary buttons (no coloured pill buttons) |
| accent (asagi) | `#14636F` | links, active tab, focus |
| print | `#FBFBF7` | photo border (same in dark mode) |
| imprint | `#E8832A` | film date only |
| danger | `#B3261E` | delete |

Trip line colours are named after Japanese traditional colours ([Traditional colors of Japan](https://en.wikipedia.org/wiki/Traditional_colors_of_Japan)): 藍 *ai*, 柿 *kaki*, 抹茶 *matcha*, 桜 *sakura*, 浅葱 *asagi*, 山吹 *yamabuki*. Dark mode has its own lighter set.

## Type

- **Taviraj** (serif): trip titles and the couple's own words, like the printed captions of an album. ([Google Fonts](https://fonts.google.com/specimen/Taviraj))
- **Noto Sans Thai Looped**: the interface. The looped style is the traditional, easier-to-read Thai. ([Google Fonts](https://fonts.google.com/noto/specimen/Noto+Sans+Thai+Looped))
- DSEG7 Classic: the imprint only.

## Shape

Square-ish (4 px) instead of rounded: fields, buttons, tags, prints. Primary button is solid ink; secondary is an ink outline. The demo notice is a dashed "perforated" ticket edge. The route line (trip = two stations joined by a line, memories as stops) stays as the structural device.

## Sample pictures in the demo

Real photos cannot be shipped (no rights, no network), and flat vector art looked cheap next to a print. The demo's pictures are generated soft-focus scenes with film grain and vignette (out-of-focus lights, misty ridges, hazy sunset). They are placeholders: **upload your own photos in the demo to judge the real look**.

## Not done yet (ideas, from DESIGN-INSPIRATION.md)

Station-stamp motif for places, "print the trip as a book" export, a looped face for long memory text.
