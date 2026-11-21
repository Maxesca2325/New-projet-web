-- Koze: kole TOUT fichye sa a nan Supabase → SQL Editor → New query, epi peze Run.
-- Li kreye tab pwogrè a (ak sekirite RLS) ak fonksyon pou efase kont. Ou ka kouri l plizyè fwa san pwoblèm.

-- Koze: pwogrè chak itilizatè (yon liy pa moun).
-- Kole sa nan Supabase → SQL Editor → New query, epi peze Run.
create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Sekirite: chak moun ka li, ekri ak efase sèlman pwòp liy pa l.
alter table public.progress enable row level security;

drop policy if exists "progress_select_own" on public.progress;
drop policy if exists "progress_insert_own" on public.progress;
drop policy if exists "progress_update_own" on public.progress;
drop policy if exists "progress_delete_own" on public.progress;

create policy "progress_select_own" on public.progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "progress_insert_own" on public.progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "progress_update_own" on public.progress
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "progress_delete_own" on public.progress
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Limit pou yon moun pa ka mete yon gwo fichye nan tab la (pwogrè nòmal < 50 Ko).
alter table public.progress drop constraint if exists progress_data_size;
alter table public.progress add constraint progress_data_size check (pg_column_size(data) < 200000);

-- Koze: yon moun ki konekte ka efase pwòp kont li nèt (Pwofil → Efase kont mwen).
-- Pwogrè l efase tou (progress.user_id … on delete cascade).
-- security definer: fonksyon an gen dwa efase nan auth.users, men li efase SÈLMAN moun ki rele l la (auth.uid()).
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
