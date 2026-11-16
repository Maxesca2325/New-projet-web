# Design Brief : Koze — apprendre l'anglais en créole

## Problem

Un Haïtien qui veut parler anglais (pour un travail sur un chantier ou à l'hôpital, pour ses études, pour voyager, pour son petit business en ligne) n'a aucune application qui lui parle dans **sa** langue. Duolingo et les autres partent du français ou de l'anglais : il apprend une langue étrangère à travers une deuxième langue qu'il maîtrise mal. Les leçons parlent de « la pomme est rouge », pas de ce qu'il devra dire demain matin à son chef de chantier ou à un patient.

En Haïti, son téléphone est un Android bon marché, la data est chère et coupe souvent. Dans la diaspora (États-Unis, Chili, Brésil), il a moins de temps qu'il n'en faudrait et a besoin de résultats vite. Dans les deux cas, il abandonne si l'app est lourde, ennuyeuse ou s'il ne voit pas de progrès concret.

## Solution

Koze est un petit prof dans la poche qui parle créole. En 30 secondes l'utilisateur dit pourquoi il apprend et ce qu'il fait dans la vie ; Koze lui trace un chemin de leçons tirées de **ses** situations réelles. Chaque leçon dure 5 à 10 minutes : une scène, quelques phrases utiles le jour même, une prononciation écrite comme on la lit en créole (« Tènk yu »), des exercices qui obligent à produire la réponse, et une révision qui revient au bon moment. L'app marche sans internet et se sent chaleureuse : on a envie de revenir demain pour ne pas casser sa série.

## Experience Principles

1. **Utile aujourd'hui plutôt que complet** — chaque leçon annonce ce que l'utilisateur saura dire en sortant, et chaque phrase sert dans sa vie réelle. On préfère 6 phrases maîtrisées à 30 survolées.
2. **Le créole d'abord, l'anglais ensuite** — toutes les consignes, aides et erreurs sont en créole simple ; l'anglais est toujours accompagné de sa prononciation en lettres créoles et de son audio.
3. **Encourager sans infantiliser** — le ton est celui d'un bon prof haïtien : chaleureux, motivant, un peu joueur (mascotte, célébrations), mais jamais gamin. Les adultes qui apprennent pour le travail doivent se sentir respectés.

## Aesthetic Direction

- **Philosophy** : « Tap-tap » = base **Scandinavian** (chaleur + retenue, lisible, coins arrondis constants, accessible par défaut) avec des accents **Neo-Memphis** limités à trois endroits : la bande tap-tap (bleu, rouge, jaune, vert), la mascotte (le trogon d'Hispaniola, oiseau national) et les moments de victoire (fin de leçon, objectif atteint, série).
- **Tone** : chaleureux et motivant, avec une touche de jeu (mélange « bon prof » et « Duolingo »), sans perdre le sérieux d'un outil pour le travail.
- **Reference points** : Duolingo (boucle de motivation, séries, célébrations), Busuu (leçons par situation), Karto (sobriété, gros boutons, créole d'abord).
- **Anti-references** : clichés touristiques d'Haïti (palmiers, plages), sites « générés par IA » (dégradés violets, émojis comme icônes, cartes à grosses ombres partout), apps scolaires austères, tableaux de bord chargés.

## Existing Patterns

App web statique (HTML + CSS + modules JS, PWA hors ligne), v0.2 déjà en place.

- **Typography** : Bricolage Grotesque (titres, variable 200–800), Atkinson Hyperlegible 400/700 (texte) ; auto-hébergées dans `fonts/`.
- **Colors** : tokens dans `styles.css` `:root` — `--paper`, `--surface`, `--ink`, `--ink-2`, `--line`, `--blue` (#0b2bb8), `--red` (#d21034), `--sun`, `--leaf`, `--ok`, `--bad` + versions `-soft` ; thème sombre complet (`prefers-color-scheme` + `[data-theme]`).
- **Spacing** : pas d'échelle formalisée (valeurs en px au cas par cas) → à normaliser en phase tokens.
- **Radius** : `--r-sm` 10, `--r-md` 14, `--r-lg` 20.
- **Components** : écrans rendus en template strings dans `js/app.js` ; icônes Lucide via sprite (`js/icons.js`) ; mascotte `img/maskot.webp` ; logo SVG inline.

## Component Inventory

| Component | Status | Notes |
| --- | --- | --- |
| Wordmark + logo bulle | Exists | SVG inline, couleurs du drapeau |
| Bande tap-tap | Exists | Seulement accueil + carte « prochaine leçon » |
| Mascotte trogon | Modify | Une seule pose ; ajouter des poses (contente, réfléchit, encourage après erreur) |
| Bouton (primary / secondary / ghost / danger) | Exists | Uniformiser hauteurs (≥ 48 px) |
| Choix d'onboarding (carte sélectionnable) | Exists | |
| Barre de progression | Exists | |
| Puces série / XP | Exists | |
| Carte « prochaine leçon » | Exists | |
| Bandeau révision | Exists | |
| Chemin de leçons (track) | Modify | Rendre la progression plus visible (nœuds, % du chemin) |
| Carte phrase (EN + « Di l konsa » + KR) | Exists | |
| Options QCM | Exists | |
| Tuiles de mots (ordre) | Exists | |
| Champ de saisie | Exists | |
| Bouton micro | Exists | |
| Feuille de feedback | Modify | Ajouter la mascotte + vibration légère, son court optionnel |
| Écran fin de leçon | Modify | Célébration (animation courte), objectif du jour, série |
| Feuille de confirmation | Exists | |
| Toast | Exists | |
| Écran « Premium » | New | Hors périmètre v0.3 (voir Out of Scope) |
| Indicateur hors ligne | New | Petit état quand l'app est sans réseau |

## Key Interactions

- **Onboarding** : 4 questions, une par écran, sélection en un tap, bouton « Kontinye » activé seulement si la réponse est valide ; on peut revenir en arrière ; à la fin, toast « Chemen ou pare! » et accueil.
- **Démarrer** : un seul gros bouton « Kòmanse leson an » sur la carte prochaine leçon ; la révision s'affiche au-dessus quand des phrases sont dues.
- **Exercice** : sélection → bouton « Tcheke » s'active → feuille de feedback (vert/rouge) qui montre la bonne réponse, la prononciation et le bouton audio → « Kontinye ». Une phrase ratée revient en fin de leçon.
- **Audio** : lecture automatique à l'apparition d'une nouvelle phrase, bouton normal + bouton lent (escargot).
- **Micro** : appui → état « écoute » (pulsation rouge) → résultat ; on peut toujours passer sans pénalité.
- **Quitter** : la croix ouvre une feuille de confirmation dans l'app (jamais la boîte native).
- **Fin de leçon** : mascotte + XP, précision, série ; message qui reprend l'objectif de la leçon.

## Responsive Behavior

- Conçu à 360–375 px d'abord (Android d'entrée de gamme), colonne unique, max 560 px centrée sur tablette/desktop.
- Boutons d'action collés en bas (zone du pouce) pendant les leçons et l'onboarding.
- Sur grand écran rien ne change de comportement : même colonne, plus d'air autour.
- Respect des safe areas (encoche, barre système).

## Accessibility Requirements

- Contraste texte ≥ 4.5:1 (≥ 3:1 pour les gros titres et les icônes) dans les deux thèmes.
- Cibles tactiles ≥ 44 × 44 px ; texte de base ≥ 16 px (17 px actuellement).
- Navigation clavier complète : 1–4 pour les choix, Entrée pour Tcheke/Kontinye, focus visible.
- Les états correct/incorrect ne reposent pas que sur la couleur (icône + texte).
- `aria-live` sur le feedback, `aria-pressed` sur les choix, labels sur les boutons icône.
- `prefers-reduced-motion` coupe toutes les animations.
- Polices lisibles pour lecteurs débutants (Atkinson Hyperlegible).

## Out of Scope

- Comptes, synchronisation, paiement (Premium, MonCash) et publicité.
- Conversation avec IA (jeu de rôle patron/client/patient).
- Nouvelles langues (espagnol, portugais, français) et nouveau contenu de leçons.
- Audio naturel enregistré (on garde la voix du téléphone en v0.3).
- Notifications push / rappels quotidiens.
