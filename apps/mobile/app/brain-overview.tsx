import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { getStoredAccessToken, hasAuthSession } from '../lib/api';

type Overview = { plan: unknown; nextAction: unknown; coachNext: unknown; scheduleHealth: unknown };

function pretty(value: unknown) {
  if (value == null) return 'No signal yet.';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  try { return JSON.stringify(value, null, 2); } catch { return 'Available'; }
}

function BrainCard({ title, emoji, value }: { title: string; emoji: string; value: unknown }) {
  return <View style={styles.card}><Text style={styles.cardTitle}>{emoji} {title}</Text><Text style={styles.cardBody}>{pretty(value)}</Text></View>;
}

export default function BrainOverviewScreen() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const token = await getStoredAccessToken();
      if (!token) throw new Error('Your session has expired. Please sign in again.');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'}/personal-brain/overview`, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error(response.status === 401 ? 'Your session has expired. Please sign in again.' : `Unable to load Brain (${response.status})`);
      setData(await response.json() as Overview);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load Brain overview'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { void hasAuthSession().then((ok) => { if (ok) void load(); else { setError('Please sign in first.'); setLoading(false); } }); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
      <View style={styles.nav}><Link href="/" asChild><Pressable><Text style={styles.back}>← Home</Text></Pressable></Link><Link href="/assistant" asChild><Pressable><Text style={styles.back}>Assistant</Text></Pressable></Link></View>
      <Text style={styles.eyebrow}>PERSONAL BRAIN</Text>
      <Text style={styles.title}>Your assistant's live view</Text>
      <Text style={styles.subtitle}>The mobile app is now consuming the same decision layer that powers planning, next actions, coaching and schedule health.</Text>
      {error ? <View style={styles.errorCard}><Text style={styles.errorTitle}>Brain unavailable</Text><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable></View> : null}
      {data ? <>
        <BrainCard title="Current plan" emoji="🧭" value={data.plan} />
        <BrainCard title="Next best action" emoji="🎯" value={data.nextAction} />
        <BrainCard title="Coach" emoji="🗣️" value={data.coachNext} />
        <BrainCard title="Schedule health" emoji="❤️" value={data.scheduleHealth} />
      </> : null}
      <Text style={styles.footer}>Deterministic decisioning · bounded learning · safety preserved</Text>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:'#F7F8FA'}, content:{padding:20,gap:14,paddingBottom:34}, center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#F7F8FA'}, nav:{flexDirection:'row',justifyContent:'space-between'}, back:{color:'#374151',fontWeight:'800',paddingVertical:8}, eyebrow:{color:'#6B7280',fontSize:11,fontWeight:'800',letterSpacing:1.5,marginTop:8}, title:{color:'#111827',fontSize:30,fontWeight:'900'}, subtitle:{color:'#6B7280',fontSize:14,lineHeight:20}, card:{backgroundColor:'#FFFFFF',borderRadius:20,padding:18}, cardTitle:{color:'#111827',fontSize:17,fontWeight:'800'}, cardBody:{color:'#374151',fontSize:12,lineHeight:18,marginTop:12}, errorCard:{backgroundColor:'#FEF2F2',borderRadius:18,padding:18}, errorTitle:{color:'#991B1B',fontWeight:'900'}, errorText:{color:'#7F1D1D',marginTop:6}, retry:{alignSelf:'flex-start',marginTop:12,backgroundColor:'#111827',paddingHorizontal:14,paddingVertical:9,borderRadius:10}, retryText:{color:'#FFFFFF',fontWeight:'800'}, footer:{color:'#9CA3AF',textAlign:'center',fontSize:10,marginTop:4} });
