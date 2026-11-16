# Kont Koze ak Supabase (gratis)

**Pwojè a deja kreye**: `koze` (`invbburpzbemmrphlouc`, rejyon us-east-1), URL ak kle publishable deja nan `js/config.js`. Rete etap 2 (tab la), 3 (imèl) ak *URL Configuration*.

Koze mache san kont. Lè ou ranpli `js/config.js`, bouton kont yo parèt: moun nan ka
konekte ak yon **kòd 6 chif pa imèl** epi pwogrè l ap sove nan kont li.

## 1. Kreye pwojè a (5 minit)
1. Ale sou **supabase.com** → *Start your project* → konekte (GitHub oswa imèl).
2. **New project**: non `koze`, chwazi yon modpas pou baz done a (kenbe l pou ou), rejyon **East US** (pi pre Ayiti ak dyaspora a), plan **Free**.

## 2. Kreye tab la
*SQL Editor* → *New query* → kole tout [`migrations/0001_progress.sql`](migrations/0001_progress.sql) → **Run**.

## 3. Imèl ak lyen (pa gen anyen pou chanje)
Koze sèvi ak imèl Supabase pa defo a: li gen yon **lyen** (« Confirm your mail » pou yon nouvo kont, « Log In » pou yon kont ki egziste). Moun nan peze lyen an sou menm telefòn nan, epi Koze louvri ak li konekte.

Sèl bagay pou regle: *Authentication* → *URL Configuration*: **Site URL** = `https://maxesca2325.github.io/New-projet-web/`, epi ajoute menm adrès la nan **Redirect URLs**.

Si yon jou ou ka modifye templates yo (pa egzanp apre w konekte yon SMTP tankou Resend), mete `{{ .Token }}` nan kò **Magic Link** ak **Confirm signup**: Koze aksepte kòd 6 chif la tou (seksyon « Imèl la gen yon kòd 6 chif? »).

> Plan gratis la voye sèlman kèk imèl pa èdtan. Pou lanse pou anpil moun, konekte yon sèvis imèl (SMTP, pa egzanp Resend) nan *Authentication* → *Emails* → *SMTP Settings*.

## 4. Konekte Koze ak pwojè a
*Project Settings* → *API*: kopye **Project URL** ak kle **anon public**, epi mete yo nan `js/config.js`:
```js
export const SUPABASE_URL = 'https://xxxx.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJ...';
```
Kle *anon* a fèt pou l piblik nan navigatè a: se règ RLS tab la ki pwoteje done yo. **Pa janm** mete kle *service_role* la nan app la.

## 5. (Pita) Google
*Authentication* → *Providers* → **Google**: mete Client ID ak Secret Google Cloud, epi ajoute
`https://xxxx.supabase.co/auth/v1/callback` kòm *Authorized redirect URI* nan Google Cloud.
Apre sa, mete `GOOGLE_LOGIN = true` nan `js/config.js`.

## Kijan sa mache nan kòd la
- `js/cloud.js`: koneksyon (kòd pa imèl, Google), sesyon ki renouvle poukont li, li/ekri tab `progress` (fetch sèlman, san bibliyotèk).
- `js/store.js` → `merge()`: mete pwogrè de aparèy ansanm san pèdi anyen.
- Senkronizasyon: lè app la louvri, apre chak leson/revizyon, lè entènèt la tounen, ak bouton « Sove kounye a » nan Pwofil.
