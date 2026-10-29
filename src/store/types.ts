import type { AgeBand, Wish } from '@/content/types';
import type { Leg, LatLng } from '@/lib/geo';

export type Pace = 'calme' | 'equilibre' | 'intense';

export type Traveler = { id: string; name: string; band: AgeBand; /** Âge exact (enfants) : sert au calcul des tarifs. */ age?: number };

/** Budget repas par adulte et par repas. */
export type MealBudget = 'serre' | 'malin' | 'large' | 'libre';

export type ExpenseCategory = 'train' | 'reservation' | 'transport' | 'autre';

/** Dépense saisie à la main (billet de train, réservation…), en euros. */
export type Expense = {
  id: string;
  label: string;
  amountEUR: number;
  category: ExpenseCategory;
  /** Déjà payé avant le départ (sinon : à prévoir sur place). */
  paid: boolean;
  date?: string;
};

export type Profile = {
  travelers: Traveler[];
  pace: Pace;
  wishes: Wish[];
  mealBudget?: MealBudget;
  /** Validation automatique quand on arrive sur le lieu (désactivée par défaut). */
  autoCheck: boolean;
  /** Notification du matin avec le programme du jour. */
  morning: boolean;
};

export type StopStatus = 'todo' | 'done' | 'skipped';

export type Stop = {
  id: string;
  placeId: string;
  /** Heure d'arrivée prévue, recalculée à chaque changement. */
  time: string;
  status: StopStatus;
  /** Trajet depuis l'étape précédente (ou le point de départ). */
  leg?: Leg;
};

export type TripDay = {
  date: string; // AAAA-MM-JJ
  title: string;
  startTime: string; // HH:MM
  rain: boolean;
  stops: Stop[];
};

export type Base = LatLng & { name: string };

export type Trip = {
  id: string;
  cityId: string;
  createdAt: string;
  base: Base;
  days: TripDay[];
  mealBudget?: MealBudget;
  expenses?: Expense[];
};

export type Visit = {
  id: string;
  placeId: string;
  tripId?: string;
  at: string; // ISO
  /** Validée automatiquement par la position (bonus). */
  auto: boolean;
};

export type AppState = {
  version: 1;
  onboarded: boolean;
  profile: Profile;
  trips: Trip[];
  activeTripId?: string;
  visits: Visit[];
};
