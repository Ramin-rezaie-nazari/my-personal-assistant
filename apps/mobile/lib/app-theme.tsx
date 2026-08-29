import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gender, getOnboardingState } from './onboarding';

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
  if (stored === 'female' || stored === 'default') return stored;

  try {
    const onboarding = await getOnboardingState();
    return modeForGender(onboarding.gender);
  } catch {
    return 'default';
  }
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
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

/**
 * Persistent visual layer shared by every route.
 * The female mode intentionally uses pink/rose, coral, turquoise and sky-blue
 * accents while preserving the same information architecture as the default theme.
 */
export function ThemeBackdrop() {
  const { theme } = useAppTheme();
  const female = theme.mode === 'female';

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {female ? (
        <>
          <View style={[styles.wash, { backgroundColor: 'rgba(255,247,251,0.92)' }]} />
          <View style={[styles.pinkOrb, { backgroundColor: theme.decorativePink }]} />
          <View style={[styles.turquoiseOrb, { backgroundColor: theme.decorativeBlue }]} />
          <View style={[styles.roseRibbon, { backgroundColor: 'rgba(232,62,120,0.06)' }]} />
          <View style={[styles.skyRibbon, { backgroundColor: 'rgba(86,167,255,0.05)' }]} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wash: { ...StyleSheet.absoluteFillObject },
  pinkOrb: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    top: -92,
    right: -78,
  },
  turquoiseOrb: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: 180,
    left: -96,
  },
  roseRibbon: {
    position: 'absolute',
    left: -90,
    right: -90,
    height: 170,
    bottom: -103,
    borderRadius: 100,
    transform: [{ rotate: '-7deg' }],
  },
  skyRibbon: {
    position: 'absolute',
    left: -110,
    right: -110,
    height: 120,
    bottom: -74,
    borderRadius: 100,
    transform: [{ rotate: '5deg' }],
  },
});
