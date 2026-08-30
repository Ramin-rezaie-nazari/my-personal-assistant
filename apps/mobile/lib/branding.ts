export type ThemeMode = 'default' | 'female';

const DEFAULT_COLORS = {
  ink: '#111827', inkSoft: '#374151', muted: '#6B7280', surface: '#FFFFFF', canvas: '#F7F8FA', border: '#E5E7EB',
  primary: '#6D28D9', primaryStrong: '#7C3AED', primarySoft: '#FAF8FF', violet: '#A78BFA', cyan: '#22D3EE',
  startup: '#070B1A', startupSurface: '#111A39', startupMuted: '#B7B8C7', white: '#FFFFFF', flower: '#F4A6C1', peach: '#FFD6C8', mint: '#BFEDE5',
} as const;

const FEMALE_COLORS = {
  ink: '#35212A', inkSoft: '#65404E', muted: '#92717F', surface: '#FFFFFF', canvas: '#FFF7FA', border: '#F0D8E1',
  primary: '#D84E7B', primaryStrong: '#BE3A68', primarySoft: '#FFF0F5', violet: '#B66B9E', cyan: '#49C9C1',
  startup: '#2E1722', startupSurface: '#452333', startupMuted: '#EBCBD7', white: '#FFFFFF', flower: '#F08EAF', peach: '#FFD8CF', mint: '#C6EFE7',
} as const;

export const BRAND = {
  colors: { ...DEFAULT_COLORS },
  radius: { control: 16, card: 22, shell: 30 },
  shadow: { opacity: 0.15, radius: 12, offsetY: 6 },
  typography: { display: 31, title: 24, body: 14, label: 12 },
};

export let CURRENT_THEME: ThemeMode = 'default';

export function setBrandTheme(mode: ThemeMode): void {
  CURRENT_THEME = mode;
  Object.assign(BRAND.colors, mode === 'female' ? FEMALE_COLORS : DEFAULT_COLORS);
}

export const BRAND_NAME = 'My Personal Assistant';
export const BRAND_TAGLINE = 'Your day. Your goals. Your assistant.';
export const BRAND_MARK_DESCRIPTION = 'A connected assistant mark representing goals, context, and actions working together.';
export type BrandColor = keyof typeof BRAND.colors;
