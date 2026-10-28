import { pragueGeo } from './prague';
import { toulouseGeo } from './toulouse';
import type { CityGeo } from './types';

const geos: Record<string, CityGeo> = { prague: pragueGeo, toulouse: toulouseGeo };

export function cityGeo(cityId: string): CityGeo | undefined {
  return geos[cityId];
}
