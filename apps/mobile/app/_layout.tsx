import { Stack, router, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';
import { getStoredLocale, isRTL } from '../lib/i18n';

export default function RootLayout() {
  const [localeReady, setLocaleReady] = useState(false);
  const [hasLocale, setHasLocale] = useState(false);
  const segments = useSegments();
  const currentSegment = segments[0];

  useEffect(() => {
    let mounted = true;
    void getStoredLocale().then((locale) => {
      if (!mounted) return;
      setHasLocale(Boolean(locale));
      setLocaleReady(true);
      if (locale) I18nManager.allowRTL(isRTL(locale));
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!localeReady) return;
    if (!hasLocale && currentSegment !== 'language') {
      router.replace('/language');
      return;
    }
    if (hasLocale && currentSegment === 'language') {
      router.replace('/auth');
    }
  }, [currentSegment, hasLocale, localeReady]);

  if (!localeReady) {
    return <View style={styles.loading}><ActivityIndicator color="#7C3AED" /></View>;
  }

  const showAssistantBubble = currentSegment != null && !['assistant', 'language', 'auth', 'command-center'].includes(currentSegment);

  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F7F8FA' } }} />
      {showAssistantBubble ? (
        <Pressable onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.assistantBubble, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Open assistant">
          <Text style={styles.emoji}>🧠</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FA' },
  assistantBubble: { position: 'absolute', right: 18, bottom: 24, width: 58, height: 58, borderRadius: 20, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  emoji: { fontSize: 25 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
});
