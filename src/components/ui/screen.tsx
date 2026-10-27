import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRuellaTheme } from '@/theme/theme-context';
import { space } from '@/theme/tokens';

/** Écran standard : fond du thème, zone sûre, défilement, place pour la barre d'onglets. */
export function Screen({ children }: { children: ReactNode }) {
  const { colors } = useRuellaTheme();
  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: space.l, paddingTop: space.xl, paddingBottom: 120, gap: space.m },
});
