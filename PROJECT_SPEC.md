# Technical Project Specification — Mobile Proof Accountability App

## 1. Project idea

Build a **mobile-first PWA accountability app** for two connected users.

The app helps two people stay disciplined by requiring proof of completed actions, such as going to the gym, swimming pool, or doing another agreed activity.

The main idea:

```text
User A completes an activity.
User A opens the app and sees the secret daily word.
User A records or uploads a short video where they say the current date and the daily word.
User A sends a proof request to User B.
User B receives a notification and reviews the request.
User B approves or rejects the proof.
Both users can later see confirmed records in a seasonal calendar.
```

The app is not just a habit tracker. The key feature is **mutual confirmation**.

Users should not be able to simply mark something as done by themselves. Another connected user must confirm it.

---

## 2. MVP goal

The MVP should be small, fast to build, but architecturally clean.

The first version must support:

1. Supabase Auth
2. User profiles
3. Pairing two users together
4. Server-generated daily word
5. Creating proof requests
6. Uploading short video proof
7. Reviewer approve/reject flow
8. Push notifications, if available
9. Current season calendar
10. Previous season archive
11. Automatic cleanup of expired videos and old records

Do not build extra features before the main flow works.

Avoid adding before MVP:

- Teams
- Public profiles
- Leaderboards
- Achievements
- AI video verification
- Comment threads
- Complex statistics
- Multiple groups
- Social feed

The MVP is for two connected people.

---

## 3. Tech stack

Use:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Supabase Row Level Security
- PWA
- Web Push notifications
- Vercel

The app should be designed primarily for phones.

Desktop can be supported for testing, but the UI should look like a centered mobile app, not a full desktop dashboard.

---

## 4. Architecture rules

### 4.1 Default to Server Components

Use **Server Components by default**.

Server Components should be used for:

- Reading database data
- Loading the current user
- Loading the current pair
- Loading the daily word
- Loading proof request details
- Loading season calendar data
- Assembling page-level data

Business logic must not live inside random Client Components.

---

### 4.2 Use Client Components only when needed

Use Client Components only for things that require browser-side interactivity:

- Form input state
- Video file selection / camera capture
- Upload progress
- Notification permission prompt
- Calendar day selection
- Modals
- Toasts
- Buttons with loading states
- PWA/browser APIs

Do not make a whole page a Client Component just because one button needs interactivity.

Split the interactive part into a small Client Component.

---

### 4.3 `page.tsx` should be a page assembler

`page.tsx` should not become a huge file.

Its job is to:

- Check auth if needed
- Load required server data
- Call feature-level queries
- Assemble feature components
- Pass data into components

`page.tsx` should not contain:

- Large business logic
- Large database queries inline
- Validation logic
- Upload logic
- Notification logic
- Huge UI blocks

Bad approach:

```text
page.tsx contains auth checks, SQL logic, upload logic, validation, form state, UI, and notification logic.
```

Good approach:

```text
page.tsx loads data and composes:
- TodayHeader
- DailyWordCard
- CreateProofButton
- PendingReviewList
- SeasonCalendarPreview
```

---

### 4.4 Feature-based folder structure

Use a feature-based structure.

Recommended structure:

```text
src/
  app/
    (auth)/
      login/
        page.tsx
      register/
        page.tsx

    (app)/
      layout.tsx
      page.tsx
      create/
        page.tsx
      review/
        [requestId]/
          page.tsx
      calendar/
        page.tsx
      profile/
        page.tsx
      settings/
        page.tsx

    api/
      cron/
        cleanup/
          route.ts
      push/
        route.ts

  features/
    auth/
      actions/
      components/
      queries/
      schemas/

    profiles/
      actions/
      components/
      queries/
      schemas/

    pairs/
      actions/
      components/
      queries/
      schemas/

    daily-word/
      queries/
      server/

    proofs/
      actions/
      components/
      queries/
      schemas/
      server/
      types.ts

    calendar/
      components/
      queries/
      server/

    notifications/
      actions/
      components/
      server/
      types.ts

    seasons/
      server/
      types.ts

  components/
    ui/
      Button.tsx
      Input.tsx
      Textarea.tsx
      Card.tsx
      Modal.tsx
      BottomNav.tsx
      LoadingButton.tsx

  lib/
    supabase/
      browser.ts
      server.ts
      admin.ts

    auth/
      require-user.ts
      get-current-user.ts

    date/
      timezone.ts

    storage/
      proof-videos.ts

    validation/
      result.ts

    utils/
      cn.ts
```

---

## 5. Server Actions, Route Handlers, Queries

### 5.1 Server Actions

Use Server Actions for user-triggered mutations:

- `createPair`
- `acceptPairInvite`
- `createProofUploadIntent`
- `finalizeProofRequest`
- `approveProofRequest`
- `rejectProofRequest`
- `savePushSubscription`
- `updateProfile`

Server Actions must:

- Get the current user from Supabase Auth
- Validate input with Zod
- Check authorization
- Never trust client-submitted `user_id`
- Never trust client-submitted `status`
- Never trust client-submitted `daily_word`
- Never trust client-submitted `proof_date`
- Never trust client-submitted `season`
- Derive sensitive values on the server
- Return typed success/error results

---

### 5.2 Route Handlers

Use Route Handlers for:

- Cron cleanup
- Push notification endpoints if needed
- Webhook-like server tasks

Route Handlers that perform privileged operations must be protected.

For example, the cleanup route should require:

```text
CRON_SECRET
```

Do not expose the service role key to the client.

---

### 5.3 Queries

Use query functions for database reads.

Examples:

- `getCurrentPair(userId)`
- `getTodayDailyWord(pairId)`
- `getPendingReviews(userId)`
- `getProofRequestForReview(requestId, userId)`
- `getCurrentSeasonProofs(pairId, userId)`
- `getPreviousSeasonProofs(pairId, userId)`

Queries should live inside `features/<feature>/queries`.

Do not write large queries directly inside `page.tsx`.

---

## 6. Database model

### 6.1 `profiles`

User profile data for the app.

Supabase Auth stores login identity. `profiles` stores app-specific user display data.

```text
profiles
- id uuid primary key references auth.users(id) on delete cascade
- display_name text not null
- avatar_url text null
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()
```

Use `profiles` for:

- Display name
- Avatar
- Public app profile data

Do not store passwords in `profiles`.

Passwords and email auth are handled by Supabase Auth.

---

### 6.2 `accountability_pairs`

Represents a pair of two connected users.

```text
accountability_pairs
- id uuid primary key default gen_random_uuid()
- status text not null default 'active'
- timezone text not null default 'Europe/London'
- invite_code text unique null
- created_by uuid not null references auth.users(id)
- created_at timestamptz not null default now()
- archived_at timestamptz null
```

Allowed statuses:

```text
active
archived
```

For MVP, a user should usually have one active pair.

---

### 6.3 `pair_members`

Users inside a pair.

```text
pair_members
- pair_id uuid not null references accountability_pairs(id) on delete cascade
- user_id uuid not null references auth.users(id) on delete cascade
- role text not null default 'member'
- created_at timestamptz not null default now()

primary key (pair_id, user_id)
```

Rules:

- A pair can have maximum 2 members.
- A user can create or join a pair.
- A proof request can only be sent to the other member of the active pair.

For MVP, pair creation can work through an invite code.

---

### 6.4 `daily_words`

Daily secret words.

The daily word must be generated or selected by the server.

```text
daily_words
- id uuid primary key default gen_random_uuid()
- proof_date date not null
- word text not null
- created_at timestamptz not null default now()

unique (proof_date)
```

For MVP, use one global daily word per date.

Later, this can become pair-specific:

```text
unique (pair_id, proof_date)
```

But MVP should stay simple.

Important rule:

```text
The client can display the daily word, but the client must not decide or submit the trusted daily word.
```

When creating a proof request, the server must attach the correct `daily_word_id`.

---

### 6.5 `proof_requests`

Main table.

```text
proof_requests
- id uuid primary key default gen_random_uuid()

- pair_id uuid not null references accountability_pairs(id) on delete cascade

- requester_id uuid not null references auth.users(id)
- reviewer_id uuid not null references auth.users(id)

- daily_word_id uuid not null references daily_words(id)

- title text not null
- description text null

- video_path text null

- status text not null default 'draft'

- decision_comment text null

- proof_date date not null
- season text not null
- season_year int not null

- created_at timestamptz not null default now()
- submitted_at timestamptz null
- decided_at timestamptz null

- draft_expires_at timestamptz not null
- video_expires_at timestamptz not null
```

Allowed statuses:

```text
draft
pending
approved
rejected
expired
```

Status meaning:

```text
draft
= request exists, upload is not finalized yet

pending
= video uploaded, waiting for reviewer decision

approved
= reviewer accepted proof

rejected
= reviewer rejected proof

expired
= proof can no longer be reviewed, usually because video expired or draft was abandoned
```

Rules:

- `requester_id` cannot equal `reviewer_id`.
- Only requester can create/finalize their own request.
- Only reviewer can approve/reject a pending request.
- Approved/rejected requests cannot be changed again.
- Expired requests cannot be approved/rejected.

---

### 6.6 `push_subscriptions`

Stores browser push subscriptions.

```text
push_subscriptions
- id uuid primary key default gen_random_uuid()
- user_id uuid not null references auth.users(id) on delete cascade
- endpoint text not null unique
- p256dh text not null
- auth text not null
- user_agent text null
- created_at timestamptz not null default now()
- last_used_at timestamptz null
```

Rules:

- User can only manage their own push subscriptions.
- Push is optional.
- App must still work without push notifications.

---

## 7. Season system

The app uses fixed calendar seasons.

```text
Spring: 1 March – 31 May
Summer: 1 June – 31 August
Autumn: 1 September – 30 November
Winter: 1 December – 28/29 February
```

Winter rule:

```text
December 2026 = winter 2026
January 2027 = winter 2026
February 2027 = winter 2026
```

The season is named by the year it started.

Examples:

```text
2026-09-01 → autumn 2026
2026-12-01 → winter 2026
2027-01-15 → winter 2026
2027-03-01 → spring 2027
```

Server rules:

- The server derives `proof_date` using the pair timezone.
- The server derives `season` and `season_year` from `proof_date`.
- The client must not submit trusted `season` or `season_year`.

UI rules:

- Main calendar shows current season by default.
- User can switch to previous season archive.
- Older seasons are not shown in MVP.

Data retention:

- Videos expire after 7 days.
- Proof metadata is kept for current season and previous season.
- Records older than previous season can be deleted by cleanup.

---

## 8. Proof request flow

### 8.1 Create proof flow

Recommended flow:

```text
1. User opens Create Proof page.
2. Server loads today's daily word.
3. User records/selects video.
4. User enters title and optional description.
5. User submits.
6. Server creates upload intent.
7. Video is uploaded to private storage.
8. Server finalizes proof request.
9. Status becomes pending.
10. Reviewer receives notification if push is enabled.
```

For better reliability, use a two-step upload flow:

```text
createProofUploadIntent
→ creates draft proof_request
→ creates safe video_path
→ returns upload info

finalizeProofRequest
→ verifies draft belongs to current user
→ verifies video exists
→ changes status to pending
→ sets submitted_at
→ sends notification
```

Drafts should expire quickly.

Example:

```text
draft_expires_at = now() + 1 hour
```

If upload is abandoned, cleanup can delete draft requests and any orphaned video.

---

### 8.2 Review flow

Reviewer opens request.

The page shows:

- Requester display name
- Title
- Description
- Proof date
- Daily word
- Video
- Approve button
- Reject button
- Optional decision comment

Approve rules:

- Current user must be reviewer.
- Request status must be pending.
- Video must not be expired.
- `requester_id` must not equal `auth.uid()`.

Reject rules are the same.

After decision:

```text
status = approved or rejected
decided_at = now()
decision_comment = optional comment
```

Both requester and reviewer should be notified if possible.

---

## 9. Video storage

Use Supabase Storage.

Bucket:

```text
proof-videos
```

The bucket must be private.

Do not use public video URLs.

Video path format:

```text
proof-videos/{pair_id}/{proof_request_id}/proof.webm
```

or:

```text
proof-videos/{pair_id}/{proof_request_id}/proof.mp4
```

Rules:

- Only requester and reviewer can access the video.
- Video access should use short-lived signed URLs.
- Videos expire after 7 days.
- Expired videos should be deleted through Supabase Storage API.
- Do not delete storage files only through SQL.

File validation:

- Allow video files only.
- Limit max file size.
- Prefer short videos.
- Client can check duration for UX.
- Server must enforce size/type as much as possible.

For MVP, video capture can use:

```html
<input type="file" accept="video/*" capture="environment" />
```

Later this can be replaced with a custom MediaRecorder UI.

---

## 10. Notifications

Push notifications are useful but not required for the app to function.

Notification events:

- New proof request
- Proof approved
- Proof rejected

If push fails:

```text
the app must still show pending requests inside the UI
```

Client-side notification logic belongs in Client Components because it uses browser APIs.

Server-side push sending belongs in server code.

Recommended files:

```text
features/notifications/components/NotificationPermissionButton.tsx
features/notifications/actions/save-push-subscription.ts
features/notifications/server/send-push.ts
```

Do not block the main MVP if push takes longer.

Build the main proof flow first.

---

## 11. Security rules

### 11.1 Never trust the client

The client must not be trusted for:

- `user_id`
- `requester_id`
- `reviewer_id`
- Pair authorization
- `daily_word`
- `proof_date`
- `season`
- `season_year`
- `status`
- `video_path`
- `created_at`
- `expires_at`

The server must derive these values.

Client can send:

- `title`
- `description`
- Selected video file/upload result

Even those must be validated.

---

### 11.2 Request creation security

A user can create a proof request only if:

- User is authenticated.
- User belongs to an active pair.
- Pair has exactly two members.
- Reviewer is the other member of the pair.
- Daily word exists for current `proof_date`.

Server sets:

- `requester_id = current user`
- `reviewer_id = pair partner`
- `status = draft`, then `pending`
- `proof_date = server-derived date in pair timezone`
- `season = server-derived season`
- `season_year = server-derived season year`
- `video_expires_at = now() + 7 days`

---

### 11.3 Review security

A user can approve/reject only if:

- `auth.uid() = proof_requests.reviewer_id`
- `status = pending`
- Video has not expired.
- `requester_id != auth.uid()`

---

### 11.4 Read security

A user can read a proof request only if:

```text
requester_id = auth.uid()
or reviewer_id = auth.uid()
```

This applies both to metadata and video access.

---

### 11.5 RLS

Enable RLS on:

- `profiles`
- `accountability_pairs`
- `pair_members`
- `proof_requests`
- `push_subscriptions`
- `storage.objects`

General RLS rules:

```text
profiles:
users can read/update their own profile

pair_members:
users can read rows for pairs they belong to

accountability_pairs:
users can read pairs they belong to

proof_requests:
users can read only requests where they are requester or reviewer

push_subscriptions:
users can manage only their own subscriptions

storage.objects:
only requester/reviewer can access related proof videos
```

For complex operations, prefer Server Actions that check access explicitly.

Do not rely only on UI hiding buttons.

---

## 12. Mobile-first UI rules

The app should feel like a phone app.

Layout rules:

- Target width: 360px–430px
- Max-width around 430px
- Center container on desktop
- Large buttons
- Large tap areas
- Bottom navigation
- One primary action per screen
- Minimal text
- Clear status labels
- Fast loading states

Main screens:

- Today
- Create Proof
- Review
- Calendar
- Profile/Settings

### 12.1 Today screen

Should show:

- Daily word
- Current season
- Quick create proof button
- Pending review requests
- Recent status/result

### 12.2 Create Proof screen

Should show:

- Daily word clearly
- Instructions: say the date and daily word in the video
- Video picker/capture
- Title input
- Description input
- Submit button
- Upload progress

### 12.3 Review screen

Should show:

- Video
- Title
- Description
- Requester
- Proof date
- Daily word
- Approve button
- Reject button
- Optional comment

### 12.4 Calendar screen

Should show:

- Current season by default
- Previous season archive switch
- Days with proof markers
- Tap day to see requests
- Video available / video expired label
- Approved / rejected / pending status

### 12.5 Profile/Settings screen

Should show:

- Display name
- Pair info
- Notification permission status
- Logout

---

## 13. Validation rules

Use Zod schemas.

Suggested limits:

```text
title:
required
1–80 characters

description:
optional
max 500 characters

decision_comment:
optional
max 300 characters

display_name:
required
1–40 characters
```

Video:

- Required for proof request.
- Video MIME type only.
- Max file size should be enforced.
- Duration should be checked client-side for UX if possible.

---

## 14. Cleanup rules

Cleanup should run periodically.

Cleanup must:

- Delete abandoned draft proof requests after `draft_expires_at`.
- Delete expired videos after `video_expires_at`.
- Mark pending requests as expired if video expired and no decision was made.
- Delete proof metadata older than previous season.
- Delete expired push subscriptions if needed.

Important:

```text
Storage files must be deleted through Supabase Storage API.
Do not assume deleting a database row deletes the actual video file.
```

Cleanup route:

```text
src/app/api/cron/cleanup/route.ts
```

Protect it with:

```text
CRON_SECRET
```

---

## 15. Implementation phases

### Phase 1 — Base app

- Next.js setup
- Tailwind setup
- Supabase clients
- Auth pages
- Profiles
- Protected app layout
- Mobile shell
- Bottom navigation

### Phase 2 — Pair system

- Create pair
- Generate invite code
- Join pair by invite code
- Show pair status
- Prevent proof flow if no active pair

### Phase 3 — Daily word and seasons

- Server daily word logic
- Current `proof_date` by pair timezone
- Season calculation
- Today page

### Phase 4 — Proof request without push

- Create proof request
- Upload video
- Finalize request
- Pending review list
- Review page
- Approve/reject

### Phase 5 — Calendar

- Current season calendar
- Day details
- Previous season archive
- Video available/expired states

### Phase 6 — Notifications

- PWA manifest
- Service worker
- Push subscription
- Save subscription
- Send push on new request
- Send push on approve/reject
- Fallback UI if push disabled

### Phase 7 — Cleanup

- Delete expired videos
- Expire old pending requests
- Delete old metadata
- Test cleanup safely

---

## 16. Anti-patterns to avoid

Do not:

- Put all logic in `page.tsx`.
- Make every component `"use client"`.
- Trust client-submitted user IDs.
- Trust client-submitted daily word.
- Trust client-submitted dates/seasons.
- Store videos in a public bucket.
- Expose service role key to the browser.
- Approve/reject from client-side only.
- Skip RLS.
- Write huge components with many responsibilities.
- Mix upload logic, UI, validation, and database logic in one file.
- Build desktop-first UI.
- Add extra social features before MVP works.

---

## 17. Definition of done for MVP

The MVP is done when:

1. Two users can register/login.
2. One user can create a pair invite.
3. The second user can join the pair.
4. Both users can see the daily word.
5. User A can create a proof request with video.
6. User B can review and approve/reject it.
7. Both users can see the result.
8. Current season calendar shows proof records.
9. Previous season archive is accessible.
10. Videos expire after 7 days.
11. Old records are cleaned after they become older than previous season.
12. Unauthorized users cannot read or modify other users' proof requests.
13. App is usable on mobile as a PWA-style app.

---

## 18. Core principle

The app must stay simple.

The purpose is not to build a huge social platform.

The purpose is:

```text
two people stay connected
one person proves an action
the other person confirms it
both can see their seasonal progress
```

Every feature should support that loop.
