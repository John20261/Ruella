import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { useRuellaTheme } from '@/theme/theme-context';
import { touch } from '@/theme/tokens';

export function BackButton({ onDark, onPress }: { onDark?: boolean; onPress?: () => void }) {
  const { colors } = useRuellaTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Retour"
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: onDark ? 'rgba(14,17,22,0.55)' : colors.surface,
          borderColor: onDark ? 'rgba(255,255,255,0.25)' : colors.border,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
      ]}>
      <Icon name="left" size={22} color={onDark ? '#FFFFFF' : colors.text} strokeWidth={2.4} />
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
});
