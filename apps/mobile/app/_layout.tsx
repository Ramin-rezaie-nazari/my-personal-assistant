import { Stack, router, useSegments } from 'expo-router';
import type { ErrorBoundaryProps } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppErrorState } from '../components/app-error-state';
import { BrandMark } from '../components/BrandMark';
import { BrandWordmark } from '../components/BrandWordmark';
import { getStoredLocale, isRTL } from '../lib/i18n';
import { hasAuthSession } from '../lib/api';
import { getOnboardingState } from '../lib/onboarding';
import { AppThemeProvider, ThemeBackdrop, useAppTheme } from '../lib/app-theme';
import { BRAND } from '../lib/branding';

function StartupScreen() {
  const { theme } = useAppTheme();
  const glow = useRef(new Animated.Value(0.35)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(glow, { toValue: 0.85, duration: 1100, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.35, duration: 1100, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.02, duration: 1100, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.94, duration: 1100, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glow, scale]);

  return (
    <View style={[styles.startup, { backgroundColor: theme.mode === 'female' ? theme.canvas : BRAND.colors.startup }]} accessible accessibilityLabel="Starting My Personal Assistant">
      <Animated.View style={[styles.startupGlow, { opacity: glow, transform: [{ scale }], backgroundColor: theme.mode === 'female' ? theme.primary : BRAND.colors.primaryStrong }]} />
      <View style={styles.startupMark}><BrandMark size={104} /></View>
      <BrandWordmark dark />
      <Text style={[styles.startupSubtitle, { color: theme.mode === 'female' ? theme.textSoft : BRAND.colors.startupMuted }]}>Your day, your goals, your assistant.</Text>
      <ActivityIndicator accessibilityLabel="Loading" color={theme.primary} style={styles.startupSpinner} />
    </View>
  );
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <AppErrorState
      title="Something went wrong"
      message={error.message}
      retryLabel="Try again"
      onRetry={retry}
    />
  );
}

const stackScreens = {
  '/': { animation: 'fade' as const },
  '/assistant': { animation: 'slide_from_right' as const },
  '/language': { animation: 'fade' as const },
  '/auth': { animation: 'slide_from_right' as const },
  '/onboarding': { animation: 'slide_from_right' as const },
  default: { animation: 'fade' as const },
} as const;

function RootLayoutContent() {
  const { theme } = useAppTheme();
  const [bootReady, setBootReady] = useState(false);
  const [targetRoute, setTargetRoute] = useState<'/language' | '/auth' | '/onboarding' | '/'>('/language');
  const segments = useSegments();
  const currentSegment = segments[0];

  useEffect(() => {
    let mounted = true;
    const timeoutId = setTimeout(() => {
      if (!mounted) return;
      setTargetRoute('/language');
      setBootReady(true);
    }, 1800);

    const bootstrap = async () => {
      try {
        const [locale, authenticated, onboarding] = await Promise.all([getStoredLocale(), hasAuthSession(), getOnboardingState()]);
        if (!mounted) return;
        clearTimeout(timeoutId);
        if (locale) I18nManager.allowRTL(isRTL(locale));
        if (!locale) setTargetRoute('/language');
        else if (!authenticated) setTargetRoute('/auth');
        else if (!onboarding.completed) setTargetRoute('/onboarding');
        else setTargetRoute('/');
        setBootReady(true);
      } catch {
        if (!mounted) return;
        clearTimeout(timeoutId);
        setTargetRoute('/language');
        setBootReady(true);
      }
    };

    void bootstrap();
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!bootReady) return;
    const onExpectedRoute =
      (targetRoute === '/language' && currentSegment === 'language') ||
      (targetRoute === '/auth' && currentSegment === 'auth') ||
      (targetRoute === '/onboarding' && currentSegment === 'onboarding') ||
      (targetRoute === '/' && currentSegment == null);
    if (!onExpectedRoute) router.replace(targetRoute);
  }, [bootReady, currentSegment, targetRoute]);

  if (!bootReady) return <StartupScreen />;

  const showAssistantBubble = currentSegment != null && !['assistant', 'language', 'auth', 'onboarding'].includes(currentSegment);
  const screenOptions = {
    headerShown: false,
    contentStyle: { backgroundColor: theme.canvas },
    animation: stackScreens.default.animation,
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.canvas }]}>
      <ThemeBackdrop />
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="index" options={stackScreens['/']} />
        <Stack.Screen name="assistant" options={stackScreens['/assistant']} />
        <Stack.Screen name="language" options={stackScreens['/language']} />
        <Stack.Screen name="auth" options={stackScreens['/auth']} />
        <Stack.Screen name="onboarding" options={stackScreens['/onboarding']} />
      </Stack>
      {showAssistantBubble ? (
        <Pressable
          onPress={() => router.push('/assistant')}
          style={({ pressed }) => [styles.assistantBubble, { borderColor: theme.border, backgroundColor: theme.surface }, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Open assistant"
          accessibilityHint="Opens your personal assistant"
        >
          <BrandMark size={58} />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootLayoutContent />
    </AppThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  startup: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  startupGlow: { position: 'absolute', width: 170, height: 170, borderRadius: 85 },
  startupMark: { marginBottom: 18 },
  startupSubtitle: { marginTop: 6, fontSize: 13, textAlign: 'center' },
  assistantBubble: { position: 'absolute', right: 18, bottom: 24, borderRadius: 20, elevation: 6, shadowColor: '#000', shadowOpacity: BRAND.shadow.opacity, shadowRadius: BRAND.shadow.radius, shadowOffset: { width: 0, height: BRAND.shadow.offsetY }, borderWidth: 1 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
});
