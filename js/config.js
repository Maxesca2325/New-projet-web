// Konfigirasyon Supabase pou kont itilizatè yo.
// Mete URL pwojè a ak kle "anon" (ki piblik, li fèt pou l nan navigatè a) yo jwenn nan
// Supabase → Project Settings → API (pwojè « koze », kle publishable). Tank yo vid, Koze mache san kont, jan l te ye a.
// Sekirite a soti nan règ RLS yo (supabase/migrations/0001_progress.sql), pa nan kle a.
export const SUPABASE_URL = 'https://invbburpzbemmrphlouc.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_OqqdmxjY5PY7I15pmFJBYQ_gQRmhm-n';
// Mete true lè Google aktive nan Supabase → Authentication → Providers.
export const GOOGLE_LOGIN = false;
