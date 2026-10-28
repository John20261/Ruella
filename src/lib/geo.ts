/** Outils géographiques purs (aucun appel réseau, aucune position envoyée). */

export type LatLng = { lat: number; lng: number };

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

/** Distance à vol d'oiseau en mètres. */
export function distanceM(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type LegMode = 'walk' | 'transit';

export type Leg = {
  mode: LegMode;
  /** Distance estimée par les rues (vol d'oiseau × 1,3). */
  meters: number;
  minutes: number;
};

/** Au-delà de cette distance par les rues, on conseille tram ou métro. */
export const TRANSIT_FROM_M = 2200;
const WALK_M_PER_MIN = 75; // 4,5 km/h, rythme famille

/** Trajet estimé entre deux points : marche, ou transports en commun si c'est loin. */
export function leg(a: LatLng, b: LatLng): Leg {
  const meters = Math.round(distanceM(a, b) * 1.3);
  if (meters >= TRANSIT_FROM_M) {
    // attente + marche jusqu'aux arrêts + trajet à ~18 km/h
    return { mode: 'transit', meters, minutes: Math.round(12 + meters / 300) };
  }
  return { mode: 'walk', meters, minutes: Math.max(1, Math.round(meters / WALK_M_PER_MIN)) };
}

export function formatMeters(m: number): string {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}

export function centroid(points: LatLng[]): LatLng {
  if (points.length === 0) return { lat: 0, lng: 0 };
  return {
    lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
    lng: points.reduce((s, p) => s + p.lng, 0) / points.length,
  };
}
