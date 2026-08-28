import { Easing } from 'react-native';

export const PREMIUM = {
  colors: {
    canvas: '#070A12',
    canvasSoft: '#0B1020',
    surface: '#101625',
    surfaceElevated: '#151C2E',
    surfaceGlass: 'rgba(20,28,46,0.82)',
    surfaceWarm: '#171A2A',
    ink: '#F7F8FC',
    inkSoft: '#C7CDDB',
    muted: '#8993A8',
    invertedMuted: '#AEB6C8',
    border: 'rgba(255,255,255,0.09)',
    primary: '#8B7CFF',
    primaryBright: '#B8ACFF',
    cyan: '#5FE8FF',
    mint: '#62E6B5',
    amber: '#FFC56B',
    rose: '#FF7D9A',
    white: '#FFFFFF',
    black: '#000000',
  },
  radius: {
    sm: 12,
    md: 18,
    lg: 24,
    xl: 32,
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
    color: '#000000',
    opacity: 0.38,
    radius: 22,
    offset: { width: 0, height: 12 },
  },
} as const;

export type PremiumAccent = 'primary' | 'cyan' | 'mint' | 'amber' | 'rose';

export const accentColor = (accent: PremiumAccent) => PREMIUM.colors[accent];
