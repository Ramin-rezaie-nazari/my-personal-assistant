import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { BrainOverview, getBrainOverview, hasAuthSession, recordDecisionOutcome } from '../lib/api';

function pretty(value: unknown) {
  if (value == null) return 'No signal yet.';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  try { return JSON.stringify(value, null, 2); } catch { return 'Available'; }
}

function BrainCard({ title, emoji, value }: { title: string; emoji: string; value: unknown }) {
  return <View style={styles.card}><Text style={styles.cardTitle}>{emoji} {title}</Text><Text style={styles.cardBody}>{pretty(value)}</Text></View>;
}

export default function BrainOverviewScreen() {
  const [data, setData] = useState<BrainOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackBusy, setFeedbackBusy] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await getBrainOverview());
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load Brain overview'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { void hasAuthSession().then((ok) => { if (ok) void load(); else { setError('Please sign in first.'); setLoading(false); } }); }, [load]);

  const sendFeedback = useCallback(async (outcome: 'positive' | 'neutral' | 'negative') => {
    const action = data?.nextAction?.action;
    if (!action) return;
    try {
      setFeedbackBusy(outcome); setFeedbackMessage(null); setError(null);
      await recordDecisionOutcome({ decisionId: action.id, outcome, score: outcome === 'positive' ? 1 : outcome === 'negative' ? -1 : 0, note: outcome === 'positive' ? 'User marked next action as done.' : outcome === 'negative' ? 'User marked next action as not useful.' : 'User chose to defer the next action.' });
      setFeedbackMessage(outcome === 'positive' ? 'Nice — outcome recorded.' : outcome === 'negative' ? 'Got it — we will treat this as negative feedback.' : 'Deferred — we will keep this as neutral feedback.');
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to record feedback'); }
    finally { setFeedbackBusy(null); }
  }, [data, load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  const action = data?.nextAction?.action;

  return <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
      <View style={styles.nav}><Link href="/" asChild><Pressable><Text style={styles.back}>← Home</Text></Pressable></Link><Link href="/assistant" asChild><Pressable><Text style={styles.back}>Assistant</Text></Pressable></Link></View>
      <Text style={styles.eyebrow}>PERSONAL BRAIN</Text>
      <Text style={styles.title}>Your assistant's live view</Text>
      <Text style={styles.subtitle}>The mobile app is consuming the same decision layer that powers planning, next actions, coaching and schedule health.</Text>
      {error ? <View style={styles.errorCard}><Text style={styles.errorTitle}>Brain unavailable</Text><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable></View> : null}
      {feedbackMessage ? <View style={styles.successCard}><Text style={styles.successText}>{feedbackMessage}</Text></View> : null}
      {action ? <View style={styles.actionCard}>
        <Text style={styles.actionEyebrow}>{data?.nextAction.mode === 'urgent' ? 'URGENT NEXT ACTION' : 'NEXT BEST ACTION'}</Text>
        <Text style={styles.actionTitle}>{action.title}</Text>
        <Text style={styles.actionMeta}>{action.estimatedMinutes} min · priority {action.priority}{action.urgent ? ' · due now' : ''}</Text>
        {action.reasons.length ? <Text style={styles.actionReason}>{action.reasons.join(' · ')}</Text> : null}
        <Text style={styles.feedbackPrompt}>What happened?</Text>
        <View style={styles.feedbackRow}>
          <Pressable disabled={!!feedbackBusy} onPress={() => void sendFeedback('positive')} style={({ pressed }) => [styles.feedbackButton, styles.positive, pressed && styles.pressed]}><Text style={styles.feedbackText}>{feedbackBusy === 'positive' ? '…' : '✓ Done'}</Text></Pressable>
          <Pressable disabled={!!feedbackBusy} onPress={() => void sendFeedback('neutral')} style={({ pressed }) => [styles.feedbackButton, styles.neutral, pressed && styles.pressed]}><Text style={styles.feedbackText}>{feedbackBusy === 'neutral' ? '…' : 'Later'}</Text></Pressable>
          <Pressable disabled={!!feedbackBusy} onPress={() => void sendFeedback('negative')} style={({ pressed }) => [styles.feedbackButton, styles.negative, pressed && styles.pressed]}><Text style={styles.feedbackText}>{feedbackBusy === 'negative' ? '…' : 'Not useful'}</Text></Pressable>
        </View>
      </View> : null}
      {data ? <>
        <BrainCard title="Current plan" emoji="🧭" value={data.plan} />
        <BrainCard title="Coach" emoji="🗣️" value={data.coachNext} />
        <BrainCard title="Schedule health" emoji="❤️" value={data.scheduleHealth} />
      </> : null}
      <Text style={styles.footer}>Deterministic decisioning · bounded learning · safety preserved</Text>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:'#F7F8FA'}, content:{padding:20,gap:14,paddingBottom:34}, center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#F7F8FA'}, nav:{flexDirection:'row',justifyContent:'space-between'}, back:{color:'#374151',fontWeight:'800',paddingVertical:8}, eyebrow:{color:'#6B7280',fontSize:11,fontWeight:'800',letterSpacing:1.5,marginTop:8}, title:{color:'#111827',fontSize:30,fontWeight:'900'}, subtitle:{color:'#6B7280',fontSize:14,lineHeight:20}, card:{backgroundColor:'#FFFFFF',borderRadius:20,padding:18}, cardTitle:{color:'#111827',fontSize:17,fontWeight:'800'}, cardBody:{color:'#374151',fontSize:12,lineHeight:18,marginTop:12}, actionCard:{backgroundColor:'#111827',borderRadius:22,padding:20}, actionEyebrow:{color:'#A7F3D0',fontSize:11,fontWeight:'900',letterSpacing:1.2}, actionTitle:{color:'#FFFFFF',fontSize:24,fontWeight:'900',marginTop:8}, actionMeta:{color:'#D1D5DB',marginTop:7,fontSize:13}, actionReason:{color:'#9CA3AF',marginTop:8,fontSize:12}, feedbackPrompt:{color:'#FFFFFF',fontSize:13,fontWeight:'800',marginTop:18}, feedbackRow:{flexDirection:'row',gap:8,marginTop:10}, feedbackButton:{flex:1,borderRadius:12,paddingVertical:12,alignItems:'center'}, positive:{backgroundColor:'#10B981'}, neutral:{backgroundColor:'#374151'}, negative:{backgroundColor:'#7F1D1D'}, feedbackText:{color:'#FFFFFF',fontWeight:'900',fontSize:12}, errorCard:{backgroundColor:'#FEF2F2',borderRadius:18,padding:18}, errorTitle:{color:'#991B1B',fontWeight:'900'}, errorText:{color:'#7F1D1D',marginTop:6}, retry:{alignSelf:'flex-start',marginTop:12,backgroundColor:'#111827',paddingHorizontal:14,paddingVertical:9,borderRadius:10}, retryText:{color:'#FFFFFF',fontWeight:'800'}, successCard:{backgroundColor:'#ECFDF5',borderRadius:16,padding:14}, successText:{color:'#065F46',fontWeight:'800'}, pressed:{opacity:0.75}, footer:{color:'#9CA3AF',textAlign:'center',fontSize:10,marginTop:4} });
