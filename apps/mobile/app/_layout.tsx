import { Stack, router, useSegments } from 'expo-router';
import type { ErrorBoundaryProps } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, I18nManager, StyleSheet, Text, View } from 'react-native';
import { AppErrorState } from '../components/app-error-state';
import { BrandMark } from '../components/BrandMark';
import { BrandWordmark } from '../components/BrandWordmark';
import { AssistantDock } from '../components/AssistantDock';
import { getStoredLocale, isRTL } from '../lib/i18n';
import { hasAuthSession } from '../lib/api';
import { getOnboardingState } from '../lib/onboarding';
import { BRAND } from '../lib/branding';
import { PREMIUM } from '../lib/premium-ui';

function StartupScreen() {
  const glow = useRef(new Animated.Value(0.35)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.parallel([
      Animated.sequence([Animated.timing(glow, { toValue: 0.85, duration: 820, useNativeDriver: true }), Animated.timing(glow, { toValue: 0.35, duration: 820, useNativeDriver: true })]),
      Animated.sequence([Animated.timing(scale, { toValue: 1.02, duration: 820, useNativeDriver: true }), Animated.timing(scale, { toValue: 0.94, duration: 820, useNativeDriver: true })]),
    ]));
    loop.start();
    return () => loop.stop();
  }, [glow, scale]);
  return <View style={styles.startup} accessible accessibilityLabel="Starting My Personal Assistant"><Animated.View style={[styles.startupGlow, { opacity: glow, transform: [{ scale }] }]} /><View style={styles.startupMark}><BrandMark size={104} /></View><BrandWordmark dark /><Text style={styles.startupSubtitle}>Your day, your goals, your assistant.</Text><ActivityIndicator accessibilityLabel="Loading" color={BRAND.colors.violet} style={styles.startupSpinner} /></View>;
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) { return <AppErrorState title="Something went wrong" message={error.message} retryLabel="Try again" onRetry={retry} />; }

export default function RootLayout() {
  const [bootReady, setBootReady] = useState(false);
  const [targetRoute, setTargetRoute] = useState<'/language' | '/auth' | '/onboarding' | '/'>('/language');
  const segments = useSegments();
  const currentSegment = segments[0];
  useEffect(() => {
    let mounted = true;
    const timeoutId = setTimeout(() => { if (mounted) { setTargetRoute('/language'); setBootReady(true); } }, 700);
    void Promise.all([getStoredLocale(), hasAuthSession(), getOnboardingState()]).then(([locale, authenticated, onboarding]) => {
      if (!mounted) return;
      clearTimeout(timeoutId);
      if (locale) I18nManager.allowRTL(isRTL(locale));
      if (!locale) setTargetRoute('/language');
      else if (!authenticated) setTargetRoute('/auth');
      else if (!onboarding.completed) setTargetRoute('/onboarding');
      else setTargetRoute('/');
      setBootReady(true);
    }).catch(() => { if (mounted) { clearTimeout(timeoutId); setTargetRoute('/language'); setBootReady(true); } });
    return () => { mounted = false; clearTimeout(timeoutId); };
  }, []);
  useEffect(() => {
    if (!bootReady) return;
    const onExpectedRoute = (targetRoute === '/language' && currentSegment === 'language') || (targetRoute === '/auth' && currentSegment === 'auth') || (targetRoute === '/onboarding' && currentSegment === 'onboarding') || (targetRoute === '/' && currentSegment == null);
    if (!onExpectedRoute) router.replace(targetRoute);
  }, [bootReady, currentSegment, targetRoute]);
  if (!bootReady) return <StartupScreen />;
  const showAssistantDock = currentSegment != null && !['assistant', 'language', 'auth', 'onboarding', 'settings'].includes(currentSegment);
  return <View style={styles.root}>
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: PREMIUM.colors.canvas }, animation: 'fade' }}>
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      <Stack.Screen name="assistant" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="language" options={{ animation: 'fade' }} />
      <Stack.Screen name="auth" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="onboarding" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="settings" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
    {showAssistantDock ? <View style={styles.dock}><AssistantDock onPress={() => router.push('/assistant')} /></View> : null}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PREMIUM.colors.canvas },
  startup: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.colors.startup, paddingHorizontal: 28 },
  startupGlow: { position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: BRAND.colors.primaryStrong },
  startupMark: { marginBottom: 18 },
  startupSubtitle: { marginTop: 6, color: BRAND.colors.startupMuted, fontSize: 13, textAlign: 'center' },
  startupSpinner: { marginTop: 28 },
  dock: { position: 'absolute', right: 18, bottom: 24 },
});
