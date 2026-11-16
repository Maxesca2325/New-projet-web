# Build Tasks : Koze v0.3

Generated from: .design/koze/DESIGN_BRIEF.md (+ INFORMATION_ARCHITECTURE.md, tokens.css)
Date: 2026-11-16 — tâches 1 à 13 faites le même jour (test Playwright du parcours complet + axe-core : 0 violation à 360/768/1280 px, clair et sombre).

Stack : HTML + CSS + modules JS sans build (PWA). Écrans en template strings dans `js/app.js`, icônes Lucide (`js/icons.js`), tokens dans `tokens.css`. Pas de tests unitaires : chaque tâche se vérifie avec le test navigateur Playwright (parcours onboarding → leçon complète) + captures 375 px clair/sombre.

## Foundation

- [x] **Migrer les composants vers les tokens** : remplacer dans `styles.css` les valeurs en px (espaces, tailles de texte, rayons, ombres, durées) par les tokens (`--space-*`, `--font-size-*`, `--shadow-*`, `--duration-*`), boutons à `--button-height` ; aucun changement visuel voulu sauf alignements plus réguliers. Direction : **Tap-tap** (base Scandinavian + accents Neo-Memphis). _Modifies : tous les composants existants. Reuses : tokens.css._
- [x] **Routeur par hash + bouton retour Android** : chaque vue a son adresse (`#byenvini`, `#kesyon-N`, `#aprann`, `#revize`, `#pwofil`, `#leson-<id>`, `#revizyon`) ; le retour système revient à la vue précédente ; en leçon/révision il ouvre la feuille « Ou vle kite? » ; recharger en pleine leçon ramène à `#aprann` ; une leçon verrouillée ouverte par lien redirige vers `#aprann`. _New : routeur. Reuses : feuille de confirmation. Risque le plus élevé → en premier._
- [x] **Barre d'onglets du bas (Aprann · Revize · Pwofil)** : barre fixe 64 px avec icônes + libellés, onglet actif en bleu, pastille du nombre de phrases dues sur Revize, safe area du bas respectée, cachée en leçon/révision/onboarding. _New component. Depends on : Routeur._

## Core UI

- [x] **Vue Revize** : en haut le bouton « Revize kounye a » avec le nombre de phrases dues (ou état vide avec la mascotte, « Anyen pou revize jodi a » + date de la prochaine révision) ; puis 3 compteurs (nouvelles, en cours, metrize) ; puis la liste des phrases apprises groupées par leçon (groupes repliables), chaque phrase avec EN, Di l konsa, KR, bouton audio et niveau. _New view. Reuses : carte phrase (version compacte), étiquettes EN/KR, Di l konsa. Depends on : Barre d'onglets._
- [x] **Vue Aprann (accueil) réorganisée** : en-tête (logo, série, XP) → carte prochaine leçon → objectif du jour → bandeau révision (lien vers Revize) → chemin ; chaque groupe du chemin affiche sa progression (« 1/2 ») et se replie quand il est fini. _Modifies : accueil, track. Depends on : Barre d'onglets._
- [x] **Vue Pwofil dans les onglets** : même contenu, en-tête « Pwofil », plus de bouton retour (c'est un onglet). _Modifies : écran profil._
- [x] **Poses de la mascotte (ai33)** : générer 3 poses cohérentes avec `img/maskot.webp` (contente/célèbre, réfléchit/encourage après une erreur, dort pour l'état vide) avec gpt-image-2 en référence de la mascotte existante ; détourer, optimiser en WebP ≤ 40 Ko chacune. _New assets. Reuses : scripts/image_ai33.mjs._

## Interactions & States

- [x] **Feedback avec mascotte** : la feuille de feedback montre la petite mascotte (contente si juste, encourage si faux), animation d'entrée `--duration-normal`, vibration courte (`navigator.vibrate`) si disponible. Covers : juste, presque juste (faute de frappe), faux, micro réussi. _Modifies : feuille de feedback. Depends on : Poses de la mascotte._
- [x] **Célébration de fin de leçon** : mascotte contente qui « saute » (`--easing-bounce`), compteur XP qui monte, bande tap-tap animée, message spécial si l'objectif du jour est atteint ou si la série augmente. Covers : leçon finie, révision finie, objectif atteint, nouvelle série. _Modifies : écran de fin._
- [x] **Indicateur hors ligne** : petite pastille dans l'en-tête « San entènèt — Koze ap mache kanmenm » quand `navigator.onLine` est faux ; disparaît au retour du réseau. Covers : en ligne, hors ligne, retour en ligne. _New component._
- [x] **États vides et erreurs** : Revize sans phrase (avant la 1re leçon), toutes les leçons finies, voix indisponible, micro refusé — chacun avec un texte créole clair et une action. _Modifies : Revize, Aprann, exercice Parler._

## Responsive & Polish

- [x] **Vérification 360 / 375 / 768 / 1280 px** : une seule colonne ≤ 560 px centrée, barre d'onglets centrée sur grand écran, aucun débordement horizontal, safe areas. Breakpoints : sm, md, xl.
- [x] **Accessibilité** : contrastes du DESIGN_TOKENS respectés, cibles ≥ 44 px, `aria-current` sur l'onglet actif, `aria-live` sur le feedback, focus visible et restitué après la feuille de confirmation, états correct/faux avec icône + texte, `prefers-reduced-motion`, ordre de tabulation logique, navigation clavier 1–4 / Entrée.

## Review

- [ ] **Design review** : lancer `/design-review` contre le brief (captures dans `.design/koze/screenshots/`), puis passe « Unslop design » (AgentAlley) pour traquer ce qui fait « généré par IA ».
