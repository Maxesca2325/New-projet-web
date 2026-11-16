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
