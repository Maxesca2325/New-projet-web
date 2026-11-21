-- Koze: mezi (estatistik anonim) ak rapèl chak jou (notifikasyon).
-- Kole sa nan Supabase → SQL Editor → New query, epi peze Run. Ou ka kouri l plizyè fwa san pwoblèm.

-- ================================================================ 1. Mezi anonim
-- Chak telefòn gen yon nimewo o aza (anon_id). Pa gen imèl, pa gen non, pa gen kont, pa gen IP nan tab sa a.
create table if not exists public.events (
  id bigint generated always as identity primary key,
  anon_id uuid not null,
  name text not null check (name ~ '^[a-z_]{2,40}$'),
  props jsonb not null default '{}'::jsonb check (pg_column_size(props) < 2000),
  app text check (char_length(app) <= 20),
  platform text check (platform in ('android', 'ios', 'desktop', 'other')),
  standalone boolean,
  client_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists events_created_idx on public.events (created_at);
create index if not exists events_anon_idx on public.events (anon_id, created_at);
create index if not exists events_name_idx on public.events (name, created_at);

alter table public.events enable row level security;
-- App la ka sèlman AJOUTE liy. Pèsonn pa ka li, chanje oswa efase yo atravè API a (ou li yo nan SQL Editor).
drop policy if exists "events_insert" on public.events;
create policy "events_insert" on public.events for insert to anon, authenticated with check (true);
revoke all on public.events from anon, authenticated;
grant insert on public.events to anon, authenticated;

-- ================================================================ 2. Rapèl chak jou
create schema if not exists koze_private;
revoke all on schema koze_private from public, anon, authenticated;

-- Abònman notifikasyon yo (yon liy pa telefòn). Adrès « endpoint » lan se yon kle sekrè: sèl telefòn nan konnen l.
create table if not exists koze_private.push_subs (
  endpoint text primary key check (endpoint ~ '^https://' and char_length(endpoint) < 800),
  p256dh text not null check (char_length(p256dh) < 200),
  auth text not null check (char_length(auth) < 100),
  hour smallint not null check (hour between 0 and 23),
  tz text not null default 'America/Port-au-Prince',
  last_day date,          -- dènye jou moun nan te pratike (jou pa l)
  streak int not null default 0 check (streak between 0 and 100000),
  last_sent date,         -- dènye jou nou voye yon rapèl
  fails int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Kle VAPID (fonksyon an kreye yo li menm la premye fwa) ak sekrè cron lan. Pa janm vizib nan API a.
create table if not exists koze_private.settings (
  id int primary key default 1 check (id = 1),
  vapid_public text,
  vapid_private text,
  cron_secret text not null default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
);
insert into koze_private.settings (id) values (1) on conflict (id) do nothing;

-- App la pale ak abònman yo SÈLMAN atravè 3 fonksyon sa yo (pa gen aksè dirèk sou tab la).
create or replace function public.push_save(p_endpoint text, p_p256dh text, p_auth text, p_hour int, p_tz text, p_last_day date, p_streak int)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_tz is null or not exists (select 1 from pg_catalog.pg_timezone_names where name = p_tz) then p_tz := 'America/Port-au-Prince'; end if;
  insert into koze_private.push_subs (endpoint, p256dh, auth, hour, tz, last_day, streak)
  values (p_endpoint, p_p256dh, p_auth, p_hour, p_tz, p_last_day, greatest(0, coalesce(p_streak, 0)))
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth, hour = excluded.hour, tz = excluded.tz,
    last_day = coalesce(excluded.last_day, koze_private.push_subs.last_day), streak = excluded.streak, fails = 0, updated_at = now();
end; $$;

create or replace function public.push_touch(p_endpoint text, p_last_day date, p_streak int)
returns void language sql security definer set search_path = '' as $$
  update koze_private.push_subs set last_day = p_last_day, streak = greatest(0, coalesce(p_streak, 0)), updated_at = now() where endpoint = p_endpoint;
$$;

create or replace function public.push_remove(p_endpoint text)
returns void language sql security definer set search_path = '' as $$
  delete from koze_private.push_subs where endpoint = p_endpoint;
$$;

revoke all on function public.push_save(text, text, text, int, text, date, int) from public;
revoke all on function public.push_touch(text, date, int) from public;
revoke all on function public.push_remove(text) from public;
grant execute on function public.push_save(text, text, text, int, text, date, int) to anon, authenticated;
grant execute on function public.push_touch(text, date, int) to anon, authenticated;
grant execute on function public.push_remove(text) to anon, authenticated;

-- ================================================================ 3. Chak èdtan: voye rapèl yo
-- pg_cron rele fonksyon « koze-push » la chak èdtan; li voye rapèl bay moun ki chwazi lè sa a epi ki poko pratike jodi a.
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule(jobid) from cron.job where jobname = 'koze-reminders';
select cron.schedule('koze-reminders', '2 * * * *', $cron$
  select net.http_post(
    url := 'https://invbburpzbemmrphlouc.supabase.co/functions/v1/koze-push?send=1',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select cron_secret from koze_private.settings where id = 1)),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
$cron$);
