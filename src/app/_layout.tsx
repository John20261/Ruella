import { Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CelebrationHost } from '@/components/celebration';
import { hydrate, useHydrated } from '@/store/app-store';
import { RuellaThemeProvider, useRuellaTheme } from '@/theme/theme-context';

SplashScreen.preventAutoHideAsync();

/** Si un écran plante, on affiche un message lisible au lieu d'un écran vide. */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  SplashScreen.hideAsync().catch(() => {});
  return (
    <View style={{ flex: 1, backgroundColor: '#0E1116', padding: 32, justifyContent: 'center', gap: 16 }}>
      <Text style={{ color: '#F2F4F7', fontSize: 26, fontWeight: '800' }}>Oups, Ruella a trébuché</Text>
      <Text style={{ color: '#A5ADBA', fontSize: 15, lineHeight: 21 }}>
        Vos séjours et vos points sont en sécurité sur le téléphone. Réessayez ; si le problème revient, envoyez une capture de ce message.
      </Text>
      <Text selectable style={{ color: '#FF8A8A', fontSize: 12 }}>
        {error.message}
      </Text>
      <Pressable onPress={retry} accessibilityRole="button" style={{ backgroundColor: '#FF7A59', borderRadius: 16, minHeight: 52, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#2A0E05', fontSize: 16, fontWeight: '700' }}>Réessayer</Text>
      </Pressable>
    </View>
  );
}

function ThemedNavigation() {
  const { scheme, colors } = useRuellaTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider
      value={{
        ...base,
        colors: { ...base.colors, background: colors.background, card: colors.surface, text: colors.text, primary: colors.accent },
      }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="ville/[id]" />
        <Stack.Screen name="lieu/[id]" />
        <Stack.Screen name="sejour/nouveau" options={{ presentation: 'modal' }} />
        <Stack.Screen name="editeur" />
        <Stack.Screen name="confidentialite" />
      </Stack>
      <CelebrationHost />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Fraunces_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const ready = useHydrated();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if ((loaded || error) && ready) SplashScreen.hideAsync();
  }, [loaded, error, ready]);

  if ((!loaded && !error) || !ready) return null;

  return (
    <RuellaThemeProvider>
      <ThemedNavigation />
    </RuellaThemeProvider>
  );
}
