import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { RText } from '@/components/ui/r-text';
import { useRuellaTheme } from '@/theme/theme-context';
import { fonts, touch } from '@/theme/tokens';

export function BackButton({ onDark }: { onDark?: boolean }) {
  const { colors } = useRuellaTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Retour"
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      style={[
        styles.btn,
        { backgroundColor: onDark ? 'rgba(14,17,22,0.55)' : colors.surface, borderColor: onDark ? 'rgba(255,255,255,0.25)' : colors.border },
      ]}>
      <RText style={styles.chevron} color={onDark ? '#FFFFFF' : colors.text}>
        ‹
      </RText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: touch.min,
    height: touch.min,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 30, marginTop: -2 },
});
