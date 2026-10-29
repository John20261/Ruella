import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { TransitApps } from '@/components/transit-apps';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Pill } from '@/components/ui/pill';
import { RText } from '@/components/ui/r-text';
import { CATEGORY_LABEL, MEAL_BUDGET_LABEL, computeBudget, type BudgetCategory } from '@/lib/budget';
import { getCity, getPlace } from '@/lib/catalog';
import { dayLong, dayShort } from '@/lib/dates';
import { EUR_PER, formatEUR, formatLocal } from '@/lib/money';
import { actions, useApp } from '@/store/app-store';
import type { ExpenseCategory, MealBudget } from '@/store/types';
import { useRuellaTheme } from '@/theme/theme-context';
import { fonts, radius, space, touch } from '@/theme/tokens';

const CAT_ICON: Record<BudgetCategory, IconName> = {
  visites: 'book',
  repas: 'sparkles',
  transports: 'tram',
  trains: 'route',
  reservations: 'calendar',
  autre: 'more',
};

const EXPENSE_CATS: { key: ExpenseCategory; label: string }[] = [
  { key: 'train', label: 'Train' },
  { key: 'reservation', label: 'Réservation' },
  { key: 'transport', label: 'Taxi, navette' },
  { key: 'autre', label: 'Autre' },
];

/** Tableau de bord du budget : tout ce qu'on paiera sur place, jour par jour. */
export default function BudgetScreen() {
  const { colors } = useRuellaTheme();
  const { id, day } = useLocalSearchParams<{ id: string; day?: string }>();
  const trip = useApp((s) => s.trips.find((t) => t.id === id));
  const travelers = useApp((s) => s.profile.travelers);
  const [openDay, setOpenDay] = useState<number | null>(day !== undefined ? Number(day) : null);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState<ExpenseCategory>('train');
  const [paid, setPaid] = useState(true);
  const [date, setDate] = useState<string | undefined>(undefined);

  const city = trip ? getCity(trip.cityId) : undefined;
  const budget = useMemo(() => (trip ? computeBudget(trip, city, travelers, getPlace) : null), [trip, city, travelers]);

  if (!trip || !budget) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: space.l }}>
        <BackButton />
        <RText style={{ marginTop: space.l }}>Séjour introuvable.</RText>
      </SafeAreaView>
    );
  }

  const catColor: Record<BudgetCategory, string> = {
    visites: colors.tiles.blue.ink,
    repas: colors.tiles.mint.ink,
    transports: colors.accent,
    trains: colors.tiles.lilac.ink,
    reservations: colors.tiles.gold.ink,
    autre: colors.textMuted,
  };
  const maxDay = Math.max(1, ...budget.byDay.map((d) => d.amount));
  const level: MealBudget = trip.mealBudget ?? 'malin';
  const t = city?.transit;

  const addExpense = () => {
    const value = Number(amount.replace(',', '.').replace(/[^\d.]/g, ''));
    if (!label.trim() || !(value > 0)) return;
    actions.addExpense(trip.id, { label: label.trim(), amountEUR: value, category: cat, paid, date });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setLabel('');
    setAmount('');
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <BackButton />
        <View style={{ gap: 4 }}>
          <RText variant="overline" muted>
            Budget · {city?.name} · {travelers.length} voyageur{travelers.length > 1 ? 's' : ''}
          </RText>
          <RText variant="title">Ce que vous paierez</RText>
        </View>

        <Animated.View entering={FadeInDown} style={[styles.hero, { backgroundColor: colors.tiles.mint.bg }]}>
          <RText variant="overline" color={colors.tiles.mint.ink}>
            Total estimé du séjour
          </RText>
          <RText variant="placeLarge" style={{ fontSize: 46, lineHeight: 52 }}>
            ≈ {formatEUR(budget.total)}
          </RText>
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <RText variant="caption" color={colors.tiles.mint.ink}>
                À prévoir sur place
              </RText>
              <RText variant="heading">{formatEUR(budget.onSite)}</RText>
            </View>
            <View style={{ flex: 1 }}>
              <RText variant="caption" color={colors.tiles.mint.ink}>
                Déjà réglé
              </RText>
              <RText variant="heading">{formatEUR(budget.paid)}</RText>
            </View>
            <View style={{ flex: 1 }}>
              <RText variant="caption" color={colors.tiles.mint.ink}>
                Par personne
              </RText>
              <RText variant="heading">{formatEUR(budget.perPerson)}</RText>
            </View>
          </View>
          <RText variant="caption" color={colors.tiles.mint.ink}>
            {Math.round(budget.estimateShare * 100)} % du total est estimé (prix moyens, dîners) ; le reste vient des tarifs officiels ou de vos saisies.
          </RText>
        </Animated.View>

        {/* Répartition par poste */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <RText variant="heading">Par poste</RText>
          <View style={[styles.stack, { backgroundColor: colors.surfaceAlt }]}>
            {budget.byCategory.map((c) => (
              <View key={c.category} style={{ flex: c.amount, backgroundColor: catColor[c.category] }} />
            ))}
          </View>
          {budget.byCategory.map((c) => (
            <View key={c.category} style={styles.legend}>
              <View style={[styles.dot, { backgroundColor: catColor[c.category] }]}>
                <Icon name={CAT_ICON[c.category]} size={14} color={colors.background} />
              </View>
              <RText style={{ flex: 1 }}>{CATEGORY_LABEL[c.category]}</RText>
              <RText variant="caption" muted>
                {Math.round((c.amount / budget.total) * 100)} %
              </RText>
              <RText variant="bodyStrong" style={{ minWidth: 76, textAlign: 'right' }}>
                {formatEUR(c.amount)}
              </RText>
            </View>
          ))}
        </View>

        {/* Budget repas */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <RText variant="heading">Budget repas</RText>
          <RText variant="caption" muted>
            Sert à estimer les dîners et à choisir les restaurants de vos prochains séjours.
          </RText>
          <View style={styles.wrap}>
            {(Object.keys(MEAL_BUDGET_LABEL) as MealBudget[]).map((k) => {
              const active = k === level;
              return (
                <Pressable key={k} onPress={() => actions.setMealBudget(trip.id, k)} accessibilityRole="radio" accessibilityState={{ checked: active }} style={[styles.chip, { backgroundColor: active ? colors.action : colors.surfaceAlt }]}>
                  <RText style={styles.chipText} color={active ? colors.onAction : colors.text}>
                    {MEAL_BUDGET_LABEL[k].title}
                  </RText>
                </Pressable>
              );
            })}
          </View>
          <RText variant="caption" muted>
            {MEAL_BUDGET_LABEL[level].detail}
          </RText>
        </View>

        {/* Jour par jour */}
        <RText variant="heading" style={{ marginTop: space.s }}>
          Jour par jour, sur place
        </RText>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.bars}>
            {budget.byDay.map((d) => (
              <Pressable key={d.dayIndex} onPress={() => setOpenDay(openDay === d.dayIndex ? null : d.dayIndex)} accessibilityRole="button" accessibilityLabel={`Jour ${d.dayIndex + 1} : ${formatEUR(d.amount)}`} style={styles.barCol}>
                <RText variant="caption" style={{ fontFamily: fonts.bold }}>
                  {formatEUR(d.amount)}
                </RText>
                <View style={[styles.barTrack, { backgroundColor: colors.surfaceAlt }]}>
                  <View style={[styles.barFill, { height: `${(d.amount / maxDay) * 100}%`, backgroundColor: openDay === d.dayIndex ? colors.accent : colors.tiles.mint.ink }]} />
                </View>
                <RText variant="caption" muted>
                  {dayShort(trip.days[d.dayIndex].date)}
                </RText>
              </Pressable>
            ))}
          </View>
        </View>

        {trip.days.map((d, di) => {
          const lines = budget.lines.filter((l) => l.dayIndex === di);
          const open = openDay === di;
          return (
            <View key={d.date} style={[styles.card, { backgroundColor: colors.surface }]}>
              <Pressable onPress={() => setOpenDay(open ? null : di)} accessibilityRole="button" accessibilityState={{ expanded: open }} style={styles.dayHead}>
                <View style={{ flex: 1 }}>
                  <RText variant="overline" muted>
                    Jour {di + 1} · {dayLong(d.date)}
                  </RText>
                  <RText variant="bodyStrong">{d.title}</RText>
                </View>
                <RText variant="heading">{formatEUR(budget.byDay[di].amount)}</RText>
                <Icon name={open ? 'up' : 'down'} size={18} color={colors.textMuted} />
              </Pressable>
              {open
                ? lines.map((l) => (
                    <View key={l.id} style={[styles.line, { borderTopColor: colors.border }]}>
                      <View style={[styles.dot, { backgroundColor: catColor[l.category] }]}>
                        <Icon name={CAT_ICON[l.category]} size={14} color={colors.background} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <RText numberOfLines={1}>{l.label}</RText>
                        <RText variant="caption" muted numberOfLines={1}>
                          {l.detail ?? CATEGORY_LABEL[l.category]}
                          {l.local ? ` · ${formatLocal(l.local.amount, l.local.currency)}` : ''}
                        </RText>
                      </View>
                      {l.estimate ? <Pill label="estimé" tone={colors.tiles.neutral} /> : null}
                      <RText variant="bodyStrong" style={{ minWidth: 64, textAlign: 'right' }}>
                        {formatEUR(l.amountEUR)}
                      </RText>
                    </View>
                  ))
                : null}
            </View>
          );
        })}

        {/* Transports en commun */}
        {t ? (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.dayHead}>
              <View style={[styles.dot, { backgroundColor: colors.accent, width: 36, height: 36, borderRadius: 12 }]}>
                <Icon name="tram" size={20} color={colors.background} />
              </View>
              <View style={{ flex: 1 }}>
                <RText variant="heading">Transports en commun</RText>
                <RText variant="caption" muted>
                  {t.network}
                </RText>
              </View>
            </View>
            <View style={styles.ticketRow}>
              <View style={[styles.ticket, { backgroundColor: colors.surfaceAlt }]}>
                <RText variant="caption" muted>
                  {t.single.label}
                </RText>
                <RText variant="heading">{formatLocal(t.single.adult, t.currency)}</RText>
                {t.currency !== 'EUR' ? (
                  <RText variant="caption" muted>
                    ≈ {formatEUR(t.single.adult * EUR_PER[t.currency])}
                  </RText>
                ) : null}
              </View>
              <View style={[styles.ticket, { backgroundColor: colors.surfaceAlt }]}>
                <RText variant="caption" muted>
                  {t.day.label}
                </RText>
                <RText variant="heading">{formatLocal(t.day.adult, t.currency)}</RText>
                {t.currency !== 'EUR' ? (
                  <RText variant="caption" muted>
                    ≈ {formatEUR(t.day.adult * EUR_PER[t.currency])}
                  </RText>
                ) : null}
              </View>
            </View>
            <RText>{t.howToBuy}</RText>
            <TransitApps apps={t.apps} />
            {t.tips.map((tip) => (
              <View key={tip} style={styles.tip}>
                <Icon name="check" size={16} color={colors.success} />
                <RText variant="caption" style={{ flex: 1 }}>
                  {tip}
                </RText>
              </View>
            ))}
            <Pressable onPress={() => Linking.openURL(t.source)} accessibilityRole="link">
              <RText variant="caption" color={colors.accent}>
                Source officielle des tarifs
              </RText>
            </Pressable>
          </View>
        ) : null}

        {/* Dépenses saisies */}
        <RText variant="heading" style={{ marginTop: space.s }}>
          Trains, réservations et autres frais
        </RText>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {(trip.expenses ?? []).length === 0 ? (
            <RText variant="caption" muted>
              Ajoutez vos billets de train, une excursion réservée, un taxi depuis la gare : tout s’additionne au budget.
            </RText>
          ) : null}
          {(trip.expenses ?? []).map((e) => (
            <View key={e.id} style={[styles.line, { borderTopColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <RText numberOfLines={1}>{e.label}</RText>
                <RText variant="caption" muted>
                  {EXPENSE_CATS.find((c) => c.key === e.category)?.label}
                  {e.date ? ` · ${dayShort(e.date)}` : ''}
                </RText>
              </View>
              <Pressable onPress={() => actions.toggleExpensePaid(trip.id, e.id)} accessibilityRole="switch" accessibilityState={{ checked: e.paid }}>
                <Pill label={e.paid ? 'Réglé' : 'Sur place'} tone={e.paid ? colors.pills.success : colors.tiles.gold} />
              </Pressable>
              <RText variant="bodyStrong" style={{ minWidth: 64, textAlign: 'right' }}>
                {formatEUR(e.amountEUR)}
              </RText>
              <Pressable onPress={() => actions.removeExpense(trip.id, e.id)} accessibilityRole="button" accessibilityLabel={`Supprimer ${e.label}`} hitSlop={8}>
                <Icon name="trash" size={18} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}

          <View style={[styles.form, { borderTopColor: colors.border }]}>
            <TextInput value={label} onChangeText={setLabel} placeholder="Ex. : Train Toulouse → Paris" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]} accessibilityLabel="Libellé de la dépense" />
            <View style={styles.heroRow}>
              <TextInput value={amount} onChangeText={setAmount} placeholder="Montant en €" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" style={[styles.input, { flex: 1, backgroundColor: colors.surfaceAlt, color: colors.text }]} accessibilityLabel="Montant en euros" />
              <View style={styles.paidRow}>
                <RText variant="caption">Déjà payé</RText>
                <Switch value={paid} onValueChange={setPaid} accessibilityLabel="Déjà payé" />
              </View>
            </View>
            <View style={styles.wrap}>
              {EXPENSE_CATS.map((c) => (
                <Pressable key={c.key} onPress={() => setCat(c.key)} accessibilityRole="radio" accessibilityState={{ checked: cat === c.key }} style={[styles.chip, { backgroundColor: cat === c.key ? colors.action : colors.surfaceAlt }]}>
                  <RText style={styles.chipText} color={cat === c.key ? colors.onAction : colors.text}>
                    {c.label}
                  </RText>
                </Pressable>
              ))}
            </View>
            <View style={styles.wrap}>
              {[undefined, ...trip.days.map((d) => d.date)].map((d) => (
                <Pressable key={d ?? 'none'} onPress={() => setDate(d)} accessibilityRole="radio" accessibilityState={{ checked: date === d }} style={[styles.chip, { backgroundColor: date === d ? colors.action : colors.surfaceAlt }]}>
                  <RText style={styles.chipText} color={date === d ? colors.onAction : colors.text}>
                    {d ? dayShort(d) : 'Tout le séjour'}
                  </RText>
                </Pressable>
              ))}
            </View>
            <Button label="Ajouter la dépense" variant="secondary" icon={<Icon name="plus" size={18} />} onPress={addExpense} />
          </View>
        </View>

        <RText variant="caption" muted style={{ textAlign: 'center' }}>
          Prix moyens observés quand aucun tarif officiel n’a été relu (« estimé »). Couronnes converties à 1 € ≈ {String(Math.round((1 / EUR_PER.CZK) * 10) / 10).replace('.', ',')} CZK. Les enfants bénéficient des tarifs réduits selon l’âge saisi dans Profil.
        </RText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.l, gap: space.m, paddingBottom: 80 },
  hero: { borderRadius: radius.card + 6, padding: space.l, gap: space.s },
  heroRow: { flexDirection: 'row', gap: space.s, alignItems: 'center' },
  card: { borderRadius: radius.card, padding: space.l, gap: space.s },
  stack: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', gap: 2 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: space.s, minHeight: 32 },
  dot: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  chip: { paddingHorizontal: 12, minHeight: 38, borderRadius: radius.pill, justifyContent: 'center' },
  chipText: { fontFamily: fonts.bold, fontSize: 13 },
  bars: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', gap: space.s },
  barCol: { flex: 1, alignItems: 'center', gap: 6, minHeight: touch.min },
  barTrack: { width: 34, height: 120, borderRadius: 10, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 10 },
  dayHead: { flexDirection: 'row', alignItems: 'center', gap: space.s, minHeight: touch.min },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.s, paddingTop: space.s, borderTopWidth: StyleSheet.hairlineWidth },
  ticketRow: { flexDirection: 'row', gap: space.s },
  ticket: { flex: 1, borderRadius: radius.tile, padding: space.m, gap: 2 },
  tip: { flexDirection: 'row', gap: space.s, alignItems: 'flex-start' },
  form: { gap: space.s, paddingTop: space.m, marginTop: space.xs, borderTopWidth: StyleSheet.hairlineWidth },
  input: { minHeight: touch.min + 4, borderRadius: radius.button, paddingHorizontal: space.m, fontFamily: fonts.semibold, fontSize: 15 },
  paidRow: { flexDirection: 'row', alignItems: 'center', gap: space.s },
});
