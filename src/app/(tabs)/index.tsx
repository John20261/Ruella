import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, interpolate, Extrapolation } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CityMap, type MapMarker } from '@/components/city-map';
import { StopRow } from '@/components/day/stop-row';
import { Button } from '@/components/ui/button';
import { Glass } from '@/components/ui/glass';
import { Icon, type IconName } from '@/components/ui/icon';
import { Pill } from '@/components/ui/pill';
import { RText } from '@/components/ui/r-text';
import { Sheet, SheetItem } from '@/components/ui/sheet';
import { Tile } from '@/components/ui/tile';
import { formatDuration, getPlace, kindLabel } from '@/lib/catalog';
import { checkStop } from '@/lib/check';
import { dayLong, dayShort, hour } from '@/lib/dates';
import { directionsUrl } from '@/lib/directions';
import { distanceM } from '@/lib/geo';
import { useUserLocation } from '@/lib/location';
import { dayEnd } from '@/lib/planner';
import { pointsFor } from '@/lib/rewards';
import { actions, activeTrip, defaultDayIndex, useApp, useHydrated } from '@/store/app-store';
import type { Stop } from '@/store/types';
import { useRuellaTheme } from '@/theme/theme-context';
import { fonts, radius, space } from '@/theme/tokens';

const MAP_H = Math.round(Dimensions.get('window').height * 0.46);

export default function JourneeScreen() {
  const hydrated = useHydrated();
  const trip = useApp(activeTrip);
  if (!hydrated) return null;
  if (!trip) return <EmptyDay />;
  return <DayView key={trip.id} />;
}

function DayView() {
  const { colors } = useRuellaTheme();
  const insets = useSafeAreaInsets();
  const trip = useApp(activeTrip)!;
  const autoCheck = useApp((s) => s.profile.autoCheck);
  const visits = useApp((s) => s.visits);
  const [dayIndex, setDayIndex] = useState(() => defaultDayIndex(trip));
  const [menu, setMenu] = useState<Stop | null>(null);
  const [focused, setFocused] = useState(true);
  const scrollRef = useRef<Animated.ScrollView>(null);
  const rowY = useRef(new Map<string, number>());

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const user = useUserLocation(focused);
  const day = trip.days[Math.min(dayIndex, trip.days.length - 1)];
  const stops = day.stops;
  const live = stops.filter((s) => s.status !== 'skipped');
  const next = live.find((s) => s.status === 'todo');
  const doneCount = live.filter((s) => s.status === 'done').length;
  const dayPoints = live
    .filter((s) => s.status === 'done')
    .reduce((sum, s) => {
      const p = getPlace(s.placeId);
      const v = visits.find((x) => x.placeId === s.placeId && x.tripId === trip.id);
      return p ? sum + pointsFor(p, !!v?.auto) : sum;
    }, 0);

  const markers: MapMarker[] = useMemo(
    () =>
      live.flatMap((s) => {
        const p = getPlace(s.placeId);
        return p
          ? [{ id: s.id, lat: p.lat, lng: p.lng, label: p.name, done: s.status === 'done', transit: s.leg?.mode === 'transit', kind: p.kind === 'gem' ? 'gem' : p.kind === 'restaurant' ? 'restaurant' : 'visit' } as MapMarker]
          : [];
      }),
    [live],
  );

  // Validation automatique sur place (option du profil) : la position reste sur le téléphone.
  useEffect(() => {
    if (!autoCheck || !user || !next) return;
    const p = getPlace(next.placeId);
    if (p && distanceM(user, p) <= p.radiusM) checkStop(trip.id, dayIndex, next.id, p.id, true);
  }, [autoCheck, user, next, trip.id, dayIndex]);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const mapStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.value, [-200, 0, MAP_H], [60, 0, -MAP_H * 0.45], Extrapolation.CLAMP) }],
  }));
  const barStyle = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.value, [0, MAP_H * 0.6], [1, 0], Extrapolation.CLAMP) }));

  const scrollToStop = (id: string) => {
    const y = rowY.current.get(id);
    if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y + MAP_H - 180), animated: true });
  };

  const menuPlace = menu ? getPlace(menu.placeId) : undefined;
  const menuIndex = menu ? stops.findIndex((s) => s.id === menu.id) : -1;
  const close = () => setMenu(null);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.mapWrap, mapStyle]}>
        <CityMap
          cityId={trip.cityId}
          markers={markers}
          base={trip.base}
          user={user}
          insetTop={insets.top + 76 + (Platform.OS === 'web' ? 64 : 0)}
          onSelect={scrollToStop}
          style={{ height: MAP_H + 40 }}
        />
      </Animated.View>

      <Animated.View style={[styles.topBar, { top: insets.top + space.s + (Platform.OS === 'web' ? 64 : 0) }, barStyle]}>
        <Glass rounded={22}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
            {trip.days.map((d, i) => {
              const active = i === dayIndex;
              const allDone = d.stops.length > 0 && d.stops.every((s) => s.status !== 'todo');
              return (
                <Pressable
                  key={d.date}
                  onPress={() => setDayIndex(i)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Jour ${i + 1}, ${dayLong(d.date)}${allDone ? ', terminé' : ''}`}
                  style={[styles.dayChip, active && { backgroundColor: colors.action }]}>
                  <RText style={styles.dayChipTop} color={active ? colors.onAction : colors.textMuted}>
                    Jour {i + 1}
                  </RText>
                  <RText style={styles.dayChipBottom} color={active ? colors.onAction : colors.text}>
                    {dayShort(d.date)}
                    {allDone ? ' ✓' : ''}
                  </RText>
                </Pressable>
              );
            })}
          </ScrollView>
        </Glass>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: MAP_H - 28, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <Animated.View key={day.date} entering={FadeIn.duration(250)} style={{ gap: space.m }}>
            <View style={{ gap: 4 }}>
              <View style={styles.rowBetween}>
                <RText variant="overline" muted>
                  {dayLong(day.date)} · Jour {dayIndex + 1} sur {trip.days.length}
                </RText>
                {day.rain ? <Pill label="Plan pluie" tone={colors.tiles.blue} /> : null}
              </View>
              <RText variant="placeLarge" accessibilityRole="header">
                {day.title}
              </RText>
            </View>

            <View style={styles.tiles}>
              <Tile label="Étapes" value={`${doneCount}/${live.length}`} tone={colors.tiles.blue} />
              <Tile label="Points du jour" value={String(dayPoints)} tone={colors.tiles.lilac} />
              <Tile label="Fin estimée" value={hour(dayEnd(day, getPlace))} tone={colors.tiles.gold} />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Chip icon="play" label={`Je pars maintenant`} onPress={() => actions.startNow(trip.id, dayIndex)} detail={`départ ${hour(day.startTime)}`} />
              <Chip icon="rain" label={day.rain ? 'Plan pluie actif' : 'Il pleut ?'} detail={day.rain ? 'refaire' : 'tout à l’abri'} onPress={() => actions.rainPlan(trip.id, dayIndex)} />
              <Chip icon="plus" label="Ajouter" detail="une visite" onPress={() => router.push({ pathname: '/ville/[id]', params: { id: trip.cityId } })} />
            </ScrollView>

            {next ? <NextCard stop={next} onCheck={() => checkStop(trip.id, dayIndex, next.id, next.placeId)} /> : <DayDone empty={live.length === 0} />}

            <View>
              {stops.map((s, i) => {
                const p = getPlace(s.placeId);
                if (!p) return null;
                return (
                  <View key={s.id} onLayout={(e) => rowY.current.set(s.id, e.nativeEvent.layout.y)}>
                    <StopRow
                      stop={s}
                      place={p}
                      index={i}
                      isNext={s.id === next?.id}
                      isLast={i === stops.length - 1}
                      onOpen={() => router.push({ pathname: '/lieu/[id]', params: { id: p.id } })}
                      onCheck={() => checkStop(trip.id, dayIndex, s.id, p.id)}
                      onMore={() => setMenu(s)}
                    />
                  </View>
                );
              })}
            </View>

            <RText variant="caption" muted style={{ textAlign: 'center', marginTop: space.s }}>
              Appui long sur une étape : la déplacer, la passer ou l’envoyer à un autre jour.
            </RText>
          </Animated.View>
        </View>
      </Animated.ScrollView>

      <Sheet visible={!!menu && !!menuPlace} onClose={close} title={menuPlace?.name} subtitle={menuPlace ? `${kindLabel[menuPlace.kind]} · ${menu?.time.replace(':', ' h ')}` : undefined}>
        {menu && menuPlace ? (
          <>
            <SheetItem icon="navigate" label="Y aller" detail={menu.leg ? `${menu.leg.mode === 'transit' ? 'Transports' : 'À pied'} · ${menu.leg.minutes} min` : undefined} onPress={() => { close(); Linking.openURL(directionsUrl(menuPlace, undefined, menu.leg?.mode)); }} />
            <SheetItem icon="book" label="Voir la fiche" onPress={() => { close(); router.push({ pathname: '/lieu/[id]', params: { id: menuPlace.id } }); }} />
            {menuIndex > 0 ? <SheetItem icon="up" label="Plus tôt dans la journée" onPress={() => actions.moveStop(trip.id, dayIndex, menu.id, -1)} /> : null}
            {menuIndex < stops.length - 1 ? <SheetItem icon="down" label="Plus tard dans la journée" onPress={() => actions.moveStop(trip.id, dayIndex, menu.id, 1)} /> : null}
            {trip.days.length > 1 ? (
              <SheetItem
                icon="calendar"
                label={`Déplacer au jour ${dayIndex + 1 < trip.days.length ? dayIndex + 2 : dayIndex}`}
                detail={dayLong(trip.days[dayIndex + 1 < trip.days.length ? dayIndex + 1 : dayIndex - 1].date)}
                onPress={() => { close(); actions.moveStopToDay(trip.id, dayIndex, menu.id, dayIndex + 1 < trip.days.length ? dayIndex + 1 : dayIndex - 1); }}
              />
            ) : null}
            <SheetItem icon="skip" label={menu.status === 'skipped' ? 'Remettre au programme' : 'Passer cette étape'} onPress={() => { close(); actions.skipStop(trip.id, dayIndex, menu.id); }} />
            <SheetItem icon="trash" label="Retirer de la journée" danger onPress={() => { close(); actions.removeStop(trip.id, dayIndex, menu.id); }} />
          </>
        ) : null}
      </Sheet>
    </View>
  );
}

function Chip({ icon, label, detail, onPress }: { icon: IconName; label: string; detail?: string; onPress: () => void }) {
  const { colors } = useRuellaTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={detail ? `${label}, ${detail}` : label} style={({ pressed }) => [styles.chip, { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }]}>
      <View style={[styles.chipIcon, { backgroundColor: colors.surfaceAlt }]}>
        <Icon name={icon} size={16} color={colors.accent} />
      </View>
      <View>
        <RText style={styles.chipLabel}>{label}</RText>
        {detail ? (
          <RText style={styles.chipDetail} muted>
            {detail}
          </RText>
        ) : null}
      </View>
    </Pressable>
  );
}

function NextCard({ stop, onCheck }: { stop: Stop; onCheck: () => void }) {
  const { colors } = useRuellaTheme();
  const p = getPlace(stop.placeId)!;
  const tone = p.kind === 'gem' ? colors.pills.gem : colors.tiles.blue;
  return (
    <View style={[styles.next, { backgroundColor: colors.surface }]}>
      {p.photo ? (
        <View style={styles.nextPhotoWrap}>
          <Image source={{ uri: p.photo.url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} cachePolicy="disk" accessibilityLabel={`Photo : ${p.name}`} />
          <View style={styles.nextShade} />
          <View style={styles.nextOnPhoto}>
            <Pill label={`Prochaine étape · ${stop.time.replace(':', ' h ')}`} tone={tone} />
          </View>
        </View>
      ) : null}
      <View style={{ padding: space.l, gap: space.s }}>
        {!p.photo ? <Pill label={`Prochaine étape · ${stop.time.replace(':', ' h ')}`} tone={tone} /> : null}
        <RText variant="place">{p.name}</RText>
        <RText muted>{p.kind === 'gem' && p.why ? p.why : p.tip ?? p.hook}</RText>
        <View style={styles.rowBetween}>
          <Button
            label={stop.leg ? `Y aller · ${stop.leg.minutes} min` : 'Y aller'}
            icon={<Icon name={stop.leg?.mode === 'transit' ? 'tram' : 'navigate'} size={18} color={colors.onAction} />}
            style={{ flex: 1 }}
            onPress={() => Linking.openURL(directionsUrl(p, undefined, stop.leg?.mode))}
          />
          <Button label="J’y suis" variant="secondary" onPress={onCheck} accessibilityLabel={`Cocher ${p.name}`} />
        </View>
        <RText variant="caption" muted>
          {kindLabel[p.kind]} · {formatDuration(p.durationMin)}
          {p.prices ? ` · ${p.prices.split(' · ')[0]}` : ''}
        </RText>
      </View>
    </View>
  );
}

function DayDone({ empty }: { empty: boolean }) {
  const { colors } = useRuellaTheme();
  return (
    <View style={[styles.done, { backgroundColor: colors.tiles.mint.bg }]}>
      <Icon name="sparkles" size={28} color={colors.tiles.mint.ink} />
      <RText variant="place" color={colors.tiles.mint.ink}>
        {empty ? 'Journée libre' : 'Journée bouclée !'}
      </RText>
      <RText color={colors.tiles.mint.ink} style={{ textAlign: 'center' }}>
        {empty ? 'Ajoutez des visites depuis « Explorer ».' : 'Toutes les étapes sont faites. Vos tampons vous attendent dans Récompenses.'}
      </RText>
    </View>
  );
}

function EmptyDay() {
  const { colors } = useRuellaTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <CityMap cityId="prague" markers={[]} style={StyleSheet.absoluteFill} />
      <View style={[styles.emptyWrap, { paddingTop: insets.top + space.xxl }]}>
        <Animated.View entering={FadeIn.duration(500)} style={{ gap: space.m }}>
          <RText variant="overline" color={colors.accent}>
            Ruella
          </RText>
          <RText variant="placeLarge" style={{ fontSize: 42, lineHeight: 46 }}>
            Votre journée dans la ville, prête chaque matin.
          </RText>
          <RText muted style={{ fontSize: 17, lineHeight: 24 }}>
            Un parcours à pied pensé pour votre famille, les pépites que les autres ratent, et des tampons à collectionner.
          </RText>
        </Animated.View>
        <View style={{ flex: 1 }} />
        <Glass style={{ padding: space.l, gap: space.m, marginBottom: 110 }}>
          <Button label="Créer mon séjour" variant="celebrate" onPress={() => router.push('/sejour/nouveau')} />
          <Button label="Explorer Prague" variant="ghost" onPress={() => router.push('/ville/prague')} />
        </Glass>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  mapWrap: { position: 'absolute', top: 0, left: 0, right: 0 },
  topBar: { position: 'absolute', left: space.m, right: space.m, zIndex: 10 },
  days: { padding: 6, gap: 6 },
  dayChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, minHeight: 44, justifyContent: 'center' },
  dayChipTop: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14 },
  dayChipBottom: { fontFamily: fonts.heavy, fontSize: 14, lineHeight: 18 },
  sheet: { borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: space.l, paddingTop: space.s, minHeight: 600 },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: space.m },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s },
  tiles: { flexDirection: 'row', gap: space.s },
  chips: { gap: space.s, paddingRight: space.l },
  chip: { flexDirection: 'row', alignItems: 'center', gap: space.s, paddingLeft: 8, paddingRight: 14, minHeight: 48, borderRadius: 16 },
  chipIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  chipLabel: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 17 },
  chipDetail: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14 },
  next: { borderRadius: radius.card + 6, overflow: 'hidden' },
  nextPhotoWrap: { height: 170 },
  nextShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(14,17,22,0.18)' },
  nextOnPhoto: { position: 'absolute', left: space.l, bottom: space.m },
  done: { borderRadius: radius.card + 6, padding: space.xl, alignItems: 'center', gap: space.s },
  emptyWrap: { flex: 1, paddingHorizontal: space.xl },
});
