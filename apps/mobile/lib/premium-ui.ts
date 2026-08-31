import { Easing } from 'react-native';

export const PREMIUM = {
  colors: {
    canvas: '#FFF9FC',
    canvasSoft: '#FCECF5',
    surface: '#FFFFFF',
    surfaceElevated: '#FFF5F9',
    surfaceGlass: 'rgba(255,255,255,0.90)',
    surfaceWarm: '#FFF1F6',
    ink: '#514854',
    inkSoft: '#756B79',
    muted: '#9B91A0',
    invertedMuted: '#F4E6ED',
    border: '#F0DDE6',
    primary: '#E7A1BB',
    primaryBright: '#F6B6CF',
    cyan: '#A8DCD8',
    mint: '#B8DECf',
    amber: '#E8CB91',
    rose: '#EFA9C2',
    lilac: '#C5B7E5',
    coral: '#F2B7A5',
    berry: '#E7A2BC',
    gold: '#E4C98E',
    plum: '#74606E',
    white: '#FFFFFF',
    black: '#3E3740',
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
    color: '#D9B6C7',
    opacity: 0.14,
    radius: 30,
    offset: { width: 0, height: 16 },
  },
} as const;

export type PremiumAccent = 'primary' | 'cyan' | 'mint' | 'amber' | 'rose' | 'lilac' | 'coral' | 'berry';

export const accentColor = (accent: PremiumAccent) => PREMIUM.colors[accent];
