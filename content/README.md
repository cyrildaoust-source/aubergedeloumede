# Contenu du site – Auberge de l'Oumède

Ce dossier contient tout le contenu de l'ancien site (aubergedeloumede.com), récupéré depuis
la Wayback Machine (capture du 10 juin 2026, et du 20 juillet 2026 pour certaines chambres)
et complété avec la fiche Booking.com (consultée le 18 novembre 2026).

Le contenu est séparé du design : le futur front end (HTML/CSS codé à la main) lira ces
fichiers, ou les recopiera directement dans les pages.

| Fichier | Contenu |
|---|---|
| `site.json` | Nom, accroche, textes d'accueil, coordonnées, situation, temps de trajet, pied de page |
| `chambres.json` | Les 7 logements : description, surface, lits, équipements, photos |
| `services.json` | Petit-déjeuner, piscine, jardins, points forts |
| `decouvrir.json` | Pampelonne, marché, randonnées, lieux à proximité |
| `avis.json` | Notes Booking et témoignages clients |
| `infos-pratiques.json` | Horaires d'arrivée et de départ, règles de la maison |
| `photos.json` | Index des 45 photos du dépôt (venues de Booking) et inventaire des photos de l'ancien site |

## Les 7 logements

| Logement | Surface | Couchage | Type Booking |
|---|---|---|---|
| Chambre 1 – Double Standard | 28 m² | Lit 180 | Chambre Double Standard |
| Chambre 2 – Double Standard | 28 m² | Lit 160 | Chambre Double Standard |
| Chambre 3 – Double Supérieure / Triple | 35 m² | Lit 180 + lit 90 | Chambre Triple |
| Chambre 4 – Double Supérieure | 30 m² | Lit 180 | Chambre Double Supérieure |
| Studio | 25 m² | Lit 160, cuisine équipée | Studio |
| Suite Junior | 40 m² | Lit 160 + canapé-lit 140, kitchenette | Suite Junior - Vue sur Jardin |
| Suite de L'Oumède | 57 m², jusqu'à 4 pers. | Lit 160 + canapé-lit 160, cuisine équipée | Suite avec Terrasse |

## Ce qui a été laissé de côté

L'ancien WordPress utilisait le thème « CozyStay ». Plusieurs pages étaient encore les pages
de démonstration du thème (« About the hotel », « Local activities », blog, restaurant, boutique…)
avec du faux texte : elles n'ont pas été reprises.

## Points à compléter ou vérifier

- **Tarifs** : aucun prix n'était affiché sur le site.
- **Version anglaise** : le site avait un bouton EN/FR, mais aucune page anglaise n'a été archivée.
- **Photos** : les 45 photos de la fiche Booking sont dans `assets/photos/booking/`, rangées par type de
  chambre Booking. Les photos de l'ancien site n'ont jamais été archivées par la Wayback Machine : celles
  qui n'étaient pas aussi sur Booking (piscine, jardins, plage, marché, randonnée, logo) sont perdues.
  Booking ne classe pas les Chambres 1 et 2 séparément, et n'a aucune photo de la Suite de L'Oumède
  et une seule de la Suite Junior. Le logo est aussi à fournir.
- **Menu et prix du petit-déjeuner** : à intégrer plus tard, quand ils seront disponibles.
- **Avis** : deux fautes de frappe ont été corrigées dans l'avis de Patrick (« spacieuse », « propriétaires »).
- **Ville** : Booking indique Saint-Tropez, l'ancien site indique Ramatuelle 83350. Le contenu garde Ramatuelle.
