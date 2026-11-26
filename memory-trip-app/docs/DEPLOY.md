# Deploying to Vercel (free stack)

Stack: **Vercel Hobby** (app) + **Neon** (PostgreSQL) + **Cloudflare R2** (photos). Cost for two people: 0 baht/month if you stay inside the free tiers (limits change: re-check the pricing pages when you sign up).

> **Read this first — what works and what does not yet**
>
> - **Works after this guide:** the site builds and runs on Vercel, with a real database and private photo storage.
> - **Does NOT work yet: logging in on the Production site.** The only login today is the *mock* "pick a user" login, which is deliberately impossible in Production (`features/auth/dev-login.ts`, covered by tests). Real login comes with LINE in milestone **M7**. Until then do **not** put real photos or memories online.
> - **What you can use now:** a **Preview** deployment with `ALLOW_DEV_LOGIN=true`, protected by Vercel's own login (step 6). Use it with demo data only, to check that deployment works.

## 0. Prerequisites

- The code is on GitHub (it is: `P4warit06/Project-Web-Japan`).
- Node 22 and `npm ci` work on your machine (`cd memory-trip-app && npm ci`).
- You can create free accounts at [Neon](https://neon.com), [Cloudflare](https://dash.cloudflare.com/sign-up) and [Vercel](https://vercel.com/signup) (sign in to Vercel with GitHub).

## 1. Database: Neon

1. Create a Neon project. Pick region **AWS Asia Pacific (Singapore) `aws-ap-southeast-1`** to be close to Thailand. The region **cannot be changed later** ([regions](https://neon.com/docs/introduction/regions)). Confirm it is offered on the Free plan when you create the project.
2. In the project, open **Connect** and copy two connection strings ([Neon + Prisma guide](https://neon.com/docs/guides/prisma)):
   - **Pooled** (host contains `-pooler`) → will be `DATABASE_URL`, used by the running app.
   - **Direct** (no `-pooler`) → will be `DIRECT_URL`, used only by migrations.
3. Create a second **branch** (Neon feature) called `preview` and copy its two strings too. Preview deployments must use this branch so that previews never touch production data.
4. Create the tables in each database from **your computer** (explicit, so a Vercel build can never change production by accident):

```bash
cd memory-trip-app
DIRECT_URL="<direct string of the branch>" DATABASE_URL="<same string>" npm run db:deploy
```

Run it once for `production` and once for `preview`. It applies the migrations in `prisma/migrations` and nothing else.

> **Heads-up:** Neon's free plan may delete projects that were inactive for 90 days ([regions page](https://neon.com/docs/introduction/regions)). Keep a backup of anything you care about, see "Backups" below.

## 2. Photos: Cloudflare R2

References: [R2 buckets](https://developers.cloudflare.com/r2/buckets/), [API tokens](https://developers.cloudflare.com/r2/api/tokens/).

1. In the Cloudflare dashboard open **R2 Object Storage** and create a bucket, e.g. `memory-trip-photos`. R2 may ask you to add a payment method even for the free tier; set a billing alert.
2. **Keep it private.** Do not enable *Public access* and do not enable the `r2.dev` URL. Photos are only ever served by the app after a login check.
3. Create an **R2 API token** with **Object Read & Write**, scoped to *this bucket only*. Copy the **Access Key ID**, **Secret Access Key** (shown once) and your **Account ID**.
4. For Preview you can use a second bucket (`memory-trip-photos-preview`) or the same one; a separate bucket is cleaner.

## 3. Vercel project

References: [Monorepos / Root Directory](https://vercel.com/docs/monorepos), [Environment variables](https://vercel.com/docs/environment-variables).

1. Vercel → **Add New → Project** → import `Project-Web-Japan`.
2. **Root Directory: `memory-trip-app`** (click *Edit* next to it). The app lives in a subfolder; without this you get "No Next.js version detected".
3. Framework: Next.js (auto-detected). Leave build/install commands on their defaults (`postinstall` runs `prisma generate`).
4. Add the environment variables below **before** the first deploy.

| Variable | Production | Preview | Notes |
|---|---|---|---|
| `DATABASE_URL` | Neon **pooled**, production | Neon **pooled**, preview branch | |
| `DIRECT_URL` | Neon direct, production | Neon direct, preview branch | Only needed for CLI migrations; harmless on Vercel |
| `SESSION_SECRET` | new random value | another random value | `openssl rand -base64 32`. Never reuse between environments |
| `STORAGE_PROVIDER` | `r2` | `r2` | Required: Vercel has no persistent disk, `local` is refused on Vercel |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | production bucket | preview bucket | Mark the secret as **Sensitive** |
| `ALLOW_DEV_LOGIN` | **do not set** | `true` | Ignored in Production even if set |
| `NEXT_PUBLIC_APP_URL` | your production URL | leave unset | |

5. **Region:** `vercel.json` asks for `sin1` (Singapore) to sit next to the database. Hobby allows **one** function region ([docs](https://vercel.com/docs/functions/configuring-functions/region)). If the deployment is rejected because of the region, delete the `regions` line in `memory-trip-app/vercel.json`; the app still works, just slower from Thailand.
6. Click **Deploy**.

## 4. Protect Preview deployments (do this before enabling the mock login)

`ALLOW_DEV_LOGIN=true` lets *anyone who reaches the page* sign in as a demo user. That is only acceptable if Preview URLs are not public. In the project go to **Settings → Deployment Protection** ([docs](https://vercel.com/docs/deployment-protection)) and confirm **Vercel Authentication** is enabled for Preview deployments. If you cannot confirm it, do not set `ALLOW_DEV_LOGIN`.

## 5. Demo users for the Preview database

The mock login lists users that exist in the database. Seed the **preview** database (never production) from your computer:

```bash
cd memory-trip-app
DATABASE_URL="<preview direct string>" npm run db:seed
```

## 6. Verify the deployment (checklist)

- [ ] Open the Preview URL (log in to Vercel if asked). `/login` loads and lists *Alex* and *Sam*.
- [ ] Sign in, create a trip, a place and a memory.
- [ ] Upload a photo. In the Cloudflare dashboard, the object appears in the bucket under `<couple-id>/…webp`.
- [ ] Copy the photo URL, open it in a private window: you must be sent to `/login` (not see the image).
- [ ] Production URL: `/login` loads but shows **no users** (expected until M7).
- [ ] Response headers contain `x-content-type-options: nosniff` and no `x-powered-by`:
  `curl -sI https://<your-url>/login`

## 6b. Known caveat to test on the first deploy

Neon's pooled connections go through PgBouncer. Prisma's `pg` adapter against a pooled Neon URL is **not something I could verify without a real Neon database**. If the app shows database errors such as *prepared statement … does not exist*, set `DATABASE_URL` to the **direct** string (no `-pooler`) as well. For two users that is fine; `DB_POOL_MAX` (default 5) limits connections per function instance.

## 7. Backups

Neon's Free plan keeps limited history. Make your own copy now and then, from your computer (needs `pg_dump`, included with PostgreSQL):

```bash
pg_dump "<direct string>" --format=custom --file=memory-trip-$(date +%F).dump
```

Photos: R2 does not keep your deleted files. Copy the bucket occasionally with `rclone` or the Cloudflare dashboard. A scripted export is planned for M9.

## 8. Rolling back

- **Bad deployment:** Vercel → *Deployments* → pick the last good one → **Promote to Production** (no rebuild).
- **Bad migration:** migrations only move forward. Restore from the dump above or write a new corrective migration. This is why migrations are run by hand and not automatically during the build.

## 9. Local development with PostgreSQL

```bash
cd memory-trip-app
docker compose up -d           # PostgreSQL 16 on 127.0.0.1:5432 (dev DB + test DB)
cp .env.example .env.local     # then set SESSION_SECRET
npm ci
npm run db:migrate             # create tables
npm run db:seed                # demo users Alex and Sam
npm run dev                    # http://localhost:3000
npm test                       # uses memory_trip_test, wipes it
```

No Docker? Install PostgreSQL yourself, or use a free Neon branch for development and set `DATABASE_URL`/`TEST_DATABASE_URL` accordingly (the test database name must contain "test").

## 10. Still to do for a real launch (see `PLAN.md`)

- M7: real login with LINE LIFF (then Production becomes usable).
- M9: Content-Security-Policy, shared rate limiting, audit log, export/delete data, scripted backups.
