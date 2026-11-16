# Kont Koze ak Supabase (gratis)

**Pwojè a deja kreye**: `koze` (`invbburpzbemmrphlouc`, rejyon us-east-1), URL ak kle publishable deja nan `js/config.js`. Rete etap 2 (tab la), 3 (imèl) ak *URL Configuration*.

Koze mache san kont. Lè ou ranpli `js/config.js`, bouton kont yo parèt: moun nan ka
konekte ak yon **kòd 6 chif pa imèl** epi pwogrè l ap sove nan kont li.

## 1. Kreye pwojè a (5 minit)
1. Ale sou **supabase.com** → *Start your project* → konekte (GitHub oswa imèl).
2. **New project**: non `koze`, chwazi yon modpas pou baz done a (kenbe l pou ou), rejyon **East US** (pi pre Ayiti ak dyaspora a), plan **Free**.

## 2. Kreye tab la
*SQL Editor* → *New query* → kole tout [`migrations/0001_progress.sql`](migrations/0001_progress.sql) → **Run**.

## 3. Imèl ak kòd 6 chif
1. *Authentication* → *Sign In / Providers* → **Email**: aktive, epi kite *Confirm email* aktive.
2. *Authentication* → *Emails* → *Templates* → **Magic Link**. Ranplase tèks la pa sa a pou imèl la voye **kòd la**:

   - Sijè: `Kòd Koze ou`
   - Kò:
     ```html
     <h2>Kòd Koze ou</h2>
     <p>Ekri kòd sa a nan app la pou w konekte:</p>
     <p style="font-size:28px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
     <p>Kòd la bon pou 1 è. Si se pa ou ki mande l, pa okipe imèl sa a.</p>
     ```
   - Fè menm bagay la pou template **Confirm signup** (premye fwa yon moun kreye kont).
3. *Authentication* → *URL Configuration*: **Site URL** = `https://maxesca2325.github.io/New-projet-web/`, epi ajoute menm adrès la nan **Redirect URLs**. Konsa, si imèl la voye yon *lyen* olye yon kòd, lyen an ap retounen nan Koze epi konekte moun nan.

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
