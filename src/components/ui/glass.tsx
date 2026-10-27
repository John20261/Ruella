import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useRuellaTheme } from '@/theme/theme-context';
import { radius } from '@/theme/tokens';

/**
 * Panneau en verre (direction A).
 * iOS 26 : vrai Liquid Glass. Ailleurs : flou du système + voile de la couleur du thème.
 */
export function Glass({
  children,
  style,
  rounded = radius.sheet,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  rounded?: number;
}) {
  const { colors, scheme } = useRuellaTheme();

  if (isLiquidGlassAvailable()) {
    return (
      <GlassView glassEffectStyle="regular" style={[{ borderRadius: rounded, overflow: 'hidden' }, style]}>
        {children}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        { borderRadius: rounded, overflow: 'hidden', borderWidth: 1, borderColor: colors.glassBorder },
        style,
      ]}>
      <BlurView intensity={40} tint={scheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glass }]} />
      {children}
    </View>
  );
}
