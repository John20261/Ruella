import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ThemeColors } from './tokens';

/** « Sombre » est le thème par défaut (décision étape 6). */
export type ThemePreference = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'ruella.theme';
const DEFAULT_PREFERENCE: ThemePreference = 'dark';

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  scheme: 'dark' | 'light';
  colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function resolveScheme(preference: ThemePreference, system: string | null | undefined): 'dark' | 'light' {
  if (preference === 'system') return system === 'light' ? 'light' : 'dark';
  return preference;
}

export function RuellaThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_PREFERENCE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'dark' || saved === 'light' || saved === 'system') setPreferenceState(saved);
      })
      .catch(() => {
        // Stockage indisponible : on garde le thème par défaut.
      });
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const scheme = resolveScheme(preference, system);
    return {
      preference,
      setPreference: (p) => {
        setPreferenceState(p);
        AsyncStorage.setItem(STORAGE_KEY, p).catch(() => {});
      },
      scheme,
      colors: scheme === 'dark' ? darkColors : lightColors,
    };
  }, [preference, system]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useRuellaTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useRuellaTheme doit être utilisé dans RuellaThemeProvider');
  return ctx;
}
