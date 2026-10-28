import { describe, expect, it } from '@jest/globals';

import { getPlace } from '@/lib/catalog';
import { computeBadges, computeStamps, computeTotals, levelOf, pointsFor, POINTS } from '@/lib/rewards';
import type { Visit } from '@/store/types';

const v = (placeId: string, at: string, auto = false): Visit => ({ id: placeId + at, placeId, at, auto });

describe('points', () => {
  it('valorise les pépites et les incontournables', () => {
    expect(pointsFor(getPlace('prg-cerny-pisse')!, false)).toBe(POINTS.gem);
    expect(pointsFor(getPlace('prg-horloge-astronomique')!, false)).toBe(POINTS.visit + POINTS.mustSee);
    expect(pointsFor(getPlace('prg-horloge-astronomique')!, true)).toBe(POINTS.visit + POINTS.mustSee + POINTS.onSite);
  });

  it('calcule les niveaux et la progression', () => {
    expect(levelOf(0).name).toBe('Curieux');
    expect(levelOf(1500)).toMatchObject({ name: 'Promeneurs', next: 'Explorateurs', toNext: 1500 });
    expect(levelOf(999999).progress).toBe(1);
  });
});

describe('badges et passeport', () => {
  const visits = [
    v('prg-cerny-pisse', '2026-10-29T07:30:00'),
    v('prg-bebes-kampa', '2026-10-29T08:10:00'),
    v('prg-pendu-freud', '2026-10-29T08:40:00'),
    v('prg-tete-kafka', '2026-10-29T10:00:00', true),
  ];

  it('débloque les œuvres de Černý à la 4e', () => {
    const b = computeBadges(visits, getPlace).find((x) => x.id === 'cerny')!;
    expect(b).toMatchObject({ earned: true, count: 4, earnedAt: '2026-10-29T10:00:00' });
  });

  it('compte une progression partielle', () => {
    const b = computeBadges(visits.slice(0, 2), getPlace).find((x) => x.id === 'cerny')!;
    expect(b).toMatchObject({ earned: false, count: 2, goal: 4 });
  });

  it('pose un tampon par quartier', () => {
    const stamps = computeStamps('prague', visits, getPlace);
    expect(stamps.find((s) => s.name === 'Kampa')?.earned).toBe(true);
    expect(stamps.filter((s) => s.earned).length).toBeGreaterThanOrEqual(2);
  });

  it('additionne points, pépites et kilomètres', () => {
    const t = computeTotals(visits, getPlace);
    expect(t.gems).toBe(4);
    expect(t.points).toBe(4 * POINTS.gem + POINTS.onSite);
    expect(t.km).toBeGreaterThan(0.5);
    expect(t.cities).toBe(1);
  });
});
