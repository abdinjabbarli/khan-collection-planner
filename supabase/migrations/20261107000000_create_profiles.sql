-- KHAN Collection Planner: user profiles
-- Run this once in the Supabase SQL Editor of project scosqqqfvdyloqlaodpm
-- (https://scosqqqfvdyloqlaodpm.supabase.co). It is idempotent and safe to re-run.
-- Contains no secrets. Do NOT run it on the old khan-ch6 project.

-- 1. Table: one row per auth user; deleting the auth user deletes the profile.
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  brand_name   text check (brand_name is null or char_length(brand_name) <= 60),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is
  'Per-user profile for KHAN Collection Planner. Planner data (collections, products, palettes) is NOT stored here.';

-- 2. Row Level Security: a signed-in user can only see and edit their own row.
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- No delete policy: signed-in users cannot delete rows through the API.

-- 3. Privileges: no anonymous access; ownership (id) and timestamps are not client-writable.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant insert (id, display_name, brand_name) on table public.profiles to authenticated;
grant update (display_name, brand_name) on table public.profiles to authenticated;

-- 4. Keep updated_at honest (the client cannot set it).
create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_profiles_updated_at();

-- 5. Create a profile automatically when a user first signs up (e.g. with Google).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      ''
    ), 60)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Backfill profiles for users that signed in before this migration.
insert into public.profiles (id, display_name)
select u.id,
       left(coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''),
                     nullif(u.raw_user_meta_data ->> 'name', ''), ''), 60)
from auth.users u
on conflict (id) do nothing;
