# Ruella

Votre journée dans la ville, prête chaque matin, avec les secrets que les autres ratent.

Application iPhone et Android (Expo SDK 58, React Native). La conception complète (étapes 1 à 7, toutes validées) est dans le cahier de conception « Ruella — Cahier de conception ».

## Avancement

| Lot | Contenu | État |
| --- | --- | --- |
| 0 | Fondations : système de design, 4 onglets, thèmes, schéma Supabase, tests | En cours de démo |
| 1 | Contenu de Prague et page Éditeur | À venir |
| 2 | La journée (carte, ligne du jour, cocher) | À venir |
| 3 | Hors ligne | À venir |
| 4 | Création du séjour | À venir |
| 5 | Récompenses | À venir |
| 6 | Compte, achats, confidentialité | À venir |
| 7 | Finitions | À venir |
| 8 | Bêta et publication | À venir |

## Organisation du code

```
src/app/            écrans (Expo Router) : index = Journée, sejours, recompenses, profil
src/components/ui/  composants du système de design (texte, bouton, verre, tuile, tampon…)
src/theme/          couleurs, arrondis, polices ; thème sombre par défaut
src/lib/            logique métier testée (recalage des horaires…), client Supabase
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
