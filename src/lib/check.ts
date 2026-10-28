import * as Haptics from 'expo-haptics';

import { celebrateBadge, celebratePoints } from '@/components/celebration';
import { getPlace } from '@/lib/catalog';
import { computeBadges, pointsFor } from '@/lib/rewards';
import { actions, getState } from '@/store/app-store';

function earnedIds(): Set<string> {
  return new Set(computeBadges(getState().visits, getPlace).filter((b) => b.earned).map((b) => b.id));
}

function reward(placeId: string, auto: boolean, before: Set<string>) {
  const place = getPlace(placeId);
  if (!place) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  celebratePoints(pointsFor(place, auto), auto ? `${place.name} · validé sur place` : place.name);
  const fresh = computeBadges(getState().visits, getPlace).find((b) => b.earned && !before.has(b.id));
  if (fresh) setTimeout(() => celebrateBadge({ title: fresh.title, hint: fresh.hint, shape: fresh.shape }), 700);
}

/** Cocher (ou décocher) une étape du séjour, avec points, retour haptique et badges. */
export function checkStop(tripId: string, dayIndex: number, stopId: string, placeId: string, auto = false) {
  const before = earnedIds();
  const checked = actions.toggleStop(tripId, dayIndex, stopId, auto);
  if (checked) reward(placeId, auto, before);
  else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Cocher un lieu en dehors d'un séjour (depuis sa fiche). */
export function checkPlace(placeId: string) {
  const before = earnedIds();
  actions.logVisit(placeId);
  reward(placeId, false, before);
}
