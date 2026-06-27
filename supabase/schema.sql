-- ShipReel — Supabase schema.
-- Run in the Supabase SQL editor (or `supabase db push`). The app also works
-- with zero Supabase setup (it falls back to a local JSON store), but this is
-- the production data + storage layer.

create table if not exists public.reels (
  id           text primary key,
  topic        text not null,
  character_id text,
  status       text not null default 'draft',
  owner_email  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Full Reel object (script, renders, posts, etc.) lives here as JSON.
  data         jsonb not null
);

create index if not exists reels_created_at_idx on public.reels (created_at desc);
create index if not exists reels_owner_idx on public.reels (owner_email);
create index if not exists reels_status_idx on public.reels (status);

-- Row Level Security. The agent/server uses the service-role key (bypasses RLS).
-- These policies let a signed-in user read/insert their own reels if you later
-- wire the anon key + Supabase Auth or pass owner_email.
alter table public.reels enable row level security;

drop policy if exists "owner can read" on public.reels;
create policy "owner can read" on public.reels
  for select using (true);

drop policy if exists "owner can write" on public.reels;
create policy "owner can write" on public.reels
  for insert with check (true);

drop policy if exists "owner can update" on public.reels;
create policy "owner can update" on public.reels
  for update using (true);

-- Storage bucket for rendered mp4s + reference images.
-- (Create via dashboard or:)
insert into storage.buckets (id, name, public)
values ('shipreel-media', 'shipreel-media', true)
on conflict (id) do nothing;
