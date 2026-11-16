# Information Architecture : Koze

App à une seule page (PWA, `index.html`) ; chaque vue a une adresse dans le hash pour que le bouton « retour » d'Android et l'historique fonctionnent.

## Site Map

- Accueil premier lancement `#byenvini` (seulement si aucun profil)
  - Questions d'onboarding `#kesyon-1` … `#kesyon-4`
- **Aprann** (onglet 1, vue par défaut) `#aprann`
  - Leçon en cours `#leson-<id>` (ex. `#leson-sante-1`)
    - Fin de leçon (même adresse, état final)
- **Revize** (onglet 2) `#revize`
  - Session de révision `#revizyon`
    - Fin de révision (même adresse, état final)
- **Pwofil** (onglet 3) `#pwofil`
  - Changer de chemin `#kesyon-2` (réutilise l'onboarding, profil pré-rempli)
  - Changer toutes les préférences `#kesyon-1`

## Navigation Model

- **Primary navigation** : barre d'onglets fixée en bas, 3 éléments — Aprann (icône livre/chemin), Revize (icône cerveau + pastille du nombre de phrases dues), Pwofil (icône personne). Visible sur les 3 vues principales uniquement.
- **Secondary navigation** : aucune. Les leçons s'ouvrent depuis le chemin (Aprann) ; la révision depuis Revize ou le bandeau de rappel sur Aprann.
- **Utility navigation** : dans Pwofil (préférences, effacer la progression). En-tête des vues principales : logo à gauche, série et XP à droite.
- **Mobile navigation** : la barre du bas *est* la navigation mobile. Pendant une leçon, une révision ou l'onboarding, la barre disparaît (mode concentration) ; la croix en haut à gauche et le bouton retour système ouvrent la feuille « Ou vle kite? ».
- **Profondeur max** : 2 niveaux (onglet → leçon).

## Content Hierarchy

### Aprann (80 % du temps hors leçon)
1. **Carte « prochaine leçon »** avec un gros bouton — c'est l'action du jour.
2. **Objectif du jour** (barre XP) — motive à finir la journée.
3. **Bandeau révision** (si des phrases sont dues) — rappel discret, l'action complète est dans Revize.
4. **Chemin** : groupes par activité (Baz d'abord, puis les activités choisies), progression de chaque groupe (ex. 1/2).
5. Pied : nom de l'app.

### Leçon (où l'utilisateur passe le plus de temps)
1. **La phrase ou la question** — grand, centré sur la tâche.
2. **Les choix / la saisie** — dans la zone du pouce.
3. **Bouton Tcheke / feuille de feedback** — collé en bas.
4. Barre de progression + croix — en haut, petits.

### Revize
1. **Bouton « Revize kounye a »** avec le nombre de phrases dues (ou message « Anyen pou revize jodi a » + prochaine date).
2. **Force de la mémoire** : compte des phrases par niveau (nouvelles, en cours, maîtrisées).
3. **Liste de toutes les phrases apprises** groupées par leçon, chacune avec audio et niveau — sert d'aide-mémoire hors ligne.

### Pwofil
1. **Statistiques** : série, XP total, phrases maîtrisées, leçons finies.
2. **Mon parcours** : chemins, niveau, minutes par jour + boutons de modification.
3. **Infos appareil** : voix et micro disponibles ou non.
4. Effacer la progression (bas de page, discret).

### Byenvini (premier lancement)
1. Promesse (« Pale anglè. Aprann li an kreyòl. ») + mascotte.
2. Exemple vivant d'une phrase (EN + Di l konsa + KR + audio).
3. 3 bénéfices.
4. Bouton « Kòmanse, se gratis ».

## User Flows

### Premier lancement
1. L'utilisateur ouvre le lien → `#byenvini`.
2. Il écoute l'exemple (optionnel) et touche « Kòmanse ».
3. 4 questions (`#kesyon-1..4`) ; « retour » revient à la question précédente.
   - Objectif choisi = etid / vwayaj / biznis / lavi → l'activité correspondante est pré-cochée à la question 2.
   - Niveau « Mwen konn baz la » → les leçons Baz sont toutes ouvertes et les leçons d'activité aussi.
4. Toast « Chemen ou pare! » → `#aprann`.

### Leçon du jour
1. `#aprann` → touche « Kòmanse leson an » → `#leson-<id>`.
2. Situation → nouvelles phrases → exercices → micro (si disponible).
   - Réponse fausse → feedback rouge, la phrase revient en fin de leçon.
   - « Retour » système ou croix → feuille « Ou vle kite? » → Non : reste ; Wi : `#aprann` sans enregistrer.
3. Fin de leçon : XP, précision, série → « Kontinye » → `#aprann` (la leçon suivante est débloquée).

### Révision
1. Bandeau sur Aprann ou onglet Revize (pastille) → « Revize kounye a » → `#revizyon`.
2. Jusqu'à 12 phrases dues, exercices adaptés à leur niveau.
3. Fin → `#revize` avec les compteurs mis à jour.

### Changer d'activités
1. `#pwofil` → « Chanje chemen » → `#kesyon-2` (cases déjà cochées).
2. Valide → les questions suivantes → `#aprann`, progression conservée.

## Naming Conventions

| Concept | Label in UI | Notes |
| --- | --- | --- |
| Onglet des leçons | **Aprann** | Verbe, court |
| Onglet de révision | **Revize** | Verbe, cohérent avec Aprann |
| Onglet profil | **Pwofil** | |
| Activité choisie (biznis, sante…) | **chemen** | « Chemen ou » = le parcours personnel |
| Leçon | **leson** | |
| Phrase apprise | **fraz** | Jamais « mo » (on apprend des phrases entières) |
| Prononciation écrite en créole | **Di l konsa** | Étiquette jaune, toujours la même |
| Langue de la phrase | **EN / KR** | Étiquettes bleue / rouge |
| Jours d'affilée | **seri** (« jou youn dèyè lòt » en détail) | |
| Points | **XP** | Terme connu des joueurs |
| Phrase maîtrisée | **metrize** | Boîte de révision ≥ 3 |
| Vérifier une réponse | **Tcheke** | |
| Passer à la suite | **Kontinye** | |

## Component Reuse Map

| Component | Used on | Behavior differences |
| --- | --- | --- |
| En-tête (logo + série + XP) | Aprann, Revize, Pwofil | Titre de la vue à la place du logo sur Revize et Pwofil |
| Barre d'onglets du bas | Aprann, Revize, Pwofil | Cachée en leçon, révision, onboarding |
| Cadre de session (croix + progression + pied collant) | Leçon, Révision, Onboarding | Onboarding : flèche retour au lieu de la croix |
| Carte phrase | Leçon (intro, parler), liste Revize | Liste : version compacte |
| Feuille de feedback | Leçon, Révision | — |
| Feuille de confirmation | Quitter une session, Effacer la progression | Bouton rouge pour l'effacement |
| Écran de fin | Leçon, Révision | Message différent |
| Mascotte | Byenvini, fin de session, Revize vide | Poses différentes à terme |

## Content Growth Plan

- **Leçons** : vont passer de 15 à ~70 (10 par activité). Le chemin reste groupé par activité ; chaque groupe se replie quand il est fini (« 10/10 ✓ ») pour garder la carte « prochaine leçon » en haut.
- **Phrases apprises** (Revize) : peuvent dépasser 500 → groupées par leçon, groupes repliés par défaut, recherche texte à ajouter au-delà de 200 phrases.
- **Nouvelles langues** (plus tard) : un sélecteur de langue dans Pwofil ; l'adresse des leçons gardera l'identifiant unique (`#leson-es-sante-1`).

## URL Strategy

- Pattern : `#<vue>` ou `#<vue>-<id>` (lettres, chiffres, tirets ; pas de `/`).
- Dynamic segments : identifiant de leçon (`#leson-konstriksyon-2`), numéro de question (`#kesyon-3`).
- Query parameters : aucun en usage normal (`?debug` réservé aux tests).
- Ouvrir directement `#leson-x` d'une leçon verrouillée → redirige vers `#aprann`.
- Recharger la page en pleine leçon ou révision → on revient **au même exercice** (progression, erreurs et XP gardés, sauvegarde en `sessionStorage`). Quitter l'app (fermer l'onglet ou l'app installée) ou répondre « Wi, kite » efface la sauvegarde : la leçon recommence à zéro.
