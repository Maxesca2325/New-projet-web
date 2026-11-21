-- Koze: chif yo. Kole YOUN nan rekèt sa yo nan Supabase → SQL Editor, epi peze Run.
-- (Chak rekèt kòmanse ak yon liy « -- » ki di sa l montre.)

-- 1) Chak jou: konbyen moun louvri Koze, konbyen fini yon leson (30 dènye jou)
select (created_at at time zone 'America/Port-au-Prince')::date as jou,
       count(distinct anon_id) filter (where name = 'open') as moun_ki_louvri,
       count(distinct anon_id) filter (where name in ('lesson_done', 'review_done')) as moun_ki_pratike,
       count(*) filter (where name = 'lesson_done') as leson_fini
from events where created_at > now() - interval '30 days'
group by 1 order by 1 desc;

-- 2) Retansyon: moun ki tounen 1 jou, 7 jou ak 30 jou apre premye fwa yo
with first as (select anon_id, min(created_at)::date as d0 from events group by 1),
days as (select distinct anon_id, created_at::date as d from events)
select f.d0 as premye_jou, count(*) as nouvo_moun,
       round(100.0 * count(*) filter (where exists (select 1 from days x where x.anon_id = f.anon_id and x.d = f.d0 + 1)) / count(*)) as "tounen_J1_%",
       round(100.0 * count(*) filter (where exists (select 1 from days x where x.anon_id = f.anon_id and x.d = f.d0 + 7)) / count(*)) as "tounen_J7_%",
       round(100.0 * count(*) filter (where exists (select 1 from days x where x.anon_id = f.anon_id and x.d = f.d0 + 30)) / count(*)) as "tounen_J30_%"
from first f group by 1 order by 1 desc limit 30;

-- 3) Antonwa (funnel): kote moun yo kanpe ant premye louvri a ak 3yèm leson an
with u as (
  select anon_id,
         bool_or(name = 'open') as louvri,
         bool_or(name = 'onboarding_done') as fini_kesyon,
         bool_or(name = 'lesson_start') as komanse_leson,
         count(*) filter (where name = 'lesson_done') as leson_fini
  from events group by 1)
select count(*) filter (where louvri) as louvri,
       count(*) filter (where fini_kesyon) as fini_kesyon_yo,
       count(*) filter (where komanse_leson) as komanse_1e_leson,
       count(*) filter (where leson_fini >= 1) as fini_1e_leson,
       count(*) filter (where leson_fini >= 3) as fini_3_leson
from u;

-- 4) Chak leson: konbyen kòmanse, fini, kite, presizyon mwayèn, ak egzèsis kote moun kite pi souvan
select props->>'id' as leson,
       count(*) filter (where name = 'lesson_start') as komanse,
       count(*) filter (where name = 'lesson_done') as fini,
       count(*) filter (where name = 'lesson_quit') as kite,
       round(avg((props->>'acc')::int) filter (where name = 'lesson_done')) as "presizyon_%",
       mode() within group (order by props->>'type') filter (where name = 'lesson_quit') as kite_sou_egzesis
from events where name in ('lesson_start', 'lesson_done', 'lesson_quit')
group by 1 order by 1;

-- 5) Mikwo: pousantaj ki mache, ak erè yo pa platfòm (pou wè si iPhone gen pwoblèm)
select platform,
       count(*) filter (where name = 'speak') as eseye,
       round(100.0 * count(*) filter (where name = 'speak' and (props->>'ok')::boolean) / nullif(count(*) filter (where name = 'speak'), 0)) as "reyisi_%",
       count(*) filter (where name = 'speak_error') as ere,
       string_agg(distinct props->>'code', ', ') filter (where name = 'speak_error') as kod_ere
from events where name in ('speak', 'speak_error') group by 1;

-- 6) Rapèl: konbyen moun limen yo, ak konbyen moun louvri Koze depi yon rapèl
select (select count(*) from koze_private.push_subs) as abonnman_aktif,
       count(distinct anon_id) filter (where name = 'remind_on') as moun_ki_limen,
       count(distinct anon_id) filter (where name = 'remind_off') as moun_ki_etenn,
       count(*) filter (where name = 'open' and (props->>'push')::boolean) as louvri_depi_rapel,
       string_agg(distinct props->>'why', ', ') filter (where name = 'remind_fail') as poukisa_echwe
from events;

-- 7) Telefòn: Android / iPhone / òdinatè, ak konbyen mete Koze sou ekran akèy (standalone)
select platform, count(distinct anon_id) as moun,
       count(distinct anon_id) filter (where standalone) as sou_ekran_akey
from events where name = 'open' group by 1 order by 2 desc;
