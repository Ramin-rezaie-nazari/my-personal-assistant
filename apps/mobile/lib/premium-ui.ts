import { Easing } from 'react-native';

export const PREMIUM = {
  colors: {
    canvas: '#FFF9FC',
    canvasSoft: '#FFEAF3',
    surface: '#FFFFFF',
    surfaceElevated: '#FFF3F8',
    surfaceGlass: 'rgba(255,255,255,0.92)',
    surfaceWarm: '#FFF0F6',
    ink: '#685A66',
    inkSoft: '#8A7886',
    muted: '#A89AA6',
    invertedMuted: '#F8EAF0',
    border: '#F3D5E1',
    primary: '#F176A6',
    primaryBright: '#FF8FBA',
    cyan: '#A9DFE2',
    mint: '#B9E5D6',
    amber: '#F1D39A',
    rose: '#FF86B2',
    lilac: '#CDBDED',
    coral: '#F6B7A8',
    berry: '#F07EAA',
    gold: '#EACB8D',
    plum: '#8A7282',
    white: '#FFFFFF',
    black: '#6A5B67',
  },
  radius: {
    sm: 14,
    md: 20,
    lg: 26,
    xl: 34,
    xxl: 42,
    pill: 999,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },
  motion: {
    fast: 180,
    normal: 280,
    slow: 560,
    ease: Easing.out(Easing.cubic),
  },
  shadow: {
    color: '#F2B1C9',
    opacity: 0.16,
    radius: 30,
    offset: { width: 0, height: 16 },
  },
} as const;

export type PremiumAccent = 'primary' | 'cyan' | 'mint' | 'amber' | 'rose' | 'lilac' | 'coral' | 'berry';

export const accentColor = (accent: PremiumAccent) => PREMIUM.colors[accent];
