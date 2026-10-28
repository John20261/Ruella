/**
 * Récompenses (lot 5) : points, niveaux, badges et tampons du passeport.
 * Tout est recalculé à partir des visites, jamais stocké : impossible de « tricher » sur un compteur.
 */
import { districtOf, cityDistricts } from '@/content/districts';
import type { Place } from '@/content/types';
import { distanceM } from '@/lib/geo';
import type { Visit } from '@/store/types';

export const POINTS = {
  visit: 100,
  gem: 150,
  restaurant: 50,
  mustSee: 50,
  /** Validée sur place grâce à la position. */
  onSite: 25,
} as const;

export function pointsFor(place: Place, auto: boolean): number {
  let p = place.kind === 'gem' ? POINTS.gem : place.kind === 'restaurant' ? POINTS.restaurant : POINTS.visit;
  if (place.mustSee) p += POINTS.mustSee;
  if (auto) p += POINTS.onSite;
  return p;
}

export const LEVELS = [
  { name: 'Curieux', from: 0 },
  { name: 'Promeneurs', from: 1000 },
  { name: 'Explorateurs', from: 3000 },
  { name: 'Voyageurs', from: 6000 },
  { name: 'Arpenteurs', from: 10000 },
  { name: 'Légendes', from: 16000 },
] as const;

export function levelOf(points: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && points >= LEVELS[i + 1].from) i++;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1];
  const progress = next ? (points - cur.from) / (next.from - cur.from) : 1;
  return { index: i, name: cur.name, next: next?.name, toNext: next ? next.from - points : 0, progress };
}

export type Badge = {
  id: string;
  title: string;
  /** Sous-titre court du tampon. */
  hint: string;
  goal: number;
  count: number;
  earned: boolean;
  /** Date de la visite qui l'a débloqué. */
  earnedAt?: string;
  shape: 'round' | 'square';
};

/** Œuvres de David Černý présentes dans le catalogue. */
export const CERNY_IDS = ['prg-cerny-pisse', 'prg-bebes-kampa', 'prg-pendu-freud', 'prg-trabant-quo-vadis', 'prg-tete-kafka', 'prg-tour-zizkov'];

type Rule = { id: string; title: string; hint: string; goal: number; shape: Badge['shape']; match: (p: Place, v: Visit) => boolean };

const RULES: Rule[] = [
  { id: 'premier-pas', title: 'Premier pas', hint: 'Une étape cochée', goal: 1, shape: 'round', match: () => true },
  { id: 'pepites-5', title: 'Chasseur de pépites', hint: '5 pépites', goal: 5, shape: 'square', match: (p) => p.kind === 'gem' },
  { id: 'pepites-15', title: 'Fin limier', hint: '15 pépites', goal: 15, shape: 'round', match: (p) => p.kind === 'gem' },
  { id: 'incontournables', title: 'Les classiques', hint: '6 incontournables', goal: 6, shape: 'square', match: (p) => !!p.mustSee },
  { id: 'vues', title: 'Vue imprenable', hint: '4 points de vue', goal: 4, shape: 'round', match: (p) => p.kind === 'viewpoint' || p.wishes.includes('vues') },
  { id: 'cerny', title: 'Œuvres de Černý', hint: '4 œuvres', goal: 4, shape: 'square', match: (p) => CERNY_IDS.includes(p.id) },
  { id: 'gourmand', title: 'Fine gueule', hint: '4 restaurants', goal: 4, shape: 'round', match: (p) => p.kind === 'restaurant' },
  { id: 'musees', title: 'Rat de musée', hint: '4 musées', goal: 4, shape: 'square', match: (p) => p.kind === 'museum' },
  { id: 'histoire', title: 'Mémoire vive', hint: '8 lieux d’histoire', goal: 8, shape: 'round', match: (p) => p.wishes.includes('histoire') },
  { id: 'leve-tot', title: 'Lève-tôt', hint: '3 étapes avant 9 h', goal: 3, shape: 'square', match: (_p, v) => new Date(v.at).getHours() < 9 },
  { id: 'sur-place', title: 'Sur le terrain', hint: '5 validations sur place', goal: 5, shape: 'round', match: (_p, v) => v.auto },
];

export function computeBadges(visits: Visit[], lookup: (id: string) => Place | undefined): Badge[] {
  const sorted = [...visits].sort((a, b) => a.at.localeCompare(b.at));
  return RULES.map((r) => {
    let count = 0;
    let earnedAt: string | undefined;
    for (const v of sorted) {
      const p = lookup(v.placeId);
      if (!p || !r.match(p, v)) continue;
      count++;
      if (count === r.goal) earnedAt = v.at;
    }
    return { id: r.id, title: r.title, hint: r.hint, goal: r.goal, count: Math.min(count, r.goal), earned: count >= r.goal, earnedAt, shape: r.shape };
  });
}

export type Stamp = { districtId: string; name: string; earned: boolean; at?: string; count: number };

/** Un tampon par quartier visité. */
export function computeStamps(cityId: string, visits: Visit[], lookup: (id: string) => Place | undefined): Stamp[] {
  return cityDistricts(cityId).map((d) => {
    const vs = visits
      .filter((v) => {
        const p = lookup(v.placeId);
        return p && p.cityId === cityId && districtOf(cityId, p)?.id === d.id;
      })
      .sort((a, b) => a.at.localeCompare(b.at));
    return { districtId: d.id, name: d.name, earned: vs.length > 0, at: vs[0]?.at, count: vs.length };
  });
}

export type Totals = { points: number; visits: number; gems: number; km: number; cities: number };

export function computeTotals(visits: Visit[], lookup: (id: string) => Place | undefined): Totals {
  let points = 0;
  let gems = 0;
  let meters = 0;
  const cities = new Set<string>();
  const sorted = [...visits].sort((a, b) => a.at.localeCompare(b.at));
  let prev: { p: Place; day: string } | undefined;
  for (const v of sorted) {
    const p = lookup(v.placeId);
    if (!p) continue;
    points += pointsFor(p, v.auto);
    if (p.kind === 'gem') gems++;
    cities.add(p.cityId);
    const day = v.at.slice(0, 10);
    if (prev && prev.day === day) meters += distanceM(prev.p, p) * 1.3;
    prev = { p, day };
  }
  return { points, visits: visits.length, gems, km: Math.round(meters / 100) / 10, cities: cities.size };
}
