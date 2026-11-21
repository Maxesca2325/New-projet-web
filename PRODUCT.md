# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Adultes haïtiens qui apprennent l'anglais pour leur vie réelle : travail (chantier, soins, commerce en ligne), études, voyage, démarches et vie de tous les jours. Environ la moitié vit en Haïti, sur un Android d'entrée de gamme, avec une data chère et une connexion qui coupe ; l'autre moitié vit dans la diaspora (États-Unis, Chili, Brésil), a peu de temps et veut des résultats vite. Beaucoup lisent le créole plus facilement que le français, et sont des lecteurs débutants en anglais.

## Product Purpose

Apprendre à parler anglais en 5 à 10 minutes par jour, à partir du créole. Chaque leçon donne des phrases utiles le jour même, avec la prononciation, l'audio et des exercices qui obligent à produire la réponse, puis une révision espacée pour ne pas oublier. Succès : la personne revient chaque jour (série), finit ses leçons et peut dire les phrases de sa situation.

## Positioning

Ce qu'une app générique ne peut pas copier honnêtement :
- **Tout en créole haïtien** : consignes, explications, erreurs et encouragements.
- **« Di l konsa »** : la prononciation anglaise écrite comme on la lit en créole (Thank you → Tènk yu).
- **Marche sans internet**, légère, pensée pour le petit téléphone et la data chère.

## Operating Context

Utilisée seule, sur téléphone, souvent dehors ou dans les transports, parfois sans réseau ; sessions courtes et quotidiennes. Installable comme une app (PWA). La reconnaissance vocale du navigateur demande internet (Chrome).

## Capabilities and Constraints

- App web statique (HTML, CSS, modules JS, sans build), service worker hors ligne, progrès stocké sur l'appareil, comptes optionnels (Supabase : e-mail + mot de passe) pour sauvegarder les progrès.
- Chemins : Baz + Biznis online, Etid, Vwayaj, Lavi chak jou, Konstriksyon, Swen sante ; 15 leçons, 90 phrases (anglais, créole, prononciation créole), audio ElevenLabs « Sarah ».
- Exercices : nouvelle phrase, choix, écoute, remettre les mots en ordre, écrire, parler (micro tolérant à l'accent).
- Révision espacée (Leitner), XP, objectif du jour, série, sons d'effet, vibration.
- Navigation : onglets Aprann / Revize / Pwofil, retour Android, reprise après actualisation.
- Undecided : Premium et paiement (carte + MonCash), autres langues, voix définitive.

## Brand Commitments

- Nom : **Koze** (« parler, causer » en créole). Interface en créole haïtien.
- **Police : Nunito** (sans sérif arrondie), choisie par l'utilisateur pour remplacer Bricolage + Atkinson : pas d'empattements. L'étiquette « Di l konsa » reste.
- **Aucun style « fait par une IA »** : pas de dégradés décoratifs, d'émojis en guise d'icônes, de petits titres en capitales au-dessus des titres, de grilles de chiffres décoratives.
- Logo, mascotte (trogon) et couleurs du drapeau existent mais ne sont pas obligatoires dans une refonte.
- **Look (choisi par l'utilisateur, 2026-11-21) : l'app d'apprentissage classique, au niveau de finition de Busuu / Babbel** — fond neutre, surfaces blanches, un seul bleu d'action, vert/rouge seulement pour les réponses, élévation légère. Pas de style « brutal » (bords épais, ombres dures, texte trop gros).

## Evidence on Hand

- Contenu réel : `js/data.js` (15 leçons, 90 phrases) ; audio `audio/*.mp3`.
- Mascotte trogon, 4 poses : `img/maskot*.webp` ; logo `icons/icon.svg`.
- Aucun utilisateur, témoignage, note ou chiffre d'usage : ne pas en inventer.

## Product Principles

1. Utile aujourd'hui plutôt que complet : peu de phrases, maîtrisées, tirées de la vraie vie.
2. Le créole d'abord : rien ne doit exiger de lire le français ou l'anglais pour comprendre quoi faire.
3. Encourager sans infantiliser : chaleureux et un peu joueur, respectueux d'adultes qui apprennent pour travailler.
4. Léger et fiable : chaque octet et chaque coupure réseau comptent.

## Accessibility & Inclusion

WCAG 2.1 AA ; lecteurs débutants (texte ≥ 17 px, police très lisible) ; cibles tactiles ≥ 44 px ; mode sombre ; réduction des animations respectée ; aucune information portée par la couleur seule.
