/**
 * Modèle d'une fiche Ruella (étape 4 validée).
 * Le catalogue est écrit ici, vérifié par `validatePlace`, puis publié en fichiers (pack ville).
 */

export type PlaceKind = 'monument' | 'museum' | 'gem' | 'restaurant' | 'viewpoint' | 'district' | 'park';

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

export type Currency = 'CZK' | 'EUR' | 'GBP' | 'HUF';

/** Prix d'entrée par personne. */
export type Cost = {
  currency: Currency;
  /** Plein tarif adulte (0 = gratuit). */
  adult: number;
  /** Tarif enfant ou réduit (par défaut : plein tarif). */
  child?: number;
  /** Gratuit avant cet âge (par défaut 6 ans). */
  freeUnder?: number;
  /** Tarif enfant jusqu'à cet âge inclus (par défaut 17 ans). */
  childUntil?: number;
  /** Billet commun à plusieurs lieux : compté une seule fois par séjour. */
  group?: string;
  /** Prix estimé, non relu sur une source officielle. */
  estimate?: boolean;
};

/** Prix moyen d'un repas par personne (plat + boisson). */
export type Meal = { currency: Currency; adult: number; child?: number; estimate?: boolean };

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
  /** « C'est quoi ? » : présentation du lieu (spécialités et histoire pour un restaurant). */
  about?: string;
  cost?: Cost;
  meal?: Meal;
  howToFind?: string;
  bestMoment?: string;
  address?: string;
  lat: number;
  lng: number;
  /** Position contrôlée sur une carte de référence (sinon : approximative). */
  coordsVerified: boolean;
  /** Source de la position contrôlée (OpenStreetMap ou Wikidata). */
  geoSource?: string;
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
  currency: Currency;
  /** Rectangle de la ville : toute fiche doit être dedans. */
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  /** Centre historique : point de départ par défaut et centrage de la carte. */
  center?: { lat: number; lng: number };
  transit?: Transit;
  hidden?: boolean;
};

/** Transports en commun d'une ville. */
export type Transit = {
  network: string;
  currency: Currency;
  /** Trajet simple (avec correspondances). */
  single: { label: string; adult: number; child?: number; childFrom?: number; childUntil?: number };
  /** Pass illimité 24 h. */
  day: { label: string; adult: number; child?: number };
  /** Gratuit avant cet âge. */
  freeUnder: number;
  howToBuy: string;
  /** Applications officielles conseillées (billets sur le téléphone, horaires). */
  apps: TransitApp[];
  tips: string[];
  source: string;
  verifiedAt?: string;
  /** Tarifs estimés, non relus sur la page officielle. */
  estimate?: boolean;
};

export type TransitApp = {
  name: string;
  /** Ce qu'elle permet, en une phrase. */
  what: string;
  ios: string;
  android: string;
  /** Achat des billets dans l'application. */
  tickets: boolean;
};
