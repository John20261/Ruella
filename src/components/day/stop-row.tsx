import { Image } from 'expo-image';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { RText } from '@/components/ui/r-text';
import type { Place } from '@/content/types';
import { formatDuration, kindLabel } from '@/lib/catalog';
import { directionsUrl } from '@/lib/directions';
import { formatMeters } from '@/lib/geo';
import type { Stop } from '@/store/types';
import { useRuellaTheme } from '@/theme/theme-context';
import { fonts, radius, space } from '@/theme/tokens';

type Props = {
  stop: Stop;
  place: Place;
  index: number;
  isNext: boolean;
  isLast: boolean;
  onOpen: () => void;
  onCheck: () => void;
  onMore: () => void;
};

/** Une étape sur la « ligne de métro » de la journée (direction B). */
export function StopRow({ stop, place, index, isNext, isLast, onOpen, onCheck, onMore }: Props) {
  const { colors } = useRuellaTheme();
  const done = stop.status === 'done';
  const skipped = stop.status === 'skipped';
  const tone = place.kind === 'gem' ? colors.gem : place.kind === 'restaurant' ? colors.tiles.mint.ink : colors.accent;
  const lineColor = done ? colors.success : colors.border;

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(320)} layout={LinearTransition.springify().damping(18)}>
      {stop.leg && !skipped ? <LegRow stop={stop} place={place} lineColor={lineColor} /> : null}
      <View style={styles.row}>
        <View style={styles.rail}>
          <View style={[styles.node, { backgroundColor: done ? colors.success : skipped ? colors.surfaceAlt : place.kind === 'gem' ? 'transparent' : tone }]}>
            {place.kind === 'gem' && !done && !skipped ? <View style={[styles.diamond, { backgroundColor: tone }]} /> : null}
            {done ? (
              <Icon name="check" size={16} color={colors.background} strokeWidth={3} />
            ) : (
              <RText style={styles.nodeText} color={skipped ? colors.textMuted : place.kind === 'gem' ? colors.pills.gem.ink : colors.background}>
                {index + 1}
              </RText>
            )}
          </View>
          {!isLast ? <View style={[styles.line, { backgroundColor: lineColor }]} /> : null}
        </View>

        <Pressable
          onPress={onOpen}
          onLongPress={onMore}
          accessibilityRole="button"
          accessibilityLabel={`${stop.time}, ${place.name}, ${kindLabel[place.kind]}${done ? ', fait' : skipped ? ', passé' : ''}`}
          accessibilityHint="Ouvre la fiche. Appui long : options"
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: isNext ? colors.surfaceAlt : colors.surface,
              borderColor: isNext ? tone : 'transparent',
              opacity: skipped ? 0.5 : pressed ? 0.88 : 1,
            },
          ]}>
          {place.photo && !skipped ? <Image source={{ uri: place.photo.url }} style={styles.thumb} contentFit="cover" transition={200} cachePolicy="disk" /> : null}
          <View style={{ flex: 1, gap: 2 }}>
            <View style={styles.meta}>
              <RText style={styles.time} color={isNext ? tone : colors.textMuted}>
                {stop.time.replace(':', 'h')}
              </RText>
              <RText variant="caption" muted numberOfLines={1} style={{ flexShrink: 1 }}>
                {place.kind === 'gem' ? 'Pépite' : kindLabel[place.kind]} · {formatDuration(place.durationMin)}
                {place.priceLevel ? ` · ${place.priceLevel}` : ''}
              </RText>
            </View>
            <RText variant="place" style={[styles.name, skipped && { textDecorationLine: 'line-through' }]} numberOfLines={2}>
              {place.name}
            </RText>
            {!done && !skipped ? (
              <RText variant="caption" muted numberOfLines={2}>
                {place.hook}
              </RText>
            ) : null}
          </View>
          <View style={styles.actions}>
            {!skipped ? (
              <Pressable
                onPress={onCheck}
                hitSlop={6}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done }}
                accessibilityLabel={done ? `Décocher ${place.name}` : `Cocher ${place.name}`}
                style={[styles.check, { borderColor: done ? colors.success : tone, backgroundColor: done ? colors.success : 'transparent' }]}>
                {done ? <Icon name="check" size={20} color={colors.background} strokeWidth={3} /> : null}
              </Pressable>
            ) : null}
            <Pressable onPress={onMore} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Options pour ${place.name}`} style={styles.more}>
              <Icon name="more" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function LegRow({ stop, place, lineColor }: { stop: Stop; place: Place; lineColor: string }) {
  const { colors } = useRuellaTheme();
  const l = stop.leg!;
  const transit = l.mode === 'transit';
  return (
    <View style={styles.legRow}>
      <View style={styles.rail}>
        <View style={[styles.legLine, { backgroundColor: lineColor }, transit && styles.dashed]} />
      </View>
      <View style={styles.legInfo}>
        <Icon name={transit ? 'tram' : 'walk'} size={16} color={transit ? colors.accent : colors.textMuted} />
        <RText variant="caption" muted>
          {transit ? `Tram ou métro conseillé · environ ${l.minutes} min · ${formatMeters(l.meters)}` : `À pied · ${l.minutes} min · ${formatMeters(l.meters)}`}
        </RText>
        {transit ? (
          <Pressable
            onPress={() => Linking.openURL(directionsUrl(place, undefined, 'transit'))}
            accessibilityRole="link"
            accessibilityLabel={`Itinéraire en transports vers ${place.name}`}
            hitSlop={10}>
            <RText variant="caption" color={colors.accent} style={{ fontFamily: fonts.bold }}>
              Itinéraire
            </RText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const RAIL = 44;
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch' },
  rail: { width: RAIL, alignItems: 'center' },
  node: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  diamond: { position: 'absolute', width: 22, height: 22, borderRadius: 5, transform: [{ rotate: '45deg' }] },
  nodeText: { fontFamily: fonts.heavy, fontSize: 13 },
  line: { width: 3, flex: 1, borderRadius: 2, marginTop: 4 },
  card: { flex: 1, flexDirection: 'row', gap: space.m, padding: space.m, borderRadius: radius.card, borderWidth: 1.5, marginBottom: 2 },
  thumb: { width: 56, height: 56, borderRadius: 14 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  time: { fontFamily: fonts.heavy, fontSize: 13, lineHeight: 18 },
  name: { fontSize: 19, lineHeight: 23 },
  actions: { alignItems: 'center', justifyContent: 'space-between', gap: space.s },
  check: { width: 40, height: 40, borderRadius: 20, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  more: { width: 40, height: 28, alignItems: 'center', justifyContent: 'center' },
  legRow: { flexDirection: 'row', minHeight: 34 },
  legLine: { width: 3, flex: 1, borderRadius: 2 },
  dashed: { opacity: 0.6 },
  legInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', paddingVertical: 6 },
});
