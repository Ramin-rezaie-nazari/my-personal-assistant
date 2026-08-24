import { useEffect, useState } from 'react';
import { ActivityIndicator, I18nManager, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppLocale, getLanguageOptions, getStoredLocale, isRTL, setStoredLocale, t } from '../lib/i18n';

function BrandMark() {
  return (
    <View style={styles.brandOuter}>
      <View style={styles.brandGlow} />
      <View style={styles.brandInner}>
        <Text style={styles.brandEmoji}>🧠</Text>
      </View>
    </View>
  );
}

export default function LanguageScreen() {
  const [locale, setLocale] = useState<AppLocale>('en');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void getStoredLocale().then((stored) => {
      if (stored) setLocale(stored);
      setReady(true);
    });
  }, []);

  const choose = async (next: AppLocale) => {
    setLocale(next);
    await setStoredLocale(next);
  };

  const continueToApp = async () => {
    setBusy(true);
    await setStoredLocale(locale);
    I18nManager.allowRTL(isRTL(locale));
    router.replace('/auth');
  };

  if (!ready) return <View style={styles.loading}><BrandMark /><ActivityIndicator color="#7C3AED" style={styles.loadingSpinner} /></View>;
  const rtl = isRTL(locale);
  const options = getLanguageOptions();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.container, rtl && styles.rtl]}>
        <BrandMark />
        <Text style={styles.eyebrow}>MY PERSONAL ASSISTANT</Text>
        <Text style={styles.title}>{t(locale, 'languageTitle')}</Text>
        <Text style={styles.subtitle}>{t(locale, 'languageSubtitle')}</Text>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.options} showsVerticalScrollIndicator={false}>
          {options.map((option) => {
            const selected = locale === option.code || (locale === 'fa' && option.code === 'fa-IR') || (locale === 'en' && option.code === 'en-US');
            return (
              <Pressable key={option.code} onPress={() => void choose(option.code)} style={[styles.option, selected && styles.selected]}>
                <View style={styles.languageCode}><Text style={styles.languageCodeText}>{option.code}</Text></View>
                <View style={styles.copy}>
                  <Text style={styles.optionTitle}>{option.label}</Text>
                  <Text style={styles.optionSub}>{option.region}</Text>
                </View>
                <Text style={styles.check}>{selected ? '✓' : ''}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable disabled={busy} onPress={() => void continueToApp()} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t(locale, 'continue')} →</Text>}
        </Pressable>
        <Text style={styles.footer}>{locale === 'fa' || locale.startsWith('fa-') ? 'هوشمند، همراه، همیشه کنارت' : 'Smart, personal, always with you'}</Text>
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
  subtitle: { fontSize: 15, lineHeight: 23, color: '#6B7280', marginBottom: 20, textAlign: 'center' },
  scroll: { flexGrow: 0, maxHeight: 430 },
  options: { gap: 10, paddingBottom: 14 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  selected: { borderColor: '#7C3AED', borderWidth: 2, backgroundColor: '#FAF8FF' },
  languageCode: { minWidth: 64, alignItems: 'center', marginRight: 12 },
  languageCodeText: { fontSize: 11, fontWeight: '900', color: '#7C3AED' },
  copy: { flex: 1 },
  optionTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  optionSub: { fontSize: 12, color: '#6B7280', marginTop: 3 },
  check: { fontSize: 21, fontWeight: '900', color: '#7C3AED' },
  button: { minHeight: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6D28D9', marginTop: 14 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  pressed: { opacity: 0.82 },
  footer: { marginTop: 14, textAlign: 'center', color: '#9CA3AF', fontSize: 11 },
});
