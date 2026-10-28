/**
 * Système de design Ruella (étape 6 validée le 27/10/2026).
 * Fusion A (verre + carte) · B (Fraunces, ligne de métro, tampons) · C (tuiles colorées, mode sombre).
 * Toute couleur de l'app vient d'ici : jamais de valeur en dur dans les écrans.
 */

export const palette = {
  encre: '#12212E',
  brume: '#EEF0EB',
  blanc: '#FFFFFF',
  bleu: '#1E5BD8',
  or: '#C8913A',
  corail: '#FF7A59',
  menthe: '#1B9A5A',
  rougeTampon: '#C8322B',
  lilas: '#B69CFF',
  nuit: '#0E1116',
  papier: '#F7F3EA',
} as const;

/** Une tuile colorée = un fond + une encre lisible dessus (contraste ≥ 4,5:1). */
export type TileTone = { bg: string; ink: string };

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  glass: string;
  glassBorder: string;
  text: string;
  textMuted: string;
  border: string;
  /** Bouton principal (« Y aller ») */
  action: string;
  onAction: string;
  /** Trajet, élément actif */
  accent: string;
  /** Moments de fête, partage */
  celebrate: string;
  onCelebrate: string;
  success: string;
  danger: string;
  gem: string;
  stamp: string;
  paper: string;
  tiles: {
    blue: TileTone;
    lilac: TileTone;
    gold: TileTone;
    mint: TileTone;
    neutral: TileTone;
  };
  pills: {
    gem: TileTone;
    success: TileTone;
    info: TileTone;
  };
  /** Carte légère dessinée par l'app (sans tuiles). */
  map: {
    bg: string;
    water: string;
    park: string;
    label: string;
    route: string;
    routeDone: string;
    user: string;
  };
};

export const lightColors: ThemeColors = {
  background: palette.brume,
  surface: palette.blanc,
  surfaceAlt: '#F5F6F3',
  glass: 'rgba(255,255,255,0.78)',
  glassBorder: 'rgba(255,255,255,0.9)',
  text: palette.encre,
  textMuted: '#4A5763',
  border: 'rgba(18,33,46,0.12)',
  action: palette.encre,
  onAction: palette.blanc,
  accent: palette.bleu,
  celebrate: palette.corail,
  onCelebrate: '#2A0E05',
  success: '#145234',
  danger: '#B42318',
  gem: palette.or,
  stamp: palette.rougeTampon,
  paper: palette.papier,
  tiles: {
    blue: { bg: '#DCE6FB', ink: '#123A8C' },
    lilac: { bg: '#EDE7FF', ink: '#4B3A8C' },
    gold: { bg: '#FBEBD2', ink: '#6E4710' },
    mint: { bg: '#DCEFE3', ink: '#145234' },
    neutral: { bg: '#EEF0EB', ink: '#4A5763' },
  },
  pills: {
    gem: { bg: '#F1D9A8', ink: '#3A2608' },
    success: { bg: '#DCEFE3', ink: '#145234' },
    info: { bg: '#DCE6FB', ink: '#123A8C' },
  },
  map: {
    bg: '#E4E7E0',
    water: '#B7CCE0',
    park: '#CFE0C6',
    label: 'rgba(18,33,46,0.42)',
    route: palette.bleu,
    routeDone: 'rgba(18,33,46,0.25)',
    user: palette.bleu,
  },
};

export const darkColors: ThemeColors = {
  background: palette.nuit,
  surface: '#191E26',
  surfaceAlt: '#222833',
  glass: 'rgba(25,30,38,0.82)',
  glassBorder: 'rgba(255,255,255,0.08)',
  text: '#F2F4F7',
  textMuted: '#A5ADBA',
  border: 'rgba(255,255,255,0.08)',
  action: palette.corail,
  onAction: '#2A0E05',
  accent: palette.corail,
  celebrate: palette.corail,
  onCelebrate: '#2A0E05',
  success: '#7FE9B9',
  danger: '#FF8A8A',
  gem: '#FFC857',
  stamp: palette.rougeTampon,
  paper: palette.papier,
  tiles: {
    blue: { bg: '#1C2A4A', ink: '#A9C3FF' },
    lilac: { bg: '#2A2340', ink: '#CDBBFF' },
    gold: { bg: '#3A2F14', ink: '#FFD98A' },
    mint: { bg: '#16352A', ink: '#7FE9B9' },
    neutral: { bg: '#222833', ink: '#A5ADBA' },
  },
  pills: {
    gem: { bg: '#FFC857', ink: '#2A1D02' },
    success: { bg: '#16352A', ink: '#7FE9B9' },
    info: { bg: '#1C2A4A', ink: '#A9C3FF' },
  },
  map: {
    bg: '#121821',
    water: '#1D3350',
    park: '#16261F',
    label: 'rgba(242,244,247,0.34)',
    route: palette.corail,
    routeDone: 'rgba(242,244,247,0.22)',
    user: '#6EA8FF',
  },
};

export const radius = {
  sheet: 34,
  card: 22,
  tile: 18,
  button: 16,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Familles chargées dans _layout.tsx. */
export const fonts = {
  display: 'Fraunces_700Bold',
  regular: 'Inter_400Regular',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  heavy: 'Inter_800ExtraBold',
} as const;

/** Tailles minimales d'accessibilité. */
export const touch = {
  min: 44,
  primary: 52,
} as const;
