export const BRAND = {
  name: 'My Personal Assistant',
  shortName: 'Personal Assistant',
  scheme: 'mypersonalassistant',
  colors: {
    ink: '#111827',
    muted: '#6B7280',
    surface: '#FFFFFF',
    background: '#F7F8FA',
    primary: '#6D28D9',
    primarySoft: '#FAF8FF',
    primaryDark: '#4C1D95',
    accent: '#A78BFA',
    border: '#E5E7EB',
    dark: '#070B1A',
    darkSurface: '#111A39',
    darkBorder: '#6D5CE7',
  },
  radius: { sm: 12, md: 16, lg: 22, xl: 30 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  typography: {
    title: 31,
    h2: 24,
    body: 15,
    caption: 12,
    button: 16,
  },
} as const;

export type BrandColors = typeof BRAND.colors;
