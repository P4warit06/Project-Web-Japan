# Design inspiration for Memory Trip

Collected from a web search on 2026-11-26. Each link is a place to look at **pictures**; I read search summaries, not every page, so treat the notes as pointers and judge the visuals yourself. Where I say "not verified", I could not confirm it from the pages I saw.

Our current design: a trip drawn as a route line (rings at start and end, memories as stops), six per-trip line colours, indigo on paper-white, IBM Plex Sans Thai for the interface and Maitree (serif) for your own words.

## 1. Apps that already do "couple / travel memory"

| Look at | Why it is useful |
|---|---|
| [LoveMap](https://apps.apple.com/app/id6749547386) | Relationship memories on a shared travel map. A map-first home screen is a possible future view for our Places. |
| [TripMemo](https://apps.apple.com/app/tripmemo/id6752793213) | Shared "TripBook" where partners add photos and notes; leans on a Polaroid look. Good reference for photo cards. |
| [Travel Journal: Photo Diary](https://apps.apple.com/app/id1530384529) | Journal plus a map of countries and cities. |
| [TraveLog](https://apps.apple.com/app/id6747687350) | Exports a printable travel book (photos, captions, route). A "print our trip as a book" feature would be a strong later milestone. |
| [Hoptale](https://apps.apple.com/app/hoptale/id1441363420) | Another trip-storytelling app; look at the screenshots. |

Case studies (process and visuals):
- [Designing an interactive digital travel journal](https://contra.com/p/egUeULXW-designing-an-interactive-digital-travel-journal): digital journal that borrows from physical scrapbooks (cut-out pictures, location tags, notes).
- [Japan travel and memory-keeping app design](https://contra.com/p/BEgWNAFA-japa-travel-and-memory-keeping-app-design): same subject as ours.
- [Dribbble: Travel collection](https://dribbble.com/joashp/collections/7975533-Travel): mostly booking apps; skim for layout and photography, ignore the commerce patterns.

## 2. Japanese colour (the natural palette for trips to Japan)

Traditional colours (*dentōshoku*) are named after plants, flowers and animals, which fits a memory book. Sources disagree on exact hex values, so choose values by eye and keep contrast accessible.

- [Traditional colors of Japan (Wikipedia)](https://en.wikipedia.org/wiki/Traditional_colors_of_Japan): overview and history.
- [Stefan Imhoff: traditional colors of Japan](https://stefanimhoff.de/traditional-colors-of-japan/): swatches with meanings (e.g. 撫子色 *nadeshiko*, `#DC9FB4`, a pink named after dianthus flowers).
- [Tofugu: colour in Japan](https://tofugu.com/japan/color-in-japan) and [nippon.com: exploring Japanese colours](https://www.nippon.com/en/nipponblog/m00121/blue-for-go-exploring-japanese-colors.html): cultural meaning, so a colour is not used against its connotation.
- [Nippon Colors app](https://apps.apple.com/app/id1389937356) and its [case study](https://contra.com/p/7WPNvk6s-nippon-colors): a curated set of about 250 named colours. A site called nipponcolors.com is cited by secondary sources; I did not load it, so check it directly.

**Idea:** name our six trip colours after real traditional colours: indigo 藍 *ai*, persimmon 柿 *kaki*, matcha 抹茶 *matcha*, sakura 桜 *sakura*, teal 浅葱 *asagi*, gold 山吹 *yamabuki*. Show the name in the trip page ("Line colour: sakura"). Small touch, strong identity.

## 3. Japanese layout and typography

- [Best website designs from Japan (Designmodo)](https://designmodo.com/japan-websites): 20 examples; note brush typography and generous white space.
- [Maxibestof: Japanese websites](https://maxibestof.one/websites/japanese): large browsable directory.
- [5 web design galleries for Japanese design (Medium)](https://medium.com/design-bootcamp/5-web-design-galleries-to-enjoy-the-beautiful-japanese-web-design-27c16f7866eb): where to find more (many sites are in Japanese).
- [Washi Sōken template (Kombai)](https://kombai.com/gallery/inspirations/washi-soken/): the one *mobile* reference I found: serif display over a light sans, grid that drops from 3 to 2 columns on phones, section spacing reduced from 120px to 80px on mobile.

Pattern to borrow: large photography, calm type, a lot of empty space. Avoid imitating the dense, busy portal style; it does not suit a private memory book.

## 4. Thai + Latin typography

| Font | Note from the sources |
|---|---|
| [IBM Plex Sans Thai (Google Fonts)](https://fonts.google.com/specimen/IBM+Plex+Sans+Thai/about) | What we use for the interface. |
| [IBM Plex Sans Thai Looped](https://fontsource.org/fonts/ibm-plex-sans-thai-looped/about) | The *looped* style is the more traditional, easier-to-read Thai for body text. Worth testing for long memories. |
| [Noto Sans Thai Looped](https://fontsource.org/fonts/noto-sans-thai-looped/about) | Suitable for all text; sources say the loopless Noto Sans Thai is better for headlines than for body. |
| [Maitree](https://fonts.adobe.com/fonts/maitree) | What we use for your own words: serif for both scripts, wide proportions, large looped terminals. Good for reading. |

Not verified: how Sarabun pairs with these (no description found).

## 5. Design systems worth studying

- [Radix Primitives](https://radix-ui.com/primitives): unstyled, accessible building blocks that follow WAI-ARIA patterns; the reference for keyboard and screen-reader behaviour in dialogs, menus and forms. We could read its dialog pattern to harden our delete-confirmation sheet.
- Other accessibility-first libraries named in the results: Base UI, Ariakit, React Aria (no links verified).
- Not found in my search, but standard official references: [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) and [Material Design 3](https://m3.material.io) (touch targets, motion, accessibility on mobile). Not verified in this search.

## 6. Directions I would try next (pick one and I will brief the frontend agent)

1. **Scrapbook / Polaroid photo cards**: white borders, slight caption strip with date and place; memories shown as "pinned" notes on the route line.
2. **Named Japanese colours** (section 2): rename and slightly retune the six line colours; add a washi-paper texture to the page background in light mode.
3. **Hanko / ticket motifs**: each place visited becomes a stamp on the trip, like a station stamp book. Strong Japan identity without clichés like cherry-blossom wallpaper.
4. **Print as a book** (from TraveLog): export a trip to a PDF with photos and captions. A feature, not just a style.
5. **Looped Thai for long text**: switch memory body text to a looped face and compare readability on a phone.
