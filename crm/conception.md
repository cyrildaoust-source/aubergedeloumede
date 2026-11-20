# CRM « Caisse » de l'Auberge de l'Oumède : proposition de conception

Nov 19, 2026 · @Cyril d'Aoust

Je propose de coder une « caisse » maison, privée, sur `gestion.aubergedeloumede.com`, faite pour une seule personne : Carla, qui s'occupe de la réception, du ménage et de la relation client. L'outil suit chaque client de la réservation au départ et se synchronise avec Booking.com, Airbnb et les autres plateformes pour qu'une chambre ne soit jamais réservée deux fois. L'Auberge est une maison familiale : l'outil reste simple, mais fait les choses bien.

## Objectifs

1. **Chouchouter chaque client** : savoir avant son arrivée qui il est, ce qu'il aime, s'il est déjà venu, et ce qu'il a demandé.
2. **Tout noter au même endroit** : heure d'arrivée et de départ, petit-déjeuners servis, minibar, activités, ménage fait, draps changés.
3. **Encaisser sans oubli** : une note par séjour (comme une addition au restaurant) qui additionne la chambre et tous les extras, puis se règle au départ ou en ligne.
4. **Vendre plus, sans forcer** : proposer petit-déjeuner, activités avec les partenaires locaux, arrivée anticipée ou départ tardif au bon moment.
5. **Maximiser la data** : un tableau de bord avec taux d'occupation, revenu par chambre, part des extras, clients récurrents et provenance des réservations.

L'outil est pensé pour 7 logements et une seule utilisatrice. Il doit lui faire gagner du temps : chaque action se fait en une ou deux tapes depuis son téléphone, sinon il ne sera pas utilisé.

## Fonctionnalités

Sept modules, du plus utile au quotidien au plus stratégique. Le module 7 se nourrit automatiquement des six autres.

| Module | Ce que ça fait |
| --- | --- |
| 1. Planning et séjours | Vue des 7 logements jour par jour, arrivées et départs du jour, heure d'arrivée prévue et réelle, heure de départ, nombre de personnes, plateforme d'origine. Les réservations Booking.com, Airbnb et autres arrivent toutes seules, et une réservation faite ici ferme la chambre partout (voir « Synchronisation des plateformes »). |
| 2. Fiche client | Coordonnées, langue, pays, nombre de séjours, total dépensé, préférences (oreiller, allergies, chambre préférée, heure du petit-déj), occasions (anniversaire, lune de miel), notes libres, badge « client récurrent ». |
| 3. Note du séjour (la caisse) | Chaque séjour a une note : nuits + taxe de séjour + petits-déjeuners + minibar + activités + extras. Ajout d'une ligne en 2 tapes depuis un catalogue. Acomptes, remises, paiement par carte (lien Stripe ou terminal) et espèces. Facture PDF au départ. |
| 4. Petit-déjeuner et minibar | Liste du matin : qui prend le petit-déj, pour combien, à quelle heure, allergies. Relevé du minibar pendant le ménage, ajouté directement à la note. |
| 5. Ménage, sur téléphone | Une carte par chambre : à faire, propre. Cases « draps changés » et « serviettes changées », enregistrées avec l'heure. Note ou photo si quelque chose est à réparer. |
| 6. Activités et upsells | Catalogue des partenaires locaux avec prix client et commission, suivi de ce qui a été proposé, accepté ou refusé. |
| 7. Tableau de bord | « Bonjour Carla » en haut, puis taux d'occupation, prix moyen par nuit, part des extras, upsells acceptés, clients récurrents, commissions payées aux plateformes contre réservations directes. |

Un seul compte, administrateur, celui de Carla : pas de gestion de rôles ni d'équipe. Cyril garde un accès technique pour l'entretien de l'outil. Un **journal** garde l'historique des modifications, utile en cas de litige avec un client.

## Modèle de données

Le séjour est le cœur du modèle : tout ce qui se passe (repas, minibar, ménage, paiement) est rattaché à un séjour, lui-même rattaché à un client et à un logement. C'est ce qui permet ensuite de tout croiser dans le tableau de bord.

| Table | Champs principaux | Reliée à |
| --- | --- | --- |
| `clients` | nom, prénom, e-mail, téléphone, pays, langue, date de naissance (facultatif), préférences, allergies, notes, consentement marketing, date de création | séjours |
| `logements` | les 7 logements : nom, catégorie, capacité, prix de base (repris de `content/chambres.json`) | séjours, ménage |
| `sejours` | client, logement, dates d'arrivée et de départ, heure d'arrivée prévue et réelle, heure de départ, adultes, enfants, plateforme (site, Booking, Airbnb, téléphone, direct…), référence de la plateforme, statut (option, confirmé, arrivé, parti, annulé), prix des nuits, commission | client, logement |
| `accompagnants` | les autres personnes du séjour (nom, âge si enfant) | séjour |
| `catalogue` | ce qui se vend : petit-déjeuner, articles du minibar, activités, extras (arrivée anticipée, bouteille en chambre…) avec prix, TVA, coût, partenaire | partenaires |
| `lignes_note` | ce qui a été consommé : article, quantité, prix appliqué, date, ajouté par | séjour, catalogue |
| `paiements` | montant, moyen (carte, espèces, virement, Booking), acompte ou solde, référence Stripe, date | séjour |
| `menages` | date, type (recouche, départ), statut, draps changés, serviettes changées, heure, remarque, photo | logement, séjour |
| `partenaires` | nom, activité, contact, commission ou prix négocié | catalogue |
| `propositions` | chaque upsell proposé : article, canal (e-mail, sur place, page de réservation), proposé le, accepté ou refusé | séjour, catalogue |
| `utilisateurs` | Carla (administratrice) et l'accès technique de Cyril | journal |
| `journal` | qui a modifié quoi et quand | toutes |

Trois indicateurs se calculent directement depuis ces tables : un client est **récurrent** dès son deuxième séjour, le **prix payé** d'un séjour est la somme de ses paiements, et le **revenu des extras** est la somme des lignes de note hors nuits.

## Écrans

Sept écrans suffisent pour la première version, tous utilisables sur téléphone. L'outil s'installe comme une application sur l'écran d'accueil du téléphone de Carla, sans passer par l'App Store. Il reprend la direction artistique du site (papier crème, titres en italique, tons olive).

1. **Aujourd'hui** (page d'accueil) : « Bonjour Carla », puis les arrivées et départs du jour avec l'heure, les chambres à nettoyer, les petits-déjeuners du matin, les activités réservées et les notes non réglées. Les occasions spéciales remontent en haut (« anniversaire de Mme Martin demain »).
2. **Planning** : une ligne par logement, une colonne par jour, chaque séjour en barre colorée selon sa plateforme. Toucher un jour libre pour créer une réservation.
3. **Fiche séjour** : en-tête client, dates et heures, puis la note avec ses lignes, les paiements et le reste à payer. Boutons rapides : « arrivé », « parti », « + petit-déj », « + minibar », « + activité », « encaisser ».
4. **Fiche client** : historique de tous ses séjours, total dépensé, préférences, notes, ce qu'il a accepté ou refusé par le passé.
5. **Chambres** (le ménage en un coup d'œil) : 7 cartes avec leur statut, une tape pour « propre », cases « draps » et « serviettes », relevé du minibar, note ou photo d'un problème.
6. **Catalogue et partenaires** : petit-déjeuner, minibar, activités, prix et commissions.
7. **Tableau de bord** : indicateurs du mois et de l'année, comparaison avec l'an dernier, upsells qui marchent, clients récurrents.

Une maquette cliquable de ces écrans peut être la prochaine étape, avant d'écrire le code.

## Stack technique

Je recommande **Next.js + Supabase + Stripe**, hébergé sur un sous-domaine privé `gestion.aubergedeloumede.com`. Ce sont des outils très répandus, faciles à reprendre par un autre développeur, et peu coûteux à cette taille.

&#91;embedded content: architecture de la caisse · 3 sources, 3 services\]

Les trois sources de réservation alimentent la même base ; l'équipe et Cyril y accèdent chacun avec leurs droits.

| Brique | Choix | Pourquoi |
| --- | --- | --- |
| Application | Next.js (React), en application installable sur téléphone (PWA) | Un seul code pour l'ordinateur et le téléphone de Carla |
| Base de données | Supabase (Postgres), hébergé en Europe | Données clients en UE pour le RGPD, connexion par lien e-mail, stockage des photos de signalement, règles d'accès par rôle |
| Paiements | Stripe | Liens de paiement pour l'acompte, terminal de paiement sur place possible, rapprochement automatique avec la note |
| E-mails | Resend ou Brevo | Confirmations et séquence d'avant-séjour (traitée dans un autre fil) |
| Hébergement | Vercel ou Cloudflare | Sous-domaine privé, sauvegardes de la base chaque jour |

**Sous-domaine plutôt que `/gestion`** : c'est le même nom de domaine, mais l'outil privé reste séparé du site public. Une panne ou une mise à jour de l'un ne touche pas l'autre, et le site public peut rester entièrement statique et rapide.

Coût de fonctionnement : de gratuit à quelques dizaines d'euros par mois selon les offres choisies, hors frais Stripe par transaction (chiffres approximatifs, à vérifier au moment de souscrire).

## Fait maison ou logiciel existant

Les logiciels hôteliers (PMS) savent très bien gérer les disponibilités, mais aucun ne donne la liberté voulue sur les upsells, les activités partenaires et la data. La meilleure option est donc **hybride** : la caisse maison pour la relation client et les extras, branchée sur un channel manager qui garde les disponibilités à jour sur toutes les plateformes.

| Option | Points forts | Limites pour l'Oumède |
| --- | --- | --- |
| Caisse maison (cette proposition) | Fait exactement ce que Cyril décrit, aux couleurs du site, data complète et à vous, pas d'abonnement par chambre | À construire et à maintenir ; a besoin d'un channel manager pour les plateformes |
| Amenitiz | Tout-en-un pensé pour petits hôtels et maisons d'hôtes, site, moteur de réservation et channel manager | Upsells et données limités à ce que l'outil prévoit ; le site maison ferait doublon |
| Thais (français) | PMS français avec moteur de réservation et channel manager, factures aux normes françaises | Interface plus administrative, peu de suivi relation client |
| Little Hotelier, Sirvoy | Simples, pensés pour moins de 20 chambres, channel manager inclus | Fiche client et upsells basiques |
| Cloudbeds, Mews | Très complets, place de marché d'applications, API ouvertes | Dimensionnés pour plus grand, plus chers, prise en main plus longue |
| CRM générique (HubSpot…) | Très fort pour les e-mails et le suivi commercial | Ne connaît ni les chambres, ni les nuits, ni le ménage |

Ces descriptions viennent de ma connaissance générale des produits, pas d'une recherche à jour : les tarifs et fonctions exacts sont à vérifier avant de choisir. Le choix dépend surtout de l'outil de réservation actuel (question ouverte ci-dessous) : s'il a une API, la caisse peut le lire directement au lieu de passer par iCal.

## Synchronisation des plateformes

Pour ne jamais réserver deux fois la même chambre, je recommande un **channel manager avec API** : il parle à Booking.com, Airbnb et les autres, et la caisse lui parle. Booking.com et Airbnb n'ouvrent leur API qu'à des partenaires certifiés, pas à un établissement seul : on ne peut pas s'y brancher en direct.

| Option | Comment ça marche | Risque de double réservation | Pour l'Oumède |
| --- | --- | --- | --- |
| Calendriers iCal | Chaque plateforme publie un lien de calendrier que les autres relisent, gratuit | Réel : mise à jour toutes les 30 minutes à quelques heures selon la plateforme | Acceptable pour démarrer avec 2 plateformes, pas au-delà |
| Channel manager avec API (Beds24, Channex, Smoobu…) | Il pousse les disponibilités et les prix sur chaque plateforme en quelques secondes ; la caisse lit et écrit les réservations par son API | Très faible | **Recommandé** : abonnement mensuel modeste à 7 chambres, à vérifier |
| API directe Booking ou Airbnb | Réservée aux éditeurs de logiciels certifiés | — | Pas accessible |

Le choix exact du channel manager attend la liste des plateformes où l'Auberge est en ligne (question pour Carla ci-dessous). Si elle en utilise déjà un, la caisse se branchera dessus.

## Plan par étapes

Chaque étape est utilisable seule, pour que l'équipe s'en serve dès la première.

1. **Maquette cliquable** des écrans aux couleurs du site, pour valider l'ergonomie avant de coder.
2. **Socle** : connexion privée de Carla, clients, logements, séjours, planning, écran « Aujourd'hui », branchement du channel manager (Booking, Airbnb…).
3. **Terrain** : écran Chambres sur téléphone (ménage, draps, serviettes, signalements), liste du petit-déjeuner, relevé du minibar.
4. **Caisse** : catalogue, note du séjour, paiements Stripe et espèces, facture PDF.
5. **Upsells** : partenaires et activités, formule « une activité par matin », suivi des propositions, lien avec le petit-déjeuner proposé à la réservation sur le site.
6. **Tableau de bord** : indicateurs, clients récurrents, comparaison d'une année sur l'autre.

## Questions pour Carla

Ces réponses décident du channel manager, de la caisse et de l'ordre des étapes. À transmettre telles quelles ; « je ne sais pas » est une réponse utile aussi.

**Réservations et plateformes**

- [ ] Sur quelles plateformes l'Auberge est-elle en ligne : Booking.com, Airbnb, Expedia, Abritel, Google, autres ?
- [ ] Utilisez-vous déjà un logiciel pour bloquer les dates partout (Smoobu, Beds24, Amenitiz, Lodgify…) ? Si oui, lequel ?
- [ ] Avez-vous déjà eu une double réservation ?
- [ ] Où notez-vous aujourd'hui les réservations prises par téléphone ou e-mail : cahier, Excel, agenda ?
- [ ] À peu près, quelle part des réservations vient de chaque plateforme, et quelle part en direct ?

**Paiements**

- [ ] Comment les clients paient-ils : via Booking ou Airbnb, virement, carte sur place (quel terminal ?), espèces ?
- [ ] Demandez-vous un acompte pour les réservations directes ? Quelles conditions d'annulation ?
- [ ] Quel est le montant de la taxe de séjour, et qui la déclare à la mairie ?
- [ ] Comment faites-vous les factures aujourd'hui, et avec quel comptable ou logiciel ?

**Le séjour**

- [ ] Heures d'arrivée et de départ habituelles ? Arrivée tôt ou départ tardif possibles, et à quel prix ?
- [ ] Petit-déjeuner : prix, horaires, en terrasse ou en chambre, combien de temps à l'avance faut-il prévenir ?
- [ ] Minibar : que contient-il, et à quel prix ?
- [ ] Ménage pendant le séjour : tous les jours ou tous les combien ? Draps et serviettes changés à quelle fréquence ?
- [ ] Qu'aimeriez-vous savoir d'un client avant son arrivée ?

**Clients et activités**

- [ ] Existe-t-il une trace des anciens clients : export Booking, carnet, boîte e-mail ?
- [ ] Quelles activités recommandez-vous déjà aux clients (bateau, domaines viticoles, plages, restaurants) ? Certaines avec un accord ou une commission ?
- [ ] Qu'est-ce qui vous prend le plus de temps aujourd'hui dans la relation avec les clients ?

**Votre outil**

- [ ] Votre téléphone est-il un iPhone ou un Android ?
- [ ] Pour la réception, préférez-vous travailler sur ordinateur, tablette ou téléphone ?
