import { Easing } from 'react-native';

export const PREMIUM = {
  colors: {
    canvas: '#FFF7FB',
    canvasSoft: '#FFEAF4',
    surface: '#FFFCFE',
    surfaceElevated: '#FFF4F9',
    surfaceGlass: 'rgba(255,252,254,0.90)',
    surfaceWarm: '#FFF0F6',
    ink: '#3B1730',
    inkSoft: '#70445E',
    muted: '#A77F93',
    invertedMuted: '#F7DDEB',
    border: '#EEC9DB',
    primary: '#C83E7A',
    primaryBright: '#FF72A7',
    cyan: '#3CCDC1',
    mint: '#7FD6BF',
    amber: '#E9AF55',
    rose: '#FF5F93',
    lilac: '#9D7EE3',
    coral: '#FF7E82',
    berry: '#7E295D',
    gold: '#E7B85E',
    plum: '#4A1E3A',
    white: '#FFFFFF',
    black: '#21131C',
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
    color: '#7E295D',
    opacity: 0.16,
    radius: 28,
    offset: { width: 0, height: 14 },
  },
} as const;

export type PremiumAccent = 'primary' | 'cyan' | 'mint' | 'amber' | 'rose' | 'lilac' | 'coral' | 'berry';

export const accentColor = (accent: PremiumAccent) => PREMIUM.colors[accent];
