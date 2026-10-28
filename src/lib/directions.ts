import { Platform } from 'react-native';

type Dest = { lat: number; lng: number; name: string };

/**
 * Itinéraire vers un lieu : Plans sur iPhone, Google Maps ailleurs (gratuit, décision étape 2).
 * `transit` : en transports en commun (tram, métro), conseillé quand l'étape est loin.
 */
export function directionsUrl(place: Dest, os: string = Platform.OS, mode: 'walk' | 'transit' = 'walk'): string {
  const dest = `${place.lat},${place.lng}`;
  if (os === 'ios') return `https://maps.apple.com/?daddr=${dest}&dirflg=${mode === 'transit' ? 'r' : 'w'}&q=${encodeURIComponent(place.name)}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=${mode === 'transit' ? 'transit' : 'walking'}`;
}
