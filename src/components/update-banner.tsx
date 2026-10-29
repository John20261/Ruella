import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RText } from '@/components/ui/r-text';
import { useRuellaTheme } from '@/theme/theme-context';
import { fonts, radius, space } from '@/theme/tokens';

/**
 * Cherche une mise à jour au démarrage ; si elle est téléchargée, propose de redémarrer tout de suite
 * (sinon elle ne s'appliquerait qu'au prochain lancement, ce qui prête à confusion).
 */
export function UpdateBanner() {
  const { colors } = useRuellaTheme();
  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    let cancelled = false;
    (async () => {
      try {
        const check = await Updates.checkForUpdateAsync();
        if (!check.isAvailable) return;
        const res = await Updates.fetchUpdateAsync();
        if (res.isNew && !cancelled) setReady(true);
      } catch {
        // Pas de réseau : on réessaiera au prochain lancement.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;
  return (
    <Animated.View entering={FadeInUp} exiting={FadeOutUp} style={[styles.wrap, { top: insets.top + space.s }]}>
      <Pressable
        onPress={() => Updates.reloadAsync().catch(() => {})}
        accessibilityRole="button"
        accessibilityLabel="Nouvelle version prête. Toucher pour redémarrer Ruella"
        style={[styles.banner, { backgroundColor: colors.celebrate }]}>
        <RText style={styles.text} color={colors.onCelebrate}>
          Nouvelle version prête · toucher pour l’installer
        </RText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: space.l, right: space.l, zIndex: 100 },
  banner: { borderRadius: radius.pill, paddingVertical: 12, paddingHorizontal: space.l, alignItems: 'center' },
  text: { fontFamily: fonts.bold, fontSize: 14 },
});
