import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Glass } from '@/components/ui/glass';
import { Pill } from '@/components/ui/pill';
import { RText } from '@/components/ui/r-text';
import { Tile } from '@/components/ui/tile';
import { describeOffset, shiftDay, toTime } from '@/lib/schedule';
import { useRuellaTheme } from '@/theme/theme-context';
import { radius, space } from '@/theme/tokens';

/** Journée de démonstration (samedi à Prague) en attendant le vrai contenu du lot 1. */
const DEMO_DAY = [
  { id: 'hotel', time: '09:00', name: "Départ de l'hôtel" },
  { id: 'jardins', time: '12:30', name: 'Jardins du Rempart' },
  { id: 'nerudova', time: '12:45', name: 'Rue Nerudova' },
  { id: 'lokal', time: '13:15', name: 'Lokál U Bílé kuželky' },
];

function nowTime(): string {
  const d = new Date();
  return toTime(d.getHours() * 60 + d.getMinutes());
}

export default function JourneeScreen() {
  const { colors } = useRuellaTheme();
  const [start, setStart] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const { stops, offset } = shiftDay(DEMO_DAY, start ?? DEMO_DAY[0].time);
  const next = stops[1];
  const after = stops.slice(2);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.mapPlaceholder, { backgroundColor: colors.surfaceAlt }]}>
        <RText variant="caption" muted>
          La carte au style Ruella arrive au lot 2
        </RText>
      </View>

      <SafeAreaView edges={['top']} style={styles.overlay} pointerEvents="box-none">
        <Glass rounded={22} style={styles.topBar}>
          <View style={styles.topBarInner}>
            <View style={{ flex: 1 }}>
              <RText variant="caption" muted>
                Samedi 24 oct. · Jour 2
              </RText>
              <RText variant="place" style={{ fontSize: 18, lineHeight: 22 }}>
                Hradčany & Malá Strana
              </RText>
            </View>
            <Pill label={offset === 0 ? "À l'heure" : describeOffset(offset).split(' sur')[0]} tone={colors.tiles.mint} />
          </View>
        </Glass>

        <View style={{ flex: 1 }} pointerEvents="none" />

        <Glass style={styles.sheet}>
          <View style={styles.sheetInner}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.row}>
              <RText variant="overline" muted>
                Prochaine étape · {next.time}
              </RText>
              <Pill label="Pépite · gratuit" tone={colors.pills.gem} />
            </View>
            <RText variant="place">{next.name}</RText>
            <RText muted>
              Ne ressortez pas par la foule : descendez les jardins, la vue sur les toits rouges est la plus belle
              de Prague.
            </RText>
            <View style={styles.row}>
              <Button label="Y aller · 4 min" style={{ flex: 1 }} />
              <Button
                label={checked ? 'Fait' : 'Cocher'}
                variant="secondary"
                haptic
                onPress={() => setChecked((c) => !c)}
                accessibilityLabel={checked ? "Décocher l'étape" : "Cocher l'étape"}
              />
            </View>
            <View style={styles.tiles}>
              <Tile label="étapes" value={checked ? '5/16' : '4/16'} tone={colors.tiles.blue} />
              <Tile label="points" value={checked ? '400' : '350'} tone={colors.tiles.lilac} />
              <Tile label="pépites" value={checked ? '3/8' : '2/8'} tone={colors.tiles.gold} />
            </View>
            <View style={styles.row}>
              <RText variant="caption" muted style={{ flex: 1 }}>
                Ensuite · {after.map((s) => `${s.time} ${s.name}`).join(' · ')}
              </RText>
            </View>
            <View style={styles.row}>
              <Button
                label="Je pars maintenant"
                variant="ghost"
                onPress={() => setStart(nowTime())}
                style={{ flex: 1, minHeight: 44 }}
              />
              {start ? <Button label="↺" variant="ghost" onPress={() => setStart(null)} accessibilityLabel="Revenir aux horaires d'origine" style={{ minHeight: 44 }} /> : null}
            </View>
          </View>
        </Glass>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  mapPlaceholder: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 200 },
  overlay: { flex: 1, paddingHorizontal: space.s, paddingBottom: 96 },
  topBar: { marginHorizontal: space.s, marginTop: space.s },
  topBarInner: { flexDirection: 'row', alignItems: 'center', gap: space.m, paddingHorizontal: space.l, paddingVertical: space.m },
  sheet: { borderRadius: radius.sheet },
  sheetInner: { padding: space.l, paddingTop: space.s, gap: space.m },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s },
  tiles: { flexDirection: 'row', gap: space.s },
});
