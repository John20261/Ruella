import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { RText } from '@/components/ui/r-text';
import { formatDuration, getPlace, kindLabel } from '@/lib/catalog';
import { directionsUrl } from '@/lib/directions';
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
  const heroTone = isGem ? colors.pills.gem : place.kind === 'restaurant' ? colors.tiles.mint : colors.tiles.blue;
  const verified = place.verification.status === 'verified';

  const infos = [
    place.hours ? { label: 'Horaires', value: place.hours } : null,
    { label: 'Durée', value: formatDuration(place.durationMin) },
    place.prices ? { label: 'Prix', value: place.prices } : isGem ? { label: 'Prix', value: 'Gratuit ou presque' } : null,
    { label: 'Pour qui', value: ageRange(place.ages) },
  ].filter((x): x is { label: string; value: string } => x !== null);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        {/* En-tête illustré (la photo sous licence arrive avec la vérification de la fiche). */}
        <View style={[styles.hero, { backgroundColor: heroTone.bg, paddingTop: insets.top + space.s }]}>
          <BackButton onDark />
          <View style={styles.heroCenter} accessible accessibilityLabel={`Illustration : ${kindLabel[place.kind]}`}>
            {isGem ? (
              <View style={[styles.heroDiamond, { backgroundColor: heroTone.ink }]} />
            ) : (
              <RText style={styles.heroInitial} color={heroTone.ink}>
                {place.name.charAt(0)}
              </RText>
            )}
          </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { height: 260, paddingHorizontal: space.l },
  heroCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroInitial: { fontFamily: fonts.display, fontSize: 96, lineHeight: 110 },
  heroDiamond: { width: 64, height: 64, borderRadius: 14, transform: [{ rotate: '45deg' }] },
  sheet: { marginTop: -radius.sheet, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, padding: space.l, gap: space.l },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  box: { borderRadius: radius.tile, padding: space.l, gap: space.s },
  infos: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  info: { flexGrow: 1, flexBasis: '45%', borderRadius: radius.tile, padding: space.m, gap: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: space.s, padding: space.l, borderTopWidth: StyleSheet.hairlineWidth },
});
