# Design Review : Koze v0.3

Reviewed against: `.design/koze/DESIGN_BRIEF.md` (+ IA, tokens, TASKS)
Philosophy: **Tap-tap** — base Scandinavian, accents Neo-Memphis (bande tap-tap, mascotte, victoires)
Méthode : skill `design-review` (julianoczkowski/designer-skills) + checklist **Unslop design** (marcosnovo, via AgentAlley). Les scripts Unslop (`slop-scan`, `web-audit`, `unslop-score`) n'ont pas pu être lancés dans cette session (permission refusée pour exécuter du code tiers) : la checklist a été appliquée à la main sur les captures, et les mesures viennent de nos propres tests (Playwright + axe-core 4.10).
Date: 2026-11-16

## Screenshots Captured

Toutes dans `.design/koze/screenshots/` (36 fichiers).

| Screenshot | Breakpoint | Description |
| --- | --- | --- |
| `review-byenvini-{mobile-375,tablet-768,desktop-1280}.png` | 375 / 768 / 1280 | Premier lancement |
| `review-byenvini-dark-mode-{mobile-375,desktop-1280}.png` | 375 / 1280 | Premier lancement, sombre |
| `review-kesyon-2-mobile-375.png` | 375 | Onboarding, choix multiple (2 activités cochées) |
| `review-aprann-{mobile-375,tablet-768,desktop-1280}.png` | 375 / 768 / 1280 | Onglet Aprann (pleine page) |
| `review-aprann-dark-mode-{mobile-375,desktop-1280}.png` | 375 / 1280 | Aprann sombre |
| `review-aprann-grayscale-mobile-375.png` | 375 | Test en niveaux de gris (principe Unslop n° 2) |
| `review-aprann-focus-mobile-375.png` | 375 | Focus clavier (3 × Tab) |
| `review-revize-{mobile-375,tablet-768,desktop-1280}.png` + `-dark-mode-*` | 375 / 768 / 1280 | Onglet Revize avec 6 phrases dues |
| `review-revize-vid-mobile-375.png` | 375 | Revize avant la 1re leçon (état vide) |
| `review-pwofil-{mobile-375,tablet-768,desktop-1280}.png` + `-dark-mode-*` | 375 / 768 / 1280 | Onglet Pwofil |
| `review-leson-{situation,intro,choose_ht,listen,order,type,speak}-mobile-375.png` | 375 | Chaque type d'écran de leçon |
| `review-leson-feedback-{bon,pa-bon}-mobile-375.png` | 375 | Feuille de feedback juste / faux |
| `review-leson-kite-modal-mobile-375.png` | 375 | Feuille « Ou vle kite? » |
| `review-leson-fen-mobile-375.png` + `-dark-mode-` | 375 | Fin de leçon (célébration) |

## Summary

La v0.3 tient la direction du brief : créole d'abord, une seule action par écran, mascotte et bande tap-tap réservées aux moments forts, aucun débordement de 360 à 1280 px et **0 violation axe** en clair comme en sombre. Le test en gris passe (la carte « prochaine leçon » et son bouton dominent). Le plus gros écart : les **consignes d'exercice** (« KISA SA VLE DI? », « METE MO YO NAN LÒD ») sont écrites en petites capitales grises espacées, le tic le plus courant des interfaces générées, alors que pour un débutant c'est l'information la plus importante après la phrase elle-même.

## Must Fix

1. **Consignes d'exercice illisibles pour un débutant** : dans toutes les leçons, la consigne en créole est un `eyebrow` (13 px, majuscules, gris secondaire) au-dessus de la question. Contredit le principe 2 du brief (« le créole d'abord ») et Unslop #45/#60 (petites capitales sur chaque section). Voir `review-leson-choose_ht-mobile-375.png`, `review-leson-order-mobile-375.png`, `review-leson-type-mobile-375.png`. _Fix : consigne en phrase normale (« Kisa sa vle di? »), 17–19 px, encre principale, au-dessus de la question ; garder l'eyebrow seulement là où il porte une info (« Kesyon 2 sou 4 », « Biznis online · Pwochen leson »)._

## Should Fix

1. **Le bouton qui pousse à abandonner est le bouton principal** : dans « Ou vle kite? », « Wi, kite » est bleu plein et « Non » est secondaire (`js/app.js` `ask()`). Pour une app qui vit de la régularité, l'action mise en avant doit être de rester. Voir `review-leson-kite-modal-mobile-375.png`. _Fix (Unslop #41) : « Non, kontinye » en primaire, « Wi, kite » en secondaire._
2. **« Kontinye » rouge après une erreur** : la feuille d'erreur utilise `btn danger` (rouge = destruction). Une erreur n'est pas une destruction et le rouge plein en bas de l'écran « punit ». Voir `review-leson-feedback-pa-bon-mobile-375.png`. _Fix (Unslop #19/#41) : bouton encre neutre (`--color-text-primary` sur fond erreur clair) ; le rouge reste sur le titre et l'icône._
3. **Chaque chiffre deux fois sur Pwofil** : série et XP sont dans l'en-tête ET dans les tuiles ; la grille 2 × 2 « gros chiffre, petit label » est le squelette type d'un écran généré. Voir `review-pwofil-mobile-375.png`. _Fix (Unslop #17/#65) : garder les puces de l'en-tête, remplacer la grille par une ligne de progrès concrète (« 1 leson sou 15 fini · 2 fraz metrize ») et le parcours._
4. **Effacer la progression en rouge sur Pwofil** : bouton contour rouge, visible comme une action normale. Voir `review-pwofil-mobile-375.png`. _Fix (Unslop #41) : lien tertiaire gris en bas ; le rouge seulement dans la feuille de confirmation (déjà le cas)._
5. **Le toast couvre les puces série/XP** : « Chemen ou pare! » s'affiche en haut, par-dessus l'en-tête (vu pendant les tests). _Fix : le placer au-dessus de la barre d'onglets (en bas), sous la zone du pouce._

## Could Improve

1. **« Fòs memwa » en trois tuiles de couleur** (`review-revize-mobile-375.png`) : juste en info, mais trois tuiles égales = motif « trois stats ». _Suggestion (Unslop #58) : une seule barre segmentée (nouvo / ap aprann / metrize) avec la légende en texte, plus proche de l'objet « mémoire »._
2. **Zéro barré d'Atkinson** : « 1Ø minit », « 6Ø / 1ØØ XP » peut dérouter un lecteur débutant. _Suggestion : chiffres en Bricolage Grotesque (`.num`, tabular-nums) partout où il y a des nombres._
3. **Chemin très long** : avec 3 activités, l'écran Aprann liste 9 leçons verrouillées (`review-aprann-mobile-375.png`). _Suggestion : replier par défaut les groupes pas encore commencés (seule la 1re leçon visible) ; ça prépare aussi les 70 leçons prévues._
4. **Écran « situation » vide** (`review-leson-situation-mobile-375.png`) : beaucoup d'air sous l'objectif. _Suggestion : la mascotte « bonjou » en petit, ou une ligne « 6 fraz · anviwon 6 minit »._
5. **Premier lancement sur ordinateur** (`review-byenvini-desktop-1280.png`) : la colonne de 560 px flotte au milieu, texte petit. _Suggestion : sur ≥ 1024 px, hero sur deux colonnes (texte + mascotte grande)._
6. **Trait pointillé du chemin** : Unslop #30 classe les bordures pointillées comme ornement ; ici il dessine une route, donc il peut rester comme signature, à condition de ne pas réapparaître ailleurs.

## What Works Well

- **Hiérarchie** : en gris, l'œil va d'abord à la carte « prochaine leçon » (cadre encre + ombre pressée), puis à l'objectif, puis à la révision. Une seule action primaire par écran.
- **Le créole d'abord et « Di l konsa »** : l'étiquette jaune de prononciation est reconnaissable sur toutes les vues (accueil, leçon, liste Revize) : c'est la signature du produit, tirée du domaine (Unslop principe 7).
- **Couleur avec un sens** : bleu = action, rouge = série, jaune = XP/prononciation, vert = réussi ; correct/faux toujours avec icône + texte.
- **Mascotte bien dosée** : présente au premier lancement, dans le feedback, à la fin et dans les états vides, jamais en décoration.
- **Mode sombre voulu**, pas inversé : bleu nuit, accents éclaircis, texte des boutons foncé sur bleu clair, contrastes vérifiés.
- **Robustesse** : retour Android, rechargement en pleine leçon, hors ligne, 360 → 1280 px sans débordement, 0 violation axe, `prefers-reduced-motion` respecté.
