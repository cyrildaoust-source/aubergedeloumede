# CRM « Caisse » de l'Auberge de l'Oumède

Outil privé de gestion pour Carla (réception, suivi des clients, ménage), prévu sur le sous-domaine `gestion.aubergedeloumede.com`.

**Statut : maquette.** Rien ici n'est branché à une base de données ni aux plateformes de réservation. Toutes les données (clients, séjours, montants) sont fictives.

## Contenu

- [`caisse-oumede.html`](caisse-oumede.html) : maquette cliquable en un seul fichier, à ouvrir dans un navigateur. Écrans : Aujourd'hui, Planning, Fiche séjour, Chambres, Parcours client, Clients, Catalogue, Statistiques. Utilisable sur téléphone.
- [`conception.md`](conception.md) : document de conception (modules, stack technique proposée, synchronisation Booking / Airbnb via un channel manager, plan de travail, questions pour Carla).

## Prochaines étapes

Le document de conception liste les questions à poser à Carla (plateformes utilisées, paiements et acomptes, historique clients, partenaires d'activités, téléphone). Les réponses conditionnent le choix du channel manager et le développement réel.
