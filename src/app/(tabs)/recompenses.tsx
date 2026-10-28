import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { RText } from '@/components/ui/r-text';
import { Screen } from '@/components/ui/screen';
import { Stamp } from '@/components/ui/stamp';
import { Tile } from '@/components/ui/tile';
import { getPlace } from '@/lib/catalog';
import { computeBadges, computeStamps, computeTotals, levelOf, pointsFor } from '@/lib/rewards';
import { useApp } from '@/store/app-store';
import { useRuellaTheme } from '@/theme/theme-context';
import { radius, space } from '@/theme/tokens';

const STAMP_COLORS = ['#C8322B', '#1F4E8C', '#8A5A16', '#1B6B47', '#6B3FA0'];
const short = (iso?: string) => (iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(2, 4)}` : undefined);

export default function RecompensesScreen() {
  const { colors } = useRuellaTheme();
  const visits = useApp((s) => s.visits);
  const totals = computeTotals(visits, getPlace);
  const level = levelOf(totals.points);
  const badges = computeBadges(visits, getPlace);
  const stamps = computeStamps('prague', visits, getPlace);
  const muted = '#9A8F78';

  const fill = useSharedValue(0);
  useEffect(() => {
    fill.value = withDelay(200, withSpring(level.progress, { damping: 16 }));
  }, [level.progress, fill]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${Math.max(3, fill.value * 100)}%` }));

  const recent = [...visits].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
  const earnedStamps = stamps.filter((s) => s.earned).length;

  return (
    <Screen>
      <RText variant="title">Récompenses</RText>

      <Animated.View entering={FadeInDown} style={[styles.level, { backgroundColor: colors.tiles.lilac.bg }]}>
        <View style={styles.row}>
          <View>
            <RText variant="overline" color={colors.tiles.lilac.ink}>
              Niveau {level.index + 1}
            </RText>
            <RText variant="place" style={{ fontSize: 28 }}>
              {level.name}
            </RText>
          </View>
          <RText variant="title" style={{ fontSize: 28 }}>
            {totals.points.toLocaleString('fr-FR')}
            <RText variant="heading" color={colors.tiles.lilac.ink}>
              {' '}pts
            </RText>
          </RText>
        </View>
        <View style={[styles.track, { backgroundColor: colors.border }]}>
          <Animated.View style={[styles.fill, { backgroundColor: colors.tiles.lilac.ink }, fillStyle]} />
        </View>
        <RText variant="caption" color={colors.tiles.lilac.ink}>
          {level.next ? `Encore ${level.toNext.toLocaleString('fr-FR')} pts pour devenir ${level.next}` : 'Niveau maximum : vous êtes une légende.'}
        </RText>
      </Animated.View>

      <View style={styles.row}>
        <Tile label="Étapes" value={String(totals.visits)} tone={colors.tiles.blue} />
        <Tile label="Pépites" value={String(totals.gems)} tone={colors.tiles.gold} />
        <Tile label="À pied" value={`${totals.km.toString().replace('.', ',')} km`} tone={colors.tiles.mint} />
      </View>

      <View style={[styles.passport, { backgroundColor: colors.paper }]}>
        <View style={styles.row}>
          <RText variant="place" style={{ fontSize: 20 }} color="#12212E">
            Passeport · Prague
          </RText>
          <RText variant="caption" color="#6B5E44">
            {earnedStamps} quartier{earnedStamps > 1 ? 's' : ''} sur {stamps.length}
          </RText>
        </View>
        <View style={styles.stamps}>
          {stamps.map((s, i) => (
            <Stamp
              key={s.districtId}
              place={s.name}
              title={s.earned ? `${s.count} étape${s.count > 1 ? 's' : ''}` : s.name}
              date={short(s.at)}
              color={STAMP_COLORS[i % STAMP_COLORS.length]}
              earned={s.earned}
              shape={i % 2 ? 'square' : 'round'}
              tilt={((i * 7) % 15) - 7}
              size={92}
              mutedColor={muted}
            />
          ))}
        </View>
      </View>

      <RText variant="heading" style={{ marginTop: space.s }}>
        Badges
      </RText>
      <View style={styles.badges}>
        {badges.map((b, i) => (
          <Animated.View key={b.id} entering={FadeInDown.delay(i * 30)} style={[styles.badge, { backgroundColor: colors.surface }]}>
            <Stamp place="Ruella" title={b.title} date={short(b.earnedAt)} color={STAMP_COLORS[i % STAMP_COLORS.length]} earned={b.earned} shape={b.shape} size={78} tilt={b.earned ? -6 : 0} mutedColor={colors.textMuted} />
            <RText variant="bodyStrong" style={{ textAlign: 'center', fontSize: 13, lineHeight: 17 }} numberOfLines={2}>
              {b.title}
            </RText>
            <RText variant="caption" muted style={{ textAlign: 'center' }}>
              {b.earned ? b.hint : `${b.count}/${b.goal} · ${b.hint}`}
            </RText>
          </Animated.View>
        ))}
      </View>

      {recent.length ? (
        <>
          <RText variant="heading" style={{ marginTop: space.s }}>
            Dernières étapes
          </RText>
          <View style={[styles.list, { backgroundColor: colors.surface }]}>
            {recent.map((v, i) => {
              const p = getPlace(v.placeId);
              if (!p) return null;
              return (
                <Pressable
                  key={v.id}
                  onPress={() => router.push({ pathname: '/lieu/[id]', params: { id: p.id } })}
                  accessibilityRole="button"
                  style={[styles.item, i < recent.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                  <Icon name={p.kind === 'gem' ? 'gem' : 'check'} size={18} color={p.kind === 'gem' ? colors.gem : colors.success} />
                  <RText style={{ flex: 1 }} numberOfLines={1}>
                    {p.name}
                  </RText>
                  <RText variant="caption" muted>
                    +{pointsFor(p, v.auto)}
                  </RText>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : (
        <RText variant="caption" muted style={{ textAlign: 'center' }}>
          Cochez votre première étape : chaque visite rapporte des points, chaque quartier un tampon.
        </RText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s },
  level: { borderRadius: radius.card + 6, padding: space.l, gap: space.s },
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5 },
  passport: { borderRadius: radius.card + 6, padding: space.l, gap: space.m },
  stamps: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.m },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  badge: { width: '31.5%', flexGrow: 1, borderRadius: radius.tile, padding: space.m, alignItems: 'center', gap: 4 },
  list: { borderRadius: radius.card, paddingHorizontal: space.l },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.m, minHeight: 48 },
});
