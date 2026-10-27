import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { TileTone } from '@/theme/tokens';
import { fonts, radius } from '@/theme/tokens';
import { RText } from './r-text';

/** Tuile KPI colorée (héritée de la direction C). */
export function Tile({
  label,
  value,
  detail,
  tone,
  style,
}: {
  label: string;
  value: string;
  detail?: string;
  tone: TileTone;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`${label} : ${value}${detail ? `, ${detail}` : ''}`}
      style={[styles.tile, { backgroundColor: tone.bg }, style]}>
      <RText style={styles.label} color={tone.ink}>
        {label}
      </RText>
      <RText style={styles.value}>{value}</RText>
      {detail ? (
        <RText style={styles.label} color={tone.ink}>
          {detail}
        </RText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, borderRadius: radius.tile, paddingHorizontal: 12, paddingVertical: 10, gap: 2 },
  label: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 15 },
  value: { fontFamily: fonts.heavy, fontSize: 20, lineHeight: 25 },
});
