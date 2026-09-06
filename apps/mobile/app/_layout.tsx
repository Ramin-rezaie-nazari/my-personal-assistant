import { Stack, router, useSegments } from 'expo-router';
import type { ErrorBoundaryProps } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppErrorState } from '../components/app-error-state';
import { BrandMark } from '../components/BrandMark';
import { BrandWordmark } from '../components/BrandWordmark';
import { getStoredLocale, initializeLocale, isRTL, t, useAppLocale } from '../lib/i18n';
import { hasAuthSession } from '../lib/api';
import { getOnboardingState } from '../lib/onboarding';
import { useVisualTheme, VisualThemeProvider } from '../lib/visual-theme-context';
import { BRAND } from '../lib/branding';

function StartupScreen() {
  const locale = useAppLocale();
  const { theme } = useVisualTheme();
  const glow = useRef(new Animated.Value(0.35)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.parallel([
      Animated.sequence([Animated.timing(glow, { toValue: 0.85, duration: 1100, useNativeDriver: true }), Animated.timing(glow, { toValue: 0.35, duration: 1100, useNativeDriver: true })]),
      Animated.sequence([Animated.timing(scale, { toValue: 1.02, duration: 1100, useNativeDriver: true }), Animated.timing(scale, { toValue: 0.94, duration: 1100, useNativeDriver: true })]),
    ]));
    loop.start();
    return () => loop.stop();
  }, [glow, scale]);
  return (
    <View style={[styles.startup, { backgroundColor: BRAND.colors.startup }]} accessible accessibilityLabel={t(locale, 'loading')}>
      <Animated.View style={[styles.startupGlow, { opacity: glow, transform: [{ scale }], backgroundColor: theme.colors.primaryStrong }]} />
      <View style={styles.startupMark}><BrandMark size={104} /></View>
      <BrandWordmark dark />
      <Text style={styles.startupSubtitle}>{locale === 'fa' ? 'روزت، هدف‌هات، دستیار تو.' : 'Your day, your goals, your assistant.'}</Text>
      <ActivityIndicator accessibilityLabel={t(locale, 'loading')} color={theme.colors.primaryStrong} style={styles.startupSpinner} />
    </View>
  );
}

function AppStack() {
  const [bootReady, setBootReady] = useState(false);
  const [targetRoute, setTargetRoute] = useState<'/language' | '/auth' | '/onboarding' | '/'>('/language');
  const locale = useAppLocale();
  const { theme, refreshTheme } = useVisualTheme();
  const segments = useSegments();
  const currentSegment = segments[0];

  useEffect(() => {
    let mounted = true;
    const timeoutId = setTimeout(() => { if (mounted) { setTargetRoute('/language'); setBootReady(true); } }, 1800);
    const bootstrap = async () => {
      try {
        const storedLocale = await getStoredLocale();
        const nextLocale = await initializeLocale();
        const [authenticated, onboarding] = await Promise.all([hasAuthSession(), getOnboardingState()]);
        if (!mounted) return;
        clearTimeout(timeoutId);
        I18nManager.allowRTL(isRTL(nextLocale));
        if (!storedLocale) setTargetRoute('/language');
        else if (!authenticated) setTargetRoute('/auth');
        else if (!onboarding.completed) setTargetRoute('/onboarding');
        else setTargetRoute('/');
        setBootReady(true);
      } catch {
        if (!mounted) return;
        clearTimeout(timeoutId);
        const stored = await getStoredLocale().catch(() => null);
        if (stored) I18nManager.allowRTL(isRTL(stored));
        setTargetRoute(stored ? '/auth' : '/language');
        setBootReady(true);
      }
    };
    void bootstrap();
    return () => { mounted = false; clearTimeout(timeoutId); };
  }, []);

  useEffect(() => { I18nManager.allowRTL(isRTL(locale)); }, [locale]);

  useEffect(() => {
    // Re-read onboarding-derived visual preferences whenever the route changes.
    // This catches the onboarding -> home transition and future settings flows.
    void refreshTheme();
  }, [currentSegment, refreshTheme]);

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
  const screenOptions = { headerShown: false, contentStyle: { backgroundColor: theme.colors.canvas }, animation: 'fade' as const };
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.canvas }]}>
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="assistant" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="language" options={{ animation: 'fade' }} />
        <Stack.Screen name="auth" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'slide_from_right' }} />
      </Stack>
      {showAssistantBubble ? <Pressable onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.assistantBubble, { backgroundColor: theme.colors.surface }, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={t(locale, 'assistant')}><BrandMark size={58} /></Pressable> : null}
    </View>
  );
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const locale = useAppLocale();
  return <AppErrorState title={locale === 'fa' ? 'یک مشکلی پیش آمد' : 'Something went wrong'} message={error.message} retryLabel={t(locale, 'retry')} onRetry={retry} />;
}

export default function RootLayout() {
  return <VisualThemeProvider><AppStack /></VisualThemeProvider>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  startup: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  startupGlow: { position: 'absolute', width: 170, height: 170, borderRadius: 85 },
  startupMark: { marginBottom: 18 },
  startupSubtitle: { marginTop: 6, color: BRAND.colors.startupMuted, fontSize: 13, textAlign: 'center' },
  startupSpinner: { marginTop: 28 },
  assistantBubble: { position: 'absolute', right: 18, bottom: 24, borderRadius: 20, elevation: 6, shadowColor: '#000', shadowOpacity: BRAND.shadow.opacity, shadowRadius: BRAND.shadow.radius, shadowOffset: { width: 0, height: BRAND.shadow.offsetY } },
  pressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
});