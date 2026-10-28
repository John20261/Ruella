import type { AgeBand, Wish } from '@/content/types';
import type { Leg, LatLng } from '@/lib/geo';

export type Pace = 'calme' | 'equilibre' | 'intense';

export type Traveler = { id: string; name: string; band: AgeBand };

export type Profile = {
  travelers: Traveler[];
  pace: Pace;
  wishes: Wish[];
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
