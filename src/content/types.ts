/**
 * Modèle d'une fiche Ruella (étape 4 validée).
 * Le catalogue est écrit ici, vérifié par `validatePlace`, puis publié en fichiers (pack ville).
 */

export type PlaceKind = 'monument' | 'museum' | 'gem' | 'restaurant' | 'viewpoint' | 'district';

export type Wish =
  | 'histoire'
  | 'insolite'
  | 'art'
  | 'gourmand'
  | 'vues'
  | 'nature'
  | 'photo'
  | 'cinema'
  | 'architecture'
  | 'shopping'
  | 'musique'
  | 'enfants';

export type AgeBand = 'under8' | '8-12' | '13-17' | 'adult';

export type Photo = {
  url: string;
  author: string;
  license: string;
  sourceUrl: string;
};

export type Verification = {
  /** `verified` : horaires, prix et position contrôlés sur au moins une source officielle. */
  status: 'verified' | 'to_verify';
  date?: string; // AAAA-MM-JJ
  sources: string[];
};

export type Place = {
  id: string;
  cityId: string;
  kind: PlaceKind;
  name: string;
  localName?: string;
  /** Accroche : une phrase, 120 caractères maximum. */
  hook: string;
  /** « Pourquoi c'est canon » : obligatoire pour une pépite. */
  why?: string;
  tip?: string;
  story?: string;
  howToFind?: string;
  bestMoment?: string;
  address?: string;
  lat: number;
  lng: number;
  /** Position contrôlée sur une carte de référence (sinon : approximative). */
  coordsVerified: boolean;
  /** Rayon de la zone où cocher rapporte des points. */
  radiusM: number;
  indoor: boolean;
  ages: AgeBand[];
  wishes: Wish[];
  durationMin: number;
  hours?: string;
  prices?: string;
  /** Restaurants : niveau de prix. */
  priceLevel?: '€' | '€–€€' | '€€' | '€€€';
  order?: string;
  ticketUrl?: string;
  mustSee?: boolean;
  photo?: Photo;
  verification: Verification;
  status: 'draft' | 'review' | 'published';
};

export type City = {
  id: string;
  name: string;
  country: string;
  timezone: string;
  currency: string;
  /** Rectangle de la ville : toute fiche doit être dedans. */
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  hidden?: boolean;
};
