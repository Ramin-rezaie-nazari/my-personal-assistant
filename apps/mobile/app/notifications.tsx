import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Notification, getNotifications, hasAuthSession, markNotificationRead } from '../lib/api';

const iconForType: Record<string, string> = {
  hydration: '💧',
  nutrition: '🍽️',
  workout: '🏋️',
  habit: '✅',
  supplement: '💊',
  reminder: '⏰',
};
const labelForPriority: Record<number, string> = { 1: 'Important', 2: 'Helpful', 3: 'Nice to know' };

export default function NotificationsScreen() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await getNotifications());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void hasAuthSession().then((ok) => {
      if (ok) void load();
      else setLoading(false);
    });
  }, [load]);

  const read = async (id: string) => {
    await markNotificationRead(id);
    setItems((current) => current.filter((item) => item.id !== id));
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      >
        <View style={styles.nav}>
          <Link href="/" asChild><Pressable><Text style={styles.back}>← Home</Text></Pressable></Link>
          <Link href="/daily" asChild><Pressable><Text style={styles.today}>Today →</Text></Pressable></Link>
        </View>
        <Text style={styles.eyebrow}>PERSONAL ASSISTANT</Text>
        <Text style={styles.title}>Inbox</Text>
        <Text style={styles.subtitle}>Useful nudges from your assistant, ranked so the important ones rise to the top.</Text>

        {error ? <View style={styles.card}><Text style={styles.cardTitle}>Inbox unavailable</Text><Text style={styles.body}>{error}</Text><Pressable onPress={() => void load()} style={styles.button}><Text style={styles.buttonText}>Retry</Text></Pressable></View> : null}

        {!error && items.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.cardTitle}>You’re all caught up</Text>
            <Text style={styles.body}>No unread assistant notifications right now.</Text>
          </View>
        ) : null}

        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.icon}>{iconForType[item.type] ?? '🧠'}</Text>
              <View style={styles.copy}>
                <View style={styles.metaRow}>
                  <Text style={styles.priority}>{labelForPriority[item.priority] ?? 'Assistant'}</Text>
                  <Text style={styles.type}>{item.type}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
                <Text style={styles.meta}>{new Date(item.scheduledAt ?? item.createdAt).toLocaleString()}</Text>
              </View>
            </View>
            <Pressable onPress={() => void read(item.id)} style={styles.button}><Text style={styles.buttonText}>Mark as read</Text></Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F7F8FA'}, center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#F7F8FA'}, content:{padding:20,gap:14,paddingBottom:36}, nav:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, back:{fontWeight:'800',color:'#374151'}, today:{fontWeight:'800',color:'#111827'}, eyebrow:{fontSize:11,letterSpacing:1.5,fontWeight:'900',color:'#6B7280',marginTop:8}, title:{fontSize:31,fontWeight:'900',color:'#111827'}, subtitle:{fontSize:14,lineHeight:20,color:'#6B7280'}, card:{backgroundColor:'#FFF',borderRadius:20,padding:18,gap:10}, row:{flexDirection:'row',alignItems:'flex-start'}, icon:{fontSize:25,marginRight:12}, copy:{flex:1}, metaRow:{flexDirection:'row',alignItems:'center',gap:7,marginBottom:5}, priority:{fontSize:10,fontWeight:'900',color:'#111827',textTransform:'uppercase'}, type:{fontSize:10,color:'#9CA3AF',fontWeight:'800'}, cardTitle:{fontSize:17,fontWeight:'900',color:'#111827'}, body:{fontSize:13,lineHeight:20,color:'#4B5563',marginTop:5}, meta:{fontSize:10,color:'#9CA3AF',fontWeight:'700',marginTop:8}, emptyIcon:{fontSize:30}, button:{alignSelf:'flex-start',backgroundColor:'#111827',paddingHorizontal:13,paddingVertical:10,borderRadius:11}, buttonText:{color:'#FFF',fontWeight:'900'} });
