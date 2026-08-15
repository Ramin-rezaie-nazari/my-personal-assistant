export const BRAND = {
  colors: {
    ink: '#111827',
    inkSoft: '#374151',
    muted: '#6B7280',
    surface: '#FFFFFF',
    canvas: '#F7F8FA',
    border: '#E5E7EB',
    primary: '#6D28D9',
    primaryStrong: '#7C3AED',
    primarySoft: '#FAF8FF',
    violet: '#A78BFA',
    cyan: '#22D3EE',
    startup: '#070B1A',
    startupSurface: '#111A39',
    startupMuted: '#B7B8C7',
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
