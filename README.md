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

**Auth**
- `ADMIN_USERNAME` – Admin username (must match exactly to log in). Fallback: `ADMIN_USER`
- `ADMIN_PASSWORD_HASH` – bcrypt hash: `node scripts/hash-password.js "your-password"`
- `COOKIE_SIGNING_SECRET` – Secret for HMAC-signed session cookie (e.g. `openssl rand -base64 32`)
- `NEXTAUTH_SECRET` – Fallback if `COOKIE_SIGNING_SECRET` not set
- `NEXTAUTH_URL` – `http://localhost:3000` (dev) or `https://your-app.vercel.app` (prod)
- `CRON_SECRET` – Random string for cron auth (x-cron-secret or Authorization: Bearer)

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
2. Add all env vars. Base URL: Vercel auto-injects `VERCEL_URL`; optionally set `APP_BASE_URL` or `NEXTAUTH_URL` to your deploy URL (e.g. `https://private-stock-radar.vercel.app`)
3. For cron: Vercel sends `Authorization: Bearer <CRON_SECRET>` when `CRON_SECRET` is set
4. Enable Vercel Password Protection for extra security

## Cron

Cron runs every 15 minutes. Wrap executes only when PT time is 1:05pm–1:25pm (after US market close).

## API Endpoints

- `GET /api/history/latest` – Latest locked report
- `GET /api/history?range=14d|30d` – History list
- `GET /api/history/[date]` – Report by date (YYYY-MM-DD)
- `DELETE /api/history/[id]` – Soft delete by UUID
- `GET|POST /api/cron/wrapdaily` – Cron (requires `x-cron-secret` or `Authorization: Bearer`)
