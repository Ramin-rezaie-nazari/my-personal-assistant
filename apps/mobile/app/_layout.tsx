import { Stack, router, useSegments } from 'expo-router';
import type { ErrorBoundaryProps } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, I18nManager, StyleSheet, View } from 'react-native';
import { AppErrorState } from '../components/app-error-state';
import { BrandMark } from '../components/BrandMark';
import { BrandWordmark } from '../components/BrandWordmark';
import { AssistantDock } from '../components/AssistantDock';
import { getStoredLocale, isRTL } from '../lib/i18n';
import { hasAuthSession } from '../lib/api';
import { getOnboardingState } from '../lib/onboarding';
import { BRAND } from '../lib/branding';
import { PREMIUM } from '../lib/premium-ui';

function AmbientDecoration() {
  return (
    <View pointerEvents="none" style={styles.ambient}>
      <View style={styles.softPinkWash} />
      <View style={styles.softAquaWash} />
      <View style={styles.softLilacWash} />
      <Image source={require('../assets/decor/feminine-botanical.svg')} style={styles.botanicalTop} resizeMode="contain" />
      <Image source={require('../assets/decor/feminine-botanical.svg')} style={styles.botanicalBottom} resizeMode="contain" />
      <View style={styles.microSparkleOne} />
      <View style={styles.microSparkleTwo} />
      <View style={styles.microDot} />
    </View>
  );
}

function StartupScreen() {
  const pulse = useRef(new Animated.Value(0.98)).current;
  const glow = useRef(new Animated.Value(0.24)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.parallel([
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.025, duration: 1300, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.98, duration: 1300, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(glow, { toValue: 0.44, duration: 1300, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.24, duration: 1300, useNativeDriver: true }),
      ]),
    ]));
    loop.start();
    return () => loop.stop();
  }, [glow, pulse]);

  return (
    <View style={styles.startup} accessible accessibilityLabel="Starting My Personal Assistant">
      <View style={styles.startupOrnamentWrap}>
        <Animated.View style={[styles.startupHaloOuter, { opacity: glow, transform: [{ scale: pulse }] }]} />
        <Animated.View style={[styles.startupHaloInner, { transform: [{ scale: pulse }] }]} />
        <View style={styles.startupMark}><BrandMark size={108} /></View>
      </View>
      <BrandWordmark dark={false} />
      <View style={styles.startupRule} />
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
  softPinkWash: { position: 'absolute', width: 360, height: 360, borderRadius: 180, right: -190, top: -150, backgroundColor: '#F8A7C7', opacity: 0.16 },
  softAquaWash: { position: 'absolute', width: 290, height: 290, borderRadius: 145, left: -185, top: '38%', backgroundColor: '#72D8D0', opacity: 0.08 },
  softLilacWash: { position: 'absolute', width: 330, height: 330, borderRadius: 165, right: -180, bottom: -155, backgroundColor: '#B8A1E9', opacity: 0.08 },
  botanicalTop: { position: 'absolute', width: 250, height: 300, right: -55, top: 42, opacity: 0.19, transform: [{ rotate: '8deg' }] },
  botanicalBottom: { position: 'absolute', width: 210, height: 245, left: -80, bottom: 28, opacity: 0.10, transform: [{ rotate: '188deg' }] },
  microSparkleOne: { position: 'absolute', width: 8, height: 8, borderRadius: 2, backgroundColor: PREMIUM.colors.rose, opacity: 0.40, top: 130, left: '18%', transform: [{ rotate: '45deg' }] },
  microSparkleTwo: { position: 'absolute', width: 7, height: 7, borderRadius: 2, backgroundColor: PREMIUM.colors.lilac, opacity: 0.34, bottom: 154, right: '24%', transform: [{ rotate: '45deg' }] },
  microDot: { position: 'absolute', width: 5, height: 5, borderRadius: 3, backgroundColor: PREMIUM.colors.cyan, opacity: 0.46, top: '31%', right: '17%' },
  startup: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.colors.surfaceWarm, paddingHorizontal: 28 },
  startupOrnamentWrap: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  startupHaloOuter: { position: 'absolute', width: 205, height: 205, borderRadius: 103, backgroundColor: '#FBC1D9' },
  startupHaloInner: { position: 'absolute', width: 168, height: 168, borderRadius: 84, backgroundColor: '#FFF8FC', borderWidth: 1, borderColor: '#F2D5E2' },
  startupMark: { borderRadius: 56, padding: 9, backgroundColor: 'rgba(255,255,255,0.84)', borderWidth: 1, borderColor: '#F0D1E0', shadowColor: '#B84F83', shadowOpacity: 0.14, shadowRadius: 28, shadowOffset: { width: 0, height: 14 }, elevation: 8 },
  startupRule: { width: 62, height: 2, borderRadius: 2, backgroundColor: BRAND.colors.primary, opacity: 0.30, marginTop: 18 },
  startupSpinner: { marginTop: 18 },
  dock: { position: 'absolute', right: 18, bottom: 24, left: 18 },
});
