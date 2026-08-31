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
      Animated.sequence([
        Animated.timing(glow, { toValue: 0.9, duration: 820, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.35, duration: 820, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.04, duration: 820, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.94, duration: 820, useNativeDriver: true }),
      ]),
    ]));
    loop.start();
    return () => loop.stop();
  }, [glow, scale]);
  return (
    <View style={styles.startup} accessible accessibilityLabel="Starting My Personal Assistant">
      <View pointerEvents="none" style={styles.floralLayer}>
        <Text style={[styles.flower, styles.flowerTop]}>✿</Text>
        <Text style={[styles.flower, styles.flowerRight]}>❀</Text>
        <Text style={[styles.flower, styles.flowerLeft]}>✿</Text>
        <Text style={[styles.sparkle, styles.sparkleTop]}>✦</Text>
        <Text style={[styles.sparkle, styles.sparkleBottom]}>✧</Text>
      </View>
      <Animated.View style={[styles.startupGlow, { opacity: glow, transform: [{ scale }] }]} />
      <View style={styles.startupMark}><BrandMark size={104} /></View>
      <BrandWordmark dark={false} />
      <Text style={styles.startupSubtitle}>Your day, your goals, your assistant.</Text>
      <ActivityIndicator color={BRAND.colors.primary} style={styles.startupSpinner} />
    </View>
  );
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <AppErrorState title="Something went wrong" message={error.message} retryLabel="Try again" onRetry={retry} />;
}

export default function RootLayout() {
  const [bootReady, setBootReady] = useState(false);
  const [targetRoute, setTargetRoute] = useState<'/language' | '/auth' | '/onboarding' | '/'>('/language');
  const segments = useSegments();
  const currentSegment = segments[0];
  const initialRouteApplied = useRef(false);

  useEffect(() => {
    let mounted = true;
    const timeoutId = setTimeout(() => {
      if (mounted) {
        setTargetRoute('/language');
        setBootReady(true);
      }
    }, 700);

    void Promise.all([getStoredLocale(), hasAuthSession(), getOnboardingState()]).then(([locale, authenticated, onboarding]) => {
      if (!mounted) return;
      clearTimeout(timeoutId);
      if (locale) I18nManager.allowRTL(isRTL(locale));
      if (!locale) setTargetRoute('/language');
      else if (!onboarding.completed) setTargetRoute('/onboarding');
      else if (!authenticated) setTargetRoute('/auth');
      else setTargetRoute('/');
      setBootReady(true);
    }).catch(() => {
      if (mounted) {
        clearTimeout(timeoutId);
        setTargetRoute('/language');
        setBootReady(true);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!bootReady || initialRouteApplied.current) return;
    const onExpectedRoute =
      (targetRoute === '/language' && currentSegment === 'language') ||
      (targetRoute === '/auth' && currentSegment === 'auth') ||
      (targetRoute === '/onboarding' && currentSegment === 'onboarding') ||
      (targetRoute === '/' && currentSegment == null);

    initialRouteApplied.current = true;
    if (!onExpectedRoute) router.replace(targetRoute);
  }, [bootReady, currentSegment, targetRoute]);

  if (!bootReady) return <StartupScreen />;

  const showAssistantDock = currentSegment != null && !['assistant', 'language', 'auth', 'onboarding', 'settings'].includes(currentSegment);

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.globalDecor}>
        <View style={styles.decorBlobPink} />
        <View style={styles.decorBlobTurquoise} />
        <View style={styles.decorBlobLilac} />
        <Text style={[styles.globalFlower, styles.globalFlowerOne]}>✿</Text>
        <Text style={[styles.globalFlower, styles.globalFlowerTwo]}>❀</Text>
        <Text style={[styles.globalFlower, styles.globalFlowerThree]}>✾</Text>
        <Text style={[styles.globalSparkle, styles.globalSparkleOne]}>✦</Text>
        <Text style={[styles.globalSparkle, styles.globalSparkleTwo]}>✧</Text>
      </View>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: PREMIUM.colors.canvas }, animation: 'fade' }}>
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="assistant" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="language" options={{ animation: 'fade' }} />
        <Stack.Screen name="auth" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
      {showAssistantDock ? <View style={styles.dock}><AssistantDock onPress={() => router.push('/assistant')} /></View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PREMIUM.colors.canvas },
  globalDecor: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  decorBlobPink: { position: 'absolute', width: 300, height: 300, borderRadius: 150, right: -150, top: 40, backgroundColor: '#FF9AC4', opacity: 0.22 },
  decorBlobTurquoise: { position: 'absolute', width: 240, height: 240, borderRadius: 120, left: -140, bottom: 80, backgroundColor: '#74DED6', opacity: 0.15 },
  decorBlobLilac: { position: 'absolute', width: 260, height: 260, borderRadius: 130, left: '35%', top: '28%', backgroundColor: '#C9A7F5', opacity: 0.11 },
  globalFlower: { position: 'absolute', color: '#E85D9E', opacity: 0.16, fontWeight: '800' },
  globalFlowerOne: { fontSize: 62, right: 14, top: 110, transform: [{ rotate: '15deg' }] },
  globalFlowerTwo: { fontSize: 46, left: 12, top: '42%', color: '#59D8D0', transform: [{ rotate: '-18deg' }] },
  globalFlowerThree: { fontSize: 54, right: 28, bottom: 130, color: '#B58BEA', transform: [{ rotate: '25deg' }] },
  globalSparkle: { position: 'absolute', color: '#FF5F8F', opacity: 0.26 },
  globalSparkleOne: { fontSize: 30, left: '22%', top: 90 },
  globalSparkleTwo: { fontSize: 22, right: '30%', bottom: 105, color: '#59D8D0' },
  startup: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.colors.surfaceWarm, paddingHorizontal: 28 },
  floralLayer: { ...StyleSheet.absoluteFillObject },
  flower: { position: 'absolute', color: '#E85D9E', opacity: 0.18, fontWeight: '800' },
  flowerTop: { fontSize: 70, right: 28, top: 76 },
  flowerRight: { fontSize: 54, left: 22, top: '28%', color: '#59D8D0' },
  flowerLeft: { fontSize: 48, right: 30, bottom: 110, color: '#B58BEA' },
  sparkle: { position: 'absolute', color: '#FF5F8F', opacity: 0.32 },
  sparkleTop: { fontSize: 26, left: 52, top: 138 },
  sparkleBottom: { fontSize: 22, right: 76, bottom: 182, color: '#59D8D0' },
  startupGlow: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: BRAND.colors.primarySoft },
  startupMark: { marginBottom: 18 },
  startupSubtitle: { marginTop: 8, color: BRAND.colors.muted, fontSize: 13, textAlign: 'center' },
  startupSpinner: { marginTop: 28 },
  dock: { position: 'absolute', right: 18, bottom: 24, left: 18 },
});
