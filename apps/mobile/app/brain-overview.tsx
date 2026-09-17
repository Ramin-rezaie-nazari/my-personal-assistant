import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { BrainOverview, getBrainOverview, hasAuthSession } from '../lib/api';
import { confirmNextBestAction, executeNextBestAction, recordBrainFeedback } from '../lib/brain-execution';
import { useAppLocale, isRTL } from '../lib/i18n';
import { localizedCopy } from '../lib/localized-copy';
import { translateDynamicText } from '../lib/runtime-translator';

const copy = localizedCopy({
  en: {
    home: 'Home', brain: 'Brain', insights: 'Insights', personalAssistant: 'YOUR PERSONAL ASSISTANT', title: 'Let’s make today easier.', subtitle: 'I’m watching your plan, signals and feedback — and keeping every action behind the same safety rules.',
    attention: 'NEEDS ATTENTION', nextForYou: 'NEXT FOR YOU', dueNow: 'Due now', priority: 'Priority', doThis: 'Do this for me →', working: 'Working…', confirmation: 'One quick confirmation is needed before I do this.', confirmed: 'Confirmed and completed.', confirmAndDo: 'Confirm & do it ✓', confirming: 'Confirming…', notRight: 'Not right? Tell me.', done: '✓ Done', later: 'Later', notUseful: 'Not useful', saved: 'Saved for later.', learned: 'Got it. I learned from that.', adjusted: 'Got it. I’ll adjust future suggestions.', clearTitle: 'You’re all caught up.', clearText: 'There’s nothing important to act on right now. Enjoy the breathing room.', noticing: 'What I’m noticing', currentPlan: 'Current plan', coach: 'Coach', scheduleHealth: 'Schedule health', nothing: 'Nothing to show yet.', signals: 'signals available', personalized: 'Personalized information is available.', signIn: 'Please sign in first.', loadError: 'Unable to load your assistant.', actionError: 'Unable to complete this action.', confirmError: 'Unable to confirm this action.', feedbackError: 'Unable to save your feedback.', tryAgain: 'Try again', footer: 'Deterministic decisions · bounded learning · safety preserved', min: 'min',
  },
  fa: {
    home: 'خانه', brain: 'مغز شخصی', insights: 'بینش‌ها', personalAssistant: 'دستیار شخصی تو', title: 'بیایم امروز را ساده‌تر کنیم.', subtitle: 'برنامه، نشانه‌ها و بازخوردت را دنبال می‌کنم و همه اقدام‌ها را زیر همان قوانین ایمنی نگه می‌دارم.',
    attention: 'نیازمند توجه', nextForYou: 'قدم بعدی تو', dueNow: 'همین حالا', priority: 'اولویت', doThis: 'این کار را برام انجام بده ←', working: 'در حال انجام…', confirmation: 'قبل از انجام این کار فقط یک تأیید سریع لازم است.', confirmed: 'تأیید شد و انجام شد.', confirmAndDo: 'تأیید و انجام ✓', confirming: 'در حال تأیید…', notRight: 'درست نیست؟ بهم بگو.', done: '✓ انجام شد', later: 'بعداً', notUseful: 'مفید نیست', saved: 'برای بعد ذخیره شد.', learned: 'متوجه شدم؛ از این بازخورد یاد گرفتم.', adjusted: 'متوجه شدم؛ پیشنهادهای بعدی را تنظیم می‌کنم.', clearTitle: 'فعلاً همه‌چیز مرتب است.', clearText: 'الان کاری مهم برای انجام‌دادن نیست. از این فاصله لذت ببر.', noticing: 'چیزهایی که متوجه شدم', currentPlan: 'برنامه فعلی', coach: 'مربی', scheduleHealth: 'سلامت برنامه', nothing: 'هنوز چیزی برای نمایش نیست.', signals: 'نشانه موجود است', personalized: 'اطلاعات شخصی‌سازی‌شده در دسترس است.', signIn: 'اول وارد حساب شو.', loadError: 'دستیار بارگذاری نشد.', actionError: 'انجام این کار ممکن نبود.', confirmError: 'تأیید این کار ممکن نبود.', feedbackError: 'ذخیره بازخورد ممکن نبود.', tryAgain: 'تلاش دوباره', footer: 'تصمیم‌های قطعی · یادگیری محدود · ایمنی حفظ شده', min: 'دقیقه',
  },
});

function Entrance({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    const a = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(y, { toValue: 0, delay, tension: 75, friction: 9, useNativeDriver: true }),
    ]);
    a.start();
    return () => a.stop();
  }, [delay, opacity, y]);
  return <Animated.View style={{ opacity, transform: [{ translateY: y }] }}>{children}</Animated.View>;
}

function Tap({ children, onPress, disabled, style }: { children: React.ReactNode; onPress?: () => void; disabled?: boolean; style?: any }) {
  const scale = useRef(new Animated.Value(1)).current;
  return <Pressable disabled={disabled} onPress={onPress} onPressIn={() => Animated.spring(scale, { toValue: .965, tension: 100, friction: 9, useNativeDriver: true }).start()} onPressOut={() => Animated.spring(scale, { toValue: 1, tension: 90, friction: 8, useNativeDriver: true }).start()}><Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View></Pressable>;
}

function summarize(value: unknown): string {
  if (value == null) return 'Nothing to show yet.';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.length ? `${value.length} signals available` : 'Nothing to show yet.';
  if (typeof value === 'object') {
    const item = value as Record<string, unknown>;
    const preferred = ['message', 'title', 'name', 'status', 'summary', 'recommendation', 'reason'];
    for (const key of preferred) if (typeof item[key] === 'string' && item[key]) return item[key] as string;
    const parts = Object.entries(item).filter(([, v]) => ['string', 'number', 'boolean'].includes(typeof v)).slice(0, 3);
    if (parts.length) return parts.map(([key, v]) => `${key}: ${String(v)}`).join(' · ');
    return 'Personalized information is available.';
  }
  return 'Available';
}

async function maybeLocalize(text: string, locale: Parameters<typeof translateDynamicText>[0]): Promise<string> {
  if (locale === 'en' || !text.trim()) return text;
  try { return await translateDynamicText(locale, text); } catch { return text; }
}

function InsightCard({ title, emoji, value, delay, locale }: { title: string; emoji: string; value: unknown; delay: number; locale: Parameters<typeof translateDynamicText>[0] }) {
  const [body, setBody] = useState(summarize(value));
  useEffect(() => {
    let active = true;
    void maybeLocalize(summarize(value), locale).then((next) => { if (active) setBody(next); });
    return () => { active = false; };
  }, [locale, value]);
  return <Entrance delay={delay}><View style={styles.card}><View style={styles.cardHeader}><Text style={styles.cardIcon}>{emoji}</Text><Text style={styles.cardTitle}>{title}</Text></View><Text style={[styles.cardBody, isRTL(locale) && styles.rtlText]}>{body}</Text></View></Entrance>;
}

export default function BrainOverviewScreen() {
  const { locale, rtl } = useAppLocale();
  const ui = copy[locale];
  const [data, setData] = useState<BrainOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmationToken, setConfirmationToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { setError(null); setData(await getBrainOverview()); }
    catch (err) { setError(err instanceof Error ? err.message : ui.loadError); }
    finally { setLoading(false); setRefreshing(false); }
  }, [ui.loadError]);
  useEffect(() => { void hasAuthSession().then((ok) => { if (ok) void load(); else { setError(ui.signIn); setLoading(false); } }); }, [load, ui.signIn]);
  const execute = useCallback(async () => {
    try { setBusy('execute'); setError(null); setMessage(null); const receipt = await executeNextBestAction(); if (receipt.status === 'pending_confirmation' && receipt.confirmationToken) { setConfirmationToken(receipt.confirmationToken); setMessage(ui.confirmation); } else if (receipt.status === 'completed') { setMessage(ui.confirmed); await load(); } else setMessage(`${receipt.status}: ${receipt.reason}`); }
    catch (err) { setError(err instanceof Error ? err.message : ui.actionError); } finally { setBusy(null); }
  }, [load, ui.actionError, ui.confirmation, ui.confirmed]);
  const confirm = useCallback(async () => {
    if (!confirmationToken) return;
    try { setBusy('confirm'); setError(null); setMessage(null); const receipt = await confirmNextBestAction(confirmationToken); setConfirmationToken(null); if (receipt.status === 'completed') { setMessage(ui.confirmed); await load(); } else setMessage(`${receipt.status}: ${receipt.reason}`); }
    catch (err) { setError(err instanceof Error ? err.message : ui.confirmError); } finally { setBusy(null); }
  }, [confirmationToken, load, ui.confirmError, ui.confirmed]);
  const sendFeedback = useCallback(async (outcome: 'completed' | 'skipped' | 'dismissed') => {
    const action = data?.nextAction?.action; if (!action) return;
    try { setBusy(outcome); setError(null); setMessage(null); await recordBrainFeedback({ candidate: { id: action.id, domain: 'schedule', action: 'complete_life_task', priority: action.priority, source: 'mobile_brain', durationMinutes: action.estimatedMinutes, confidence: 1 }, outcome, note: outcome === 'completed' ? ui.learned : outcome === 'dismissed' ? ui.adjusted : ui.saved }); setMessage(outcome === 'completed' ? ui.learned : outcome === 'dismissed' ? ui.adjusted : ui.saved); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : ui.feedbackError); } finally { setBusy(null); }
  }, [data, load, ui.adjusted, ui.feedbackError, ui.learned, ui.saved]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  const action = data?.nextAction?.action;
  const urgent = data?.nextAction?.mode === 'urgent';
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
    <Entrance><View style={[styles.nav, rtl && styles.rtl]}><Link href="/" asChild><Pressable><Text style={styles.back}>{rtl ? '→' : '←'} {ui.home}</Text></Pressable></Link><Text style={styles.navTitle}>{ui.brain}</Text><Link href="/insights" asChild><Pressable><Text style={styles.back}>{ui.insights}</Text></Pressable></Link></View></Entrance>
    <Entrance delay={70}><View style={[styles.hero, rtl && styles.rtl]}><View style={styles.heroOrb}><Text style={styles.heroEmoji}>🧠</Text></View><View style={styles.heroCopy}><Text style={[styles.eyebrow, rtl && styles.rtlText]}>{ui.personalAssistant}</Text><Text style={[styles.title, rtl && styles.rtlText]}>{ui.title}</Text><Text style={[styles.subtitle, rtl && styles.rtlText]}>{ui.subtitle}</Text></View></View></Entrance>
    {error ? <Entrance delay={110}><View style={styles.errorCard}><Text style={[styles.errorTitle, rtl && styles.rtlText]}>{ui.actionError}</Text><Text style={[styles.errorText, rtl && styles.rtlText]}>{error}</Text><Tap onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>{ui.tryAgain}</Text></Tap></View></Entrance> : null}
    {message ? <Entrance delay={120}><View style={styles.successCard}><Text style={[styles.successText, rtl && styles.rtlText]}>✓ {message}</Text></View></Entrance> : null}
    {action ? <Entrance delay={150}><View style={styles.actionCard}>
      <View style={styles.actionTop}><View style={[styles.pill, urgent && styles.urgentPill]}><Text style={[styles.pillText, urgent && styles.urgentText]}>{urgent ? ui.attention : ui.nextForYou}</Text></View><Text style={styles.actionTime}>{action.estimatedMinutes} {ui.min}</Text></View>
      <Text style={[styles.actionTitle, rtl && styles.rtlText]}>{action.title}</Text><Text style={[styles.actionMeta, rtl && styles.rtlText]}>{action.urgent ? ui.dueNow : `${ui.priority} ${action.priority}`}{action.reasons.length ? ` · ${action.reasons[0]}` : ''}</Text>
      {!confirmationToken ? <Tap disabled={!!busy} onPress={() => void execute()} style={styles.primaryAction}><Text style={styles.primaryActionText}>{busy === 'execute' ? ui.working : ui.doThis}</Text></Tap> : <Tap disabled={!!busy} onPress={() => void confirm()} style={styles.confirmAction}><Text style={styles.primaryActionText}>{busy === 'confirm' ? ui.confirming : ui.confirmAndDo}</Text></Tap>}
      <Text style={[styles.feedbackPrompt, rtl && styles.rtlText]}>{ui.notRight}</Text><View style={styles.feedbackRow}><Tap disabled={!!busy} onPress={() => void sendFeedback('completed')} style={styles.feedbackButton}><Text style={styles.feedbackText}>{busy === 'completed' ? '…' : ui.done}</Text></Tap><Tap disabled={!!busy} onPress={() => void sendFeedback('skipped')} style={styles.feedbackButton}><Text style={styles.feedbackText}>{busy === 'skipped' ? '…' : ui.later}</Text></Tap><Tap disabled={!!busy} onPress={() => void sendFeedback('dismissed')} style={styles.feedbackButton}><Text style={styles.feedbackText}>{busy === 'dismissed' ? '…' : ui.notUseful}</Text></Tap></View>
    </View></Entrance> : <Entrance delay={150}><View style={styles.emptyCard}><Text style={styles.emptyEmoji}>✨</Text><Text style={[styles.emptyTitle, rtl && styles.rtlText]}>{ui.clearTitle}</Text><Text style={[styles.emptyText, rtl && styles.rtlText]}>{ui.clearText}</Text></View></Entrance>}
    <Entrance delay={220}><Text style={[styles.sectionTitle, rtl && styles.rtlText]}>{ui.noticing}</Text></Entrance>
    {data ? <><InsightCard title={ui.currentPlan} emoji="🧭" value={data.plan} delay={260} locale={locale} /><InsightCard title={ui.coach} emoji="💬" value={data.coachNext} delay={300} locale={locale} /><InsightCard title={ui.scheduleHealth} emoji="❤️" value={data.scheduleHealth} delay={340} locale={locale} /></> : null}
    <Entrance delay={390}><View style={styles.footer}><Text style={styles.footerText}>{ui.footer}</Text></View></Entrance>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F5F7F6'}, content:{padding:20,gap:14,paddingBottom:40}, center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#F5F7F6'}, nav:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:4}, rtl:{flexDirection:'row-reverse'}, rtlText:{writingDirection:'rtl',textAlign:'right'}, back:{color:'#374151',fontWeight:'800',paddingVertical:8}, navTitle:{color:'#111827',fontWeight:'900',fontSize:15}, hero:{backgroundColor:'#E9F7F1',borderRadius:28,padding:20,flexDirection:'row',alignItems:'center',gap:16}, heroOrb:{width:58,height:58,borderRadius:29,backgroundColor:'#FFFFFF',alignItems:'center',justifyContent:'center'}, heroEmoji:{fontSize:29}, heroCopy:{flex:1}, eyebrow:{color:'#138A63',fontSize:10,fontWeight:'900',letterSpacing:1.3}, title:{color:'#10231D',fontSize:25,fontWeight:'900',marginTop:5}, subtitle:{color:'#557067',fontSize:12,lineHeight:18,marginTop:6}, errorCard:{backgroundColor:'#FFF1F2',borderRadius:18,padding:16}, errorTitle:{color:'#9F1239',fontWeight:'900'}, errorText:{color:'#881337',fontSize:12,marginTop:5,lineHeight:18}, retry:{alignSelf:'flex-start',marginTop:10,backgroundColor:'#111827',paddingHorizontal:14,paddingVertical:9,borderRadius:10}, retryText:{color:'#FFFFFF',fontWeight:'800'}, successCard:{backgroundColor:'#E9F7F1',borderRadius:16,padding:13}, successText:{color:'#116149',fontWeight:'800',fontSize:12}, actionCard:{backgroundColor:'#13251F',borderRadius:26,padding:20}, actionTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, pill:{backgroundColor:'#D8F5E8',paddingHorizontal:10,paddingVertical:6,borderRadius:20}, urgentPill:{backgroundColor:'#FDE7D5'}, pillText:{color:'#0F6B4D',fontSize:9,fontWeight:'900',letterSpacing:1}, urgentText:{color:'#9A4C18'}, actionTime:{color:'#B8C8C2',fontSize:12,fontWeight:'800'}, actionTitle:{color:'#FFFFFF',fontSize:25,fontWeight:'900',lineHeight:31,marginTop:14}, actionMeta:{color:'#AFC0B9',fontSize:12,marginTop:6}, primaryAction:{marginTop:18,backgroundColor:'#21C58A',borderRadius:15,paddingVertical:15,alignItems:'center'}, confirmAction:{marginTop:18,backgroundColor:'#F59E0B',borderRadius:15,paddingVertical:15,alignItems:'center'}, primaryActionText:{color:'#FFFFFF',fontWeight:'900',fontSize:14}, feedbackPrompt:{color:'#B8C8C2',fontSize:11,fontWeight:'800',marginTop:18}, feedbackRow:{flexDirection:'row',gap:8,marginTop:9}, feedbackButton:{flex:1,backgroundColor:'#243A32',borderRadius:12,paddingVertical:11,alignItems:'center'}, feedbackText:{color:'#EAF4EF',fontWeight:'800',fontSize:11}, emptyCard:{backgroundColor:'#FFFFFF',borderRadius:24,padding:24,alignItems:'center'}, emptyEmoji:{fontSize:30}, emptyTitle:{color:'#111827',fontSize:20,fontWeight:'900',marginTop:8}, emptyText:{color:'#6B7280',fontSize:12,lineHeight:18,textAlign:'center',marginTop:6}, sectionTitle:{color:'#111827',fontSize:18,fontWeight:'900',marginTop:6}, card:{backgroundColor:'#FFFFFF',borderRadius:20,padding:18}, cardHeader:{flexDirection:'row',alignItems:'center',gap:9}, cardIcon:{fontSize:20}, cardTitle:{color:'#111827',fontSize:15,fontWeight:'900'}, cardBody:{color:'#52635C',fontSize:13,lineHeight:19,marginTop:10}, footer:{alignItems:'center',paddingTop:8}, footerText:{color:'#9AA8A2',fontSize:10}
});
