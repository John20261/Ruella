import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { RText } from '@/components/ui/r-text';
import { Screen } from '@/components/ui/screen';
import { useRuellaTheme } from '@/theme/theme-context';
import { radius, space } from '@/theme/tokens';

const DAYS = [
  { label: 'Vendredi 23', area: 'Vieille-Ville & Josefov', gems: '3 pépites' },
  { label: 'Samedi 24', area: 'Hradčany & Malá Strana', gems: '8 pépites' },
  { label: 'Dimanche 25', area: "100 % à l'abri", gems: 'Plan B pluie' },
];

export default function SejoursScreen() {
  const { colors } = useRuellaTheme();
  return (
    <Screen>
      <RText variant="title">Séjours</RText>
      <RText variant="placeLarge">Prague, 3 jours</RText>
      <RText muted>Ven. 23 → dim. 25 oct. · 4 voyageurs · rythme équilibré</RText>
      {DAYS.map((d) => (
        <View key={d.label} style={[styles.card, { backgroundColor: colors.surface }]}>
          <RText variant="overline" muted>
            {d.label}
          </RText>
          <RText variant="place" style={{ fontSize: 22, lineHeight: 26 }}>
            {d.area}
          </RText>
          <Pill label={d.gems} tone={colors.pills.gem} />
        </View>
      ))}
      <Button label="Créer un séjour" variant="celebrate" style={{ marginTop: space.s }} />
      <RText variant="caption" muted style={{ textAlign: 'center' }}>
        {"L'assistant de création arrive au lot 4."}
      </RText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card + 6, padding: space.l, gap: space.s },
});
