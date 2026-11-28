# UI demo on GitHub Pages

A clickable demo of the app's screens, to check how it looks and feels **before** deploying the real app.
Address: `https://<your-github-user>.github.io/Project-Web-Japan/` (for this repository: `https://p4warit06.github.io/Project-Web-Japan/`).

## What it is (and is not)

| | Demo (GitHub Pages) | Real app (Vercel) |
|---|---|---|
| Hosting | static files only | server + PostgreSQL + R2 |
| Screens and components | **the same files** (`components/`) | `components/` |
| Validation of forms | **the same rules** (`features/*/schema.ts`, zod) | same |
| Data | sample trips, kept in **your browser** (localStorage) | database |
| Photos | generated soft-focus sample pictures (placeholders, see [DESIGN-DIRECTION.md](./DESIGN-DIRECTION.md)); your uploads are shrunk and kept in the browser (about 20 fit) | re-encoded, stored in R2, private |
| Login, couple isolation, rate limits | **none** (nothing to protect: no server, no real data) | yes |

Why not run the real app on GitHub Pages? Pages can only serve files ([About GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)), and the real app needs a server for login, the database and photo processing. Next.js static export drops exactly those features ([Static Exports](https://nextjs.org/docs/app/guides/static-exports)).

Do not put real personal photos or secrets in the demo. The page is public, and although your data never leaves your browser, a shared computer can read it.

## How it works

- `demo/` is a small Vite app. Its vite config swaps two Next.js imports (`next/link`, `next/navigation`) for tiny stand-ins, so the real components run unchanged.
- Pages use the URL hash (`#/trips/abc`) because GitHub Pages cannot rewrite paths ([hashchange](https://developer.mozilla.org/docs/Web/API/Window/hashchange_event)).
- `demo/src/data.ts` is the "database" (pure functions, tested in `tests/demo-data.test.ts`); `demo/src/store.ts` saves it to localStorage; `demo/src/fake-api.ts` answers the uploader's `POST /api/media` inside the browser.
- Security: a Content-Security-Policy meta tag (own scripts only, no network requests), `no-referrer`, `noindex`, fonts self-hosted, saved data validated on load, internal-only navigation targets.

## Commands (from `memory-trip-app/`)

```bash
npm run demo:dev       # live demo at http://localhost:5174/Project-Web-Japan/
npm run demo:build     # writes dist-demo/
npm run demo:preview   # serves dist-demo/ at http://localhost:4173/Project-Web-Japan/
```

## Publishing (one-time setup, then automatic)

1. GitHub: **Settings > Pages > Build and deployment > Source: GitHub Actions**.
2. GitHub: **Settings > Environments > github-pages > Deployment branches**: allow `main` (a new Pages environment only accepts the default branch, otherwise the deploy step fails with "not allowed to deploy to github-pages due to environment protection rules").
3. Push to `main`, or run **Actions > Demo on GitHub Pages > Run workflow**. The address appears in the run summary.

The workflow runs the normal CI first (lint, typecheck, tests, build, audit) and only then publishes. Repositories on a free plan need to be **public** to use Pages ([plans](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages#about-github-pages)).

To stop publishing: remove `pages.yml`, or set Source back in Settings > Pages.
