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

import { CelebrationHost } from '@/components/celebration';
import { hydrate, useHydrated } from '@/store/app-store';
import { RuellaThemeProvider, useRuellaTheme } from '@/theme/theme-context';

SplashScreen.preventAutoHideAsync();

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
