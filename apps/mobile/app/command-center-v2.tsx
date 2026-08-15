import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { AppLocale, getStoredLocale } from '../lib/i18n';
import { runQuickCommand } from '../lib/command-actions';
import { PlanStatusCard } from '../components/plan-status-card';
import { DecisionTraceCard } from '../components/decision-trace-card';
import { BRAND } from '../lib/branding';

const ui = {
  en: {
    eyebrow: 'PERSONAL COMMAND CENTER', assistant: 'Talk to your assistant', priorities: "Today's priorities",
    nutrition: "Today's balance", habits: 'Habits', supplements: 'Supplements', reminders: 'Next reminder', calendar: 'Next event',
    workouts: 'Training', notifications: 'Notifications', none: 'Nothing urgent right now.', unread: 'unread', done: 'done',
    daily: 'Daily view', retry: 'Retry', quick: 'Quick actions', water: 'Log water', walk: 'Log walk', strength: 'Log strength',
    reminder: 'Add reminder', success: 'Done', nutritionDetail: 'Nutrition detail', calories: 'Calories', protein: 'Protein',
    waterDetail: 'Water', open: 'Open', loadError: 'We could not load your command center.', refreshHint: 'Pull to refresh',
  },
  fa: {
    eyebrow: 'مرکز فرمان دستیار من', assistant: 'با دستیار صحبت کن', priorities: 'اولویت‌های امروز', nutrition: 'وضعیت امروز',
    habits: 'عادت‌ها', supplements: 'مکمل‌ها', reminders: 'یادآوری بعدی', calendar: 'رویداد بعدی', workouts: 'تمرین',
    notifications: 'اعلان‌ها', none: 'فعلاً کار فوری‌ای نداری.', unread: 'خوانده‌نشده', done: 'انجام‌شده', daily: 'نمای روزانه',
    retry: 'تلاش دوباره', quick: 'دسترسی‌های سریع', water: 'ثبت آب', walk: 'ثبت پیاده‌روی', strength: 'ثبت تمرین قدرتی',
    reminder: 'افزودن یادآوری', success: 'انجام شد', nutritionDetail: 'جزئیات تغذیه', calories: 'کالری', protein: 'پروتئین',
    waterDetail: 'آب', open: 'باز کردن', loadError: 'نتوانستیم مرکز فرمان را بارگذاری کنیم.', refreshHint: 'برای به‌روزرسانی بکشید',
  },
} as const;

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
      setError(err instanceof Error ? err.message : 'Unable to load your command center.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void Promise.all([getStoredLocale(), hasAuthSession()]).then(async ([stored, authenticated]) => {
      if (!mounted) return;
      if (stored) setLocale(stored);
      if (!authenticated) {
        router.replace('/auth');
        return;
      }
      await load();
    }).catch((err) => {
      if (mounted) setError(err instanceof Error ? err.message : 'Unable to start the command center.');
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [load]);

  const text = ui[locale];
  const rtl = locale === 'fa';
  const runAction = useCallback(async (key: 'water' | 'walk' | 'strength' | 'reminder') => {
    try {
      setBusyAction(key);
      setActionMessage(null);
      const result = await runQuickCommand(key);
      setActionMessage(result.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusyAction(null);
    }
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center} accessibilityLabel="Loading command center">
        <View style={styles.loadingMark}><Text style={styles.loadingMarkText}>M</Text></View>
        <Text style={styles.loadingTitle}>My Personal Assistant</Text>
        <ActivityIndicator color={BRAND.colors.primaryStrong} style={styles.loadingSpinner} />
      </View>
    );
  }

  const calorieGoal = nutrition?.goals.calories ?? null;
  const proteinGoal = nutrition?.goals.protein ?? null;
  const waterGoal = nutrition?.goals.waterMl ?? null;
  const calories = Math.round(nutrition?.meals.calories ?? data?.nutrition.calories ?? 0);
  const protein = Math.round(nutrition?.meals.protein ?? data?.nutrition.protein ?? 0);
  const water = waterGoal === null ? Math.round(nutrition?.meals.count ? data?.nutrition.waterMl ?? 0 : data?.nutrition.waterMl ?? 0) : Math.max(0, Math.round(waterGoal - (nutrition?.remaining.waterMl ?? waterGoal)));

  if (!data && error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorScreen}>
          <View style={styles.errorMark}><Text style={styles.errorMarkText}>!</Text></View>
          <Text style={styles.errorTitle}>{text.loadError}</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => void load()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{text.retry}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      >
        <View style={[styles.header, rtl && styles.rtl]}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>{text.eyebrow}</Text>
            <Text style={styles.greeting}>{data?.greeting ?? (rtl ? 'سلام 👋' : 'Hello 👋')}</Text>
            <Text style={styles.date}>{data?.dateKey}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={text.assistant} onPress={() => router.push('/assistant')} style={styles.brainButton}>
            <Text style={styles.brainLetter}>M</Text>
          </Pressable>
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.assistantCard, pressed && styles.pressed]}>
          <View style={styles.assistantIcon}><Text style={styles.assistantLetter}>+</Text></View>
          <View style={styles.assistantCopy}>
            <Text style={styles.assistantTitle}>{text.assistant}</Text>
            <Text style={styles.assistantSubtitle}>{data?.primaryGoal ?? text.none}</Text>
          </View>
          <Text style={styles.arrow}>{rtl ? '←' : '→'}</Text>
        </Pressable>

        <PlanStatusCard plan={plan} rtl={rtl} />
        <DecisionTraceCard trace={trace} />

        <Section title={text.priorities} rtl={rtl}>
          {data?.priorities.length ? data.priorities.slice(0, 4).map((item, index) => (
            <View key={`${item}-${index}`} style={styles.priorityRow}>
              <View style={styles.priorityDot}><Text style={styles.priorityNumber}>{index + 1}</Text></View>
              <Text style={styles.priorityText}>{item}</Text>
            </View>
          )) : <EmptyText text={text.none} />}
        </Section>

        <Section title={text.nutritionDetail} rtl={rtl} action={text.open} onAction={() => router.push('/daily')}>
          <View style={styles.nutritionGrid}>
            <NutritionMetric label={text.calories} value={calories} goal={calorieGoal} unit="kcal" />
            <NutritionMetric label={text.protein} value={protein} goal={proteinGoal} unit="g" />
            <NutritionMetric label={text.waterDetail} value={water} goal={waterGoal} unit="ml" />
          </View>
          <Text style={styles.muted}>{nutrition?.status.calories ?? text.none} · {nutrition?.status.protein ?? ''}</Text>
        </Section>

        <Section title={text.quick} rtl={rtl}>
          <View style={styles.quickGrid}>
            {([
              ['water', text.water, 'W'], ['walk', text.walk, 'A'], ['strength', text.strength, 'S'], ['reminder', text.reminder, 'R'],
            ] as const).map(([key, label, mark]) => (
              <Pressable
                accessibilityRole="button"
                key={key}
                disabled={!!busyAction}
                onPress={() => void runAction(key)}
                style={({ pressed }) => [styles.quickButton, pressed && styles.pressed, busyAction === key && styles.quickBusy]}
              >
                <View style={styles.quickMark}><Text style={styles.quickMarkText}>{busyAction === key ? '…' : mark}</Text></View>
                <Text style={styles.quickLabel}>{label}</Text>
              </Pressable>
            ))}
          </View>
          {actionMessage ? <Text style={styles.actionSuccess}>{text.success} · {actionMessage}</Text> : null}
        </Section>

        <View style={styles.grid}>
          <MetricCard title={text.nutrition} value={`${calories}`} helper={locale === 'fa' ? 'کالری' : 'kcal'} />
          <MetricCard title={text.habits} value={`${data?.habits.completed ?? 0}/${data?.habits.total ?? 0}`} helper={text.done} />
          <MetricCard title={text.supplements} value={`${data?.supplements.taken ?? 0}/${data?.supplements.total ?? 0}`} helper={text.done} />
          <MetricCard title={text.workouts} value={`${data?.workouts.countToday ?? 0}`} helper={locale === 'fa' ? 'امروز' : 'today'} />
        </View>

        <ActionCard title={text.reminders} value={data?.reminders.next?.title ?? text.none} meta={data?.reminders.next?.scheduledAt ?? ''} onPress={() => router.push('/reminders')} rtl={rtl} />
        <ActionCard title={text.calendar} value={data?.calendar.next?.title ?? text.none} meta={data?.calendar.next?.scheduledAt ?? ''} onPress={() => router.push('/calendar')} rtl={rtl} />

        <Pressable accessibilityRole="button" onPress={() => router.push('/notifications')} style={({ pressed }) => [styles.notificationCard, pressed && styles.pressed, rtl && styles.rtl]}>
          <View style={styles.notificationMark}><Text style={styles.notificationMarkText}>N</Text></View>
          <View style={styles.notificationCopy}><Text style={styles.notificationTitle}>{text.notifications}</Text><Text style={styles.notificationSubtitle}>{data?.notifications.unread ?? 0} {text.unread}</Text></View>
          <Text style={styles.notificationArrow}>{rtl ? '←' : '→'}</Text>
        </Pressable>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorCardTitle}>{text.loadError}</Text>
            <Text style={styles.muted}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>{text.retry}</Text></Pressable>
          </View>
        ) : null}

        <Pressable accessibilityRole="button" onPress={() => router.push('/daily')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
          <Text style={styles.secondaryButtonText}>{text.daily}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, action, onAction, rtl, children }: { title: string; action?: string; onAction?: () => void; rtl: boolean; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={[styles.rowBetween, rtl && styles.rtl]}>
        <Text style={styles.cardTitle}>{title}</Text>
        {action && onAction ? <Pressable accessibilityRole="button" onPress={onAction}><Text style={styles.openLink}>{action} →</Text></Pressable> : null}
      </View>
      {children}
    </View>
  );
}

function NutritionMetric({ label, value, goal, unit }: { label: string; value: number; goal: number | null; unit: string }) {
  const percent = goal ? Math.max(0, Math.min(100, Math.round((value / goal) * 100))) : 0;
  return (
    <View style={styles.nutritionMetric}>
      <Text style={styles.metricTitle}>{label}</Text>
      <Text style={styles.metricValue}>{value}<Text style={styles.metricUnit}> {unit}</Text></Text>
      <View style={styles.track}><View style={[styles.trackFill, { width: `${percent}%` }]} /></View>
      <Text style={styles.metricHelper}>{goal ? `${percent}% of ${Math.round(goal)} ${unit}` : 'No goal'}</Text>
    </View>
  );
}

function MetricCard({ title, value, helper }: { title: string; value: string; helper: string }) {
  return <View style={styles.metric}><View style={styles.metricDot} /><Text style={styles.metricTitle}>{title}</Text><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricHelper}>{helper}</Text></View>;
}

function ActionCard({ title, value, meta, onPress, rtl }: { title: string; value: string; meta: string; onPress: () => void; rtl: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.actionCard, pressed && styles.pressed, rtl && styles.rtl]}>
      <View style={styles.actionCopy}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionValue}>{value}</Text>{meta ? <Text style={styles.actionMeta}>{meta}</Text> : null}</View>
      <Text style={styles.actionArrow}>{rtl ? '←' : '→'}</Text>
    </Pressable>
  );
}

function EmptyText({ text }: { text: string }) { return <Text style={styles.muted}>{text}</Text>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.colors.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.colors.canvas },
  content: { padding: 20, gap: 14, paddingBottom: 36 },
  loadingMark: { width: 72, height: 72, borderRadius: 22, backgroundColor: BRAND.colors.startup, alignItems: 'center', justifyContent: 'center' },
  loadingMarkText: { color: BRAND.colors.white, fontWeight: '900', fontSize: 28 },
  loadingTitle: { color: BRAND.colors.ink, fontWeight: '900', fontSize: 18, marginTop: 14 },
  loadingSpinner: { marginTop: 14 },
  errorScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  errorMark: { width: 72, height: 72, borderRadius: 22, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  errorMarkText: { color: '#B42318', fontSize: 28, fontWeight: '900' },
  errorTitle: { color: BRAND.colors.ink, fontSize: 20, fontWeight: '900', textAlign: 'center', marginTop: 16 },
  errorBody: { color: BRAND.colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rtl: { direction: 'rtl' },
  headerCopy: { flex: 1 },
  eyebrow: { color: BRAND.colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  greeting: { color: BRAND.colors.ink, fontSize: 30, fontWeight: '900', marginTop: 5 },
  date: { color: '#9CA3AF', marginTop: 4, fontSize: 12 },
  brainButton: { width: 52, height: 52, borderRadius: 18, backgroundColor: BRAND.colors.ink, alignItems: 'center', justifyContent: 'center' },
  brainLetter: { color: BRAND.colors.white, fontSize: 18, fontWeight: '900' },
  assistantCard: { backgroundColor: BRAND.colors.ink, borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center' },
  assistantIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#FFFFFF22', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  assistantLetter: { color: BRAND.colors.white, fontSize: 24, fontWeight: '900' },
  assistantCopy: { flex: 1 },
  assistantTitle: { color: BRAND.colors.white, fontSize: 16, fontWeight: '900' },
  assistantSubtitle: { color: '#D1D5DB', marginTop: 4, fontSize: 12, lineHeight: 17 },
  arrow: { color: BRAND.colors.white, fontSize: 22, fontWeight: '800' },
  card: { backgroundColor: BRAND.colors.surface, borderRadius: BRAND.radius.card, padding: 18 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: BRAND.colors.ink, fontSize: 17, fontWeight: '900' },
  openLink: { color: BRAND.colors.primary, fontSize: 12, fontWeight: '900' },
  priorityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  priorityDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: BRAND.colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  priorityNumber: { color: BRAND.colors.primary, fontSize: 12, fontWeight: '900' },
  priorityText: { color: BRAND.colors.inkSoft, flex: 1, fontSize: 13, lineHeight: 19 },
  muted: { color: BRAND.colors.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  nutritionGrid: { flexDirection: 'row', gap: 10, marginTop: 14 },
  nutritionMetric: { flex: 1, backgroundColor: BRAND.colors.canvas, borderRadius: 15, padding: 12 },
  metricUnit: { fontSize: 10, color: BRAND.colors.muted },
  track: { height: 6, backgroundColor: BRAND.colors.border, borderRadius: 6, overflow: 'hidden', marginTop: 8 },
  trackFill: { height: 6, backgroundColor: BRAND.colors.primary, borderRadius: 6 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  quickButton: { width: '48%', minHeight: 86, borderRadius: 16, backgroundColor: '#F3F4F6', padding: 12, justifyContent: 'center' },
  quickBusy: { opacity: 0.6 },
  quickMark: { width: 30, height: 30, borderRadius: 10, backgroundColor: BRAND.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  quickMarkText: { color: BRAND.colors.primary, fontWeight: '900', fontSize: 13 },
  quickLabel: { color: BRAND.colors.inkSoft, fontSize: 12, fontWeight: '800', marginTop: 7 },
  actionSuccess: { color: '#166534', fontSize: 12, fontWeight: '700', marginTop: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metric: { width: '48%', backgroundColor: BRAND.colors.surface, borderRadius: 20, padding: 15, minHeight: 128 },
  metricDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND.colors.primary },
  metricTitle: { color: BRAND.colors.muted, fontSize: 11, fontWeight: '700', marginTop: 10 },
  metricValue: { color: BRAND.colors.ink, fontSize: 25, fontWeight: '900', marginTop: 5 },
  metricHelper: { color: '#9CA3AF', fontSize: 11, marginTop: 2 },
  actionCard: { backgroundColor: BRAND.colors.surface, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center' },
  actionCopy: { flex: 1 },
  actionTitle: { color: BRAND.colors.muted, fontSize: 11, fontWeight: '800' },
  actionValue: { color: BRAND.colors.ink, fontSize: 15, fontWeight: '900', marginTop: 5 },
  actionMeta: { color: BRAND.colors.muted, fontSize: 11, marginTop: 4 },
  actionArrow: { color: BRAND.colors.ink, fontSize: 22, fontWeight: '800', marginLeft: 12 },
  notificationCard: { backgroundColor: BRAND.colors.primarySoft, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center' },
  notificationMark: { width: 42, height: 42, borderRadius: 14, backgroundColor: BRAND.colors.primary, alignItems: 'center', justifyContent: 'center' },
  notificationMarkText: { color: BRAND.colors.white, fontWeight: '900' },
  notificationCopy: { flex: 1, marginLeft: 12 },
  notificationTitle: { color: BRAND.colors.ink, fontSize: 14, fontWeight: '900' },
  notificationSubtitle: { color: BRAND.colors.muted, fontSize: 11, marginTop: 3 },
  notificationArrow: { color: BRAND.colors.primary, fontSize: 22, fontWeight: '800' },
  errorCard: { backgroundColor: '#FEF2F2', borderRadius: 20, padding: 16 },
  errorCardTitle: { color: '#991B1B', fontWeight: '900', fontSize: 13 },
  retry: { alignSelf: 'flex-start', marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#FEE2E2' },
  retryText: { color: '#991B1B', fontWeight: '900', fontSize: 12 },
  primaryButton: { marginTop: 18, minHeight: 52, paddingHorizontal: 22, borderRadius: 15, backgroundColor: BRAND.colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: BRAND.colors.white, fontWeight: '900' },
  secondaryButton: { minHeight: 52, borderRadius: 15, backgroundColor: BRAND.colors.ink, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  secondaryButtonText: { color: BRAND.colors.white, fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.995 }] },
});
