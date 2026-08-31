export const BRAND = {
  colors: {
    ink: '#57263F',
    inkSoft: '#774861',
    muted: '#9C7289',
    invertedMuted: '#F6DCE9',
    surface: '#FFFFFF',
    surfaceElevated: '#FFF3F8',
    surfaceWarm: '#FFF0F5',
    canvas: '#FFF7FB',
    border: '#F2C9DB',
    primary: '#D94F92',
    primaryStrong: '#EC6AA7',
    primarySoft: '#FFF0F6',
    violet: '#B58BEA',
    cyan: '#59D8D0',
    startup: '#7B2D57',
    startupSurface: '#9D4674',
    startupMuted: '#FFE4EF',
    white: '#FFFFFF',
  },
  radius: {
    control: 16,
    card: 22,
    shell: 30,
  },
  shadow: {
    opacity: 0.15,
    radius: 12,
    offsetY: 6,
  },
  typography: {
    display: 31,
    title: 24,
    body: 14,
    label: 12,
  },
} as const;

export const BRAND_NAME = 'My Personal Assistant';
export const BRAND_TAGLINE = 'Your day. Your goals. Your assistant.';
export const BRAND_MARK_DESCRIPTION = 'A connected assistant mark representing goals, context, and actions working together.';

export type BrandColor = keyof typeof BRAND.colors;
