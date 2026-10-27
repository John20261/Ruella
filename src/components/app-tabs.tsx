import { NativeTabs } from 'expo-router/native-tabs';

import { useRuellaTheme } from '@/theme/theme-context';

/**
 * Les 4 onglets validés à l'étape 5 : Journée, Séjours, Récompenses, Profil.
 * Barre native : Liquid Glass sur iOS 26, Material 3 sur Android.
 */
export default function AppTabs() {
  const { colors } = useRuellaTheme();

  return (
    <NativeTabs
      tintColor={colors.accent}
      iconColor={colors.textMuted}
      indicatorColor={colors.surfaceAlt}
      labelVisibilityMode="labeled">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Journée</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'map', selected: 'map.fill' }} md="map" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="sejours">
        <NativeTabs.Trigger.Label>Séjours</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'suitcase', selected: 'suitcase.fill' }} md="luggage" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="recompenses">
        <NativeTabs.Trigger.Label>Récompenses</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'rosette', selected: 'rosette' }} md="military_tech" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profil">
        <NativeTabs.Trigger.Label>Profil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
