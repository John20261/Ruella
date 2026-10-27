import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { Pill } from '@/components/ui/pill';
import { RText } from '@/components/ui/r-text';
import { contentProgress, formatDuration, getCity, getPlaces, kindGroups, kindLabel } from '@/lib/catalog';
import { useRuellaTheme } from '@/theme/theme-context';
import { fonts, radius, space, touch } from '@/theme/tokens';

type GroupKey = (typeof kindGroups)[number]['key'];

export default function VilleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useRuellaTheme();
  const [group, setGroup] = useState<GroupKey>('visites');

  const city = getCity(id);
  if (!city) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
        <RText>Ville introuvable.</RText>
      </SafeAreaView>
    );
  }

  const progress = contentProgress(city.id);
  const kinds = kindGroups.find((g) => g.key === group)?.kinds ?? [];
  const places = getPlaces(city.id)
    .filter((p) => kinds.includes(p.kind))
    .sort((a, b) => Number(!!b.mustSee) - Number(!!a.mustSee) || a.name.localeCompare(b.name, 'fr'));

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackButton />
        <View style={{ gap: 4 }}>
          <RText variant="overline" muted>
            Explorer
          </RText>
          <RText variant="placeLarge">{city.name}</RText>
          <RText variant="caption" muted>
            {progress.visites} visites · {progress.pepites} pépites · {progress.restaurants} restaurants
          </RText>
        </View>

        <View accessibilityRole="tablist" style={[styles.segment, { backgroundColor: colors.surface }]}>
          {kindGroups.map((g) => {
            const active = g.key === group;
            return (
              <Pressable
                key={g.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setGroup(g.key)}
                style={[styles.segmentItem, active && { backgroundColor: colors.action }]}>
                <RText style={styles.segmentText} color={active ? colors.onAction : colors.textMuted}>
                  {g.label}
                </RText>
              </Pressable>
            );
          })}
        </View>

        {places.map((p) => {
          const tone = p.kind === 'gem' ? colors.pills.gem : p.kind === 'restaurant' ? colors.tiles.mint : colors.tiles.blue;
          return (
            <Pressable
                key={p.id}
                onPress={() => router.push({ pathname: '/lieu/[id]', params: { id: p.id } })}
                accessibilityRole="link"
                accessibilityLabel={`${p.name}. ${p.hook}`}
                style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 }]}>
                <View style={[styles.mark, { backgroundColor: tone.bg }]}>
                  {p.photo ? (
                    <Image source={{ uri: p.photo.url }} style={styles.thumb} contentFit="cover" transition={200} />
                  ) : p.kind === 'gem' ? (
                    <View style={[styles.diamond, { backgroundColor: tone.ink }]} />
                  ) : (
                    <RText style={styles.initial} color={tone.ink}>
                      {p.name.charAt(0)}
                    </RText>
                  )}
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={styles.row}>
                    <RText variant="caption" muted>
                      {kindLabel[p.kind]}
                      {` · ${formatDuration(p.durationMin)}`}
                      {p.priceLevel ? ` · ${p.priceLevel}` : ''}
                    </RText>
                    {p.mustSee ? <Pill label="Incontournable" tone={colors.pills.info} /> : null}
                  </View>
                  <RText variant="place" style={styles.name}>
                    {p.name}
                  </RText>
                  <RText variant="caption" muted numberOfLines={2}>
                    {p.hook}
                  </RText>
                </View>
              </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: space.l, gap: space.m, paddingBottom: 60 },
  segment: { flexDirection: 'row', borderRadius: 16, padding: 4, gap: 4 },
  segmentItem: { flex: 1, minHeight: touch.min - 4, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontFamily: fonts.bold, fontSize: 14 },
  card: { flexDirection: 'row', gap: space.m, padding: space.m, borderRadius: radius.card },
  mark: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumb: { width: 64, height: 64 },
  diamond: { width: 18, height: 18, borderRadius: 4, transform: [{ rotate: '45deg' }] },
  initial: { fontFamily: fonts.display, fontSize: 26 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s },
  name: { fontSize: 19, lineHeight: 23 },
});
