# Audit UI – Auberge de l'Oumède (19 novembre 2026)

Passe complète sur les 8 gabarits (accueil, chambres, fiche logement, suite sans photo, services, Saint-Tropez & alentours, contact, mentions légales), en 1440, 900 et 390 px. Accessibilité vérifiée avec axe-core sur chaque page et sur le calendrier ouvert : 0 erreur.

## Note : 95/100 (avant cette passe : 84/100)

| Critère | Note | Commentaire |
|---|---|---|
| Typographie | 19/20 | Titres équilibrés sur toutes les largeurs, chiffres alignés, plus de mot orphelin en fin de ligne. |
| Grille et alignements | 19/20 | Rail des logements réparé sur mobile, distances sur deux colonnes dans les fiches, FAQ en deux colonnes. |
| Composants | 20/20 | Calendrier compact, option petit-déjeuner, pictogrammes à la même taille par contexte. |
| Cohérence de la DA | 19/20 | Pictogrammes de Cyril partout, tableau comparatif aux couleurs sable au lieu du noir. |
| Contenu visuel | 18/20 | Limité par les photos (voir plus bas), pas par le code. |

## Corrigé dans cette passe

1. Titre de l'accueil : il coupait « le / calme absolu » ; les titres sont maintenant équilibrés partout (ordinateur, tablette, mobile).
2. Chiffres en style ancien (7, 9,4, 8,9) qui sautaient sur la ligne : passés en chiffres alignés.
3. Rail des 7 logements sur mobile : la première carte était écrasée à 45 px de large. Réparé.
4. Bandeau des points forts : le premier sous-titre passait sur deux lignes et décalait les quatre blocs. Raccourci.
5. Icônes « En amoureux / En famille / Longs séjours » trop petites et en terre cuite : passées en olive, taille alignée sur le texte.
6. Bon à savoir : pictogrammes agrandis ; la FAQ occupait 60 % de la largeur avec un grand vide à droite. Elle passe en deux colonnes avec une ligne de contact.
7. Fiche logement : la carte était un rectangle étroit de 880 px de haut à côté des distances. Carte au format 16/9 et distances sur deux colonnes en dessous.
8. Tableau comparatif : en-tête noir très lourd, « Selon dates » coupé sur deux lignes. En-tête sable, tarif sur une ligne, noms des logements en Cormorant.
9. Liens « Comparer les 7 logements » qui menaient à une page sans comparatif : ils ouvrent directement le tableau.
10. Services : le texte « menu et tarif bientôt publiés » contredisait le tarif de 28 € affiché juste au-dessus. Corrigé.
11. Contact : icônes de tailles différentes qui décalaient les textes ; dates côte à côte sur mobile ; option petit-déjeuner sans vignette sur petit écran pour laisser respirer le texte.
12. Bande crème sous le pied de page sur tablette et mobile : supprimée.

## Points restants appliqués (19 novembre, après-midi)

- Photos HD : les 45 photos ont été retéléchargées depuis Booking à la plus grande taille disponible. 10 photos de l'établissement passent de 1150 à 2250-3000 px (piscine, jardin, salon). Les 35 autres sont déjà à la taille maximale que Booking conserve (723 à 1086 px) : seuls tes originaux feront mieux.
- Suite de L'Oumède : 7 photos propres (salon, chambre, cuisine, salles de bains), tirées du type Booking « Suite avec Terrasse ».
- Suite Junior : passe de 1 à 8 photos.
- Chambre 4 : 9 nouvelles photos récentes en 2250 × 3000 px, et elle ne partage plus ses photos avec la Chambre 3.

## Ce qui dépend encore de toi

- Chambre 2 : Booking la range avec la Chambre 1 (« Double Standard ») sans photos à part. Il faut des photos à toi.
- Tarif par logement : il manque la grille « à partir de » par logement ; le site l'affiche dès qu'elle est saisie dans content/tarifs.json.
- Originaux HD des photos de chambres (723 à 1086 px sur Booking).
