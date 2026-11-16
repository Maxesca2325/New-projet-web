# Kont Koze ak Supabase (gratis)

**Pwojè a deja kreye**: `koze` (`invbburpzbemmrphlouc`, rejyon us-east-1), URL ak kle publishable deja nan `js/config.js`. Rete etap 2 (tab la), 3 (imèl) ak *URL Configuration*.

Koze mache san kont. Avèk yon kont, moun nan konekte ak **imèl + modpas**, epi pwogrè l sove nan kont li.

## 1. Kreye pwojè a (5 minit)
1. Ale sou **supabase.com** → *Start your project* → konekte (GitHub oswa imèl).
2. **New project**: non `koze`, chwazi yon modpas pou baz done a (kenbe l pou ou), rejyon **East US** (pi pre Ayiti ak dyaspora a), plan **Free**.

## 2. Kreye tab la ak fonksyon an
*SQL Editor* → *New query* → kole epi **Run**, youn apre lòt:
- [`migrations/0001_progress.sql`](migrations/0001_progress.sql): tab pwogrè a, ak RLS (chak moun wè pa l sèlman).
- [`migrations/0002_delete_account.sql`](migrations/0002_delete_account.sql): pou moun nan ka efase kont li nèt (Pwofil → Efase kont mwen).

## 3. Règ sekirite pou modpas yo (Dashboard)
*Authentication* → *Sign In / Providers* → **Email**:
- **Confirm email**: ON (moun nan dwe peze lyen nan imèl la anvan l konekte).
- **Secure email change**: ON.
- **Minimum password length**: `8`.
- **Password requirements**: *Letters and digits*.
- **Prevent use of leaked passwords**: ON si plan an pèmèt li (Pro).

*Authentication* → *URL Configuration*: **Site URL** = `https://maxesca2325.github.io/New-projet-web/`, epi ajoute menm adrès la nan **Redirect URLs** (lyen konfimasyon ak « Reset Password » yo retounen la).

> Imèl pa defo yo an anglè: « Confirm your mail » (nouvo kont) ak « Reset Password » (bliye modpas). Koze eksplike moun nan ki bouton pou l peze.
> Plan gratis la voye sèlman kèk imèl pa èdtan. Anvan lanse pou anpil moun, konekte yon sèvis imèl (SMTP, pa egzanp Resend) nan *Authentication* → *Emails* → *SMTP Settings*: sa pèmèt plis imèl, epi imèl an kreyòl.
> Pita, pou bloke robo: *Authentication* → *Attack Protection* → CAPTCHA (Cloudflare Turnstile, gratis).

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
- `js/cloud.js`: kreye kont, konekte, bliye/chanje modpas, efase kont (imèl + modpas, Google), règ modpas, limit esè sou telefòn nan, sesyon ki renouvle poukont li, li/ekri tab `progress` (fetch sèlman, san bibliyotèk).
- `js/pages.js`: FAQ, Règ konfidansyalite, Kondisyon itilizasyon. Mete `CONTACT_EMAIL` nan `js/config.js`.
- `index.html`: *Content-Security-Policy* (navigatè a refize kòd ak koneksyon ki pa soti nan Koze oswa Supabase).
- `js/store.js` → `merge()`: mete pwogrè de aparèy ansanm san pèdi anyen.
- Senkronizasyon: lè app la louvri, apre chak leson/revizyon, lè entènèt la tounen, ak bouton « Sove kounye a » nan Pwofil.
