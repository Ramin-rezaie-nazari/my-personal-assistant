import { Stack, router, useSegments } from 'expo-router';
import type { ErrorBoundaryProps } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppErrorState } from '../components/app-error-state';
import { BrandMark } from '../components/BrandMark';
import { BrandWordmark } from '../components/BrandWordmark';
import { getStoredLocale, isRTL } from '../lib/i18n';
import { hasAuthSession } from '../lib/api';
import { getOnboardingState } from '../lib/onboarding';
import { BRAND, setBrandTheme } from '../lib/branding';

function StartupScreen() {
  const glow = useRef(new Animated.Value(0.35)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.parallel([
      Animated.sequence([
        Animated.timing(glow, { toValue: 0.85, duration: 1100, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.35, duration: 1100, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.02, duration: 1100, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.94, duration: 1100, useNativeDriver: true }),
      ]),
    ]);
    loop.start();
    return () => loop.stop();
  }, [glow, scale]);
  return (
    <View style={styles.startup} accessible accessibilityLabel="Starting My Personal Assistant">
      <Animated.View style={[styles.startupGlow, { opacity: glow, transform: [{ scale }] }]} />
      <View style={styles.startupMark}><BrandMark size={104} /></View>
      <BrandWordmark dark />
      <Text style={styles.startupSubtitle}>Your day, your goals, your assistant.</Text>
      <ActivityIndicator accessibilityLabel="Loading" color={BRAND.colors.violet} style={styles.startupSpinner} />
    </View>
  );
}

function ThemeDecorations() {
  if (BRAND.colors.flower === '#F4A6C1') return null;
  return (
    <View pointerEvents="none" style={styles.decorations}>
      <View style={[styles.flowerBlob, styles.flowerOne]} />
      <View style={[styles.flowerBlob, styles.flowerTwo]} />
      <MaterialCommunityIcons name="flower-outline" size={42} color={BRAND.colors.flower} style={styles.flowerIconOne} />
      <MaterialCommunityIcons name="flower-outline" size={30} color={BRAND.colors.violet} style={styles.flowerIconTwo} />
    </View>
  );
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <AppErrorState title="Something went wrong" message={error.message} retryLabel="Try again" onRetry={retry} />;
}

const stackScreens = {
  '/': { animation: 'fade' as const }, '/assistant': { animation: 'slide_from_right' as const }, '/language': { animation: 'fade' as const },
  '/auth': { animation: 'slide_from_right' as const }, '/onboarding': { animation: 'slide_from_right' as const }, default: { animation: 'fade' as const },
} as const;

export default function RootLayout() {
  const [bootReady, setBootReady] = useState(false);
  const [targetRoute, setTargetRoute] = useState<'/language' | '/auth' | '/onboarding' | '/'>('/language');
  const segments = useSegments();
  const currentSegment = segments[0];

  useEffect(() => {
    let mounted = true;
    const timeoutId = setTimeout(() => {
      if (!mounted) return;
      setBrandTheme('default');
      setTargetRoute('/language');
      setBootReady(true);
    }, 1800);
    const bootstrap = async () => {
      try {
        const [locale, authenticated, onboarding] = await Promise.all([getStoredLocale(), hasAuthSession(), getOnboardingState()]);
        if (!mounted) return;
        clearTimeout(timeoutId);
        if (locale) I18nManager.allowRTL(isRTL(locale));
        setBrandTheme(onboarding.gender === 'female' ? 'female' : 'default');
        if (!locale) setTargetRoute('/language');
        else if (!authenticated) setTargetRoute('/auth');
        else if (!onboarding.completed) setTargetRoute('/onboarding');
        else setTargetRoute('/');
        setBootReady(true);
      } catch {
        if (!mounted) return;
        clearTimeout(timeoutId);
        setBrandTheme('default');
        setTargetRoute('/language');
        setBootReady(true);
      }
    };
    void bootstrap();
    return () => { mounted = false; clearTimeout(timeoutId); };
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
  const screenOptions = { headerShown: false, contentStyle: { backgroundColor: BRAND.colors.canvas }, animation: stackScreens.default.animation };
  return (
    <View style={styles.root}>
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="index" options={stackScreens['/']} />
        <Stack.Screen name="assistant" options={stackScreens['/assistant']} />
        <Stack.Screen name="language" options={stackScreens['/language']} />
        <Stack.Screen name="auth" options={stackScreens['/auth']} />
        <Stack.Screen name="onboarding" options={stackScreens['/onboarding']} />
      </Stack>
      <ThemeDecorations />
      {showAssistantBubble ? <Pressable onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.assistantBubble, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Open assistant" accessibilityHint="Opens your personal assistant"><BrandMark size={58} /></Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  startup: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.colors.startup, paddingHorizontal: 28 },
  startupGlow: { position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: BRAND.colors.primaryStrong },
  startupMark: { marginBottom: 18 }, startupSubtitle: { marginTop: 6, color: BRAND.colors.startupMuted, fontSize: 13, textAlign: 'center' }, startupSpinner: { marginTop: 28 },
  decorations: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' }, flowerBlob: { position: 'absolute', borderRadius: 999, opacity: 0.18 },
  flowerOne: { width: 150, height: 150, backgroundColor: BRAND.colors.peach, top: -40, right: -55 }, flowerTwo: { width: 120, height: 120, backgroundColor: BRAND.colors.mint, bottom: 70, left: -55 },
  flowerIconOne: { position: 'absolute', right: 18, top: 112, opacity: 0.25 }, flowerIconTwo: { position: 'absolute', left: 20, bottom: 116, opacity: 0.18 },
  assistantBubble: { position: 'absolute', right: 18, bottom: 24, borderRadius: 20, elevation: 6, shadowColor: '#000', shadowOpacity: BRAND.shadow.opacity, shadowRadius: BRAND.shadow.radius, shadowOffset: { width: 0, height: BRAND.shadow.offsetY } },
  pressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
});
