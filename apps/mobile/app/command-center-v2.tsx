import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { DailyCommandCenterResponse, DecisionTrace, getDailyCommandCenter, getDecisionTrace, getNutritionSummary, getPlanHistory, hasAuthSession, NutritionSummary, PlanExecutionState } from '../lib/api';
import { AppLocale, getStoredLocale, isRTL } from '../lib/i18n';
import { runQuickCommand } from '../lib/command-actions';
import { PlanStatusCard } from '../components/plan-status-card';
import { DecisionTraceCard } from '../components/decision-trace-card';
import { PremiumGlow } from '../components/PremiumGlow';
import { AssistantVoiceOrb } from '../components/AssistantVoiceOrb';
import { PREMIUM } from '../lib/premium-ui';

const ui = {
  en: { greeting: 'Good to see you', assistant: 'Talk to MYPA', priorities: "What's important now", nutrition: "Today's balance", calories: 'Calories', protein: 'Protein', water: 'Water', quick: 'Quick', reminder: 'Next reminder', calendar: 'Next event', habits: 'Habits', workouts: 'Training', supplements: 'Supplements', unread: 'unread', done: 'done', none: 'Nothing urgent right now.', retry: 'Try again', daily: 'Open daily view', voiceHint: 'Tap the core and just talk', success: 'Done', error: 'We could not load your day.' },
  fa: { greeting: 'خوش اومدی', assistant: 'با MYPA حرف بزن', priorities: 'الان چی مهمه؟', nutrition: 'وضعیت امروز', calories: 'کالری', protein: 'پروتئین', water: 'آب', quick: 'دسترسی سریع', reminder: 'یادآوری بعدی', calendar: 'رویداد بعدی', habits: 'عادت‌ها', workouts: 'تمرین', supplements: 'مکمل‌ها', unread: 'خوانده‌نشده', done: 'انجام‌شده', none: 'فعلاً کار فوری‌ای نداری.', retry: 'دوباره تلاش کن', daily: 'نمای روزانه', voiceHint: 'روی هسته بزن و فقط حرف بزن', success: 'انجام شد', error: 'نتوانستیم وضعیت امروزت را بارگذاری کنیم.' },
} as const;

type Accent = 'primary' | 'cyan' | 'mint' | 'amber' | 'rose';

function useEntryAnimation() {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 520, easing: PREMIUM.motion.ease, useNativeDriver: true }),
      Animated.timing(translate, { toValue: 0, duration: 520, easing: PREMIUM.motion.ease, useNativeDriver: true }),
    ]).start();
  }, [opacity, translate]);
  return { opacity, transform: [{ translateY: translate }] };
}

export default function CommandCenterScreen() {
  const [locale, setLocale] = useState<AppLocale>('en');
  const [data, setData] = useState<DailyCommandCenterResponse | null>(null);
  const [nutrition, setNutrition] = useState<NutritionSummary | null>(null);
  const [plan, setPlan] = useState<PlanExecutionState | null>(null);
  const [trace, setTrace] = useState<DecisionTrace | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const entry = useEntryAnimation();

  const load = useCallback(async () => {
    try {
      setError(null);
      const [daily, plans, traces, nutritionSummary] = await Promise.all([getDailyCommandCenter(), getPlanHistory(1), getDecisionTrace(), getNutritionSummary()]);
      setData(daily); setPlan(plans[0] ?? null); setTrace(traces[0] ?? null); setNutrition(nutritionSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your command center.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    let mounted = true;
    void Promise.all([getStoredLocale(), hasAuthSession()]).then(async ([stored, authenticated]) => {
      if (!mounted) return;
      if (stored) setLocale(stored);
      if (!authenticated) { router.replace('/auth'); return; }
      await load();
    }).catch((err) => { if (mounted) { setError(err instanceof Error ? err.message : 'Unable to start.'); setLoading(false); } });
    return () => { mounted = false; };
  }, [load]);

  const text = ui[locale === 'fa' || locale.startsWith('fa-') ? 'fa' : 'en'];
  const rtl = isRTL(locale);
  const runAction = useCallback(async (key: 'water' | 'walk' | 'strength' | 'reminder') => {
    try { setBusyAction(key); setActionMessage(null); const result = await runQuickCommand(key); setActionMessage(result.message); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Action failed.'); }
    finally { setBusyAction(null); }
  }, [load]);

  if (loading) return <PremiumLoading />;
  if (!data && error) return <PremiumError message={error} label={text.error} retry={text.retry} onRetry={() => void load()} />;

  const calorieGoal = nutrition?.goals.calories ?? null;
  const proteinGoal = nutrition?.goals.protein ?? null;
  const waterGoal = nutrition?.goals.waterMl ?? null;
  const calories = Math.round(nutrition?.meals.calories ?? data?.nutrition.calories ?? 0);
  const protein = Math.round(nutrition?.meals.protein ?? data?.nutrition.protein ?? 0);
  const water = waterGoal === null ? Math.round(data?.nutrition.waterMl ?? 0) : Math.max(0, Math.round(waterGoal - (nutrition?.remaining.waterMl ?? waterGoal)));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.background} pointerEvents="none">
        <PremiumGlow size={300} opacity={0.13} accent="primary" />
        <View style={styles.backgroundBlobA} />
        <View style={styles.backgroundBlobB} />
      </View>
      <Animated.ScrollView
        style={entry}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl tintColor={PREMIUM.colors.primaryBright} refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      >
        <View style={[styles.topBar, rtl && styles.rtlRow]}>
          <View style={styles.topCopy}>
            <Text style={styles.kicker}>MYPA · PERSONAL OPERATING SYSTEM</Text>
            <Text style={[styles.greeting, rtl && styles.rtlText]}>{text.greeting}</Text>
            <Text style={[styles.subline, rtl && styles.rtlText]}>{data?.primaryGoal ?? data?.dateKey ?? ''}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={text.assistant} onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.profileCore, pressed && styles.pressed]}>
            <Text style={styles.profileCoreText}>M</Text>
          </Pressable>
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.hero, pressed && styles.pressed]}>
          <View style={styles.heroGlow} />
          <View style={[styles.heroContent, rtl && styles.rtlRow]}>
            <View style={styles.heroCopy}><Text style={[styles.heroEyebrow, rtl && styles.rtlText]}>{text.assistant}</Text><Text style={[styles.heroTitle, rtl && styles.rtlText]}>{rtl ? 'بگو. MYPA بقیه‌ش رو انجام می‌ده.' : 'Say it. MYPA handles the rest.'}</Text><Text style={[styles.heroHint, rtl && styles.rtlText]}>{text.voiceHint}</Text></View>
            <View style={styles.heroOrb}><AssistantVoiceOrb state="idle" label="" /></View>
          </View>
          <View style={styles.heroFooter}><Text style={styles.heroFooterText}>{rtl ? 'صدا، context، برنامه‌ها و کارها؛ همه یکجا.' : 'Voice, context, plans and actions — one place.'}</Text><Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={18} color={PREMIUM.colors.primaryBright} /></View>
        </Pressable>

        <SectionTitle title={text.priorities} rtl={rtl} />
        <View style={styles.priorityShell}>
          {data?.priorities?.length ? data.priorities.slice(0, 3).map((item, index) => <Priority key={`${item}-${index}`} index={index} text={item} rtl={rtl} accent={(['cyan','mint','amber'] as Accent[])[index % 3]} />) : <Text style={styles.muted}>{text.none}</Text>}
        </View>

        <SectionTitle title={text.nutrition} rtl={rtl} />
        <View style={styles.nutritionHero}>
          <Metric label={text.calories} value={calories} goal={calorieGoal} unit="kcal" accent="primary" />
          <Metric label={text.protein} value={protein} goal={proteinGoal} unit="g" accent="cyan" />
          <Metric label={text.water} value={water} goal={waterGoal} unit="ml" accent="mint" />
        </View>

        <SectionTitle title={text.quick} rtl={rtl} />
        <View style={styles.quickStrip}>
          {([['water', 'water-outline', text.water, 'cyan'], ['walk', 'walk-outline', text.workouts, 'mint'], ['strength', 'barbell-outline', text.habits, 'amber'], ['reminder', 'time-outline', text.reminder, 'rose']] as const).map(([key, icon, label, accent]) => (
            <Pressable key={key} accessibilityRole="button" disabled={!!busyAction} onPress={() => void runAction(key)} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed, busyAction === key && styles.quickBusy]}>
              <View style={[styles.quickIcon, { borderColor: PREMIUM.colors[accent] }]}><Ionicons name={icon as never} size={18} color={PREMIUM.colors[accent]} /></View>
              <Text style={styles.quickText}>{busyAction === key ? '…' : label}</Text>
            </Pressable>
          ))}
        </View>
        {actionMessage ? <Text style={[styles.actionMessage, rtl && styles.rtlText]}>{text.success} · {actionMessage}</Text> : null}

        <View style={styles.twoCol}>
          <MiniStat title={text.habits} value={`${data?.habits.completed ?? 0}/${data?.habits.total ?? 0}`} accent="mint" />
          <MiniStat title={text.workouts} value={`${data?.workouts.countToday ?? 0}`} accent="amber" />
          <MiniStat title={text.supplements} value={`${data?.supplements.taken ?? 0}/${data?.supplements.total ?? 0}`} accent="cyan" />
          <MiniStat title={text.unread} value={`${data?.notifications.unread ?? 0}`} accent="rose" />
        </View>

        <ActionRow title={text.reminder} value={data?.reminders.next?.title ?? text.none} meta={data?.reminders.next?.scheduledAt ?? ''} icon="notifications-outline" onPress={() => router.push('/reminders')} rtl={rtl} />
        <ActionRow title={text.calendar} value={data?.calendar.next?.title ?? text.none} meta={data?.calendar.next?.scheduledAt ?? ''} icon="calendar-outline" onPress={() => router.push('/calendar')} rtl={rtl} />
        <PlanStatusCard plan={plan} rtl={rtl} />
        <DecisionTraceCard trace={trace} />
        {error ? <View style={styles.inlineError}><Text style={[styles.inlineErrorTitle, rtl && styles.rtlText]}>{text.error}</Text><Text style={[styles.inlineErrorBody, rtl && styles.rtlText]}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.retryText}>{text.retry}</Text></Pressable></View> : null}
        <Pressable accessibilityRole="button" onPress={() => router.push('/daily')} style={({ pressed }) => [styles.dailyButton, pressed && styles.pressed]}><Text style={styles.dailyButtonText}>{text.daily}</Text><Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} color={PREMIUM.colors.ink} size={16} /></Pressable>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function PremiumLoading() { return <View style={styles.loading}><PremiumGlow size={240} opacity={0.17}/><View style={styles.loadingCore}><Text style={styles.loadingMark}>M</Text></View><Text style={styles.loadingTitle}>MYPA</Text><ActivityIndicator color={PREMIUM.colors.primaryBright} style={{ marginTop: 18 }} /></View>; }
function PremiumError({ message, label, retry, onRetry }: { message: string; label: string; retry: string; onRetry: () => void }) { return <SafeAreaView style={styles.safe}><View style={styles.errorScreen}><PremiumGlow size={220} opacity={0.12} accent="rose"/><View style={styles.errorCore}><Ionicons name="alert-outline" size={28} color={PREMIUM.colors.rose}/></View><Text style={styles.errorTitle}>{label}</Text><Text style={styles.errorBody}>{message}</Text><Pressable onPress={onRetry} style={styles.retryButton}><Text style={styles.retryText}>{retry}</Text></Pressable></View></SafeAreaView>; }
function SectionTitle({ title, rtl }: { title: string; rtl: boolean }) { return <View style={[styles.sectionTitle, rtl && styles.rtlRow]}><Text style={[styles.sectionTitleText, rtl && styles.rtlText]}>{title}</Text><View style={styles.sectionRule}/></View>; }
function Priority({ index, text, rtl, accent }: { index: number; text: string; rtl: boolean; accent: Accent }) { return <View style={[styles.priority, rtl && styles.rtlRow]}><View style={[styles.priorityIndex, { borderColor: PREMIUM.colors[accent] }]}><Text style={[styles.priorityIndexText, { color: PREMIUM.colors[accent] }]}>{String(index + 1).padStart(2, '0')}</Text></View><Text style={[styles.priorityText, rtl && styles.rtlText]}>{text}</Text><Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={15} color={PREMIUM.colors.muted}/></View>; }
function Metric({ label, value, goal, unit, accent }: { label: string; value: number; goal: number | null; unit: string; accent: Accent }) { const percent = goal ? Math.max(0, Math.min(100, Math.round(value / goal * 100))) : 0; return <View style={styles.metric}><View style={[styles.metricOrb, { borderColor: PREMIUM.colors[accent] }]}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricUnit}>{unit}</Text></View><Text style={styles.metricLabel}>{label}</Text><View style={styles.metricTrack}><View style={[styles.metricFill, { backgroundColor: PREMIUM.colors[accent], width: `${percent}%` }]} /></View><Text style={styles.metricMeta}>{goal ? `${percent}%` : '—'}</Text></View>; }
function MiniStat({ title, value, accent }: { title: string; value: string; accent: Accent }) { return <View style={styles.miniStat}><View style={[styles.miniDot, { backgroundColor: PREMIUM.colors[accent] }]} /><Text style={styles.miniTitle}>{title}</Text><Text style={styles.miniValue}>{value}</Text></View>; }
function ActionRow({ title, value, meta, icon, onPress, rtl }: { title: string; value: string; meta: string; icon: any; onPress: () => void; rtl: boolean }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.actionRow, pressed && styles.pressed, rtl && styles.rtlRow]}><View style={styles.actionIcon}><Ionicons name={icon} size={18} color={PREMIUM.colors.primaryBright}/></View><View style={styles.actionCopy}><Text style={[styles.actionTitle, rtl && styles.rtlText]}>{title}</Text><Text style={[styles.actionValue, rtl && styles.rtlText]}>{value}</Text>{meta ? <Text style={[styles.actionMeta, rtl && styles.rtlText]}>{meta}</Text> : null}</View><Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={17} color={PREMIUM.colors.muted}/></Pressable>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PREMIUM.colors.canvas },
  background: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', backgroundColor: PREMIUM.colors.canvas },
  backgroundBlobA: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: PREMIUM.colors.primary, opacity: 0.07, top: -110, right: -100 },
  backgroundBlobB: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: PREMIUM.colors.cyan, opacity: 0.045, bottom: 80, left: -110 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 42, gap: 16 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  rtlRow: { flexDirection: 'row-reverse' },
  topCopy: { flex: 1 },
  kicker: { color: PREMIUM.colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.6 },
  greeting: { color: PREMIUM.colors.ink, fontSize: 28, fontWeight: '900', marginTop: 5 },
  subline: { color: PREMIUM.colors.muted, fontSize: 12, marginTop: 4 },
  profileCore: { width: 46, height: 46, borderRadius: 23, backgroundColor: PREMIUM.colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: PREMIUM.colors.border, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  profileCoreText: { color: PREMIUM.colors.primaryBright, fontSize: 17, fontWeight: '900' },
  hero: { backgroundColor: 'rgba(18,24,40,0.92)', borderRadius: 30, borderWidth: 1, borderColor: PREMIUM.colors.border, overflow: 'hidden', minHeight: 250 },
  heroGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: PREMIUM.colors.primary, opacity: 0.11, right: -120, top: -110 },
  heroContent: { flexDirection: 'row', alignItems: 'center', padding: 18, minHeight: 200 },
  heroCopy: { flex: 1, paddingRight: 4 },
  heroEyebrow: { color: PREMIUM.colors.primaryBright, fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
  heroTitle: { color: PREMIUM.colors.ink, fontSize: 24, lineHeight: 30, fontWeight: '900', marginTop: 8 },
  heroHint: { color: PREMIUM.colors.muted, fontSize: 12, lineHeight: 18, marginTop: 10 },
  heroOrb: { width: 145, height: 185, alignItems: 'center', justifyContent: 'center', marginRight: -16 },
  heroFooter: { borderTopWidth: 1, borderTopColor: PREMIUM.colors.border, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroFooterText: { color: PREMIUM.colors.inkSoft, fontSize: 11, flex: 1, paddingRight: 12 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  sectionTitleText: { color: PREMIUM.colors.ink, fontSize: 14, fontWeight: '900' },
  sectionRule: { height: 1, backgroundColor: PREMIUM.colors.border, flex: 1 },
  priorityShell: { backgroundColor: PREMIUM.colors.surfaceGlass, borderRadius: 22, borderWidth: 1, borderColor: PREMIUM.colors.border, overflow: 'hidden' },
  priority: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12, borderBottomWidth: 1, borderBottomColor: PREMIUM.colors.border },
  priorityIndex: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.02)' },
  priorityIndexText: { fontSize: 10, fontWeight: '900' },
  priorityText: { color: PREMIUM.colors.inkSoft, flex: 1, fontSize: 13, lineHeight: 18 },
  nutritionHero: { backgroundColor: PREMIUM.colors.surfaceGlass, borderWidth: 1, borderColor: PREMIUM.colors.border, borderRadius: 24, padding: 16, flexDirection: 'row', gap: 10 },
  metric: { flex: 1, alignItems: 'center' },
  metricOrb: { width: 70, height: 70, borderRadius: 35, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  metricValue: { color: PREMIUM.colors.ink, fontSize: 17, fontWeight: '900' },
  metricUnit: { color: PREMIUM.colors.muted, fontSize: 8, marginTop: 1 },
  metricLabel: { color: PREMIUM.colors.inkSoft, fontSize: 10, fontWeight: '800', marginTop: 8 },
  metricTrack: { width: '100%', height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginTop: 8 },
  metricFill: { height: '100%', borderRadius: 2 },
  metricMeta: { color: PREMIUM.colors.muted, fontSize: 9, marginTop: 5 },
  quickStrip: { flexDirection: 'row', gap: 8 },
  quickAction: { flex: 1, minHeight: 82, backgroundColor: PREMIUM.colors.surfaceGlass, borderWidth: 1, borderColor: PREMIUM.colors.border, borderRadius: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  quickIcon: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.02)' },
  quickText: { color: PREMIUM.colors.inkSoft, fontSize: 9, fontWeight: '800', marginTop: 6, textAlign: 'center' },
  quickBusy: { opacity: 0.56 },
  actionMessage: { color: PREMIUM.colors.mint, fontSize: 11, marginTop: -6 },
  twoCol: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  miniStat: { width: '48.5%', minHeight: 92, borderRadius: 20, backgroundColor: PREMIUM.colors.surfaceGlass, borderWidth: 1, borderColor: PREMIUM.colors.border, padding: 14 },
  miniDot: { width: 7, height: 7, borderRadius: 4, marginBottom: 10 },
  miniTitle: { color: PREMIUM.colors.muted, fontSize: 10, fontWeight: '800' },
  miniValue: { color: PREMIUM.colors.ink, fontSize: 22, fontWeight: '900', marginTop: 5 },
  actionRow: { minHeight: 82, borderRadius: 22, backgroundColor: PREMIUM.colors.surfaceGlass, borderWidth: 1, borderColor: PREMIUM.colors.border, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  actionIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(139,124,255,0.10)', alignItems: 'center', justifyContent: 'center' },
  actionCopy: { flex: 1 },
  actionTitle: { color: PREMIUM.colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  actionValue: { color: PREMIUM.colors.ink, fontSize: 13, fontWeight: '800', marginTop: 5 },
  actionMeta: { color: PREMIUM.colors.muted, fontSize: 10, marginTop: 3 },
  inlineError: { borderRadius: 20, padding: 14, backgroundColor: 'rgba(255,125,154,0.08)', borderWidth: 1, borderColor: 'rgba(255,125,154,0.18)' },
  inlineErrorTitle: { color: PREMIUM.colors.rose, fontWeight: '900', fontSize: 12 },
  inlineErrorBody: { color: PREMIUM.colors.inkSoft, fontSize: 11, marginTop: 5 },
  retryText: { color: PREMIUM.colors.primaryBright, fontWeight: '900', fontSize: 11, marginTop: 8 },
  dailyButton: { minHeight: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: PREMIUM.colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dailyButtonText: { color: PREMIUM.colors.ink, fontSize: 12, fontWeight: '900' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: PREMIUM.colors.canvas },
  loadingCore: { width: 78, height: 78, borderRadius: 39, backgroundColor: PREMIUM.colors.surfaceElevated, borderWidth: 1, borderColor: PREMIUM.colors.primary, alignItems: 'center', justifyContent: 'center' },
  loadingMark: { color: PREMIUM.colors.primaryBright, fontSize: 28, fontWeight: '900' },
  loadingTitle: { color: PREMIUM.colors.ink, fontSize: 16, fontWeight: '900', marginTop: 14, letterSpacing: 1 },
  errorScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: PREMIUM.colors.canvas },
  errorCore: { width: 70, height: 70, borderRadius: 35, borderWidth: 1, borderColor: 'rgba(255,125,154,0.35)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,125,154,0.08)' },
  errorTitle: { color: PREMIUM.colors.ink, fontSize: 20, fontWeight: '900', marginTop: 16, textAlign: 'center' },
  errorBody: { color: PREMIUM.colors.muted, fontSize: 12, lineHeight: 18, marginTop: 8, textAlign: 'center' },
  retryButton: { marginTop: 18, minHeight: 48, paddingHorizontal: 22, borderRadius: 16, backgroundColor: PREMIUM.colors.primary, alignItems: 'center', justifyContent: 'center' },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.85 },
  muted: { color: PREMIUM.colors.muted, fontSize: 11, padding: 14 },
  rtlText: { textAlign: 'right' },
});
