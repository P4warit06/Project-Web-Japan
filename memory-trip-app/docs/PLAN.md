# Memory Trip App — Implementation Plan

Source requirements: [`CLAUDE_HANDOFF.md`](../CLAUDE_HANDOFF.md) (read in full).
Status of repo at planning time: Next.js 16.2.10 + React 19.2 + Tailwind 4 + Prisma 7.8 scaffold, no models, no auth, default starter page.

**Goal:** a private web app for a couple to keep trip memories (trips, places, photos, notes) plus a companion chatbot, later reachable inside LINE.

**Rule from handoff:** work milestone by milestone; do **not** touch LINE or a real AI provider before Trip/Memory CRUD works. Run `npm run lint` and `npm run build` at the end of every milestone.

---

## Confirmed decisions (from you)

| Topic | Decision | Effect on plan |
|---|---|---|
| D2 `next-auth` | Drop it, use small custom session | M0.2, M2.3 as written |
| D1 photo location | You answered "OK with public/" — **ambiguous** (keep `public/`, or accept my move out of it?). Plan keeps the **secure default (outside `public/`)** | Costs almost nothing either way because storage sits behind an interface. Tell me if you really want `public/uploads/`; it is acceptable only for throw-away dev data on your own machine, never for production |
| Language | Thai **and** English | New task 2.0 (i18n); crisis-phrase list in both languages |
| Users | One couple only (2 people) | Simplifies auth/invites: see "Single-couple mode" below |
| AI + hosting | You asked for my recommendation, free tier | See "Recommended free stack" below |
| Database (phase 2) | **PostgreSQL everywhere** (chosen over SQLite-in-dev and Turso) | Replaces the SQLite plan from the handoff. One schema and one migration set for dev, tests and production. Local dev: `docker compose up -d` or a free Neon branch. SQLite-specific notes below (D3, D4) are now historical |

### Single-couple mode
Keep the `CoupleSpace` table and keep scoping every query by it (cheap, and it is a second line of defence), but:
- No public sign-up. The couple space is created by the seed/bootstrap script.
- Exactly 2 `CoupleMember` rows allowed (enforced in the service layer + test). The partner joins with one single-use, expiring invite code; after that, invites are disabled.
- Production login accepts only users already in the couple (LINE `sub` allowlist). Any other LINE account gets 403.
- Drops the multi-tenant work (invite management UI, space switcher) from M7.

### Recommended free stack (verified July–Oct 2026 sources; confirm at sign-up, free tiers change)

| Need | Recommendation | Why / caveat |
|---|---|---|
| Hosting (Next.js 16) | [Vercel Hobby](https://vercel.com/docs/plans/hobby-plan) | Free, made by the Next.js team. Restricted to **non-commercial personal use** — fine for a private couple app. Serverless: **no persistent disk**, so SQLite/local uploads cannot be used in production |
| Database | [Neon Postgres](https://neon.com/faqs/free-plan-limits-and-quotas) free plan | Per Neon FAQ (updated Oct 2026): 1 GB storage/project, 100 CU-hours/project, no overage billing. Text/metadata only, so 1 GB is plenty. Older pages still quote 0.5 GB — check the live pricing page |
| Photos | [Cloudflare R2](https://developers.cloudflare.com/r2/pricing) | 10 GB-month free storage, zero egress fees, S3-compatible (matches the `StorageProvider` interface). May ask for a payment method on sign-up — check; set a billing alert |
| Chatbot | Start with `AI_PROVIDER=mock`. Optional later: [Gemini API free tier](https://ai.google.dev/gemini-api/docs/rate-limits) | Free-tier limits and model list change often (sources disagree) — read AI Studio at that time. **Privacy warning:** one source states free-tier content may be used to improve Google products. Your chats and memories are intimate, so either keep AI on mock, or pay for a tier that excludes training use, or send only the minimum approved context. Decide at M6 |
| LINE | [LINE Official Account free plan](https://developers.line.biz/en/docs/messaging-api/pricing/) | Thailand free plan is about 300 *pushed* messages/month; **reply messages are not counted**. So design the bot to **reply only** (never push). A source reports LINE Thailand will start charging above 25,000 free replies/month from Feb 2027 — irrelevant for two people, but verify |
| Tunnel for local LINE tests | Cloudflare Tunnel (free) or ngrok free | Needed only in M7/M8 |

Cost expectation: **0 baht/month** for two people if you stay within these limits.

**Vercel upload limit:** a Vercel Function request body is capped at [4.5 MB](https://vercel.com/docs/functions/limitations), including Server Actions and Route Handlers. A raw phone photo (5–12 MB) will fail with 413. Therefore the browser **resizes/compresses each photo to ≤ ~2048 px JPEG/WebP before upload** (canvas; also removes EXIF), and the server still re-validates and re-encodes. See updated M3.

---

## 0. Findings & decisions (read first)

These are places where the handoff needs a decision or a correction. Each has a recommendation; override any of them before we start.

| # | Finding | Decision / recommendation |
|---|---|---|
| D1 | Handoff says store dev images in `public/uploads/`. Files in `public/` are served **without authentication** to anyone with the URL. That contradicts the handoff's own rule "photos are private, never public by accident". | Store files in `storage/uploads/` (outside `public/`, git-ignored) and serve them through an authenticated route handler `GET /api/media/[id]`, which checks CoupleSpace membership. Same interface later maps to S3/R2 signed URLs. |
| D2 | `package.json` already contains `next-auth@4`, but handoff wants LINE ID-token verification on the server and a local mock login first. next-auth v4 targets older Next versions; we need only a small custom flow. | Remove `next-auth`. Use the stateless-session + Data Access Layer pattern from the bundled Next docs (`node_modules/next/dist/docs/01-app/02-guides/authentication.md`) with [`jose`](https://github.com/panva/jose) for signed cookies. Auth sits behind a `getSession()` interface so mock login (M2) and LINE login (M7) are swappable. |
| D3 | Prisma 7 changed setup: the datasource `url` lives in `prisma.config.ts` (already so), and the client needs a **driver adapter**. SQLite uses `@prisma/adapter-better-sqlite3`; Postgres uses `@prisma/adapter-pg`. | `lib/db.ts` picks the adapter from `DATABASE_URL`. Keep the schema free of SQLite-only features so the M9 switch is mechanical. |
| D4 | `MemoryEntry.tags` is a list. SQLite does not support scalar lists. | Model `Tag` + implicit many-to-many (works on both SQLite and Postgres). Do not use `String[]` or a CSV string. |
| D5 | `.gitignore` has `.env*`, which also ignores `.env.example`; a root `.DS_Store` is committed. | Add `!.env.example`; `git rm --cached .DS_Store`; add root `.gitignore`. |
| D6 | Handoff lists API routes for everything. Next 16 recommends Server Actions for in-app mutations (with built-in Origin check) and Route Handlers for non-form endpoints. | Server Actions for create/update/delete of trips, places, memories, chat clear. Route Handlers only for: uploads, media streaming, chat streaming (M6), LINE auth/webhook. Both call the same `features/*` service layer. |
| D7 | Next 16 renamed `middleware` to **`proxy.ts`**, and `params`/`searchParams` are `Promise`s (must be `await`ed). `proxy.ts` is for optimistic checks only. | Use `proxy.ts` only for cheap "has session cookie?" redirects. **Real authorization lives in the DAL**, called by every page, action and route handler. |
| D8 | Photos carry EXIF (often GPS coordinates of your home). Showing/serving originals leaks location. | Re-encode every upload with [`sharp`](https://sharp.pixelplumbing.com/) (strips metadata, validates it is a real image, makes thumbnails). Validate by magic bytes, not by the client's `Content-Type`. |
| D9 | Handoff model list lacks fields needed for safety/perf. | Add: `MediaAsset.sizeBytes/uploadedById/createdAt`, unique `(coupleSpaceId,userId)` on `CoupleMember`, indexes on every foreign key + `(tripId, happenedAt)`, `ChatSession.memoryEnabled`, `AiMemory` consent fields. `Trip.coverMediaId` is nullable with `onDelete: SetNull` to avoid a circular-delete problem. |
| D10 | Handoff paths mention `/Users/pawarits/Desktop/...`. | Ignore; work from repo root `memory-trip-app/`. |

---

## 1. Architecture

```
Browser ──► Server Components / Server Actions ──► features/<x>/service ──► lib/db (Prisma)
                      │                                   ▲
                      └─► features/auth/dal (requireMember)┘   every query scoped by coupleSpaceId
Route Handlers: /api/media (upload+stream), /api/chat/*, /api/auth/line, /api/line/webhook
lib/storage: LocalStorage  ◄── interface ──►  S3Storage (M9)
lib/ai:      MockProvider  ◄── interface ──►  RealProvider (M6)
```

Principles (per your preferences — good engineering, security, performance):

- **Feature folders** (`features/trips`, `features/memories`, …) hold `schema.ts` (zod), `service.ts` (DB logic), `actions.ts` (Server Actions). Pages stay thin. See [Next project structure](https://nextjs.org/docs/app/getting-started/project-structure).
- **Single choke point for authorization:** `features/auth/dal.ts` exposes `requireSession()` and `requireMember(coupleSpaceId)`. Services take `coupleSpaceId` from the session, **never from client input**. This prevents [IDOR / broken access control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/).
- **Validate all input on the server** with [zod](https://zod.dev) (client validation is UX only). Return DTOs, not raw Prisma rows.
- **Secrets** only in env, read in server-only modules (`import "server-only"`). Only `NEXT_PUBLIC_*` reaches the client.
- **Performance:** index FKs, paginate lists (cursor), `select` only needed columns, thumbnails + `next/image`, no N+1 (`include` / batched queries), cache headers on media (`private, max-age`), stream chat replies.

Reading list: [Next data security guide](https://nextjs.org/docs/app/guides/data-security) · [Authentication guide](https://nextjs.org/docs/app/guides/authentication) · [Prisma driver adapters](https://www.prisma.io/docs/orm/overview/databases/database-drivers) · [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/).

---

## 2. Data model (Prisma, target after M3; chat/AI models added in M5/M6)

```prisma
model User {
  id          String   @id @default(cuid())
  lineUserId  String?  @unique
  displayName String
  avatarUrl   String?
  createdAt   DateTime @default(now())
  memberships CoupleMember[]
  chatSessions ChatSession[]
}

model CoupleSpace {
  id        String   @id @default(cuid())
  name      String
  ownerId   String
  createdAt DateTime @default(now())
  members   CoupleMember[]
  trips     Trip[]
  media     MediaAsset[]
}

model CoupleMember {
  id            String @id @default(cuid())
  coupleSpaceId String
  userId        String
  role          String            // "owner" | "partner" (validated by zod; enum optional)
  coupleSpace   CoupleSpace @relation(fields: [coupleSpaceId], references: [id], onDelete: Cascade)
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([coupleSpaceId, userId])
  @@index([userId])
}

model Trip {
  id            String    @id @default(cuid())
  coupleSpaceId String
  title         String
  description   String?
  startDate     DateTime?
  endDate       DateTime?
  coverMediaId  String?
  createdAt     DateTime  @default(now())
  coupleSpace   CoupleSpace @relation(fields: [coupleSpaceId], references: [id], onDelete: Cascade)
  cover         MediaAsset? @relation("TripCover", fields: [coverMediaId], references: [id], onDelete: SetNull)
  places        Place[]
  memories      MemoryEntry[]
  media         MediaAsset[] @relation("TripMedia")
  @@index([coupleSpaceId, startDate])
}

model Place {
  id        String  @id @default(cuid())
  tripId    String
  name      String
  latitude  Float?
  longitude Float?
  address   String?
  note      String?
  trip      Trip @relation(fields: [tripId], references: [id], onDelete: Cascade)
  @@index([tripId])
}

model MemoryEntry {
  id         String   @id @default(cuid())
  tripId     String
  title      String
  content    String
  happenedAt DateTime
  mood       String?
  trip       Trip @relation(fields: [tripId], references: [id], onDelete: Cascade)
  tags       Tag[]
  media      MediaAsset[]
  @@index([tripId, happenedAt])
}

model Tag {
  id            String @id @default(cuid())
  coupleSpaceId String
  name          String
  memories      MemoryEntry[]
  @@unique([coupleSpaceId, name])
}

model MediaAsset {
  id            String   @id @default(cuid())
  coupleSpaceId String
  tripId        String?
  memoryEntryId String?
  uploadedById  String
  storageKey    String   // path/key only; never binary in DB
  thumbnailKey  String?
  mimeType      String
  sizeBytes     Int
  width         Int?
  height        Int?
  createdAt     DateTime @default(now())
  // relations: coupleSpace, trip (TripMedia), memory, coverFor (TripCover)
  @@index([coupleSpaceId, createdAt])
  @@index([tripId])
  @@index([memoryEntryId])
}
```

Added later: `ChatSession`, `ChatMessage` (M5), `AiMemory` + `ChatSession.memoryEnabled` (M6), `AuditLog` (M9). Deleting a `MediaAsset` row must also delete its files (service-layer responsibility, tested).

---

## 3. Milestones and tasks

Each task is small enough to finish and verify on its own. **Verify** lines are the acceptance check for that task.

### M0 — Housekeeping (before M1)
- [x] **0.1** Add `!.env.example` to `.gitignore`; add root `.gitignore` with `.DS_Store`; `git rm --cached .DS_Store`. *Verify:* `git status` clean, `.env.example` is trackable.
- [x] **0.2** Remove `next-auth` (D2); add `zod`, `jose`, `server-only`, `sharp`, `@prisma/adapter-better-sqlite3`, `dotenv` (already used by prisma config). *Verify:* `npm ci && npm run build` passes.
- [x] **0.3** Add `.env.example` from handoff (placeholders only) plus `SESSION_SECRET`. *Verify:* no real secrets in git (`git grep -i secret`).

### M1 — App runs, database exists
- [x] **1.1** `npm run dev`, `npm run lint`, `npm run build` all pass on the untouched scaffold (baseline). Record warnings.
- [x] **1.2** Set `provider = "sqlite"` in `schema.prisma`; confirm `prisma.config.ts` reads `DATABASE_URL="file:./dev.db"`; git-ignore `*.db`.
- [x] **1.3** Add models `User`, `CoupleSpace`, `CoupleMember` and run `npx prisma migrate dev --name init`; commit `prisma/migrations/`.
- [x] **1.4** Create `lib/db.ts`: single `PrismaClient` with better-sqlite3 adapter, cached on `globalThis` in dev to avoid connection leaks on hot reload ([pattern](https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help)).
- [x] **1.5** Add `prisma/seed.ts` (two demo users, one couple space) + `npm run db:seed`.
- **Verify:** seed runs; `npx prisma studio` shows rows; lint + build pass.

### M2 — Couple space, auth seam, Trip/Place/Memory CRUD  *(first real feature; handoff's "first goal")*
- [x] **2.0** i18n (Thai + English): `lib/i18n/{th,en}.ts` dictionaries, locale stored in a cookie (default `th`), `getT()` helper for Server Components, language switch in `/settings`. No locale in the URL (private app; avoids route churn). Dates/numbers via `Intl.DateTimeFormat(locale)`. Fonts: add a Thai-capable font (e.g. Noto Sans Thai via `next/font/google`) because Geist has no Thai glyphs. Pattern reference: [Next i18n guide](https://nextjs.org/docs/app/guides/internationalization). *Verify:* switching language changes all visible strings; no hard-coded UI text (add a lint-style test that scans `app/` for raw JSX strings if practical).
- [x] **2.1** Test harness: add Vitest ([docs](https://vitest.dev)) with a separate SQLite test DB; script `npm test`.
- [x] **2.2** Models `Trip`, `Place`, `MemoryEntry`, `Tag` + migration.
- [x] **2.3** `features/auth`: `session.ts` (encrypt/decrypt cookie with `jose`; `HttpOnly`, `Secure` in prod, `SameSite=Lax`, 7-day expiry), `dal.ts` (`requireSession`, `requireMember`), `/login` page with a **dev-only** user picker. Guard: mock login must throw when `NODE_ENV === "production"`.
- [x] **2.4** `proxy.ts`: redirect to `/login` if no session cookie (optimistic only).
- [x] **2.5** Trip service + zod schema + Server Actions (create/update/delete) + tests, including **cross-couple access test** (user A cannot read/update/delete user B's trip → 404).
- [x] **2.6** Pages: `/trips` (list, cursor pagination), `/trips/new`, `/trips/[tripId]` (details, edit, delete with confirm).
- [x] **2.7** Place CRUD inside trip detail + `/places` overview.
- [x] **2.8** Memory CRUD inside trip + `/memories` timeline (sorted by `happenedAt`, paginated).
- [x] **2.9** Shared UI in `components/ui` (Button, Input, Card, EmptyState, ConfirmDialog); every form shows server validation errors.
- **Verify:** create → edit → delete a trip, place and memory in the browser; `npm test` green incl. authorization tests; lint + build pass.

### M3 — Photos
- [x] **3.1** `MediaAsset` model + migration; set `Trip.coverMediaId` relation.
- [x] **3.2** `lib/storage`: `StorageProvider` interface (`put/get/delete`) + `LocalStorage` writing to `storage/uploads/<coupleSpaceId>/…` with random keys (never user-supplied filenames → prevents path traversal).
- [ ] **3.3a** Client-side: before upload, resize to ≤ 2048 px and re-encode as JPEG/WebP via canvas (also drops EXIF; handles HEIC where the browser can decode it). Show progress and per-file errors. This keeps each request well under Vercel's 4.5 MB body limit.
- [x] **3.3** `POST /api/media`: require member; enforce **max 4 MB** (matches the host limit) and allowlist `image/jpeg|png|webp`; sniff magic bytes; re-encode with `sharp` (strip EXIF, cap dimensions, make 480px thumbnail); save row. Never trust the client's resize — the server re-checks everything.
- [x] **3.4** `GET /api/media/[id]?size=thumb|full`: require member, stream file, `Cache-Control: private`, `X-Content-Type-Options: nosniff`.
- [x] **3.5** `DELETE` media (files + row); deleting a trip/memory deletes its files; set/replace trip cover.
- [ ] **3.6** `/gallery` page (paginated grid with `next/image`, lazy loading) and photo attach UI on memories/trips.
- **Verify:** upload JPEG ok; `.exe` renamed `.jpg` rejected; 20 MB file rejected; other couple's `/api/media/<id>` returns 404; exported file has no EXIF; deleting removes the file from disk.

### M4 — Responsive UI
- [x] **4.1** Replace starter `app/page.tsx` with dashboard (latest trips, recent memories, quick-add). Route group `app/(liff)/…` per handoff layout.
- [x] **4.2** Mobile-first layout: bottom tab bar, safe-area insets, 44px touch targets. Dark mode via existing CSS variables.
- [x] **4.3** `loading.tsx`, `error.tsx`, `not-found.tsx` per segment + empty states ([Next error handling](https://nextjs.org/docs/app/getting-started/error-handling)).
- [ ] **4.4** Accessibility pass (labels, focus, contrast) and a Lighthouse run on mobile profile; target Performance ≥ 90, Accessibility ≥ 95.
- [x] **4.5** Manually test at 360×640 and 390×844 viewports (Playwright screenshots are available in this environment).
- **Verify:** no horizontal scroll at 360px; Lighthouse targets met; lint + build pass.

### M5 — Rule-based chatbot
- [ ] **5.1** `ChatSession`, `ChatMessage` models + migration (`role` ∈ user|assistant|system).
- [ ] **5.2** `lib/ai/provider.ts` interface `ChatProvider { reply(messages, ctx) }` with `MockProvider` (canned replies by simple keyword rules; Thai + English).
- [ ] **5.3** **Safety rule first:** `lib/security/crisis.ts` detects self-harm/danger phrases → stop roleplay, reply with a fixed message urging contact with someone nearby / a local helpline. Make helpline text configurable and **verify the number for the user's country before shipping** (e.g. Thailand's Department of Mental Health line is commonly cited as 1323 — confirm). Unit-test with Thai and English phrases.
- [ ] **5.4** `/chat` page + `POST /api/chat/messages`; persist both sides; persistent banner "This is an AI, not your partner".
- [ ] **5.5** "Clear history" Server Action (hard delete) with confirmation.
- [ ] **5.6** Rate limit (simple in-memory token bucket per user for dev; Redis/Upstash later) and 2,000-char message cap.
- **Verify:** crisis phrase bypasses mock persona; history persists across reload; clear removes rows; other users cannot read my session.

### M6 — Real AI provider
- [ ] **6.1** `lib/ai/prompts.ts`: system prompt states it is an AI, no impersonation of a real person, safety rules, tone.
- [ ] **6.2** `lib/ai/memory-context.ts`: build context **only** from `AiMemory` rows with `approvedForChat = true` and from the nickname; cap token budget; never include raw photos or unapproved memories.
- [ ] **6.3** `AiMemory` model + settings UI: per-memory "allow chatbot to use", global toggle "turn off memory" (`ChatSession.memoryEnabled`).
- [ ] **6.4** Real provider adapter selected by `AI_PROVIDER` (default `mock`; works with no key). Server-side only; stream the response; timeout + retry; never log message bodies or the key. Reference: [Claude API docs](https://docs.claude.com) / the chosen vendor's docs.
- [ ] **6.5** Prompt-injection hygiene: treat stored memories as data inside delimiters, not instructions; cap length.
- **Verify:** with `AI_PROVIDER=mock` the app still works with empty key; unapproved memory never appears in the prompt (unit test on `memory-context`); toggling memory off removes context.

### M7 — LINE LIFF login  *(requires external setup by you)*
You do in [LINE Developers Console](https://developers.line.biz/console/): create Provider → LINE Login channel → LIFF app, set Endpoint URL to the HTTPS tunnel; give me `LINE_CHANNEL_ID`, `LINE_LIFF_ID` (secrets go in `.env.local`, never in chat/git).
- [ ] **7.1** Install `@line/liff`; `features/auth/line-client.tsx` (client component) calls `liff.init`, gets ID token.
- [ ] **7.2** `POST /api/auth/line`: verify ID token **server-side** with LINE's [verify endpoint](https://developers.line.biz/en/reference/line-login/#verify-id-token) (check `aud` = channel id, `exp`, signature); upsert `User` by `sub`; issue our session cookie. Never trust a client-sent `userId` (handoff rule).
- [ ] **7.3** Single-couple join: single-use, expiring invite code for the partner, then lock the space at 2 members; LINE accounts outside the couple get 403 (see "Single-couple mode").
- [ ] **7.4** Test through Cloudflare Tunnel/ngrok inside LINE on a real phone; fix WebView quirks (cookies `SameSite`, back-button).
- **Verify:** login works in LINE; forged/expired token returns 401; mock login still disabled in prod.

### M8 — LINE Official Account webhook
- [ ] **8.1** `POST /api/line/webhook`: read **raw body**, verify `x-line-signature` (HMAC-SHA256 with channel secret, constant-time compare) before parsing; reject otherwise ([docs](https://developers.line.biz/en/docs/messaging-api/receiving-messages/#verifying-signatures)).
- [ ] **8.2** Return `200` quickly; process events in `after()` ([Next `after`](https://nextjs.org/docs/app/api-reference/functions/after)); dedupe by `webhookEventId`.
- [ ] **8.3** Map LINE user → CoupleSpace; route text to the chat service; reply with the reply API using `LINE_CHANNEL_ACCESS_TOKEN` (server only).
- **Verify:** unsigned request → 401; replayed event not processed twice; token never in client bundle (`grep` build output).

### M9 — Production readiness
- [ ] **9.0** Create free accounts (guide ready: `docs/DEPLOY.md`): Vercel (Hobby), Neon, Cloudflare (R2). Set billing alerts where offered. Add env vars in Vercel (never commit them).
- [x] **9.1** Switch to PostgreSQL (Neon) — done in phase 2, migrations are run by hand (`npm run db:deploy`): `provider = "postgresql"`, `@prisma/adapter-pg`, re-create migrations; run the test suite against Postgres in CI. Use Neon's pooled connection string for serverless.
- [x] **9.2** `R2Storage` (S3-compatible, `@aws-sdk/client-s3`) implementing `StorageProvider`, served through the authenticated `/api/media/[id]` route — code and tests done; still to do: create the real bucket and test against R2. Files in the bucket stay **private** (no public bucket/`r2.dev` URL).
- [ ] **9.3** `AuditLog` model; log login, delete, export, member changes (no message/photo content).
- [ ] **9.4** Data export (ZIP of JSON + originals) and "delete my data / delete couple space" with cascading file deletion.
- [ ] **9.5** Security headers + CSP ([Next CSP guide](https://nextjs.org/docs/app/guides/content-security-policy)), production rate limiting, secure cookies, `npm audit`.
- [ ] **9.6** Backups (DB point-in-time + bucket versioning), env vars in the host, error monitoring without PII.
- [ ] **9.7** Real-device test in LINE; load check on gallery with 500+ photos.

---

## 4. Definition of Done (MVP = M1–M5)

Mirrors the handoff checklist, with how each is proven:

| Handoff item | Proof |
|---|---|
| Runs locally from one folder | fresh clone → `npm ci && npx prisma migrate dev && npm run db:seed && npm run dev` |
| Create/edit trips; places; memories | M2 browser check + service tests |
| Upload and show photos; timeline + gallery | M3/M4 checks |
| Chat room with history; mock bot, no API key | M5 checks, `AI_PROVIDER=mock` |
| CoupleSpace-level authorization | cross-couple tests on every service + media route |
| Delete buttons for main data | tests assert DB rows **and** files removed |
| `npm run lint` and `npm run build` pass | CI-style run at end of each milestone |

## 5. Risks

| Risk | Mitigation |
|---|---|
| Next 16 / Prisma 7 behave differently from training data | Read bundled docs (`node_modules/next/dist/docs`) before each new Next API; pin versions; verify with small spikes |
| Photo/privacy leak | D1, D8, authorized media route, tests |
| SQLite → Postgres drift | D3/D4, no SQLite-only features, Postgres CI in M9 |
| LINE needs public HTTPS and external console steps | Isolate M7/M8; document tunnel setup in `docs/line-setup.md` |
| Chatbot emotional harm / impersonation | M5.3 crisis rule, permanent AI banner, memory consent controls |
| Scope creep | Strict milestone gates; MVP = M1–M5 |

## 6. Open items

1. **D1** — confirm photo location (see "Confirmed decisions"). Default if you say nothing: outside `public/`.
2. **M6 AI** — decide later whether to stay on the mock bot, use a free-tier model (privacy trade-off above) or a paid one.
3. **M7/M8** — you will need a LINE account that can open LINE Developers Console; the plan will not start M7 until CRUD, photos and mock chat work.
