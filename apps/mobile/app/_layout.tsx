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
import { BRAND } from '../lib/branding';

function StartupScreen() {
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
    <View style={styles.startup} accessible accessibilityLabel="Starting My Personal Assistant">
      <Animated.View style={[styles.startupGlow, { opacity: glow, transform: [{ scale }] }]} />
      <View style={styles.startupMark}><BrandMark size={104} dark /></View>
      <BrandWordmark dark />
      <Text style={styles.startupSubtitle}>Your day, your goals, your assistant.</Text>
      <ActivityIndicator accessibilityLabel="Loading" color={BRAND.colors.violet} style={styles.startupSpinner} />
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

export default function RootLayout() {
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

  const showAssistantBubble = currentSegment != null && !['assistant', 'language', 'auth', 'onboarding', 'command-center'].includes(currentSegment);

  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: BRAND.colors.canvas }, animation: 'fade' }} />
      {showAssistantBubble ? (
        <Pressable
          onPress={() => router.push('/assistant')}
          style={({ pressed }) => [styles.assistantBubble, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Open assistant"
          accessibilityHint="Opens your personal assistant"
        >
          <BrandMark size={58} dark />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  startup: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.colors.startup, paddingHorizontal: 28 },
  startupGlow: { position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: BRAND.colors.primaryStrong },
  startupMark: { marginBottom: 18 },
  startupSubtitle: { marginTop: 6, color: BRAND.colors.startupMuted, fontSize: 13, textAlign: 'center' },
  startupSpinner: { marginTop: 28 },
  assistantBubble: { position: 'absolute', right: 18, bottom: 24, borderRadius: 20, elevation: 6, shadowColor: '#000', shadowOpacity: BRAND.shadow.opacity, shadowRadius: BRAND.shadow.radius, shadowOffset: { width: 0, height: BRAND.shadow.offsetY } },
  pressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
});
