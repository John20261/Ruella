import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getPlace } from '@/lib/catalog';
import type { Trip } from '@/store/types';

/**
 * Notification du matin : programmée sur le téléphone (aucun serveur), à 8 h chaque jour du séjour.
 */
export async function scheduleMorning(trip: Trip | undefined, enabled: boolean): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled || !trip) return true;
    const perm = await Notifications.getPermissionsAsync();
    const granted = perm.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return false;
    if (Platform.OS === 'android') {
      // eslint-disable-next-line import/namespace -- énumération réexportée, non vue par le lint
      await Notifications.setNotificationChannelAsync('matin', { name: 'Programme du matin', importance: Notifications.AndroidImportance.DEFAULT });
    }
    const now = Date.now();
    for (const [i, day] of trip.days.entries()) {
      const at = new Date(`${day.date}T08:00:00`);
      if (at.getTime() <= now) continue;
      const stops = day.stops.filter((s) => s.status !== 'skipped');
      const gems = stops.filter((s) => getPlace(s.placeId)?.kind === 'gem').length;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Jour ${i + 1} · ${day.title}`,
          body: `${stops.length} étapes dont ${gems} pépites. Départ prévu à ${day.startTime.replace(':', ' h ')}.${day.rain ? ' Plan pluie activé.' : ''}`,
          data: { url: '/' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: 'matin' },
      });
    }
    return true;
  } catch {
    return false;
  }
}
