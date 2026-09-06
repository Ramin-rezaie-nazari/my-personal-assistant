import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getOnboardingState, type OnboardingState } from './onboarding';
import { getVisualTheme, getVisualThemeKey, type VisualTheme, type VisualThemeKey } from './visual-theme';

type VisualThemeContextValue = {
  theme: VisualTheme;
  themeKey: VisualThemeKey;
  refreshTheme: () => Promise<void>;
};

const VisualThemeContext = createContext<VisualThemeContextValue | null>(null);

export function VisualThemeProvider({ children }: { children: React.ReactNode }) {
  const [gender, setGender] = useState<OnboardingState['gender']>('');

  const refreshTheme = useCallback(async () => {
    const onboarding = await getOnboardingState();
    setGender(onboarding.gender);
  }, []);

  useEffect(() => {
    void refreshTheme();
  }, [refreshTheme]);

  const themeKey = getVisualThemeKey(gender);
  const value = useMemo<VisualThemeContextValue>(() => ({
    theme: getVisualTheme(themeKey),
    themeKey,
    refreshTheme,
  }), [refreshTheme, themeKey]);

  return <VisualThemeContext.Provider value={value}>{children}</VisualThemeContext.Provider>;
}

export function useVisualTheme(): VisualThemeContextValue {
  const value = useContext(VisualThemeContext);
  if (!value) throw new Error('useVisualTheme must be used inside VisualThemeProvider.');
  return value;
}
