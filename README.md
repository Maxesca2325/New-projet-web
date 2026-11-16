# Koze — Aprann anglè an kreyòl

Koze se yon aplikasyon pou ayisyen aprann anglè **an kreyòl**, ak leson ki swiv **aktivite yo chwazi**:
💻 Biznis online · 🎓 Etid · ✈️ Vwayaj · 🏠 Lavi chak jou · 🏗️ Konstriksyon · 🩺 Swen sante.

## Sa ki ladan l (v0.3)

- **3 onglet**: Aprann (chemen leson yo), Revize (fraz pou revize + tout fraz ou aprann ak odyo), Pwofil.
- **Bouton retounen Android la mache**: chak ekran gen adrès pa l (`#aprann`, `#revize`, `#leson-sante-1`…); nan mitan yon leson li mande « Ou vle kite? ».
- **Maskòt la (trogon)** nan 4 pòz: bonjou, kontan, ankouraje, dòmi.
- Siy « San entènèt », fèt fen leson, vibrasyon.
- **Son efè** (bon repons, move repons, klik, fen leson) fèt an kòd ak Web Audio; ou ka koupe yo nan Pwofil.
- **Rafrechi paj la** pa fè w pèdi leson an; **fèmen app la** fè l rekòmanse a zewo.
- **Mikwofòn nan** aksepte aksan an (mo ki prèske menm, 60 % fraz la), montre sa l tande, epi pa janm bloke w.
- Dokiman design yo nan `.design/koze/` (brief, achitekti, tokens, travay).

### Baz la (v0.1)

- **Premye fwa**: 4 kesyon (poukisa, ki aktivite, ki nivo, konbyen minit pa jou). Apre sa, app la fè yon chemen pou moun nan: *Baz* → leson aktivite li yo youn apre lòt.
- **15 leson, 90 fraz**: 3 leson baz + 2 leson pou chak aktivite.
- **Pwononsyasyon ekri an kreyòl** pou chak fraz (*Thank you* → **Tènk yu**).
- **Fason leson an mache** (5–10 minit):
  1. 🎬 Sitiyasyon + objektif (« Apre leson sa a, ou ap ka… »)
  2. ✨ Aprann 2 fraz alafwa, epi tcheke yo touswit
  3. ✍️ Pratike: koute, chwazi, mete mo yo nan lòd, ekri. Egzèsis yo vin pi difisil selon nivo moun nan.
  4. 🎤 Pale nan mikwofòn (Chrome sou Android, Safari sou iPhone)
  5. Chak fraz ou rate tounen nan fen leson an
- **Repetisyon espase**: fraz yo tounen pou revizyon apre 1, 3, 7, 14, 30 jou.
- **Motivasyon**: XP, objektif chak jou, seri 🔥.
- **Mache san entènèt**, ou ka enstale l sou telefòn nan. Pa gen kont, tout pwogrè rete sou telefòn nan.
- Mòd lannwit otomatik.

## Kijan pou w teste l sou òdinatè

```bash
python3 -m http.server 8000
# louvri http://localhost:8000
```

## Mete l sou entènèt gratis (GitHub Pages)

1. Sou GitHub: **Settings → Pages**
2. *Source*: **Deploy from a branch**, chwazi branch la ak dosye `/ (root)`, epi **Save**
3. Apre 1–2 minit, app la ap disponib sou `https://maxesca2325.github.io/New-projet-web/`

Lè ou pibliye yon nouvo vèsyon, chanje `VERSION` nan `sw.js` pou telefòn yo telechaje l.

## Ajoute oswa korije leson

Tout kontni an nan `js/data.js`. Chak fraz gen 3 pati:

```js
['Thank you very much.', 'Mèsi anpil.', 'Tènk yu vèri moch.'],
//  anglè                  kreyòl         pwononsyasyon an kreyòl
```

> ⚠️ **Yon moun ki pale kreyòl natif natal dwe revize tout fraz kreyòl yo anvan lansman.**

## Fichye yo

| Fichye | Wòl |
|---|---|
| `index.html`, `styles.css` | Paj la ak style la |
| `js/app.js` | Ekran yo: premye fwa, akèy, leson, pwofil |
| `js/data.js` | Chemen yo ak leson yo |
| `js/lesson.js` | Kijan yon leson oswa yon revizyon konstwi |
| `js/srs.js` | Repetisyon espase |
| `js/speech.js` | Vwa anglè ak mikwofòn |
| `js/store.js` | Sove pwogrè sou telefòn nan |
| `sw.js`, `manifest.webmanifest` | Mache san entènèt, enstale sou telefòn |

## Pwochen etap

- [ ] Revizyon kreyòl pa yon moun ki pale l natif natal
- [ ] Plis leson (objektif: 10 leson pou chak aktivite)
- [x] Odyo anglè ak vwa natirèl (ElevenLabs « Sarah » via ai33, ~2,5 mo/s)
- [ ] Kont + senkronizasyon ant aparèy yo
- [ ] Premium: IA k ap jwe wòl (patwon, kliyan, pasyan), tout leson, san piblisite
- [ ] Peman: kat (dyaspora) + MonCash

## Design (v0.2)

- **Koulè**: ble ak wouj drapo ayisyen an, plis jòn ak vè yon tap-tap. Bann koulè tap-tap la parèt sèlman sou akèy la ak sou kat pwochen leson an.
- **Logo**: yon bil pawòl (koze) ble anlè, wouj anba, ak yon « k » blan (`icons/icon.svg`).
- **Polis** (nan `fonts/`, mache san entènèt):
  - *Bricolage Grotesque* pou tit yo
  - *Atkinson Hyperlegible* pou tèks la. Li fèt pou moun li fasil, menm sou yon ti ekran nan solèy.
- **Ikòn**: [Lucide](https://lucide.dev) (lisans ISC), nan `js/icons.js`.
- **Maskòt**: yon trogon, zwazo nasyonal Ayiti a (`img/maskot.webp`), kreye ak ai33.pro (gpt-image-2).
- Mòd lannwit otomatik.

### Kreye imaj ak ai33.pro

```bash
export AI33_API_KEY=...   # sou pwòp òdinatè ou sèlman; pa janm mete kle a nan yon fichye
node scripts/image_ai33.mjs scripts/koze-prompts.json out/
```

Chak imaj nan `scripts/koze-prompts.json` gen yon `model` (egzanp `recraft-v4` pou logo, `gpt-image-2` pou ilistrasyon), yon `prompt` ak yon `aspect_ratio`.

Polis yo gen lisans SIL Open Font License.
