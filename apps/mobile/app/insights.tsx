import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { PersonalInsightsResponse, getPersonalInsights, hasAuthSession } from '../lib/api';

const categoryEmoji: Record<string, string> = { nutrition: '🍽️', hydration: '💧', fitness: '🏋️', consistency: '📈' };

export default function InsightsScreen() {
  const [data, setData] = useState<PersonalInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { try { setError(null); setData(await getPersonalInsights()); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load insights'); } finally { setLoading(false); setRefreshing(false); } }, []);
  useEffect(() => { void hasAuthSession().then((ok) => { if (ok) void load(); else setLoading(false); }); }, [load]);
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <View style={styles.navRow}>
          <Link href="/" asChild><Pressable style={styles.back}><Text style={styles.backText}>← Home</Text></Pressable></Link>
          <View style={styles.navLinks}>
            <Link href="/daily" asChild><Pressable style={styles.navLink}><Text style={styles.navLinkText}>☀️ Today</Text></Pressable></Link>
            <Link href="/reminders" asChild><Pressable style={styles.navLink}><Text style={styles.navLinkText}>⏰ Reminders</Text></Pressable></Link>
          </View>
        </View>
        <Text style={styles.eyebrow}>PERSONAL BRAIN</Text>
        <Text style={styles.title}>What I noticed</Text>
        <Text style={styles.subtitle}>{data?.summary ?? 'I am learning from your recent activity.'}</Text>
        {error ? <View style={styles.card}><Text style={styles.cardTitle}>Insights unavailable</Text><Text style={styles.muted}>{error}</Text><Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable></View> : null}
        {data?.insights.map((insight) => <View key={insight.key} style={styles.card}><View style={styles.cardHeader}><Text style={styles.icon}>{categoryEmoji[insight.category] ?? '🧠'}</Text><View style={styles.headerCopy}><Text style={styles.cardTitle}>{insight.title}</Text><Text style={styles.score}>Priority {insight.score}</Text></View></View><Text style={styles.description}>{insight.description}</Text></View>)}
        {data?.insights.length === 0 ? <View style={styles.card}><Text style={styles.cardTitle}>Keep going</Text><Text style={styles.description}>A little more daily activity will give your assistant more signal and better recommendations.</Text></View> : null}
        <Text style={styles.footer}>Generated from your recent activity · no external AI required</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:'#F7F8FA'}, content:{padding:20,gap:14,paddingBottom:34}, center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#F7F8FA'}, navRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, navLinks:{flexDirection:'row',gap:8}, back:{paddingVertical:8}, backText:{color:'#374151',fontWeight:'800'}, navLink:{paddingHorizontal:10,paddingVertical:8,backgroundColor:'#E5E7EB',borderRadius:10}, navLinkText:{color:'#374151',fontWeight:'800',fontSize:11}, eyebrow:{color:'#6B7280',fontSize:11,fontWeight:'800',letterSpacing:1.5,marginTop:8}, title:{color:'#111827',fontSize:31,fontWeight:'900',marginTop:4}, subtitle:{color:'#6B7280',fontSize:14,lineHeight:20}, card:{backgroundColor:'#FFFFFF',borderRadius:20,padding:18}, cardHeader:{flexDirection:'row',alignItems:'flex-start'}, icon:{fontSize:26,marginRight:12}, headerCopy:{flex:1}, cardTitle:{color:'#111827',fontSize:17,fontWeight:'800'}, score:{color:'#9CA3AF',fontSize:11,fontWeight:'700',marginTop:4}, description:{color:'#374151',fontSize:13,lineHeight:20,marginTop:13}, muted:{color:'#6B7280',fontSize:12,lineHeight:18,marginTop:6}, retry:{marginTop:12,alignSelf:'flex-start',backgroundColor:'#111827',paddingHorizontal:12,paddingVertical:9,borderRadius:10}, retryText:{color:'#FFFFFF',fontWeight:'800'}, footer:{color:'#9CA3AF',textAlign:'center',fontSize:10,marginTop:8} });
