import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Camera from 'expo-camera';
import { AppLocale, getStoredLocale } from '../lib/i18n';
import {
  DEFAULT_ONBOARDING,
  OnboardingState,
  calculateBMI,
  setOnboardingState,
} from '../lib/onboarding';
import { BRAND } from '../lib/branding';
import { BrandWordmark } from '../components/BrandWordmark';

const TOTAL_QUESTIONS = 5;
const SCREEN_COUNT = 7;

type Choice = { key: string; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; hint?: string };

type PermissionKey = keyof OnboardingState['permissions'];

export default function OnboardingScreen() {
  const [screen, setScreen] = useState(0);
  const [state, setState] = useState<OnboardingState>(DEFAULT_ONBOARDING);
  const [locale, setLocale] = useState<AppLocale>('en');
  const [busy, setBusy] = useState(false);
  const [permissionBusy, setPermissionBusy] = useState<PermissionKey | null>(null);
  const [detectedCountry, setDetectedCountry] = useState('');
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(18)).current;

  const rtl = locale === 'fa';

  useEffect(() => {
    void getStoredLocale().then((value) => value && setLocale(value));
  }, []);

  useEffect(() => {
    fade.setValue(0);
    slide.setValue(18);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, screen, slide]);

  const copy = useMemo(() => getCopy(rtl, screen), [rtl, screen]);
  const bmi = calculateBMI(Number(state.heightCm), Number(state.weightKg));

  const update = (patch: Partial<OnboardingState>) => setState((current) => ({ ...current, ...patch }));
  const updatePermission = (key: PermissionKey, value: boolean) =>
    setState((current) => ({ ...current, permissions: { ...current.permissions, [key]: value } }));

  const requestPermission = async (key: PermissionKey) => {
    try {
      setPermissionBusy(key);
      if (key === 'location') {
        const result = await Location.requestForegroundPermissionsAsync();
        const granted = result.status === 'granted';
        updatePermission(key, granted);
        if (granted) {
          try {
            const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const places = await Location.reverseGeocodeAsync(position.coords);
            const country = places[0]?.country ?? '';
            setDetectedCountry(country);
            update({ detectedCountry: country });
          } catch {
            // Location permission can be granted even when reverse geocoding is unavailable.
          }
        }
      } else if (key === 'notifications') {
        const result = await Notifications.requestPermissionsAsync();
        updatePermission(key, Boolean(result.granted || result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL));
      } else if (key === 'camera') {
        const result = await Camera.requestCameraPermissionsAsync();
        updatePermission(key, result.status === 'granted');
      } else if (key === 'microphone') {
        const result = await Camera.requestMicrophonePermissionsAsync();
        updatePermission(key, result.status === 'granted');
      }
    } catch {
      updatePermission(key, false);
    } finally {
      setPermissionBusy(null);
    }
  };

  const profileComplete = state.fullName.trim().length >= 2 && !!state.gender && !!state.birthDate && Number(state.heightCm) > 80 && Number(state.weightKg) > 25;
  const questionComplete =
    screen === 2 ? !!state.goal :
    screen === 3 ? !!state.fitnessLevel :
    screen === 4 ? !!state.diet :
    screen === 5 ? !!state.workoutPlace :
    true;

  const screenComplete =
    screen === 0 ? true :
    screen === 1 ? profileComplete :
    questionComplete && (screen !== 6 || (!!state.equipment && Number(state.sessionMinutes) > 0));

  const goNext = () => {
    if (busy || !screenComplete) return;
    if (screen === SCREEN_COUNT - 1) {
      void finish();
      return;
    }
    setScreen((value) => value + 1);
  };

  const goBack = () => setScreen((value) => Math.max(0, value - 1));

  const finish = async () => {
    try {
      setBusy(true);
      await setOnboardingState({ ...state, completed: true });
      router.replace('/');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.glowA} />
      <View style={styles.glowB} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.shell}>
          <View style={styles.header}>
            <BrandWordmark compact />
            <View style={styles.progressPill}>
              <Text style={styles.progressText}>{screen === 0 ? '' : `${Math.min(screen, TOTAL_QUESTIONS)} / ${TOTAL_QUESTIONS}`}</Text>
              <View style={styles.progressRail}>
                <View style={[styles.progressFill, { width: `${Math.max(14, (screen / (SCREEN_COUNT - 1)) * 100)}%` }]} />
              </View>
            </View>
          </View>

          {screen > 0 && screen < SCREEN_COUNT && (
            <Pressable onPress={goBack} accessibilityRole="button" style={styles.backButton}>
              <MaterialCommunityIcons name={rtl ? 'arrow-right' : 'arrow-left'} size={20} color={BRAND.colors.inkSoft} />
              <Text style={styles.backText}>{rtl ? 'برگشت' : 'Back'}</Text>
            </Pressable>
          )}

          <Animated.View style={[styles.content, { opacity: fade, transform: [{ translateY: slide }] }]}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.eyebrow, rtl && styles.rtlText]}>{copy.eyebrow}</Text>
              <Text style={[styles.heroTitle, rtl && styles.rtlText]}>{copy.title}</Text>
              <Text style={[styles.heroSubtitle, rtl && styles.rtlText]}>{copy.subtitle}</Text>

              {screen === 0 && <WelcomeCard rtl={rtl} />}
              {screen === 1 && (
                <ProfileCard
                  rtl={rtl}
                  state={state}
                  bmi={bmi}
                  onUpdate={update}
                />
              )}
              {screen === 2 && (
                <ChoiceCard
                  rtl={rtl}
                  choices={[
                    { key: 'fat_loss', label: rtl ? 'کاهش چربی' : 'Lose body fat', icon: 'fire' , hint: rtl ? 'سبک‌تر و پرانرژی‌تر' : 'Feel lighter & more energetic' },
                    { key: 'body_sculpt', label: rtl ? 'فرم بهتر بدن' : 'Shape my body', icon: 'human-handsup', hint: rtl ? 'عضله‌سازی و فرم‌دهی' : 'Tone up with balance' },
                    { key: 'strength', label: rtl ? 'قوی‌تر شدن' : 'Get stronger', icon: 'dumbbell', hint: rtl ? 'قدرت و عملکرد بیشتر' : 'Build strength & performance' },
                    { key: 'general_fitness', label: rtl ? 'سلامت و تناسب عمومی' : 'Feel fitter', icon: 'heart-pulse', hint: rtl ? 'یک روال سالم و پایدار' : 'A healthy routine that sticks' },
                  ]}
                  value={state.goal}
                  onSelect={(value) => update({ goal: value as OnboardingState['goal'] })}
                />
              )}
              {screen === 3 && (
                <ChoiceCard
                  rtl={rtl}
                  choices={[
                    { key: 'beginner', label: rtl ? 'تازه‌کارم' : 'I’m just starting', icon: 'sprout', hint: rtl ? 'آرام و قدم‌به‌قدم' : 'Gentle, guided, no pressure' },
                    { key: 'foundation', label: rtl ? 'یکم تجربه دارم' : 'I have some experience', icon: 'walk', hint: rtl ? 'ساختن پایه‌های محکم' : 'Build a strong foundation' },
                    { key: 'intermediate', label: rtl ? 'متوسط' : 'I train regularly', icon: 'run-fast', hint: rtl ? 'چالش مناسب برای رشد' : 'Ready for a real challenge' },
                    { key: 'advanced', label: rtl ? 'پیشرفته' : 'I know my way around', icon: 'trophy-outline', hint: rtl ? 'جزئیات دقیق‌تر و حرفه‌ای‌تر' : 'Smarter, more precise planning' },
                  ]}
                  value={state.fitnessLevel}
                  onSelect={(value) => update({ fitnessLevel: value as OnboardingState['fitnessLevel'] })}
                />
              )}
              {screen === 4 && (
                <ChoiceCard
                  rtl={rtl}
                  choices={[
                    { key: 'balanced', label: rtl ? 'متعادل' : 'Balanced', icon: 'scale-balance', hint: rtl ? 'تنوع و تعادل' : 'A little of everything' },
                    { key: 'high_protein', label: rtl ? 'پروتئین بالا' : 'High protein', icon: 'food-steak', hint: rtl ? 'تمرکز بیشتر روی پروتئین' : 'Protein-forward meals' },
                    { key: 'vegetarian', label: rtl ? 'گیاهخواری' : 'Vegetarian', icon: 'leaf', hint: rtl ? 'بدون گوشت' : 'Plant-focused, no meat' },
                    { key: 'vegan', label: rtl ? 'وگان' : 'Vegan', icon: 'sprout-outline', hint: rtl ? 'کاملاً گیاهی' : 'Fully plant-based' },
                    { key: 'halal', label: rtl ? 'حلال' : 'Halal', icon: 'food-halal', hint: rtl ? 'انتخاب‌های سازگار با حلال' : 'Halal-friendly suggestions' },
                  ]}
                  value={state.diet}
                  onSelect={(value) => update({ diet: value as OnboardingState['diet'] })}
                />
              )}
              {screen === 5 && (
                <ChoiceCard
                  rtl={rtl}
                  choices={[
                    { key: 'home', label: rtl ? 'بیشتر در خانه' : 'Mostly at home', icon: 'home-heart', hint: rtl ? 'برنامه‌های کم‌دردسر و قابل اجرا' : 'Simple sessions that fit home life' },
                    { key: 'gym', label: rtl ? 'بیشتر باشگاه' : 'Mostly at the gym', icon: 'dumbbell', hint: rtl ? 'تمرین با تجهیزات کامل‌تر' : 'More equipment, more options' },
                    { key: 'both', label: rtl ? 'هردو' : 'A mix of both', icon: 'swap-horizontal-circle', hint: rtl ? 'انعطاف کامل' : 'Stay flexible wherever you are' },
                  ]}
                  value={state.workoutPlace}
                  onSelect={(value) => update({ workoutPlace: value as OnboardingState['workoutPlace'] })}
                />
              )}
              {screen === 6 && (
                <FinalSetupCard
                  rtl={rtl}
                  state={state}
                  onUpdate={update}
                  detectedCountry={detectedCountry || state.detectedCountry}
                />
              )}

              {screen === 1 && !profileComplete && (
                <Text style={[styles.validation, rtl && styles.rtlText]}>{rtl ? 'نام، جنسیت، تاریخ تولد، قد و وزن را کامل کن.' : 'Add your name, gender, birth date, height and weight to continue.'}</Text>
              )}
            </ScrollView>

            <View style={styles.bottomBar}>
              {screen === 0 ? (
                <Text style={[styles.privacyNote, rtl && styles.rtlText]}>
                  <MaterialCommunityIcons name="shield-check-outline" size={15} color={BRAND.colors.primary} />{' '}
                  {rtl ? 'اطلاعاتت روی دستگاهت می‌ماند و با هر مرحله کنترل دست خودت است.' : 'Your setup stays private and every permission is under your control.'}
                </Text>
              ) : null}
              <Pressable
                onPress={goNext}
                disabled={busy || !screenComplete}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryPressed, (!screenComplete || busy) && styles.primaryDisabled]}
              >
                {busy ? <ActivityIndicator color={BRAND.colors.white} /> : (
                  <>
                    <Text style={styles.primaryButtonText}>{copy.cta}</Text>
                    <MaterialCommunityIcons name={rtl ? 'arrow-left' : 'arrow-right'} size={22} color={BRAND.colors.white} />
                  </>
                )}
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getCopy(rtl: boolean, screen: number) {
  const en = [
    ['WELCOME', 'Meet the assistant that actually knows you.', 'A calm first setup. Then we’ll turn your goals, food and routine into one connected daily plan.', 'Let’s build it'],
    ['YOUR PROFILE', 'Start with you.', 'A few details help us make numbers, recommendations and routines feel personal from day one.', 'Continue'],
    ['01 · YOUR GOAL', 'What would feel like a win?', 'Choose the outcome you care about most right now. You can change it anytime.', 'That’s me'],
    ['02 · YOUR LEVEL', 'How should I pace you?', 'No judgment here. The best plan is one you’ll actually enjoy following.', 'Sounds right'],
    ['03 · YOUR FOOD', 'What should your meals feel like?', 'We’ll keep your preferences in mind when suggesting meals, shopping lists and recipes.', 'Match my meals'],
    ['04 · YOUR SPACE', 'Where do you like to move?', 'This helps us make workouts practical instead of perfect on paper.', 'That works'],
    ['05 · YOUR RHYTHM', 'Last thing: fit it into your day.', 'Pick the setup that feels realistic. Consistency beats heroic plans.', 'Create my plan'],
  ];
  const fa = [
    ['شروع', 'دستیاری که واقعاً تو را می‌شناسد.', 'یک شروع آرام و کوتاه. بعد هدف‌ها، غذا و برنامه روزانه‌ات را به یک تجربه یکپارچه تبدیل می‌کنیم.', 'بزن بریم'],
    ['پروفایل تو', 'از خودت شروع کنیم.', 'چند اطلاعات ساده کمک می‌کند عددها، پیشنهادها و برنامه‌ها از همان اول شخصی شوند.', 'ادامه'],
    ['۰۱ · هدف تو', 'چه چیزی برایت حس برد دارد؟', 'مهم‌ترین نتیجه‌ای که الان می‌خواهی را انتخاب کن. هر وقت بخواهی می‌توانی تغییرش بدهی.', 'این منم'],
    ['۰۲ · سطح تو', 'با چه سرعتی همراهت باشم؟', 'اینجا قضاوتی در کار نیست. بهترین برنامه، برنامه‌ای است که واقعاً دوست داشته باشی ادامه‌اش بدهی.', 'درسته'],
    ['۰۳ · غذای تو', 'دوست داری وعده‌هایت چه حسی داشته باشند؟', 'ترجیحاتت را برای غذا، لیست خرید و رسپی‌ها در نظر می‌گیریم.', 'غذای من'],
    ['۰۴ · فضای تو', 'کجا بیشتر دوست داری تمرین کنی؟', 'این کمک می‌کند برنامه‌ها واقعاً قابل اجرا باشند، نه فقط زیبا روی کاغذ.', 'همینه'],
    ['۰۵ · ریتم تو', 'آخرین چیز: جا بگیرد در روزت.', 'چیزی را انتخاب کن که واقعاً شدنی است. استمرار از برنامه‌های قهرمانانه مهم‌تر است.', 'برنامه‌ام را بساز'],
  ];
  const item = (rtl ? fa : en)[screen] ?? (rtl ? fa[6] : en[6]);
  return { eyebrow: item[0], title: item[1], subtitle: item[2], cta: item[3] };
}

function WelcomeCard({ rtl }: { rtl: boolean }) {
  return (
    <View style={styles.welcomeCard}>
      <View style={styles.orbitOne} />
      <View style={styles.orbitTwo} />
      <View style={styles.assistantOrb}>
        <MaterialCommunityIcons name="sparkles" size={38} color={BRAND.colors.white} />
      </View>
      <View style={styles.welcomeTextWrap}>
        <View style={styles.miniBadge}><Text style={styles.miniBadgeText}>{rtl ? 'کمتر از ۲ دقیقه' : 'UNDER 2 MINUTES'}</Text></View>
        <Text style={[styles.welcomeHeadline, rtl && styles.rtlText]}>{rtl ? 'هر چیزی که لازم است، یک‌جا.' : 'Everything useful. In one place.'}</Text>
        <Text style={[styles.welcomeBody, rtl && styles.rtlText]}>{rtl ? 'بدون فرم‌های خسته‌کننده. فقط چند انتخاب هوشمند تا دستیارت بفهمد چه چیزی برای تو مهم است.' : 'No boring forms. Just a few thoughtful choices so your assistant can understand what matters to you.'}</Text>
      </View>
      <View style={styles.featureRow}>
        <FeaturePill icon="food-apple" text={rtl ? 'غذا' : 'Food'} />
        <FeaturePill icon="dumbbell" text={rtl ? 'تمرین' : 'Training'} />
        <FeaturePill icon="calendar-check" text={rtl ? 'روزت' : 'Your day'} />
      </View>
    </View>
  );
}

function FeaturePill({ icon, text }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; text: string }) {
  return <View style={styles.featurePill}><MaterialCommunityIcons name={icon} size={16} color={BRAND.colors.primary} /><Text style={styles.featureText}>{text}</Text></View>;
}

function ProfileCard({ rtl, state, bmi, onUpdate }: { rtl: boolean; state: OnboardingState; bmi: number | null; onUpdate: (patch: Partial<OnboardingState>) => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.inputHeader}><View style={styles.iconCircle}><MaterialCommunityIcons name="account-heart-outline" size={20} color={BRAND.colors.primary} /></View><View><Text style={styles.cardTitle}>{rtl ? 'پروفایلت' : 'Your profile'}</Text><Text style={styles.cardHint}>{rtl ? 'فقط برای شخصی‌سازی تجربه' : 'Just enough to personalize the experience'}</Text></View></View>
      <LabeledInput rtl={rtl} label={rtl ? 'نام' : 'Your name'} value={state.fullName} onChangeText={(value) => onUpdate({ fullName: value })} placeholder={rtl ? 'مثلاً رامین' : 'e.g. Alex'} />
      <Text style={[styles.fieldLabel, rtl && styles.rtlText]}>{rtl ? 'جنسیت' : 'Gender'}</Text>
      <View style={styles.chipGrid}>
        <MiniChoice selected={state.gender === 'male'} icon="human-male" label={rtl ? 'مرد' : 'Male'} onPress={() => onUpdate({ gender: 'male' })} />
        <MiniChoice selected={state.gender === 'female'} icon="human-female" label={rtl ? 'زن' : 'Female'} onPress={() => onUpdate({ gender: 'female' })} />
        <MiniChoice selected={state.gender === 'other'} icon="account-question-outline" label={rtl ? 'دیگر' : 'Other'} onPress={() => onUpdate({ gender: 'other' })} />
        <MiniChoice selected={state.gender === 'prefer_not_to_say'} icon="eye-off-outline" label={rtl ? 'ترجیح می‌دهم نگویم' : 'Prefer not to say'} onPress={() => onUpdate({ gender: 'prefer_not_to_say' })} />
      </View>
      <LabeledInput rtl={rtl} label={rtl ? 'تاریخ تولد' : 'Birth date'} value={state.birthDate} onChangeText={(value) => onUpdate({ birthDate: value })} placeholder={rtl ? 'مثلاً 1370/05/12' : 'e.g. 1992-08-03'} keyboardType="numbers-and-punctuation" />
      <View style={styles.twoColumns}>
        <LabeledInput rtl={rtl} label={rtl ? 'قد · سانتی‌متر' : 'Height · cm'} value={state.heightCm} onChangeText={(value) => onUpdate({ heightCm: value.replace(/[^0-9.]/g, '') })} placeholder="175" keyboardType="numeric" />
        <LabeledInput rtl={rtl} label={rtl ? 'وزن · کیلو' : 'Weight · kg'} value={state.weightKg} onChangeText={(value) => onUpdate({ weightKg: value.replace(/[^0-9.]/g, '') })} placeholder="75" keyboardType="numeric" />
      </View>
      {bmi ? <View style={styles.bmiCard}><MaterialCommunityIcons name="chart-donut" size={22} color={BRAND.colors.primary} /><View style={styles.flex}><Text style={[styles.bmiLabel, rtl && styles.rtlText]}>{rtl ? 'شاخص توده بدنی تقریبی' : 'Estimated BMI'}</Text><Text style={[styles.bmiValue, rtl && styles.rtlText]}>{bmi}</Text></View><Text style={styles.bmiNote}>{rtl ? 'قابل تنظیم' : 'Personalized'}</Text></View> : null}
    </View>
  );
}

function LabeledInput({ rtl, label, value, onChangeText, placeholder, keyboardType }: { rtl: boolean; label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'numeric' | 'numbers-and-punctuation' }) {
  return <View style={styles.inputBlock}><Text style={[styles.fieldLabel, rtl && styles.rtlText]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={BRAND.colors.muted} keyboardType={keyboardType} style={[styles.textInput, rtl && styles.rtlText]} selectionColor={BRAND.colors.primary} /></View>;
}

function MiniChoice({ selected, icon, label, onPress }: { selected: boolean; icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.miniChoice, selected && styles.miniChoiceSelected]}><MaterialCommunityIcons name={icon} size={18} color={selected ? BRAND.colors.primary : BRAND.colors.muted} /><Text style={[styles.miniChoiceText, selected && styles.miniChoiceTextSelected]}>{label}</Text>{selected ? <MaterialCommunityIcons name="check-circle" size={17} color={BRAND.colors.primary} /> : null}</Pressable>;
}

function ChoiceCard({ choices, value, onSelect, rtl }: { choices: Choice[]; value: string; onSelect: (value: string) => void; rtl: boolean }) {
  return <View style={styles.card}>{choices.map((choice) => <Pressable key={choice.key} onPress={() => onSelect(choice.key)} style={({ pressed }) => [styles.choice, value === choice.key && styles.choiceSelected, pressed && styles.choicePressed]}><View style={[styles.choiceIcon, value === choice.key && styles.choiceIconSelected]}><MaterialCommunityIcons name={choice.icon} size={22} color={value === choice.key ? BRAND.colors.white : BRAND.colors.primary} /></View><View style={styles.flex}><Text style={[styles.choiceTitle, rtl && styles.rtlText]}>{choice.label}</Text>{choice.hint ? <Text style={[styles.choiceHint, rtl && styles.rtlText]}>{choice.hint}</Text> : null}</View><View style={[styles.radio, value === choice.key && styles.radioSelected]}>{value === choice.key ? <View style={styles.radioDot} /> : null}</View></Pressable>)}</View>;
}

function FinalSetupCard({ rtl, state, onUpdate, detectedCountry }: { rtl: boolean; state: OnboardingState; onUpdate: (patch: Partial<OnboardingState>) => void; detectedCountry: string }) {
  return (
    <View style={styles.card}>
      <View style={styles.inputHeader}><View style={styles.iconCircle}><MaterialCommunityIcons name="calendar-clock-outline" size={21} color={BRAND.colors.primary} /></View><View><Text style={styles.cardTitle}>{rtl ? 'ریتم تمرین' : 'Your training rhythm'}</Text><Text style={styles.cardHint}>{rtl ? 'واقعی انتخاب کن، نه ایده‌آل' : 'Choose what is realistic, not ideal'}</Text></View></View>
      <Text style={[styles.fieldLabel, rtl && styles.rtlText]}>{rtl ? 'چند جلسه در هفته؟' : 'How often can you train?'}</Text>
      <View style={styles.frequencyRow}>
        {[2, 3, 4, 5, 6].map((value) => <Pressable key={value} onPress={() => onUpdate({ trainingDaysPerWeek: value } as Partial<OnboardingState>)} style={[styles.frequency, (state as OnboardingState & { trainingDaysPerWeek?: number }).trainingDaysPerWeek === value && styles.frequencySelected]}><Text style={[styles.frequencyNumber, (state as OnboardingState & { trainingDaysPerWeek?: number }).trainingDaysPerWeek === value && styles.frequencyTextSelected]}>{value}</Text><Text style={[styles.frequencyLabel, (state as OnboardingState & { trainingDaysPerWeek?: number }).trainingDaysPerWeek === value && styles.frequencyTextSelected]}>{rtl ? 'روز' : 'days'}</Text></Pressable>)}
      </View>
      <Text style={[styles.fieldLabel, styles.topField, rtl && styles.rtlText]}>{rtl ? 'هر جلسه چقدر؟' : 'How long per session?'}</Text>
      <View style={styles.frequencyRow}>
        {[20, 30, 45, 60].map((minutes) => <Pressable key={minutes} onPress={() => onUpdate({ sessionMinutes: minutes as OnboardingState['sessionMinutes'] })} style={[styles.timeChoice, state.sessionMinutes === minutes && styles.timeChoiceSelected]}><Text style={[styles.timeChoiceText, state.sessionMinutes === minutes && styles.timeChoiceTextSelected]}>{minutes}</Text><Text style={[styles.timeSuffix, state.sessionMinutes === minutes && styles.timeChoiceTextSelected]}>min</Text></Pressable>)}
      </View>
      <Text style={[styles.fieldLabel, styles.topField, rtl && styles.rtlText]}>{rtl ? 'تجهیزات' : 'Equipment'}</Text>
      <View style={styles.chipGrid}>
        <MiniChoice selected={state.equipment === 'none'} icon="gesture-tap-hold" label={rtl ? 'بدون تجهیزات' : 'None'} onPress={() => onUpdate({ equipment: 'none' })} />
        <MiniChoice selected={state.equipment === 'home'} icon="home-outline" label={rtl ? 'خانه' : 'Home'} onPress={() => onUpdate({ equipment: 'home' })} />
        <MiniChoice selected={state.equipment === 'gym'} icon="dumbbell" label={rtl ? 'باشگاه' : 'Gym'} onPress={() => onUpdate({ equipment: 'gym' })} />
      </View>
      {detectedCountry ? <View style={styles.detected}><MaterialCommunityIcons name="map-marker-check-outline" size={18} color={BRAND.colors.primary} /><Text style={[styles.detectedText, rtl && styles.rtlText]}>{rtl ? `منطقه برای شخصی‌سازی غذا: ${detectedCountry}` : `Location detected for smarter food suggestions: ${detectedCountry}`}</Text></View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.colors.canvas },
  flex: { flex: 1 },
  shell: { flex: 1, paddingHorizontal: 22 },
  glowA: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#EEE7FF', top: -100, right: -90, opacity: 0.8 },
  glowB: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: '#E6F9FF', bottom: 80, left: -110, opacity: 0.7 },
  header: { paddingTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressPill: { width: 120, alignItems: 'flex-end' },
  progressText: { color: BRAND.colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginBottom: 5 },
  progressRail: { width: 120, height: 5, borderRadius: 5, backgroundColor: BRAND.colors.border, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 5, backgroundColor: BRAND.colors.primary },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12, alignSelf: 'flex-start', paddingVertical: 4 },
  backText: { color: BRAND.colors.inkSoft, fontSize: 13, fontWeight: '800' },
  content: { flex: 1 },
  scrollContent: { paddingTop: 12, paddingBottom: 20 },
  eyebrow: { color: BRAND.colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, marginBottom: 8 },
  heroTitle: { maxWidth: 360, color: BRAND.colors.ink, fontSize: 31, lineHeight: 38, fontWeight: '900', letterSpacing: -0.5 },
  heroSubtitle: { maxWidth: 390, color: BRAND.colors.muted, fontSize: 14, lineHeight: 22, marginTop: 9, marginBottom: 18 },
  rtlText: { textAlign: 'right' },
  welcomeCard: { minHeight: 410, backgroundColor: BRAND.colors.startup, borderRadius: 30, padding: 22, overflow: 'hidden', position: 'relative', justifyContent: 'space-between' },
  orbitOne: { position: 'absolute', width: 250, height: 250, borderRadius: 125, borderWidth: 1, borderColor: '#2B3564', top: -60, right: -60 },
  orbitTwo: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: '#24305D', top: -25, right: -25 },
  assistantOrb: { width: 82, height: 82, borderRadius: 28, backgroundColor: BRAND.colors.primaryStrong, alignItems: 'center', justifyContent: 'center', shadowColor: '#7C3AED', shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  welcomeTextWrap: { marginTop: 24, maxWidth: 320 },
  miniBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#1B2750', marginBottom: 12 },
  miniBadgeText: { color: BRAND.colors.startupMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  welcomeHeadline: { color: BRAND.colors.white, fontSize: 27, lineHeight: 33, fontWeight: '900' },
  welcomeBody: { color: BRAND.colors.startupMuted, fontSize: 14, lineHeight: 21, marginTop: 10 },
  featureRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  featurePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 14, backgroundColor: '#131E42' },
  featureText: { color: '#E7E9F5', fontSize: 11, fontWeight: '800' },
  card: { backgroundColor: BRAND.colors.surface, borderRadius: BRAND.radius.card, borderWidth: 1, borderColor: BRAND.colors.border, padding: 16, shadowColor: '#111827', shadowOpacity: 0.05, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  inputHeader: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 17 },
  iconCircle: { width: 42, height: 42, borderRadius: 15, backgroundColor: BRAND.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: BRAND.colors.ink, fontSize: 16, fontWeight: '900' },
  cardHint: { color: BRAND.colors.muted, fontSize: 11, marginTop: 2 },
  inputBlock: { marginBottom: 13 },
  fieldLabel: { color: BRAND.colors.inkSoft, fontSize: 11, fontWeight: '900', marginBottom: 7 },
  textInput: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: BRAND.colors.border, backgroundColor: '#FCFCFD', paddingHorizontal: 14, color: BRAND.colors.ink, fontSize: 14, fontWeight: '700' },
  chipGrid: { gap: 8 },
  miniChoice: { minHeight: 46, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: BRAND.colors.border, backgroundColor: BRAND.colors.surface, flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniChoiceSelected: { borderColor: '#CBB9FF', backgroundColor: BRAND.colors.primarySoft },
  miniChoiceText: { color: BRAND.colors.inkSoft, fontSize: 12, fontWeight: '800', flex: 1 },
  miniChoiceTextSelected: { color: BRAND.colors.primary },
  twoColumns: { flexDirection: 'row', gap: 10 },
  twoColumns: { flexDirection: 'row', gap: 10 },
  bmiCard: { marginTop: 3, padding: 13, borderRadius: 16, backgroundColor: '#F8F7FF', flexDirection: 'row', alignItems: 'center', gap: 10 },
  bmiLabel: { color: BRAND.colors.muted, fontSize: 10, fontWeight: '700' },
  bmiValue: { color: BRAND.colors.ink, fontSize: 20, fontWeight: '900', marginTop: 1 },
  bmiNote: { color: BRAND.colors.primary, fontSize: 10, fontWeight: '900' },
  choice: { minHeight: 76, borderRadius: 18, borderWidth: 1, borderColor: BRAND.colors.border, paddingHorizontal: 12, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: BRAND.colors.surface },
  choiceSelected: { backgroundColor: BRAND.colors.primarySoft, borderColor: '#CBB9FF', borderWidth: 1.5 },
  choicePressed: { transform: [{ scale: 0.99 }] },
  choiceIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F4F1FF', alignItems: 'center', justifyContent: 'center' },
  choiceIconSelected: { backgroundColor: BRAND.colors.primary },
  choiceTitle: { color: BRAND.colors.ink, fontSize: 14, fontWeight: '900' },
  choiceHint: { color: BRAND.colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 1.5, borderColor: '#C9CDD6', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: BRAND.colors.primary },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: BRAND.colors.primary },
  topField: { marginTop: 18 },
  frequencyRow: { flexDirection: 'row', gap: 8 },
  frequency: { flex: 1, minHeight: 66, borderRadius: 14, borderWidth: 1, borderColor: BRAND.colors.border, alignItems: 'center', justifyContent: 'center' },
  frequencySelected: { borderColor: '#CBB9FF', backgroundColor: BRAND.colors.primarySoft },
  frequencyNumber: { color: BRAND.colors.ink, fontSize: 19, fontWeight: '900' },
  frequencyLabel: { color: BRAND.colors.muted, fontSize: 9, fontWeight: '800', marginTop: 2 },
  frequencyTextSelected: { color: BRAND.colors.primary },
  timeChoice: { flex: 1, minHeight: 58, borderRadius: 14, borderWidth: 1, borderColor: BRAND.colors.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 3 },
  timeChoiceSelected: { borderColor: '#CBB9FF', backgroundColor: BRAND.colors.primarySoft },
  timeChoiceText: { color: BRAND.colors.ink, fontSize: 16, fontWeight: '900' },
  timeSuffix: { color: BRAND.colors.muted, fontSize: 9, fontWeight: '800' },
  timeChoiceTextSelected: { color: BRAND.colors.primary },
  detected: { marginTop: 17, padding: 12, borderRadius: 15, backgroundColor: '#F5FBFD', flexDirection: 'row', alignItems: 'center', gap: 8 },
  detectedText: { color: BRAND.colors.inkSoft, fontSize: 11, fontWeight: '700', flex: 1, lineHeight: 17 },
  validation: { color: BRAND.colors.primary, fontSize: 11, lineHeight: 17, marginTop: 10 },
  bottomBar: { paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 6 : 10, backgroundColor: 'transparent' },
  privacyNote: { color: BRAND.colors.muted, fontSize: 10, lineHeight: 16, marginBottom: 10 },
  primaryButton: { minHeight: 58, borderRadius: 19, paddingHorizontal: 18, backgroundColor: BRAND.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: BRAND.colors.primary, shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  primaryButtonText: { color: BRAND.colors.white, fontSize: 15, fontWeight: '900' },
  primaryPressed: { opacity: 0.86, transform: [{ translateY: 1 }] },
  primaryDisabled: { opacity: 0.45 },
});
