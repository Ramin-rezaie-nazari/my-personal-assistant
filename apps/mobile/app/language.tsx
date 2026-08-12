import { useEffect, useState } from 'react';
import { ActivityIndicator, I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppLocale, getStoredLocale, isRTL, setStoredLocale, t } from '../lib/i18n';

export default function LanguageScreen() {
  const [locale, setLocale] = useState<AppLocale>('en');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => { void getStoredLocale().then((stored) => { if (stored) setLocale(stored); setReady(true); }); }, []);

  const choose = async (next: AppLocale) => { setLocale(next); await setStoredLocale(next); };
  const continueToApp = async () => {
    setBusy(true);
    await setStoredLocale(locale);
    if (I18nManager.isRTL !== isRTL(locale)) I18nManager.allowRTL(isRTL(locale));
    router.replace('/');
  };

  if (!ready) return <View style={styles.loading}><ActivityIndicator /></View>;
  const rtl = isRTL(locale);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.container, rtl && styles.rtl]}>
        <Text style={styles.eyebrow}>MY PERSONAL ASSISTANT</Text>
        <Text style={styles.title}>{t(locale, 'languageTitle')}</Text>
        <Text style={styles.subtitle}>{t(locale, 'languageSubtitle')}</Text>

        <View style={styles.options}>
          <Pressable onPress={() => void choose('fa')} style={[styles.option, locale === 'fa' && styles.selected]}>
            <Text style={styles.flag}>🇮🇷</Text><View style={styles.copy}><Text style={styles.optionTitle}>فارسی</Text><Text style={styles.optionSub}>دستیار فارسی</Text></View><Text style={styles.check}>{locale === 'fa' ? '✓' : ''}</Text>
          </Pressable>
          <Pressable onPress={() => void choose('en')} style={[styles.option, locale === 'en' && styles.selected]}>
            <Text style={styles.flag}>🇬🇧</Text><View style={styles.copy}><Text style={styles.optionTitle}>English</Text><Text style={styles.optionSub}>English assistant</Text></View><Text style={styles.check}>{locale === 'en' ? '✓' : ''}</Text>
          </Pressable>
        </View>

        <Pressable disabled={busy} onPress={() => void continueToApp()} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t(locale, 'continue')} →</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F7F8FA' }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center' }, container: { flex: 1, justifyContent: 'center', padding: 24 }, rtl: { direction: 'rtl' }, eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: '#6B7280', marginBottom: 12 }, title: { fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 10 }, subtitle: { fontSize: 16, lineHeight: 24, color: '#6B7280', marginBottom: 30 }, options: { gap: 12, marginBottom: 24 }, option: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' }, selected: { borderColor: '#111827', borderWidth: 2 }, flag: { fontSize: 28, marginRight: 14 }, copy: { flex: 1 }, optionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' }, optionSub: { fontSize: 13, color: '#6B7280', marginTop: 3 }, check: { fontSize: 22, fontWeight: '800', color: '#111827' }, button: { minHeight: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' }, buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }, pressed: { opacity: 0.8 } });
