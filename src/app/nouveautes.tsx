import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { Icon } from '@/components/ui/icon';
import { Pill } from '@/components/ui/pill';
import { RText } from '@/components/ui/r-text';
import { changelog } from '@/content/changelog';
import { useRuellaTheme } from '@/theme/theme-context';
import { radius, space } from '@/theme/tokens';

/** Les nouveautés de chaque version, pour savoir ce qui a changé. */
export default function NouveautesScreen() {
  const { colors } = useRuellaTheme();
  const installed = Constants.expoConfig?.version ?? '';
  const updateDate = Updates.createdAt ? Updates.createdAt.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : null;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackButton />
        <View style={{ gap: 4 }}>
          <RText variant="overline" muted>
            Version installée : {installed}
            {updateDate ? ` · contenu du ${updateDate}` : ''}
          </RText>
          <RText variant="title">Nouveautés</RText>
        </View>
        {changelog.map((r, i) => (
          <Animated.View key={r.version} entering={FadeInDown.delay(i * 60)} style={[styles.card, { backgroundColor: i === 0 ? colors.tiles.lilac.bg : colors.surface }]}>
            <View style={styles.head}>
              <RText variant="place" style={{ fontSize: 24 }}>
                {r.version}
              </RText>
              {r.version === installed ? <Pill label="Installée" tone={colors.pills.success} /> : null}
              <RText variant="caption" muted style={{ marginLeft: 'auto' }}>
                {r.date.split('-').reverse().join('/')}
              </RText>
            </View>
            <RText variant="heading">{r.title}</RText>
            {r.items.map((it) => (
              <View key={it} style={styles.item}>
                <Icon name="check" size={16} color={colors.success} />
                <RText style={{ flex: 1 }}>{it}</RText>
              </View>
            ))}
          </Animated.View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.l, gap: space.m, paddingBottom: 60 },
  card: { borderRadius: radius.card + 4, padding: space.l, gap: space.s },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  item: { flexDirection: 'row', gap: space.s, alignItems: 'flex-start' },
});
