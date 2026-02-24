# Private Stock Radar

Production-ready Next.js 14 App Router app for daily market wrap and trade plans. Single admin, deployable to Vercel.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

**Auth** (sessionCookie.ts HMAC + expiry; middleware verifies token)
- `ADMIN_USERNAME` â€“ Admin username (fallback: `ADMIN_USER` deprecated)
- `ADMIN_PASSWORD_HASH` â€“ bcrypt hash: `node scripts/hash-password.js "your-password"`
- `COOKIE_SIGNING_SECRET` â€“ HMAC signing secret (e.g. `openssl rand -base64 32`)
- `NEXTAUTH_SECRET` â€“ Fallback if `COOKIE_SIGNING_SECRET` not set
- `NEXTAUTH_URL` â€“ `http://localhost:3000` (dev) or `https://your-app.vercel.app` (prod)
- `CRON_SECRET` â€“ Random string for cron auth. **Must be long and secure.** Used by wrapdaily-run and POST wrapdaily.

Deprecated: `ADMIN_USER`, `ADMIN_PASSWORD` (plaintext) â€“ use `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH`

**Supabase**
- Run `supabase-migration.sql` in Supabase SQL Editor
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

**APIs**
- `POLYGON_API_KEY` (primary market data)
- `FINNHUB_API_KEY` (fallback market + news)
- `NEWS_API_KEY` (primary news)

### 3. Run

```bash
npm run dev
```

Login at `/login`, dashboard at `/dashboard`.

## Vercel Deployment

1. Deploy to Vercel
2. Add all env vars including `CRON_SECRET` (long random string, e.g. `openssl rand -hex 32`)
3. **Cron config:** Edit `vercel.json` â€“ replace `__CRON_SECRET__` in the cron path with your actual `CRON_SECRET` value. Do not commit the real secret; use a build step or deploy-time substitution.
4. Enable Vercel Password Protection for extra security

## Cron

Cron runs every 15 minutes via Vercel Cron Jobs. The wrap **runs** only when PT time is 1:05pmâ€“1:25pm (after US market close). Outside this window, the runner returns `skipped: true`.

**Security:** `CRON_SECRET` must be long and unpredictable. The runner endpoint only executes the wrap inside the PT window.

## API Endpoints

- `GET /api/history/latest` â€“ Latest locked report
- `GET /api/history?range=14d|30d` â€“ History list
- `GET /api/history/[date]` â€“ Report by date (YYYY-MM-DD)
- `DELETE /api/history/[id]` â€“ Soft delete by UUID
- `GET /api/cron/wrapdaily` â€“ **Status only** (inWindow, ptDate). Requires `x-cron-secret` or `Authorization: Bearer`
- `POST /api/cron/wrapdaily` â€“ Run wrap (header auth). Same logic as wrapdaily-run
- `GET /api/cron/wrapdaily-run?secret=<CRON_SECRET>` â€“ **Actual runner.** Vercel Cron uses this. Auth via query param `secret`