import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { RText } from '@/components/ui/r-text';
import { Icon } from '@/components/ui/icon';
import { Sheet, SheetItem } from '@/components/ui/sheet';
import { formatDuration, getPlace, kindLabel } from '@/lib/catalog';
import { checkPlace } from '@/lib/check';
import { dayLong } from '@/lib/dates';
import { directionsUrl } from '@/lib/directions';
import { familyCostEUR } from '@/lib/budget';
import { formatEUR, formatLocal } from '@/lib/money';
import { pointsFor } from '@/lib/rewards';
import { actions, activeTrip, useApp } from '@/store/app-store';
import type { Place } from '@/content/types';
import { useRuellaTheme } from '@/theme/theme-context';
import { fonts, radius, space } from '@/theme/tokens';

const AGE_LABEL: Record<Place['ages'][number], string> = {
  under8: 'moins de 8 ans',
  '8-12': '8–12 ans',
  '13-17': '13–17 ans',
  adult: 'adultes',
};

function ageRange(ages: Place['ages']): string {
  if (ages.length === 4) return 'Tous âges';
  return ages.map((a) => AGE_LABEL[a]).join(', ');
}

export default function LieuScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useRuellaTheme();
  const insets = useSafeAreaInsets();
  const [storyOpen, setStoryOpen] = useState(false);
  const [picker, setPicker] = useState(false);
  const trip = useApp(activeTrip);
  const visited = useApp((s) => s.visits.some((v) => v.placeId === id));
  const travelers = useApp((s) => s.profile.travelers);
  const place = getPlace(id);

  if (!place) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background, padding: space.l }]}>
        <BackButton />
        <RText style={{ marginTop: space.l }}>Ce lieu est introuvable.</RText>
      </SafeAreaView>
    );
  }

  const isGem = place.kind === 'gem';
  const inTripDay = trip ? trip.days.findIndex((d) => d.stops.some((x) => x.placeId === place.id)) : -1;
  const heroTone = isGem ? colors.pills.gem : place.kind === 'restaurant' ? colors.tiles.mint : colors.tiles.blue;
  const verified = place.verification.status === 'verified';

  const family = familyCostEUR(place, travelers);
  const infos = [
    place.hours ? { label: 'Horaires', value: place.hours } : null,
    { label: 'Durée', value: formatDuration(place.durationMin) },
    place.prices
      ? { label: 'Prix', value: place.prices }
      : place.meal
        ? { label: 'Repas', value: `≈ ${formatLocal(place.meal.adult, place.meal.currency)} par adulte` }
        : place.cost && place.cost.adult > 0
          ? { label: 'Prix (estimé)', value: `Adulte ${formatLocal(place.cost.adult, place.cost.currency)}${place.cost.child !== undefined ? ` · enfant ${place.cost.child ? formatLocal(place.cost.child, place.cost.currency) : 'gratuit'}` : ''}` }
          : { label: 'Prix', value: 'Gratuit' },
    family ? { label: 'Pour votre groupe', value: family.amount > 0 ? `${family.estimate ? '≈ ' : ''}${formatEUR(family.amount)}` : 'Gratuit' } : null,
    { label: 'Pour qui', value: ageRange(place.ages) },
  ].filter((x): x is { label: string; value: string } => x !== null);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        {/* En-tête : photo sous licence libre si disponible, sinon illustration aux couleurs du type. */}
        <View style={[styles.hero, { backgroundColor: heroTone.bg }]}>
          {place.photo ? (
            <Image
              source={{ uri: place.photo.url }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={250}
              accessibilityLabel={`Photo : ${place.name}`}
            />
          ) : (
            <View style={styles.heroCenter} accessible accessibilityLabel={`Illustration : ${kindLabel[place.kind]}`}>
              {isGem ? (
                <View style={[styles.heroDiamond, { backgroundColor: heroTone.ink }]} />
              ) : (
                <RText style={styles.heroInitial} color={heroTone.ink}>
                  {place.name.charAt(0)}
                </RText>
              )}
            </View>
          )}
          <View style={[styles.heroTop, { paddingTop: insets.top + space.s }]}>
            <BackButton onDark />
          </View>
          {place.photo ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Crédit photo : ${place.photo.author}, licence ${place.photo.license}`}
              onPress={() => Linking.openURL(place.photo!.sourceUrl)}
              style={styles.credit}>
              <RText style={styles.creditText} color="#FFFFFF" numberOfLines={1}>
                Photo : {place.photo.author} · {place.photo.license}
              </RText>
            </Pressable>
          ) : null}
        </View>

        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={styles.pills}>
            <Pill label={isGem ? 'Pépite' : kindLabel[place.kind]} tone={isGem ? colors.pills.gem : colors.pills.info} />
            <Pill label={place.indoor ? 'Intérieur' : 'Extérieur'} tone={colors.pills.info} />
            {place.mustSee ? <Pill label="Incontournable" tone={colors.tiles.lilac} /> : null}
          </View>

          <View style={{ gap: 6 }}>
            <RText variant="placeLarge" accessibilityRole="header">
              {place.name}
            </RText>
            {place.localName ? (
              <RText variant="caption" muted>
                {place.localName}
                {place.address ? ` · ${place.address}` : ''}
              </RText>
            ) : place.address ? (
              <RText variant="caption" muted>
                {place.address}
              </RText>
            ) : null}
            <RText muted>{place.hook}</RText>
          </View>

          <View style={styles.quick}>
            {trip && trip.cityId === place.cityId ? (
              <Pressable
                onPress={() => setPicker(true)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.quickBtn, { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }]}>
                <Icon name="plus" size={18} color={colors.accent} />
                <RText variant="bodyStrong">{inTripDay >= 0 ? `Jour ${inTripDay + 1}` : 'Ajouter'}</RText>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => (visited ? actions.unlogVisit(place.id) : checkPlace(place.id))}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: visited }}
              accessibilityLabel={visited ? 'Visité. Toucher pour annuler' : `Je l’ai fait : plus ${pointsFor(place, false)} points`}
              style={({ pressed }) => [styles.quickBtn, { backgroundColor: visited ? colors.tiles.mint.bg : colors.surface, opacity: pressed ? 0.8 : 1 }]}>
              <Icon name="check" size={18} color={visited ? colors.tiles.mint.ink : colors.textMuted} strokeWidth={2.6} />
              <RText variant="bodyStrong" color={visited ? colors.tiles.mint.ink : undefined}>
                {visited ? 'Visité' : `Je l’ai fait · +${pointsFor(place, false)}`}
              </RText>
            </Pressable>
          </View>

          {place.about ? (
            <View style={[styles.box, { backgroundColor: colors.surface }]}>
              <RText variant="overline" color={colors.accent}>
                {place.kind === 'restaurant' ? 'Spécialités et histoire' : isGem ? 'C’est quoi ?' : 'Le lieu en bref'}
              </RText>
              <RText>{place.about}</RText>
            </View>
          ) : null}

          {isGem && place.why ? (
            <View style={[styles.box, { backgroundColor: colors.surface }]}>
              <RText variant="overline" color={colors.gem}>
                Pourquoi c&apos;est canon
              </RText>
              <RText>{place.why}</RText>
              {place.howToFind ? (
                <RText variant="caption" muted>
                  Comment la trouver : {place.howToFind}
                </RText>
              ) : null}
              {place.bestMoment ? (
                <RText variant="caption" muted>
                  Meilleur moment : {place.bestMoment}
                </RText>
              ) : null}
            </View>
          ) : null}

          <View style={styles.infos}>
            {infos.map((i) => (
              <View key={i.label} style={[styles.info, { backgroundColor: colors.surface }]}>
                <RText variant="caption" muted>
                  {i.label}
                </RText>
                <RText variant="bodyStrong">{i.value}</RText>
              </View>
            ))}
          </View>

          {place.tip ? (
            <View style={[styles.box, { backgroundColor: colors.tiles.gold.bg }]}>
              <RText variant="bodyStrong" color={colors.tiles.gold.ink}>
                Astuce
              </RText>
              <RText color={colors.tiles.gold.ink}>{place.tip}</RText>
            </View>
          ) : null}

          {place.order ? (
            <View style={[styles.box, { backgroundColor: colors.surface }]}>
              <RText variant="overline" muted>
                À commander
              </RText>
              <RText>{place.order}</RText>
            </View>
          ) : null}

          {place.story ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: storyOpen }}
              onPress={() => setStoryOpen((o) => !o)}
              style={[styles.box, { backgroundColor: colors.surface }]}>
              <View style={styles.row}>
                <RText variant="bodyStrong">En savoir plus</RText>
                <RText variant="bodyStrong" muted>
                  {storyOpen ? '−' : '+'}
                </RText>
              </View>
              {storyOpen ? <RText muted>{place.story}</RText> : null}
            </Pressable>
          ) : null}

          <RText variant="caption" color={verified ? colors.success : colors.textMuted}>
            {verified
              ? `Infos vérifiées le ${place.verification.date?.split('-').reverse().join('/')}`
              : 'Fiche en cours de vérification'}
            {place.coordsVerified ? '' : ' · position approximative'}
          </RText>
        </View>
      </ScrollView>

      <View style={[styles.bar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + space.m }]}>
        {place.ticketUrl ? (
          <Button
            label={place.kind === 'restaurant' ? 'Site' : 'Billets'}
            variant="secondary"
            onPress={() => Linking.openURL(place.ticketUrl!)}
            accessibilityLabel={`${place.kind === 'restaurant' ? 'Site du restaurant' : 'Billets'}, ouvre le navigateur`}
          />
        ) : null}
        <Button label="Y aller" style={{ flex: 1 }} onPress={() => Linking.openURL(directionsUrl(place))} />
      </View>

      <Sheet visible={picker} onClose={() => setPicker(false)} title="Ajouter à quel jour ?" subtitle={place.name}>
        {trip?.days.map((d, i) => {
          const already = d.stops.some((x) => x.placeId === place.id);
          return (
            <SheetItem
              key={d.date}
              icon={already ? 'check' : 'calendar'}
              label={`Jour ${i + 1} · ${dayLong(d.date)}`}
              detail={already ? 'Déjà au programme' : d.title}
              onPress={() => {
                if (!already) actions.addPlaceToDay(trip.id, i, place.id);
                setPicker(false);
              }}
            />
          );
        })}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { height: 300, overflow: 'hidden' },
  heroTop: { position: 'absolute', top: 0, left: space.l },
  credit: { position: 'absolute', right: space.s, bottom: radius.sheet + 6, maxWidth: '80%', backgroundColor: 'rgba(14,17,22,0.6)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  creditText: { fontFamily: fonts.semibold, fontSize: 10.5, lineHeight: 14 },
  heroCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroInitial: { fontFamily: fonts.display, fontSize: 96, lineHeight: 110 },
  heroDiamond: { width: 64, height: 64, borderRadius: 14, transform: [{ rotate: '45deg' }] },
  sheet: { marginTop: -radius.sheet, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, padding: space.l, gap: space.l },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  quick: { flexDirection: 'row', gap: space.s },
  quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, borderRadius: radius.button, paddingHorizontal: space.m },
  box: { borderRadius: radius.tile, padding: space.l, gap: space.s },
  infos: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  info: { flexGrow: 1, flexBasis: '45%', borderRadius: radius.tile, padding: space.m, gap: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: space.s, padding: space.l, borderTopWidth: StyleSheet.hairlineWidth },
});
