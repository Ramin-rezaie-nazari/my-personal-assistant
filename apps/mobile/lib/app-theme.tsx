import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type AppThemeMode = 'default' | 'female';

export const APP_THEME_STORAGE_KEY = '@my-personal-assistant/theme';

export type AppTheme = {
  mode: AppThemeMode;
  canvas: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textSoft: string;
  primary: string;
  primaryStrong: string;
  primarySoft: string;
  rose: string;
  coral: string;
  turquoise: string;
  sky: string;
  violet: string;
  decorativePink: string;
  decorativeBlue: string;
};

const DEFAULT_THEME: AppTheme = {
  mode: 'default',
  canvas: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textSoft: '#6B7280',
  primary: '#6D28D9',
  primaryStrong: '#7C3AED',
  primarySoft: '#FAF8FF',
  rose: '#A78BFA',
  coral: '#22D3EE',
  turquoise: '#22D3EE',
  sky: '#60A5FA',
  violet: '#8B5CF6',
  decorativePink: 'rgba(167,139,250,0.00)',
  decorativeBlue: 'rgba(34,211,238,0.00)',
};

export const FEMALE_THEME: AppTheme = {
  mode: 'female',
  canvas: '#FFF7FB',
  surface: '#FFFFFF',
  surfaceRaised: '#FFF9FC',
  border: '#F2D4E2',
  text: '#291522',
  textSoft: '#76566A',
  primary: '#E83E78',
  primaryStrong: '#C92C67',
  primarySoft: '#FFF0F6',
  rose: '#F06A98',
  coral: '#FF6F61',
  turquoise: '#18B7B0',
  sky: '#56A7FF',
  violet: '#8B5CF6',
  decorativePink: 'rgba(238,106,152,0.18)',
  decorativeBlue: 'rgba(24,183,176,0.14)',
};

const ThemeContext = createContext<{
  theme: AppTheme;
  setThemeForGender: (gender: Gender | '') => Promise<void>;
}>({
  theme: DEFAULT_THEME,
  setThemeForGender: async () => undefined,
});

function modeForGender(gender: Gender | ''): AppThemeMode {
  return gender === 'female' ? 'female' : 'default';
}

function themeForMode(mode: AppThemeMode): AppTheme {
  return mode === 'female' ? FEMALE_THEME : DEFAULT_THEME;
}

export async function getStoredThemeMode(): Promise<AppThemeMode> {
  const stored = await AsyncStorage.getItem(APP_THEME_STORAGE_KEY);
  return stored === 'female' || stored === 'default' ? stored : 'default';
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppThemeMode>('default');

  useEffect(() => {
    let mounted = true;
    void getStoredThemeMode().then((storedMode) => {
      if (mounted) setMode(storedMode);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      theme: themeForMode(mode),
      setThemeForGender: async (gender: Gender | '') => {
        const nextMode = modeForGender(gender);
        setMode(nextMode);
        await AsyncStorage.setItem(APP_THEME_STORAGE_KEY, nextMode);
      },
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}

/** Background decoration rendered underneath route content. */
export function ThemeBackdrop() {
  const { theme } = useAppTheme();
  if (theme.mode !== 'female') return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.wash, { backgroundColor: theme.canvas }]} />
      <View style={[styles.pinkOrb, { backgroundColor: theme.decorativePink }]} />
      <View style={[styles.turquoiseOrb, { backgroundColor: theme.decorativeBlue }]} />
      <View style={styles.roseRibbon} />
      <View style={styles.skyRibbon} />
    </View>
  );
}

/**
 * Subtle foreground atmosphere keeps legacy hard-coded screens visually
 * connected to the selected feminine theme until semantic token migration.
 * It never intercepts touches.
 */
export function ThemeAtmosphere() {
  const { theme } = useAppTheme();
  if (theme.mode !== 'female') return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.foregroundPink} />
      <View style={styles.foregroundCoral} />
      <View style={styles.foregroundTurquoise} />
      <View style={styles.foregroundSky} />
      <View style={styles.foregroundVignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  wash: { ...StyleSheet.absoluteFillObject, opacity: 0.72 },
  pinkOrb: { position: 'absolute', width: 290, height: 290, borderRadius: 145, top: -100, right: -95 },
  turquoiseOrb: { position: 'absolute', width: 240, height: 240, borderRadius: 120, top: 185, left: -110 },
  roseRibbon: { position: 'absolute', left: -100, right: -100, height: 190, bottom: -120, borderRadius: 100, backgroundColor: 'rgba(255,111,97,0.055)', transform: [{ rotate: '-7deg' }] },
  skyRibbon: { position: 'absolute', left: -110, right: -110, height: 130, bottom: -78, borderRadius: 100, backgroundColor: 'rgba(86,167,255,0.045)', transform: [{ rotate: '5deg' }] },
  foregroundPink: { position: 'absolute', width: 360, height: 360, borderRadius: 180, top: -170, left: -110, backgroundColor: 'rgba(232,62,120,0.035)' },
  foregroundCoral: { position: 'absolute', width: 280, height: 280, borderRadius: 140, top: 90, right: -130, backgroundColor: 'rgba(255,111,97,0.03)' },
  foregroundTurquoise: { position: 'absolute', width: 320, height: 320, borderRadius: 160, bottom: -170, left: -90, backgroundColor: 'rgba(24,183,176,0.035)' },
  foregroundSky: { position: 'absolute', width: 260, height: 260, borderRadius: 130, bottom: -80, right: -120, backgroundColor: 'rgba(86,167,255,0.03)' },
  foregroundVignette: { ...StyleSheet.absoluteFillObject, borderWidth: 7, borderColor: 'rgba(232,62,120,0.022)' },
});
