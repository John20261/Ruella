/**
 * Budget du séjour : tout ce qu'on paiera sur place (entrées, repas, transports en commun)
 * plus les dépenses saisies à la main (trains, réservations). Fonctions pures, testées.
 */
import type { City, Cost, Meal, Place, Transit } from '@/content/types';
import { TRANSIT_FROM_M, distanceM } from '@/lib/geo';
import { toEUR } from '@/lib/money';
import type { Expense, MealBudget, Traveler, Trip } from '@/store/types';

/** Prix maximum d'un déjeuner par adulte, selon le budget repas choisi (en euros). */
export const MEAL_CAP_EUR: Record<MealBudget, number> = { serre: 15, malin: 25, large: 40, libre: Number.POSITIVE_INFINITY };

export const MEAL_BUDGET_LABEL: Record<MealBudget, { title: string; detail: string }> = {
  serre: { title: 'Petit budget', detail: 'Moins de 15 € par adulte et par repas' },
  malin: { title: 'Malin', detail: 'Jusqu’à 25 € par adulte' },
  large: { title: 'Confortable', detail: 'Jusqu’à 40 € par adulte' },
  libre: { title: 'Sans limite', detail: 'On choisit le meilleur, quel que soit le prix' },
};

/** Dîner estimé (non planifié par Ruella), par adulte, en euros. */
const DINNER_EUR: Record<MealBudget, number> = { serre: 13, malin: 22, large: 35, libre: 40 };

const BAND_AGE = { adult: 35, '13-17': 15, '8-12': 10, under8: 4 } as const;

export function ageOf(t: Traveler): number {
  return t.age ?? BAND_AGE[t.band];
}

/** Prix d'entrée pour une personne, dans la monnaie du lieu. */
export function entryPrice(cost: Cost, age: number): number {
  if (age < (cost.freeUnder ?? 6)) return 0;
  if (age <= (cost.childUntil ?? 17)) return cost.child ?? cost.adult;
  return cost.adult;
}

/** Repas pour une personne : tarif enfant ≈ 60 % jusqu'à 12 ans, gratuit avant 3 ans. */
export function mealPrice(meal: Meal, age: number): number {
  if (age < 3) return 0;
  if (age <= 12) return meal.child ?? Math.round(meal.adult * 0.6);
  return meal.adult;
}

export function transitSingle(t: Transit, age: number): number {
  if (age < t.freeUnder) return 0;
  const { single } = t;
  if (single.child !== undefined && age >= (single.childFrom ?? 0) && age <= (single.childUntil ?? -1)) return single.child;
  return single.adult;
}

export function transitDay(t: Transit, age: number): number {
  if (age < t.freeUnder) return 0;
  return t.day.child !== undefined && age <= (t.single.childUntil ?? -1) ? t.day.child : t.day.adult;
}

export type BudgetCategory = 'visites' | 'repas' | 'transports' | 'trains' | 'reservations' | 'autre';

export const CATEGORY_LABEL: Record<BudgetCategory, string> = {
  visites: 'Visites et entrées',
  repas: 'Repas',
  transports: 'Transports en commun',
  trains: 'Trains et trajets',
  reservations: 'Réservations',
  autre: 'Autres frais',
};

export type BudgetLine = {
  id: string;
  label: string;
  detail?: string;
  category: BudgetCategory;
  amountEUR: number;
  /** Montant dans la monnaie locale, si différente. */
  local?: { amount: number; currency: Cost['currency'] };
  estimate: boolean;
  paid: boolean;
  dayIndex?: number;
  placeId?: string;
  expenseId?: string;
};

export type TripBudget = {
  lines: BudgetLine[];
  total: number;
  onSite: number;
  paid: number;
  perPerson: number;
  byCategory: { category: BudgetCategory; amount: number }[];
  byDay: { dayIndex: number; amount: number }[];
  estimateShare: number;
};

const EXPENSE_CATEGORY: Record<Expense['category'], BudgetCategory> = {
  train: 'trains',
  reservation: 'reservations',
  transport: 'transports',
  autre: 'autre',
};

export function computeBudget(trip: Trip, city: City | undefined, travelers: Traveler[], lookup: (id: string) => Place | undefined): TripBudget {
  const ages = travelers.map(ageOf);
  const level = trip.mealBudget ?? 'malin';
  const lines: BudgetLine[] = [];
  const groups = new Set<string>();

  trip.days.forEach((day, di) => {
    const stops = day.stops.filter((s) => s.status !== 'skipped');
    for (const s of stops) {
      const p = lookup(s.placeId);
      if (!p) continue;
      if (p.cost && p.cost.adult > 0) {
        if (p.cost.group && groups.has(p.cost.group)) continue;
        if (p.cost.group) groups.add(p.cost.group);
        const local = ages.reduce((sum, a) => sum + entryPrice(p.cost!, a), 0);
        if (local > 0) {
          lines.push({
            id: `v-${di}-${s.id}`,
            label: p.name,
            detail: p.cost.group ? 'Billet commun à plusieurs lieux' : undefined,
            category: 'visites',
            amountEUR: toEUR(local, p.cost.currency),
            local: p.cost.currency === 'EUR' ? undefined : { amount: local, currency: p.cost.currency },
            estimate: !!p.cost.estimate,
            paid: false,
            dayIndex: di,
            placeId: p.id,
          });
        }
      }
      if (p.kind === 'restaurant' && p.meal) {
        const local = ages.reduce((sum, a) => sum + mealPrice(p.meal!, a), 0);
        lines.push({
          id: `m-${di}-${s.id}`,
          label: p.name,
          detail: 'Déjeuner',
          category: 'repas',
          amountEUR: toEUR(local, p.meal.currency),
          local: p.meal.currency === 'EUR' ? undefined : { amount: local, currency: p.meal.currency },
          estimate: true,
          paid: false,
          dayIndex: di,
          placeId: p.id,
        });
      }
    }

    // Dîner : pas planifié par Ruella, mais il faut le prévoir.
    const dinner = ages.reduce((sum, a) => sum + (a < 3 ? 0 : a <= 12 ? DINNER_EUR[level] * 0.6 : DINNER_EUR[level]), 0);
    lines.push({ id: `d-${di}`, label: 'Dîner', detail: 'Estimation selon votre budget repas', category: 'repas', amountEUR: dinner, estimate: true, paid: false, dayIndex: di });

    // Transports en commun : trajets longs du jour, plus le retour au point de départ s'il est loin.
    if (city?.transit) {
      let rides = stops.filter((s) => s.leg?.mode === 'transit').length;
      const last = [...stops].reverse().map((s) => lookup(s.placeId)).find(Boolean);
      if (last && distanceM(last, trip.base) * 1.3 >= TRANSIT_FROM_M) rides += 1;
      if (rides > 0) {
        const t = city.transit;
        const singles = ages.reduce((sum, a) => sum + transitSingle(t, a) * rides, 0);
        const pass = ages.reduce((sum, a) => sum + transitDay(t, a), 0);
        const usePass = pass < singles;
        const local = usePass ? pass : singles;
        if (local > 0) {
          lines.push({
            id: `t-${di}`,
            label: usePass ? t.day.label : `${rides} trajet${rides > 1 ? 's' : ''} en transports`,
            detail: usePass ? `Plus avantageux que ${rides} billets à l’unité` : t.single.label,
            category: 'transports',
            amountEUR: toEUR(local, t.currency),
            local: t.currency === 'EUR' ? undefined : { amount: local, currency: t.currency },
            estimate: false,
            paid: false,
            dayIndex: di,
          });
        }
      }
    }
  });

  for (const e of trip.expenses ?? []) {
    lines.push({
      id: `e-${e.id}`,
      label: e.label,
      category: EXPENSE_CATEGORY[e.category],
      amountEUR: e.amountEUR,
      estimate: false,
      paid: e.paid,
      expenseId: e.id,
      dayIndex: e.date ? trip.days.findIndex((d) => d.date === e.date) : undefined,
    });
  }

  const total = lines.reduce((s, l) => s + l.amountEUR, 0);
  const paid = lines.filter((l) => l.paid).reduce((s, l) => s + l.amountEUR, 0);
  const cats: BudgetCategory[] = ['visites', 'repas', 'transports', 'trains', 'reservations', 'autre'];
  const byCategory = cats
    .map((category) => ({ category, amount: lines.filter((l) => l.category === category).reduce((s, l) => s + l.amountEUR, 0) }))
    .filter((c) => c.amount > 0);
  const byDay = trip.days.map((_, dayIndex) => ({
    dayIndex,
    amount: lines.filter((l) => l.dayIndex === dayIndex && !l.paid).reduce((s, l) => s + l.amountEUR, 0),
  }));
  const estimated = lines.filter((l) => l.estimate).reduce((s, l) => s + l.amountEUR, 0);

  return {
    lines,
    total,
    onSite: total - paid,
    paid,
    perPerson: travelers.length ? total / travelers.length : total,
    byCategory,
    byDay,
    estimateShare: total ? estimated / total : 0,
  };
}

/** Coût d'un lieu pour la famille, en euros (entrée ou repas). */
export function familyCostEUR(p: Place, travelers: Traveler[]): { amount: number; estimate: boolean } | null {
  const ages = travelers.map(ageOf);
  if (p.kind === 'restaurant' && p.meal) {
    return { amount: toEUR(ages.reduce((s, a) => s + mealPrice(p.meal!, a), 0), p.meal.currency), estimate: true };
  }
  if (p.cost) return { amount: toEUR(ages.reduce((s, a) => s + entryPrice(p.cost!, a), 0), p.cost.currency), estimate: !!p.cost.estimate };
  return null;
}

/** Prix d'un repas par adulte, en euros (pour le filtre du planificateur). */
export function mealEUR(p: Place): number | undefined {
  return p.meal ? toEUR(p.meal.adult, p.meal.currency) : undefined;
}
