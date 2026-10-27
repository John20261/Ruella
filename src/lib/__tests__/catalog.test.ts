import { describe, expect, it } from '@jest/globals';

import { prague } from '@/content/prague';
import type { Place } from '@/content/types';
import { contentProgress, formatDuration, getPlace, validateCatalog, validatePlace } from '../catalog';

const valid: Place = {
  id: 'prg-test',
  cityId: 'prague',
  kind: 'gem',
  name: 'Lieu test',
  hook: 'Une accroche suffisamment longue pour passer.',
  why: 'Une explication de plus de quarante caractères pour la pépite.',
  lat: 50.08,
  lng: 14.42,
  coordsVerified: false,
  radiusM: 50,
  indoor: false,
  ages: ['adult'],
  wishes: ['insolite'],
  durationMin: 10,
  verification: { status: 'to_verify', sources: [] },
  status: 'draft',
};

describe('catalogue de Prague', () => {
  it('respecte toutes les règles de qualité', () => {
    expect(validateCatalog()).toEqual([]);
  });

  it('retrouve une fiche par son identifiant', () => {
    expect(getPlace('prg-karel-zeman')?.name).toBe('Musée Karel Zeman');
  });

  it("mesure l'avancement vers 40 visites, 40 pépites, 25 restaurants", () => {
    const p = contentProgress('prague');
    expect(p.total).toBe(p.visites + p.pepites + p.restaurants);
  });
});

describe('validatePlace', () => {
  it('accepte une fiche correcte', () => {
    expect(validatePlace(valid, prague)).toEqual([]);
  });

  it('refuse une accroche de plus de 120 caractères', () => {
    expect(validatePlace({ ...valid, hook: 'x'.repeat(121) }, prague)[0]).toMatch(/accroche trop longue/);
  });

  it('exige le « pourquoi » des pépites', () => {
    expect(validatePlace({ ...valid, why: undefined }, prague).join()).toMatch(/pourquoi/);
  });

  it('refuse une position hors de la ville', () => {
    expect(validatePlace({ ...valid, lat: 48.85, lng: 2.35 }, prague).join()).toMatch(/hors de Prague/);
  });

  it('refuse de publier une fiche non vérifiée, approximative ou sans photo', () => {
    const problems = validatePlace({ ...valid, status: 'published' }, prague).join(' | ');
    expect(problems).toMatch(/sans vérification/);
    expect(problems).toMatch(/position approximative/);
    expect(problems).toMatch(/sans photo/);
  });

  it('refuse les liens non sécurisés', () => {
    expect(validatePlace({ ...valid, ticketUrl: 'http://exemple.cz' }, prague).join()).toMatch(/non sécurisé/);
  });
});

describe('formatDuration', () => {
  it('écrit les durées à la française', () => {
    expect(formatDuration(20)).toBe('20 min');
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(90)).toBe('1 h 30');
    expect(formatDuration(75)).toBe('1 h 15');
  });
});
