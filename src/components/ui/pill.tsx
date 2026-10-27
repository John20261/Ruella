import { StyleSheet, View } from 'react-native';

import type { TileTone } from '@/theme/tokens';
import { fonts, radius } from '@/theme/tokens';
import { RText } from './r-text';

export function Pill({ label, tone }: { label: string; tone: TileTone }) {
  return (
    <View style={[styles.pill, { backgroundColor: tone.bg }]}>
      <RText style={styles.text} color={tone.ink}>
        {label}
      </RText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, alignSelf: 'flex-start' },
  text: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 16 },
});
