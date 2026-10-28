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
  { id: 'prg-karlin', cityId: 'prague', name: 'Karlín & Vítkov', short: 'Karlín', lat: 50.0905, lng: 14.4510 },
  { id: 'prg-zizkov', cityId: 'prague', name: 'Žižkov', short: 'Žižkov', lat: 50.0820, lng: 14.4500 },
  { id: 'prg-vinohrady', cityId: 'prague', name: 'Vinohrady', short: 'Vinohrady', lat: 50.0740, lng: 14.4400 },
  { id: 'prg-smichov', cityId: 'prague', name: 'Smíchov', short: 'Smíchov', lat: 50.0730, lng: 14.4050 },
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
