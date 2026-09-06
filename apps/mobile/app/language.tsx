import { useEffect, useState } from 'react';
import { ActivityIndicator, I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppLocale, getStoredLocale, isRTL, setStoredLocale, t, useAppLocale } from '../lib/i18n';

function BrandMark() {
  return (
    <View style={styles.brandOuter}>
      <View style={styles.brandGlow} />
      <View style={styles.brandInner}><Text style={styles.brandEmoji}>🧠</Text></View>
    </View>
  );
}

export default function LanguageScreen() {
  const storedLocale = useAppLocale();
  const [locale, setLocale] = useState<AppLocale>(storedLocale);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void getStoredLocale().then((stored) => { if (stored) setLocale(stored); setReady(true); });
  }, []);

  const choose = async (next: AppLocale) => {
    setLocale(next);
    await setStoredLocale(next);
    I18nManager.allowRTL(isRTL(next));
  };

  const continueToApp = async () => {
    setBusy(true);
    try {
      await setStoredLocale(locale);
      I18nManager.allowRTL(isRTL(locale));
      router.replace('/auth');
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return <View style={styles.loading}><BrandMark /><ActivityIndicator color="#7C3AED" style={styles.loadingSpinner} /></View>;
  const rtl = isRTL(locale);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.container, rtl && styles.rtl]}>
        <BrandMark />
        <Text style={styles.eyebrow}>MY PERSONAL ASSISTANT</Text>
        <Text style={styles.title}>{t(locale, 'languageTitle')}</Text>
        <Text style={styles.subtitle}>{t(locale, 'languageSubtitle')}</Text>
        <View style={styles.options}>
          <Pressable onPress={() => void choose('fa')} style={[styles.option, locale === 'fa' && styles.selected]}>
            <Text style={styles.flag}>🇮🇷</Text><View style={styles.copy}><Text style={styles.optionTitle}>{t(locale, 'persian')}</Text><Text style={styles.optionSub}>دستیار فارسی</Text></View><Text style={styles.check}>{locale === 'fa' ? '✓' : ''}</Text>
          </Pressable>
          <Pressable onPress={() => void choose('en')} style={[styles.option, locale === 'en' && styles.selected]}>
            <Text style={styles.flag}>🇬🇧</Text><View style={styles.copy}><Text style={styles.optionTitle}>{t(locale, 'english')}</Text><Text style={styles.optionSub}>English assistant</Text></View><Text style={styles.check}>{locale === 'en' ? '✓' : ''}</Text>
          </Pressable>
        </View>
        <Pressable disabled={busy} onPress={() => void continueToApp()} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t(locale, 'continue')} {rtl ? '←' : '→'}</Text>}
        </Pressable>
        <Text style={styles.footer}>{rtl ? 'هوشمند، همراه، همیشه کنارت' : 'Smart, personal, always with you'}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FA' },
  loadingSpinner: { marginTop: 18 },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  rtl: { direction: 'rtl' },
  brandOuter: { width: 108, height: 108, borderRadius: 32, backgroundColor: '#0B1026', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 24, overflow: 'hidden' },
  brandGlow: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: '#7C3AED', opacity: 0.22 },
  brandInner: { width: 74, height: 74, borderRadius: 24, borderWidth: 1, borderColor: '#6D5CE7', backgroundColor: '#111A39', alignItems: 'center', justifyContent: 'center' },
  brandEmoji: { fontSize: 38 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, color: '#6B7280', marginBottom: 10, textAlign: 'center' },
  title: { fontSize: 30, fontWeight: '900', color: '#111827', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, lineHeight: 23, color: '#6B7280', marginBottom: 26, textAlign: 'center' },
  options: { gap: 12, marginBottom: 22 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 17, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  selected: { borderColor: '#7C3AED', borderWidth: 2, backgroundColor: '#FAF8FF' },
  flag: { fontSize: 27, marginRight: 14 },
  copy: { flex: 1 },
  optionTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  optionSub: { fontSize: 12, color: '#6B7280', marginTop: 3 },
  check: { fontSize: 21, fontWeight: '900', color: '#7C3AED' },
  button: { minHeight: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6D28D9' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  pressed: { opacity: 0.82 },
  footer: { marginTop: 18, textAlign: 'center', color: '#9CA3AF', fontSize: 11 },
});
