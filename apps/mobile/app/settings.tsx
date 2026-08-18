import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BRAND } from '../lib/branding';
import {
  GlobalUserSettings,
  MeasurementSystem,
  getGlobalUserSettings,
  updateGlobalUserSettings,
} from '../lib/global-settings-api';
import { AppLocale, getStoredLocale } from '../lib/i18n';

const LANGUAGES = [
  ['en-US', 'English — United States'],
  ['en-GB', 'English — United Kingdom'],
  ['fa-IR', 'فارسی — ایران'],
  ['es-MX', 'Español — México'],
  ['fr-FR', 'Français — France'],
  ['de-DE', 'Deutsch — Deutschland'],
  ['zh-CN', '中文 — 中国'],
  ['ja-JP', '日本語 — 日本'],
  ['it-IT', 'Italiano — Italia'],
  ['pt-BR', 'Português — Brasil'],
  ['ko-KR', '한국어 — 대한민국'],
  ['ar-SA', 'العربية — السعودية'],
  ['ar-AE', 'العربية — الإمارات'],
  ['ar-EG', 'العربية — مصر'],
  ['hi-IN', 'हिन्दी — भारत'],
  ['tr-TR', 'Türkçe — Türkiye'],
  ['ru-RU', 'Русский — Россия'],
] as const;

const COUNTRIES = [
  ['IR', 'Iran'], ['US', 'United States'], ['GB', 'United Kingdom'], ['MX', 'Mexico'], ['ES', 'Spain'],
  ['FR', 'France'], ['DE', 'Germany'], ['IT', 'Italy'], ['JP', 'Japan'], ['CN', 'China'], ['BR', 'Brazil'],
  ['KR', 'South Korea'], ['SA', 'Saudi Arabia'], ['AE', 'United Arab Emirates'], ['EG', 'Egypt'], ['IN', 'India'],
  ['TR', 'Türkiye'], ['RU', 'Russia'], ['CA', 'Canada'], ['AU', 'Australia'],
] as const;

const CURRENCIES = ['IRR', 'USD', 'GBP', 'EUR', 'MXN', 'JPY', 'CNY', 'BRL', 'KRW', 'SAR', 'AED', 'EGP', 'INR', 'TRY', 'RUB', 'CAD', 'AUD'];
const VOICES = [
  ['fa-IR-tehran', 'Persian — Tehran'], ['en-US', 'English — US'], ['en-GB', 'English — UK'], ['es-MX', 'Spanish — Mexico'],
  ['fr-FR', 'French — France'], ['de-DE', 'German'], ['zh-CN', 'Chinese — Mandarin'], ['ja-JP', 'Japanese'],
  ['it-IT', 'Italian'], ['pt-BR', 'Portuguese — Brazil'], ['ko-KR', 'Korean'], ['ar-SA', 'Arabic — Saudi'],
  ['ar-AE', 'Arabic — UAE'], ['ar-EG', 'Arabic — Egypt'], ['hi-IN', 'Hindi — India'], ['tr-TR', 'Turkish'], ['ru-RU', 'Russian'],
] as const;

export default function SettingsScreen() {
  const [locale, setLocale] = useState<AppLocale>('en');
  const [settings, setSettings] = useState<GlobalUserSettings | null>(null);
  const [draft, setDraft] = useState({ languageTag: 'en-US', countryCode: '', currencyCode: '', measurementSystem: 'metric' as MeasurementSystem, timezone: 'UTC', voiceProfile: '' });
  const [modal, setModal] = useState<'language' | 'country' | 'currency' | 'voice' | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const text = useMemo(() => locale === 'fa' ? {
    title: 'تنظیمات جهانی', subtitle: 'زبان، کشور، واحدها و صدای دستیار را برای خودت تنظیم کن.', language: 'زبان دستیار', country: 'کشور', currency: 'ارز', units: 'سیستم اندازه‌گیری', timezone: 'منطقه زمانی', voice: 'صدای دستیار', save: 'ذخیره تغییرات', saved: 'تنظیمات ذخیره شد', cancel: 'لغو', close: 'بستن', loading: 'در حال بارگذاری…', error: 'بارگذاری تنظیمات ناموفق بود', retry: 'تلاش دوباره', metric: 'متریک', us: 'آمریکایی', uk: 'بریتانیا', custom: 'وارد کردن دستی', currencyHint: 'مثلاً USD یا IRR', timezoneHint: 'مثلاً Asia/Tehran', back: 'بازگشت', offline: 'قابل استفاده با معماری آفلاین',
  } : {
    title: 'Global settings', subtitle: 'Choose the language, country, units and assistant voice that fit you.', language: 'Assistant language', country: 'Country', currency: 'Currency', units: 'Measurement system', timezone: 'Timezone', voice: 'Assistant voice', save: 'Save changes', saved: 'Settings saved', cancel: 'Cancel', close: 'Close', loading: 'Loading…', error: 'Could not load settings', retry: 'Retry', metric: 'Metric', us: 'US customary', uk: 'UK imperial', custom: 'Enter manually', currencyHint: 'For example USD or IRR', timezoneHint: 'For example Europe/Madrid', back: 'Back', offline: 'Offline-capable architecture',
  } as const, [locale]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [storedLocale, value] = await Promise.all([getStoredLocale(), getGlobalUserSettings()]);
      if (storedLocale) setLocale(storedLocale);
      setSettings(value);
      setDraft({
        languageTag: value.languageTag,
        countryCode: value.countryCode ?? '',
        currencyCode: value.currencyCode ?? '',
        measurementSystem: value.measurementSystem,
        timezone: value.timezone,
        voiceProfile: value.voiceProfile.id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const save = useCallback(async () => {
    try {
      setSaving(true);
      setMessage(null);
      const value = await updateGlobalUserSettings({
        languageTag: draft.languageTag,
        countryCode: draft.countryCode || null,
        currencyCode: draft.currencyCode || null,
        measurementSystem: draft.measurementSystem,
        timezone: draft.timezone,
        voiceProfile: draft.voiceProfile || null,
      });
      setSettings(value);
      setDraft((current) => ({ ...current, voiceProfile: value.voiceProfile.id, languageTag: value.languageTag, countryCode: value.countryCode ?? '', currencyCode: value.currencyCode ?? '', measurementSystem: value.measurementSystem, timezone: value.timezone }));
      setMessage(text.saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  }, [draft, text.saved]);

  const languageLabel = LANGUAGES.find(([code]) => code === draft.languageTag)?.[1] ?? draft.languageTag;
  const countryLabel = COUNTRIES.find(([code]) => code === draft.countryCode)?.[1] ?? draft.countryCode || text.custom;
  const voiceLabel = VOICES.find(([code]) => code === draft.voiceProfile)?.[1] ?? settings?.voiceProfile.label ?? draft.voiceProfile || text.custom;

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={BRAND.colors.primaryStrong} /><Text style={styles.centerText}>{text.loading}</Text></View>;
  }

  if (error && !settings) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.errorTitle}>{text.error}</Text><Text style={styles.errorBody}>{error}</Text><Pressable onPress={() => { setLoading(true); void load(); }} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{text.retry}</Text></Pressable></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel={text.back} onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
          <View style={styles.headerText}><Text style={styles.eyebrow}>MY PERSONAL ASSISTANT</Text><Text style={styles.title}>{text.title}</Text><Text style={styles.subtitle}>{text.subtitle}</Text></View>
        </View>

        <SettingRow title={text.language} value={languageLabel} onPress={() => setModal('language')} />
        <SettingRow title={text.country} value={countryLabel} onPress={() => setModal('country')} />
        <SettingRow title={text.currency} value={draft.currencyCode || text.custom} onPress={() => setModal('currency')} />
        <SettingRow title={text.voice} value={voiceLabel} onPress={() => setModal('voice')} />

        <View style={styles.card}>
          <Text style={styles.rowTitle}>{text.units}</Text>
          <View style={styles.segmentRow}>
            {([
              ['metric', text.metric], ['us-customary', text.us], ['uk-imperial', text.uk],
            ] as const).map(([value, label]) => {
              const active = draft.measurementSystem === value;
              return <Pressable key={value} onPress={() => setDraft((current) => ({ ...current, measurementSystem: value }))} style={[styles.segment, active && styles.segmentActive]}><Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text></Pressable>;
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.rowTitle}>{text.timezone}</Text>
          <TextInput value={draft.timezone} onChangeText={(timezone) => setDraft((current) => ({ ...current, timezone }))} placeholder={text.timezoneHint} placeholderTextColor={BRAND.colors.textMuted} style={styles.input} autoCapitalize="none" autoCorrect={false} />
        </View>

        <View style={styles.note}><Text style={styles.noteDot}>•</Text><Text style={styles.noteText}>{settings?.voiceProfile.offlineCapable ? text.offline : ''}</Text></View>

        {error ? <View style={styles.inlineError}><Text style={styles.inlineErrorText}>{error}</Text></View> : null}
        {message ? <View style={styles.success}><Text style={styles.successText}>{message}</Text></View> : null}

        <Pressable accessibilityRole="button" disabled={saving} onPress={() => void save()} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, saving && styles.disabled]}>
          <Text style={styles.primaryButtonText}>{saving ? '…' : text.save}</Text>
        </Pressable>
      </ScrollView>

      <PickerModal title={modal === 'language' ? text.language : modal === 'country' ? text.country : modal === 'currency' ? text.currency : text.voice} visible={modal != null} onClose={() => setModal(null)}>
        {modal === 'language' ? LANGUAGES.map(([value, label]) => <PickerOption key={value} label={label} active={draft.languageTag === value} onPress={() => { setDraft((current) => ({ ...current, languageTag: value })); setModal(null); }} />) : null}
        {modal === 'country' ? COUNTRIES.map(([value, label]) => <PickerOption key={value} label={`${label} (${value})`} active={draft.countryCode === value} onPress={() => { setDraft((current) => ({ ...current, countryCode: value })); setModal(null); }} />) : null}
        {modal === 'currency' ? CURRENCIES.map((value) => <PickerOption key={value} label={value} active={draft.currencyCode === value} onPress={() => { setDraft((current) => ({ ...current, currencyCode: value })); setModal(null); }} />) : null}
        {modal === 'voice' ? VOICES.map(([value, label]) => <PickerOption key={value} label={label} active={draft.voiceProfile === value} onPress={() => { setDraft((current) => ({ ...current, voiceProfile: value })); setModal(null); }} />) : null}
      </PickerModal>
    </SafeAreaView>
  );
}

function SettingRow({ title, value, onPress }: { title: string; value: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed, styles.settingRow]}><View><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowValue}>{value}</Text></View><Text style={styles.chevron}>›</Text></Pressable>;
}

function PickerModal({ title, visible, onClose, children }: { title: string; visible: boolean; onClose: () => void; children: React.ReactNode }) {
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalBackdrop}><View style={styles.modal}><View style={styles.modalHeader}><Text style={styles.modalTitle}>{title}</Text><Pressable onPress={onClose}><Text style={styles.close}>{'×'}</Text></Pressable></View><ScrollView>{children}</ScrollView></View></View></Modal>;
}

function PickerOption({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.option, active && styles.optionActive]}><Text style={[styles.optionText, active && styles.optionTextActive]}>{label}</Text>{active ? <Text style={styles.check}>✓</Text> : null}</Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.colors.canvas },
  content: { padding: 20, paddingBottom: 40, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: BRAND.colors.canvas },
  centerText: { marginTop: 12, color: BRAND.colors.textMuted },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  back: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.colors.surface, borderWidth: 1, borderColor: BRAND.colors.border },
  backText: { fontSize: 28, color: BRAND.colors.textStrong, marginTop: -2 },
  headerText: { flex: 1 },
  eyebrow: { fontSize: 11, letterSpacing: 1.5, fontWeight: '700', color: BRAND.colors.primaryStrong, marginBottom: 6 },
  title: { fontSize: 28, fontWeight: '800', color: BRAND.colors.textStrong },
  subtitle: { marginTop: 6, color: BRAND.colors.textMuted, lineHeight: 20 },
  card: { backgroundColor: BRAND.colors.surface, borderRadius: 20, borderWidth: 1, borderColor: BRAND.colors.border, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  settingRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { color: BRAND.colors.textStrong, fontWeight: '750', fontSize: 16 },
  rowValue: { marginTop: 5, color: BRAND.colors.textMuted },
  chevron: { color: BRAND.colors.primaryStrong, fontSize: 28, marginLeft: 10 },
  segmentRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  segment: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: BRAND.colors.canvasAlt, borderWidth: 1, borderColor: BRAND.colors.border },
  segmentActive: { backgroundColor: BRAND.colors.primarySoft, borderColor: BRAND.colors.primary },
  segmentText: { color: BRAND.colors.textMuted, fontSize: 12, fontWeight: '700' },
  segmentTextActive: { color: BRAND.colors.primaryStrong },
  input: { marginTop: 12, backgroundColor: BRAND.colors.canvasAlt, borderWidth: 1, borderColor: BRAND.colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: BRAND.colors.textStrong },
  note: { flexDirection: 'row', gap: 7, paddingHorizontal: 4, alignItems: 'center' },
  noteDot: { color: BRAND.colors.primaryStrong, fontSize: 20 },
  noteText: { color: BRAND.colors.textMuted, flex: 1 },
  inlineError: { padding: 12, borderRadius: 12, backgroundColor: BRAND.colors.dangerSoft ?? BRAND.colors.canvasAlt },
  inlineErrorText: { color: BRAND.colors.danger ?? BRAND.colors.textStrong },
  success: { padding: 12, borderRadius: 12, backgroundColor: BRAND.colors.primarySoft },
  successText: { color: BRAND.colors.primaryStrong, fontWeight: '700' },
  primaryButton: { marginTop: 4, minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.colors.primaryStrong },
  primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  errorTitle: { fontSize: 20, fontWeight: '800', color: BRAND.colors.textStrong },
  errorBody: { marginTop: 8, textAlign: 'center', color: BRAND.colors.textMuted },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modal: { maxHeight: '82%', backgroundColor: BRAND.colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 18 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: BRAND.colors.textStrong },
  close: { fontSize: 28, color: BRAND.colors.textMuted, paddingHorizontal: 5 },
  option: { paddingVertical: 15, paddingHorizontal: 13, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionActive: { backgroundColor: BRAND.colors.primarySoft },
  optionText: { color: BRAND.colors.textStrong, fontSize: 15 },
  optionTextActive: { color: BRAND.colors.primaryStrong, fontWeight: '800' },
  check: { color: BRAND.colors.primaryStrong, fontWeight: '900', fontSize: 18 },
});
