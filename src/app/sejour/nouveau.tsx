import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInRight, FadeOutLeft, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { RText } from '@/components/ui/r-text';
import type { AgeBand, Wish } from '@/content/types';
import { capitals } from '@/content/cities';
import { cities, getPlaces } from '@/lib/catalog';
import { dayLong, dayShort, hour } from '@/lib/dates';
import { currentPosition } from '@/lib/location';
import { scheduleMorning } from '@/lib/notifications';
import { MEAL_BUDGET_LABEL, MEAL_CAP_EUR } from '@/lib/budget';
import { addDays, planTrip } from '@/lib/planner';
import { toMinutes, toTime } from '@/lib/schedule';
import { actions, getState, todayISO, useApp } from '@/store/app-store';
import type { Base, MealBudget, Pace, Traveler, Trip } from '@/store/types';
import { useRuellaTheme } from '@/theme/theme-context';
import { fonts, radius, space, touch } from '@/theme/tokens';

function bandOf(age: number): AgeBand {
  return age < 8 ? 'under8' : age <= 12 ? '8-12' : age <= 17 ? '13-17' : 'adult';
}

const STEPS = ['Où ?', 'Quand ?', 'Qui ?', 'Comment ?', 'Budget', 'Départ'];

/** Recherche sans accents ni majuscules (« budapest », « hongrie », « lisb »). */
function matchCity(name: string, country: string, query: string): boolean {
  const norm = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const q = norm(query.trim());
  return !q || norm(name).includes(q) || norm(country).includes(q);
}

function cityDetail(id: string): string {
  const places = getPlaces(id);
  const gems = places.filter((p) => p.kind === 'gem').length;
  return `${places.length} lieux · ${gems} pépites`;
}

const PACES: { pace: Pace; title: string; detail: string; icon: IconName }[] = [
  { pace: 'calme', title: 'Tranquille', detail: 'Environ 5 h 30 de visites, pauses longues', icon: 'walk' },
  { pace: 'equilibre', title: 'Équilibré', detail: 'Environ 7 h, le bon rythme en famille', icon: 'route' },
  { pace: 'intense', title: 'Intense', detail: 'Environ 8 h 30, on voit un maximum', icon: 'sparkles' },
];

const WISHES: { wish: Wish; label: string }[] = [
  { wish: 'histoire', label: 'Histoire' },
  { wish: 'insolite', label: 'Insolite' },
  { wish: 'vues', label: 'Panoramas' },
  { wish: 'art', label: 'Art' },
  { wish: 'architecture', label: 'Architecture' },
  { wish: 'enfants', label: 'Pour les enfants' },
  { wish: 'gourmand', label: 'Gourmand' },
  { wish: 'nature', label: 'Nature' },
  { wish: 'photo', label: 'Photo' },
  { wish: 'musique', label: 'Musique' },
  { wish: 'shopping', label: 'Shopping' },
];

const BASES: Record<string, Base[]> = {
  prague: [
    { name: 'Place de la Vieille-Ville', lat: 50.0875, lng: 14.4214 },
    { name: 'Náměstí Republiky', lat: 50.0882, lng: 14.4282 },
    { name: 'Place Venceslas', lat: 50.0814, lng: 14.428 },
    { name: 'Malá Strana', lat: 50.0878, lng: 14.4036 },
    { name: 'Gare centrale', lat: 50.0832, lng: 14.4353 },
    { name: 'Anděl', lat: 50.0706, lng: 14.4036 },
  ],
  toulouse: [
    { name: 'Place du Capitole', lat: 43.6045, lng: 1.444 },
    { name: 'Jean-Jaurès', lat: 43.606, lng: 1.449 },
    { name: 'Gare Matabiau', lat: 43.6113, lng: 1.4538 },
    { name: 'Les Carmes', lat: 43.5976, lng: 1.4453 },
    { name: 'Saint-Cyprien', lat: 43.5975, lng: 1.431 },
    { name: 'Compans-Caffarelli', lat: 43.611, lng: 1.435 },
  ],
  ...Object.fromEntries(capitals.map((c) => [c.city.id, c.bases])),
};

export default function NouveauSejour() {
  const { colors } = useRuellaTheme();
  const profile = useApp((s) => s.profile);
  const visitedCount = useApp((s) => new Set(s.visits.map((v) => v.placeId)).size);

  const [step, setStep] = useState(0);
  const [cityId, setCityId] = useState('prague');
  const [start, setStart] = useState(todayISO());
  const [days, setDays] = useState(3);
  const [startTime, setStartTime] = useState('09:30');
  const [travelers, setTravelers] = useState<Traveler[]>(profile.travelers);
  const [pace, setPace] = useState<Pace>(profile.pace);
  const [wishes, setWishes] = useState<Wish[]>(profile.wishes);
  const [base, setBase] = useState<Base>(BASES.prague[0]);
  const [cityQuery, setCityQuery] = useState('');
  const [rainDays, setRainDays] = useState<number[]>([]);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mealBudget, setMealBudget] = useState<MealBudget>(profile.mealBudget ?? 'malin');

  const progress = useAnimatedStyle(() => ({ width: withSpring(`${((step + 1) / STEPS.length) * 100}%`, { damping: 18 }) }));

  const addTraveler = (band: AgeBand) =>
    setTravelers((t) => [
      ...t,
      band === 'adult'
        ? { id: `t${Date.now().toString(36)}`, name: `Adulte ${t.filter((x) => x.band === 'adult').length + 1}`, band }
        : { id: `t${Date.now().toString(36)}`, name: `Enfant ${t.filter((x) => x.band !== 'adult').length + 1}`, band: bandOf(10), age: 10 },
    ]);
  const setAge = (id: string, age: number) =>
    setTravelers((list) => list.map((x) => (x.id === id ? { ...x, age, band: bandOf(age) } : x)));

  const compose = () => {
    setBusy(true);
    // On laisse l'animation s'afficher avant le calcul (quelques millisecondes).
    setTimeout(() => {
      const ages = [...new Set(travelers.map((t) => t.band))];
      const planned = planTrip({
        places: getPlaces(cityId),
        cityId,
        startDate: start,
        days,
        startTime,
        pace,
        wishes,
        ages,
        base,
        rainDays,
        exclude: [...new Set(getState().visits.map((v) => v.placeId))],
        mealCapEUR: MEAL_CAP_EUR[mealBudget],
      });
      const trip: Trip = { id: `trip${Date.now().toString(36)}`, cityId, createdAt: new Date().toISOString(), base, days: planned, mealBudget, expenses: [] };
      actions.setProfile({ travelers, pace, wishes, mealBudget });
      actions.addTrip(trip);
      scheduleMorning(trip, getState().profile.morning);
      router.dismissAll();
      router.replace('/');
    }, 900);
  };

  if (busy) {
    return (
      <View style={[styles.busy, { backgroundColor: colors.background }]}>
        <Animated.View entering={FadeIn} style={{ alignItems: 'center', gap: space.l }}>
          <ActivityIndicator size="large" color={colors.accent} />
          <RText variant="place" style={{ textAlign: 'center' }}>
            Composition de vos {days} journées…
          </RText>
          <RText muted style={{ textAlign: 'center' }}>
            Quartiers regroupés, déjeuners sur le chemin, pépites glissées entre deux visites.
          </RText>
        </Animated.View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <BackButton onPress={() => (step === 0 ? router.back() : setStep(step - 1))} />
        <RText variant="caption" muted>
          Étape {step + 1} sur {STEPS.length}
        </RText>
      </View>
      <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
        <Animated.View style={[styles.fill, { backgroundColor: colors.accent }, progress]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Animated.View key={step} entering={FadeInRight.duration(260)} exiting={FadeOutLeft.duration(160)} style={{ gap: space.l }}>
          <RText variant="title">{STEPS[step]}</RText>

          {step === 0 ? (
            <View style={{ gap: space.m }}>
              <View style={[styles.search, { backgroundColor: colors.surface }]}>
                <Icon name="pin" size={18} color={colors.textMuted} />
                <TextInput
                  value={cityQuery}
                  onChangeText={setCityQuery}
                  placeholder={`Chercher parmi ${cities.length} villes`}
                  placeholderTextColor={colors.textMuted}
                  style={[styles.searchInput, { color: colors.text }]}
                  accessibilityLabel="Rechercher une ville"
                  returnKeyType="search"
                />
                {cityQuery ? (
                  <Pressable onPress={() => setCityQuery('')} accessibilityLabel="Effacer la recherche" hitSlop={10}>
                    <Icon name="close" size={18} color={colors.textMuted} />
                  </Pressable>
                ) : null}
              </View>
              {cities.filter((c) => matchCity(c.name, c.country, cityQuery)).map((c) => (
                <Option
                  key={c.id}
                  title={c.name}
                  detail={`${c.country} · ${cityDetail(c.id)}`}
                  icon="pin"
                  active={cityId === c.id}
                  onPress={() => {
                    setCityId(c.id);
                    setBase(BASES[c.id]?.[0] ?? { name: c.name, ...(c.center ?? { lat: 0, lng: 0 }) });
                  }}
                />
              ))}
            </View>
          ) : null}

          {step === 1 ? (
            <View style={{ gap: space.l }}>
              <Stepper label="Premier jour" value={dayLong(start)} onMinus={() => setStart(addDays(start, -1))} onPlus={() => setStart(addDays(start, 1))} />
              <Stepper label="Nombre de jours" value={`${days} jour${days > 1 ? 's' : ''}`} onMinus={() => setDays(Math.max(1, days - 1))} onPlus={() => setDays(Math.min(7, days + 1))} />
              <Stepper
                label="Départ chaque matin"
                value={hour(startTime)}
                onMinus={() => setStartTime(toTime(Math.max(6 * 60, toMinutes(startTime) - 30)))}
                onPlus={() => setStartTime(toTime(Math.min(14 * 60, toMinutes(startTime) + 30)))}
              />
              <View style={{ gap: space.s }}>
                <RText variant="bodyStrong">Pluie annoncée ?</RText>
                <RText variant="caption" muted>
                  Touchez les jours pluvieux : on y regroupe musées et lieux couverts.
                </RText>
                <View style={styles.wrap}>
                  {Array.from({ length: days }, (_, i) => (
                    <Toggle key={i} label={`${dayShort(addDays(start, i))}${rainDays.includes(i) ? ' · pluie' : ''}`} active={rainDays.includes(i)} onPress={() => setRainDays((r) => (r.includes(i) ? r.filter((x) => x !== i) : [...r, i]))} />
                  ))}
                </View>
              </View>
            </View>
          ) : null}

          {step === 2 ? (
            <View style={{ gap: space.m }}>
              {travelers.map((t) => (
                <View key={t.id} style={[styles.traveler, { backgroundColor: colors.surface }]}>
                  <Icon name="user" size={22} color={colors.textMuted} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <RText variant="bodyStrong">{t.name}</RText>
                    {t.band === 'adult' ? (
                      <RText variant="caption" muted>
                        Adulte · plein tarif
                      </RText>
                    ) : (
                      <View style={styles.ageRow}>
                        <Pressable onPress={() => setAge(t.id, Math.max(0, (t.age ?? 10) - 1))} accessibilityRole="button" accessibilityLabel={`${t.name} : un an de moins`} style={[styles.ageBtn, { backgroundColor: colors.surfaceAlt }]}>
                          <Icon name="left" size={16} />
                        </Pressable>
                        <RText variant="heading" style={{ minWidth: 64, textAlign: 'center' }}>
                          {t.age ?? 10} ans
                        </RText>
                        <Pressable onPress={() => setAge(t.id, Math.min(17, (t.age ?? 10) + 1))} accessibilityRole="button" accessibilityLabel={`${t.name} : un an de plus`} style={[styles.ageBtn, { backgroundColor: colors.surfaceAlt }]}>
                          <Icon name="right" size={16} />
                        </Pressable>
                      </View>
                    )}
                  </View>
                  {travelers.length > 1 ? (
                    <Pressable onPress={() => setTravelers((list) => list.filter((x) => x.id !== t.id))} accessibilityRole="button" accessibilityLabel={`Retirer ${t.name}`} hitSlop={8} style={styles.iconBtn}>
                      <Icon name="close" size={18} color={colors.textMuted} />
                    </Pressable>
                  ) : null}
                </View>
              ))}
              <View style={styles.row}>
                <Button label="+ Adulte" variant="secondary" style={{ flex: 1 }} onPress={() => addTraveler('adult')} />
                <Button label="+ Enfant" variant="secondary" style={{ flex: 1 }} onPress={() => addTraveler('8-12')} />
              </View>
              <RText variant="caption" muted>
                L’âge exact des enfants sert à choisir les visites et à calculer les tarifs réduits. Aucun compte n’est créé pour eux.
              </RText>
            </View>
          ) : null}

          {step === 3 ? (
            <View style={{ gap: space.l }}>
              <View style={{ gap: space.m }}>
                {PACES.map((p) => (
                  <Option key={p.pace} title={p.title} detail={p.detail} icon={p.icon} active={pace === p.pace} onPress={() => setPace(p.pace)} />
                ))}
              </View>
              <RText variant="heading">Vos envies</RText>
              <View style={styles.wrap}>
                {WISHES.map((w) => (
                  <Toggle key={w.wish} label={w.label} active={wishes.includes(w.wish)} onPress={() => setWishes((list) => (list.includes(w.wish) ? list.filter((x) => x !== w.wish) : [...list, w.wish]))} />
                ))}
              </View>
            </View>
          ) : null}

          {step === 4 ? (
            <View style={{ gap: space.m }}>
              <RText muted>Combien voulez-vous dépenser par repas ? Ruella choisit les restaurants en conséquence.</RText>
              {(Object.keys(MEAL_BUDGET_LABEL) as MealBudget[]).map((k) => (
                <Option key={k} title={MEAL_BUDGET_LABEL[k].title} detail={MEAL_BUDGET_LABEL[k].detail} icon={k === 'serre' ? 'walk' : k === 'libre' ? 'sparkles' : 'route'} active={mealBudget === k} onPress={() => setMealBudget(k)} />
              ))}
              <View style={[styles.note, { backgroundColor: colors.tiles.mint.bg }]}>
                <RText variant="bodyStrong" color={colors.tiles.mint.ink}>
                  Un budget complet vous attend
                </RText>
                <RText variant="caption" color={colors.tiles.mint.ink}>
                  Entrées, repas, tickets de tram ou de métro, jour par jour : estimés pour {travelers.length} personne{travelers.length > 1 ? 's' : ''}. Vous pourrez y ajouter vos billets de train et vos réservations.
                </RText>
              </View>
            </View>
          ) : null}

          {step === 5 ? (
            <View style={{ gap: space.m }}>
              <RText muted>Chaque journée part de là et s’organise autour.</RText>
              <Option
                title="Ma position actuelle"
                detail={base.name === 'Ma position' ? 'Utilisée pour ce séjour, elle reste sur le téléphone' : 'Idéal si vous êtes à votre hôtel'}
                icon="navigate"
                active={base.name === 'Ma position'}
                busy={locating}
                onPress={async () => {
                  setLocating(true);
                  const pos = await currentPosition();
                  setLocating(false);
                  if (pos) setBase({ name: 'Ma position', ...pos });
                }}
              />
              {(BASES[cityId] ?? []).map((b) => (
                <Option key={b.name} title={b.name} icon="pin" active={base.name === b.name} onPress={() => setBase(b)} />
              ))}
              {visitedCount > 0 ? (
                <RText variant="caption" muted>
                  {visitedCount} lieu{visitedCount > 1 ? 'x' : ''} déjà visité{visitedCount > 1 ? 's' : ''} : on ne vous les reproposera pas.
                </RText>
              ) : null}
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        {step < STEPS.length - 1 ? (
          <Button label="Continuer" onPress={() => setStep(step + 1)} style={{ flex: 1 }} />
        ) : (
          <Button label="Composer mon séjour" variant="celebrate" haptic onPress={compose} style={{ flex: 1 }} />
        )}
      </View>
    </SafeAreaView>
  );
}

function Option({ title, detail, icon, active, disabled, busy, onPress }: { title: string; detail?: string; icon: IconName; active: boolean; disabled?: boolean; busy?: boolean; onPress: () => void }) {
  const { colors } = useRuellaTheme();
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: active, disabled }}
      accessibilityLabel={detail ? `${title}, ${detail}` : title}
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: colors.surface, borderColor: active ? colors.accent : 'transparent', opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
      ]}>
      <View style={[styles.optionIcon, { backgroundColor: active ? colors.accent : colors.surfaceAlt }]}>
        {busy ? <ActivityIndicator color={colors.onAction} /> : <Icon name={icon} size={20} color={active ? colors.onAction : colors.textMuted} />}
      </View>
      <View style={{ flex: 1 }}>
        <RText variant="heading">{title}</RText>
        {detail ? (
          <RText variant="caption" muted>
            {detail}
          </RText>
        ) : null}
      </View>
      {active ? <Icon name="check" size={22} color={colors.accent} strokeWidth={2.6} /> : null}
    </Pressable>
  );
}

function Toggle({ label, active, onPress, small }: { label: string; active: boolean; onPress: () => void; small?: boolean }) {
  const { colors } = useRuellaTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
      style={[styles.toggle, small && styles.toggleSmall, { backgroundColor: active ? colors.action : colors.surface, borderColor: active ? colors.action : colors.border }]}>
      <RText style={{ fontFamily: fonts.bold, fontSize: small ? 12 : 14 }} color={active ? colors.onAction : colors.text}>
        {label}
      </RText>
    </Pressable>
  );
}

function Stepper({ label, value, onMinus, onPlus }: { label: string; value: string; onMinus: () => void; onPlus: () => void }) {
  const { colors } = useRuellaTheme();
  return (
    <View style={[styles.stepper, { backgroundColor: colors.surface }]}>
      <View style={{ flex: 1 }}>
        <RText variant="caption" muted>
          {label}
        </RText>
        <RText variant="heading">{value}</RText>
      </View>
      <Pressable onPress={onMinus} accessibilityRole="button" accessibilityLabel={`${label} : moins`} style={[styles.stepBtn, { backgroundColor: colors.surfaceAlt }]}>
        <Icon name="left" size={18} />
      </Pressable>
      <Pressable onPress={onPlus} accessibilityRole="button" accessibilityLabel={`${label} : plus`} style={[styles.stepBtn, { backgroundColor: colors.surfaceAlt }]}>
        <Icon name="right" size={18} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: space.s, paddingHorizontal: space.m, borderRadius: radius.button, minHeight: touch.primary },
  searchInput: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, paddingVertical: 0 },
  root: { flex: 1 },
  busy: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.l, paddingTop: space.s },
  track: { height: 4, marginHorizontal: space.l, marginTop: space.m, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
  content: { padding: space.l, paddingBottom: 40 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  row: { flexDirection: 'row', gap: space.s },
  option: { flexDirection: 'row', alignItems: 'center', gap: space.m, padding: space.m, borderRadius: radius.card, borderWidth: 2, minHeight: 68 },
  optionIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  toggle: { paddingHorizontal: 14, minHeight: touch.min, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center' },
  toggleSmall: { paddingHorizontal: 10, minHeight: 34 },
  traveler: { flexDirection: 'row', alignItems: 'flex-start', gap: space.m, padding: space.m, borderRadius: radius.card },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  ageRow: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  ageBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  note: { borderRadius: radius.card, padding: space.l, gap: 4 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space.s, padding: space.m, borderRadius: radius.card },
  stepBtn: { width: touch.min, height: touch.min, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  footer: { padding: space.l, borderTopWidth: StyleSheet.hairlineWidth },
});
