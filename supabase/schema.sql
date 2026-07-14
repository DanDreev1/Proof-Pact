-- Proof Accountability App schema draft
-- Review and adjust policies before production.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  avatar_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accountability_pairs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'active' check (status in ('active', 'archived')),
  timezone text not null default 'Europe/London',
  invite_code text unique null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  archived_at timestamptz null
);

create table if not exists public.pair_members (
  pair_id uuid not null references public.accountability_pairs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (pair_id, user_id)
);

create table if not exists public.daily_words (
  id uuid primary key default gen_random_uuid(),
  proof_date date not null unique,
  word text not null check (char_length(word) between 2 and 40),
  created_at timestamptz not null default now()
);

create table if not exists public.proof_requests (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.accountability_pairs(id) on delete cascade,
  requester_id uuid not null references auth.users(id),
  reviewer_id uuid not null references auth.users(id),
  daily_word_id uuid not null references public.daily_words(id),
  title text not null check (char_length(title) between 1 and 80),
  description text null check (description is null or char_length(description) <= 500),
  video_path text null,
  status text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'rejected', 'expired')),
  decision_comment text null check (decision_comment is null or char_length(decision_comment) <= 300),
  proof_date date not null,
  season text not null check (season in ('spring', 'summer', 'autumn', 'winter')),
  season_year int not null,
  created_at timestamptz not null default now(),
  submitted_at timestamptz null,
  decided_at timestamptz null,
  draft_expires_at timestamptz not null,
  video_expires_at timestamptz not null,
  check (requester_id <> reviewer_id)
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz null
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proof-videos',
  'proof-videos',
  false,
  209715200,
  array['video/webm', 'video/mp4', 'video/quicktime']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1), 'User')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.user_has_active_pair(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pair_members
    join public.accountability_pairs
      on accountability_pairs.id = pair_members.pair_id
    where pair_members.user_id = $1
      and accountability_pairs.status = 'active'
  );
$$;

create or replace function public.user_is_pair_member(target_pair_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pair_members
    where pair_members.pair_id = $1
      and pair_members.user_id = auth.uid()
  );
$$;

create or replace function public.create_accountability_pair(pair_timezone text default 'Europe/London')
returns table(pair_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  generated_code text;
  created_pair_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if public.user_has_active_pair(current_user_id) then
    raise exception 'User already has an active pair';
  end if;

  loop
    generated_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

    begin
      insert into public.accountability_pairs (created_by, timezone, invite_code)
      values (current_user_id, coalesce(nullif(pair_timezone, ''), 'Europe/London'), generated_code)
      returning id into created_pair_id;

      exit;
    exception
      when unique_violation then
        generated_code := null;
    end;
  end loop;

  insert into public.pair_members (pair_id, user_id, role)
  values (created_pair_id, current_user_id, 'member');

  pair_id := created_pair_id;
  invite_code := generated_code;
  return next;
end;
$$;

create or replace function public.join_accountability_pair(pair_invite_code text)
returns table(pair_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_pair_id uuid;
  member_count int;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if public.user_has_active_pair(current_user_id) then
    raise exception 'User already has an active pair';
  end if;

  select id
  into target_pair_id
  from public.accountability_pairs
  where invite_code = upper(trim(pair_invite_code))
    and status = 'active'
  limit 1;

  if target_pair_id is null then
    raise exception 'Invite code not found';
  end if;

  select count(*)
  into member_count
  from public.pair_members
  where pair_members.pair_id = target_pair_id;

  if member_count >= 2 then
    raise exception 'Pair is already full';
  end if;

  insert into public.pair_members (pair_id, user_id, role)
  values (target_pair_id, current_user_id, 'member');

  pair_id := target_pair_id;
  return next;
end;
$$;

create or replace function public.get_or_create_daily_word(target_proof_date date)
returns table(id uuid, proof_date date, word text)
language plpgsql
security definer
set search_path = public
as $$
declare
  word_bank text[] := array[
    'ORBIT',
    'ANCHOR',
    'EMBER',
    'SUMMIT',
    'RIVER',
    'PULSE',
    'NOVA',
    'HARBOR',
    'CINDER',
    'VECTOR',
    'MARBLE',
    'FROST',
    'SIGNAL',
    'BRIDGE'
  ];
  selected_word text;
  selected_daily_word_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  selected_word := word_bank[(abs(hashtext(target_proof_date::text)) % array_length(word_bank, 1)) + 1];

  insert into public.daily_words (proof_date, word)
  values (target_proof_date, selected_word)
  on conflict on constraint daily_words_proof_date_key do update
    set word = public.daily_words.word
  returning public.daily_words.id into selected_daily_word_id;

  return query
  select dw.id, dw.proof_date, dw.word
  from public.daily_words as dw
  where dw.id = selected_daily_word_id
  limit 1;
end;
$$;

grant execute on function public.create_accountability_pair(text) to authenticated;
grant execute on function public.join_accountability_pair(text) to authenticated;
grant execute on function public.get_or_create_daily_word(date) to authenticated;

alter table public.profiles enable row level security;
alter table public.accountability_pairs enable row level security;
alter table public.pair_members enable row level security;
alter table public.daily_words enable row level security;
alter table public.proof_requests enable row level security;
alter table public.push_subscriptions enable row level security;

-- Simple MVP policies. Tighten and test before production.

drop policy if exists "Profiles are readable by self" on public.profiles;
drop policy if exists "Profiles are inserted by self" on public.profiles;
drop policy if exists "Profiles are updatable by self" on public.profiles;
drop policy if exists "Daily words are readable by authenticated users" on public.daily_words;
drop policy if exists "Pair members can read their memberships" on public.pair_members;
drop policy if exists "Pairs are readable by members" on public.accountability_pairs;
drop policy if exists "Proof requests visible to requester or reviewer" on public.proof_requests;
drop policy if exists "Requester can insert own draft proof" on public.proof_requests;
drop policy if exists "Reviewer/requester can update related proof requests" on public.proof_requests;
drop policy if exists "Requester can update own draft proof" on public.proof_requests;
drop policy if exists "Reviewer can decide pending proof" on public.proof_requests;
drop policy if exists "Push subscriptions are visible to owner" on public.push_subscriptions;
drop policy if exists "Push subscriptions are inserted by owner" on public.push_subscriptions;
drop policy if exists "Push subscriptions are updated by owner" on public.push_subscriptions;
drop policy if exists "Push subscriptions are deleted by owner" on public.push_subscriptions;
drop policy if exists "Proof videos are inserted by pair members" on storage.objects;
drop policy if exists "Proof videos are readable by pair members" on storage.objects;

create policy "Profiles are readable by self"
on public.profiles for select
using (
  id = auth.uid()
  or exists (
    select 1
    from public.pair_members current_user_membership
    join public.pair_members profile_membership
      on profile_membership.pair_id = current_user_membership.pair_id
    where current_user_membership.user_id = auth.uid()
      and profile_membership.user_id = profiles.id
  )
);

create policy "Profiles are inserted by self"
on public.profiles for insert
with check (id = auth.uid());

create policy "Profiles are updatable by self"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "Daily words are readable by authenticated users"
on public.daily_words for select
to authenticated
using (true);

create policy "Pair members can read their memberships"
on public.pair_members for select
using (public.user_is_pair_member(pair_id));

create policy "Pairs are readable by members"
on public.accountability_pairs for select
using (
  exists (
    select 1
    from public.pair_members
    where pair_members.pair_id = accountability_pairs.id
      and pair_members.user_id = auth.uid()
  )
);

create policy "Proof requests visible to requester or reviewer"
on public.proof_requests for select
using (requester_id = auth.uid() or reviewer_id = auth.uid());

create policy "Requester can insert own draft proof"
on public.proof_requests for insert
with check (
  requester_id = auth.uid()
  and requester_id <> reviewer_id
  and status = 'draft'
  and public.user_is_pair_member(pair_id)
  and exists (
    select 1
    from public.pair_members
    where pair_members.pair_id = proof_requests.pair_id
      and pair_members.user_id = proof_requests.reviewer_id
  )
);

create policy "Requester can update own draft proof"
on public.proof_requests for update
using (
  requester_id = auth.uid()
  and status = 'draft'
)
with check (
  requester_id = auth.uid()
  and requester_id <> reviewer_id
  and status in ('draft', 'pending')
);

create policy "Reviewer can decide pending proof"
on public.proof_requests for update
using (
  reviewer_id = auth.uid()
  and requester_id <> auth.uid()
  and status = 'pending'
)
with check (
  reviewer_id = auth.uid()
  and requester_id <> auth.uid()
  and status in ('approved', 'rejected')
);

create policy "Push subscriptions are visible to owner"
on public.push_subscriptions for select
using (user_id = auth.uid());

create policy "Push subscriptions are inserted by owner"
on public.push_subscriptions for insert
with check (user_id = auth.uid());

create policy "Push subscriptions are updated by owner"
on public.push_subscriptions for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Push subscriptions are deleted by owner"
on public.push_subscriptions for delete
using (user_id = auth.uid());

create policy "Proof videos are inserted by pair members"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'proof-videos'
  and public.user_is_pair_member((storage.foldername(name))[1]::uuid)
);

create policy "Proof videos are readable by pair members"
on storage.objects for select
to authenticated
using (
  bucket_id = 'proof-videos'
  and public.user_is_pair_member((storage.foldername(name))[1]::uuid)
);
