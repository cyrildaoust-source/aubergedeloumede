# Informations à fournir – Auberge de l'Oumède

Ce qu'il manque pour finir le site. Envoyez-les dans la conversation du projet ; chaque ligne indique où l'information sera saisie.
Dernière mise à jour : 20 novembre 2026.

## 1. Tarifs par logement (le plus important)

Le site affiche aujourd'hui « Dès 370 € » pour tout et « Tarif selon dates » sur chaque logement.
Un prix « à partir de » par nuit suffit (basse saison), et si possible le prix en haute saison.

| Logement | À partir de (€ / nuit) | Haute saison (€ / nuit) |
|---|---|---|
| Chambre 1 – Double Standard | | |
| Chambre 2 – Double Standard | | |
| Chambre 3 – Double Supérieure / Triple | | |
| Chambre 4 – Double Supérieure | | |
| Studio | | |
| Suite Junior | | |
| Suite de L'Oumède | | |

Saisie : `content/tarifs.json` → `chambres.<logement>.a_partir_de`.

## 2. Photos

- **Chambre 2** : aucune photo à elle (Booking la range avec la Chambre 1). Il en faut au moins 4 : chambre, salle de bains, terrasse, vue.
- **Originaux en haute définition** des photos de chambres : celles de Booking font 723 à 1086 px de large et sont un peu floues en plein écran. Idéalement 2000 px ou plus.
- Facultatif : vérifier que les photos de Booking « Chambre Double Supérieure » (lit avec fauteuil en cuir et miroir) sont bien celles de la **Chambre 4**.

Saisie : `assets/photos/` puis `content/chambres.json` → `photos`.

## 3. Petit-déjeuner

- La carte : ce qui est servi (boissons, viennoiseries, produits locaux…).
- Les horaires de service.

Saisie : `content/tarifs.json` → `petit_dejeuner.menu` et `petit_dejeuner.horaires`.

## 4. Réservation

- **Disponibilités en ligne** : aujourd'hui le formulaire prépare un e-mail. Choisir entre garder ce fonctionnement, un service d'envoi de formulaire (Formspree ou équivalent) ou un moteur de réservation relié à un calendrier.
- **Conditions d'annulation** : le site dit « précisées avec notre réponse ». Si elles sont fixes, les donner pour les afficher.
- **Moyens de paiement** : le site dit « règlement sur place en espèces ». À confirmer ou compléter (carte, virement, acompte).

## 5. Mentions légales (obligatoire avant la mise en ligne)

- Raison sociale et forme de l'entreprise
- Numéro SIRET
- Directeur ou directrice de la publication
- Hébergeur du site (nom, adresse)

Saisie : page `mentions-legales.html` (dans `build/build.mjs`).

## 6. Version anglaise

- Faire relire les textes anglais par quelqu'un dont c'est la langue maternelle si possible (`content/en.json`).
