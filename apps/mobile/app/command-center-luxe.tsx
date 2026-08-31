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
  DecisionTrace,
  getDailyCommandCenter,
  getDecisionTrace,
  getNutritionSummary,
  getPlanHistory,
  hasAuthSession,
  NutritionSummary,
  PlanExecutionState,
} from '../lib/api';
import { AppLocale, getStoredLocale, isRTL } from '../lib/i18n';
import { runQuickCommand } from '../lib/command-actions';
import { AssistantVoiceOrb } from '../components/AssistantVoiceOrb';
import { PlanStatusCard } from '../components/plan-status-card';
import { DecisionTraceCard } from '../components/decision-trace-card';
import { PREMIUM } from '../lib/premium-ui';

type Accent = 'primary' | 'cyan' | 'mint' | 'rose' | 'lilac' | 'gold';

const copy = {
  en: {
    welcome: 'WELCOME BACK',
    ready: 'MYPA IS READY',
    title: 'Your life, beautifully in sync.',
    subtitle: 'A personal command center with a little more magic.',
    talk: 'Talk to MYPA',
    moment: 'YOUR MOMENT',
    balance: 'TODAY IN BLOOM',
    quick: 'QUICK MOVES',
    radar: 'ON YOUR RADAR',
    habits: 'Habits',
    training: 'Training',
    supplements: 'Supplements',
    unread: 'Unread',
    calories: 'Calories',
    protein: 'Protein',
    water: 'Water',
    calendar: 'Calendar',
    reminder: 'Reminder',
    fullDay: 'Open my full day',
    empty: 'Nothing pressing right now. Enjoy the breathing room.',
  },
  fa: {
    welcome: 'خوش برگشتی',
    ready: 'MYPA آماده‌ست',
    title: 'زندگیت؛ هماهنگ، زیبا و تحت کنترل.',
    subtitle: 'مرکز فرمان زندگی شخصی تو؛ با یک عالمه جزئیات قشنگ.',
    talk: 'با MYPA حرف بزن',
    moment: 'همین لحظه',
    balance: 'امروز در جریان',
    quick: 'دسترسی سریع',
    radar: 'روی رادارت',
    habits: 'عادت‌ها',
    training: 'تمرین',
    supplements: 'مکمل‌ها',
    unread: 'خوانده‌نشده',
    calories: 'کالری',
    protein: 'پروتئین',
    water: 'آب',
    calendar: 'تقویم',
    reminder: 'یادآوری',
    fullDay: 'کل روزم رو باز کن',
    empty: 'فعلاً کار فوری نداری؛ از این فاصله لذت ببر.',
  },
} as const;

function Bloom({ size, tone, center = PREMIUM.colors.gold, style }: { size: number; tone: string; center?: string; style?: object }) {
  const petals = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <View pointerEvents="none" style={[{ width: size, height: size }, style]}>
      {petals.map((angle) => (
        <View
          key={angle}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: size * 0.28,
            height: size * 0.52,
            marginLeft: -size * 0.14,
            marginTop: -size * 0.42,
            borderRadius: size,
            backgroundColor: tone,
            opacity: 0.86,
            transform: [{ rotate: `${angle}deg` }],
          }}
        />
      ))}
      <View style={{ position: 'absolute', left: '50%', top: '50%', width: size * 0.24, height: size * 0.24, marginLeft: -size * 0.12, marginTop: -size * 0.12, borderRadius: size, backgroundColor: center, borderWidth: 2, borderColor: 'rgba(255,255,255,0.72)' }} />
    </View>
  );
}

function useEntrance() {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(22)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 620, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 620, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);
  return { opacity, transform: [{ translateY }] };
}

function SectionTitle({ label, hint, rtl }: { label: string; hint: string; rtl: boolean }) {
  return (
    <View style={[styles.sectionTitle, rtl && styles.reverse]}>
      <View style={rtl ? styles.alignRight : undefined}>
        <Text style={[styles.sectionLabel, rtl && styles.rtlText]}>{label}</Text>
        <Text style={[styles.sectionHint, rtl && styles.rtlText]}>{hint}</Text>
      </View>
      <Bloom size={28} tone={PREMIUM.colors.primaryBright} />
    </View>
  );
}

function CommandCard({ icon, title, value, accent, onPress, rtl }: { icon: keyof typeof Ionicons.glyphMap; title: string; value: string; accent: Accent; onPress?: () => void; rtl: boolean }) {
  const body = (
    <>
      <View style={[styles.commandIcon, { backgroundColor: `${PREMIUM.colors[accent]}18`, borderColor: `${PREMIUM.colors[accent]}44` }]}>
        <Ionicons name={icon} size={18} color={PREMIUM.colors[accent]} />
      </View>
      <Text style={[styles.commandTitle, rtl && styles.rtlText]}>{title}</Text>
      <Text numberOfLines={2} style={[styles.commandValue, rtl && styles.rtlText]}>{value}</Text>
    </>
  );
  return onPress ? <Pressable onPress={onPress} style={({ pressed }) => [styles.commandCard, pressed && styles.pressed]}>{body}</Pressable> : <View style={styles.commandCard}>{body}</View>;
}

function StatTile({ value, label, accent }: { value: string; label: string; accent: Accent }) {
  return (
    <View style={[styles.statTile, { borderColor: `${PREMIUM.colors[accent]}42` }]}>
      <View style={[styles.statDot, { backgroundColor: PREMIUM.colors[accent] }]} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function CommandCenterLuxeScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 370;
  const [locale, setLocale] = useState<AppLocale>('en');
  const [data, setData] = useState<DailyCommandCenterResponse | null>(null);
  const [nutrition, setNutrition] = useState<NutritionSummary | null>(null);
  const [plan, setPlan] = useState<PlanExecutionState | null>(null);
  const [trace, setTrace] = useState<DecisionTrace | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const entrance = useEntrance();
  const rtl = isRTL(locale);
  const t = locale === 'fa' || locale.startsWith('fa-') ? copy.fa : copy.en;

  const load = useCallback(async () => {
    try {
      const [daily, plans, traces, summary] = await Promise.all([
        getDailyCommandCenter(),
        getPlanHistory(1),
        getDecisionTrace(),
        getNutritionSummary(),
      ]);
      setData(daily);
      setPlan(plans[0] ?? null);
      setTrace(traces[0] ?? null);
      setNutrition(summary);
    } catch {
      // Keep existing dashboard content visible when refresh fails.
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
    });
    return () => { mounted = false; };
  }, [load]);

  const runAction = useCallback(async (key: 'water' | 'walk' | 'strength' | 'reminder') => {
    try {
      setBusy(key);
      setActionMessage(null);
      const result = await runQuickCommand(key);
      setActionMessage(result.message);
      await load();
    } finally {
      setBusy(null);
    }
  }, [load]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <Bloom size={120} tone={PREMIUM.colors.primaryBright} />
        <Text style={styles.loadingBrand}>MYPA</Text>
        <Text style={styles.loadingCaption}>PERSONAL LIFE STUDIO</Text>
        <ActivityIndicator color={PREMIUM.colors.gold} style={{ marginTop: 20 }} />
      </View>
    );
  }

  const calories = Math.round(nutrition?.meals.calories ?? data?.nutrition.calories ?? 0);
  const protein = Math.round(nutrition?.meals.protein ?? data?.nutrition.protein ?? 0);
  const water = Math.round(data?.nutrition.waterMl ?? 0);
  const calorieGoal = nutrition?.goals.calories ?? null;
  const caloriesPercent = calorieGoal ? Math.min(100, Math.round((calories / calorieGoal) * 100)) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View pointerEvents="none" style={styles.background}>
        <View style={styles.backdropBerry} />
        <View style={styles.backdropRose} />
        <View style={styles.backdropAqua} />
        <View style={styles.backdropLilac} />
        <Bloom size={170} tone={PREMIUM.colors.primaryBright} style={styles.bgFlowerA} />
        <Bloom size={130} tone={PREMIUM.colors.cyan} style={styles.bgFlowerB} />
      </View>

      <Animated.ScrollView
        style={entrance}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl tintColor={PREMIUM.colors.primaryBright} refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
        contentContainerStyle={[styles.content, compact && styles.contentCompact]}
      >
        <View style={[styles.topRow, rtl && styles.reverse]}>
          <View style={[styles.brandCluster, rtl && styles.alignRight]}>
            <View style={styles.brandBadge}><Text style={styles.brandBadgeText}>MYPA</Text></View>
            <View>
              <Text style={[styles.welcome, rtl && styles.rtlText]}>{t.welcome}</Text>
              <Text style={[styles.micro, rtl && styles.rtlText]}>PERSONAL LIFE STUDIO</Text>
            </View>
          </View>
          <Pressable onPress={() => router.push('/settings')} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons name="options-outline" size={19} color={PREMIUM.colors.ink} />
          </Pressable>
        </View>

        <View style={styles.aiJewelStage}>
          <Bloom size={86} tone={PREMIUM.colors.coral} style={styles.jewelBloom} />
          <View style={styles.jewelShadow} />
          <View style={styles.jewelCard}>
            <View style={styles.jewelInnerGlow} />
            <View style={[styles.aiHeader, rtl && styles.reverse]}>
              <View style={styles.liveDot} />
              <Text style={styles.aiHeaderText}>{t.ready}</Text>
              <View style={styles.headerSpark}><Ionicons name="sparkles" size={13} color={PREMIUM.colors.gold} /></View>
            </View>

            <View style={[styles.aiMain, rtl && styles.reverse]}>
              <View style={[styles.aiCopy, rtl && styles.alignRight]}>
                <Text style={[styles.aiEyebrow, rtl && styles.rtlText]}>MYPA INTELLIGENCE</Text>
                <Text style={[styles.aiTitle, rtl && styles.rtlText]}>{t.title}</Text>
                <Text style={[styles.aiSubtitle, rtl && styles.rtlText]}>{t.subtitle}</Text>
              </View>
              <View style={styles.aiOrbWrap}>
                <View style={styles.orbHaloOne} />
                <View style={styles.orbHaloTwo} />
                <AssistantVoiceOrb state="idle" label="" />
              </View>
            </View>

            <Pressable onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.talkButton, pressed && styles.pressed]}>
              <View style={styles.talkIcon}><Ionicons name="mic" size={16} color={PREMIUM.colors.berry} /></View>
              <Text style={styles.talkText}>{t.talk}</Text>
              <Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={17} color={PREMIUM.colors.berry} />
            </Pressable>
          </View>
        </View>

        <SectionTitle label={t.moment} hint={t.balance} rtl={rtl} />
        <View style={styles.priorityStack}>
          {(data?.priorities?.length ? data.priorities.slice(0, 3) : [t.empty]).map((item, index) => (
            <View key={`${item}-${index}`} style={[styles.priorityCard, index === 1 && styles.priorityRaised, index === 2 && styles.priorityLow]}>
              <View style={[styles.priorityStripe, { backgroundColor: [PREMIUM.colors.cyan, PREMIUM.colors.rose, PREMIUM.colors.gold][index] }]} />
              <View style={styles.priorityNumber}><Text style={styles.priorityNumberText}>0{index + 1}</Text></View>
              <Text style={[styles.priorityText, rtl && styles.rtlText]}>{item}</Text>
              <Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={15} color={PREMIUM.colors.muted} />
            </View>
          ))}
        </View>

        <SectionTitle label={t.balance} hint={`${caloriesPercent}% OF CALORIE GOAL`} rtl={rtl} />
        <View style={styles.balanceCard}>
          <View style={styles.balanceOrbOuter}>
            <View style={[styles.balanceOrbRing, { borderColor: PREMIUM.colors.primaryBright }]}>
              <Text style={styles.balancePercent}>{calorieGoal ? `${caloriesPercent}%` : '—'}</Text>
              <Text style={styles.balanceValue}>{calories}</Text>
              <Text style={styles.balanceUnit}>kcal</Text>
            </View>
          </View>
          <View style={styles.balanceRail}>
            <BalanceRow label={t.protein} value={`${protein}g`} percent={nutrition?.goals.protein ? Math.min(100, Math.round((protein / nutrition.goals.protein) * 100)) : 0} accent="cyan" />
            <BalanceRow label={t.water} value={`${water}ml`} percent={nutrition?.goals.waterMl ? Math.min(100, Math.round((water / nutrition.goals.waterMl) * 100)) : 0} accent="mint" />
          </View>
        </View>

        <SectionTitle label={t.quick} hint="ONE TAP" rtl={rtl} />
        <View style={styles.commandGrid}>
          <CommandCard icon="water-outline" title={t.water} value={busy === 'water' ? '…' : '+ 250 ml'} accent="cyan" rtl={rtl} onPress={() => void runAction('water')} />
          <CommandCard icon="walk-outline" title={t.training} value={busy === 'walk' ? '…' : 'Add movement'} accent="mint" rtl={rtl} onPress={() => void runAction('walk')} />
          <CommandCard icon="barbell-outline" title={t.habits} value={busy === 'strength' ? '…' : 'Log a win'} accent="gold" rtl={rtl} onPress={() => void runAction('strength')} />
          <CommandCard icon="time-outline" title={t.reminder} value={busy === 'reminder' ? '…' : 'Set one'} accent="rose" rtl={rtl} onPress={() => void runAction('reminder')} />
        </View>
        {actionMessage ? <View style={styles.actionToast}><View style={styles.toastDot} /><Text style={[styles.toastText, rtl && styles.rtlText]}>{actionMessage}</Text></View> : null}

        <SectionTitle label={t.radar} hint="UP NEXT" rtl={rtl} />
        <View style={styles.radarStack}>
          <CommandCard icon="calendar-outline" title={t.calendar} value={data?.calendar.next?.title ?? t.empty} accent="lilac" rtl={rtl} onPress={() => router.push('/calendar')} />
          <CommandCard icon="notifications-outline" title={t.reminder} value={data?.reminders.next?.title ?? t.empty} accent="rose" rtl={rtl} onPress={() => router.push('/reminders')} />
        </View>

        <View style={styles.statMosaic}>
          <StatTile value={`${data?.habits.completed ?? 0}/${data?.habits.total ?? 0}`} label={t.habits} accent="mint" />
          <StatTile value={`${data?.workouts.countToday ?? 0}`} label={t.training} accent="gold" />
          <StatTile value={`${data?.supplements.taken ?? 0}/${data?.supplements.total ?? 0}`} label={t.supplements} accent="cyan" />
          <StatTile value={`${data?.notifications.unread ?? 0}`} label={t.unread} accent="rose" />
        </View>

        <PlanStatusCard plan={plan} rtl={rtl} />
        <DecisionTraceCard trace={trace} />

        <Pressable onPress={() => router.push('/daily')} style={({ pressed }) => [styles.fullDayButton, pressed && styles.pressed]}>
          <Text style={styles.fullDayText}>{t.fullDay}</Text>
          <Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={17} color={PREMIUM.colors.white} />
        </Pressable>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function BalanceRow({ label, value, percent, accent }: { label: string; value: string; percent: number; accent: Accent }) {
  return (
    <View style={styles.balanceRow}>
      <View style={[styles.balanceRowIcon, { borderColor: `${PREMIUM.colors[accent]}66` }]}><Ionicons name={accent === 'cyan' ? 'restaurant-outline' : 'water-outline'} size={15} color={PREMIUM.colors[accent]} /></View>
      <View style={styles.balanceRowCopy}>
        <View style={styles.balanceRowTop}><Text style={styles.balanceRowLabel}>{label}</Text><Text style={styles.balanceRowValue}>{value}</Text></View>
        <View style={styles.track}><View style={[styles.fill, { width: `${percent}%`, backgroundColor: PREMIUM.colors[accent] }]} /></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PREMIUM.colors.canvas },
  background: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', backgroundColor: PREMIUM.colors.canvas },
  backdropBerry: { position: 'absolute', width: 520, height: 520, borderRadius: 260, right: -300, top: -250, backgroundColor: PREMIUM.colors.berry, opacity: 0.17 },
  backdropRose: { position: 'absolute', width: 380, height: 380, borderRadius: 190, left: -240, top: 150, backgroundColor: PREMIUM.colors.primaryBright, opacity: 0.11 },
  backdropAqua: { position: 'absolute', width: 340, height: 340, borderRadius: 170, right: -170, bottom: 170, backgroundColor: PREMIUM.colors.cyan, opacity: 0.08 },
  backdropLilac: { position: 'absolute', width: 360, height: 360, borderRadius: 180, left: -190, bottom: -140, backgroundColor: PREMIUM.colors.lilac, opacity: 0.09 },
  bgFlowerA: { position: 'absolute', right: -30, top: 105, opacity: 0.22 },
  bgFlowerB: { position: 'absolute', left: -20, top: 420, opacity: 0.16 },
  content: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 150, gap: 16 },
  contentCompact: { paddingHorizontal: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reverse: { flexDirection: 'row-reverse' },
  alignRight: { alignItems: 'flex-end' },
  rtlText: { textAlign: 'right' },
  brandCluster: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandBadge: { width: 42, height: 42, borderRadius: 14, backgroundColor: PREMIUM.colors.berry, borderWidth: 1.5, borderColor: PREMIUM.colors.primaryBright, alignItems: 'center', justifyContent: 'center', shadowColor: PREMIUM.colors.primaryBright, shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  brandBadgeText: { color: PREMIUM.colors.white, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  welcome: { color: PREMIUM.colors.ink, fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  micro: { color: PREMIUM.colors.muted, fontSize: 7, fontWeight: '900', letterSpacing: 1.5, marginTop: 3 },
  iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: PREMIUM.colors.surfaceGlass, borderWidth: 1, borderColor: PREMIUM.colors.border, alignItems: 'center', justifyContent: 'center', shadowColor: PREMIUM.colors.berry, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  aiJewelStage: { minHeight: 430, position: 'relative', marginTop: 2 },
  jewelShadow: { position: 'absolute', left: 16, right: 16, top: 28, height: 360, borderRadius: 38, backgroundColor: PREMIUM.colors.berry, opacity: 0.12, transform: [{ rotate: '-1.2deg' }] },
  jewelBloom: { position: 'absolute', right: 4, top: -18, opacity: 0.34 },
  jewelCard: { marginTop: 22, minHeight: 372, borderRadius: 38, padding: 18, overflow: 'hidden', backgroundColor: '#FFFDFE', borderWidth: 1.2, borderColor: '#F3C2D9', shadowColor: PREMIUM.colors.berry, shadowOpacity: 0.20, shadowRadius: 28, shadowOffset: { width: 0, height: 18 }, elevation: 16 },
  jewelInnerGlow: { position: 'absolute', width: 310, height: 310, borderRadius: 155, right: -90, top: -110, backgroundColor: '#FFE3EF', opacity: 0.75 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: '#FFF3F8', borderWidth: 1, borderColor: '#F2D1DF' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: PREMIUM.colors.cyan },
  aiHeaderText: { color: PREMIUM.colors.berry, fontSize: 8, fontWeight: '900', letterSpacing: 1.6 },
  headerSpark: { marginLeft: 2 },
  aiMain: { flexDirection: 'row', alignItems: 'center', minHeight: 246, marginTop: 6 },
  aiCopy: { flex: 1, paddingRight: 5, zIndex: 2 },
  aiEyebrow: { color: PREMIUM.colors.primary, fontSize: 8, fontWeight: '900', letterSpacing: 1.7, marginBottom: 10 },
  aiTitle: { color: PREMIUM.colors.ink, fontSize: 29, lineHeight: 35, fontWeight: '900', maxWidth: 235 },
  aiSubtitle: { color: PREMIUM.colors.inkSoft, fontSize: 11, lineHeight: 17, marginTop: 12, maxWidth: 235 },
  aiOrbWrap: { width: 152, height: 206, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  orbHaloOne: { position: 'absolute', width: 168, height: 168, borderRadius: 84, backgroundColor: '#FFE2EF', opacity: 0.72 },
  orbHaloTwo: { position: 'absolute', width: 126, height: 126, borderRadius: 63, borderWidth: 2, borderColor: `${PREMIUM.colors.cyan}44` },
  talkButton: { minHeight: 54, borderRadius: 27, backgroundColor: '#FFD6E6', borderWidth: 1, borderColor: '#F0B9D0', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 9, shadowColor: PREMIUM.colors.primary, shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  talkIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: PREMIUM.colors.white, alignItems: 'center', justifyContent: 'center' },
  talkText: { flex: 1, color: PREMIUM.colors.berry, fontSize: 12, fontWeight: '900' },
  sectionTitle: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  sectionLabel: { color: PREMIUM.colors.ink, fontSize: 17, fontWeight: '900' },
  sectionHint: { color: PREMIUM.colors.muted, fontSize: 7, fontWeight: '900', letterSpacing: 1.4, marginTop: 3 },
  priorityStack: { gap: 9 },
  priorityCard: { minHeight: 66, borderRadius: 22, backgroundColor: PREMIUM.colors.surfaceGlass, borderWidth: 1, borderColor: PREMIUM.colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10, shadowColor: PREMIUM.colors.berry, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 4 },
  priorityRaised: { transform: [{ translateX: 9 }], backgroundColor: '#FFFDFE' },
  priorityLow: { transform: [{ translateX: -4 }] },
  priorityStripe: { width: 5, height: 38, borderRadius: 3 },
  priorityNumber: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF0F7', borderWidth: 1, borderColor: PREMIUM.colors.border, alignItems: 'center', justifyContent: 'center' },
  priorityNumberText: { color: PREMIUM.colors.berry, fontSize: 10, fontWeight: '900' },
  priorityText: { flex: 1, color: PREMIUM.colors.inkSoft, fontSize: 12, lineHeight: 18, fontWeight: '800' },
  balanceCard: { minHeight: 184, borderRadius: 30, backgroundColor: PREMIUM.colors.berry, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16, shadowColor: PREMIUM.colors.berry, shadowOpacity: 0.26, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 10, overflow: 'hidden' },
  balanceOrbOuter: { width: 142, height: 142, borderRadius: 71, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  balanceOrbRing: { width: 118, height: 118, borderRadius: 59, borderWidth: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.055)' },
  balancePercent: { color: '#FFD7E7', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  balanceValue: { color: PREMIUM.colors.white, fontSize: 25, fontWeight: '900', marginTop: 2 },
  balanceUnit: { color: '#D7B6C7', fontSize: 9, fontWeight: '800', marginTop: 1 },
  balanceRail: { flex: 1, gap: 16 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  balanceRowIcon: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  balanceRowCopy: { flex: 1 },
  balanceRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7 },
  balanceRowLabel: { color: '#FFE8F3', fontSize: 9, fontWeight: '900' },
  balanceRowValue: { color: PREMIUM.colors.white, fontSize: 10, fontWeight: '900' },
  track: { height: 6, borderRadius: 3, marginTop: 6, backgroundColor: 'rgba(255,255,255,0.09)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  commandGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  commandCard: { width: '48.3%', minHeight: 100, borderRadius: 22, backgroundColor: PREMIUM.colors.surfaceGlass, borderWidth: 1, borderColor: PREMIUM.colors.border, padding: 12, justifyContent: 'space-between', shadowColor: PREMIUM.colors.berry, shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  commandIcon: { width: 35, height: 35, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  commandTitle: { color: PREMIUM.colors.ink, fontSize: 10, fontWeight: '900', marginTop: 7 },
  commandValue: { color: PREMIUM.colors.inkSoft, fontSize: 9, lineHeight: 14, marginTop: 4 },
  actionToast: { minHeight: 44, borderRadius: 16, backgroundColor: '#FFF5F9', borderWidth: 1, borderColor: PREMIUM.colors.border, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  toastDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: PREMIUM.colors.cyan },
  toastText: { flex: 1, color: PREMIUM.colors.inkSoft, fontSize: 10, fontWeight: '800' },
  radarStack: { gap: 9 },
  statMosaic: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  statTile: { width: '48.3%', minHeight: 82, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, padding: 12, justifyContent: 'center' },
  statDot: { width: 7, height: 7, borderRadius: 4, marginBottom: 8 },
  statValue: { color: PREMIUM.colors.ink, fontSize: 21, fontWeight: '900' },
  statLabel: { color: PREMIUM.colors.muted, fontSize: 9, fontWeight: '800', marginTop: 3 },
  fullDayButton: { minHeight: 58, borderRadius: 29, backgroundColor: PREMIUM.colors.berry, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: PREMIUM.colors.berry, shadowOpacity: 0.27, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  fullDayText: { color: PREMIUM.colors.white, fontSize: 12, fontWeight: '900' },
  pressed: { opacity: 0.84, transform: [{ scale: 0.985 }] },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: PREMIUM.colors.canvas },
  loadingBrand: { color: PREMIUM.colors.berry, fontSize: 28, fontWeight: '900', letterSpacing: 3, marginTop: 18 },
  loadingCaption: { color: PREMIUM.colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.7, marginTop: 5 },
});
