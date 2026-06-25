-- 20260624_anonymous_spot_attempts.sql
-- Track anonymous users who attempted to Spot (for conversion analytics)

create table if not exists anonymous_spot_attempts (
  id                   uuid        primary key default gen_random_uuid(),
  anonymous_session_id text        not null,
  creator_id           uuid        references creators(id) on delete set null,
  attempted_at         timestamptz not null default now(),
  source_page          text,
  device_type          text,
  created_at           timestamptz not null default now()
);

alter table anonymous_spot_attempts enable row level security;

-- Anyone can insert (no auth — that's the whole point of this table)
create policy "anon_attempts_insert"
  on anonymous_spot_attempts for insert
  with check (true);
