import { StyleSheet, Text, type TextProps } from 'react-native';

import { useRuellaTheme } from '@/theme/theme-context';
import { fonts } from '@/theme/tokens';

export type RTextVariant =
  | 'place' // Fraunces : noms de lieux, grands chiffres
  | 'placeLarge'
  | 'title' // Inter 800 : titres d'écran
  | 'heading' // Inter 700
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'overline'; // petites capitales espacées

type Props = TextProps & {
  variant?: RTextVariant;
  muted?: boolean;
  color?: string;
};

export function RText({ variant = 'body', muted, color, style, ...rest }: Props) {
  const { colors } = useRuellaTheme();
  return (
    <Text
      maxFontSizeMultiplier={2}
      style={[styles[variant], { color: color ?? (muted ? colors.textMuted : colors.text) }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  placeLarge: { fontFamily: fonts.display, fontSize: 34, lineHeight: 37, letterSpacing: -0.6 },
  place: { fontFamily: fonts.display, fontSize: 26, lineHeight: 29, letterSpacing: -0.4 },
  title: { fontFamily: fonts.heavy, fontSize: 30, lineHeight: 34, letterSpacing: -0.8 },
  heading: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  bodyStrong: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18 },
  overline: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 16, letterSpacing: 0.8, textTransform: 'uppercase' },
});
