import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import type { LatLng } from './geo';

/**
 * Position de l'utilisateur, uniquement quand l'écran qui la demande est affiché.
 * Elle ne quitte jamais le téléphone : elle sert à afficher le point bleu et à valider sur place.
 * Mise à jour économe (tous les 25 m, précision équilibrée) pour préserver la batterie.
 */
export function useUserLocation(enabled: boolean): LatLng | null {
  const [pos, setPos] = useState<LatLng | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;
    (async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (!perm.granted) return;
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 25, timeInterval: 15000 },
          (l) => !cancelled && setPos({ lat: l.coords.latitude, lng: l.coords.longitude }),
        );
      } catch {
        // Service de localisation indisponible : la carte s'affiche sans le point bleu.
      }
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [enabled]);

  return pos;
}

/** Demande l'autorisation (au premier usage d'une fonction qui en a besoin). */
export async function askLocation(): Promise<boolean> {
  try {
    const r = await Location.requestForegroundPermissionsAsync();
    return r.granted;
  } catch {
    return false;
  }
}

export async function hasLocation(): Promise<boolean> {
  try {
    return (await Location.getForegroundPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

export async function currentPosition(): Promise<LatLng | null> {
  try {
    if (!(await askLocation())) return null;
    const l = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: l.coords.latitude, lng: l.coords.longitude };
  } catch {
    return null;
  }
}
