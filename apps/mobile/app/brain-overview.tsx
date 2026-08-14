import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { BrainOverview, getBrainOverview, hasAuthSession } from '../lib/api';
import { confirmNextBestAction, executeNextBestAction, recordBrainFeedback } from '../lib/brain-execution';

function summarize(value: unknown): string {
  if (value == null) return 'Nothing to show yet.';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.length ? `${value.length} signal${value.length === 1 ? '' : 's'} available` : 'Nothing to show yet.';
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

function InsightCard({ title, emoji, value }: { title: string; emoji: string; value: unknown }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}><Text style={styles.cardIcon}>{emoji}</Text><Text style={styles.cardTitle}>{title}</Text></View>
      <Text style={styles.cardBody}>{summarize(value)}</Text>
    </View>
  );
}

export default function BrainOverviewScreen() {
  const [data, setData] = useState<BrainOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmationToken, setConfirmationToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await getBrainOverview());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your assistant.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void hasAuthSession().then((ok) => {
      if (ok) void load();
      else { setError('Please sign in first.'); setLoading(false); }
    });
  }, [load]);

  const execute = useCallback(async () => {
    try {
      setBusy('execute'); setError(null); setMessage(null);
      const receipt = await executeNextBestAction();
      if (receipt.status === 'pending_confirmation' && receipt.confirmationToken) {
        setConfirmationToken(receipt.confirmationToken);
        setMessage('One quick confirmation is needed before I do this.');
      } else if (receipt.status === 'completed') {
        setMessage('Done. I updated your plan.');
        await load();
      } else {
        setMessage(`${receipt.status}: ${receipt.reason}`);
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to complete this action.'); }
    finally { setBusy(null); }
  }, [load]);

  const confirm = useCallback(async () => {
    if (!confirmationToken) return;
    try {
      setBusy('confirm'); setError(null); setMessage(null);
      const receipt = await confirmNextBestAction(confirmationToken);
      setConfirmationToken(null);
      if (receipt.status === 'completed') { setMessage('Confirmed and completed.'); await load(); }
      else setMessage(`${receipt.status}: ${receipt.reason}`);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to confirm this action.'); }
    finally { setBusy(null); }
  }, [confirmationToken, load]);

  const sendFeedback = useCallback(async (outcome: 'completed' | 'skipped' | 'dismissed') => {
    const action = data?.nextAction?.action;
    if (!action) return;
    try {
      setBusy(outcome); setError(null); setMessage(null);
      await recordBrainFeedback({
        candidate: { id: action.id, domain: 'schedule', action: 'complete_life_task', priority: action.priority, source: 'mobile_brain', durationMinutes: action.estimatedMinutes, confidence: 1 },
        outcome,
        note: outcome === 'completed' ? 'User marked next action as done.' : outcome === 'dismissed' ? 'User marked next action as not useful.' : 'User deferred the next action.',
      });
      setMessage(outcome === 'completed' ? 'Got it. I learned from that.' : outcome === 'dismissed' ? 'Got it. I’ll adjust future suggestions.' : 'Saved for later.');
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save your feedback.'); }
    finally { setBusy(null); }
  }, [data, load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  const action = data?.nextAction?.action;
  const urgent = data?.nextAction?.mode === 'urgent';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <View style={styles.nav}>
          <Link href="/" asChild><Pressable><Text style={styles.back}>← Home</Text></Pressable></Link>
          <Text style={styles.navTitle}>Brain</Text>
          <Link href="/insights" asChild><Pressable><Text style={styles.back}>Insights</Text></Pressable></Link>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroOrb}><Text style={styles.heroEmoji}>🧠</Text></View>
          <View style={styles.heroCopy}><Text style={styles.eyebrow}>YOUR PERSONAL ASSISTANT</Text><Text style={styles.title}>Let’s make today easier.</Text><Text style={styles.subtitle}>I’m watching your plan, signals and feedback — and keeping every action behind the same safety rules.</Text></View>
        </View>

        {error ? <View style={styles.errorCard}><Text style={styles.errorTitle}>Something needs attention</Text><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable></View> : null}
        {message ? <View style={styles.successCard}><Text style={styles.successText}>✓ {message}</Text></View> : null}

        {action ? (
          <View style={styles.actionCard}>
            <View style={styles.actionTop}><View style={[styles.pill, urgent && styles.urgentPill]}><Text style={[styles.pillText, urgent && styles.urgentText]}>{urgent ? 'NEEDS ATTENTION' : 'NEXT FOR YOU'}</Text></View><Text style={styles.actionTime}>{action.estimatedMinutes} min</Text></View>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionMeta}>{action.urgent ? 'Due now' : `Priority ${action.priority}`}{action.reasons.length ? ` · ${action.reasons[0]}` : ''}</Text>
            {!confirmationToken ? <Pressable disabled={!!busy} onPress={() => void execute()} style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}><Text style={styles.primaryActionText}>{busy === 'execute' ? 'Working…' : 'Do this for me  →'}</Text></Pressable> : <Pressable disabled={!!busy} onPress={() => void confirm()} style={({ pressed }) => [styles.confirmAction, pressed && styles.pressed]}><Text style={styles.primaryActionText}>{busy === 'confirm' ? 'Confirming…' : 'Confirm & do it  ✓'}</Text></Pressable>}
            <Text style={styles.feedbackPrompt}>Not right? Tell me.</Text>
            <View style={styles.feedbackRow}>
              <Pressable disabled={!!busy} onPress={() => void sendFeedback('completed')} style={({ pressed }) => [styles.feedbackButton, pressed && styles.pressed]}><Text style={styles.feedbackText}>{busy === 'completed' ? '…' : '✓ Done'}</Text></Pressable>
              <Pressable disabled={!!busy} onPress={() => void sendFeedback('skipped')} style={({ pressed }) => [styles.feedbackButton, pressed && styles.pressed]}><Text style={styles.feedbackText}>{busy === 'skipped' ? '…' : 'Later'}</Text></Pressable>
              <Pressable disabled={!!busy} onPress={() => void sendFeedback('dismissed')} style={({ pressed }) => [styles.feedbackButton, pressed && styles.pressed]}><Text style={styles.feedbackText}>{busy === 'dismissed' ? '…' : 'Not useful'}</Text></Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}><Text style={styles.emptyEmoji}>✨</Text><Text style={styles.emptyTitle}>You’re all caught up.</Text><Text style={styles.emptyText}>There’s nothing important to act on right now. Enjoy the breathing room.</Text></View>
        )}

        <Text style={styles.sectionTitle}>What I’m noticing</Text>
        {data ? <><InsightCard title="Current plan" emoji="🧭" value={data.plan} /><InsightCard title="Coach" emoji="💬" value={data.coachNext} /><InsightCard title="Schedule health" emoji="❤️" value={data.scheduleHealth} /></> : null}
        <View style={styles.footer}><Text style={styles.footerText}>Deterministic decisions · bounded learning · safety preserved</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F5F7F6'}, content:{padding:20,gap:14,paddingBottom:40}, center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#F5F7F6'}, nav:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:4}, back:{color:'#374151',fontWeight:'800',paddingVertical:8}, navTitle:{color:'#111827',fontWeight:'900',fontSize:15}, hero:{backgroundColor:'#E9F7F1',borderRadius:28,padding:20,flexDirection:'row',alignItems:'center',gap:16}, heroOrb:{width:58,height:58,borderRadius:29,backgroundColor:'#FFFFFF',alignItems:'center',justifyContent:'center'}, heroEmoji:{fontSize:29}, heroCopy:{flex:1}, eyebrow:{color:'#138A63',fontSize:10,fontWeight:'900',letterSpacing:1.3}, title:{color:'#10231D',fontSize:25,fontWeight:'900',marginTop:5}, subtitle:{color:'#557067',fontSize:12,lineHeight:18,marginTop:6}, errorCard:{backgroundColor:'#FFF1F2',borderRadius:18,padding:16}, errorTitle:{color:'#9F1239',fontWeight:'900'}, errorText:{color:'#881337',fontSize:12,marginTop:5,lineHeight:18}, retry:{alignSelf:'flex-start',marginTop:10,backgroundColor:'#111827',paddingHorizontal:14,paddingVertical:9,borderRadius:10}, retryText:{color:'#FFFFFF',fontWeight:'800'}, successCard:{backgroundColor:'#E9F7F1',borderRadius:16,padding:13}, successText:{color:'#116149',fontWeight:'800',fontSize:12}, actionCard:{backgroundColor:'#13251F',borderRadius:26,padding:20}, actionTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, pill:{backgroundColor:'#D8F5E8',paddingHorizontal:10,paddingVertical:6,borderRadius:20}, urgentPill:{backgroundColor:'#FDE7D5'}, pillText:{color:'#0F6B4D',fontSize:9,fontWeight:'900',letterSpacing:1}, urgentText:{color:'#9A4C18'}, actionTime:{color:'#B8C8C2',fontSize:12,fontWeight:'800'}, actionTitle:{color:'#FFFFFF',fontSize:25,fontWeight:'900',lineHeight:31,marginTop:14}, actionMeta:{color:'#AFC0B9',fontSize:12,marginTop:6}, primaryAction:{marginTop:18,backgroundColor:'#21C58A',borderRadius:15,paddingVertical:15,alignItems:'center'}, confirmAction:{marginTop:18,backgroundColor:'#F59E0B',borderRadius:15,paddingVertical:15,alignItems:'center'}, primaryActionText:{color:'#FFFFFF',fontWeight:'900',fontSize:14}, feedbackPrompt:{color:'#B8C8C2',fontSize:11,fontWeight:'800',marginTop:18}, feedbackRow:{flexDirection:'row',gap:8,marginTop:9}, feedbackButton:{flex:1,backgroundColor:'#243A32',borderRadius:12,paddingVertical:11,alignItems:'center'}, feedbackText:{color:'#EAF4EF',fontWeight:'800',fontSize:11}, pressed:{opacity:0.72}, emptyCard:{backgroundColor:'#FFFFFF',borderRadius:24,padding:24,alignItems:'center'}, emptyEmoji:{fontSize:30}, emptyTitle:{color:'#111827',fontSize:20,fontWeight:'900',marginTop:8}, emptyText:{color:'#6B7280',fontSize:12,lineHeight:18,textAlign:'center',marginTop:6}, sectionTitle:{color:'#111827',fontSize:18,fontWeight:'900',marginTop:6}, card:{backgroundColor:'#FFFFFF',borderRadius:20,padding:18}, cardHeader:{flexDirection:'row',alignItems:'center',gap:9}, cardIcon:{fontSize:20}, cardTitle:{color:'#111827',fontSize:15,fontWeight:'900'}, cardBody:{color:'#52635C',fontSize:13,lineHeight:19,marginTop:10}, footer:{alignItems:'center',paddingTop:8}, footerText:{color:'#9AA8A2',fontSize:10}
});
