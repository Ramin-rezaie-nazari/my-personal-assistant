import { Stack, router, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';
import { getStoredLocale, isRTL } from '../lib/i18n';
import { hasAuthSession } from '../lib/api';

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
    <View style={styles.startup}>
      <Animated.View style={[styles.startupGlow, { opacity: glow, transform: [{ scale }] }]} />
      <View style={styles.startupMark}>
        <Text style={styles.startupEmoji}>🧠</Text>
      </View>
      <Text style={styles.startupTitle}>My Personal Assistant</Text>
      <Text style={styles.startupSubtitle}>Your day, your goals, your assistant.</Text>
      <ActivityIndicator color="#A78BFA" style={styles.startupSpinner} />
    </View>
  );
}

export default function RootLayout() {
  const [bootReady, setBootReady] = useState(false);
  const [targetRoute, setTargetRoute] = useState<'/language' | '/auth' | '/'>('/language');
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
        const [locale, authenticated] = await Promise.all([getStoredLocale(), hasAuthSession()]);
        if (!mounted) return;
        clearTimeout(timeoutId);
        if (locale) I18nManager.allowRTL(isRTL(locale));
        if (!locale) setTargetRoute('/language');
        else if (authenticated) setTargetRoute('/');
        else setTargetRoute('/auth');
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
      (targetRoute === '/' && currentSegment == null);
    if (!onExpectedRoute) router.replace(targetRoute);
  }, [bootReady, currentSegment, targetRoute]);

  if (!bootReady) return <StartupScreen />;

  const showAssistantBubble = currentSegment != null && !['assistant', 'language', 'auth', 'command-center'].includes(currentSegment);

  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F7F8FA' } }} />
      {showAssistantBubble ? (
        <Pressable
          onPress={() => router.push('/assistant')}
          style={({ pressed }) => [styles.assistantBubble, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Open assistant"
        >
          <Text style={styles.emoji}>🧠</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  startup: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#070B1A', paddingHorizontal: 28 },
  startupGlow: { position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: '#7C3AED' },
  startupMark: { width: 104, height: 104, borderRadius: 30, backgroundColor: '#111A39', borderWidth: 1, borderColor: '#6D5CE7', alignItems: 'center', justifyContent: 'center' },
  startupEmoji: { fontSize: 42 },
  startupTitle: { marginTop: 24, color: '#FFFFFF', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  startupSubtitle: { marginTop: 8, color: '#B7B8C7', fontSize: 13, textAlign: 'center' },
  startupSpinner: { marginTop: 28 },
  assistantBubble: { position: 'absolute', right: 18, bottom: 24, width: 58, height: 58, borderRadius: 20, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  emoji: { fontSize: 25 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
});
