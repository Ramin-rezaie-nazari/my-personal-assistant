import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { BrainContextResponse, getBrainContext, hasAuthSession } from '../lib/api';

export default function BrainScreen() {
  const [data, setData] = useState<BrainContextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await getBrainContext());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your Personal Brain');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void hasAuthSession().then((ok) => { if (ok) void load(); else setLoading(false); }); }, [load]);
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <View style={styles.nav}><Link href="/" asChild><Pressable><Text style={styles.navText}>← Home</Text></Pressable></Link><Link href="/daily" asChild><Pressable><Text style={styles.navText}>Today →</Text></Pressable></Link></View>
        <Text style={styles.eyebrow}>PERSONAL BRAIN</Text>
        <Text style={styles.title}>I know where you are today.</Text>
        <Text style={styles.subtitle}>{data?.primaryGoal ? `Everything below is viewed through your goal: ${data.primaryGoal}.` : 'Set a goal and keep logging. I will build a clearer picture over time.'}</Text>

        {error ? <View style={styles.card}><Text style={styles.cardTitle}>Brain unavailable</Text><Text style={styles.body}>{error}</Text><Pressable style={styles.button} onPress={() => void load()}><Text style={styles.buttonText}>Retry</Text></Pressable></View> : null}

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>TODAY'S SIGNAL</Text>
          <Text style={styles.heroTitle}>{data?.priorities[0] ?? 'You are clear for now.'}</Text>
          <Text style={styles.heroBody}>Built from your saved data across nutrition, habits, supplements, schedule, workouts and notifications.</Text>
        </View>

        <View style={styles.section}><Text style={styles.sectionTitle}>What I’m tracking</Text><View style={styles.grid}>
          <View style={styles.metric}><Text style={styles.emoji}>🍽️</Text><Text style={styles.label}>Calories</Text><Text style={styles.value}>{data?.today.calories}{data?.today.calorieGoal ? ` / ${data.today.calorieGoal}` : ''}</Text></View>
          <View style={styles.metric}><Text style={styles.emoji}>🥩</Text><Text style={styles.label}>Protein</Text><Text style={styles.value}>{data?.today.protein}g{data?.today.proteinGoal ? ` / ${data.today.proteinGoal}g` : ''}</Text></View>
          <View style={styles.metric}><Text style={styles.emoji}>💧</Text><Text style={styles.label}>Water</Text><Text style={styles.value}>{data?.today.waterMl}ml{data?.today.waterGoalMl ? ` / ${data.today.waterGoalMl}` : ''}</Text></View>
          <View style={styles.metric}><Text style={styles.emoji}>✅</Text><Text style={styles.label}>Habits</Text><Text style={styles.value}>{data?.habits.completed} / {data?.habits.active}</Text></View>
          <View style={styles.metric}><Text style={styles.emoji}>💊</Text><Text style={styles.label}>Supplements</Text><Text style={styles.value}>{data?.supplements.taken} / {data?.supplements.active}</Text></View>
          <View style={styles.metric}><Text style={styles.emoji}>🏋️</Text><Text style={styles.label}>Workouts</Text><Text style={styles.value}>{data?.workouts.todayCount} today</Text></View>
          <View style={styles.metric}><Text style={styles.emoji}>📅</Text><Text style={styles.label}>Schedule</Text><Text style={styles.value}>{data?.calendar.todayCount} events</Text></View>
          <View style={styles.metric}><Text style={styles.emoji}>🔔</Text><Text style={styles.label}>Alerts</Text><Text style={styles.value}>{data?.notifications.unread} unread</Text></View>
        </View></View>

        <View style={styles.card}><Text style={styles.cardTitle}>Next actions</Text>{data?.priorities.length ? data.priorities.map((item, index) => <Text key={`${item}-${index}`} style={styles.priority}>{index + 1}. {item}</Text>) : <Text style={styles.body}>No urgent action right now. Keep the momentum.</Text>}</View>

        <View style={styles.card}><Text style={styles.cardTitle}>Next up</Text>{data?.calendar.next ? <Text style={styles.body}>📅 {data.calendar.next.title} · {new Date(data.calendar.next.startsAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</Text> : null}{data?.reminders.next ? <Text style={styles.body}>⏰ {data.reminders.next.title} · {new Date(data.reminders.next.scheduledAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</Text> : null}{data?.workouts.latest ? <Text style={styles.body}>🏋️ {data.workouts.latest.name} · {data.workouts.latest.durationMinutes} min</Text> : null}</View>

        <View style={styles.links}><Link href="/insights" asChild><Pressable style={styles.link}><Text style={styles.linkText}>What I noticed →</Text></Pressable></Link><Link href="/daily" asChild><Pressable style={styles.link}><Text style={styles.linkText}>Today Command Center →</Text></Pressable></Link><Link href="/calendar" asChild><Pressable style={styles.link}><Text style={styles.linkText}>Calendar →</Text></Pressable></Link></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({safe:{flex:1,backgroundColor:'#F7F8FA'},center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#F7F8FA'},content:{padding:20,gap:14,paddingBottom:40},nav:{flexDirection:'row',justifyContent:'space-between'},navText:{fontWeight:'800',color:'#111827'},eyebrow:{fontSize:11,letterSpacing:1.6,fontWeight:'900',color:'#6B7280'},title:{fontSize:31,lineHeight:36,fontWeight:'900',color:'#111827'},subtitle:{fontSize:14,lineHeight:20,color:'#6B7280'},hero:{backgroundColor:'#111827',borderRadius:24,padding:20,gap:8},heroLabel:{fontSize:10,letterSpacing:1.4,fontWeight:'900',color:'#9CA3AF'},heroTitle:{fontSize:22,lineHeight:28,fontWeight:'900',color:'#FFF'},heroBody:{fontSize:12,lineHeight:18,color:'#D1D5DB'},section:{gap:10},sectionTitle:{fontSize:17,fontWeight:'900',color:'#111827'},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},metric:{width:'47.5%',backgroundColor:'#FFF',borderRadius:18,padding:14,minHeight:105},emoji:{fontSize:21},label:{fontSize:11,color:'#6B7280',fontWeight:'800',marginTop:8},value:{fontSize:14,color:'#111827',fontWeight:'900',marginTop:4},card:{backgroundColor:'#FFF',borderRadius:20,padding:18,gap:8},cardTitle:{fontSize:17,fontWeight:'900',color:'#111827'},body:{fontSize:13,lineHeight:20,color:'#4B5563'},priority:{fontSize:13,lineHeight:21,color:'#111827',fontWeight:'800'},links:{gap:10},link:{backgroundColor:'#111827',padding:14,borderRadius:14},linkText:{color:'#FFF',fontWeight:'900',textAlign:'center'},button:{alignSelf:'flex-start',backgroundColor:'#111827',paddingHorizontal:14,paddingVertical:10,borderRadius:12},buttonText:{color:'#FFF',fontWeight:'900'}});
