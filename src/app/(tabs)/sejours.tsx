import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Pill } from '@/components/ui/pill';
import { RText } from '@/components/ui/r-text';
import { Screen } from '@/components/ui/screen';
import { Sheet, SheetItem } from '@/components/ui/sheet';
import { cities, getCity, getPlace } from '@/lib/catalog';
import { dayShort, range } from '@/lib/dates';
import { actions, useApp } from '@/store/app-store';
import type { Trip } from '@/store/types';
import { useRuellaTheme } from '@/theme/theme-context';
import { radius, space } from '@/theme/tokens';

export default function SejoursScreen() {
  const { colors } = useRuellaTheme();
  const trips = useApp((s) => s.trips);
  const activeId = useApp((s) => s.activeTripId ?? s.trips[0]?.id);
  const [menu, setMenu] = useState<Trip | null>(null);

  return (
    <Screen>
      <RText variant="title">Séjours</RText>

      {trips.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.surface }]}>
          <Icon name="route" size={34} color={colors.accent} />
          <RText variant="place" style={{ textAlign: 'center' }}>
            Aucun séjour pour l’instant
          </RText>
          <RText muted style={{ textAlign: 'center' }}>
            En une minute : vos dates, votre famille, vos envies. Ruella compose chaque journée.
          </RText>
        </View>
      ) : null}

      {trips.map((t, ti) => {
        const city = getCity(t.cityId);
        const all = t.days.flatMap((d) => d.stops).filter((s) => s.status !== 'skipped');
        const done = all.filter((s) => s.status === 'done').length;
        const gems = all.filter((s) => getPlace(s.placeId)?.kind === 'gem').length;
        const cover = all.map((s) => getPlace(s.placeId)).find((p) => p?.mustSee && p.photo)?.photo;
        const active = t.id === activeId;
        return (
          <Animated.View key={t.id} entering={FadeInDown.delay(ti * 60)}>
            <Pressable
              onPress={() => {
                actions.setActiveTrip(t.id);
                router.navigate('/');
              }}
              onLongPress={() => setMenu(t)}
              accessibilityRole="button"
              accessibilityLabel={`${city?.name}, ${range(t.days[0].date, t.days[t.days.length - 1].date)}${active ? ', séjour en cours' : ''}`}
              style={({ pressed }) => [styles.trip, { backgroundColor: colors.surface, borderColor: active ? colors.accent : 'transparent', opacity: pressed ? 0.9 : 1 }]}>
              {cover ? (
                <View style={styles.cover}>
                  <Image source={{ uri: cover.url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} cachePolicy="disk" />
                  <View style={styles.coverShade} />
                  <View style={styles.coverText}>
                    <RText variant="placeLarge" color="#FFFFFF">
                      {city?.name}
                    </RText>
                    <RText variant="caption" color="#FFFFFF">
                      {range(t.days[0].date, t.days[t.days.length - 1].date)} · {t.days.length} jour{t.days.length > 1 ? 's' : ''}
                    </RText>
                  </View>
                  <Pressable onPress={() => setMenu(t)} accessibilityRole="button" accessibilityLabel="Options du séjour" style={styles.moreBtn} hitSlop={8}>
                    <Icon name="more" size={20} color="#FFFFFF" />
                  </Pressable>
                </View>
              ) : null}
              <View style={{ padding: space.l, gap: space.m }}>
                <View style={styles.row}>
                  {active ? <Pill label="En cours" tone={colors.pills.success} /> : <Pill label="Toucher pour l’ouvrir" tone={colors.tiles.neutral} />}
                  <RText variant="caption" muted>
                    {done}/{all.length} étapes · {gems} pépites
                  </RText>
                </View>
                <View style={[styles.bar, { backgroundColor: colors.surfaceAlt }]}>
                  <View style={[styles.barFill, { backgroundColor: colors.success, width: `${all.length ? (done / all.length) * 100 : 0}%` }]} />
                </View>
                {t.days.map((d, i) => (
                  <View key={d.date} style={styles.dayLine}>
                    <RText variant="overline" muted style={{ width: 64 }}>
                      {dayShort(d.date)}
                    </RText>
                    <RText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                      {d.title}
                    </RText>
                    {d.rain ? <Icon name="rain" size={18} color={colors.accent} /> : null}
                    <RText variant="caption" muted>
                      J{i + 1}
                    </RText>
                  </View>
                ))}
              </View>
            </Pressable>
          </Animated.View>
        );
      })}

      <Button label="Créer un séjour" variant="celebrate" onPress={() => router.push('/sejour/nouveau')} style={{ marginTop: space.s }} />
      <View style={{ flexDirection: 'row', gap: space.s }}>
        {cities.map((c) => (
          <Button key={c.id} label={`Explorer ${c.name}`} variant="secondary" style={{ flex: 1, paddingHorizontal: 8 }} onPress={() => router.push({ pathname: '/ville/[id]', params: { id: c.id } })} />
        ))}
      </View>

      <Sheet visible={!!menu} onClose={() => setMenu(null)} title={menu ? getCity(menu.cityId)?.name : undefined} subtitle={menu ? range(menu.days[0].date, menu.days[menu.days.length - 1].date) : undefined}>
        {menu ? (
          <>
            <SheetItem icon="play" label="Ouvrir ce séjour" onPress={() => { actions.setActiveTrip(menu.id); setMenu(null); router.navigate('/'); }} />
            <SheetItem icon="trash" label="Supprimer le séjour" detail="Les tampons et points gagnés sont conservés" danger onPress={() => { actions.deleteTrip(menu.id); setMenu(null); }} />
          </>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { borderRadius: radius.card + 6, padding: space.xl, alignItems: 'center', gap: space.s },
  trip: { borderRadius: radius.card + 6, overflow: 'hidden', borderWidth: 2 },
  cover: { height: 150 },
  coverShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(14,17,22,0.35)' },
  coverText: { position: 'absolute', left: space.l, bottom: space.m },
  moreBtn: { position: 'absolute', right: space.s, top: space.s, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(14,17,22,0.45)', alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  dayLine: { flexDirection: 'row', alignItems: 'center', gap: space.s, minHeight: 28 },
});
