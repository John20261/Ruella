import { pragueGeo } from './prague';
import type { CityGeo } from './types';

const geos: Record<string, CityGeo> = { prague: pragueGeo };

export function cityGeo(cityId: string): CityGeo | undefined {
  return geos[cityId];
}
