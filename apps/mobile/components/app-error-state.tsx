import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND } from '../lib/branding';
import { useAppLocale, type AppLocale } from '../lib/i18n';
import { localizedCopy } from '../lib/localized-copy';
import { translateTextBetweenLocales } from '../lib/runtime-translator';

const copy = localizedCopy({
  en: { fallbackTitle: 'Something went wrong', fallbackRetry: 'Try again' },
  fa: { fallbackTitle: 'یک مشکلی پیش آمد', fallbackRetry: 'تلاش دوباره' },
});

function sourceLocale(value: string): AppLocale {
  return /[\u0600-\u06FF]/u.test(value) ? 'fa' : 'en';
}

async function localize(value: string, locale: AppLocale, fallback: string): Promise<string> {
  if (!value.trim()) return fallback;
  if (locale === 'fa' && sourceLocale(value) === 'fa') return value;
  if (locale === 'en' && sourceLocale(value) === 'en') return value;
  try { return await translateTextBetweenLocales(value, sourceLocale(value), locale); } catch { return locale === 'fa' ? fallback : value; }
}

export function AppErrorState({ title, message, retryLabel, onRetry }: { title: string; message?: string; retryLabel: string; onRetry?: () => void }) {
  const { locale, rtl } = useAppLocale();
  const ui = copy[locale];
  const [titleText, setTitleText] = useState(ui.fallbackTitle);
  const [messageText, setMessageText] = useState<string | undefined>(undefined);
  const [retryText, setRetryText] = useState(ui.fallbackRetry);

  useEffect(() => {
    let active = true;
    void Promise.all([localize(title, locale, ui.fallbackTitle), localize(retryLabel, locale, ui.fallbackRetry), message ? localize(message, locale, ui.fallbackTitle) : Promise.resolve(undefined)]).then(([nextTitle, nextRetry, nextMessage]) => {
      if (!active) return;
      setTitleText(nextTitle); setRetryText(nextRetry); setMessageText(nextMessage);
    });
    return () => { active = false; };
  }, [locale, message, retryLabel, title, ui.fallbackRetry, ui.fallbackTitle]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container} accessibilityRole="alert">
        <View style={styles.icon} accessible accessibilityLabel={titleText}>
          <Text style={styles.iconText}>!</Text>
        </View>
        <Text style={[styles.title, rtl && styles.rtlText]}>{titleText}</Text>
        {messageText ? <Text style={[styles.message, rtl && styles.rtlText]}>{messageText}</Text> : null}
        {onRetry ? <Pressable accessibilityRole="button" accessibilityLabel={retryText} onPress={onRetry} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Text style={styles.buttonText}>{retryText}</Text></Pressable> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.colors.canvas },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.colors.primarySoft, marginBottom: 18 },
  iconText: { color: BRAND.colors.primaryStrong, fontSize: 28, fontWeight: '800' },
  title: { color: BRAND.colors.ink, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  message: { marginTop: 10, maxWidth: 320, color: BRAND.colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  button: { marginTop: 20, minHeight: 48, paddingHorizontal: 22, borderRadius: BRAND.radius.control, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.colors.primaryStrong },
  buttonText: { color: BRAND.colors.white, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.84, transform: [{ scale: 0.98 }] },
  rtlText: { writingDirection: 'rtl', textAlign: 'right' },
});
