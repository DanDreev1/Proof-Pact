# Codex Rules

## Core architecture

- Use Server Components by default.
- Use Client Components only for browser interactivity: forms, camera/file upload, notifications, calendar selection, modals, toasts, loading states.
- `page.tsx` is a page assembler. It loads server data and composes feature components.
- Do not put large business logic, validation, upload logic, or database mutations directly inside `page.tsx`.
- Put feature-specific logic under `src/features/<feature>`.
- Put shared utilities under `src/lib`.
- Put shared UI primitives under `src/components/ui`.

## Data and security

- Never trust client-submitted `user_id`, `requester_id`, `reviewer_id`, `pair_id`, `daily_word`, `proof_date`, `season`, `season_year`, `status`, `video_path`, `created_at`, or `expires_at`.
- Server must derive current user from Supabase Auth.
- Server must derive pair membership from the database.
- Server must derive daily word from the database.
- Server must derive proof date and season from pair timezone.
- Use Zod for input validation.
- Use RLS for all user-owned tables.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the client.
- Use the service role only in server-only admin/cleanup tasks.

## Proof flow

- Proof requests start as `draft`.
- After successful video upload and finalization, status becomes `pending`.
- Only reviewer can approve/reject a pending request.
- Requester cannot approve their own proof.
- Approved/rejected requests cannot be changed again.
- Expired requests cannot be reviewed.

## Storage

- Proof videos must be stored in a private bucket.
- Do not use public video URLs.
- Use short-lived signed URLs for viewing.
- Videos expire after 7 days.
- Delete expired videos through Supabase Storage API, not only SQL.

## Mobile-first UI

- Target phone widths: 360px–430px.
- Center a mobile-width container on desktop.
- Use large tap targets.
- Use bottom navigation.
- Keep one primary action per screen.
- Avoid desktop-first dashboards.
