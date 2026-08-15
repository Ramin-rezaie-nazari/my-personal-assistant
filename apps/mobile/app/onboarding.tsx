import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppLocale, getStoredLocale } from '../lib/i18n';
import { DEFAULT_ONBOARDING, OnboardingState, setOnboardingState } from '../lib/onboarding';
import { BRAND } from '../lib/branding';
import { BrandWordmark } from '../components/BrandWordmark';

const steps = [0, 1, 2, 3, 4] as const;

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<OnboardingState>(DEFAULT_ONBOARDING);
  const [locale, setLocale] = useState<AppLocale>('en');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getStoredLocale().then((value) => {
      if (value) setLocale(value);
    });
  }, []);

  const rtl = locale === 'fa';
  const copy = useMemo(() => rtl ? {
    eyebrow: 'یک دقیقه برای شخصی‌سازی',
    title: ['هدفت چیه؟', 'سطحت چطوره؟', 'چه غذایی دوست داری؟', 'کجایی؟', 'چطور تمرین می‌کنی؟'][step],
    subtitle: ['دستیارت را بر اساس مهم‌ترین هدفت تنظیم می‌کنیم.', 'برنامه‌ها را با سطح فعلی تو هماهنگ می‌کنیم.', 'پیشنهاد غذا را با سلیقه و رژیمت هماهنگ می‌کنیم.', 'غذاها را با فرهنگ و کشور تو مرتبط می‌کنیم.', 'مدت تمرین و امکاناتت روی پیشنهادها اثر می‌گذارد.'][step],
    next: step === steps.length - 1 ? 'شروع کنیم' : 'ادامه',
    back: 'قبلی',
    saving: 'در حال ذخیره…',
    required: 'لطفاً این مرحله را تکمیل کن.',
  } : {
    eyebrow: 'One minute to personalize',
    title: ['What is your goal?', 'What is your level?', 'How do you eat?', 'Where are you from?', 'How do you train?'][step],
    subtitle: ['We will tune your assistant around your most important goal.', 'Your plans will adapt to your current experience.', 'Food suggestions will match your preferences and diet.', 'Recipes will connect to your country and culture.', 'Workout suggestions will respect your time and equipment.'][step],
    next: step === steps.length - 1 ? 'Let’s start' : 'Continue',
    back: 'Back',
    saving: 'Saving…',
    required: 'Please complete this step.',
  }, [rtl, step]);

  const update = (patch: Partial<OnboardingState>) => setState((current) => ({ ...current, ...patch }));

  const stepComplete =
    step === 0 ? Boolean(state.goal) :
    step === 1 ? Boolean(state.fitnessLevel) :
    step === 2 ? Boolean(state.diet) :
    step === 3 ? state.country.trim().length > 0 :
    Boolean(state.equipment) && Number(state.sessionMinutes) > 0;

  const finish = async () => {
    if (!stepComplete) return;
    try {
      setBusy(true);
      await setOnboardingState({ ...state, completed: true });
      router.replace('/');
    } finally {
      setBusy(false);
    }
  };

  const goNext = () => {
    if (!stepComplete || busy) return;
    if (step === steps.length - 1) void finish();
    else setStep((current) => current + 1);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.container, rtl && styles.rtl]}>
        <BrandWordmark compact />
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

        {!stepComplete ? <Text style={styles.required}>{copy.required}</Text> : null}
        <View style={styles.actions}>
          {step > 0 ? <Pressable onPress={() => setStep((current) => current - 1)} style={styles.secondary}><Text style={styles.secondaryText}>{copy.back}</Text></Pressable> : <View style={styles.secondaryPlaceholder} />}
          <Pressable disabled={busy || !stepComplete} onPress={goNext} style={({ pressed }) => [styles.primary, pressed && styles.pressed, (!stepComplete || busy) && styles.disabled]}>
            {busy ? <ActivityIndicator color={BRAND.colors.white} /> : <Text style={styles.primaryText}>{copy.next}</Text>}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function OptionGrid({ options, value, onSelect }: { options: [string, string][]; value: string; onSelect: (value: string) => void }) {
  return <View style={styles.options}>{options.map(([key, label]) => <Pressable key={key} onPress={() => onSelect(key)} accessibilityRole="radio" accessibilityState={{ selected: key === value }} style={[styles.option, key === value && styles.optionSelected]}><View style={styles.optionCopy}><Text style={styles.optionTitle}>{label}</Text></View><Text style={styles.check}>{key === value ? '✓' : ''}</Text></Pressable>)}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.colors.canvas },
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  rtl: { direction: 'rtl' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 10 },
  stepText: { color: BRAND.colors.muted, fontSize: BRAND.typography.label, fontWeight: '800' },
  progressTrack: { flexDirection: 'row', gap: 6 },
  progressDot: { width: 22, height: 5, borderRadius: 4, backgroundColor: BRAND.colors.border },
  progressDotActive: { backgroundColor: BRAND.colors.primary },
  eyebrow: { color: BRAND.colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: BRAND.colors.ink, fontSize: BRAND.typography.display, lineHeight: 37, fontWeight: '900' },
  subtitle: { color: BRAND.colors.muted, fontSize: BRAND.typography.body, lineHeight: 21, marginBottom: 8 },
  card: { backgroundColor: BRAND.colors.surface, borderRadius: BRAND.radius.card, padding: 16, borderWidth: 1, borderColor: BRAND.colors.border },
  options: { gap: 10 },
  option: { minHeight: 54, borderRadius: BRAND.radius.control, borderWidth: 1, borderColor: BRAND.colors.border, backgroundColor: BRAND.colors.surface, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  optionSelected: { borderColor: BRAND.colors.primary, borderWidth: 2, backgroundColor: BRAND.colors.primarySoft },
  optionCopy: { flex: 1 },
  optionTitle: { color: BRAND.colors.ink, fontSize: 15, fontWeight: '800' },
  check: { color: BRAND.colors.primary, fontSize: 20, fontWeight: '900' },
  sectionLabel: { color: BRAND.colors.inkSoft, fontSize: BRAND.typography.label, fontWeight: '900', marginBottom: 8 },
  sectionSpacing: { marginTop: 18 },
  required: { color: BRAND.colors.primary, fontSize: 12, fontWeight: '800', textAlign: rtlTextAlignPlaceholder() },
  actions: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 4 },
  secondary: { minHeight: 54, flex: 0.38, borderRadius: BRAND.radius.control, borderWidth: 1, borderColor: BRAND.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.colors.surface },
  secondaryPlaceholder: { flex: 0.38 },
  secondaryText: { color: BRAND.colors.inkSoft, fontWeight: '800' },
  primary: { minHeight: 54, flex: 1, borderRadius: BRAND.radius.control, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.colors.primary },
  primaryText: { color: BRAND.colors.white, fontSize: 16, fontWeight: '900' },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.5 },
});

function rtlTextAlignPlaceholder(): 'left' | 'right' { return 'left'; }
