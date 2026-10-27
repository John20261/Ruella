import { StyleSheet, View } from 'react-native';

import { RText } from '@/components/ui/r-text';
import { Screen } from '@/components/ui/screen';
import { Stamp } from '@/components/ui/stamp';
import { Tile } from '@/components/ui/tile';
import { useRuellaTheme } from '@/theme/theme-context';
import { radius, space } from '@/theme/tokens';

export default function RecompensesScreen() {
  const { colors } = useRuellaTheme();
  const muted = '#9A8F78';

  return (
    <Screen>
      <RText variant="title">Récompenses</RText>

      <View style={[styles.level, { backgroundColor: colors.tiles.lilac.bg }]}>
        <View style={styles.row}>
          <RText variant="place" style={{ fontSize: 24 }}>
            Promeneurs
          </RText>
          <RText variant="heading">4 110 pts</RText>
        </View>
        <View style={[styles.track, { backgroundColor: colors.border }]}>
          <View style={[styles.fill, { backgroundColor: colors.tiles.lilac.ink, width: '62%' }]} />
        </View>
        <RText variant="caption" color={colors.tiles.lilac.ink}>
          Prochain niveau : Explorateurs
        </RText>
      </View>

      <View style={[styles.passport, { backgroundColor: colors.paper }]}>
        <View style={styles.row}>
          <RText variant="place" style={{ fontSize: 20 }} color="#12212E">
            Passeport · Prague
          </RText>
          <RText variant="caption" color="#6B5E44">
            4 tampons sur 12
          </RText>
        </View>
        <View style={styles.stamps}>
          <Stamp place="Prague" title="Premier jour" date="23.10.26" color={colors.stamp} mutedColor={muted} />
          <Stamp place="Hradčany" title="Château conquis" color="#1F4E8C" shape="square" tilt={5} mutedColor={muted} />
          <Stamp place="Pont Charles" title="Coucher de soleil" color={colors.stamp} tilt={10} mutedColor={muted} />
          <Stamp place="Malá Strana" title="Ruelles secrètes" color="#8A5A16" shape="square" tilt={-4} mutedColor={muted} />
          <Stamp place="Prague" title="Œuvres de Černý 2/4" color={colors.stamp} earned={false} mutedColor={muted} />
          <Stamp place="Prague" title="Lève-tôt 1/3" color={colors.stamp} earned={false} shape="square" mutedColor={muted} />
        </View>
      </View>

      <View style={styles.row}>
        <Tile label="Pépites" value="8/25" detail="Chasseur" tone={colors.tiles.gold} />
        <Tile label="Marche" value="9,4 km" detail="Marathonien" tone={colors.tiles.mint} />
        <Tile label="Villes" value="1/5" detail="Globe-trotter" tone={colors.tiles.blue} />
      </View>
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
});
