import { describe, expect, it } from '@jest/globals';

import { computeBudget, entryPrice, familyCostEUR, mealPrice, transitSingle } from '@/lib/budget';
import { cities, getCity, getPlace, getPlaces } from '@/lib/catalog';
import { formatEUR, toEUR } from '@/lib/money';
import { planTrip } from '@/lib/planner';
import type { Traveler, Trip } from '@/store/types';

const family: Traveler[] = [
  { id: 'a', name: 'Papa', band: 'adult' },
  { id: 'b', name: 'Maman', band: 'adult' },
  { id: 'c', name: 'Inès', band: '8-12', age: 11 },
  { id: 'd', name: 'Léo', band: '13-17', age: 14 },
];

describe('tarifs', () => {
  it('applique gratuit, enfant et adulte selon l’âge', () => {
    const cost = { currency: 'CZK' as const, adult: 600, child: 200, freeUnder: 7, childUntil: 15 };
    expect(entryPrice(cost, 5)).toBe(0);
    expect(entryPrice(cost, 11)).toBe(200);
    expect(entryPrice(cost, 16)).toBe(600);
    expect(mealPrice({ currency: 'EUR', adult: 20 }, 10)).toBe(12);
    expect(mealPrice({ currency: 'EUR', adult: 20 }, 2)).toBe(0);
  });

  it('les enfants de moins de 15 ans voyagent gratuitement à Prague', () => {
    const t = getCity('prague')!.transit!;
    expect(transitSingle(t, 14)).toBe(0);
    expect(transitSingle(t, 30)).toBe(46);
  });

  it('demi-tarif Tisséo pour les 5-10 ans', () => {
    const t = getCity('toulouse')!.transit!;
    expect(transitSingle(t, 4)).toBe(0);
    expect(transitSingle(t, 8)).toBe(0.95);
    expect(transitSingle(t, 14)).toBe(1.9);
  });

  it('convertit et affiche en euros', () => {
    expect(toEUR(244, 'CZK')).toBeCloseTo(10, 5);
    expect(formatEUR(1240)).toBe('1 240 €');
    expect(formatEUR(7.5)).toBe('7,50 €');
  });

  it('donne le coût d’une visite pour la famille', () => {
    const c = familyCostEUR(getPlace('tls-cite-espace')!, family)!;
    expect(c.amount).toBeCloseTo(32 * 2 + 25.5 * 2, 5);
    expect(c.estimate).toBe(false);
  });
});

describe('contenu', () => {
  it('chaque lieu a sa présentation, chaque restaurant son prix', () => {
    for (const city of cities) {
      for (const p of getPlaces(city.id)) {
        expect([p.id, (p.about ?? '').length > 60]).toEqual([p.id, true]);
        if (p.kind === 'restaurant') expect([p.id, !!p.meal]).toEqual([p.id, true]);
      }
    }
  });
});

describe('budget du séjour', () => {
  const places = getPlaces('prague');
  const base = { name: 'Hôtel', lat: 50.0875, lng: 14.4214 };
  const days = planTrip({ places, cityId: 'prague', startDate: '2026-10-29', days: 2, startTime: '09:30', pace: 'equilibre', wishes: ['histoire'], ages: ['adult', '8-12', '13-17'], base, mealCapEUR: 15 });
  const trip: Trip = {
    id: 't',
    cityId: 'prague',
    createdAt: '',
    base,
    days,
    mealBudget: 'serre',
    expenses: [
      { id: 'x1', label: 'Train Paris → Prague', amountEUR: 420, category: 'train', paid: true },
      { id: 'x2', label: 'Train pour Kutná Hora', amountEUR: 36, category: 'train', paid: false, date: '2026-10-30' },
    ],
  };
  const b = computeBudget(trip, getCity('prague'), family, getPlace);

  it('respecte le budget repas au planificateur', () => {
    const lunches = days.flatMap((d) => d.stops.map((s) => getPlace(s.placeId)!)).filter((p) => p.kind === 'restaurant');
    for (const r of lunches) expect(toEUR(r.meal!.adult, r.meal!.currency)).toBeLessThanOrEqual(15);
  });

  it('additionne visites, repas, transports et trains', () => {
    const sum = b.byCategory.reduce((s, c) => s + c.amount, 0);
    expect(sum).toBeCloseTo(b.total, 5);
    expect(b.paid).toBe(420);
    expect(b.onSite).toBeCloseTo(b.total - 420, 5);
    expect(b.byCategory.map((c) => c.category)).toEqual(expect.arrayContaining(['visites', 'repas', 'trains']));
  });

  it('ne compte qu’une fois un billet commun (Musée juif)', () => {
    const jewish = b.lines.filter((l) => l.placeId && getPlace(l.placeId)?.cost?.group === 'prg-jewish-museum');
    expect(jewish.length).toBeLessThanOrEqual(1);
  });

  it('range les dépenses datées dans leur journée', () => {
    expect(b.lines.find((l) => l.expenseId === 'x2')?.dayIndex).toBe(1);
  });
});
