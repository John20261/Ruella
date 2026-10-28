import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';

import { getPlaces } from '@/lib/catalog';

/**
 * Hors ligne (lot 3) : fiches, carte et planificateur sont déjà dans l'app.
 * Seules les photos viennent d'Internet : on peut les enregistrer à l'avance sur le téléphone.
 */
const key = (cityId: string) => `ruella.offline.${cityId}`;

export function cityPhotos(cityId: string): string[] {
  return [...new Set(getPlaces(cityId).flatMap((p) => (p.photo ? [p.photo.url] : [])))];
}

export async function offlineDate(cityId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key(cityId));
  } catch {
    return null;
  }
}

export async function downloadCity(cityId: string, onProgress: (done: number, total: number) => void): Promise<boolean> {
  const urls = cityPhotos(cityId);
  let done = 0;
  let ok = true;
  for (let i = 0; i < urls.length; i += 6) {
    const chunk = urls.slice(i, i + 6);
    try {
      const r = await Image.prefetch(chunk, 'disk');
      ok = ok && r !== false;
    } catch {
      ok = false;
    }
    done += chunk.length;
    onProgress(done, urls.length);
  }
  if (ok) await AsyncStorage.setItem(key(cityId), new Date().toISOString()).catch(() => {});
  return ok;
}
