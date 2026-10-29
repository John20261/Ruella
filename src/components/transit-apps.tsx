import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { RText } from '@/components/ui/r-text';
import type { TransitApp } from '@/content/types';
import { useRuellaTheme } from '@/theme/theme-context';
import { fonts, radius, space, touch } from '@/theme/tokens';

/** Lien vers la fiche de l'application sur le magasin du téléphone (elle s'ouvre si elle est installée). */
export function appStoreUrl(app: TransitApp): string {
  return Platform.OS === 'ios' ? app.ios : app.android;
}

export function openTransitApp(app: TransitApp) {
  Linking.openURL(appStoreUrl(app)).catch(() => {});
}

/** Cartes des applications officielles de transport d'une ville. */
export function TransitApps({ apps, compact }: { apps: TransitApp[]; compact?: boolean }) {
  const { colors } = useRuellaTheme();
  return (
    <View style={{ gap: space.s }}>
      {apps.map((app) => (
        <Pressable
          key={app.name}
          onPress={() => openTransitApp(app)}
          accessibilityRole="link"
          accessibilityLabel={`${app.name}. ${app.what} Ouvre ${Platform.OS === 'ios' ? "l'App Store" : 'Google Play'}`}
          style={({ pressed }) => [styles.app, { backgroundColor: colors.tiles.blue.bg, opacity: pressed ? 0.85 : 1 }]}>
          <View style={[styles.icon, { backgroundColor: colors.tiles.blue.ink }]}>
            <Icon name="tram" size={22} color={colors.tiles.blue.bg} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <RText variant="bodyStrong" color={colors.tiles.blue.ink}>
              {app.name}
              {app.tickets ? ' · billets sur le téléphone' : ''}
            </RText>
            {!compact ? (
              <RText variant="caption" color={colors.tiles.blue.ink}>
                {app.what}
              </RText>
            ) : null}
          </View>
          <View style={[styles.cta, { backgroundColor: colors.tiles.blue.ink }]}>
            <RText style={styles.ctaText} color={colors.tiles.blue.bg}>
              Installer
            </RText>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flexDirection: 'row', alignItems: 'center', gap: space.m, padding: space.m, borderRadius: radius.tile, minHeight: touch.primary },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cta: { paddingHorizontal: 12, minHeight: 34, borderRadius: radius.pill, justifyContent: 'center' },
  ctaText: { fontFamily: fonts.bold, fontSize: 13 },
});
