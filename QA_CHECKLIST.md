# QA Checklist

Use two accounts: User A and User B.

## Setup

- [ ] Apply the latest `supabase/schema.sql`.
- [ ] Fill `.env.local`.
- [ ] Restart the dev server after env changes.
- [ ] Open `/api/db/health` and confirm `ok: true`.

## Auth

- [ ] Register User A.
- [ ] Register User B.
- [ ] Log out and log back in with both users.
- [ ] Update display name on `/profile`.
- [ ] Confirm logout works from `/profile`.

## Pair

- [ ] User A creates an invite on `/pair`.
- [ ] User B joins with the invite code.
- [ ] User A sees User B display name.
- [ ] User B sees User A display name.
- [ ] `/create` is blocked before pair has two members.
- [ ] `/create` is available after pair has two members.

## Daily Word

- [ ] Today page shows a daily word.
- [ ] Create page shows the same daily word.
- [ ] Proof date matches the expected local date.

## Proof Creation

- [ ] User A selects a video under 200MB.
- [ ] User A sees file size before upload.
- [ ] User A cannot submit a video over 200MB.
- [ ] User A submits proof.
- [ ] User A sees the proof in "Your proofs".
- [ ] User B sees it in "Pending reviews".

## Review

- [ ] User B opens the review page.
- [ ] Video plays from a signed URL.
- [ ] Daily word, proof date, and title are visible.
- [ ] User B approves the proof.
- [ ] User A sees approved status.
- [ ] Repeat with another proof and reject it.
- [ ] User A sees rejected status and decision comment.

## Calendar

- [ ] Current season calendar shows records.
- [ ] Calendar is grouped by month.
- [ ] Days with records show status markers.
- [ ] Previous season switch works.
- [ ] Pending review records link to review page for reviewer.

## Deletion

- [ ] User A can delete their own proof request from `/proof/[requestId]`.
- [ ] User A must type the proof title before deletion.
- [ ] Deleted proof disappears from Today and Calendar.
- [ ] Reviewer cannot delete User A's proof from review page.

## Leave Pair

- [ ] Leave pair button is visible on `/pair`.
- [ ] Leave flow waits 15 seconds.
- [ ] Wrong partner display name blocks deletion.
- [ ] Correct partner display name deletes pair and shared proof data.
- [ ] After leaving, both users no longer see the pair.

## Cleanup

- [ ] Calling cleanup without `Authorization` returns `401`.
- [ ] Calling cleanup with `CRON_SECRET` returns `ok: true`.
- [ ] Response includes deleted/expired counts.

## Push Notifications

- [ ] With VAPID keys configured, `/profile` can enable notifications.
- [ ] New proof request attempts to notify reviewer.
- [ ] Approve/reject attempts to notify requester.
- [ ] App still works if notification permission is denied.
