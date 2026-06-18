-- 20260618_share_cards.sql
-- Social sharing system: share_cards + share_events + view-count RPC

create or replace function generate_share_slug()
returns text language sql as $$
  select lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
$$;

create table if not exists share_cards (
  id uuid primary key default gen_random_uuid(),
  share_slug text unique not null default generate_share_slug(),
  user_id uuid references auth.users(id) on delete cascade,
  creator_id uuid references creators(id) on delete cascade,
  share_type text not null check (share_type in ('first_spot', 'rediscovered', 'discovery_record', 'breakout_legacy')),
  title text,
  subtitle text,
  caption text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  view_count integer not null default 0,
  last_viewed_at timestamptz
);

alter table share_cards enable row level security;
create policy "share_cards_public_read" on share_cards for select using (true);
create policy "share_cards_insert_own" on share_cards for insert with check (auth.uid() = user_id);

-- security definer so it bypasses RLS for the update
create or replace function increment_share_view(p_slug text)
returns void language plpgsql security definer as $$
begin
  update share_cards set view_count = view_count + 1, last_viewed_at = now() where share_slug = p_slug;
end;
$$;

-- share events for analytics
create table if not exists share_events (
  id uuid primary key default gen_random_uuid(),
  share_card_id uuid references share_cards(id) on delete cascade,
  event_type text not null,
  created_at timestamptz not null default now()
);
alter table share_events enable row level security;
create policy "share_events_insert" on share_events for insert with check (true);
