import { Platform } from 'react-native';

/** Itinéraire à pied vers un lieu : Plans sur iPhone, Google Maps ailleurs (gratuit, décision étape 2). */
export function directionsUrl(place: { lat: number; lng: number; name: string }, os: string = Platform.OS): string {
  const dest = `${place.lat},${place.lng}`;
  if (os === 'ios') return `https://maps.apple.com/?daddr=${dest}&dirflg=w&q=${encodeURIComponent(place.name)}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=walking`;
}
