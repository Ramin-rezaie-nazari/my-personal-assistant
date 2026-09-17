import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, I18nManager, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppLocale, getLanguage, isRTL, LANGUAGE_OPTIONS, SUPPORTED_LANGUAGE_COUNT } from '../lib/languages';
import { getStoredLocale, setStoredLocale, t } from '../lib/i18n';
import { preloadLocale } from '../lib/runtime-translator';

const AZ_LANGUAGE_UI = {
  languageTitle: 'Dilini seç',
  languageSubtitle: 'Şəxsi köməkçin hər yerdə bu dildə səninlə danışacaq.',
  continue: 'Davam et',
};

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
  const [query, setQuery] = useState('');
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
    try {
      await setStoredLocale(locale);
      await preloadLocale(locale);
      I18nManager.allowRTL(isRTL(locale));
      routerReplaceAuth();
    } finally {
      setBusy(false);
    }
  };

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return [...LANGUAGE_OPTIONS];
    return LANGUAGE_OPTIONS.filter((language) =>
      `${language.englishName} ${language.nativeName} ${language.code}`.toLocaleLowerCase().includes(needle),
    );
  }, [query]);

  if (!ready) {
    return <View style={styles.loading}><BrandMark /><ActivityIndicator color="#7C3AED" style={styles.loadingSpinner} /></View>;
  }

  const rtl = isRTL(locale);
  const selected = getLanguage(locale);
  const title = locale === 'az' ? AZ_LANGUAGE_UI.languageTitle : t(locale, 'languageTitle');
  const subtitle = locale === 'az' ? AZ_LANGUAGE_UI.languageSubtitle : t(locale, 'languageSubtitle');
  const continueLabel = locale === 'az' ? AZ_LANGUAGE_UI.continue : t(locale, 'continue');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <BrandMark />
          <Text style={[styles.title, rtl && styles.rtlText]}>{title}</Text>
          <Text style={[styles.subtitle, rtl && styles.rtlText]}>{subtitle}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{SUPPORTED_LANGUAGE_COUNT} · {LANGUAGE_OPTIONS.length}</Text>
          </View>
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={title}
          placeholderTextColor="#9CA3AF"
          style={[styles.search, rtl && styles.rtlText]}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = item.code === locale;
            return (
              <Pressable
                onPress={() => void choose(item.code)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                style={[styles.option, isSelected && styles.selected]}
              >
                <View style={[styles.optionCopy, item.rtl && styles.optionCopyRtl]}>
                  <Text style={[styles.optionTitle, item.rtl && styles.rtlText]}>{item.nativeName}</Text>
                  <Text style={[styles.optionSub, item.rtl && styles.rtlText]}>{item.englishName} · {item.code}</Text>
                </View>
                <Text style={[styles.check, isSelected && styles.checkSelected]}>{isSelected ? '✓' : ''}</Text>
              </Pressable>
            );
          }}
        />

        <View style={styles.footerBar}>
          <Text style={[styles.selectedLabel, rtl && styles.rtlText]}>{selected.nativeName}</Text>
          <Pressable disabled={busy} onPress={() => void continueToApp()} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{continueLabel} →</Text>}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function routerReplaceAuth() {
  // Isolated import keeps the picker component easy to smoke-test without navigation mocks.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { router } = require('expo-router') as typeof import('expo-router');
  router.replace('/auth');
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FA' },
  loadingSpinner: { marginTop: 18 },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  hero: { alignItems: 'center' },
  brandOuter: { width: 84, height: 84, borderRadius: 26, backgroundColor: '#0B1026', alignItems: 'center', justifyContent: 'center', marginBottom: 14, overflow: 'hidden' },
  brandGlow: { position: 'absolute', width: 124, height: 124, borderRadius: 62, backgroundColor: '#7C3AED', opacity: 0.22 },
  brandInner: { width: 60, height: 60, borderRadius: 20, borderWidth: 1, borderColor: '#6D5CE7', backgroundColor: '#111A39', alignItems: 'center', justifyContent: 'center' },
  brandEmoji: { fontSize: 31 },
  title: { fontSize: 28, fontWeight: '900', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 14, lineHeight: 21, color: '#6B7280', textAlign: 'center', marginTop: 7 },
  countBadge: { marginTop: 10, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: '#F0EAFE' },
  countText: { color: '#6D28D9', fontSize: 12, fontWeight: '900' },
  search: { marginTop: 14, minHeight: 48, borderRadius: 15, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', paddingHorizontal: 14, color: '#111827' },
  list: { paddingTop: 10, paddingBottom: 118, gap: 8 },
  option: { flexDirection: 'row', alignItems: 'center', minHeight: 66, paddingHorizontal: 15, paddingVertical: 11, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  selected: { borderColor: '#7C3AED', borderWidth: 2, backgroundColor: '#FAF8FF' },
  optionCopy: { flex: 1 },
  optionCopyRtl: { alignItems: 'flex-end' },
  optionTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  optionSub: { marginTop: 3, fontSize: 11, color: '#6B7280' },
  check: { width: 24, textAlign: 'center', fontSize: 20, fontWeight: '900', color: '#D1D5DB' },
  checkSelected: { color: '#7C3AED' },
  footerBar: { position: 'absolute', left: 20, right: 20, bottom: 10, padding: 10, borderRadius: 20, backgroundColor: 'rgba(247,248,250,0.96)', borderWidth: 1, borderColor: '#E5E7EB' },
  selectedLabel: { textAlign: 'center', color: '#6B7280', fontSize: 12, fontWeight: '800', marginBottom: 8 },
  button: { minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6D28D9' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  pressed: { opacity: 0.82 },
  rtlText: { writingDirection: 'rtl', textAlign: 'right' },
});
