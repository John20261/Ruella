import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { Icon } from '@/components/ui/icon';
import { Pill } from '@/components/ui/pill';
import { RText } from '@/components/ui/r-text';
import type { Place } from '@/content/types';
import { familyCostEUR } from '@/lib/budget';
import { formatDuration, getPlace, getPlaces, kindGroups, kindLabel } from '@/lib/catalog';
import { dayLong } from '@/lib/dates';
import { centroid, distanceM, formatMeters } from '@/lib/geo';
import { formatEUR } from '@/lib/money';
import { actions, useApp } from '@/store/app-store';
import { useRuellaTheme } from '@/theme/theme-context';
import { fonts, radius, space, touch } from '@/theme/tokens';

type Group = 'tout' | (typeof kindGroups)[number]['key'];
const GROUPS: { key: Group; label: string }[] = [{ key: 'tout', label: 'Tout' }, ...kindGroups.map((g) => ({ key: g.key as Group, label: g.label }))];

/** Choisir un lieu du catalogue et l'ajouter à une journée (placé là où il fait le moins de détour). */
export default function AjouterEtape() {
  const { colors } = useRuellaTheme();
  const params = useLocalSearchParams<{ trip: string; day: string }>();
  const trip = useApp((s) => s.trips.find((t) => t.id === params.trip));
  const travelers = useApp((s) => s.profile.travelers);
  const dayIndex = Number(params.day ?? 0);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<Group>('tout');

  const day = trip?.days[dayIndex];
  const center = useMemo(() => {
    if (!trip || !day) return null;
    const pts = day.stops.map((s) => getPlace(s.placeId)).filter((p): p is Place => !!p);
    return pts.length ? centroid(pts) : trip.base;
  }, [trip, day]);

  const where = useMemo(() => {
    const m = new Map<string, number>();
    trip?.days.forEach((d, i) => d.stops.forEach((s) => m.set(s.placeId, i)));
    return m;
  }, [trip]);

  const list = useMemo(() => {
    if (!trip || !center) return [];
    const q = query.trim().toLowerCase();
    const kinds = kindGroups.find((g) => g.key === group)?.kinds;
    return getPlaces(trip.cityId)
      .filter((p) => !kinds || kinds.includes(p.kind))
      .filter((p) => !q || `${p.name} ${p.localName ?? ''} ${p.hook}`.toLowerCase().includes(q))
      .map((p) => ({ p, d: distanceM(center, p) }))
      .sort((a, b) => a.d - b.d);
  }, [trip, center, query, group]);

  if (!trip || !day) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: space.l }}>
        <BackButton />
        <RText style={{ marginTop: space.l }}>Séjour introuvable.</RText>
      </SafeAreaView>
    );
  }

  const add = (p: Place) => {
    actions.addPlaceToDay(trip.id, dayIndex, p.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <BackButton />
        <View style={{ flex: 1 }}>
          <RText variant="overline" muted>
            Jour {dayIndex + 1} · {dayLong(day.date)}
          </RText>
          <RText variant="title" style={{ fontSize: 26 }}>
            Ajouter une étape
          </RText>
        </View>
      </View>

      <View style={[styles.search, { backgroundColor: colors.surface }]}>
        <Icon name="pin" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Chercher un monument, une pépite, un resto…"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.text }]}
          accessibilityLabel="Rechercher un lieu"
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} accessibilityLabel="Effacer la recherche" hitSlop={10}>
            <Icon name="close" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.groups}>
        {GROUPS.map((g) => {
          const active = g.key === group;
          return (
            <Pressable key={g.key} onPress={() => setGroup(g.key)} accessibilityRole="tab" accessibilityState={{ selected: active }} style={[styles.group, { backgroundColor: active ? colors.action : colors.surface }]}>
              <RText style={styles.groupText} color={active ? colors.onAction : colors.text}>
                {g.label}
              </RText>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={list}
        keyExtractor={(x) => x.p.id}
        contentContainerStyle={{ padding: space.l, paddingTop: space.s, gap: space.s, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <RText variant="caption" muted style={{ marginBottom: space.xs }}>
            Classés du plus proche au plus loin de votre parcours du jour. L’étape est placée là où elle fait le moins de détour.
          </RText>
        }
        renderItem={({ item: { p, d } }) => {
          const inDay = where.get(p.id);
          const cost = familyCostEUR(p, travelers);
          const tone = p.kind === 'gem' ? colors.pills.gem : p.kind === 'restaurant' ? colors.tiles.mint : colors.tiles.blue;
          return (
            <Pressable
              onPress={() => (inDay === dayIndex ? undefined : add(p))}
              accessibilityRole="button"
              accessibilityLabel={`${p.name}, ${kindLabel[p.kind]}, à ${formatMeters(d)}${inDay !== undefined ? `, déjà au jour ${inDay + 1}` : ''}`}
              style={({ pressed }) => [styles.row, { backgroundColor: colors.surface, opacity: inDay === dayIndex ? 0.5 : pressed ? 0.85 : 1 }]}>
              <View style={[styles.thumb, { backgroundColor: tone.bg }]}>
                {p.photo ? <Image source={{ uri: p.photo.url }} style={styles.thumb} contentFit="cover" cachePolicy="disk" /> : <Icon name={p.kind === 'gem' ? 'gem' : 'pin'} size={22} color={tone.ink} />}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <RText variant="caption" muted numberOfLines={1}>
                  {p.kind === 'gem' ? 'Pépite' : kindLabel[p.kind]} · {formatDuration(p.durationMin)} · à {formatMeters(d)}
                </RText>
                <RText variant="bodyStrong" numberOfLines={1}>
                  {p.name}
                </RText>
                <RText variant="caption" muted numberOfLines={2}>
                  {p.hook}
                </RText>
                <View style={styles.pills}>
                  {cost ? <Pill label={cost.amount > 0 ? `${cost.estimate ? '≈ ' : ''}${formatEUR(cost.amount)} pour vous` : 'Gratuit'} tone={cost.amount > 0 ? colors.tiles.neutral : colors.pills.success} /> : <Pill label="Gratuit" tone={colors.pills.success} />}
                  {inDay !== undefined ? <Pill label={inDay === dayIndex ? 'Déjà ce jour' : `Prévu jour ${inDay + 1}`} tone={colors.tiles.gold} /> : null}
                </View>
              </View>
              {inDay !== dayIndex ? (
                <View style={[styles.plus, { backgroundColor: colors.action }]}>
                  <Icon name="plus" size={18} color={colors.onAction} strokeWidth={2.6} />
                </View>
              ) : null}
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.m, paddingHorizontal: space.l, paddingTop: space.s },
  search: { flexDirection: 'row', alignItems: 'center', gap: space.s, marginHorizontal: space.l, marginTop: space.m, paddingHorizontal: space.m, borderRadius: radius.button, minHeight: touch.primary },
  input: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, paddingVertical: 0 },
  groups: { flexDirection: 'row', gap: space.s, paddingHorizontal: space.l, paddingTop: space.m },
  group: { paddingHorizontal: 14, minHeight: 38, borderRadius: radius.pill, justifyContent: 'center' },
  groupText: { fontFamily: fonts.bold, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.m, padding: space.m, borderRadius: radius.card },
  thumb: { width: 60, height: 60, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  plus: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
