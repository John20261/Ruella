# Ruella

Votre journée dans la ville, prête chaque matin, avec les secrets que les autres ratent.

Application iPhone et Android (Expo SDK 58, React Native). La conception complète (étapes 1 à 7, toutes validées) est dans le cahier de conception « Ruella — Cahier de conception ».

## Avancement

| Lot | Contenu | État |
| --- | --- | --- |
| 0 | Fondations : système de design, 4 onglets, thèmes, schéma Supabase, tests | Fait |
| 1 | Contenu de Prague (40 visites, 40 pépites, 25 restaurants) et espace éditeur | Fait (vérification des horaires en cours : 16/105) |
| 2 | La journée : carte légère sans tuiles, ligne du jour, cocher, réordonner, transports | Fait |
| 3 | Hors ligne : fiches, carte et planificateur embarqués, photos enregistrables | Fait |
| 4 | Création du séjour : assistant en 5 étapes et planificateur (zones, repas, pépites, pluie) | Fait |
| 5 | Récompenses : points, niveaux, 11 badges, passeport de 15 quartiers | Fait |
| 6 | Compte local, export et effacement des données, confidentialité | Fait (compte en ligne et achats : quand il y aura des utilisateurs) |
| 7 | Finitions : icône, animations, retours haptiques, accessibilité | Fait |
| 8 | Bêta Android (APK) ; dossier de publication dans `docs/publication.md` | Bêta prête, stores en attente de vos comptes |
| 11 | Dix capitales européennes (Paris, Londres, Rome, Madrid, Lisbonne, Berlin, Amsterdam, Bruxelles, Vienne, Budapest) — version 1.3.0 | Fait (prix estimés) |
| 10 | Budget sur place (entrées, repas, transports, trains), carte manipulable, ajout d'étapes, présentations de tous les lieux | Fait |
| 9 | Deuxième ville : Toulouse (29 visites, 30 pépites, 18 restaurants, Garonne et canaux) | Fait (9 fiches vérifiées sur sites officiels) |

## Organisation du code

```
src/app/            écrans (Expo Router) : Journée, Séjours, Récompenses, Profil, assistant, fiche, éditeur
src/components/     carte légère (city-map), ligne du jour, célébrations, système de design (ui/)
src/content/        catalogue des villes, quartiers, fond de carte OpenStreetMap
src/store/          état local (AsyncStorage) : profil, séjours, visites
src/theme/          couleurs, arrondis, polices ; thème sombre par défaut
src/lib/            logique testée : planificateur, récompenses, géographie, horaires, hors ligne
tools/              collectes automatiques (positions, photos, fond de carte) via GitHub Actions
supabase/migrations schéma de base de données et règles de sécurité (RLS)
```

## Commandes

```bash
npm install
npm start          # serveur de développement
npm run check      # typage + lint + tests (obligatoire avant chaque livraison)
```

## Démo sur téléphone

L'Expo Go des stores ne suit pas le SDK 58 : on teste avec une vraie application Android fabriquée par Expo.

1. Envoyer `main` sur la branche `build-android` fabrique l'APK (`.eas/workflows/build-android.yml`), à installer depuis expo.dev.
2. Chaque envoi sur `main` publie une mise à jour (`.eas/workflows/preview.yml`) reçue automatiquement par cette application (canal `preview`).

## Règles

- Aucune couleur en dur : tout vient de `src/theme/tokens.ts`.
- Aucune clé secrète dans l'app ; seules l'URL Supabase et la clé publique `anon` (variables `EXPO_PUBLIC_…`).
- Aucune position GPS envoyée au serveur : seulement des preuves de visite.
- `npm run check` doit passer avant tout envoi.
