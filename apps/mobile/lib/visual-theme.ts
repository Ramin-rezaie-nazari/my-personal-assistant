import type { Gender } from './onboarding';

export type VisualThemeKey = 'default' | 'feminine';

export type VisualTheme = {
  key: VisualThemeKey;
  colors: {
    canvas: string;
    surface: string;
    primary: string;
    primaryStrong: string;
    primarySoft: string;
    accent: string;
    accentSoft: string;
    ink: string;
    inkSoft: string;
    muted: string;
    border: string;
  };
};

const DEFAULT_THEME: VisualTheme = {
  key: 'default',
  colors: {
    canvas: '#F7F8FA',
    surface: '#FFFFFF',
    primary: '#6D28D9',
    primaryStrong: '#7C3AED',
    primarySoft: '#FAF8FF',
    accent: '#22D3EE',
    accentSoft: '#E6F9FF',
    ink: '#111827',
    inkSoft: '#374151',
    muted: '#6B7280',
    border: '#E5E7EB',
  },
};

const FEMININE_THEME: VisualTheme = {
  key: 'feminine',
  colors: {
    canvas: '#FFF8FB',
    surface: '#FFFFFF',
    primary: '#C24178',
    primaryStrong: '#DB4F8A',
    primarySoft: '#FFF0F6',
    accent: '#A8558D',
    accentSoft: '#FBEAF5',
    ink: '#2A1720',
    inkSoft: '#5B3544',
    muted: '#846A75',
    border: '#F0DCE5',
  },
};

export function getVisualThemeKey(gender: Gender | ''): VisualThemeKey {
  return gender === 'female' ? 'feminine' : 'default';
}

export function getVisualTheme(key: VisualThemeKey): VisualTheme {
  return key === 'feminine' ? FEMININE_THEME : DEFAULT_THEME;
}

export function getVisualThemeForGender(gender: Gender | ''): VisualTheme {
  return getVisualTheme(getVisualThemeKey(gender));
}
