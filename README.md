# Auberge de l'Oumède – site web

Site statique codé à la main (HTML, CSS, JavaScript sans dépendance). Aucun WordPress, aucune base de données :
les pages HTML à la racine se déposent telles quelles chez n'importe quel hébergeur.

## Structure

| Dossier / fichier | Rôle |
|---|---|
| `content/*.json` | Tout le texte du site (chambres, services, avis, infos pratiques, tarifs) |
| `build/build.mjs` | Génère les pages HTML à partir de `content/` |
| `build/images.py` | Génère les versions légères des photos (`assets/img/`) |
| `assets/css/style.css`, `assets/js/main.js` | Style et comportements |
| `assets/photos/` | Photos d'origine |
| `index.html`, `chambres.html`, `chambres/*.html`, `services.html`, `ramatuelle.html`, `contact.html` | Pages générées |

## Modifier le contenu

1. Modifier le fichier voulu dans `content/` (par exemple un prix dans `content/tarifs.json`).
2. Si des photos ont été ajoutées : `python3 build/images.py`
3. Regénérer les pages : `node build/build.mjs`

## À compléter

- `content/tarifs.json` : prix « à partir de » par logement, menu, prix et horaires du petit-déjeuner.
- `content/site.json` : ajouter `"formulaire_endpoint"` (Formspree ou équivalent) pour recevoir les demandes
  sans passer par la messagerie du visiteur.
- `mentions-legales.html` : raison sociale, SIRET, directeur de la publication, hébergeur (dans `build/build.mjs`).
- Photos de la Suite de L'Oumède et de la chambre 2 ; version anglaise.

Voir `AUDIT.md` pour la notation détaillée.
