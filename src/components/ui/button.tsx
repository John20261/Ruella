import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useRuellaTheme } from '@/theme/theme-context';
import { fonts, radius, touch } from '@/theme/tokens';
import { RText } from './r-text';

type Variant = 'primary' | 'secondary' | 'celebrate' | 'ghost';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: ReactNode;
  /** Retour haptique (cocher, valider) */
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Button({ label, onPress, variant = 'primary', icon, haptic, style, accessibilityLabel }: Props) {
  const { colors } = useRuellaTheme();

  const look = {
    primary: { bg: colors.action, fg: colors.onAction, border: 'transparent', r: radius.button },
    secondary: { bg: 'transparent', fg: colors.text, border: colors.text, r: radius.button },
    celebrate: { bg: colors.celebrate, fg: colors.onCelebrate, border: 'transparent', r: radius.pill },
    ghost: { bg: 'transparent', fg: colors.text, border: 'transparent', r: radius.button },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={() => {
        if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: look.bg,
          borderColor: look.border,
          borderRadius: look.r,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}>
      {icon ? <View>{icon}</View> : null}
      <RText style={styles.label} color={look.fg}>
        {label}
      </RText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touch.primary,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
  },
  label: { fontFamily: fonts.bold, fontSize: 16 },
});
