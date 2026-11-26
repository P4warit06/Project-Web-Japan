# Memory Trip

A private web app for one couple to keep trip memories: trips, places, written memories and photos, with a companion chatbot planned. Thai and English. Built to run inside the LINE in-app browser.

Requirements and plan: [`CLAUDE_HANDOFF.md`](./CLAUDE_HANDOFF.md) (original brief), [`docs/PLAN.md`](./docs/PLAN.md) (milestones). Deploying: [`docs/DEPLOY.md`](./docs/DEPLOY.md).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 7 + PostgreSQL · sharp · Vitest.
Free hosting target: Vercel + Neon + Cloudflare R2.

> This Next.js version has breaking changes. Before writing code, read the guides in `node_modules/next/dist/docs/` (see `AGENTS.md`).

## Quick start

```bash
docker compose up -d          # local PostgreSQL (dev + test databases)
cp .env.example .env.local    # set SESSION_SECRET: openssl rand -base64 32
npm ci
npm run db:migrate            # create tables
npm run db:seed               # demo users Alex and Sam
npm run dev                   # http://localhost:3000 (log in as a demo user)
```

## Commands

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev server / production build / run the build |
| `npm run lint` / `typecheck` | ESLint / TypeScript |
| `npm test` | Vitest on the PostgreSQL **test** database (it wipes its tables) |
| `npm run db:migrate` | Create/apply migrations in development |
| `npm run db:deploy` | Apply existing migrations (production/preview, run by hand) |
| `npm run db:seed` | Insert demo users (refuses to run in production) |

## Layout

```
app/            pages and API routes (route group (liff) = signed-in area)
components/     UI (ui, shell, trip, place, memory, media)
features/       business logic per feature: core.ts (database), schema.ts (validation),
                actions.ts (Server Actions), service.ts (reads for pages)
lib/            db, i18n, storage (local / R2), security helpers
prisma/         schema and migrations
tests/          Vitest suites (isolation between couples, uploads, forms)
```

## Security rules of this codebase

- Every page, action and API route calls `requireMember()` (`features/auth/dal.ts`); the couple space always comes from the session, never from user input.
- All input is validated on the server with zod; error messages are i18n keys.
- Photos are re-encoded (EXIF/GPS removed), stored with random keys outside `public/`, and served only through `/api/media/[id]` after a membership check.
- Secrets live in environment variables only (`.env.local` is git-ignored).
