import { Easing } from 'react-native';

export const PREMIUM = {
  colors: {
    canvas: '#FFF7FB',
    canvasSoft: '#FFE5F1',
    surface: '#FFFDFE',
    surfaceElevated: '#FFF1F7',
    surfaceGlass: 'rgba(255,253,254,0.92)',
    surfaceWarm: '#FFEAF3',
    ink: '#351225',
    inkSoft: '#68405A',
    muted: '#A87891',
    invertedMuted: '#F8D9E9',
    border: '#EFC3D8',
    primary: '#D52F76',
    primaryBright: '#FF4F91',
    cyan: '#35D8CB',
    mint: '#79DCC4',
    amber: '#F0B84E',
    rose: '#FF5F9A',
    lilac: '#A17BEF',
    coral: '#FF7B91',
    berry: '#6E1F52',
    gold: '#F0C36A',
    plum: '#351225',
    white: '#FFFFFF',
    black: '#1F1018',
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
    color: '#6E1F52',
    opacity: 0.18,
    radius: 30,
    offset: { width: 0, height: 16 },
  },
} as const;

export type PremiumAccent = 'primary' | 'cyan' | 'mint' | 'amber' | 'rose' | 'lilac' | 'coral' | 'berry';

export const accentColor = (accent: PremiumAccent) => PREMIUM.colors[accent];
