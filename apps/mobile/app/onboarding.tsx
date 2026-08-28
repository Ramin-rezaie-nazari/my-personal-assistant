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
import { DEFAULT_ONBOARDING, OnboardingState, calculateBMI, setOnboardingState } from '../lib/onboarding';
import { BRAND } from '../lib/branding';
import { BrandWordmark } from '../components/BrandWordmark';

const QUESTION_COUNT = 5;
const LAST_SCREEN = 7;
type PermissionKey = keyof OnboardingState['permissions'];
type IconName = keyof typeof MaterialCommunityIcons.glyphMap;
type Choice = { key: string; label: string; icon: IconName; hint?: string };

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

  useEffect(() => { void getStoredLocale().then((value) => value && setLocale(value)); }, []);
  useEffect(() => {
    fade.setValue(0); slide.setValue(18);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 330, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, screen, slide]);

  const copy = useMemo(() => getCopy(rtl, screen), [rtl, screen]);
  const bmi = calculateBMI(Number(state.heightCm), Number(state.weightKg));
  const update = (patch: Partial<OnboardingState>) => setState((current) => ({ ...current, ...patch }));
  const updatePermission = (key: PermissionKey, value: boolean) => setState((current) => ({ ...current, permissions: { ...current.permissions, [key]: value } }));

  const profileComplete = state.fullName.trim().length >= 2 && !!state.gender && !!state.birthDate && Number(state.heightCm) > 80 && Number(state.weightKg) > 25;
  const stepComplete = screen === 0 || screen === 1 || screen === 2 ? (screen !== 2 || profileComplete) : true;

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
            if (country) { setDetectedCountry(country); update({ detectedCountry: country }); }
          } catch {}
        }
      } else if (key === 'notifications') {
        const result = await Notifications.requestPermissionsAsync();
        updatePermission(key, Boolean(result.granted));
      } else if (key === 'camera') {
        const result = await Camera.requestCameraPermissionsAsync();
        updatePermission(key, result.status === 'granted');
      } else {
        const result = await Camera.requestMicrophonePermissionsAsync();
        updatePermission(key, result.status === 'granted');
      }
    } catch {
      updatePermission(key, false);
    } finally { setPermissionBusy(null); }
  };

  const finish = async () => {
    if (!profileComplete) return;
    try {
      setBusy(true);
      await setOnboardingState({ ...state, completed: true });
      router.replace('/');
    } finally { setBusy(false); }
  };

  const next = () => {
    if (busy || !stepComplete) return;
    if (screen === LAST_SCREEN) { void finish(); return; }
    setScreen((value) => value + 1);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.shell}>
          <View style={styles.header}>
            <BrandWordmark compact />
            <View style={styles.progressWrap}>
              {screen >= 2 && <Text style={styles.progressText}>{Math.min(screen - 2, QUESTION_COUNT)} / {QUESTION_COUNT}</Text>}
              <View style={styles.progressRail}><View style={[styles.progressFill, { width: `${screen < 2 ? 12 : ((screen - 1) / 6) * 100}%` }]} /></View>
            </View>
          </View>

          {screen > 0 && (
            <Pressable onPress={() => setScreen((value) => Math.max(0, value - 1))} style={styles.backButton}>
              <MaterialCommunityIcons name={rtl ? 'arrow-right' : 'arrow-left'} size={19} color={BRAND.colors.inkSoft} />
              <Text style={styles.backText}>{rtl ? 'برگشت' : 'Back'}</Text>
            </Pressable>
          )}

          <Animated.View style={[styles.content, { opacity: fade, transform: [{ translateY: slide }] }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={[styles.eyebrow, rtl && styles.rtl]}>{copy.eyebrow}</Text>
              <Text style={[styles.title, rtl && styles.rtl]}>{copy.title}</Text>
              <Text style={[styles.subtitle, rtl && styles.rtl]}>{copy.subtitle}</Text>

              {screen === 0 && <WelcomeCard rtl={rtl} />}
              {screen === 1 && <PermissionsCard rtl={rtl} state={state} permissionBusy={permissionBusy} requestPermission={requestPermission} />}
              {screen === 2 && <ProfileCard rtl={rtl} state={state} bmi={bmi} onUpdate={update} />}
              {screen === 3 && <ChoiceCard rtl={rtl} choices={goalChoices(rtl)} value={state.goal} onSelect={(value) => update({ goal: value as OnboardingState['goal'] })} />}
              {screen === 4 && <ChoiceCard rtl={rtl} choices={levelChoices(rtl)} value={state.fitnessLevel} onSelect={(value) => update({ fitnessLevel: value as OnboardingState['fitnessLevel'] })} />}
              {screen === 5 && <ChoiceCard rtl={rtl} choices={dietChoices(rtl)} value={state.diet} onSelect={(value) => update({ diet: value as OnboardingState['diet'] })} />}
              {screen === 6 && <ChoiceCard rtl={rtl} choices={placeChoices(rtl)} value={state.workoutPlace} onSelect={(value) => update({ workoutPlace: value as OnboardingState['workoutPlace'] })} />}
              {screen === 7 && <RhythmCard rtl={rtl} state={state} onUpdate={update} detectedCountry={detectedCountry || state.detectedCountry} />}

              {screen === 2 && !profileComplete && <Text style={[styles.validation, rtl && styles.rtl]}>{rtl ? 'نام، جنسیت، تاریخ تولد، قد و وزن را کامل کن.' : 'Complete your name, gender, birth date, height and weight to continue.'}</Text>}
            </ScrollView>

            <View style={styles.bottomBar}>
              {screen === 0 && <Text style={[styles.privacyNote, rtl && styles.rtl]}><MaterialCommunityIcons name="shield-check-outline" size={14} color={BRAND.colors.primary} />{' '}{rtl ? 'هر دسترسی انتخابی است و می‌توانی بعداً تغییرش بدهی.' : 'Every permission is optional and can be changed later.'}</Text>}
              {screen === 1 && <Text style={[styles.privacyNote, rtl && styles.rtl]}>{rtl ? 'برای ادامه لازم نیست هیچ‌کدام را فعال کنی.' : 'Nothing here is required to continue.'}</Text>}
              <Pressable disabled={busy || !stepComplete} onPress={next} style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed, (!stepComplete || busy) && styles.primaryDisabled]}>
                {busy ? <ActivityIndicator color={BRAND.colors.white} /> : <><Text style={styles.primaryText}>{copy.cta}</Text><MaterialCommunityIcons name={rtl ? 'arrow-left' : 'arrow-right'} size={22} color={BRAND.colors.white} /></>}
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
    ['WELCOME', 'Meet the assistant that gets to know you.', 'A beautiful little setup now. Then your goals, food and routine work together every day.', 'Let’s build it'],
    ['OPTIONAL SETUP', 'Give your assistant a few senses.', 'Location, reminders, camera and voice unlock helpful features. You stay in control.', 'Continue'],
    ['YOUR PROFILE', 'Start with you.', 'A few details make your numbers, suggestions and routines feel genuinely personal.', 'Continue'],
    ['01 · YOUR GOAL', 'What would feel like a win?', 'Pick the outcome that matters most right now.', 'That’s me'],
    ['02 · YOUR LEVEL', 'How should I pace you?', 'No judgment. We’ll meet you where you are and build from there.', 'Sounds right'],
    ['03 · YOUR FOOD', 'What should meals feel like?', 'Your preferences shape recipes, calories, protein targets and shopping ideas.', 'Match my meals'],
    ['04 · YOUR SPACE', 'Where do you like to move?', 'We’ll keep your real life in mind instead of designing a perfect-on-paper plan.', 'That works'],
    ['05 · YOUR RHYTHM', 'Now make it fit your week.', 'Choose a rhythm you can actually repeat. Consistency wins.', 'Create my plan'],
  ];
  const fa = [
    ['شروع', 'با دستیاری آشنا شو که تو را می‌شناسد.', 'یک شروع کوتاه و زیبا. بعد هدف‌ها، غذا و برنامه روزانه‌ات هر روز کنار هم کار می‌کنند.', 'بزن بریم'],
    ['تنظیم اختیاری', 'چند حس به دستیار بده.', 'موقعیت مکانی، یادآورها، دوربین و صدا قابلیت‌های بیشتری باز می‌کنند. کنترلش کاملاً دست توست.', 'ادامه'],
    ['پروفایل تو', 'از خودت شروع کنیم.', 'چند اطلاعات ساده باعث می‌شود عددها، پیشنهادها و برنامه‌ها واقعاً شخصی شوند.', 'ادامه'],
    ['۰۱ · هدف تو', 'چه چیزی برایت حس برد دارد؟', 'مهم‌ترین نتیجه‌ای را که الان می‌خواهی انتخاب کن.', 'این منم'],
    ['۰۲ · سطح تو', 'با چه سرعتی همراهت باشم؟', 'اینجا قضاوتی نیست. از همین جایی که هستی شروع می‌کنیم.', 'درسته'],
    ['۰۳ · غذای تو', 'دوست داری وعده‌هایت چه حسی داشته باشند؟', 'ترجیحاتت روی رسپی، کالری، پروتئین و لیست خرید اثر می‌گذارد.', 'غذای من'],
    ['۰۴ · فضای تو', 'کجا بیشتر دوست داری تمرین کنی؟', 'برنامه را با زندگی واقعی‌ات هماهنگ می‌کنیم، نه یک زندگی ایده‌آل روی کاغذ.', 'همینه'],
    ['۰۵ · ریتم تو', 'حالا جا بدهش در هفته‌ات.', 'ریتمی را انتخاب کن که واقعاً بتوانی تکرارش کنی. استمرار برنده است.', 'برنامه‌ام را بساز'],
  ];
  const row = (rtl ? fa : en)[screen];
  return { eyebrow: row[0], title: row[1], subtitle: row[2], cta: row[3] };
}

function WelcomeCard({ rtl }: { rtl: boolean }) {
  return <View style={styles.welcomeCard}>
    <View style={styles.welcomeHalo} /><View style={styles.welcomeHaloSmall} />
    <View style={styles.sparkleBox}><MaterialCommunityIcons name="sparkles" size={36} color={BRAND.colors.white} /></View>
    <View style={styles.welcomeCopy}><View style={styles.badge}><Text style={styles.badgeText}>{rtl ? 'کمتر از ۲ دقیقه' : 'UNDER 2 MINUTES'}</Text></View><Text style={[styles.welcomeTitle, rtl && styles.rtl]}>{rtl ? 'هر چیزی که لازم داری، یک‌جا.' : 'Everything useful. In one place.'}</Text><Text style={[styles.welcomeBody, rtl && styles.rtl]}>{rtl ? 'بدون فرم‌های خسته‌کننده. فقط چند انتخاب هوشمند تا دستیارت بفهمد چه چیزی برایت مهم است.' : 'No boring forms. Just a few thoughtful choices so your assistant understands what matters to you.'}</Text></View>
    <View style={styles.featureRow}><FeaturePill icon="food-apple" text={rtl ? 'غذا' : 'Food'} /><FeaturePill icon="dumbbell" text={rtl ? 'تمرین' : 'Training'} /><FeaturePill icon="calendar-check" text={rtl ? 'روزت' : 'Your day'} /></View>
  </View>;
}

function FeaturePill({ icon, text }: { icon: IconName; text: string }) { return <View style={styles.featurePill}><MaterialCommunityIcons name={icon} size={15} color={BRAND.colors.violet} /><Text style={styles.featureText}>{text}</Text></View>; }

const permissionItems: { key: PermissionKey; icon: IconName; en: string; fa: string; enHint: string; faHint: string }[] = [
  { key: 'notifications', icon: 'bell-outline', en: 'Smart reminders', fa: 'یادآورهای هوشمند', enHint: 'Meals, habits and routines at the right time.', faHint: 'غذا، عادت‌ها و برنامه‌ها در زمان درست.' },
  { key: 'location', icon: 'map-marker-outline', en: 'Local context', fa: 'شخصی‌سازی محلی', enHint: 'Use your region for better food suggestions.', faHint: 'برای پیشنهادهای غذایی بهتر از منطقه‌ات استفاده می‌کنیم.' },
  { key: 'microphone', icon: 'microphone-outline', en: 'Voice assistant', fa: 'دستیار صوتی', enHint: 'Talk naturally when voice features are available.', faHint: 'وقتی قابلیت صوتی فعال باشد، طبیعی صحبت کن.' },
  { key: 'camera', icon: 'camera-outline', en: 'Movement coaching', fa: 'مربی حرکات', enHint: 'Camera-based movement analysis when you choose it.', faHint: 'تحلیل حرکات با دوربین، فقط وقتی خودت انتخاب کنی.' },
];

function PermissionsCard({ rtl, state, permissionBusy, requestPermission }: { rtl: boolean; state: OnboardingState; permissionBusy: PermissionKey | null; requestPermission: (key: PermissionKey) => Promise<void> }) {
  return <View style={styles.card}>{permissionItems.map((item) => { const granted = state.permissions[item.key]; return <Pressable key={item.key} onPress={() => void requestPermission(item.key)} style={[styles.permissionRow, granted && styles.permissionGranted]}><View style={styles.permissionIcon}><MaterialCommunityIcons name={item.icon} size={21} color={BRAND.colors.primary} /></View><View style={styles.flex}><Text style={[styles.permissionTitle, rtl && styles.rtl]}>{rtl ? item.fa : item.en}</Text><Text style={[styles.permissionHint, rtl && styles.rtl]}>{rtl ? item.faHint : item.enHint}</Text></View>{permissionBusy === item.key ? <ActivityIndicator color={BRAND.colors.primary} /> : <View style={[styles.permissionDot, granted && styles.permissionDotGranted]}>{granted ? <MaterialCommunityIcons name="check" size={13} color={BRAND.colors.white} /> : null}</View>}</Pressable>; })}</View>;
}

function ProfileCard({ rtl, state, bmi, onUpdate }: { rtl: boolean; state: OnboardingState; bmi: number | null; onUpdate: (patch: Partial<OnboardingState>) => void }) {
  return <View style={styles.card}><View style={styles.cardTop}><View style={styles.iconCircle}><MaterialCommunityIcons name="account-heart-outline" size={21} color={BRAND.colors.primary} /></View><View><Text style={styles.cardTitle}>{rtl ? 'پروفایل تو' : 'Your profile'}</Text><Text style={styles.cardHint}>{rtl ? 'فقط برای شخصی‌سازی تجربه' : 'Just enough to personalize the experience'}</Text></View></View><LabeledInput rtl={rtl} label={rtl ? 'نام' : 'Your name'} value={state.fullName} onChangeText={(value) => onUpdate({ fullName: value })} placeholder={rtl ? 'مثلاً رامین' : 'e.g. Alex'} /><Text style={[styles.fieldLabel, rtl && styles.rtl]}>{rtl ? 'جنسیت' : 'Gender'}</Text><View style={styles.genderGrid}><GenderChip selected={state.gender === 'male'} icon="human-male" label={rtl ? 'مرد' : 'Male'} onPress={() => onUpdate({ gender: 'male' })} /><GenderChip selected={state.gender === 'female'} icon="human-female" label={rtl ? 'زن' : 'Female'} onPress={() => onUpdate({ gender: 'female' })} /><GenderChip selected={state.gender === 'other'} icon="account-question-outline" label={rtl ? 'دیگر' : 'Other'} onPress={() => onUpdate({ gender: 'other' })} /><GenderChip selected={state.gender === 'prefer_not_to_say'} icon="eye-off-outline" label={rtl ? 'ترجیح می‌دهم نگویم' : 'Prefer not to say'} onPress={() => onUpdate({ gender: 'prefer_not_to_say' })} /></View><LabeledInput rtl={rtl} label={rtl ? 'تاریخ تولد' : 'Birth date'} value={state.birthDate} onChangeText={(value) => onUpdate({ birthDate: value })} placeholder={rtl ? 'مثلاً ۱۳۷۰/۰۵/۱۲' : 'e.g. 1992-08-03'} keyboardType="numbers-and-punctuation" /><View style={styles.twoColumns}><View style={styles.flex}><LabeledInput rtl={rtl} label={rtl ? 'قد · سانتی‌متر' : 'Height · cm'} value={state.heightCm} onChangeText={(value) => onUpdate({ heightCm: value.replace(/[^0-9.]/g, '') })} placeholder="175" keyboardType="numeric" /></View><View style={styles.flex}><LabeledInput rtl={rtl} label={rtl ? 'وزن · کیلو' : 'Weight · kg'} value={state.weightKg} onChangeText={(value) => onUpdate({ weightKg: value.replace(/[^0-9.]/g, '') })} placeholder="75" keyboardType="numeric" /></View></View>{bmi ? <View style={styles.bmi}><MaterialCommunityIcons name="chart-donut" size={21} color={BRAND.colors.primary} /><View style={styles.flex}><Text style={[styles.bmiLabel, rtl && styles.rtl]}>{rtl ? 'BMI تقریبی' : 'Estimated BMI'}</Text><Text style={[styles.bmiValue, rtl && styles.rtl]}>{bmi}</Text></View><Text style={styles.bmiTag}>{rtl ? 'قابل تنظیم' : 'Personalized'}</Text></View> : null}</View>;
}

function LabeledInput({ rtl, label, value, onChangeText, placeholder, keyboardType }: { rtl: boolean; label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'numeric' | 'numbers-and-punctuation' }) { return <View style={styles.inputBlock}><Text style={[styles.fieldLabel, rtl && styles.rtl]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9CA3AF" keyboardType={keyboardType} selectionColor={BRAND.colors.primary} style={[styles.input, rtl && styles.rtl]} /></View>; }

function GenderChip({ selected, icon, label, onPress }: { selected: boolean; icon: IconName; label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.genderChip, selected && styles.genderSelected]}><MaterialCommunityIcons name={icon} size={17} color={selected ? BRAND.colors.primary : BRAND.colors.muted} /><Text style={[styles.genderText, selected && styles.genderTextSelected]}>{label}</Text></Pressable>; }

function ChoiceCard({ rtl, choices, value, onSelect }: { rtl: boolean; choices: Choice[]; value: string; onSelect: (value: string) => void }) { return <View style={styles.card}>{choices.map((choice) => { const selected = value === choice.key; return <Pressable key={choice.key} onPress={() => onSelect(choice.key)} style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && styles.choicePressed]}><View style={[styles.choiceIcon, selected && styles.choiceIconSelected]}><MaterialCommunityIcons name={choice.icon} size={22} color={selected ? BRAND.colors.white : BRAND.colors.primary} /></View><View style={styles.flex}><Text style={[styles.choiceTitle, rtl && styles.rtl]}>{choice.label}</Text>{choice.hint && <Text style={[styles.choiceHint, rtl && styles.rtl]}>{choice.hint}</Text>}</View><View style={[styles.radio, selected && styles.radioSelected]}>{selected && <View style={styles.radioDot} />}</View></Pressable>; })}</View>; }

function RhythmCard({ rtl, state, onUpdate, detectedCountry }: { rtl: boolean; state: OnboardingState; onUpdate: (patch: Partial<OnboardingState>) => void; detectedCountry: string }) {
  return <View style={styles.card}><View style={styles.cardTop}><View style={styles.iconCircle}><MaterialCommunityIcons name="calendar-clock-outline" size={21} color={BRAND.colors.primary} /></View><View><Text style={styles.cardTitle}>{rtl ? 'ریتم تمرین' : 'Your training rhythm'}</Text><Text style={styles.cardHint}>{rtl ? 'واقعی انتخاب کن، نه ایده‌آل' : 'Choose realistic, not ideal'}</Text></View></View><Text style={[styles.fieldLabel, rtl && styles.rtl]}>{rtl ? 'چند روز در هفته؟' : 'How many days per week?'}</Text><View style={styles.numberRow}>{([2,3,4,5,6] as const).map((value) => { const selected = state.trainingDaysPerWeek === value; return <Pressable key={value} onPress={() => onUpdate({ trainingDaysPerWeek: value })} style={[styles.dayChoice, selected && styles.choiceSelected]}><Text style={[styles.dayNumber, selected && styles.selectedText]}>{value}</Text><Text style={[styles.dayLabel, selected && styles.selectedText]}>{rtl ? 'روز' : 'days'}</Text></Pressable>; })}</View><Text style={[styles.fieldLabel, styles.topField, rtl && styles.rtl]}>{rtl ? 'مدت هر جلسه؟' : 'Session length?'}</Text><View style={styles.numberRow}>{([20,30,45,60] as const).map((value) => { const selected = state.sessionMinutes === value; return <Pressable key={value} onPress={() => onUpdate({ sessionMinutes: value })} style={[styles.timeChoice, selected && styles.choiceSelected]}><Text style={[styles.timeNumber, selected && styles.selectedText]}>{value}</Text><Text style={[styles.dayLabel, selected && styles.selectedText]}>min</Text></Pressable>; })}</View><Text style={[styles.fieldLabel, styles.topField, rtl && styles.rtl]}>{rtl ? 'محل تمرین؟' : 'Training setup?'}</Text><View style={styles.setupRow}><MiniSetup selected={state.equipment === 'none'} icon="gesture-tap-hold" label={rtl ? 'بدون تجهیزات' : 'None'} onPress={() => onUpdate({ equipment: 'none' })} /><MiniSetup selected={state.equipment === 'home'} icon="home-outline" label={rtl ? 'خانه' : 'Home'} onPress={() => onUpdate({ equipment: 'home' })} /><MiniSetup selected={state.equipment === 'gym'} icon="dumbbell" label={rtl ? 'باشگاه' : 'Gym'} onPress={() => onUpdate({ equipment: 'gym' })} /></View>{detectedCountry ? <View style={styles.detected}><MaterialCommunityIcons name="map-marker-check-outline" size={18} color={BRAND.colors.primary} /><Text style={[styles.detectedText, rtl && styles.rtl]}>{rtl ? `منطقه شناسایی‌شده: ${detectedCountry}` : `Location detected: ${detectedCountry}`}</Text></View> : null}</View>; }

function MiniSetup({ selected, icon, label, onPress }: { selected: boolean; icon: IconName; label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.setupChoice, selected && styles.genderSelected]}><MaterialCommunityIcons name={icon} size={18} color={selected ? BRAND.colors.primary : BRAND.colors.muted} /><Text style={[styles.setupText, selected && styles.genderTextSelected]}>{label}</Text></Pressable>; }

const goalChoices = (rtl: boolean): Choice[] => [{ key:'fat_loss',label:rtl?'کاهش چربی':'Lose body fat',icon:'fire',hint:rtl?'سبک‌تر و پرانرژی‌تر':'Feel lighter & more energetic' },{ key:'body_sculpt',label:rtl?'فرم بهتر بدن':'Shape my body',icon:'human-handsup',hint:rtl?'عضله‌سازی و فرم‌دهی':'Tone up with balance' },{ key:'strength',label:rtl?'قوی‌تر شدن':'Get stronger',icon:'dumbbell',hint:rtl?'قدرت و عملکرد بیشتر':'Build strength & performance' },{ key:'general_fitness',label:rtl?'سلامت و تناسب عمومی':'Feel fitter',icon:'heart-pulse',hint:rtl?'یک روال سالم و پایدار':'A healthy routine that sticks' }];
const levelChoices = (rtl: boolean): Choice[] => [{ key:'beginner',label:rtl?'تازه‌کارم':'I’m just starting',icon:'sprout',hint:rtl?'آرام و قدم‌به‌قدم':'Gentle, guided, no pressure' },{ key:'foundation',label:rtl?'یکم تجربه دارم':'I have some experience',icon:'walk',hint:rtl?'ساختن پایه‌های محکم':'Build a strong foundation' },{ key:'intermediate',label:rtl?'منظم تمرین می‌کنم':'I train regularly',icon:'run-fast',hint:rtl?'چالش مناسب برای رشد':'Ready for a real challenge' },{ key:'advanced',label:rtl?'پیشرفته':'I know my way around',icon:'trophy-outline',hint:rtl?'برنامه‌ریزی دقیق‌تر':'Smarter, more precise planning' }];
const dietChoices = (rtl: boolean): Choice[] => [{ key:'balanced',label:rtl?'متعادل':'Balanced',icon:'scale-balance',hint:rtl?'تنوع و تعادل':'A little of everything' },{ key:'high_protein',label:rtl?'پروتئین بالا':'High protein',icon:'food-steak',hint:rtl?'تمرکز بیشتر روی پروتئین':'Protein-forward meals' },{ key:'vegetarian',label:rtl?'گیاهخواری':'Vegetarian',icon:'leaf',hint:rtl?'بدون گوشت':'Plant-focused, no meat' },{ key:'vegan',label:rtl?'وگان':'Vegan',icon:'sprout-outline',hint:rtl?'کاملاً گیاهی':'Fully plant-based' },{ key:'halal',label:rtl?'حلال':'Halal',icon:'food-halal',hint:rtl?'انتخاب‌های سازگار با حلال':'Halal-friendly suggestions' }];
const placeChoices = (rtl: boolean): Choice[] => [{ key:'home',label:rtl?'بیشتر در خانه':'Mostly at home',icon:'home-heart',hint:rtl?'ساده و قابل اجرا':'Simple sessions that fit home life' },{ key:'gym',label:rtl?'بیشتر باشگاه':'Mostly at the gym',icon:'dumbbell',hint:rtl?'گزینه‌های بیشتر با تجهیزات':'More equipment, more options' },{ key:'both',label:rtl?'هردو':'A mix of both',icon:'swap-horizontal-circle',hint:rtl?'انعطاف کامل':'Stay flexible wherever you are' }];

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:BRAND.colors.canvas},flex:{flex:1},shell:{flex:1,paddingHorizontal:22},glowTop:{position:'absolute',width:260,height:260,borderRadius:130,backgroundColor:'#EEE7FF',top:-105,right:-95,opacity:.85},glowBottom:{position:'absolute',width:190,height:190,borderRadius:95,backgroundColor:'#E6F9FF',bottom:75,left:-115,opacity:.7},header:{paddingTop:10,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},progressWrap:{width:120,alignItems:'flex-end'},progressText:{color:BRAND.colors.muted,fontSize:10,fontWeight:'900',marginBottom:5},progressRail:{width:120,height:5,borderRadius:5,backgroundColor:BRAND.colors.border,overflow:'hidden'},progressFill:{height:5,borderRadius:5,backgroundColor:BRAND.colors.primary},backButton:{flexDirection:'row',alignItems:'center',gap:5,marginTop:11,alignSelf:'flex-start',paddingVertical:4},backText:{color:BRAND.colors.inkSoft,fontSize:13,fontWeight:'800'},content:{flex:1},scrollContent:{paddingTop:13,paddingBottom:16},eyebrow:{color:BRAND.colors.primary,fontSize:10,fontWeight:'900',letterSpacing:1.4,marginBottom:7},title:{maxWidth:390,color:BRAND.colors.ink,fontSize:31,lineHeight:38,fontWeight:'900',letterSpacing:-.5},subtitle:{maxWidth:410,color:BRAND.colors.muted,fontSize:14,lineHeight:21,marginTop:8,marginBottom:17},rtl:{textAlign:'right'},welcomeCard:{minHeight:410,backgroundColor:BRAND.colors.startup,borderRadius:30,padding:22,overflow:'hidden',justifyContent:'space-between'},welcomeHalo:{position:'absolute,width:255,height:255,borderRadius:128,borderWidth:1,borderColor:'#2B3564',right:-62,top:-65},welcomeHaloSmall:{position:'absolute',width:180,height:180,borderRadius:90,borderWidth:1,borderColor:'#26315E',right:-25,top:-25},sparkleBox:{width:82,height:82,borderRadius:28,backgroundColor:BRAND.colors.primaryStrong,alignItems:'center',justifyContent:'center',shadowColor:'#7C3AED',shadowOpacity:.34,shadowRadius:20,shadowOffset:{width:0,height:10},elevation:7},welcomeCopy:{maxWidth:330,marginTop:20},badge:{alignSelf:'flex-start',paddingHorizontal:10,paddingVertical:6,borderRadius:999,backgroundColor:'#1B2750',marginBottom:11},badgeText:{color:BRAND.colors.startupMuted,fontSize:9,fontWeight:'900',letterSpacing:1.1},welcomeTitle:{color:BRAND.colors.white,fontSize:27,lineHeight:33,fontWeight:'900'},welcomeBody:{color:BRAND.colors.startupMuted,fontSize:14,lineHeight:21,marginTop:10},featureRow:{flexDirection:'row',gap:8,flexWrap:'wrap'},featurePill:{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:11,paddingVertical:9,borderRadius:14,backgroundColor:'#131E42'},featureText:{color:'#E7E9F5',fontSize:11,fontWeight:'800'},card:{backgroundColor:BRAND.colors.surface,borderRadius:22,borderWidth:1,borderColor:BRAND.colors.border,padding:16,shadowColor:'#111827',shadowOpacity:.05,shadowRadius:18,shadowOffset:{width:0,height:8},elevation:2},permissionRow:{minHeight:76,borderRadius:17,borderWidth:1,borderColor:BRAND.colors.border,paddingHorizontal:12,marginBottom:9,flexDirection:'row',alignItems:'center',gap:10},permissionGranted:{borderColor:'#CBB9FF',backgroundColor:BRAND.colors.primarySoft},permissionIcon:{width:43,height:43,borderRadius:14,backgroundColor:'#F4F1FF',alignItems:'center',justifyContent:'center'},permissionTitle:{color:BRAND.colors.ink,fontSize:14,fontWeight:'900'},permissionHint:{color:BRAND.colors.muted,fontSize:10,lineHeight:15,marginTop:2},permissionDot:{width:22,height:22,borderRadius:11,borderWidth:1.5,borderColor:'#C9CDD6',alignItems:'center',justifyContent:'center'},permissionDotGranted:{borderColor:BRAND.colors.primary,backgroundColor:BRAND.colors.primary},cardTop:{flexDirection:'row',alignItems:'center',gap:11,marginBottom:17},iconCircle:{width:42,height:42,borderRadius:15,backgroundColor:BRAND.colors.primarySoft,alignItems:'center',justifyContent:'center'},cardTitle:{color:BRAND.colors.ink,fontSize:16,fontWeight:'900'},cardHint:{color:BRAND.colors.muted,fontSize:11,marginTop:2},inputBlock:{marginBottom:13},fieldLabel:{color:BRAND.colors.inkSoft,fontSize:11,fontWeight:'900',marginBottom:7},input:{minHeight:50,borderRadius:14,borderWidth:1,borderColor:BRAND.colors.border,backgroundColor:'#FCFCFD',paddingHorizontal:14,color:BRAND.colors.ink,fontSize:14,fontWeight:'700'},genderGrid:{gap:8,marginBottom:13},genderChip:{minHeight:44,borderRadius:14,borderWidth:1,borderColor:BRAND.colors.border,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:8},genderSelected:{borderColor:'#CBB9FF',backgroundColor:BRAND.colors.primarySoft},genderText:{color:BRAND.colors.inkSoft,fontSize:12,fontWeight:'800',flex:1},genderTextSelected:{color:BRAND.colors.primary},twoColumns:{flexDirection:'row',gap:10},bmi:{marginTop:2,padding:12,borderRadius:16,backgroundColor:'#F8F7FF',flexDirection:'row',alignItems:'center',gap:10},bmiLabel:{color:BRAND.colors.muted,fontSize:10,fontWeight:'700'},bmiValue:{color:BRAND.colors.ink,fontSize:20,fontWeight:'900',marginTop:1},bmiTag:{color:BRAND.colors.primary,fontSize:10,fontWeight:'900'},choice:{minHeight:78,borderRadius:18,borderWidth:1,borderColor:BRAND.colors.border,paddingHorizontal:12,marginBottom:9,flexDirection:'row',alignItems:'center',gap:11,backgroundColor:BRAND.colors.surface},choiceSelected:{backgroundColor:BRAND.colors.primarySoft,borderColor:'#CBB9FF'},choicePressed:{transform:[{scale:.99}]},choiceIcon:{width:44,height:44,borderRadius:14,backgroundColor:'#F4F1FF',alignItems:'center',justifyContent:'center'},choiceIconSelected:{backgroundColor:BRAND.colors.primary},choiceTitle:{color:BRAND.colors.ink,fontSize:14,fontWeight:'900'},choiceHint:{color:BRAND.colors.muted,fontSize:10,lineHeight:16,marginTop:3},radio:{width:21,height:21,borderRadius:11,borderWidth:1.5,borderColor:'#C9CDD6',alignItems:'center',justifyContent:'center'},radioSelected:{borderColor:BRAND.colors.primary},radioDot:{width:9,height:9,borderRadius:5,backgroundColor:BRAND.colors.primary},topField:{marginTop:18},numberRow:{flexDirection:'row',gap:7},dayChoice:{flex:1,minHeight:64,borderRadius:14,borderWidth:1,borderColor:BRAND.colors.border,alignItems:'center',justifyContent:'center'},dayNumber:{color:BRAND.colors.ink,fontSize:18,fontWeight:'900'},dayLabel:{color:BRAND.colors.muted,fontSize:9,fontWeight:'800',marginTop:2},timeChoice:{flex:1,minHeight:56,borderRadius:14,borderWidth:1,borderColor:BRAND.colors.border,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:3},timeNumber:{color:BRAND.colors.ink,fontSize:16,fontWeight:'900'},selectedText:{color:BRAND.colors.primary},setupRow:{flexDirection:'row',gap:8},setupChoice:{flex:1,minHeight:51,borderRadius:14,borderWidth:1,borderColor:BRAND.colors.border,alignItems:'center',justifyContent:'center',gap:5},setupText:{color:BRAND.colors.inkSoft,fontSize:10,fontWeight:'800'},detected:{marginTop:16,padding:11,borderRadius:15,backgroundColor:'#F5FBFD',flexDirection:'row',alignItems:'center',gap:8},detectedText:{color:BRAND.colors.inkSoft,fontSize:10,fontWeight:'700',lineHeight:16,flex:1},validation:{color:BRAND.colors.primary,fontSize:11,lineHeight:17,marginTop:9},bottomBar:{paddingTop:7,paddingBottom:Platform.OS==='ios'?6:10},privacyNote:{color:BRAND.colors.muted,fontSize:10,lineHeight:16,marginBottom:9},primary:{minHeight:58,borderRadius:19,paddingHorizontal:18,backgroundColor:BRAND.colors.primary,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9,shadowColor:BRAND.colors.primary,shadowOpacity:.22,shadowRadius:14,shadowOffset:{width:0,height:8},elevation:6},primaryText:{color:BRAND.colors.white,fontSize:15,fontWeight:'900'},primaryPressed:{opacity:.87,transform:[{translateY:1}]},primaryDisabled:{opacity:.45}
});
