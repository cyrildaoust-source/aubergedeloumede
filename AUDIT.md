# Audit du frontend – Auberge de l'Oumède

Notation stricte sur 100, refaite à chaque passe. Références étudiées sur Mobbin : fiche hôtel
**Tripadvisor** (note + barres par critère, onglets collants, liens contact sous le titre),
fiche logement **Airbnb** (mosaïque de photos, carte de réservation collante, barre basse mobile,
« Bon à savoir » en icônes, carte « Où vous dormirez »), **KOBU** (typographie éditoriale, fond crème),
**OpenTable** (barre de recherche en une ligne dans le hero).

## Grille

| Critère | Points | Ce qui est vérifié |
|---|---|---|
| Responsive | 15 | 320, 390, 768, 1440 px sans débordement ; cibles tactiles ≥ 40 px ; barre de réservation mobile |
| Parcours client | 20 | Accueil → logement → demande en ≤ 3 clics, dates conservées d'une page à l'autre, alternatives (téléphone, e-mail, Booking) |
| Décision d'achat | 20 | Prix, photos par logement, avis et notes, comparaison, conditions, réassurance |
| UI | 15 | Cohérence, hiérarchie, typographie, qualité des images |
| UX | 15 | Filtres, galerie, formulaires et erreurs, états vides, retours visuels |
| Technique | 15 | Accessibilité (axe-core WCAG 2 AA), poids des pages, SEO, RGPD |

## Passes

| Passe | Resp. | Parcours | Décision | UI | UX | Tech. | **Total** |
|---|---|---|---|---|---|---|---|
| 1 – première version, sans photos | 10 | 15 | 10 | 10 | 11 | 12 | **68** |
| 2 – corrections de mise en page + photos Booking | 13 | 16 | 13 | 13 | 13 | 11 | **79** |
| 3 – images optimisées, polices locales, carte à la demande, lien Booking, logotype | 14 | 18 | 15 | 14 | 14 | 14 | **89** |
| 4 – visionneuse photo plein écran (flèches, clavier, glisser) | 14 | 18 | 15 | 14 | 15 | 14 | **90** |
| 5 – calendrier, version anglaise, photos des suites, texte chambre 2 | 15 | 19 | 16 | 15 | 15 | 14 | **94** |

### Corrections faites entre les passes

- Passe 1 → 2 : colonne principale des fiches sans marge sur mobile, carte de réservation qui dépassait,
  mosaïque à 4 photos avec un trou, titre d'accueil sur 5 lignes, nom de l'auberge sur 2 lignes sur mobile,
  barre mobile qui cachait le formulaire d'accueil, avis affichés avec 5 étoiles inventées (retirées :
  Booking note sur 10), contrastes et ordre des titres (axe-core : 0 erreur depuis).
- Passe 2 → 3 : photos de couverture identiques entre chambres 1/2 et 3/4 (une photo différente par carte),
  photos WebP 640 px + `srcset` et dimensions (pas de saut de mise en page), polices hébergées sur le site
  (plus d'appel à Google, RGPD), carte Google Maps chargée seulement au clic, débordement à 320 px sur la
  page contact, formulaire prêt pour un service d'envoi (Formspree…) avec repli sur la messagerie,
  lien « confirmation immédiate » vers Booking.com, logotype typographique provençal (pas de fichier logo).
- Passe 3 → 4 : la galerie s'ouvre en plein écran, une photo à la fois, avec flèches, clavier et glisser.

## Points restants (mis à jour le 19 novembre : il en reste 5,5, tous du contenu ou un choix)

| Manque | Points | Qui peut le régler |
|---|---|---|
| Aucun tarif affiché (« Tarif selon vos dates ») | −3 | L'Auberge : remplir `content/tarifs.json` |
| Pas de disponibilité en temps réel (demande par e-mail) | −1 | Choix d'un moteur de réservation ou d'un service de formulaire |
| ~~Pas de version anglaise~~ : fait (19 novembre), 14 pages dans `en/`, bascule FR/EN | ✓ | |
| ~~Suite de L'Oumède sans photo propre~~ : 7 photos Booking « Suite avec Terrasse » | ✓ | |
| Chambres 1 et 2 : texte propre fait ; photos encore communes | −0,5 | Photos de la chambre 2 |
| Photos de chambres en 723–1086 px (établissement passé en 2250–3000 px) | −0,5 | Originaux en haute définition |
| Menu du petit-déjeuner (prix fait : 28 €) | −0,5 | Carte à fournir |
| ~~Champs de date natifs~~ : calendrier sur mesure fait | ✓ | |

## Vérifications automatiques

- `axe-core` (WCAG 2 A/AA + bonnes pratiques) sur 7 pages, à 1440 et 390 px : 0 violation.
- Aucun débordement horizontal à 320, 390, 768 et 1440 px.
- Parcours testé : dates sur l'accueil → formulaire pré-rempli avec le nombre de nuits ; filtres
  chambres ; menu mobile (Échap) ; galerie (flèches) ; barre mobile masquée tant que le formulaire est visible.
