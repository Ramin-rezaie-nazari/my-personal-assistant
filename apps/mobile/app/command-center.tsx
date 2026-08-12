import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getDailyCommandCenter, DailyCommandCenterResponse, hasAuthSession } from '../lib/api';
import { AppLocale, getStoredLocale } from '../lib/i18n';
import { runQuickCommand } from '../lib/command-actions';

const copy = {
  en: { eyebrow: 'PERSONAL COMMAND CENTER', assistant: 'Talk to your assistant', priorities: "Today's priorities", nutrition: "Today's balance", habits: 'Habits', supplements: 'Supplements', reminders: 'Next reminder', calendar: 'Next event', workouts: 'Training', notifications: 'Notifications', none: 'Nothing urgent right now.', unread: 'unread', done: 'done', daily: 'Daily view', retry: 'Retry', quick: 'Quick actions', water: 'Log water', walk: 'Log walk', strength: 'Log strength', reminder: 'Add reminder', success: 'Done' },
  fa: { eyebrow: 'مرکز فرمان دستیار من', assistant: 'با دستیار صحبت کن', priorities: 'اولویت‌های امروز', nutrition: 'وضعیت امروز', habits: 'عادت‌ها', supplements: 'مکمل‌ها', reminders: 'یادآوری بعدی', calendar: 'رویداد بعدی', workouts: 'تمرین', notifications: 'اعلان‌ها', none: 'فعلاً کار فوری‌ای نداری.', unread: 'خوانده‌نشده', done: 'انجام‌شده', daily: 'نمای روزانه', retry: 'تلاش دوباره', quick: 'دسترسی‌های سریع', water: 'ثبت آب', walk: 'ثبت پیاده‌روی', strength: 'ثبت تمرین قدرتی', reminder: 'افزودن یادآوری', success: 'انجام شد' },
} as const;

export default function CommandCenterScreen() {
  const [locale, setLocale] = useState<AppLocale>('en');
  const [data, setData] = useState<DailyCommandCenterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { setError(null); setData(await getDailyCommandCenter()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to load your command center.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => {
    let mounted = true;
    void Promise.all([getStoredLocale(), hasAuthSession()]).then(async ([stored, authenticated]) => {
      if (!mounted) return;
      if (stored) setLocale(stored);
      if (!authenticated) { router.replace('/'); return; }
      await load();
    });
    return () => { mounted = false; };
  }, [load]);
  const ui = copy[locale]; const rtl = locale === 'fa';
  const quickAction = useCallback(async (key: 'water' | 'walk' | 'strength' | 'reminder') => {
    try { setBusyAction(key); setActionMessage(null); const result = await runQuickCommand(key); setActionMessage(result.message); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Action failed.'); }
    finally { setBusyAction(null); }
  }, [load]);
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <View style={[styles.header, rtl && styles.rtl]}>
          <View style={styles.headerCopy}><Text style={styles.eyebrow}>{ui.eyebrow}</Text><Text style={styles.greeting}>{data?.greeting ?? (rtl ? 'سلام 👋' : 'Hello 👋')}</Text><Text style={styles.date}>{data?.dateKey}</Text></View>
          <Pressable onPress={() => router.push('/assistant')} style={styles.brainButton}><Text style={styles.brainEmoji}>🧠</Text></Pressable>
        </View>
        <Pressable onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.assistantCard, pressed && styles.pressed]}>
          <View style={styles.assistantIcon}><Text style={styles.assistantEmoji}>✨</Text></View><View style={styles.assistantCopy}><Text style={styles.assistantTitle}>{ui.assistant}</Text><Text style={styles.assistantSubtitle}>{data?.primaryGoal ?? ui.none}</Text></View><Text style={styles.arrow}>{rtl ? '←' : '→'}</Text>
        </Pressable>
        <View style={[styles.card, rtl && styles.rtl]}>
          <View style={styles.rowBetween}><Text style={styles.cardTitle}>{ui.priorities}</Text><Text style={styles.live}>LIVE</Text></View>
          {data?.priorities.length ? data.priorities.slice(0, 4).map((item, index) => <View key={`${item}-${index}`} style={styles.priorityRow}><View style={styles.priorityDot}><Text style={styles.priorityNumber}>{index + 1}</Text></View><Text style={styles.priorityText}>{item}</Text></View>) : <Text style={styles.muted}>{ui.none}</Text>}
        </View>
        <View style={[styles.card, rtl && styles.rtl]}>
          <Text style={styles.cardTitle}>{ui.quick}</Text>
          <View style={styles.quickGrid}>
            {([['water', '💧', ui.water], ['walk', '🚶', ui.walk], ['strength', '🏋️', ui.strength], ['reminder', '⏰', ui.reminder]] as const).map(([key, emoji, label]) => (
              <Pressable key={key} disabled={!!busyAction} onPress={() => void quickAction(key)} style={({ pressed }) => [styles.quickButton, pressed && styles.pressed]}>
                <Text style={styles.quickEmoji}>{busyAction === key ? '…' : emoji}</Text><Text style={styles.quickLabel}>{label}</Text>
              </Pressable>
            ))}
          </View>
          {actionMessage ? <Text style={styles.actionSuccess}>{ui.success} · {actionMessage}</Text> : null}
        </View>
        <View style={styles.grid}>
          <MetricCard title={ui.nutrition} value={`${data?.nutrition.calories ?? 0}`} helper={locale === 'fa' ? 'کالری' : 'kcal'} emoji="🔥" />
          <MetricCard title={ui.habits} value={`${data?.habits.completed ?? 0}/${data?.habits.total ?? 0}`} helper={ui.done} emoji="✅" />
          <MetricCard title={ui.supplements} value={`${data?.supplements.taken ?? 0}/${data?.supplements.total ?? 0}`} helper={ui.done} emoji="💊" />
          <MetricCard title={ui.workouts} value={`${data?.workouts.countToday ?? 0}`} helper={locale === 'fa' ? 'امروز' : 'today'} emoji="🏋️" />
        </View>
        <ActionCard title={ui.reminders} value={data?.reminders.next?.title ?? ui.none} meta={data?.reminders.next?.scheduledAt ?? ''} onPress={() => router.push('/reminders')} />
        <ActionCard title={ui.calendar} value={data?.calendar.next?.title ?? ui.none} meta={data?.calendar.next?.scheduledAt ?? ''} onPress={() => router.push('/calendar')} />
        <Pressable onPress={() => router.push('/notifications')} style={({ pressed }) => [styles.notificationCard, pressed && styles.pressed]}><Text style={styles.notificationEmoji}>🔔</Text><View style={styles.notificationCopy}><Text style={styles.notificationTitle}>{ui.notifications}</Text><Text style={styles.notificationSubtitle}>{data?.notifications.unread ?? 0} {ui.unread}</Text></View><Text style={styles.arrow}>{rtl ? '←' : '→'}</Text></Pressable>
        {error ? <View style={styles.errorCard}><Text style={styles.errorTitle}>Something went wrong</Text><Text style={styles.muted}>{error}</Text><Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>{ui.retry}</Text></Pressable></View> : null}
        <Pressable onPress={() => router.push('/daily')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>{ui.daily}</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ title, value, helper, emoji }: { title: string; value: string; helper: string; emoji: string }) { return <View style={styles.metric}><Text style={styles.metricEmoji}>{emoji}</Text><Text style={styles.metricTitle}>{title}</Text><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricHelper}>{helper}</Text></View>; }
function ActionCard({ title, value, meta, onPress }: { title: string; value: string; meta: string; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}><View style={styles.actionCopy}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionValue}>{value}</Text>{meta ? <Text style={styles.actionMeta}>{meta}</Text> : null}</View><Text style={styles.arrow}>→</Text></Pressable>; }

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F7F8FA'}, center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#F7F8FA'}, content:{padding:20,gap:14,paddingBottom:36}, header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, rtl:{direction:'rtl'}, headerCopy:{flex:1}, eyebrow:{color:'#6B7280',fontSize:11,fontWeight:'900',letterSpacing:1.4}, greeting:{color:'#111827',fontSize:30,fontWeight:'900',marginTop:5}, date:{color:'#9CA3AF',marginTop:4,fontSize:12}, brainButton:{width:52,height:52,borderRadius:18,backgroundColor:'#111827',alignItems:'center',justifyContent:'center'}, brainEmoji:{fontSize:24}, assistantCard:{backgroundColor:'#111827',borderRadius:24,padding:18,flexDirection:'row',alignItems:'center'}, assistantIcon:{width:46,height:46,borderRadius:16,backgroundColor:'#FFFFFF22',alignItems:'center',justifyContent:'center',marginRight:12}, assistantEmoji:{fontSize:22}, assistantCopy:{flex:1}, assistantTitle:{color:'#FFFFFF',fontSize:16,fontWeight:'900'}, assistantSubtitle:{color:'#D1D5DB',marginTop:4,fontSize:12,lineHeight:17}, arrow:{color:'#FFFFFF',fontSize:22,fontWeight:'800'}, card:{backgroundColor:'#FFFFFF',borderRadius:22,padding:18}, rowBetween:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, cardTitle:{color:'#111827',fontSize:17,fontWeight:'900'}, live:{color:'#16A34A',fontSize:10,fontWeight:'900',letterSpacing:1}, priorityRow:{flexDirection:'row',alignItems:'center',marginTop:14}, priorityDot:{width:28,height:28,borderRadius:14,backgroundColor:'#F3F4F6',alignItems:'center',justifyContent:'center',marginRight:10}, priorityNumber:{color:'#374151',fontSize:12,fontWeight:'900'}, priorityText:{color:'#374151',flex:1,fontSize:13,lineHeight:19}, muted:{color:'#6B7280',fontSize:12,lineHeight:18,marginTop:8}, quickGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:14}, quickButton:{width:'48%',minHeight:86,borderRadius:16,backgroundColor:'#F3F4F6',padding:12,justifyContent:'center'}, quickEmoji:{fontSize:22}, quickLabel:{color:'#374151',fontSize:12,fontWeight:'800',marginTop:7}, actionSuccess:{color:'#166534',fontSize:12,fontWeight:'700',marginTop:12}, grid:{flexDirection:'row',flexWrap:'wrap',gap:12}, metric:{width:'48%',backgroundColor:'#FFFFFF',borderRadius:20,padding:15,minHeight:142}, metricEmoji:{fontSize:22}, metricTitle:{color:'#6B7280',fontSize:11,fontWeight:'700',marginTop:10}, metricValue:{color:'#111827',fontSize:25,fontWeight:'900',marginTop:5}, metricHelper:{color:'#9CA3AF',fontSize:11,marginTop:2}, actionCard:{backgroundColor:'#FFFFFF',borderRadius:20,padding:18,flexDirection:'row',alignItems:'center'}, actionCopy:{flex:1}, actionTitle:{color:'#6B7280',fontSize:11,fontWeight:'800'}, actionValue:{color:'#111827',fontSize:16,fontWeight:'800',marginTop:6}, actionMeta:{color:'#9CA3AF',fontSize:11,marginTop:4}, notificationCard:{backgroundColor:'#FFFFFF',borderRadius:20,padding:18,flexDirection:'row',alignItems:'center'}, notificationEmoji:{fontSize:23,marginRight:12}, notificationCopy:{flex:1}, notificationTitle:{color:'#111827',fontSize:15,fontWeight:'900'}, notificationSubtitle:{color:'#6B7280',fontSize:12,marginTop:4}, errorCard:{backgroundColor:'#FEF2F2',borderRadius:18,padding:16}, errorTitle:{color:'#991B1B',fontSize:14,fontWeight:'900'}, retry:{alignSelf:'flex-start',backgroundColor:'#111827',paddingHorizontal:14,paddingVertical:10,borderRadius:10,marginTop:12}, retryText:{color:'#FFFFFF',fontWeight:'800'}, secondaryButton:{minHeight:48,borderRadius:16,backgroundColor:'#E5E7EB',alignItems:'center',justifyContent:'center'}, secondaryButtonText:{color:'#374151',fontSize:14,fontWeight:'800'}, pressed:{opacity:0.82,transform:[{scale:0.99}]}
});
