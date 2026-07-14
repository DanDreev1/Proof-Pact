# Deployment Checklist

## Supabase

- [ ] Create a Supabase project.
- [ ] Apply `supabase/schema.sql` in SQL Editor.
- [ ] Confirm `proof-videos` bucket exists and is private.
- [ ] Confirm RLS is enabled on app tables.
- [ ] Confirm two test users can register and log in.

## Environment Variables

Set these in local `.env.local` and deployment provider:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@example.com
```

Required for core app:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Required for cleanup, deleting shared pair data, and deleting proof videos:

- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`

Required for push notifications:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

## Vercel

- [ ] Import the project.
- [ ] Add all environment variables.
- [ ] Deploy.
- [ ] Open `/api/db/health` and confirm `ok: true`.
- [ ] Test auth callback/email settings if email confirmation is enabled in Supabase.

## Cron

Cleanup route:

```txt
POST /api/cron/cleanup
Authorization: Bearer <CRON_SECRET>
```

Example Vercel cron target:

```txt
https://your-domain.com/api/cron/cleanup
```

Vercel cron configuration should include the authorization header through a secure mechanism. If the platform cannot attach headers directly, use a trusted external cron provider that can.

## Final Smoke Test

- [ ] Register two users.
- [ ] Pair them.
- [ ] Submit a video proof.
- [ ] Review it.
- [ ] Check calendar.
- [ ] Delete a proof.
- [ ] Leave pair.
- [ ] Run cleanup.
- [ ] Enable push notifications if configured.
