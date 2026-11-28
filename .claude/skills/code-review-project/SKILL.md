---
name: code-review-project
description: Review a change in memory-trip-app (Next.js 16, Prisma, S3 photos, LINE login) for correctness, security and performance before it is merged. Use when asked to review code, a diff or a PR here.
---

# Review a change in memory-trip-app

Read `memory-trip-app/AGENTS.md` first: this Next.js has breaking changes, so check
`node_modules/next/dist/docs/` before judging framework usage.

## Run the checks first (from `memory-trip-app/`)

```bash
npm run typecheck && npm run lint && npm test
npm run preflight   # deploy checks, when env/config/deploy files changed
```

Quote any failure. Never skip or disable a test to get green.

## Then read the diff for

1. **Security** (highest priority): input validated with zod at every server boundary; session
   checked on every server action and route handler (`jose`, `proxy.ts`); no secret, key or
   token in code, logs or client bundle (`server-only` for server modules); S3 keys and upload
   type/size checked; no raw SQL string building (use Prisma); no user text rendered as HTML.
2. **Performance**: no N+1 Prisma queries (`include`/`select` only what is shown); images go
   through `sharp` and `next/image` with sizes; client components only where state is needed;
   `motion` stays lazy-loaded; no new heavy dependency without a reason.
3. **Correctness**: error and empty states handled; dates and time zones; both the real app
   and the static demo (`demo/`) still work when shared components change.
4. **Principles**: small functions, one job each, names that say intent, no dead code, no
   duplication of what `lib/` or `features/` already offers. Tests for new logic.

## Report

List findings most severe first: file:line, what is wrong, a concrete failing case, the fix.
Say plainly when nothing is wrong. Do not pad with style nits.
