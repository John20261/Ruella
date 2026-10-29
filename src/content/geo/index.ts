import { amsterdamGeo } from './amsterdam';
import { berlinGeo } from './berlin';
import { bruxellesGeo } from './bruxelles';
import { budapestGeo } from './budapest';
import { lisbonneGeo } from './lisbonne';
import { londresGeo } from './londres';
import { madridGeo } from './madrid';
import { parisGeo } from './paris';
import { pragueGeo } from './prague';
import { romeGeo } from './rome';
import { toulouseGeo } from './toulouse';
import { vienneGeo } from './vienne';
import type { CityGeo } from './types';

const geos: Record<string, CityGeo> = {
  prague: pragueGeo,
  toulouse: toulouseGeo,
  paris: parisGeo,
  londres: londresGeo,
  rome: romeGeo,
  madrid: madridGeo,
  lisbonne: lisbonneGeo,
  berlin: berlinGeo,
  amsterdam: amsterdamGeo,
  bruxelles: bruxellesGeo,
  vienne: vienneGeo,
  budapest: budapestGeo,
};

export function cityGeo(cityId: string): CityGeo | undefined {
  return geos[cityId];
}
