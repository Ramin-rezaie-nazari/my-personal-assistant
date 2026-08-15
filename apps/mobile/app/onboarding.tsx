import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppLocale, getStoredLocale } from '../lib/i18n';
import { DEFAULT_ONBOARDING, OnboardingState, setOnboardingState } from '../lib/onboarding';
import { useEffect } from 'react';

const steps = [0, 1, 2, 3, 4] as const;

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<OnboardingState>(DEFAULT_ONBOARDING);
  const [locale, setLocale] = useState<AppLocale>('en');
  const [busy, setBusy] = useState(false);

  useEffect(() => { void getStoredLocale().then((value) => { if (value) setLocale(value); }); }, []);

  const rtl = locale === 'fa';
  const copy = useMemo(() => rtl ? {
    eyebrow: 'یک دقیقه برای شخصی‌سازی',
    title: ['هدفت چیه؟', 'سطحت چطوره؟', 'چه غذایی دوست داری؟', 'کجایی؟', 'چطور تمرین می‌کنی؟'][step],
    subtitle: ['دستیارت را بر اساس مهم‌ترین هدفت تنظیم می‌کنیم.', 'برنامه‌ها را با سطح فعلی تو هماهنگ می‌کنیم.', 'پیشنهاد غذا را با سلیقه و رژیمت هماهنگ می‌کنیم.', 'غذاها را با فرهنگ و کشور تو مرتبط می‌کنیم.', 'مدت تمرین و امکاناتت روی پیشنهادها اثر می‌گذارد.'][step],
    next: step === steps.length - 1 ? 'شروع کنیم' : 'ادامه',
    back: 'قبلی',
    saving: 'در حال ذخیره…',
  } : {
    eyebrow: 'One minute to personalize',
    title: ['What is your goal?', 'What is your level?', 'How do you eat?', 'Where are you from?', 'How do you train?'][step],
    subtitle: ['We will tune your assistant around your most important goal.', 'Your plans will adapt to your current experience.', 'Food suggestions will match your preferences and diet.', 'Recipes will connect to your country and culture.', 'Workout suggestions will respect your time and equipment.'][step],
    next: step === steps.length - 1 ? 'Let’s start' : 'Continue',
    back: 'Back',
    saving: 'Saving…',
  }, [locale, rtl, step]);

  const update = (patch: Partial<OnboardingState>) => setState((current) => ({ ...current, ...patch }));

  const finish = async () => {
    try {
      setBusy(true);
      await setOnboardingState({ ...state, completed: true });
      router.replace('/');
    } finally {
      setBusy(false);
    }
  };

  const canContinue = step < steps.length - 1 || state.country.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.container, rtl && styles.rtl]}>
        <View style={styles.topRow}>
          <Text style={styles.stepText}>{step + 1} / {steps.length}</Text>
          <View style={styles.progressTrack}>{steps.map((item) => <View key={item} style={[styles.progressDot, item <= step && styles.progressDotActive]} />)}</View>
        </View>
        <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>

        <View style={styles.card}>
          {step === 0 ? <OptionGrid options={[
            ['fat_loss', rtl ? 'کاهش چربی' : 'Fat loss'], ['body_sculpt', rtl ? 'خوش‌فرم شدن' : 'Body sculpt'], ['strength', rtl ? 'قدرت بیشتر' : 'Build strength'], ['general_fitness', rtl ? 'سلامت عمومی' : 'General fitness'],
          ]} value={state.goal} onSelect={(value) => update({ goal: value as OnboardingState['goal'] })} /> : null}
          {step === 1 ? <OptionGrid options={[
            ['beginner', rtl ? 'تازه‌کار' : 'Beginner'], ['foundation', rtl ? 'پایه' : 'Foundation'], ['intermediate', rtl ? 'متوسط' : 'Intermediate'], ['advanced', rtl ? 'پیشرفته' : 'Advanced'],
          ]} value={state.fitnessLevel} onSelect={(value) => update({ fitnessLevel: value as OnboardingState['fitnessLevel'] })} /> : null}
          {step === 2 ? <OptionGrid options={[
            ['balanced', rtl ? 'متعادل' : 'Balanced'], ['high_protein', rtl ? 'پروتئین بالا' : 'High protein'], ['vegetarian', rtl ? 'گیاهخواری' : 'Vegetarian'], ['vegan', rtl ? 'وگان' : 'Vegan'], ['halal', rtl ? 'حلال' : 'Halal'],
          ]} value={state.diet} onSelect={(value) => update({ diet: value as OnboardingState['diet'] })} /> : null}
          {step === 3 ? <OptionGrid options={[
            ['Iran', rtl ? 'ایران' : 'Iran'], ['United States', rtl ? 'آمریکا' : 'United States'], ['Spain', rtl ? 'اسپانیا' : 'Spain'], ['Turkey', rtl ? 'ترکیه' : 'Turkey'], ['Germany', rtl ? 'آلمان' : 'Germany'], ['United Kingdom', rtl ? 'بریتانیا' : 'United Kingdom'],
          ]} value={state.country} onSelect={(value) => update({ country: value })} /> : null}
          {step === 4 ? <>
            <Text style={styles.sectionLabel}>{rtl ? 'امکانات' : 'Equipment'}</Text>
            <OptionGrid options={[
              ['none', rtl ? 'بدون تجهیزات' : 'No equipment'], ['home', rtl ? 'در خانه' : 'Home setup'], ['gym', rtl ? 'باشگاه' : 'Gym'],
            ]} value={state.equipment} onSelect={(value) => update({ equipment: value as OnboardingState['equipment'] })} />
            <Text style={[styles.sectionLabel, styles.sectionSpacing]}>{rtl ? 'مدت تمرین' : 'Session length'}</Text>
            <OptionGrid options={[
              ['20', '20 min'], ['30', '30 min'], ['45', '45 min'], ['60', '60 min'],
            ]} value={String(state.sessionMinutes)} onSelect={(value) => update({ sessionMinutes: Number(value) as OnboardingState['sessionMinutes'] })} />
          </> : null}
        </View>

        <View style={styles.actions}>
          {step > 0 ? <Pressable onPress={() => setStep((current) => current - 1)} style={styles.secondary}><Text style={styles.secondaryText}>{copy.back}</Text></Pressable> : <View style={styles.secondaryPlaceholder} />}
          <Pressable disabled={busy || !canContinue} onPress={() => step === steps.length - 1 ? void finish() : setStep((current) => current + 1)} style={({ pressed }) => [styles.primary, pressed && styles.pressed, (!canContinue || busy) && styles.disabled]}>
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>{busy ? copy.saving : copy.next}</Text>}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function OptionGrid({ options, value, onSelect }: { options: [string, string][]; value: string; onSelect: (value: string) => void }) {
  return <View style={styles.options}>{options.map(([key, label]) => <Pressable key={key} onPress={() => onSelect(key)} style={[styles.option, key === value && styles.optionSelected]}><View style={styles.optionCopy}><Text style={styles.optionTitle}>{label}</Text></View><Text style={styles.check}>{key === value ? '✓' : ''}</Text></Pressable>)}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  rtl: { direction: 'rtl' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  stepText: { color: '#6B7280', fontSize: 12, fontWeight: '800' },
  progressTrack: { flexDirection: 'row', gap: 6 },
  progressDot: { width: 22, height: 5, borderRadius: 4, backgroundColor: '#E5E7EB' },
  progressDotActive: { backgroundColor: '#6D28D9' },
  eyebrow: { color: '#6D28D9', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: '#111827', fontSize: 31, lineHeight: 37, fontWeight: '900' },
  subtitle: { color: '#6B7280', fontSize: 14, lineHeight: 21, marginBottom: 8 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  options: { gap: 10 },
  option: { minHeight: 54, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  optionSelected: { borderColor: '#6D28D9', borderWidth: 2, backgroundColor: '#FAF8FF' },
  optionCopy: { flex: 1 },
  optionTitle: { color: '#111827', fontSize: 15, fontWeight: '800' },
  check: { color: '#6D28D9', fontSize: 20, fontWeight: '900' },
  sectionLabel: { color: '#374151', fontSize: 12, fontWeight: '900', marginBottom: 8 },
  sectionSpacing: { marginTop: 18 },
  actions: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 4 },
  secondary: { minHeight: 54, flex: 0.38, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  secondaryPlaceholder: { flex: 0.38 },
  secondaryText: { color: '#374151', fontWeight: '800' },
  primary: { minHeight: 54, flex: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6D28D9' },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.5 },
});
