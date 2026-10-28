/**
 * État de l'application, local d'abord : tout vit sur le téléphone (AsyncStorage).
 * Aucune dépendance : un petit magasin observable lu avec useSyncExternalStore.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { getPlace, getPlaces } from '@/lib/catalog';
import { computeTimes, newStop, rainSwap } from '@/lib/planner';
import { toTime } from '@/lib/schedule';
import type { AppState, Profile, Trip, TripDay, Visit } from './types';

const KEY = 'ruella.state.v1';

export const defaultProfile: Profile = {
  travelers: [
    { id: 't1', name: 'Adulte 1', band: 'adult' },
    { id: 't2', name: 'Adulte 2', band: 'adult' },
  ],
  pace: 'equilibre',
  wishes: ['histoire', 'insolite', 'vues'],
  autoCheck: false,
  morning: true,
};

export const initialState: AppState = { version: 1, onboarded: false, profile: defaultProfile, trips: [], visits: [] };

let state: AppState = initialState;
let hydrated = false;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;

function emit() {
  for (const l of listeners) l();
}

function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, 250);
}

export function setState(update: (s: AppState) => AppState) {
  state = update(state);
  emit();
  persist();
}

export function getState(): AppState {
  return state;
}

export async function hydrate(): Promise<void> {
  if (hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as AppState;
      if (saved && saved.version === 1) state = { ...initialState, ...saved, profile: { ...defaultProfile, ...saved.profile } };
    }
  } catch {
    // Données illisibles : on repart d'un état propre plutôt que de bloquer l'app.
  }
  hydrated = true;
  emit();
}

export function isHydrated() {
  return hydrated;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useApp<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => hydrated, () => hydrated);
}

// ------------------------------------------------------------------ sélecteurs

export function activeTrip(s: AppState): Trip | undefined {
  return s.trips.find((t) => t.id === s.activeTripId) ?? s.trips[0];
}

export function todayISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Jour à afficher par défaut : aujourd'hui s'il fait partie du séjour, sinon le premier jour non terminé. */
export function defaultDayIndex(trip: Trip, today = todayISO()): number {
  const i = trip.days.findIndex((d) => d.date === today);
  if (i >= 0) return i;
  const open = trip.days.findIndex((d) => d.stops.some((s) => s.status === 'todo'));
  return open >= 0 ? open : 0;
}

// ------------------------------------------------------------------ actions

const vid = () => `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const actions = {
  finishOnboarding(profile: Partial<Profile>) {
    setState((s) => ({ ...s, onboarded: true, profile: { ...s.profile, ...profile } }));
  },
  setProfile(patch: Partial<Profile>) {
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  },
  addTrip(trip: Trip) {
    setState((s) => ({ ...s, onboarded: true, trips: [trip, ...s.trips], activeTripId: trip.id }));
  },
  deleteTrip(id: string) {
    setState((s) => {
      const trips = s.trips.filter((t) => t.id !== id);
      return { ...s, trips, activeTripId: s.activeTripId === id ? trips[0]?.id : s.activeTripId };
    });
  },
  setActiveTrip(id: string) {
    setState((s) => ({ ...s, activeTripId: id }));
  },

  /** Cocher / décocher une étape. Retourne vrai si l'étape vient d'être cochée. */
  toggleStop(tripId: string, dayIndex: number, stopId: string, auto = false): boolean {
    let checked = false;
    setState((s) => {
      const trip = s.trips.find((t) => t.id === tripId);
      const stop = trip?.days[dayIndex]?.stops.find((x) => x.id === stopId);
      if (!trip || !stop) return s;
      checked = stop.status !== 'done';
      const visits: Visit[] = checked
        ? [...s.visits, { id: vid(), placeId: stop.placeId, tripId, at: new Date().toISOString(), auto }]
        : removeLastVisit(s.visits, stop.placeId, tripId);
      return {
        ...s,
        visits,
        trips: updateDay(s.trips, tripId, dayIndex, (d) => ({
          ...d,
          stops: d.stops.map((x) => (x.id === stopId ? { ...x, status: checked ? 'done' : 'todo' } : x)),
        })),
      };
    });
    return checked;
  },

  skipStop(tripId: string, dayIndex: number, stopId: string) {
    editDay(tripId, dayIndex, (d) => ({
      ...d,
      stops: d.stops.map((x) => (x.id === stopId ? { ...x, status: x.status === 'skipped' ? 'todo' : 'skipped' } : x)),
    }));
  },

  moveStop(tripId: string, dayIndex: number, stopId: string, delta: -1 | 1) {
    editDay(tripId, dayIndex, (d) => {
      const i = d.stops.findIndex((x) => x.id === stopId);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= d.stops.length) return d;
      const stops = [...d.stops];
      [stops[i], stops[j]] = [stops[j], stops[i]];
      return { ...d, stops };
    });
  },

  /** Déplace une étape vers un autre jour du séjour. */
  moveStopToDay(tripId: string, fromDay: number, stopId: string, toDay: number) {
    setState((s) => {
      const trip = s.trips.find((t) => t.id === tripId);
      const stop = trip?.days[fromDay]?.stops.find((x) => x.id === stopId);
      if (!trip || !stop || !trip.days[toDay]) return s;
      let trips = updateDay(s.trips, tripId, fromDay, (d) => ({ ...d, stops: d.stops.filter((x) => x.id !== stopId) }));
      trips = updateDay(trips, tripId, toDay, (d) => ({ ...d, stops: [...d.stops, stop] }));
      return { ...s, trips: retime(trips, tripId, [fromDay, toDay]) };
    });
  },

  removeStop(tripId: string, dayIndex: number, stopId: string) {
    editDay(tripId, dayIndex, (d) => ({ ...d, stops: d.stops.filter((x) => x.id !== stopId) }));
  },

  addPlaceToDay(tripId: string, dayIndex: number, placeId: string) {
    editDay(tripId, dayIndex, (d) =>
      d.stops.some((x) => x.placeId === placeId) ? d : { ...d, stops: [...d.stops, newStop(placeId)] },
    );
  },

  setDayStart(tripId: string, dayIndex: number, time: string) {
    editDay(tripId, dayIndex, (d) => ({ ...d, startTime: time }));
  },

  startNow(tripId: string, dayIndex: number) {
    const now = new Date();
    actions.setDayStart(tripId, dayIndex, toTime(now.getHours() * 60 + now.getMinutes()));
  },

  rainPlan(tripId: string, dayIndex: number) {
    setState((s) => {
      const trip = s.trips.find((t) => t.id === tripId);
      if (!trip) return s;
      const taken = new Set(trip.days.flatMap((d) => d.stops.map((x) => x.placeId)));
      const places = getPlaces(trip.cityId);
      return { ...s, trips: updateDay(s.trips, tripId, dayIndex, (d) => rainSwap(d, trip.base, places, taken)) };
    });
  },

  /** Cocher un lieu hors séjour (depuis sa fiche). */
  logVisit(placeId: string, auto = false) {
    setState((s) => ({ ...s, visits: [...s.visits, { id: vid(), placeId, at: new Date().toISOString(), auto }] }));
  },
  unlogVisit(placeId: string) {
    setState((s) => ({ ...s, visits: removeLastVisit(s.visits, placeId) }));
  },

  resetAll() {
    setState(() => ({ ...initialState }));
    AsyncStorage.removeItem(KEY).catch(() => {});
  },
};

function removeLastVisit(visits: Visit[], placeId: string, tripId?: string): Visit[] {
  const idx = [...visits].reverse().findIndex((v) => v.placeId === placeId && (tripId === undefined || v.tripId === tripId));
  if (idx < 0) return visits;
  const real = visits.length - 1 - idx;
  return visits.filter((_, i) => i !== real);
}

function updateDay(trips: Trip[], tripId: string, dayIndex: number, f: (d: TripDay) => TripDay): Trip[] {
  return trips.map((t) => (t.id === tripId ? { ...t, days: t.days.map((d, i) => (i === dayIndex ? f(d) : d)) } : t));
}

function retime(trips: Trip[], tripId: string, dayIndexes: number[]): Trip[] {
  return trips.map((t) =>
    t.id === tripId
      ? { ...t, days: t.days.map((d, i) => (dayIndexes.includes(i) ? computeTimes(d, t.base, getPlace) : d)) }
      : t,
  );
}

function editDay(tripId: string, dayIndex: number, f: (d: TripDay) => TripDay) {
  setState((s) => ({ ...s, trips: retime(updateDay(s.trips, tripId, dayIndex, f), tripId, [dayIndex]) }));
}
