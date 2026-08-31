import { Stack, router, useSegments } from 'expo-router';
import type { ErrorBoundaryProps } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, I18nManager, StyleSheet, View } from 'react-native';
import { AppErrorState } from '../components/app-error-state';
import { BrandMark } from '../components/BrandMark';
import { BrandWordmark } from '../components/BrandWordmark';
import { AssistantDock } from '../components/AssistantDock';
import { getStoredLocale, isRTL } from '../lib/i18n';
import { hasAuthSession } from '../lib/api';
import { getOnboardingState } from '../lib/onboarding';
import { BRAND } from '../lib/branding';
import { PREMIUM } from '../lib/premium-ui';

function Petal({ color, size, rotation, style }: { color: string; size: number; rotation: string; style?: object }) {
  return (
    <View style={[styles.petal, { width: size, height: size * 1.65, borderRadius: size, backgroundColor: color, transform: [{ rotate: rotation }] }, style]} />
  );
}

function FlowerCluster({ size = 52, color = PREMIUM.colors.primary, center = PREMIUM.colors.white, style }: { size?: number; color?: string; center?: string; style?: object }) {
  const petalSize = size * 0.34;
  return (
    <View pointerEvents="none" style={[{ width: size, height: size }, style]}>
      <Petal color={color} size={petalSize} rotation="0deg" style={styles.petalTop} />
      <Petal color={color} size={petalSize} rotation="72deg" style={styles.petalTop} />
      <Petal color={color} size={petalSize} rotation="144deg" style={styles.petalTop} />
      <Petal color={color} size={petalSize} rotation="216deg" style={styles.petalTop} />
      <Petal color={color} size={petalSize} rotation="288deg" style={styles.petalTop} />
      <View style={[styles.flowerCenter, { width: size * 0.23, height: size * 0.23, borderRadius: size, backgroundColor: center }]} />
    </View>
  );
}

function Sparkle({ size = 10, color = PREMIUM.colors.rose, style }: { size?: number; color?: string; style?: object }) {
  return <View pointerEvents="none" style={[styles.sparkle, { width: size, height: size, backgroundColor: color, transform: [{ rotate: '45deg' }] }, style]} />;
}

function AmbientDecoration() {
  return (
    <View pointerEvents="none" style={styles.ambient}>
      <View style={styles.blobPink} />
      <View style={styles.blobAqua} />
      <View style={styles.blobLilac} />
      <View style={styles.blobPeach} />
      <FlowerCluster size={58} style={styles.flowerOne} />
      <FlowerCluster size={44} color={PREMIUM.colors.cyan} center={PREMIUM.colors.surface} style={styles.flowerTwo} />
      <FlowerCluster size={38} color={PREMIUM.colors.lilac} center={PREMIUM.colors.surface} style={styles.flowerThree} />
      <Sparkle size={9} style={styles.sparkleOne} />
      <Sparkle size={7} color={PREMIUM.colors.cyan} style={styles.sparkleTwo} />
      <Sparkle size={6} color={PREMIUM.colors.lilac} style={styles.sparkleThree} />
    </View>
  );
}

function StartupScreen() {
  const glow = useRef(new Animated.Value(0.35)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.parallel([
      Animated.sequence([
        Animated.timing(glow, { toValue: 0.75, duration: 1000, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.35, duration: 1000, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.035, duration: 1000, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.96, duration: 1000, useNativeDriver: true }),
      ]),
    ]));
    loop.start();
    return () => loop.stop();
  }, [glow, scale]);

  return (
    <View style={styles.startup} accessible accessibilityLabel="Starting My Personal Assistant">
      <AmbientDecoration />
      <Animated.View style={[styles.startupHalo, { opacity: glow, transform: [{ scale }] }]} />
      <View style={styles.startupMark}><BrandMark size={110} /></View>
      <BrandWordmark dark={false} />
      <View style={styles.startupAccentRow}>
        <View style={styles.startupDot} />
        <View style={[styles.startupDot, styles.startupDotAqua]} />
        <View style={[styles.startupDot, styles.startupDotLilac]} />
      </View>
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
      <AmbientDecoration />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' }, animation: 'fade' }}>
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
  ambient: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  blobPink: { position: 'absolute', width: 330, height: 330, borderRadius: 165, right: -175, top: -70, backgroundColor: '#F8A7C7', opacity: 0.24 },
  blobAqua: { position: 'absolute', width: 250, height: 250, borderRadius: 125, left: -150, top: '34%', backgroundColor: '#7CDED6', opacity: 0.14 },
  blobLilac: { position: 'absolute', width: 310, height: 310, borderRadius: 155, right: -130, bottom: 60, backgroundColor: '#C7B0EF', opacity: 0.12 },
  blobPeach: { position: 'absolute', width: 190, height: 190, borderRadius: 95, left: '34%', bottom: -90, backgroundColor: '#FFD2B8', opacity: 0.12 },
  petal: { position: 'absolute', left: '50%', top: '50%' },
  petalTop: { marginLeft: -3, marginTop: -14, transformOrigin: '50% 100%' as any, opacity: 0.8 },
  flowerCenter: { position: 'absolute', left: '50%', top: '50%', marginLeft: -6, marginTop: -6, borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)' },
  flowerOne: { position: 'absolute', right: 18, top: 115, opacity: 0.48 },
  flowerTwo: { position: 'absolute', left: 18, top: '43%', opacity: 0.4 },
  flowerThree: { position: 'absolute', right: 38, bottom: 126, opacity: 0.28 },
  sparkle: { position: 'absolute', borderRadius: 3, opacity: 0.48 },
  sparkleOne: { left: '20%', top: 98 },
  sparkleTwo: { right: '29%', bottom: 128 },
  sparkleThree: { left: '42%', top: '28%' },
  startup: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.colors.surfaceWarm, paddingHorizontal: 28 },
  startupHalo: { position: 'absolute', width: 235, height: 235, borderRadius: 118, backgroundColor: '#FFD9EA', opacity: 0.58 },
  startupMark: { marginBottom: 18 },
  startupAccentRow: { flexDirection: 'row', gap: 7, marginTop: 18 },
  startupDot: { width: 7, height: 7, borderRadius: 5, backgroundColor: PREMIUM.colors.primary },
  startupDotAqua: { backgroundColor: PREMIUM.colors.cyan },
  startupDotLilac: { backgroundColor: PREMIUM.colors.lilac },
  startupSpinner: { marginTop: 20 },
  dock: { position: 'absolute', right: 18, bottom: 24, left: 18 },
});
