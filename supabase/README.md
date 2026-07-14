# Supabase notes

`schema.sql` is a first draft for Codex/development.
Before production, review all RLS policies and Storage policies carefully.

## Connect the app

Fill `.env.local` with values from your Supabase project:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` is optional for the first connection check. Add it later for admin-only server work such as cleanup and storage deletion.

Cleanup also requires:

```txt
CRON_SECRET=
```

Push notifications require:

```txt
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@example.com
```

Generate VAPID keys with:

```bash
npx web-push generate-vapid-keys
```

Then apply `schema.sql` in the Supabase SQL editor.

After starting the app with `npm.cmd run dev`, open:

```txt
http://localhost:3000/api/db/health
```

Expected result after env and schema are ready:

```json
{ "ok": true, "configured": { "url": true, "anonKey": true, "serviceRoleKey": false }, "adminReady": false }
```

Storage bucket needed:

```txt
proof-videos
```

The bucket should be private. Use signed URLs for video access.

## Cleanup

The cleanup route is:

```txt
POST /api/cron/cleanup
Authorization: Bearer <CRON_SECRET>
```

It uses `SUPABASE_SERVICE_ROLE_KEY`, deletes expired videos through Supabase Storage, expires old pending requests, removes abandoned drafts, and deletes proof metadata older than the previous season.
