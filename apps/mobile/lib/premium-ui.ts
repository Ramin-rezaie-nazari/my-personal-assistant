import { Easing } from 'react-native';

export const PREMIUM = {
  colors: {
    canvas: '#FFF9FC',
    canvasSoft: '#FFF1F7',
    surface: '#FFFFFF',
    surfaceElevated: '#FFF7FB',
    surfaceGlass: 'rgba(255,255,255,0.84)',
    surfaceWarm: '#FFF4F8',
    ink: '#442336',
    inkSoft: '#6D4860',
    muted: '#A37F92',
    invertedMuted: '#F9E3ED',
    border: '#F1D4E1',
    primary: '#D94F8A',
    primaryBright: '#F778AA',
    cyan: '#57CFC6',
    mint: '#92D8C8',
    amber: '#F1B56A',
    rose: '#FF6C95',
    lilac: '#A98CE6',
    coral: '#FF8792',
    berry: '#9D3E73',
    white: '#FFFFFF',
    black: '#291722',
  },
  radius: {
    sm: 14,
    md: 20,
    lg: 26,
    xl: 34,
    pill: 999,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
  motion: {
    fast: 180,
    normal: 280,
    slow: 520,
    ease: Easing.out(Easing.cubic),
  },
  shadow: {
    color: '#B84F83',
    opacity: 0.14,
    radius: 24,
    offset: { width: 0, height: 12 },
  },
} as const;

export type PremiumAccent = 'primary' | 'cyan' | 'mint' | 'amber' | 'rose' | 'lilac' | 'coral' | 'berry';

export const accentColor = (accent: PremiumAccent) => PREMIUM.colors[accent];
