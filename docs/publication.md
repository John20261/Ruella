# Lot 8 · Bêta et publication

État au 28 octobre 2026 : l'application est prête pour une bêta privée Android (APK). La publication sur les stores demande des comptes payants, à ouvrir quand les premiers utilisateurs le justifient (décision du 27/10 : « ne rien payer avant d'avoir des utilisateurs »).

## Ce qui est fait

- Application complète en local : séjour composé automatiquement, journée sur carte, cocher, réordonner, plan pluie, récompenses, hors ligne, notifications du matin, confidentialité.
- Aucune clé secrète, aucun serveur obligatoire, aucune donnée personnelle collectée.
- Bêta Android : chaque envoi sur la branche `build-android` fabrique un APK (EAS, quota gratuit) ; chaque envoi sur `main` met l'app à jour à distance.
- Icône, écran de démarrage, politique de confidentialité (`docs/politique-confidentialite.md`).

## Pour publier (quand vous le décidez)

| Étape | Coût | Qui |
| --- | --- | --- |
| Compte Google Play Console | 25 $ une fois | Vous (identité du titulaire) |
| Compte Apple Developer | 99 $ par an | Vous |
| Héberger la politique de confidentialité (GitHub Pages) | gratuit | Claude |
| Captures d'écran des stores (générées depuis l'app) | gratuit | Claude |
| `eas build --profile production` puis `eas submit` | gratuit (quota) | Claude |

## Fiche store (proposition)

**Nom** : Ruella · Visites en famille

**Sous-titre** (30 car.) : Votre journée prête chaque matin

**Description courte** (80 car.) : Un parcours à pied pour votre famille, les pépites cachées et des tampons à gagner.

**Description longue** :

Ruella compose vos journées de visite en une minute : vos dates, votre famille, vos envies. Chaque matin, votre parcours est prêt, à pied, quartier par quartier, avec les déjeuners sur le chemin et les pépites que les autres ratent.

- Une carte claire de la journée, même sans réseau.
- Il pleut ? Un geste, et la journée passe à l'abri.
- Cochez chaque étape : points, niveaux, badges et un passeport de tampons par quartier.
- Pensé pour les familles : visites adaptées à l'âge des enfants.
- Respect total de la vie privée : pas de compte, pas de publicité, votre position ne quitte jamais votre téléphone.

Première ville : Prague, avec 40 visites, 40 pépites et 25 restaurants choisis à la main.

**Catégorie** : Voyages. **Classification** : tout public.

## Formulaire « Sécurité des données » (Google Play)

- Données collectées : aucune.
- Données partagées : aucune.
- Position : utilisée sur l'appareil, non collectée.
- Chiffrement en transit : sans objet (aucune donnée transmise).
- Suppression : depuis l'app (Profil › Tout effacer).

## Avant la version publique

1. Bêta familiale à Prague (vous) : noter tout ce qui gêne.
2. Vérifier les horaires et prix des 89 fiches restantes.
3. Deuxième ville (Vienne ou Budapest) pour valider la méthode de contenu.
4. Ouvrir le serveur Supabase (schéma prêt dans `supabase/migrations`) seulement pour la synchronisation multi-appareils et les achats.
