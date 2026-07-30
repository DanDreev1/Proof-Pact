-- Fix for: column reference "proof_date" is ambiguous
-- Apply this in Supabase SQL Editor after the daily word pool update.

create table if not exists public.daily_word_candidates (
  word text primary key,
  created_at timestamptz not null default now(),
  constraint daily_word_candidates_word_format check (word = upper(word) and word ~ '^[A-Z]{4,16}$')
);

alter table public.daily_word_candidates enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.daily_words'::regclass
      and conname = 'daily_words_proof_date_key'
  ) then
    alter table public.daily_words
      add constraint daily_words_proof_date_key unique (proof_date);
  end if;
end;
$$;

insert into public.daily_word_candidates (word)
values
  ('ACORN'), ('AERIAL'), ('ALLOY'), ('AMBER'), ('ANCHOR'), ('APEX'), ('APPLE'), ('ARBOR'),
  ('ARCADE'), ('ARROW'), ('ASTRA'), ('ATLAS'), ('AURORA'), ('AXIOM'), ('BADGE'), ('BALANCE'),
  ('BEACON'), ('BINARY'), ('BLAZE'), ('BLOOM'), ('BOLT'), ('BONUS'), ('BREEZE'), ('BRIDGE'),
  ('BRIGHT'), ('BROOK'), ('CABLE'), ('CANYON'), ('CARBON'), ('CASTLE'), ('CEDAR'), ('CHAMP'),
  ('CIPHER'), ('CIRCLE'), ('CLOUD'), ('COBALT'), ('COMET'), ('COPPER'), ('CORAL'), ('COSMIC'),
  ('CRANE'), ('CREST'), ('CRISP'), ('CROWN'), ('CRYSTAL'), ('DELTA'), ('DENIM'), ('DRIFT'),
  ('DUNE'), ('ECHO'), ('EMBER'), ('ENERGY'), ('EQUAL'), ('FABLE'), ('FALCON'), ('FIELD'),
  ('FLAME'), ('FLINT'), ('FOCUS'), ('FORGE'), ('FROST'), ('GALAXY'), ('GARDEN'), ('GARNET'),
  ('GLOW'), ('GRACE'), ('GRANITE'), ('GRID'), ('GROVE'), ('HARBOR'), ('HAVEN'), ('HAWK'),
  ('HORIZON'), ('ICING'), ('IMPACT'), ('IONIC'), ('IVORY'), ('JASPER'), ('JOLT'), ('JOURNEY'),
  ('JUBILEE'), ('JUNCTION'), ('KEYSTONE'), ('LAGOON'), ('LANTERN'), ('LATTICE'), ('LAUREL'),
  ('LEGEND'), ('LIGHT'), ('LUNAR'), ('MAGNET'), ('MAPLE'), ('MARBLE'), ('MARKER'), ('MATRIX'),
  ('MEADOW'), ('MERIT'), ('METAL'), ('MIRROR'), ('MOMENT'), ('MOSAIC'), ('MOTION'), ('NEXUS'),
  ('NIMBLE'), ('NOVA'), ('OASIS'), ('ONYX'), ('ORBIT'), ('ORCHID'), ('ORIGIN'), ('PACER'),
  ('PADDLE'), ('PALACE'), ('PANEL'), ('PARAGON'), ('PEAK'), ('PEBBLE'), ('PHASE'), ('PILOT'),
  ('PIXEL'), ('PLANET'), ('PLUME'), ('POLAR'), ('PULSE'), ('QUARTZ'), ('QUEST'), ('RADAR'),
  ('RADIUS'), ('RALLY'), ('RAVEN'), ('RELAY'), ('RHYTHM'), ('RIDGE'), ('RIVER'), ('ROCKET'),
  ('SAFARI'), ('SAPPHIRE'), ('SCOUT'), ('SECTOR'), ('SHADOW'), ('SHIELD'), ('SIGNAL'),
  ('SILVER'), ('SKYLINE'), ('SOLAR'), ('SPARK'), ('SPHERE'), ('SPIRIT'), ('SPRING'),
  ('SQUARE'), ('STAR'), ('STATION'), ('STONE'), ('STREAM'), ('SUMMIT'), ('SUNRISE'),
  ('SWIFT'), ('TALENT'), ('TEMPO'), ('THRIVE'), ('TIDAL'), ('TIMBER'), ('TITAN'), ('TORCH'),
  ('TRAIL'), ('TRIAD'), ('TROPHY'), ('TUNDRA'), ('UNITY'), ('UPLINK'), ('VALLEY'), ('VECTOR'),
  ('VELVET'), ('VERTEX'), ('VICTORY'), ('VIOLET'), ('VISTA'), ('VOYAGE'), ('WALNUT'),
  ('WAVE'), ('WILLOW'), ('WINDOW'), ('WINTER'), ('WONDER'), ('ZENITH')
on conflict (word) do nothing;

create or replace function public.get_or_create_daily_word(target_proof_date date)
returns table (
  id uuid,
  proof_date date,
  word text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_word text;
begin
  return query
  select existing_word.id, existing_word.proof_date, existing_word.word
  from public.daily_words as existing_word
  where existing_word.proof_date = target_proof_date
  limit 1;

  if found then
    return;
  end if;

  select candidate.word
    into selected_word
  from public.daily_word_candidates as candidate
  where not exists (
    select 1
    from public.daily_words as recent_word
    where recent_word.word = candidate.word
      and recent_word.proof_date >= target_proof_date - 30
      and recent_word.proof_date < target_proof_date
  )
  order by hashtext(target_proof_date::text || ':' || candidate.word), candidate.word
  limit 1;

  if selected_word is null then
    select candidate.word
      into selected_word
    from public.daily_word_candidates as candidate
    order by hashtext(target_proof_date::text || ':' || candidate.word), candidate.word
    limit 1;
  end if;

  insert into public.daily_words (proof_date, word)
  values (target_proof_date, selected_word)
  on conflict on constraint daily_words_proof_date_key do nothing;

  return query
  select created_word.id, created_word.proof_date, created_word.word
  from public.daily_words as created_word
  where created_word.proof_date = target_proof_date
  limit 1;
end;
$$;

grant execute on function public.get_or_create_daily_word(date) to authenticated;
