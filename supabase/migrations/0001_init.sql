create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text check (char_length(name) <= 80),
  avatar_url text check (char_length(avatar_url) <= 500),
  role text not null default 'user' check (role in ('user', 'admin')),
  supporter_until timestamptz,
  supporter_since timestamptz,
  supporter_months integer not null default 0 check (supporter_months between 0 and 1200),
  supporter_comp boolean not null default false,
  founder_no integer unique check (founder_no between 1 and 100),
  show_on_wall boolean not null default true,
  wall_name text check (char_length(wall_name) <= 40),
  patreon_user_id text unique check (char_length(patreon_user_id) <= 40),
  patreon_checked_at timestamptz,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table if not exists public.visit_daily (
  day date not null,
  path text not null check (char_length(path) <= 40),
  country text not null check (char_length(country) <= 2),
  device text not null check (device in ('phone', 'desktop')),
  source text not null check (source in ('youtube', 'search', 'social', 'direct', 'other')),
  n integer not null default 0,
  primary key (day, path, country, device, source)
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  title text not null check (char_length(title) between 6 and 120),
  details text check (char_length(details) <= 600),
  by_name text not null check (char_length(by_name) <= 60),
  status text not null default 'heard' check (status in ('heard', 'crunching', 'rendering', 'live')),
  video_id text check (video_id ~ '^[A-Za-z0-9_-]{11}$'),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists ideas_user_created on public.ideas (user_id, created_at desc);
create index if not exists ideas_public on public.ideas (hidden, created_at desc);
create index if not exists profiles_wall on public.profiles (supporter_until) where show_on_wall;

create table if not exists public.flags (
  key text primary key check (char_length(key) <= 40),
  enabled boolean not null,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.visit_daily enable row level security;
alter table public.ideas enable row level security;
alter table public.flags enable row level security;

revoke all on public.profiles, public.visit_daily, public.ideas, public.flags from anon, authenticated;

create or replace function public.bump_visit(p_day date, p_path text, p_country text, p_device text, p_source text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.visit_daily (day, path, country, device, source, n)
  values (p_day, p_path, p_country, p_device, p_source, 1)
  on conflict (day, path, country, device, source) do update set n = public.visit_daily.n + 1;
$$;

create or replace function public.claim_founder(p_user uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v integer;
begin
  perform pg_advisory_xact_lock(4242);
  select founder_no into v from public.profiles where id = p_user;
  if v is not null then
    return v;
  end if;
  select coalesce(max(founder_no), 0) + 1 into v from public.profiles;
  if v > 100 then
    return null;
  end if;
  update public.profiles set founder_no = v where id = p_user;
  return v;
end;
$$;

revoke all on function public.bump_visit(date, text, text, text, text) from public, anon, authenticated;
revoke all on function public.claim_founder(uuid) from public, anon, authenticated;
grant execute on function public.bump_visit(date, text, text, text, text) to service_role;
grant execute on function public.claim_founder(uuid) to service_role;
grant all on public.profiles, public.visit_daily, public.ideas, public.flags to service_role;
