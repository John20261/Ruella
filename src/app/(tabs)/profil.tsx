import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, Share, StyleSheet, Switch, TextInput, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { RText } from '@/components/ui/r-text';
import { Screen } from '@/components/ui/screen';
import type { AgeBand } from '@/content/types';
import { cities } from '@/lib/catalog';
import { askLocation } from '@/lib/location';
import { scheduleMorning } from '@/lib/notifications';
import { cityPhotos, downloadCity, offlineDate } from '@/lib/offline';
import { actions, activeTrip, getState, useApp } from '@/store/app-store';
import type { Pace, Traveler } from '@/store/types';
import { useRuellaTheme, type ThemePreference } from '@/theme/theme-context';
import { fonts, radius, space, touch } from '@/theme/tokens';

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Auto' },
  { value: 'dark', label: 'Sombre' },
  { value: 'light', label: 'Clair' },
];
const PACES: { value: Pace; label: string }[] = [
  { value: 'calme', label: 'Tranquille' },
  { value: 'equilibre', label: 'Équilibré' },
  { value: 'intense', label: 'Intense' },
];
const BAND_LABEL: Record<AgeBand, string> = { adult: 'Adulte', '13-17': '15', '8-12': '10', under8: '4' };
/** Âge exact pour les enfants (tarifs) ; au-delà de 17 ans : adulte. */
function withAge(t: Traveler, age: number): Traveler {
  if (age >= 18) return { ...t, band: 'adult', age: undefined };
  return { ...t, age, band: age < 8 ? 'under8' : age <= 12 ? '8-12' : '13-17' };
}

export default function ProfilScreen() {
  const { colors, preference, setPreference } = useRuellaTheme();
  const profile = useApp((s) => s.profile);
  const trip = useApp(activeTrip);
  const [offline, setOffline] = useState<Record<string, string | null>>({});
  const [progress, setProgress] = useState<{ cityId: string; done: number; total: number } | null>(null);
  const [editorTaps, setEditorTaps] = useState(0);

  useEffect(() => {
    Promise.all(cities.map(async (c) => [c.id, await offlineDate(c.id)] as const)).then((rows) => setOffline(Object.fromEntries(rows)));
  }, []);

  const card = [styles.card, { backgroundColor: colors.surface }];
  const line = [styles.line, { borderBottomColor: colors.border }];

  const exportData = async () => {
    const s = getState();
    const data = JSON.stringify({ exportéLe: new Date().toISOString(), profil: s.profile, séjours: s.trips, visites: s.visits }, null, 2);
    try {
      await Share.share({ title: 'Mes données Ruella', message: data });
    } catch {
      // partage annulé
    }
  };

  const eraseAll = () => {
    const go = () => actions.resetAll();
    if (Platform.OS === 'web') return go();
    Alert.alert('Tout effacer ?', 'Séjours, visites, points et tampons seront supprimés de ce téléphone. C’est définitif.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Tout effacer', style: 'destructive', onPress: go },
    ]);
  };

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const updateDate = Updates.createdAt ? Updates.createdAt.toLocaleDateString('fr-FR') : null;

  return (
    <Screen>
      <RText variant="title">Profil</RText>

      <Section title="Voyageurs">
        <View style={card}>
          {profile.travelers.map((t, i) => (
            <View key={t.id} style={[line, i === profile.travelers.length - 1 && { borderBottomWidth: 0 }]}>
              <TextInput
                value={t.name}
                onChangeText={(name) => actions.setProfile({ travelers: profile.travelers.map((x) => (x.id === t.id ? { ...x, name } : x)) })}
                style={[styles.input, { color: colors.text }]}
                accessibilityLabel={`Prénom du voyageur ${i + 1}`}
                maxLength={24}
              />
              <View style={styles.ageRow}>
                <Pressable
                  onPress={() => actions.setProfile({ travelers: profile.travelers.map((x) => (x.id === t.id ? withAge(x, x.band === 'adult' ? 17 : Math.max(0, (x.age ?? 10) - 1)) : x)) })}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.name} : plus jeune`}
                  hitSlop={6}
                  style={[styles.ageBtn, { backgroundColor: colors.surfaceAlt }]}>
                  <Icon name="left" size={14} />
                </Pressable>
                <RText variant="caption" style={{ minWidth: 58, textAlign: 'center' }}>
                  {t.band === 'adult' ? 'Adulte' : `${t.age ?? BAND_LABEL[t.band]} ans`}
                </RText>
                <Pressable
                  onPress={() => actions.setProfile({ travelers: profile.travelers.map((x) => (x.id === t.id ? withAge(x, x.band === 'adult' ? 18 : (x.age ?? 10) + 1) : x)) })}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.name} : plus âgé`}
                  hitSlop={6}
                  style={[styles.ageBtn, { backgroundColor: colors.surfaceAlt }]}>
                  <Icon name="right" size={14} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
        <RText variant="caption" muted>
          Pas de compte enfant : l’âge sert à choisir les visites et à calculer les tarifs réduits du budget.
        </RText>
      </Section>

      <Section title="Préférences">
        <View style={card}>
          <View style={line}>
            <RText>Thème</RText>
            <Segment options={THEMES} value={preference} onChange={setPreference} />
          </View>
          <View style={[line, { borderBottomWidth: 0 }]}>
            <RText>Rythme</RText>
            <Segment options={PACES} value={profile.pace} onChange={(pace) => actions.setProfile({ pace })} />
          </View>
        </View>
      </Section>

      <Section title="Pendant le séjour">
        <View style={card}>
          <View style={line}>
            <View style={{ flex: 1, paddingVertical: space.s }}>
              <RText>Programme du matin</RText>
              <RText variant="caption" muted>
                Une notification à 8 h avec la journée
              </RText>
            </View>
            <Switch
              value={profile.morning}
              onValueChange={async (morning) => {
                actions.setProfile({ morning });
                await scheduleMorning(trip, morning);
              }}
              accessibilityLabel="Programme du matin"
            />
          </View>
          <View style={[line, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1, paddingVertical: space.s }}>
              <RText>Validation sur place</RText>
              <RText variant="caption" muted>
                Coche l’étape quand vous arrivez (+25 pts). La position reste sur le téléphone.
              </RText>
            </View>
            <Switch
              value={profile.autoCheck}
              onValueChange={async (autoCheck) => {
                if (autoCheck && !(await askLocation())) return;
                actions.setProfile({ autoCheck });
              }}
              accessibilityLabel="Validation automatique des visites"
            />
          </View>
        </View>
      </Section>

      <Section title="Hors ligne">
        <View style={card}>
          {cities.map((c, i) => {
            const date = offline[c.id];
            const busy = progress?.cityId === c.id;
            return (
              <Row
                key={c.id}
                icon="download"
                label={busy ? `Enregistrement… ${progress.done}/${progress.total}` : date ? `Photos de ${c.name} enregistrées` : `Enregistrer les photos de ${c.name}`}
                detail={date && !busy ? `Le ${new Date(date).toLocaleDateString('fr-FR')} · fiches et carte sont toujours disponibles` : `${cityPhotos(c.id).length} photos, pour un séjour sans réseau`}
                last={i === cities.length - 1}
                onPress={async () => {
                  if (progress) return;
                  setProgress({ cityId: c.id, done: 0, total: cityPhotos(c.id).length });
                  await downloadCity(c.id, (done, total) => setProgress({ cityId: c.id, done, total }));
                  setProgress(null);
                  const d = await offlineDate(c.id);
                  setOffline((o) => ({ ...o, [c.id]: d }));
                }}
              />
            );
          })}
        </View>
      </Section>

      <Section title="Vos données">
        <View style={card}>
          <Row icon="shield" label="Compte" detail="Local : tout reste sur ce téléphone, sans inscription" />
          <Row icon="download" label="Exporter mes données" detail="Séjours, visites et réglages au format JSON" onPress={exportData} />
          <Row icon="book" label="Confidentialité" onPress={() => router.push('/confidentialite')} />
          <Row icon="trash" label="Tout effacer" danger last onPress={eraseAll} />
        </View>
      </Section>

      <Pressable
        onPress={() => {
          const n = editorTaps + 1;
          setEditorTaps(n);
          if (n >= 5) {
            setEditorTaps(0);
            router.push('/editeur');
          }
        }}
        accessibilityLabel={`Ruella version ${version}`}>
        <RText variant="caption" muted style={{ textAlign: 'center' }}>
          Ruella {version}
          {updateDate ? ` · mise à jour du ${updateDate}` : ''}
        </RText>
      </Pressable>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.s, marginTop: space.s }}>
      <RText variant="overline" muted>
        {title}
      </RText>
      {children}
    </View>
  );
}

function Row({ icon, label, detail, onPress, danger, last }: { icon: IconName; label: string; detail?: string; onPress?: () => void; danger?: boolean; last?: boolean }) {
  const { colors } = useRuellaTheme();
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      style={({ pressed }) => [styles.line, { borderBottomColor: colors.border, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, opacity: pressed ? 0.7 : 1, gap: space.m }]}>
      <Icon name={icon} size={20} color={danger ? colors.danger : colors.textMuted} />
      <View style={{ flex: 1, paddingVertical: space.s }}>
        <RText color={danger ? colors.danger : undefined}>{label}</RText>
        {detail ? (
          <RText variant="caption" muted>
            {detail}
          </RText>
        ) : null}
      </View>
      {onPress ? <Icon name="right" size={18} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

function Segment<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const { colors } = useRuellaTheme();
  return (
    <View accessibilityRole="radiogroup" style={[styles.segment, { backgroundColor: colors.background }]}>
      {options.map((t) => {
        const active = value === t.value;
        return (
          <Pressable
            key={t.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            onPress={() => onChange(t.value)}
            style={[styles.segmentItem, active && { backgroundColor: colors.action }]}>
            <RText style={styles.segmentText} color={active ? colors.onAction : colors.textMuted}>
              {t.label}
            </RText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card + 2, paddingHorizontal: space.l, paddingVertical: space.xs },
  line: {
    minHeight: touch.min + 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: space.s,
  },
  input: { flex: 1, fontFamily: fonts.bold, fontSize: 15, minHeight: touch.min, paddingVertical: 0 },
  ageRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ageBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segment: { flexDirection: 'row', borderRadius: 12, padding: 3 },
  segmentItem: { minHeight: 36, paddingHorizontal: 10, borderRadius: 9, justifyContent: 'center' },
  segmentText: { fontFamily: fonts.bold, fontSize: 12 },
});
