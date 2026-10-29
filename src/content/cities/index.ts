import type { District } from '../districts';
import type { City, Place } from '../types';
import { paris, parisBases, parisDistricts, parisPlaces } from './paris';
import { londres, londresBases, londresDistricts, londresPlaces } from './londres';
import { rome, romeBases, romeDistricts, romePlaces } from './rome';
import { madrid, madridBases, madridDistricts, madridPlaces } from './madrid';
import { lisbonne, lisbonneBases, lisbonneDistricts, lisbonnePlaces } from './lisbonne';
import { berlin, berlinBases, berlinDistricts, berlinPlaces } from './berlin';
import { amsterdam, amsterdamBases, amsterdamDistricts, amsterdamPlaces } from './amsterdam';
import { bruxelles, bruxellesBases, bruxellesDistricts, bruxellesPlaces } from './bruxelles';
import { vienne, vienneBases, vienneDistricts, viennePlaces } from './vienne';
import { budapest, budapestBases, budapestDistricts, budapestPlaces } from './budapest';

export type CapitalBundle = { city: City; places: Place[]; districts: District[]; bases: { name: string; lat: number; lng: number }[] };

/** Capitales ajoutées en 1.3.0 (fichiers générés). */
export const capitals: CapitalBundle[] = [
  { city: paris, places: parisPlaces, districts: parisDistricts, bases: parisBases },
  { city: londres, places: londresPlaces, districts: londresDistricts, bases: londresBases },
  { city: rome, places: romePlaces, districts: romeDistricts, bases: romeBases },
  { city: madrid, places: madridPlaces, districts: madridDistricts, bases: madridBases },
  { city: lisbonne, places: lisbonnePlaces, districts: lisbonneDistricts, bases: lisbonneBases },
  { city: berlin, places: berlinPlaces, districts: berlinDistricts, bases: berlinBases },
  { city: amsterdam, places: amsterdamPlaces, districts: amsterdamDistricts, bases: amsterdamBases },
  { city: bruxelles, places: bruxellesPlaces, districts: bruxellesDistricts, bases: bruxellesBases },
  { city: vienne, places: viennePlaces, districts: vienneDistricts, bases: vienneBases },
  { city: budapest, places: budapestPlaces, districts: budapestDistricts, bases: budapestBases },
];
