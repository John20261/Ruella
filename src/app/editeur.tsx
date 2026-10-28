import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { Icon } from '@/components/ui/icon';
import { Pill } from '@/components/ui/pill';
import { RText } from '@/components/ui/r-text';
import { Tile } from '@/components/ui/tile';
import type { Place } from '@/content/types';
import { cities, getPlaces, kindLabel, validatePlace } from '@/lib/catalog';
import { useRuellaTheme } from '@/theme/theme-context';
import { fonts, radius, space, touch } from '@/theme/tokens';

type Filter = 'tout' | 'a-verifier' | 'sans-photo' | 'position' | 'erreurs';

const FILTERS: { key: Filter; label: string; test: (p: Place, problems: string[]) => boolean }[] = [
  { key: 'tout', label: 'Tout', test: () => true },
  { key: 'a-verifier', label: 'À vérifier', test: (p) => p.verification.status !== 'verified' },
  { key: 'sans-photo', label: 'Sans photo', test: (p) => !p.photo },
  { key: 'position', label: 'Position approx.', test: (p) => !p.coordsVerified },
  { key: 'erreurs', label: 'Erreurs', test: (_p, pb) => pb.length > 0 },
];

/**
 * Espace éditeur (lot 1) : tableau de bord de la qualité du catalogue.
 * Accès : toucher 5 fois le numéro de version dans Profil.
 */
export default function EditeurScreen() {
  const { colors } = useRuellaTheme();
  const [cityId] = useState(cities[0].id);
  const [filter, setFilter] = useState<Filter>('a-verifier');
  const city = cities.find((c) => c.id === cityId)!;
  const places = getPlaces(cityId);
  const rows = places.map((p) => ({ p, problems: validatePlace(p, city) }));
  const f = FILTERS.find((x) => x.key === filter)!;
  const shown = rows.filter((r) => f.test(r.p, r.problems)).sort((a, b) => a.p.name.localeCompare(b.p.name, 'fr'));

  const pct = (n: number) => `${Math.round((n / places.length) * 100)} %`;
  const verified = places.filter((p) => p.verification.status === 'verified').length;
  const photos = places.filter((p) => p.photo).length;
  const coords = places.filter((p) => p.coordsVerified).length;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackButton />
        <View style={{ gap: 4 }}>
          <RText variant="overline" muted>
            Espace éditeur
          </RText>
          <RText variant="placeLarge">Qualité · {city.name}</RText>
          <RText variant="caption" muted>
            {places.length} fiches · règles de l’étape 4 appliquées à chaque fiche
          </RText>
        </View>

        <View style={styles.row}>
          <Tile label="Vérifiées" value={pct(verified)} detail={`${verified}/${places.length}`} tone={colors.tiles.mint} />
          <Tile label="Photos" value={pct(photos)} detail={`${photos}/${places.length}`} tone={colors.tiles.blue} />
          <Tile label="Positions" value={pct(coords)} detail={`${coords}/${places.length}`} tone={colors.tiles.gold} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.s }}>
          {FILTERS.map((x) => {
            const n = rows.filter((r) => x.test(r.p, r.problems)).length;
            const active = x.key === filter;
            return (
              <Pressable key={x.key} onPress={() => setFilter(x.key)} accessibilityRole="tab" accessibilityState={{ selected: active }} style={[styles.filter, { backgroundColor: active ? colors.action : colors.surface }]}>
                <RText style={styles.filterText} color={active ? colors.onAction : colors.text}>
                  {x.label} · {n}
                </RText>
              </Pressable>
            );
          })}
        </ScrollView>

        {shown.map(({ p, problems }) => (
          <Pressable key={p.id} onPress={() => router.push({ pathname: '/lieu/[id]', params: { id: p.id } })} style={[styles.item, { backgroundColor: colors.surface }]} accessibilityRole="button">
            <View style={{ flex: 1, gap: 4 }}>
              <RText variant="bodyStrong">{p.name}</RText>
              <RText variant="caption" muted>
                {kindLabel[p.kind]} · {p.id}
              </RText>
              <View style={styles.pills}>
                <Pill label={p.verification.status === 'verified' ? `Vérifiée ${p.verification.date ?? ''}` : 'À vérifier'} tone={p.verification.status === 'verified' ? colors.pills.success : colors.tiles.gold} />
                {!p.photo ? <Pill label="Sans photo" tone={colors.tiles.neutral} /> : null}
                {!p.coordsVerified ? <Pill label="Position approx." tone={colors.tiles.neutral} /> : null}
              </View>
              {problems.map((pb) => (
                <RText key={pb} variant="caption" color={colors.danger}>
                  {pb}
                </RText>
              ))}
              {p.verification.sources[0] ? (
                <Pressable onPress={() => Linking.openURL(p.verification.sources[0])} accessibilityRole="link" hitSlop={6}>
                  <RText variant="caption" color={colors.accent} numberOfLines={1}>
                    Source : {p.verification.sources[0]}
                  </RText>
                </Pressable>
              ) : null}
            </View>
            <Icon name="right" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
        <RText variant="caption" muted style={{ textAlign: 'center' }}>
          Les fiches se modifient dans src/content : chaque envoi est contrôlé par les tests avant d’être publié.
        </RText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.l, gap: space.m, paddingBottom: 60 },
  row: { flexDirection: 'row', gap: space.s },
  filter: { paddingHorizontal: 14, minHeight: touch.min - 4, borderRadius: radius.pill, justifyContent: 'center' },
  filterText: { fontFamily: fonts.bold, fontSize: 13 },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.m, padding: space.m, borderRadius: radius.card },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
