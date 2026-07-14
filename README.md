# Proof Pact

Mobile-first PWA accountability app for two connected users.

The core loop:

```txt
User A records proof with today's date and daily word.
User B reviews the proof.
User B approves or rejects it.
Both users see the result in their seasonal calendar.
```

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL + RLS
- Supabase Storage
- PWA service worker
- Optional Web Push notifications

## Local Development

Install dependencies:

```bash
npm install
```

Create `.env.local` and fill:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=

NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@example.com
```

Run:

```bash
npm run dev
```

On Windows PowerShell, if `npm` is blocked by execution policy, use:

```powershell
npm.cmd run dev
```

Open:

```txt
http://localhost:3000
```

## Supabase

Apply:

```txt
supabase/schema.sql
```

in the Supabase SQL Editor.

The schema creates:

- profiles
- accountability_pairs
- pair_members
- daily_words
- proof_requests
- push_subscriptions
- private `proof-videos` storage bucket
- RLS policies
- helper RPC functions

Health check:

```txt
http://localhost:3000/api/db/health
```

## Features

- Register/login/logout
- Profile display name editing
- Pair invite and join
- Leave pair with 15 second delay and partner-name confirmation
- Server-generated daily word
- Video proof upload via signed Supabase Storage upload
- Review approve/reject flow
- Requester proof status page
- Delete own proof request and stored video
- Current and previous season calendar grouped by month
- Cleanup endpoint for expired videos/drafts/old records
- PWA manifest and service worker
- Optional push notifications

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Important

Do not expose `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, or `CRON_SECRET` to the browser.

Client code must not decide trusted values such as user IDs, reviewer IDs, daily words, proof dates, seasons, statuses, or video paths.
