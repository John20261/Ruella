import { describe, expect, it } from '@jest/globals';

import { capitals } from '@/content/cities';
import { getPlace, getPlaces } from '@/lib/catalog';
import { distanceM, leg } from '@/lib/geo';
import { addDays, cluster, computeTimes, orderRoute, planTrip, rainSwap } from '@/lib/planner';
import { toMinutes } from '@/lib/schedule';

const places = getPlaces('prague');
const base = { name: 'Place de la Vieille-Ville', lat: 50.0875, lng: 14.4214 };
const family = {
  places,
  cityId: 'prague',
  startDate: '2026-10-29',
  days: 3,
  startTime: '09:30',
  pace: 'equilibre' as const,
  wishes: ['histoire' as const, 'insolite' as const],
  ages: ['adult' as const, '8-12' as const, '13-17' as const],
  base,
};

describe('géographie', () => {
  it('mesure une distance réaliste', () => {
    // Place de la Vieille-Ville → château : environ 1,6 km à vol d'oiseau
    const d = distanceM(base, { lat: 50.0905, lng: 14.4005 });
    expect(d).toBeGreaterThan(1300);
    expect(d).toBeLessThan(1800);
  });
  it('conseille les transports en commun au-delà de 2,2 km', () => {
    expect(leg(base, { lat: 50.0905, lng: 14.4005 }).mode).toBe('walk');
    expect(leg(base, { lat: 50.1169, lng: 14.4061 }).mode).toBe('transit'); // zoo
  });
});

describe('planificateur', () => {
  const days = planTrip(family);

  it('crée une journée par jour, datée', () => {
    expect(days).toHaveLength(3);
    expect(days.map((d) => d.date)).toEqual(['2026-10-29', '2026-10-30', '2026-10-31']);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it("ne propose jamais deux fois le même lieu", () => {
    const ids = days.flatMap((d) => d.stops.map((s) => s.placeId));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('prévoit un déjeuner et des pépites chaque jour', () => {
    for (const d of days) {
      const kinds = d.stops.map((s) => getPlace(s.placeId)?.kind);
      expect(kinds).toContain('restaurant');
      expect(kinds).toContain('gem');
    }
  });

  it('écarte les lieux déconseillés aux enfants du groupe', () => {
    const ids = days.flatMap((d) => d.stops.map((s) => s.placeId));
    expect(ids).not.toContain('prg-musee-kafka'); // conseillé à partir de 13 ans
  });

  it('respecte le rythme : la journée équilibrée finit avant 19 h 30', () => {
    for (const d of days) {
      const last = d.stops[d.stops.length - 1];
      const end = toMinutes(last.time) + (getPlace(last.placeId)?.durationMin ?? 0);
      expect(end).toBeLessThan(19 * 60 + 30);
    }
  });

  it('enchaîne les heures dans l’ordre', () => {
    for (const d of days) {
      const t = d.stops.map((s) => toMinutes(s.time));
      expect([...t].sort((a, b) => a - b)).toEqual(t);
      expect(t[0]).toBeGreaterThanOrEqual(toMinutes('09:30'));
    }
  });

  it('exclut les lieux déjà visités', () => {
    const again = planTrip({ ...family, exclude: ['prg-chateau', 'prg-pont-charles'] });
    const ids = again.flatMap((d) => d.stops.map((s) => s.placeId));
    expect(ids).not.toContain('prg-chateau');
    expect(ids).not.toContain('prg-pont-charles');
  });

  it('donne au jour de pluie une majorité de lieux couverts', () => {
    const wet = planTrip({ ...family, rainDays: [1] });
    const visits = wet[1].stops.map((s) => getPlace(s.placeId)!).filter((p) => p.kind !== 'restaurant');
    const indoor = visits.filter((p) => p.indoor).length;
    expect(wet[1].rain).toBe(true);
    expect(indoor / visits.length).toBeGreaterThanOrEqual(0.6);
  });

  it('le plan B pluie remplace l’extérieur sans toucher aux étapes faites', () => {
    const day = { ...days[0], stops: days[0].stops.map((s, i) => (i === 0 ? { ...s, status: 'done' as const } : s)) };
    const taken = new Set(days.flatMap((d) => d.stops.map((s) => s.placeId)));
    const wet = rainSwap(day, base, places, taken);
    expect(wet.stops[0]).toMatchObject({ placeId: day.stops[0].placeId, status: 'done' });
    const outdoorBefore = day.stops.filter((s) => s.status === 'todo' && !getPlace(s.placeId)!.indoor).length;
    const outdoorAfter = wet.stops.filter((s) => s.status === 'todo' && !getPlace(s.placeId)!.indoor).length;
    expect(outdoorAfter).toBeLessThanOrEqual(outdoorBefore);
  });

  it('recalcule les heures quand on passe une étape', () => {
    const d = days[0];
    const skipped = computeTimes({ ...d, stops: d.stops.map((s, i) => (i === 0 ? { ...s, status: 'skipped' as const } : s)) }, base, getPlace);
    expect(toMinutes(skipped.stops[1].time)).toBeLessThan(toMinutes(d.stops[1].time));
  });
});

describe('regroupement et ordre', () => {
  const pts = [
    { lat: 50.0, lng: 14.0 },
    { lat: 50.001, lng: 14.001 },
    { lat: 50.1, lng: 14.1 },
    { lat: 50.101, lng: 14.101 },
  ];
  it('sépare deux zones éloignées', () => {
    const g = cluster(pts, 2);
    expect(g.map((x) => x.length).sort()).toEqual([2, 2]);
    for (const grp of g) expect(distanceM(grp[0], grp[1])).toBeLessThan(500);
  });
  it('visite d’abord le plus proche', () => {
    const r = orderRoute({ lat: 50.1, lng: 14.1 }, pts);
    expect(r[0]).toEqual(pts[2]);
  });
});

describe('Toulouse', () => {
  const tls = getPlaces('toulouse');
  const days = planTrip({
    places: tls,
    cityId: 'toulouse',
    startDate: '2026-11-02',
    days: 3,
    startTime: '09:30',
    pace: 'equilibre',
    wishes: ['enfants', 'histoire'],
    ages: ['adult', '8-12', '13-17'],
    base: { name: 'Place du Capitole', lat: 43.6045, lng: 1.444 },
  });

  it('compose trois journées toulousaines avec un déjeuner (au restaurant ou sur place)', () => {
    expect(days).toHaveLength(3);
    for (const d of days) {
      const places = d.stops.map((s) => getPlace(s.placeId)!);
      expect(places.some((p) => p.kind === 'restaurant' || p.durationMin >= 180)).toBe(true);
      expect(d.stops.every((s) => getPlace(s.placeId)?.cityId === 'toulouse')).toBe(true);
    }
  });

  it('propose les incontournables pour les enfants', () => {
    const ids = days.flatMap((d) => d.stops.map((s) => s.placeId));
    expect(ids).toContain('tls-capitole');
    expect(ids.some((id) => id === 'tls-cite-espace' || id === 'tls-halle-machine')).toBe(true);
  });
});

describe('capitales 1.3.0', () => {
  for (const { city, bases } of capitals) {
    it(`${city.name} : trois journées remplies, avec déjeuner et incontournables`, () => {
      const days = planTrip({
        places: getPlaces(city.id),
        cityId: city.id,
        startDate: '2026-11-02',
        days: 3,
        startTime: '09:30',
        pace: 'equilibre',
        wishes: ['histoire', 'enfants'],
        ages: ['adult', '8-12'],
        base: bases[0],
      });
      expect(days).toHaveLength(3);
      for (const d of days) {
        expect([city.id, d.date, d.stops.length >= 3]).toEqual([city.id, d.date, true]);
        const places = d.stops.map((s) => getPlace(s.placeId)!);
        expect([city.id, d.date, places.some((p) => p.kind === 'restaurant' || p.durationMin >= 180)]).toEqual([city.id, d.date, true]);
      }
      const ids = new Set(days.flatMap((d) => d.stops.map((s) => s.placeId)));
      const must = getPlaces(city.id).filter((p) => p.mustSee && p.ages.includes('8-12'));
      const seen = must.filter((p) => ids.has(p.id)).length;
      expect([city.id, seen / must.length >= 0.6]).toEqual([city.id, true]);
    });
  }
});
