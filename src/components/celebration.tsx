import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { RText } from '@/components/ui/r-text';
import { Stamp } from '@/components/ui/stamp';
import { useRuellaTheme } from '@/theme/theme-context';
import { fonts, radius, space } from '@/theme/tokens';

type Toast = { id: number; points: number; label: string };
type BadgeWin = { title: string; hint: string; shape: 'round' | 'square' };

let push: ((t: Omit<Toast, 'id'>) => void) | null = null;
let pushBadge: ((b: BadgeWin) => void) | null = null;

/** Petite bulle « +150 pts » après avoir coché une étape. */
export function celebratePoints(points: number, label: string) {
  push?.({ points, label });
}

/** Grande célébration quand un badge est débloqué. */
export function celebrateBadge(b: BadgeWin) {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  pushBadge?.(b);
}

export function CelebrationHost() {
  const { colors } = useRuellaTheme();
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [badge, setBadge] = useState<BadgeWin | null>(null);

  useEffect(() => {
    let n = 0;
    push = (t) => {
      const id = ++n;
      setToasts((list) => [...list.slice(-2), { ...t, id }]);
      setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 2200);
    };
    pushBadge = (b) => setBadge(b);
    return () => {
      push = null;
      pushBadge = null;
    };
  }, []);

  return (
    <>
      <View pointerEvents="none" style={[styles.toastZone, { top: insets.top + 64 }]}>
        {toasts.map((t) => (
          <Animated.View key={t.id} entering={FadeInDown.springify().damping(14)} exiting={FadeOutUp} style={[styles.toast, { backgroundColor: colors.celebrate }]}>
            <RText style={styles.points} color={colors.onCelebrate}>
              +{t.points} pts
            </RText>
            <RText variant="caption" color={colors.onCelebrate} numberOfLines={1} style={{ flexShrink: 1 }}>
              {t.label}
            </RText>
          </Animated.View>
        ))}
      </View>

      <Modal visible={!!badge} transparent animationType="fade" onRequestClose={() => setBadge(null)}>
        <Pressable style={styles.backdrop} onPress={() => setBadge(null)} accessibilityRole="button" accessibilityLabel="Fermer">
          {badge ? (
            <Animated.View entering={ZoomIn.springify().damping(12)} style={[styles.card, { backgroundColor: colors.paper }]}>
              <RText variant="overline" color="#6B5E44">
                Nouveau tampon
              </RText>
              <Stamp place="Ruella" title={badge.title} color={colors.stamp} size={150} tilt={-6} shape={badge.shape} mutedColor="#9A8F78" />
              <RText variant="place" color="#12212E" style={{ textAlign: 'center' }}>
                {badge.title}
              </RText>
              <RText color="#4A5763" style={{ textAlign: 'center' }}>
                {badge.hint} : bravo, il rejoint votre passeport.
              </RText>
              <Button label="Super !" variant="celebrate" onPress={() => setBadge(null)} style={{ alignSelf: 'stretch' }} />
            </Animated.View>
          ) : null}
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  toastZone: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: space.s, zIndex: 50 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: space.s, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, maxWidth: '86%' },
  points: { fontFamily: fonts.heavy, fontSize: 16 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: space.xl },
  card: { borderRadius: radius.sheet, padding: space.xl, alignItems: 'center', gap: space.m, width: '100%', maxWidth: 360 },
});
