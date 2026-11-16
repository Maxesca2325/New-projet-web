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
