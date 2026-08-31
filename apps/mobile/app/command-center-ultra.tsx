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
import { PlanStatusCard } from '../components/plan-status-card';
import { DecisionTraceCard } from '../components/decision-trace-card';
import { AssistantVoiceOrb } from '../components/AssistantVoiceOrb';
import { PremiumGlow } from '../components/PremiumGlow';
import { PREMIUM } from '../lib/premium-ui';

type Accent = 'primary' | 'cyan' | 'mint' | 'amber' | 'rose' | 'lilac';

const ui = {
  en: {
    hello: 'WELCOME BACK',
    assistant: 'MYPA IS READY',
    heroTitle: 'Your life, beautifully in sync.',
    heroHint: 'Talk naturally. Ask anything. Let MYPA connect the dots.',
    priority: 'YOUR MOMENT',
    balance: 'TODAY IN BLOOM',
    quick: 'QUICK MOVES',
    next: 'ON YOUR RADAR',
    empty: 'Nothing pressing right now. Enjoy the breathing room.',
    talk: 'Talk to MYPA',
    calendar: 'Calendar',
    reminder: 'Reminder',
    daily: 'Open my full day',
    habits: 'Habits',
    training: 'Training',
    supplements: 'Supplements',
    unread: 'Unread',
    calories: 'Calories',
    protein: 'Protein',
    water: 'Water',
  },
  fa: {
    hello: 'خوش برگشتی',
    assistant: 'MYPA آماده‌ست',
    heroTitle: 'زندگیت؛ هماهنگ، زیبا و تحت کنترل.',
    heroHint: 'طبیعی حرف بزن، هرچی می‌خوای بپرس و بذار MYPA همه‌چی رو به هم وصل کنه.',
    priority: 'همین لحظه',
    balance: 'امروز در جریان',
    quick: 'دسترسی سریع',
    next: 'روی رادارت',
    empty: 'فعلاً فشار فوری نداری؛ از این فاصله نفس بکش.',
    talk: 'با MYPA حرف بزن',
    calendar: 'تقویم',
    reminder: 'یادآوری',
    daily: 'کل روزم رو باز کن',
    habits: 'عادت‌ها',
    training: 'تمرین',
    supplements: 'مکمل‌ها',
    unread: 'خوانده‌نشده',
    calories: 'کالری',
    protein: 'پروتئین',
    water: 'آب',
  },
} as const;

function Petal({ size, color, angle }: { size: number; color: string; angle: number }) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.petal,
        {
          width: size,
          height: size * 1.72,
          borderRadius: size,
          marginLeft: -size / 2,
          marginTop: -size * 0.82,
          backgroundColor: color,
          transform: [{ rotate: `${angle}deg` }],
        },
      ]}
    />
  );
}

function Bloom({ size = 120, tone = PREMIUM.colors.primary, center = PREMIUM.colors.gold, style }: { size?: number; tone?: string; center?: string; style?: object }) {
  const petalSize = size * 0.32;
  return (
    <View pointerEvents="none" style={[{ width: size, height: size }, style]}>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <Petal key={angle} size={petalSize} color={tone} angle={angle} />
      ))}
      <View style={[styles.bloomCore, { width: size * 0.26, height: size * 0.26, borderRadius: size, backgroundColor: center }]} />
    </View>
  );
}

function Spark({ size = 10, color = PREMIUM.colors.gold, style }: { size?: number; color?: string; style?: object }) {
  return <View pointerEvents="none" style={[styles.spark, { width: size, height: size, borderColor: color }, style]} />;
}

function Confetti() {
  const dots = [
    ['12%', '15%', 6, PREMIUM.colors.gold], ['72%', '9%', 5, PREMIUM.colors.cyan], ['88%', '28%', 8, PREMIUM.colors.rose],
    ['8%', '44%', 4, PREMIUM.colors.lilac], ['83%', '54%', 5, PREMIUM.colors.mint], ['28%', '7%', 4, PREMIUM.colors.primaryBright],
    ['57%', '21%', 4, PREMIUM.colors.gold], ['93%', '71%', 6, PREMIUM.colors.primary], ['14%', '75%', 7, PREMIUM.colors.cyan],
    ['47%', '84%', 4, PREMIUM.colors.rose],
  ] as const;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {dots.map(([left, top, size, color], index) => (
        <View key={index} style={[styles.dot, { left, top, width: size, height: size, borderRadius: size, backgroundColor: color }]} />
      ))}
      <Spark size={12} style={{ left: '36%', top: '13%' }} />
      <Spark size={8} color={PREMIUM.colors.cyan} style={{ right: '16%', top: '41%' }} />
      <Spark size={9} color={PREMIUM.colors.rose} style={{ left: '6%', bottom: '22%' }} />
    </View>
  );
}

function useReveal() {
  const opacity = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 560, easing: PREMIUM.motion.ease, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 560, easing: PREMIUM.motion.ease, useNativeDriver: true }),
    ]).start();
  }, [opacity, y]);
  return { opacity, transform: [{ translateY: y }] };
}

export default function CommandCenterUltraScreen() {
  const { width } = useWindowDimensions();
  const [locale, setLocale] = useState<AppLocale>('en');
  const [data, setData] = useState<DailyCommandCenterResponse | null>(null);
  const [nutrition, setNutrition] = useState<NutritionSummary | null>(null);
  const [plan, setPlan] = useState<PlanExecutionState | null>(null);
  const [trace, setTrace] = useState<DecisionTrace | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const reveal = useReveal();
  const rtl = isRTL(locale);
  const text = locale === 'fa' || locale.startsWith('fa-') ? ui.fa : ui.en;

  const load = useCallback(async () => {
    try {
      setError(null);
      const [daily, plans, traces, nutritionSummary] = await Promise.all([
        getDailyCommandCenter(),
        getPlanHistory(1),
        getDecisionTrace(),
        getNutritionSummary(),
      ]);
      setData(daily);
      setPlan(plans[0] ?? null);
      setTrace(traces[0] ?? null);
      setNutrition(nutritionSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your day.');
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
    }).catch((err) => {
      if (mounted) {
        setError(err instanceof Error ? err.message : 'Unable to start.');
        setLoading(false);
      }
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusy(null);
    }
  }, [load]);

  if (loading) return <UltraLoading />;
  if (!data && error) return <UltraError message={error} onRetry={() => void load()} />;

  const calories = Math.round(nutrition?.meals.calories ?? data?.nutrition.calories ?? 0);
  const protein = Math.round(nutrition?.meals.protein ?? data?.nutrition.protein ?? 0);
  const water = Math.round(data?.nutrition.waterMl ?? 0);
  const calorieGoal = nutrition?.goals.calories ?? null;
  const proteinGoal = nutrition?.goals.protein ?? null;
  const waterGoal = nutrition?.goals.waterMl ?? null;
  const compact = width < 370;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.canvas} pointerEvents="none">
        <View style={styles.backdropBerry} />
        <View style={styles.backdropRose} />
        <View style={styles.backdropAqua} />
        <View style={styles.backdropLilac} />
        <Confetti />
      </View>

      <Animated.ScrollView
        style={reveal}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl tintColor={PREMIUM.colors.gold} refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
        contentContainerStyle={[styles.content, compact && styles.contentCompact]}
      >
        <View style={[styles.topRow, rtl && styles.rowReverse]}>
          <View style={[styles.brandCluster, rtl && styles.alignRight]}>
            <View style={styles.brandPill}><Text style={styles.brandPillText}>MYPA</Text></View>
            <Text style={styles.topKicker}>{text.hello}</Text>
          </View>
          <Pressable onPress={() => router.push('/settings')} style={({ pressed }) => [styles.topButton, pressed && styles.pressed]}>
            <Ionicons name="options-outline" size={19} color={PREMIUM.colors.ink} />
          </Pressable>
        </View>

        <View style={styles.heroStage}>
          <View style={styles.ribbonLeft} />
          <View style={styles.ribbonRight} />
          <Bloom size={122} tone={PREMIUM.colors.primaryBright} style={styles.heroBloomA} />
          <Bloom size={84} tone={PREMIUM.colors.cyan} style={styles.heroBloomB} />
          <Bloom size={72} tone={PREMIUM.colors.lilac} style={styles.heroBloomC} />
          <View style={styles.heroPanel}>
            <View style={[styles.heroTag, rtl && styles.heroTagRTL]}>
              <View style={styles.statusLive} />
              <Text style={styles.heroTagText}>{text.assistant}</Text>
            </View>
            <View style={[styles.heroMain, rtl && styles.rowReverse]}>
              <View style={[styles.heroCopy, rtl && styles.alignRight]}>
                <Text style={styles.heroOverline}>PERSONAL LIFE STUDIO</Text>
                <Text style={[styles.heroTitle, rtl && styles.textRTL]}>{text.heroTitle}</Text>
                <Text style={[styles.heroHint, rtl && styles.textRTL]}>{text.heroHint}</Text>
              </View>
              <View style={styles.orbFrame}>
                <View style={styles.orbAura} />
                <AssistantVoiceOrb state="idle" label="" />
              </View>
            </View>
            <Pressable onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}>
              <View style={styles.heroButtonIcon}><Ionicons name="mic" size={16} color={PREMIUM.colors.ink} /></View>
              <Text style={styles.heroButtonText}>{text.talk}</Text>
              <Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={17} color={PREMIUM.colors.ink} />
            </Pressable>
          </View>
        </View>

        <SectionHeader label={text.priority} hint={text.balance} rtl={rtl} />
        <View style={styles.priorityDeck}>
          {(data?.priorities?.length ? data.priorities.slice(0, 3) : [text.empty]).map((item, index) => (
            <View key={`${item}-${index}`} style={[styles.priorityCard, index === 1 && styles.priorityCardRaised, index === 2 && styles.priorityCardLow]}>
              <View style={[styles.priorityAccent, { backgroundColor: [PREMIUM.colors.cyan, PREMIUM.colors.rose, PREMIUM.colors.gold][index % 3] }]} />
              <View style={styles.priorityNumber}><Text style={styles.priorityNumberText}>0{index + 1}</Text></View>
              <Text style={[styles.priorityText, rtl && styles.textRTL]}>{item}</Text>
              <Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={15} color={PREMIUM.colors.muted} />
            </View>
          ))}
        </View>

        <SectionHeader label={text.balance} hint="LIVE SNAPSHOT" rtl={rtl} />
        <View style={styles.balanceShell}>
          <BalanceArc label={text.calories} value={calories} goal={calorieGoal} unit="kcal" accent="primary" big />
          <View style={styles.balanceRail}>
            <BalanceMini label={text.protein} value={protein} goal={proteinGoal} unit="g" accent="cyan" />
            <BalanceMini label={text.water} value={water} goal={waterGoal} unit="ml" accent="mint" />
          </View>
        </View>

        <SectionHeader label={text.quick} hint="ONE TAP" rtl={rtl} />
        <View style={styles.quickGrid}>
          <QuickCard icon="water-outline" title={text.water} accent="cyan" busy={busy === 'water'} onPress={() => void runAction('water')} />
          <QuickCard icon="walk-outline" title={text.training} accent="mint" busy={busy === 'walk'} onPress={() => void runAction('walk')} />
          <QuickCard icon="barbell-outline" title={text.habits} accent="amber" busy={busy === 'strength'} onPress={() => void runAction('strength')} />
          <QuickCard icon="time-outline" title={text.reminder} accent="rose" busy={busy === 'reminder'} onPress={() => void runAction('reminder')} />
        </View>
        {actionMessage ? <View style={styles.toast}><View style={styles.toastDot} /><Text style={[styles.toastText, rtl && styles.textRTL]}>{actionMessage}</Text></View> : null}

        <SectionHeader label={text.next} hint="UP NEXT" rtl={rtl} />
        <View style={styles.nextStack}>
          <NextCard title={text.calendar} value={data?.calendar.next?.title ?? text.empty} meta={data?.calendar.next?.scheduledAt ?? ''} icon="calendar-outline" accent="lilac" onPress={() => router.push('/calendar')} rtl={rtl} />
          <NextCard title={text.reminder} value={data?.reminders.next?.title ?? text.empty} meta={data?.reminders.next?.scheduledAt ?? ''} icon="notifications-outline" accent="rose" onPress={() => router.push('/reminders')} rtl={rtl} />
        </View>

        <View style={styles.statMosaic}>
          <MosaicStat value={`${data?.habits.completed ?? 0}/${data?.habits.total ?? 0}`} label={text.habits} accent="mint" />
          <MosaicStat value={`${data?.workouts.countToday ?? 0}`} label={text.training} accent="amber" />
          <MosaicStat value={`${data?.supplements.taken ?? 0}/${data?.supplements.total ?? 0}`} label={text.supplements} accent="cyan" />
          <MosaicStat value={`${data?.notifications.unread ?? 0}`} label={text.unread} accent="rose" />
        </View>

        <PlanStatusCard plan={plan} rtl={rtl} />
        <DecisionTraceCard trace={trace} />

        {error ? <View style={styles.errorInline}><Text style={[styles.errorInlineTitle, rtl && styles.textRTL]}>Something changed</Text><Text style={[styles.errorInlineBody, rtl && styles.textRTL]}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.retryText}>{locale === 'fa' || locale.startsWith('fa-') ? 'تلاش دوباره' : 'Try again'}</Text></Pressable></View> : null}

        <Pressable onPress={() => router.push('/daily')} style={({ pressed }) => [styles.dayButton, pressed && styles.pressed]}>
          <Text style={styles.dayButtonText}>{text.daily}</Text>
          <Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={17} color={PREMIUM.colors.white} />
        </Pressable>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ label, hint, rtl }: { label: string; hint: string; rtl: boolean }) {
  return (
    <View style={[styles.sectionHeader, rtl && styles.rowReverse]}>
      <View style={[styles.sectionHeaderCopy, rtl && styles.alignRight]}>
        <Text style={[styles.sectionLabel, rtl && styles.textRTL]}>{label}</Text>
        <Text style={[styles.sectionHint, rtl && styles.textRTL]}>{hint}</Text>
      </View>
      <Bloom size={34} tone={PREMIUM.colors.primaryBright} center={PREMIUM.colors.gold} />
    </View>
  );
}

function BalanceArc({ label, value, goal, unit, accent, big = false }: { label: string; value: number; goal: number | null; unit: string; accent: Accent; big?: boolean }) {
  const percent = goal ? Math.max(0, Math.min(100, Math.round((value / goal) * 100))) : 0;
  return (
    <View style={styles.balanceMain}>
      <View style={[styles.arcOuter, { borderColor: PREMIUM.colors[accent] }]}>
        <View style={[styles.arcInner, { borderColor: `${PREMIUM.colors[accent]}30` }]}>
          <Text style={styles.arcPercent}>{goal ? `${percent}%` : '—'}</Text>
          <Text style={styles.arcValue}>{value}</Text>
          <Text style={styles.arcUnit}>{unit}</Text>
        </View>
      </View>
      <Text style={styles.balanceLabel}>{label}</Text>
      <View style={styles.balanceSpark}><Spark size={7} color={PREMIUM.colors[accentColor(accent)]} /></View>
    </View>
  );
}

function BalanceMini({ label, value, goal, unit, accent }: { label: string; value: number; goal: number | null; unit: string; accent: Accent }) {
  const percent = goal ? Math.max(0, Math.min(100, Math.round((value / goal) * 100))) : 0;
  return (
    <View style={styles.miniBalance}>
      <View style={[styles.miniRing, { borderColor: PREMIUM.colors[accent] }]}><Text style={styles.miniRingValue}>{value}</Text></View>
      <View style={styles.miniCopy}><Text style={styles.miniLabel}>{label}</Text><Text style={styles.miniUnit}>{goal ? `${percent}% of goal · ${unit}` : unit}</Text><View style={styles.miniTrack}><View style={[styles.miniFill, { width: `${percent}%`, backgroundColor: PREMIUM.colors[accent] }]} /></View></View>
    </View>
  );
}

function QuickCard({ icon, title, accent, busy, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; accent: Accent; busy: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={busy} style={({ pressed }) => [styles.quickCard, pressed && styles.pressed, { borderColor: `${PREMIUM.colors[accent]}55` }]}>
      <View style={[styles.quickIcon, { backgroundColor: `${PREMIUM.colors[accent]}16` }]}><Ionicons name={icon} size={18} color={PREMIUM.colors[accent]} /></View>
      <Text style={styles.quickTitle}>{busy ? '…' : title}</Text>
      <Ionicons name="add" size={15} color={PREMIUM.colors.muted} />
    </Pressable>
  );
}

function NextCard({ title, value, meta, icon, accent, onPress, rtl }: { title: string; value: string; meta: string; icon: keyof typeof Ionicons.glyphMap; accent: Accent; onPress: () => void; rtl: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.nextCard, pressed && styles.pressed, rtl && styles.rowReverse]}>
      <View style={[styles.nextIcon, { backgroundColor: `${PREMIUM.colors[accent]}14`, borderColor: `${PREMIUM.colors[accent]}55` }]}><Ionicons name={icon} size={19} color={PREMIUM.colors[accent]} /></View>
      <View style={[styles.nextCopy, rtl && styles.alignRight]}><Text style={[styles.nextTitle, rtl && styles.textRTL]}>{title}</Text><Text numberOfLines={1} style={[styles.nextValue, rtl && styles.textRTL]}>{value}</Text><Text style={[styles.nextMeta, rtl && styles.textRTL]}>{meta}</Text></View>
      <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={17} color={PREMIUM.colors.muted} />
    </Pressable>
  );
}

function MosaicStat({ value, label, accent }: { value: string; label: string; accent: Accent }) {
  return <View style={[styles.mosaicStat, { borderColor: `${PREMIUM.colors[accent]}45` }]}><View style={[styles.mosaicAccent, { backgroundColor: PREMIUM.colors[accent] }]} /><Text style={styles.mosaicValue}>{value}</Text><Text style={styles.mosaicLabel}>{label}</Text></View>;
}

function UltraLoading() {
  return <View style={styles.loading}><View style={styles.loadingBloom}><Bloom size={112} tone={PREMIUM.colors.primaryBright} /></View><Text style={styles.loadingBrand}>MYPA</Text><Text style={styles.loadingCaption}>personal life studio</Text><ActivityIndicator color={PREMIUM.colors.gold} style={{ marginTop: 22 }} /></View>;
}

function UltraError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <SafeAreaView style={styles.safe}><View style={styles.errorScreen}><Bloom size={86} tone={PREMIUM.colors.rose} /><Text style={styles.errorTitle}>MYPA hit a little pause.</Text><Text style={styles.errorBody}>{message}</Text><Pressable onPress={onRetry} style={styles.retryButton}><Text style={styles.retryText}>Try again</Text></Pressable></View></SafeAreaView>;
}

const accentColor = (accent: Accent) => accent === 'primary' ? 'primary' : accent;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PREMIUM.colors.canvas },
  canvas: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', backgroundColor: PREMIUM.colors.canvas },
  backdropBerry: { position: 'absolute', width: 420, height: 420, borderRadius: 210, right: -210, top: -190, backgroundColor: '#8C2F63', opacity: 0.19 },
  backdropRose: { position: 'absolute', width: 340, height: 340, borderRadius: 170, left: -200, top: 170, backgroundColor: '#FF7DAA', opacity: 0.13 },
  backdropAqua: { position: 'absolute', width: 280, height: 280, borderRadius: 140, right: -140, bottom: 60, backgroundColor: '#47D4CB', opacity: 0.09 },
  backdropLilac: { position: 'absolute', width: 300, height: 300, borderRadius: 150, left: -160, bottom: -120, backgroundColor: '#A98CE6', opacity: 0.11 },
  content: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 140, gap: 16 },
  contentCompact: { paddingHorizontal: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowReverse: { flexDirection: 'row-reverse' },
  alignRight: { alignItems: 'flex-end' },
  textRTL: { textAlign: 'right' },
  brandCluster: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandPill: { height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: PREMIUM.colors.berry, borderWidth: 1, borderColor: PREMIUM.colors.primaryBright, justifyContent: 'center' },
  brandPillText: { color: PREMIUM.colors.white, fontWeight: '900', fontSize: 12, letterSpacing: 1.6 },
  topKicker: { color: PREMIUM.colors.ink, fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  topButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: PREMIUM.colors.surfaceGlass, borderWidth: 1, borderColor: PREMIUM.colors.border, alignItems: 'center', justifyContent: 'center' },
  heroStage: { minHeight: 404, position: 'relative', marginTop: 3 },
  heroPanel: { marginTop: 18, borderRadius: 34, backgroundColor: '#38172B', borderWidth: 1, borderColor: 'rgba(255,255,255,0.11)', padding: 18, overflow: 'hidden', shadowColor: '#5B1D45', shadowOpacity: 0.35, shadowRadius: 30, shadowOffset: { width: 0, height: 18 }, elevation: 15 },
  heroTag: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  heroTagRTL: { alignSelf: 'flex-end' },
  statusLive: { width: 6, height: 6, borderRadius: 3, backgroundColor: PREMIUM.colors.cyan },
  heroTagText: { color: '#FFEAF4', fontSize: 8, fontWeight: '900', letterSpacing: 1.7 },
  heroMain: { minHeight: 235, flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  heroCopy: { flex: 1, paddingRight: 5 },
  heroOverline: { color: PREMIUM.colors.primaryBright, fontSize: 8, fontWeight: '900', letterSpacing: 1.7, marginBottom: 9 },
  heroTitle: { color: PREMIUM.colors.white, fontSize: 28, lineHeight: 34, fontWeight: '900', maxWidth: 235 },
  heroHint: { color: '#E6C8D8', fontSize: 11, lineHeight: 17, marginTop: 12, maxWidth: 235 },
  orbFrame: { width: 150, height: 190, alignItems: 'center', justifyContent: 'center' },
  orbAura: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(247,120,170,0.14)' },
  heroButton: { minHeight: 52, borderRadius: 26, paddingHorizontal: 10, backgroundColor: '#FFD4E4', flexDirection: 'row', alignItems: 'center', gap: 9 },
  heroButtonIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: PREMIUM.colors.white, alignItems: 'center', justifyContent: 'center' },
  heroButtonText: { flex: 1, color: PREMIUM.colors.ink, fontSize: 12, fontWeight: '900' },
  ribbonLeft: { position: 'absolute', width: 120, height: 220, left: -26, top: 60, borderTopLeftRadius: 80, borderBottomRightRadius: 80, backgroundColor: '#FFC7DC', opacity: 0.38, transform: [{ rotate: '20deg' }] },
  ribbonRight: { position: 'absolute', width: 110, height: 210, right: -24, top: 54, borderTopRightRadius: 70, borderBottomLeftRadius: 70, backgroundColor: '#B6F0E6', opacity: 0.28, transform: [{ rotate: '-18deg' }] },
  heroBloomA: { position: 'absolute', right: -8, top: -6, opacity: 0.34 },
  heroBloomB: { position: 'absolute', left: -12, bottom: 10, opacity: 0.26 },
  heroBloomC: { position: 'absolute', right: 80, bottom: -24, opacity: 0.18 },
  petal: { position: 'absolute', left: '50%', top: '50%' },
  bloomCore: { position: 'absolute', left: '50%', top: '50%', transform: [{ translateX: -1 }, { translateY: -1 }], borderWidth: 2, borderColor: 'rgba(255,255,255,0.66)' },
  spark: { position: 'absolute', borderWidth: 1.5, borderRadius: 2, transform: [{ rotate: '45deg' }], opacity: 0.72 },
  dot: { position: 'absolute', opacity: 0.65 },
  sectionHeader: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 3 },
  sectionHeaderCopy: { alignItems: 'flex-start' },
  sectionLabel: { color: PREMIUM.colors.ink, fontSize: 16, fontWeight: '900' },
  sectionHint: { color: PREMIUM.colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.5, marginTop: 3 },
  priorityDeck: { gap: 8 },
  priorityCard: { minHeight: 63, borderRadius: 22, backgroundColor: PREMIUM.colors.surfaceGlass, borderWidth: 1, borderColor: PREMIUM.colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10, shadowColor: PREMIUM.colors.berry, shadowOpacity: 0.10, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  priorityCardRaised: { transform: [{ translateX: 8 }], backgroundColor: '#FFF8FC' },
  priorityCardLow: { transform: [{ translateX: -4 }] },
  priorityAccent: { width: 5, height: 36, borderRadius: 3 },
  priorityNumber: { width: 33, height: 33, borderRadius: 17, backgroundColor: '#FFF0F6', borderWidth: 1, borderColor: PREMIUM.colors.border, alignItems: 'center', justifyContent: 'center' },
  priorityNumberText: { color: PREMIUM.colors.berry, fontSize: 10, fontWeight: '900' },
  priorityText: { flex: 1, color: PREMIUM.colors.inkSoft, fontSize: 12, lineHeight: 18, fontWeight: '800' },
  balanceShell: { borderRadius: 28, padding: 16, backgroundColor: '#2C1725', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', flexDirection: 'row', alignItems: 'center', gap: 14 },
  balanceMain: { width: 145, alignItems: 'center' },
  arcOuter: { width: 130, height: 130, borderRadius: 65, borderWidth: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.035)' },
  arcInner: { width: 104, height: 104, borderRadius: 52, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  arcPercent: { color: '#FFD2E3', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  arcValue: { color: PREMIUM.colors.white, fontSize: 25, fontWeight: '900', marginTop: 2 },
  arcUnit: { color: '#CFAFC1', fontSize: 9, fontWeight: '800', marginTop: 1 },
  balanceLabel: { color: '#FFE9F3', fontSize: 11, fontWeight: '900', marginTop: 8 },
  balanceSpark: { position: 'absolute', right: 5, top: 16 },
  balanceRail: { flex: 1, gap: 12 },
  miniBalance: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  miniRing: { width: 45, height: 45, borderRadius: 23, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  miniRingValue: { color: PREMIUM.colors.white, fontSize: 11, fontWeight: '900' },
  miniCopy: { flex: 1 },
  miniLabel: { color: '#FFE9F3', fontSize: 10, fontWeight: '900' },
  miniUnit: { color: '#CFAFC1', fontSize: 8, marginTop: 2 },
  miniTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 6, overflow: 'hidden' },
  miniFill: { height: '100%', borderRadius: 3 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  quickCard: { width: '48.3%', minHeight: 84, borderRadius: 20, backgroundColor: PREMIUM.colors.surfaceGlass, borderWidth: 1, padding: 12, justifyContent: 'space-between' },
  quickIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  quickTitle: { color: PREMIUM.colors.ink, fontSize: 11, fontWeight: '900' },
  toast: { marginTop: 4, minHeight: 42, borderRadius: 15, backgroundColor: '#FFF5F9', borderWidth: 1, borderColor: PREMIUM.colors.border, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  toastDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: PREMIUM.colors.cyan },
  toastText: { flex: 1, color: PREMIUM.colors.inkSoft, fontSize: 10, fontWeight: '700' },
  nextStack: { gap: 9 },
  nextCard: { minHeight: 83, borderRadius: 22, backgroundColor: PREMIUM.colors.surfaceGlass, borderWidth: 1, borderColor: PREMIUM.colors.border, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  nextIcon: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  nextCopy: { flex: 1, alignItems: 'flex-start' },
  nextTitle: { color: PREMIUM.colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  nextValue: { color: PREMIUM.colors.ink, fontSize: 12, fontWeight: '900', marginTop: 4 },
  nextMeta: { color: PREMIUM.colors.inkSoft, fontSize: 9, marginTop: 3 },
  statMosaic: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  mosaicStat: { width: '48.3%', minHeight: 80, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.70)', borderWidth: 1, padding: 12, overflow: 'hidden' },
  mosaicAccent: { position: 'absolute', width: 54, height: 54, borderRadius: 27, right: -15, top: -16, opacity: 0.13 },
  mosaicValue: { color: PREMIUM.colors.ink, fontSize: 20, fontWeight: '900' },
  mosaicLabel: { color: PREMIUM.colors.muted, fontSize: 9, fontWeight: '800', marginTop: 4 },
  errorInline: { borderRadius: 20, backgroundColor: '#FFF1F4', borderWidth: 1, borderColor: '#F5C5D4', padding: 14 },
  errorInlineTitle: { color: PREMIUM.colors.berry, fontSize: 12, fontWeight: '900' },
  errorInlineBody: { color: PREMIUM.colors.inkSoft, fontSize: 10, marginTop: 5 },
  retryText: { color: PREMIUM.colors.primary, fontWeight: '900', fontSize: 11, marginTop: 10 },
  dayButton: { minHeight: 56, borderRadius: 28, backgroundColor: PREMIUM.colors.berry, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: PREMIUM.colors.berry, shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  dayButtonText: { color: PREMIUM.colors.white, fontSize: 12, fontWeight: '900' },
  pressed: { opacity: 0.83, transform: [{ scale: 0.985 }] },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: PREMIUM.colors.canvas },
  loadingBloom: { width: 156, height: 156, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFE5EF', borderRadius: 78 },
  loadingBrand: { color: PREMIUM.colors.berry, fontSize: 26, fontWeight: '900', letterSpacing: 3, marginTop: 18 },
  loadingCaption: { color: PREMIUM.colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.7, marginTop: 6 },
  errorScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, backgroundColor: PREMIUM.colors.canvas },
  errorTitle: { color: PREMIUM.colors.ink, fontSize: 20, fontWeight: '900', marginTop: 16, textAlign: 'center' },
  errorBody: { color: PREMIUM.colors.muted, fontSize: 11, lineHeight: 17, marginTop: 8, textAlign: 'center' },
  retryButton: { marginTop: 18, paddingHorizontal: 18, minHeight: 44, borderRadius: 22, backgroundColor: PREMIUM.colors.berry, justifyContent: 'center' },
});
