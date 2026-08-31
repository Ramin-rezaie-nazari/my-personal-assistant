import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  DailyCommandCenterResponse,
  getDailyCommandCenter,
  getNutritionSummary,
  hasAuthSession,
  NutritionSummary,
} from '../lib/api';
import { AppLocale, getStoredLocale, isRTL } from '../lib/i18n';
import { runQuickCommand } from '../lib/command-actions';
import { AssistantVoiceOrb } from '../components/AssistantVoiceOrb';

const C = {
  canvas: '#FFF8F8',
  paper: '#FFFEFD',
  ink: '#3D3540',
  muted: '#8A7E88',
  line: '#F1E3E7',
  rose: '#D98AA7',
  roseDark: '#A95778',
  blush: '#F4C9D8',
  blushSoft: '#FBE8EF',
  lilac: '#B9A5D6',
  lilacSoft: '#EEE8F7',
  peach: '#F2BFA7',
  peachSoft: '#F9E7DF',
  sage: '#A9C7BC',
  sageSoft: '#E7F1ED',
  gold: '#D9B66F',
  white: '#FFFFFF',
};

type Copy = {
  hello: string;
  subHello: string;
  assistantEyebrow: string;
  assistantTitle: string;
  assistantBody: string;
  talk: string;
  today: string;
  todayHint: string;
  calories: string;
  protein: string;
  water: string;
  quick: string;
  waterQuick: string;
  walkQuick: string;
  trainQuick: string;
  reminderQuick: string;
  focus: string;
  focusHint: string;
  openAssistant: string;
  empty: string;
};

const COPY: Record<'en' | 'fa', Copy> = {
  en: {
    hello: 'Good evening, beautiful.',
    subHello: 'Let’s make today feel a little lighter.',
    assistantEyebrow: 'YOUR PERSONAL AI',
    assistantTitle: 'I’m here. What do you need?',
    assistantBody: 'Plan your day, log food, remember something, or just talk.',
    talk: 'Talk to MYPA',
    today: 'Today, gently on track',
    todayHint: 'A little progress is still progress.',
    calories: 'Calories',
    protein: 'Protein',
    water: 'Water',
    quick: 'Tiny wins',
    waterQuick: 'Log water',
    walkQuick: 'Take a walk',
    trainQuick: 'Start training',
    reminderQuick: 'Set a reminder',
    focus: 'On your radar',
    focusHint: 'The things worth your attention next',
    openAssistant: 'Ask MYPA',
    empty: 'Nothing urgent right now. You’ve got some breathing room. ♡',
  },
  fa: {
    hello: 'عصر بخیر، خوشگله.',
    subHello: 'بیا امروز رو یکم سبک‌تر و قشنگ‌تر جلو ببریم.',
    assistantEyebrow: 'دستیار شخصی تو',
    assistantTitle: 'من هستم؛ چی لازم داری؟',
    assistantBody: 'برنامه‌ریزی، غذا، یادآوری یا فقط چند دقیقه گپ.',
    talk: 'با MYPA حرف بزن',
    today: 'امروز، آروم ولی رو مسیر',
    todayHint: 'پیشرفت کوچیک هم پیشرفته. ♡',
    calories: 'کالری',
    protein: 'پروتئین',
    water: 'آب',
    quick: 'بردهای کوچیک',
    waterQuick: 'ثبت آب',
    walkQuick: 'یکم قدم بزن',
    trainQuick: 'شروع تمرین',
    reminderQuick: 'یادآوری بساز',
    focus: 'روی رادارت',
    focusHint: 'چیزهایی که بهتره بعدی حواست بهشون باشه',
    openAssistant: 'از MYPA بپرس',
    empty: 'فعلاً کار فوری نداری؛ یه نفس راحت بکش. ♡',
  },
};

function Sparkle({ size = 18, color = C.rose, style }: { size?: number; color?: string; style?: object }) {
  return (
    <View pointerEvents="none" style={[{ width: size, height: size }, style]}>
      <View style={{ position: 'absolute', left: size * 0.42, top: 0, width: size * 0.16, height: size, borderRadius: size, backgroundColor: color }} />
      <View style={{ position: 'absolute', left: 0, top: size * 0.42, width: size, height: size * 0.16, borderRadius: size, backgroundColor: color }} />
    </View>
  );
}

function MiniStat({ icon, value, label, soft }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string; soft: string }) {
  return (
    <View style={styles.miniStat}>
      <View style={[styles.miniIcon, { backgroundColor: soft }]}>
        <Ionicons name={icon} size={16} color={C.roseDark} />
      </View>
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, tone, onPress, busy }: { icon: keyof typeof Ionicons.glyphMap; label: string; tone: 'rose' | 'lilac' | 'peach' | 'sage'; onPress: () => void; busy: boolean }) {
  const map = {
    rose: { bg: C.blushSoft, ink: C.roseDark },
    lilac: { bg: C.lilacSoft, ink: '#76619A' },
    peach: { bg: C.peachSoft, ink: '#A7654A' },
    sage: { bg: C.sageSoft, ink: '#53796D' },
  }[tone];
  return (
    <Pressable onPress={onPress} disabled={busy} style={({ pressed }) => [styles.quickAction, { backgroundColor: map.bg }, pressed && styles.pressed]}>
      <View style={[styles.quickIcon, { backgroundColor: C.white }]}>
        {busy ? <ActivityIndicator size="small" color={map.ink} /> : <Ionicons name={icon} size={18} color={map.ink} />}
      </View>
      <Text style={[styles.quickLabel, { color: map.ink }]}>{label}</Text>
      <Ionicons name="arrow-up" size={14} color={map.ink} style={{ transform: [{ rotate: '45deg' }] }} />
    </Pressable>
  );
}

function ProgressPill({ label, value, percent, color }: { label: string; value: string; percent: number; color: string }) {
  return (
    <View style={styles.progressPill}>
      <View style={styles.progressTop}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(4, Math.min(100, percent))}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function CommandCenterGirlyScreen() {
  const { width } = useWindowDimensions();
  const rtlInset = width < 370 ? 18 : 22;
  const [locale, setLocale] = useState<AppLocale>('en');
  const [data, setData] = useState<DailyCommandCenterResponse | null>(null);
  const [nutrition, setNutrition] = useState<NutritionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const reveal = useRef(new Animated.Value(0)).current;
  const rtl = isRTL(locale);
  const t = locale === 'fa' || locale.startsWith('fa-') ? COPY.fa : COPY.en;

  const load = useCallback(async () => {
    try {
      const [daily, summary] = await Promise.all([getDailyCommandCenter(), getNutritionSummary()]);
      setData(daily);
      setNutrition(summary);
    } catch {
      // Keep the last known dashboard visible when the API is unavailable.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void Promise.all([getStoredLocale(), hasAuthSession()]).then(async ([stored, auth]) => {
      if (!mounted) return;
      if (stored) setLocale(stored);
      if (!auth) {
        router.replace('/auth');
        return;
      }
      await load();
      Animated.timing(reveal, { toValue: 1, duration: 650, useNativeDriver: true }).start();
    });
    return () => { mounted = false; };
  }, [load, reveal]);

  const action = useCallback(async (key: 'water' | 'walk' | 'strength' | 'reminder') => {
    try {
      setBusy(key);
      setNote(null);
      const result = await runQuickCommand(key);
      setNote(result.message);
      await load();
    } finally {
      setBusy(null);
    }
  }, [load]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <View style={styles.loadingPetal}><Sparkle size={34} color={C.rose} /></View>
        <Text style={styles.loadingBrand}>MYPA</Text>
        <Text style={styles.loadingCaption}>YOUR LITTLE LIFE STUDIO</Text>
        <ActivityIndicator color={C.rose} style={{ marginTop: 22 }} />
      </View>
    );
  }

  const calories = Math.round(nutrition?.meals.calories ?? data?.nutrition.calories ?? 0);
  const protein = Math.round(nutrition?.meals.protein ?? data?.nutrition.protein ?? 0);
  const water = Math.round(data?.nutrition.waterMl ?? 0);
  const calorieGoal = nutrition?.goals.calories ?? 0;
  const proteinGoal = nutrition?.goals.protein ?? 0;
  const waterGoal = 2000;
  const caloriePercent = calorieGoal ? Math.round((calories / calorieGoal) * 100) : 0;
  const proteinPercent = proteinGoal ? Math.round((protein / proteinGoal) * 100) : 0;
  const waterPercent = Math.round((water / waterGoal) * 100);
  const priorities = data?.priorities?.length ? data.priorities.slice(0, 3) : [t.empty];

  return (
    <SafeAreaView style={styles.safe}>
      <View pointerEvents="none" style={styles.bg}>
        <View style={styles.bgTopGlow} />
        <View style={styles.bgSideGlow} />
        <View style={styles.bgBottomGlow} />
        <View style={styles.bgFlowerOne}><Sparkle size={74} color={C.blush} /></View>
        <View style={styles.bgFlowerTwo}><Sparkle size={44} color={C.lilac} /></View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl tintColor={C.rose} refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
        contentContainerStyle={[styles.content, { paddingHorizontal: rtlInset }]}
        style={{ opacity: reveal, transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }}
      >
        <View style={[styles.header, rtl && styles.reverse]}>
          <View style={[rtl && styles.alignRight, styles.headerCopy]}>
            <Text style={[styles.eyebrow, rtl && styles.rtlText]}>MYPA · PERSONAL LIFE STUDIO</Text>
            <Text style={[styles.hello, rtl && styles.rtlText]}>{t.hello}</Text>
            <Text style={[styles.subHello, rtl && styles.rtlText]}>{t.subHello}</Text>
          </View>
          <Pressable onPress={() => router.push('/settings')} style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}>
            <Ionicons name="options-outline" size={20} color={C.roseDark} />
          </Pressable>
        </View>

        <View style={[styles.aiCard, rtl && styles.reverse]}>
          <View pointerEvents="none" style={styles.aiDecorOne} />
          <View pointerEvents="none" style={styles.aiDecorTwo} />
          <View style={[styles.aiCopy, rtl && styles.alignRight]}>
            <View style={[styles.liveBadge, rtl && styles.reverse]}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>READY FOR YOU</Text>
            </View>
            <Text style={[styles.aiEyebrow, rtl && styles.rtlText]}>{t.assistantEyebrow}</Text>
            <Text style={[styles.aiTitle, rtl && styles.rtlText]}>{t.assistantTitle}</Text>
            <Text style={[styles.aiBody, rtl && styles.rtlText]}>{t.assistantBody}</Text>
            <Pressable onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.talkButton, pressed && styles.pressed]}>
              <View style={styles.talkIcon}><Ionicons name="mic" size={16} color={C.white} /></View>
              <Text style={styles.talkText}>{t.talk}</Text>
              <Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={17} color={C.white} />
            </Pressable>
          </View>
          <View style={styles.orbStage}>
            <View style={styles.orbHaloA} />
            <View style={styles.orbHaloB} />
            <View style={styles.orbSparkOne}><Sparkle size={15} color={C.gold} /></View>
            <View style={styles.orbSparkTwo}><Sparkle size={11} color={C.rose} /></View>
            <AssistantVoiceOrb state="idle" label="" />
          </View>
        </View>

        <View style={[styles.sectionHeader, rtl && styles.reverse]}>
          <View style={rtl && styles.alignRight}>
            <Text style={[styles.sectionTitle, rtl && styles.rtlText]}>{t.today}</Text>
            <Text style={[styles.sectionHint, rtl && styles.rtlText]}>{t.todayHint}</Text>
          </View>
          <Sparkle size={22} color={C.rose} />
        </View>

        <View style={[styles.statsCard, rtl && styles.reverse]}>
          <MiniStat icon="flame-outline" value={`${calories}`} label={t.calories} soft={C.blushSoft} />
          <View style={styles.statDivider} />
          <MiniStat icon="barbell-outline" value={`${protein}g`} label={t.protein} soft={C.lilacSoft} />
          <View style={styles.statDivider} />
          <MiniStat icon="water-outline" value={`${water}ml`} label={t.water} soft={C.sageSoft} />
        </View>

        <View style={styles.progressGrid}>
          <ProgressPill label={t.calories} value={calorieGoal ? `${caloriePercent}%` : '—'} percent={caloriePercent} color={C.rose} />
          <ProgressPill label={t.protein} value={proteinGoal ? `${proteinPercent}%` : '—'} percent={proteinPercent} color={C.lilac} />
          <ProgressPill label={t.water} value={`${waterPercent}%`} percent={waterPercent} color={C.sage} />
        </View>

        <View style={[styles.sectionHeader, rtl && styles.reverse, { marginTop: 24 }]}>
          <View style={rtl && styles.alignRight}>
            <Text style={[styles.sectionTitle, rtl && styles.rtlText]}>{t.quick}</Text>
          </View>
          <View style={styles.tinyHeart}><Ionicons name="heart" size={12} color={C.white} /></View>
        </View>

        <View style={styles.quickGrid}>
          <QuickAction icon="water-outline" label={t.waterQuick} tone="rose" onPress={() => void action('water')} busy={busy === 'water'} />
          <QuickAction icon="walk-outline" label={t.walkQuick} tone="sage" onPress={() => void action('walk')} busy={busy === 'walk'} />
          <QuickAction icon="barbell-outline" label={t.trainQuick} tone="lilac" onPress={() => void action('strength')} busy={busy === 'strength'} />
          <QuickAction icon="notifications-outline" label={t.reminderQuick} tone="peach" onPress={() => void action('reminder')} busy={busy === 'reminder'} />
        </View>

        {note ? <View style={[styles.note, rtl && styles.reverse]}><Ionicons name="sparkles" size={14} color={C.roseDark} /><Text style={[styles.noteText, rtl && styles.rtlText]}>{note}</Text></View> : null}

        <View style={[styles.sectionHeader, rtl && styles.reverse, { marginTop: 28 }]}>
          <View style={rtl && styles.alignRight}>
            <Text style={[styles.sectionTitle, rtl && styles.rtlText]}>{t.focus}</Text>
            <Text style={[styles.sectionHint, rtl && styles.rtlText]}>{t.focusHint}</Text>
          </View>
          <Sparkle size={20} color={C.lilac} />
        </View>

        <View style={styles.focusStack}>
          {priorities.map((item, index) => (
            <Pressable key={`${item}-${index}`} onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.focusCard, pressed && styles.pressed]}>
              <View style={[styles.focusBubble, { backgroundColor: [C.blushSoft, C.lilacSoft, C.peachSoft][index] ?? C.blushSoft }]}>
                <Text style={[styles.focusNumber, { color: [C.roseDark, '#76619A', '#A7654A'][index] ?? C.roseDark }]}>0{index + 1}</Text>
              </View>
              <Text style={[styles.focusText, rtl && styles.rtlText]}>{item}</Text>
              <Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={16} color={C.muted} />
            </Pressable>
          ))}
        </View>

        <Pressable onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.bottomAssistant, pressed && styles.pressed]}>
          <View style={styles.bottomAssistantIcon}><Ionicons name="sparkles" size={17} color={C.roseDark} /></View>
          <View style={[styles.bottomCopy, rtl && styles.alignRight]}>
            <Text style={[styles.bottomTitle, rtl && styles.rtlText]}>{t.openAssistant}</Text>
            <Text style={[styles.bottomHint, rtl && styles.rtlText]}>Personalize anything in a few words.</Text>
          </View>
          <Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={18} color={C.roseDark} />
        </Pressable>

        <Text style={styles.footer}>made for your everyday little wins ♡</Text>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.canvas },
  bg: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  bgTopGlow: { position: 'absolute', width: 330, height: 330, borderRadius: 165, right: -150, top: -160, backgroundColor: C.blush, opacity: 0.24 },
  bgSideGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, left: -170, top: '38%', backgroundColor: C.lilac, opacity: 0.10 },
  bgBottomGlow: { position: 'absolute', width: 320, height: 320, borderRadius: 160, right: -180, bottom: -170, backgroundColor: C.peach, opacity: 0.10 },
  bgFlowerOne: { position: 'absolute', right: 34, top: 105, opacity: 0.20, transform: [{ rotate: '45deg' }] },
  bgFlowerTwo: { position: 'absolute', left: 28, bottom: 190, opacity: 0.18, transform: [{ rotate: '45deg' }] },
  content: { paddingTop: 16, paddingBottom: 44 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.canvas },
  loadingPetal: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blushSoft, borderWidth: 1, borderColor: C.blush },
  loadingBrand: { marginTop: 18, fontSize: 28, letterSpacing: 7, fontWeight: '700', color: C.ink },
  loadingCaption: { marginTop: 6, fontSize: 10, letterSpacing: 2.2, color: C.muted },
  header: { alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 18 },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 9, letterSpacing: 2.1, color: C.roseDark, fontWeight: '700', marginBottom: 8 },
  hello: { fontSize: 28, lineHeight: 33, fontWeight: '700', color: C.ink, letterSpacing: -0.6 },
  subHello: { fontSize: 13, lineHeight: 19, color: C.muted, marginTop: 5 },
  profileButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  aiCard: { minHeight: 272, overflow: 'hidden', borderRadius: 30, padding: 20, backgroundColor: '#F3D9E4', borderWidth: 1, borderColor: '#F0CCD9', position: 'relative', shadowColor: '#A95778', shadowOpacity: 0.08, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 4 },
  aiCopy: { flex: 1, paddingRight: 82, zIndex: 2 },
  aiDecorOne: { position: 'absolute', width: 210, height: 210, borderRadius: 105, right: -84, top: -70, backgroundColor: '#F9EDF3', opacity: 0.72 },
  aiDecorTwo: { position: 'absolute', width: 150, height: 150, borderRadius: 75, right: 22, bottom: -82, backgroundColor: '#E7D8F0', opacity: 0.50 },
  liveBadge: { alignSelf: 'flex-start', alignItems: 'center', flexDirection: 'row', gap: 7, backgroundColor: 'rgba(255,255,255,0.52)', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 14 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#6DAA8F' },
  liveText: { fontSize: 8, letterSpacing: 1.35, color: C.roseDark, fontWeight: '700' },
  aiEyebrow: { fontSize: 9, letterSpacing: 1.7, color: C.roseDark, fontWeight: '700', marginBottom: 6 },
  aiTitle: { fontSize: 27, lineHeight: 31, color: C.ink, fontWeight: '700', letterSpacing: -0.5 },
  aiBody: { fontSize: 12, lineHeight: 18, color: '#73636C', marginTop: 8, maxWidth: 245 },
  talkButton: { marginTop: 17, height: 44, alignSelf: 'flex-start', paddingHorizontal: 14, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: C.roseDark },
  talkIcon: { width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  talkText: { fontSize: 12, color: C.white, fontWeight: '700' },
  orbStage: { position: 'absolute', width: 120, height: 120, right: 4, top: 78, alignItems: 'center', justifyContent: 'center' },
  orbHaloA: { position: 'absolute', width: 112, height: 112, borderRadius: 56, backgroundColor: 'rgba(255,255,255,0.40)' },
  orbHaloB: { position: 'absolute', width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(255,255,255,0.56)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)' },
  orbSparkOne: { position: 'absolute', right: 2, top: 6 },
  orbSparkTwo: { position: 'absolute', left: 8, bottom: 11 },
  sectionHeader: { marginTop: 25, marginBottom: 11, alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 17, lineHeight: 22, color: C.ink, fontWeight: '700' },
  sectionHint: { fontSize: 10, lineHeight: 15, color: C.muted, marginTop: 2 },
  statsCard: { minHeight: 108, borderRadius: 25, paddingHorizontal: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', shadowColor: '#B98699', shadowOpacity: 0.05, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  miniStat: { flex: 1, alignItems: 'center' },
  miniIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  miniValue: { fontSize: 17, fontWeight: '700', color: C.ink },
  miniLabel: { fontSize: 9, color: C.muted, marginTop: 2 },
  statDivider: { width: 1, height: 44, backgroundColor: C.line },
  progressGrid: { gap: 9, marginTop: 10 },
  progressPill: { backgroundColor: 'rgba(255,255,255,0.74)', borderRadius: 16, paddingHorizontal: 13, paddingVertical: 10, borderWidth: 1, borderColor: C.line },
  progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  progressLabel: { fontSize: 10, color: C.muted, fontWeight: '600' },
  progressValue: { fontSize: 10, color: C.ink, fontWeight: '700' },
  progressTrack: { height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: '#F1ECEE' },
  progressFill: { height: '100%', borderRadius: 3 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickAction: { flexGrow: 1, width: '47%', minHeight: 74, borderRadius: 20, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.82)' },
  quickIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { flex: 1, fontSize: 11, lineHeight: 15, fontWeight: '700' },
  tinyHeart: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: C.rose },
  note: { marginTop: 10, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 15, alignItems: 'center', gap: 7, backgroundColor: C.blushSoft, borderWidth: 1, borderColor: '#F0D7E1' },
  noteText: { flex: 1, fontSize: 10, lineHeight: 15, color: C.roseDark },
  focusStack: { gap: 9 },
  focusCard: { minHeight: 64, borderRadius: 20, padding: 9, paddingRight: 13, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  focusBubble: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  focusNumber: { fontSize: 11, fontWeight: '800' },
  focusText: { flex: 1, fontSize: 11.5, lineHeight: 17, color: C.ink, fontWeight: '600' },
  bottomAssistant: { marginTop: 18, minHeight: 68, borderRadius: 22, paddingHorizontal: 11, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: C.white, borderWidth: 1, borderColor: '#ECD3DD' },
  bottomAssistantIcon: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blushSoft },
  bottomCopy: { flex: 1 },
  bottomTitle: { fontSize: 12, color: C.ink, fontWeight: '700' },
  bottomHint: { fontSize: 9.5, color: C.muted, marginTop: 3 },
  footer: { alignSelf: 'center', marginTop: 20, fontSize: 9, color: '#B4A6AF', letterSpacing: 0.9 },
  reverse: { flexDirection: 'row-reverse' },
  alignRight: { alignItems: 'flex-end' },
  rtlText: { textAlign: 'right' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
});
