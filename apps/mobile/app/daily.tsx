import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { DailyCommandCenterResponse, getDailyCommandCenter, hasAuthSession } from '../lib/api';

export default function DailyCommandCenterScreen() {
  const [data, setData] = useState<DailyCommandCenterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await getDailyCommandCenter());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load today');
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
        <View style={styles.nav}>
          <Link href="/" asChild><Pressable><Text style={styles.back}>← Home</Text></Pressable></Link>
          <Link href="/notifications" asChild><Pressable><Text style={styles.notifications}>{data?.notifications.unread ? `🔔 ${data.notifications.unread}` : '🔔 Inbox'}</Text></Pressable></Link>
          <Text style={styles.date}>{data?.dateKey}</Text>
        </View>
        <Text style={styles.eyebrow}>TODAY</Text>
        <Text style={styles.title}>Your Command Center</Text>
        <Text style={styles.greeting}>{data?.greeting}</Text>

        {error ? <View style={styles.card}><Text style={styles.cardTitle}>Today is unavailable</Text><Text style={styles.body}>{error}</Text><Pressable onPress={() => void load()} style={styles.button}><Text style={styles.buttonText}>Retry</Text></Pressable></View> : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔥 Top priorities</Text>
          {data?.priorities.length ? data.priorities.map((item, index) => <Text key={`${item}-${index}`} style={styles.priority}>{index + 1}. {item}</Text>) : <Text style={styles.body}>You are clear for now. Keep the streak going.</Text>}
        </View>

        <View style={styles.grid}>
          <View style={styles.metric}><Text style={styles.metricEmoji}>🍽️</Text><Text style={styles.metricLabel}>Calories</Text><Text style={styles.metricValue}>{data?.nutrition.calories}{data?.nutrition.calorieGoal ? ` / ${data.nutrition.calorieGoal}` : ''}</Text></View>
          <View style={styles.metric}><Text style={styles.metricEmoji}>🥩</Text><Text style={styles.metricLabel}>Protein</Text><Text style={styles.metricValue}>{data?.nutrition.protein}g{data?.nutrition.proteinGoal ? ` / ${data.nutrition.proteinGoal}g` : ''}</Text></View>
          <View style={styles.metric}><Text style={styles.metricEmoji}>💧</Text><Text style={styles.metricLabel}>Water</Text><Text style={styles.metricValue}>{data?.nutrition.waterMl}ml{data?.nutrition.waterGoalMl ? ` / ${data.nutrition.waterGoalMl}ml` : ''}</Text></View>
          <View style={styles.metric}><Text style={styles.metricEmoji}>✅</Text><Text style={styles.metricLabel}>Habits</Text><Text style={styles.metricValue}>{data?.habits.completed} / {data?.habits.total}</Text></View>
          <View style={styles.metric}><Text style={styles.metricEmoji}>💊</Text><Text style={styles.metricLabel}>Supplements</Text><Text style={styles.metricValue}>{data?.supplements.taken} / {data?.supplements.total}</Text></View>
          <View style={styles.metric}><Text style={styles.metricEmoji}>⏰</Text><Text style={styles.metricLabel}>Reminders</Text><Text style={styles.metricValue}>{data?.reminders.pending} pending</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Next up</Text>
          {data?.reminders.next ? <Text style={styles.body}>⏰ {data.reminders.next.title} · {new Date(data.reminders.next.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text> : <Text style={styles.body}>No upcoming reminders.</Text>}
          {data?.workouts.latest ? <Text style={styles.body}>🏋️ Latest workout: {data.workouts.latest.name} · {data.workouts.latest.durationMinutes} min</Text> : <Text style={styles.body}>🏃 No workout logged yet today.</Text>}
        </View>

        <View style={styles.links}>
          <Link href="/notifications" asChild><Pressable style={styles.link}><Text style={styles.linkText}>Notification Inbox →</Text></Pressable></Link>
          <Link href="/habits" asChild><Pressable style={styles.link}><Text style={styles.linkText}>Habits →</Text></Pressable></Link>
          <Link href="/supplements" asChild><Pressable style={styles.link}><Text style={styles.linkText}>Supplements →</Text></Pressable></Link>
          <Link href="/reminders" asChild><Pressable style={styles.link}><Text style={styles.linkText}>Reminders →</Text></Pressable></Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:'#F7F8FA'}, center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#F7F8FA'}, content:{padding:20,gap:14,paddingBottom:36}, nav:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:10}, back:{fontWeight:'800',color:'#374151'}, notifications:{fontWeight:'900',color:'#111827'}, date:{fontSize:11,color:'#9CA3AF',fontWeight:'700',marginLeft:'auto'}, eyebrow:{fontSize:11,letterSpacing:1.6,fontWeight:'900',color:'#6B7280'}, title:{fontSize:31,fontWeight:'900',color:'#111827'}, greeting:{fontSize:15,lineHeight:22,color:'#4B5563'}, card:{backgroundColor:'#FFF',borderRadius:20,padding:18,gap:8}, cardTitle:{fontSize:17,fontWeight:'900',color:'#111827'}, body:{fontSize:13,lineHeight:20,color:'#4B5563'}, priority:{fontSize:14,lineHeight:22,color:'#111827',fontWeight:'700'}, grid:{flexDirection:'row',flexWrap:'wrap',gap:10}, metric:{width:'31.5%',backgroundColor:'#FFF',borderRadius:18,padding:14,minHeight:112}, metricEmoji:{fontSize:22}, metricLabel:{fontSize:11,fontWeight:'700',color:'#6B7280',marginTop:8}, metricValue:{fontSize:15,fontWeight:'900',color:'#111827',marginTop:4}, links:{gap:10}, link:{backgroundColor:'#111827',padding:14,borderRadius:14}, linkText:{color:'#FFF',fontWeight:'900',textAlign:'center'}, button:{alignSelf:'flex-start',backgroundColor:'#111827',paddingHorizontal:14,paddingVertical:10,borderRadius:12}, buttonText:{color:'#FFF',fontWeight:'900'} });
