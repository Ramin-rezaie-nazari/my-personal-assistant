import { Stack, router, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { I18nManager, View, ActivityIndicator } from 'react-native';
import { getStoredLocale, isRTL } from '../lib/i18n';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const segments = useSegments();

  useEffect(() => {
    let mounted = true;
    void getStoredLocale().then((locale) => {
      if (!mounted) return;
      if (locale) {
        I18nManager.allowRTL(isRTL(locale));
        if (segments[0] === 'language') router.replace('/');
      } else if (segments[0] !== 'language') {
        router.replace('/language');
      }
      setReady(true);
    });
    return () => { mounted = false; };
  }, [segments]);

  if (!ready) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FA' }}><ActivityIndicator /></View>;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F7F8FA' },
      }}
    />
  );
}
