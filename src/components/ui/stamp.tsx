import { StyleSheet, View } from 'react-native';

import { fonts } from '@/theme/tokens';
import { RText } from './r-text';

/**
 * Tampon de passeport (direction B) : la forme des badges.
 * `earned` à false = emplacement en pointillés, encore à gagner.
 */
export function Stamp({
  place,
  title,
  date,
  color,
  earned = true,
  size = 96,
  tilt = -8,
  shape = 'round',
  mutedColor,
}: {
  place: string;
  title: string;
  date?: string;
  color: string;
  earned?: boolean;
  size?: number;
  tilt?: number;
  shape?: 'round' | 'square';
  mutedColor: string;
}) {
  const r = shape === 'round' ? size / 2 : size * 0.24;
  const label = `${earned ? 'Tampon obtenu' : 'Tampon à gagner'} : ${title}, ${place}${date ? `, le ${date}` : ''}`;

  if (!earned) {
    return (
      <View
        accessible
        accessibilityLabel={label}
        style={[styles.center, { width: size, height: size, borderRadius: r, borderWidth: 2, borderStyle: 'dashed', borderColor: mutedColor }]}>
        <RText style={[styles.title, { fontSize: size * 0.14 }]} color={mutedColor}>
          {title}
        </RText>
      </View>
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[styles.center, { width: size, height: size, borderRadius: r, borderWidth: 3, borderColor: color, transform: [{ rotate: `${tilt}deg` }] }]}>
      <View style={[styles.center, { width: size - 14, height: size - 14, borderRadius: r, borderWidth: 1, borderColor: color, gap: 2 }]}>
        <RText
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          style={[styles.place, { fontSize: placeFontSize(place, size), letterSpacing: 0.6, maxWidth: size - 30, textAlign: 'center' }]}
          color={color}>
          {place.toUpperCase()}
        </RText>
        <RText style={[styles.title, { fontSize: size * 0.15 }]} color={color}>
          {title}
        </RText>
        {date ? (
          <RText style={[styles.place, { fontSize: Math.max(8, size * 0.085) }]} color={color}>
            {date}
          </RText>
        ) : null}
      </View>
    </View>
  );
}

/** Taille du nom de lieu pour qu'il tienne sur une ligne dans l'anneau, quelle que soit sa longueur. */
export function placeFontSize(place: string, size: number): number {
  const available = size - 30;
  const fitted = available / (place.length * 0.78);
  return Math.max(6.5, Math.min(size * 0.08, fitted));
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  place: { fontFamily: fonts.heavy, letterSpacing: 1.2 },
  title: { fontFamily: fonts.display, textAlign: 'center', lineHeight: undefined, paddingHorizontal: 6 },
});
