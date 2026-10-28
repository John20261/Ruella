import type { LatLng } from '@/lib/geo';
import { distanceM } from '@/lib/geo';

/** Quartiers d'une ville : donnent un nom aux journées et un tampon au passeport. */
export type District = LatLng & { id: string; cityId: string; name: string; short: string };

export const districts: District[] = [
  { id: 'prg-stare-mesto', cityId: 'prague', name: 'Vieille-Ville', short: 'Staré Město', lat: 50.0868, lng: 14.4205 },
  { id: 'prg-josefov', cityId: 'prague', name: 'Josefov', short: 'Josefov', lat: 50.0900, lng: 14.4185 },
  { id: 'prg-mala-strana', cityId: 'prague', name: 'Malá Strana', short: 'Malá Strana', lat: 50.0875, lng: 14.4040 },
  { id: 'prg-hradcany', cityId: 'prague', name: 'Hradčany', short: 'Hradčany', lat: 50.0895, lng: 14.3950 },
  { id: 'prg-kampa', cityId: 'prague', name: 'Kampa', short: 'Kampa', lat: 50.0845, lng: 14.4085 },
  { id: 'prg-petrin', cityId: 'prague', name: 'Petřín', short: 'Petřín', lat: 50.0820, lng: 14.3965 },
  { id: 'prg-nove-mesto', cityId: 'prague', name: 'Nouvelle-Ville', short: 'Nové Město', lat: 50.0805, lng: 14.4235 },
  { id: 'prg-vysehrad', cityId: 'prague', name: 'Vyšehrad', short: 'Vyšehrad', lat: 50.0650, lng: 14.4185 },
  { id: 'prg-letna', cityId: 'prague', name: 'Letná', short: 'Letná', lat: 50.0960, lng: 14.4200 },
  { id: 'prg-holesovice', cityId: 'prague', name: 'Holešovice', short: 'Holešovice', lat: 50.1035, lng: 14.4400 },
  { id: 'prg-troja', cityId: 'prague', name: 'Troja', short: 'Troja', lat: 50.1160, lng: 14.4100 },
  { id: 'prg-karlin', cityId: 'prague', name: 'Karlín', short: 'Karlín', lat: 50.0905, lng: 14.4510 },
  { id: 'prg-zizkov', cityId: 'prague', name: 'Žižkov', short: 'Žižkov', lat: 50.0820, lng: 14.4500 },
  { id: 'prg-vinohrady', cityId: 'prague', name: 'Vinohrady', short: 'Vinohrady', lat: 50.0740, lng: 14.4400 },
  { id: 'prg-smichov', cityId: 'prague', name: 'Smíchov', short: 'Smíchov', lat: 50.0730, lng: 14.4050 },

  { id: 'tls-capitole', cityId: 'toulouse', name: 'Capitole', short: 'Capitole', lat: 43.6045, lng: 1.4433 },
  { id: 'tls-saint-sernin', cityId: 'toulouse', name: 'Saint-Sernin', short: 'Saint-Sernin', lat: 43.6085, lng: 1.4415 },
  { id: 'tls-daurade', cityId: 'toulouse', name: 'Daurade', short: 'Daurade', lat: 43.6025, lng: 1.4385 },
  { id: 'tls-carmes', cityId: 'toulouse', name: 'Carmes', short: 'Carmes', lat: 43.5975, lng: 1.4445 },
  { id: 'tls-saint-etienne', cityId: 'toulouse', name: 'Saint-Étienne', short: 'Saint-Étienne', lat: 43.5990, lng: 1.4505 },
  { id: 'tls-saint-georges', cityId: 'toulouse', name: 'Saint-Georges', short: 'Saint-Georges', lat: 43.6020, lng: 1.4475 },
  { id: 'tls-saint-cyprien', cityId: 'toulouse', name: 'Saint-Cyprien', short: 'Saint-Cyprien', lat: 43.5975, lng: 1.4305 },
  { id: 'tls-jardins', cityId: 'toulouse', name: 'Grand-Rond', short: 'Grand-Rond', lat: 43.5935, lng: 1.4505 },
  { id: 'tls-matabiau', cityId: 'toulouse', name: 'Matabiau', short: 'Matabiau', lat: 43.6085, lng: 1.4520 },
  { id: 'tls-compans', cityId: 'toulouse', name: 'Compans-Caffarelli', short: 'Compans', lat: 43.6110, lng: 1.4335 },
  { id: 'tls-amidonniers', cityId: 'toulouse', name: 'Amidonniers', short: 'Amidonniers', lat: 43.6095, lng: 1.4225 },
  { id: 'tls-saint-aubin', cityId: 'toulouse', name: 'Saint-Aubin', short: 'Saint-Aubin', lat: 43.6025, lng: 1.4560 },
  { id: 'tls-montaudran', cityId: 'toulouse', name: 'Montaudran', short: 'Montaudran', lat: 43.5735, lng: 1.4780 },
  { id: 'tls-cite-espace', cityId: 'toulouse', name: "Cité de l'espace", short: 'Cité espace', lat: 43.5870, lng: 1.4930 },
  { id: 'tls-blagnac', cityId: 'toulouse', name: 'Blagnac', short: 'Blagnac', lat: 43.6600, lng: 1.3650 },
];

export function cityDistricts(cityId: string): District[] {
  return districts.filter((d) => d.cityId === cityId);
}

/** Quartier le plus proche d'un point. */
export function districtOf(cityId: string, p: LatLng): District | undefined {
  let best: District | undefined;
  let bestD = Infinity;
  for (const d of cityDistricts(cityId)) {
    const dist = distanceM(d, p);
    if (dist < bestD) {
      bestD = dist;
      best = d;
    }
  }
  return best;
}

/** Nom d'une journée : ses deux quartiers dominants (« Malá Strana & Hradčany »). */
export function dayTitle(cityId: string, points: LatLng[]): string {
  const counts = new Map<string, number>();
  for (const p of points) {
    const d = districtOf(cityId, p);
    if (d) counts.set(d.name, (counts.get(d.name) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([n]) => n);
  return top.length ? top.join(' & ') : 'Journée libre';
}
