import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { PersonalInsightsResponse, getPersonalInsights, hasAuthSession } from '../lib/api';
import { colors, radius, spacing, typography, shadows } from '../lib/design-system';
import { AnimatedIn, MotionPress } from '../lib/motion-components';

const categoryEmoji: Record<string, string> = { nutrition: '🍽️', hydration: '💧', fitness: '🏋️', consistency: '📈' };

export default function InsightsScreen() {
  const [data, setData] = useState<PersonalInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { try { setError(null); setData(await getPersonalInsights()); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load insights'); } finally { setLoading(false); setRefreshing(false); } }, []);
  useEffect(() => { void hasAuthSession().then((ok) => { if (ok) void load(); else setLoading(false); }); }, [load]);
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.ink} /></View>;
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <AnimatedIn><View style={styles.navRow}><Link href="/" asChild><MotionPress style={styles.back}><Text style={styles.backText}>← Home</Text></MotionPress></Link><View style={styles.navLinks}><Link href="/brain-overview" asChild><MotionPress style={styles.navLink}><Text style={styles.navLinkText}>🧠 Brain</Text></MotionPress></Link><Link href="/daily" asChild><MotionPress style={styles.navLink}><Text style={styles.navLinkText}>☀️ Today</Text></MotionPress></Link><Link href="/reminders" asChild><MotionPress style={styles.navLink}><Text style={styles.navLinkText}>⏰ Reminders</Text></MotionPress></Link></View></View></AnimatedIn>
        <AnimatedIn delay={90}><Text style={styles.eyebrow}>PERSONAL BRAIN</Text><Text style={styles.title}>What I noticed ✨</Text><Text style={styles.subtitle}>{data?.summary ?? 'I am learning from your recent activity.'}</Text></AnimatedIn>
        {error ? <AnimatedIn delay={140}><View style={[styles.card, shadows.subtle]}><Text style={styles.cardTitle}>Insights unavailable</Text><Text style={styles.muted}>{error}</Text><MotionPress onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>Try again</Text></MotionPress></View></AnimatedIn> : null}
        {data?.insights.map((insight, index) => <AnimatedIn key={insight.key} delay={160 + index * 90}><View style={[styles.card, shadows.subtle]}><View style={styles.cardHeader}><View style={styles.iconBubble}><Text style={styles.icon}>{categoryEmoji[insight.category] ?? '🧠'}</Text></View><View style={styles.headerCopy}><Text style={styles.cardTitle}>{insight.title}</Text><Text style={styles.score}>Priority {insight.score}</Text></View></View><Text style={styles.description}>{insight.description}</Text></View></AnimatedIn>)}
        {data?.insights.length === 0 ? <AnimatedIn delay={180}><View style={[styles.card, shadows.subtle]}><Text style={styles.cardTitle}>Keep going 🌱</Text><Text style={styles.description}>A little more daily activity will give your assistant more signal and better recommendations.</Text></View></AnimatedIn> : null}
        <AnimatedIn delay={Math.min(650, 190 + (data?.insights.length ?? 0) * 90)}><Text style={styles.footer}>Generated from your recent activity · no external AI required</Text></AnimatedIn>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:colors.paper}, content:{padding:spacing.xl,gap:spacing.md,paddingBottom:34}, center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:colors.paper}, navRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, navLinks:{flexDirection:'row',gap:8}, back:{paddingVertical:8}, backText:{color:colors.text,fontWeight:'800'}, navLink:{paddingHorizontal:10,paddingVertical:8,backgroundColor:colors.surfaceWarm,borderRadius:radius.sm}, navLinkText:{color:colors.text,fontWeight:'800',fontSize:11}, eyebrow:{...typography.eyebrow,color:colors.textMuted,marginTop:8}, title:{...typography.title1,color:colors.text,marginTop:4}, subtitle:{...typography.body,color:colors.textMuted}, card:{backgroundColor:colors.surface,borderRadius:radius.lg,padding:18,borderWidth:1,borderColor:colors.border}, cardHeader:{flexDirection:'row',alignItems:'flex-start'}, iconBubble:{width:46,height:46,borderRadius:23,backgroundColor:colors.surfaceAccent,alignItems:'center',justifyContent:'center',marginRight:12}, icon:{fontSize:24}, headerCopy:{flex:1}, cardTitle:{color:colors.text,fontSize:17,fontWeight:'800'}, score:{color:colors.textMuted,fontSize:11,fontWeight:'700',marginTop:4}, description:{color:colors.text,fontSize:13,lineHeight:20,marginTop:13}, muted:{color:colors.textMuted,fontSize:12,lineHeight:18,marginTop:6}, retry:{marginTop:12,alignSelf:'flex-start',backgroundColor:colors.ink,paddingHorizontal:14,paddingVertical:10,borderRadius:radius.sm}, retryText:{color:colors.surface,fontWeight:'800'}, footer:{color:colors.textMuted,textAlign:'center',fontSize:10,marginTop:8} });
