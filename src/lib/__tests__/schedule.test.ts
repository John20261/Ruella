import { describe, expect, it } from '@jest/globals';

import { describeOffset, shiftDay, toMinutes, toTime } from '../schedule';

const samedi = [
  { id: 'hotel', time: '09:00' },
  { id: 'miniatures', time: '10:00' },
  { id: 'chateau', time: '11:15' },
  { id: 'pont', time: '17:00' },
];

const lundi = [
  { id: 'hotel', time: '09:30' },
  { id: 'louvre', time: '12:00' },
  { id: 'retour', time: '14:00', fixed: true },
  { id: 'bus', time: '15:00', fixed: true },
];

describe('toMinutes / toTime', () => {
  it('convertit dans les deux sens', () => {
    expect(toMinutes('09:05')).toBe(545);
    expect(toTime(545)).toBe('09:05');
  });

  it('refuse une heure invalide', () => {
    expect(() => toMinutes('25:00')).toThrow();
    expect(() => toMinutes('midi')).toThrow();
  });

  it('borne la journée entre 00:00 et 23:59', () => {
    expect(toTime(-30)).toBe('00:00');
    expect(toTime(2000)).toBe('23:59');
  });
});

describe('shiftDay', () => {
  it('décale tout le programme quand on part à 10:30 au lieu de 9:00', () => {
    const { stops, offset } = shiftDay(samedi, '10:30');
    expect(offset).toBe(90);
    expect(stops.map((s) => s.time)).toEqual(['10:30', '11:30', '12:45', '18:30']);
  });

  it('ne touche jamais aux contraintes fixes', () => {
    const { stops } = shiftDay(lundi, '10:30');
    expect(stops.find((s) => s.id === 'retour')?.time).toBe('14:00');
    expect(stops.find((s) => s.id === 'bus')?.time).toBe('15:00');
  });

  it("signale la contrainte fixe menacée par un départ trop tardif", () => {
    const { threatenedFixedStop } = shiftDay(lundi, '11:30');
    expect(threatenedFixedStop?.id).toBe('retour');
  });

  it("ignore les étapes passées pour l'alerte", () => {
    const withSkip = lundi.map((s) => (s.id === 'louvre' ? { ...s, skipped: true } : s));
    expect(shiftDay(withSkip, '11:30').threatenedFixedStop).toBeNull();
  });

  it('ne change rien sans décalage', () => {
    const { stops, offset } = shiftDay(samedi, '09:00');
    expect(offset).toBe(0);
    expect(stops).toEqual(samedi);
  });
});

describe('describeOffset', () => {
  it('formule le décalage en français', () => {
    expect(describeOffset(0)).toBe("Programme d'origine");
    expect(describeOffset(90)).toBe('+1 h 30 sur tout le programme');
    expect(describeOffset(-15)).toBe('−15 min sur tout le programme');
  });
});
