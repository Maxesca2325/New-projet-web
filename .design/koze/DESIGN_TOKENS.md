# Design Tokens : Koze

Fichier source : `tokens.css` (chargé avant `styles.css`). Philosophie : **Tap-tap** = base Scandinavian + accents Neo-Memphis (voir le brief).

## Choix et écarts

- **Format** : CSS custom properties (projet HTML/CSS sans build). Noms sémantiques (`--color-bg-primary`, `--space-4`…) conformes au skill.
- **Étendre, pas remplacer** : les anciens noms courts de `styles.css` (`--paper`, `--ink`, `--blue`…) sont gardés comme alias vers les tokens sémantiques. La migration des composants vers les noms sémantiques et vers l'échelle d'espacement se fait en phase 6.
- **Couleurs de marque** : bleu et rouge du drapeau haïtien (#0b2bb8, #d21034), jaune et vert des tap-tap. Le bleu est le seul accent d'action ; rouge, jaune et vert sont réservés à la bande tap-tap, aux icônes de chemin, à la série (rouge) et à l'XP (jaune).
- **Jaune** : `--color-brand-sun` (#f2a900) n'atteint que 2:1 sur blanc → uniquement en aplat (bande, étiquette « Di l konsa »). Pour une icône jaune sur fond clair, utiliser `--color-brand-sun-icon` (#a87400, 4.1:1).
- **Ombres** : pas de flou. Des « bords pressés » durs (0 3–5 px 0), comme de la peinture de tap-tap et des boutons qu'on enfonce. En sombre, ombres noires transparentes.
- **Mode sombre** : bleu nuit froid (#090d22), texte blanc cassé (#e8ebfa), accents éclaircis pour garder le contraste ; texte sur bouton bleu = bleu très foncé (#070b20) au lieu de blanc.
- **Mouvement** : `--easing-bounce` réservé aux moments de victoire ; `prefers-reduced-motion` met toutes les durées à 0.
- **Typographie** : une seule famille, **Nunito** variable (200–1000), sans empattements (choix de l'utilisateur). Graisses montées d'un cran (texte 500, gras 800, titres 850, hero 900) car Nunito paraît fine sur petit écran. Base 17 px, texte secondaire ≥ 16 px.

## Contrastes vérifiés (WCAG)

| Paire | Clair | Sombre |
| --- | --- | --- |
| Texte principal / fond | 16.5 | 16.2 |
| Texte secondaire / fond | 6.4 | 8.7 |
| Texte secondaire / carte | 7.0 | 7.8 |
| Texte tertiaire / carte (≥ 3) | 3.7 | 4.2 |
| Texte sur bouton bleu | 10.2 | 6.9 |
| Lien / fond | 9.3 | 8.0 |
| Succès / fond succès | 4.7 | 8.6 |
| Erreur / fond erreur | 5.5 | 6.5 |
| Avertissement / fond | 5.2 | 9.1 |
| « Di l konsa » (encre / jaune pâle) | 7.2 | 10.2 |
| Icône jaune / blanc (≥ 3) | 4.1 | 11.2 |

## Échelles

- **Espacement** (base 4 px) : 0 · 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 192 · 256 (`--space-0` → `--space-12`).
- **Texte** : 13 · 15 · 17 · 19 · 22 · 26 · 30 · 34 · hero 38–50.
- **Rayons** : 10 · 14 · 20 · 28 · pilule.
- **Composants** : cible tactile 44, bouton 52/56, barre d'onglets 64, icônes 16/20/28/44.
- **Durées** : 50 · 150 · 250 · 400 · 600 ms.
