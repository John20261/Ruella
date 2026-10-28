/**
 * Planificateur de séjour (lot 4) : transforme le catalogue d'une ville et les envies de la famille
 * en journées ordonnées, avec repas et pépites sur le chemin. Fonctions pures, testées.
 */
import { dayTitle } from '@/content/districts';
import type { AgeBand, Place, Wish } from '@/content/types';
import { centroid, distanceM, leg, type LatLng } from '@/lib/geo';
import { toMinutes, toTime } from '@/lib/schedule';
import type { Base, Pace, Stop, TripDay } from '@/store/types';

export type PlanInput = {
  places: Place[];
  cityId: string;
  startDate: string; // AAAA-MM-JJ
  days: number;
  startTime: string;
  pace: Pace;
  wishes: Wish[];
  ages: AgeBand[];
  base: Base;
  /** Index des journées annoncées pluvieuses : priorité à l'intérieur. */
  rainDays?: number[];
  /** Lieux déjà faits : on ne les repropose pas. */
  exclude?: string[];
};

/** Minutes d'activité visées par jour (visites + trajets), hors repas. */
export const PACE_BUDGET: Record<Pace, number> = { calme: 330, equilibre: 420, intense: 510 };
const PACE_GEMS: Record<Pace, number> = { calme: 3, equilibre: 5, intense: 7 };
const LUNCH_AT = 12 * 60 + 15;
const GEM_DETOUR_M = 450;

const isVisit = (p: Place) => p.kind !== 'gem' && p.kind !== 'restaurant';

let counter = 0;
const stopId = () => `s${Date.now().toString(36)}${(counter++).toString(36)}`;

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Intérêt d'un lieu pour cette famille. */
export function score(p: Place, wishes: Wish[], ages: AgeBand[]): number {
  let s = 1;
  if (p.mustSee) s += 5;
  for (const w of p.wishes) if (wishes.includes(w)) s += 2;
  const kids = ages.some((a) => a === 'under8' || a === '8-12');
  if (kids && p.wishes.includes('enfants')) s += 2;
  if (ages.length && !ages.some((a) => p.ages.includes(a))) s -= 6;
  if (p.durationMin > 180) s -= 2; // une demi-journée : seulement si l'envie est forte
  return s;
}

function suitable(p: Place, ages: AgeBand[]): boolean {
  // Lieu déconseillé à l'un des voyageurs (ex. musée pour ados avec un enfant de 8 ans) : on l'écarte.
  return ages.length === 0 || ages.every((a) => p.ages.includes(a) || (a === 'under8' && p.ages.includes('8-12')));
}

/** Regroupe les lieux en `k` zones compactes de tailles proches (k-moyennes avec capacité). */
export function cluster<T extends LatLng>(items: T[], k: number): T[][] {
  if (k <= 1 || items.length <= k) return k <= 1 ? [items] : items.map((i) => [i]).concat(Array.from({ length: Math.max(0, k - items.length) }, () => []));
  // Graines : points les plus éloignés les uns des autres.
  const seeds: LatLng[] = [items[0]];
  while (seeds.length < k) {
    let best = items[0];
    let bestD = -1;
    for (const it of items) {
      const d = Math.min(...seeds.map((s) => distanceM(s, it)));
      if (d > bestD) {
        bestD = d;
        best = it;
      }
    }
    seeds.push(best);
  }
  let centers = seeds.map((s) => ({ lat: s.lat, lng: s.lng }));
  const cap = Math.ceil(items.length / k) + 1;
  let groups: T[][] = [];
  for (let iter = 0; iter < 8; iter++) {
    groups = centers.map(() => []);
    // Attribution gloutonne par distance croissante, en respectant la capacité.
    const pairs: { i: number; c: number; d: number }[] = [];
    items.forEach((it, i) => centers.forEach((c, ci) => pairs.push({ i, c: ci, d: distanceM(c, it) })));
    pairs.sort((a, b) => a.d - b.d);
    const done = new Set<number>();
    for (const { i, c } of pairs) {
      if (done.has(i) || groups[c].length >= cap) continue;
      groups[c].push(items[i]);
      done.add(i);
    }
    centers = groups.map((g, gi) =>
      g.length ? { lat: g.reduce((s, p) => s + p.lat, 0) / g.length, lng: g.reduce((s, p) => s + p.lng, 0) / g.length } : centers[gi],
    );
  }
  return groups;
}

/** Ordre de visite : plus proche voisin depuis le départ, puis amélioration 2-opt. */
export function orderRoute<T extends LatLng>(start: LatLng, items: T[]): T[] {
  const rest = [...items];
  const route: T[] = [];
  let cur: LatLng = start;
  while (rest.length) {
    let bi = 0;
    for (let i = 1; i < rest.length; i++) if (distanceM(cur, rest[i]) < distanceM(cur, rest[bi])) bi = i;
    cur = rest[bi];
    route.push(rest.splice(bi, 1)[0]);
  }
  const pt = (i: number) => (i < 0 ? start : route[i]);
  let improved = true;
  for (let guard = 0; improved && guard < 50; guard++) {
    improved = false;
    for (let i = 0; i < route.length - 1; i++) {
      for (let j = i + 1; j < route.length; j++) {
        const before = distanceM(pt(i - 1), route[i]) + (j + 1 < route.length ? distanceM(route[j], route[j + 1]) : 0);
        const after = distanceM(pt(i - 1), route[j]) + (j + 1 < route.length ? distanceM(route[i], route[j + 1]) : 0);
        if (after + 1 < before) {
          route.splice(i, j - i + 1, ...route.slice(i, j + 1).reverse());
          improved = true;
        }
      }
    }
  }
  return route;
}

/** Recalcule trajets et heures d'arrivée d'une journée (après ajout, déplacement ou étape passée). */
export function computeTimes(day: TripDay, base: LatLng, lookup: (id: string) => Place | undefined): TripDay {
  let t = toMinutes(day.startTime);
  let pos: LatLng = base;
  const stops = day.stops.map((s) => {
    const p = lookup(s.placeId);
    if (!p || s.status === 'skipped') return { ...s, leg: undefined };
    const l = leg(pos, p);
    t += l.minutes;
    const out: Stop = { ...s, leg: l, time: toTime(t) };
    t += p.durationMin;
    pos = p;
    return out;
  });
  return { ...day, stops };
}

/** Heure de fin estimée d'une journée. */
export function dayEnd(day: TripDay, lookup: (id: string) => Place | undefined): string {
  const last = [...day.stops].reverse().find((s) => s.status !== 'skipped');
  if (!last) return day.startTime;
  return toTime(toMinutes(last.time) + (lookup(last.placeId)?.durationMin ?? 0));
}

function nearest(p: LatLng, list: Place[], used: Set<string>, filter: (x: Place) => boolean = () => true): Place | undefined {
  let best: Place | undefined;
  for (const x of list) {
    if (used.has(x.id) || !filter(x)) continue;
    if (!best || distanceM(p, x) < distanceM(p, best)) best = x;
  }
  return best;
}

/** Place les pépites qui ne font presque pas de détour sur le trajet de la journée. */
function weaveGems(route: Place[], base: LatLng, gems: Place[], used: Set<string>, max: number): Place[] {
  const out = [...route];
  let added = 0;
  const candidates = gems.filter((g) => !used.has(g.id));
  while (added < max) {
    let best: { g: Place; at: number; cost: number } | undefined;
    for (const g of candidates) {
      if (used.has(g.id)) continue;
      for (let i = 0; i <= out.length; i++) {
        const a: LatLng = i === 0 ? base : out[i - 1];
        const b: LatLng | undefined = out[i];
        const cost = b ? distanceM(a, g) + distanceM(g, b) - distanceM(a, b) : distanceM(a, g);
        if (cost < GEM_DETOUR_M && (!best || cost < best.cost)) best = { g, at: i, cost };
      }
    }
    if (!best) break;
    out.splice(best.at, 0, best.g);
    used.add(best.g.id);
    added++;
  }
  return out;
}

/** Insère le déjeuner (et le goûter) au bon moment, au plus près du trajet. */
function addMeals(route: Place[], base: LatLng, startTime: string, restaurants: Place[], used: Set<string>): Place[] {
  const out: Place[] = [];
  let t = toMinutes(startTime);
  let pos: LatLng = base;
  let lunch = t >= LUNCH_AT + 60; // départ après le déjeuner : pas de repas à insérer
  for (const p of route) {
    const arrive = t + leg(pos, p).minutes;
    // Grande visite qui couvre le midi (parc, Cité de l'espace…) : on y déjeune sur place.
    if (!lunch && p.durationMin >= 180 && arrive < LUNCH_AT && arrive + p.durationMin > LUNCH_AT + 60) lunch = true;
    if (!lunch && (arrive >= LUNCH_AT || (arrive >= LUNCH_AT - 45 && arrive + p.durationMin > LUNCH_AT + 60))) {
      const r = nearest(pos, restaurants, used, (x) => x.priceLevel !== '€€€' && x.durationMin >= 45);
      if (r) {
        out.push(r);
        used.add(r.id);
        t += leg(pos, r).minutes + r.durationMin;
        pos = r;
      }
      lunch = true;
    }
    t += leg(pos, p).minutes + p.durationMin;
    out.push(p);
    pos = p;
  }
  if (!lunch && out.length) {
    const r = nearest(pos, restaurants, used, (x) => x.durationMin >= 45);
    if (r) {
      out.push(r);
      used.add(r.id);
    }
  }
  return out;
}

function pathLength(base: LatLng, route: LatLng[]): number {
  let pos = base;
  let m = 0;
  for (const p of route) {
    m += distanceM(pos, p);
    pos = p;
  }
  return m;
}

/**
 * Les grands sites (château, musées longs) ferment vers 17 h : s'ils tombent en fin de journée,
 * on parcourt la boucle dans l'autre sens quand le détour reste raisonnable.
 */
function preferLongVisitsEarly(base: LatLng, route: Place[]): Place[] {
  const lateness = (r: Place[]) => r.reduce((s, p, i) => s + (p.durationMin >= 90 ? i * p.durationMin : 0), 0);
  const reversed = [...route].reverse();
  if (lateness(reversed) < lateness(route) && pathLength(base, reversed) < pathLength(base, route) * 1.2) return reversed;
  return route;
}

function routeMinutes(base: LatLng, route: Place[]): number {
  let pos: LatLng = base;
  let m = 0;
  for (const p of route) {
    m += leg(pos, p).minutes + p.durationMin;
    pos = p;
  }
  return m;
}

/** Construit les journées d'un séjour. */
export function planTrip(input: PlanInput): TripDay[] {
  const { places, days, pace, wishes, ages, base, cityId } = input;
  const exclude = new Set(input.exclude ?? []);
  const rain = new Set(input.rainDays ?? []);
  const budget = PACE_BUDGET[pace];

  const candidates = places
    .filter((p) => isVisit(p) && !exclude.has(p.id) && suitable(p, ages))
    .map((p) => ({ p, s: score(p, wishes, ages) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.p.name.localeCompare(b.p.name));

  // Sélection : les meilleurs lieux jusqu'à remplir ~70 % du temps (le reste : trajets, pépites).
  const chosen: Place[] = [];
  let total = 0;
  for (const { p } of candidates) {
    if (total + p.durationMin > days * budget * 0.7) continue;
    chosen.push(p);
    total += p.durationMin;
  }

  let groups = cluster(chosen, days);

  // Jour de pluie : on lui donne la zone la plus « intérieure ».
  if (rain.size) {
    const indoorRatio = (g: Place[]) => (g.length ? g.filter((p) => p.indoor).length / g.length : 0);
    const ranked = [...groups].sort((a, b) => indoorRatio(b) - indoorRatio(a));
    const ordered: Place[][] = Array.from({ length: days }, () => []);
    const rainIdx = [...rain].filter((i) => i < days);
    rainIdx.forEach((di, k) => (ordered[di] = ranked[k] ?? []));
    const rest = ranked.slice(rainIdx.length);
    for (let i = 0, r = 0; i < days; i++) if (!rain.has(i)) ordered[i] = rest[r++] ?? [];
    groups = ordered;
  }

  const used = new Set<string>(chosen.map((p) => p.id));
  const gems = places.filter((p) => p.kind === 'gem' && !exclude.has(p.id) && suitable(p, ages));
  const restaurants = places.filter((p) => p.kind === 'restaurant');

  return groups.map((group, i) => {
    let pool = group;
    if (rain.has(i)) {
      // Pluie : on remplace l'extérieur par l'intérieur le plus proche quand c'est possible.
      const center = centroid(group);
      pool = group.map((p) => {
        if (p.indoor) return p;
        const alt = nearest(p, places, used, (x) => isVisit(x) && x.indoor && !exclude.has(x.id) && suitable(x, ages) && distanceM(x, center) < 1500);
        if (alt && distanceM(alt, p) < 1500) {
          used.add(alt.id);
          return alt;
        }
        return p;
      });
    }
    let route = preferLongVisitsEarly(base, orderRoute(base, pool));
    // Trop long pour le rythme choisi : on retire les lieux les moins intéressants.
    while (route.length > 1 && routeMinutes(base, route) > budget) {
      const weakest = [...route].sort((a, b) => score(a, wishes, ages) - score(b, wishes, ages))[0];
      route = route.filter((p) => p !== weakest);
      used.delete(weakest.id);
    }
    // Journée trop courte : on la complète avec les meilleurs lieux encore libres, tout près du parcours.
    for (let guard = 0; guard < 6 && routeMinutes(base, route) < budget * 0.75; guard++) {
      const room = budget - routeMinutes(base, route);
      const heart = centroid(route.length ? route : [base]);
      const extra = candidates
        .map((c) => c.p)
        .find((p) => !used.has(p.id) && p.durationMin <= room && (!rain.has(i) || p.indoor) && distanceM(heart, p) < 1100);
      if (!extra) break;
      used.add(extra.id);
      route = preferLongVisitsEarly(base, orderRoute(base, [...route, extra]));
    }
    const gemSlots = Math.max(0, Math.min(PACE_GEMS[pace], Math.floor((budget - routeMinutes(base, route)) / 12)));
    route = weaveGems(route, base, rain.has(i) ? gems.filter((g) => g.indoor) : gems, used, gemSlots);
    route = addMeals(route, base, input.startTime, restaurants, used);

    const day: TripDay = {
      date: addDays(input.startDate, i),
      title: dayTitle(cityId, route),
      startTime: input.startTime,
      rain: rain.has(i),
      stops: route.map((p) => ({ id: stopId(), placeId: p.id, time: input.startTime, status: 'todo' })),
    };
    const lookup = (id: string) => places.find((p) => p.id === id);
    return computeTimes(day, base, lookup);
  });
}

/** Plan B pluie pour une journée existante : remplace les étapes extérieures non faites par de l'intérieur proche. */
export function rainSwap(day: TripDay, base: LatLng, places: Place[], takenIds: Set<string>): TripDay {
  const used = new Set(takenIds);
  const stops = day.stops.map((s) => {
    const p = places.find((x) => x.id === s.placeId);
    if (!p || p.indoor || s.status !== 'todo' || p.kind === 'restaurant') return s;
    const alt = nearest(p, places, used, (x) => x.indoor && x.kind !== 'restaurant' && (p.kind === 'gem' ? x.kind === 'gem' : x.kind !== 'gem'));
    if (!alt || distanceM(alt, p) > 2500) return s;
    used.add(alt.id);
    return { ...s, placeId: alt.id };
  });
  const lookup = (id: string) => places.find((x) => x.id === id);
  const kept = stops.filter((s) => s.status !== 'todo');
  const todo = stops.filter((s) => s.status === 'todo');
  const lastDone = [...kept].reverse()[0];
  const from = lastDone ? (lookup(lastDone.placeId) ?? base) : base;
  const ordered = orderRoute(from, todo.map((s) => ({ ...s, ...(lookup(s.placeId) as LatLng) })));
  const next: TripDay = {
    ...day,
    rain: true,
    stops: [...kept, ...ordered.map(({ id, placeId, time, status }) => ({ id, placeId, time, status }))],
  };
  return computeTimes(next, base, lookup);
}

export function newStop(placeId: string): Stop {
  return { id: stopId(), placeId, time: '00:00', status: 'todo' };
}
