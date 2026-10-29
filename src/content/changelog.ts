/** Journal des versions, affiché dans l'app (Profil › Nouveautés). La plus récente en premier. */
export type Release = { version: string; date: string; title: string; items: string[] };

export const changelog: Release[] = [
  {
    version: '1.2.0',
    date: '2026-10-29',
    title: 'Budget, carte libre et Toulouse',
    items: [
      'Budget du séjour : entrées, repas, tickets de transport et trains, jour par jour, avec les tarifs enfants selon l’âge.',
      'Étape « Budget » à la création du séjour : les restaurants respectent votre prix par repas.',
      'Ajoutez vos billets de train et réservations, déjà payés ou à régler sur place.',
      'Applications officielles PID Lítačka (Prague) et Tisséo (Toulouse) pour acheter les billets sur le téléphone.',
      'Carte libre : glisser, pincer, double-toucher, recentrer, ma position, carte en plein écran.',
      'Ajouter une étape depuis la liste de tous les lieux, placée là où elle fait le moins de détour.',
      'Une présentation pour chaque lieu ; spécialités et histoire des restaurants.',
      'Toulouse : 29 visites, 30 pépites, 18 restaurants, la Garonne et les canaux.',
      'Âge exact des enfants dans le profil ; écran d’erreur lisible ; mise à jour annoncée dans l’app.',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-10-28',
    title: 'Séjour composé et récompenses',
    items: [
      'Assistant de création de séjour et planificateur automatique (quartiers, déjeuners, pépites, plan pluie).',
      'Journée sur la carte, ligne du jour, cocher, réordonner, passer une étape.',
      'Points, niveaux, badges et passeport des quartiers.',
      'Photos hors ligne, notification du matin, validation sur place en option.',
      'Prague complet : 40 visites, 40 pépites, 25 restaurants.',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-10-27',
    title: 'Fondations',
    items: ['Système de design, quatre onglets, thème sombre, premières fiches de Prague.'],
  },
];
