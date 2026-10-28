import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useRuellaTheme } from '@/theme/theme-context';

/** Pictogrammes au trait, dessinés pour Ruella (aucune police d'icônes à charger). */
export type IconName =
  | 'check'
  | 'more'
  | 'walk'
  | 'tram'
  | 'rain'
  | 'plus'
  | 'clock'
  | 'up'
  | 'down'
  | 'right'
  | 'left'
  | 'navigate'
  | 'trash'
  | 'skip'
  | 'gem'
  | 'calendar'
  | 'pin'
  | 'download'
  | 'shield'
  | 'sparkles'
  | 'route'
  | 'close'
  | 'play'
  | 'book'
  | 'user'
  | 'bell';

const PATHS: Record<IconName, string> = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  more: '',
  walk: 'M13.5 5.5a1.6 1.6 0 1 0 0-.01M10 21l2.2-6 2.8 3v3M8.5 12.5l3-4 3 3 3 1M11.5 8.5l-3 1.2-1.8 3',
  tram: 'M7 4h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3zM4 11h16M8.5 21l1.8-3M15.5 21l-1.8-3M9 1.5h6',
  rain: 'M7.5 15.5a4.5 4.5 0 1 1 .9-8.9 6 6 0 0 1 11.1 2.6 3.5 3.5 0 0 1-1.5 6.3M8.5 18.5l-1 2.5M12.5 18.5l-1 2.5M16.5 18.5l-1 2.5',
  plus: 'M12 5v14M5 12h14',
  clock: 'M12 7v5l3.5 2',
  up: 'M6 15l6-6 6 6',
  down: 'M6 9l6 6 6-6',
  right: 'M9 5l7 7-7 7',
  left: 'M15 5l-7 7 7 7',
  navigate: 'M3.5 11.2l17-7.7-7.7 17-2-7.3z',
  trash: 'M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5',
  skip: 'M6 5l9 7-9 7zM18 5v14',
  gem: 'M12 3.5l2.4 6.1L20.5 12l-6.1 2.4L12 20.5l-2.4-6.1L3.5 12l6.1-2.4z',
  calendar: 'M3.5 9.5h17M8 3v4M16 3v4',
  pin: 'M12 21s-6.5-5.8-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.2 12 21 12 21z',
  download: 'M12 4v11M7 10.5l5 5 5-5M5 20h14',
  shield: 'M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z',
  sparkles: 'M10 3l1.8 4.7L16.5 9.5l-4.7 1.8L10 16l-1.8-4.7L3.5 9.5l4.7-1.8zM18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9z',
  route: 'M6 19a2 2 0 1 0 0-.01M18 5a2 2 0 1 0 0-.01M6 17V9a3 3 0 0 1 3-3h1M18 7v8a3 3 0 0 1-3 3h-1',
  close: 'M6 6l12 12M18 6L6 18',
  play: 'M7 4.5l12 7.5-12 7.5z',
  book: 'M4.5 5.5A2 2 0 0 1 6.5 3.5h12v15h-12a2 2 0 0 0-2 2zM4.5 5.5v15',
  user: 'M5 20.5c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5',
  bell: 'M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 21h4',
};

export function Icon({ name, size = 22, color, strokeWidth = 2 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  const { colors } = useRuellaTheme();
  const c = color ?? colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden importantForAccessibility="no">
      {name === 'more' ? (
        <>
          <Circle cx={5.5} cy={12} r={1.8} fill={c} />
          <Circle cx={12} cy={12} r={1.8} fill={c} />
          <Circle cx={18.5} cy={12} r={1.8} fill={c} />
        </>
      ) : null}
      {name === 'clock' ? <Circle cx={12} cy={12} r={8.5} stroke={c} strokeWidth={strokeWidth} /> : null}
      {name === 'calendar' ? <Rect x={3.5} y={5} width={17} height={15.5} rx={3} stroke={c} strokeWidth={strokeWidth} /> : null}
      {name === 'pin' ? <Circle cx={12} cy={10.5} r={2.3} stroke={c} strokeWidth={strokeWidth} /> : null}
      {name === 'user' ? <Circle cx={12} cy={8.5} r={3.8} stroke={c} strokeWidth={strokeWidth} /> : null}
      {PATHS[name] ? (
        <Path d={PATHS[name]} stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill={name === 'gem' || name === 'sparkles' ? c : 'none'} />
      ) : null}
    </Svg>
  );
}
