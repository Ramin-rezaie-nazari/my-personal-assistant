import { Easing } from 'react-native';

export const PREMIUM = {
  colors: {
    canvas: '#FFF7FB',
    canvasSoft: '#FFF0F7',
    surface: '#FFFFFF',
    surfaceElevated: '#FFF3F8',
    surfaceGlass: 'rgba(255,255,255,0.90)',
    surfaceWarm: '#FFF0F5',
    ink: '#57263F',
    inkSoft: '#774861',
    muted: '#9C7289',
    invertedMuted: '#F6DCE9',
    border: '#F2C9DB',
    primary: '#E85D9E',
    primaryBright: '#FF91BF',
    cyan: '#59D8D0',
    mint: '#8ADBCB',
    amber: '#F4B66A',
    rose: '#FF5F8F',
    white: '#FFFFFF',
    black: '#2E1823',
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
    color: '#C65D8D',
    opacity: 0.18,
    radius: 22,
    offset: { width: 0, height: 12 },
  },
} as const;

export type PremiumAccent = 'primary' | 'cyan' | 'mint' | 'amber' | 'rose';

export const accentColor = (accent: PremiumAccent) => PREMIUM.colors[accent];
