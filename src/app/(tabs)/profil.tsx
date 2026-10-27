import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { useState } from 'react';

import { RText } from '@/components/ui/r-text';
import { Screen } from '@/components/ui/screen';
import { useRuellaTheme, type ThemePreference } from '@/theme/theme-context';
import { fonts, radius, space, touch } from '@/theme/tokens';

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Auto' },
  { value: 'dark', label: 'Sombre' },
  { value: 'light', label: 'Clair' },
];

const FAMILY = [
  { name: 'Claire', detail: 'Adulte · titulaire' },
  { name: 'Vous', detail: 'Adulte' },
  { name: 'Léo', detail: '13–17 ans' },
  { name: 'Inès', detail: '8–12 ans' },
];

export default function ProfilScreen() {
  const { colors, preference, setPreference } = useRuellaTheme();
  const [morning, setMorning] = useState(true);
  const [autoCheck, setAutoCheck] = useState(false);

  const card = [styles.card, { backgroundColor: colors.surface }];
  const line = [styles.line, { borderBottomColor: colors.border }];

  return (
    <Screen>
      <RText variant="title">Profil</RText>

      <View style={card}>
        {FAMILY.map((m) => (
          <View key={m.name} style={line}>
            <RText variant="bodyStrong">{m.name}</RText>
            <RText variant="caption" muted>
              {m.detail}
            </RText>
          </View>
        ))}
      </View>

      <View style={card}>
        <View style={line}>
          <RText>Thème</RText>
          <View accessibilityRole="radiogroup" style={[styles.segment, { backgroundColor: colors.background }]}>
            {THEMES.map((t) => {
              const active = preference === t.value;
              return (
                <Pressable
                  key={t.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  onPress={() => setPreference(t.value)}
                  style={[styles.segmentItem, active && { backgroundColor: colors.action }]}>
                  <RText style={styles.segmentText} color={active ? colors.onAction : colors.textMuted}>
                    {t.label}
                  </RText>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={line}>
          <RText>Notification du matin</RText>
          <Switch value={morning} onValueChange={setMorning} accessibilityLabel="Notification du matin" />
        </View>
        <View style={[styles.line, { borderBottomWidth: 0 }]}>
          <RText>Validation automatique</RText>
          <Switch value={autoCheck} onValueChange={setAutoCheck} accessibilityLabel="Validation automatique des visites" />
        </View>
      </View>

      <RText variant="caption" muted style={{ textAlign: 'center' }}>
        Ruella · lot 0 (fondations)
      </RText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card + 2, paddingHorizontal: space.l, paddingVertical: space.xs },
  line: {
    minHeight: touch.min + 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  segment: { flexDirection: 'row', borderRadius: 12, padding: 3 },
  segmentItem: { minHeight: 36, paddingHorizontal: 12, borderRadius: 9, justifyContent: 'center' },
  segmentText: { fontFamily: fonts.bold, fontSize: 13 },
});
