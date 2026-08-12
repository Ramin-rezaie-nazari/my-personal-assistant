import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { CalendarEvent, completeCalendarEvent, createCalendarEvent, getCalendarEvents, hasAuthSession } from '../lib/api';

const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

export default function CalendarScreen() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rangeStart, setRangeStart] = useState(() => startOfDay(new Date()));
  const rangeEnd = useMemo(() => new Date(rangeStart.getTime() + 7 * 24 * 60 * 60 * 1000), [rangeStart]);

  const load = useCallback(async () => {
    try { setError(null); setEvents(await getCalendarEvents(rangeStart.toISOString(), rangeEnd.toISOString())); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to load calendar'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [rangeStart, rangeEnd]);

  useEffect(() => { void hasAuthSession().then((ok) => { if (ok) void load(); else setLoading(false); }); }, [load]);

  const addEvent = async () => {
    if (!title.trim() || !/^\d{2}:\d{2}$/.test(time)) { setError('Add a title and a valid time like 18:30.'); return; }
    try {
      setBusy(true); setError(null);
      const [hours, minutes] = time.split(':').map(Number);
      const startsAt = new Date(rangeStart); startsAt.setHours(hours, minutes, 0, 0);
      await createCalendarEvent({ title: title.trim(), type: 'calendar', startsAt: startsAt.toISOString() });
      setTitle(''); setTime(''); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to create event'); }
    finally { setBusy(false); }
  };

  const complete = async (id: string) => { await completeCalendarEvent(id); setEvents((items) => items.map((item) => item.id === id ? { ...item, completed: true } : item)); };
  const grouped = events.reduce<Record<string, CalendarEvent[]>>((acc, event) => { const key = dateKey(new Date(event.startsAt)); (acc[key] ??= []).push(event); return acc; }, {});

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <View style={styles.nav}><Link href="/" asChild><Pressable><Text style={styles.link}>← Home</Text></Pressable></Link><Link href="/daily" asChild><Pressable><Text style={styles.link}>Today →</Text></Pressable></Link></View>
        <Text style={styles.eyebrow}>PERSONAL ASSISTANT</Text>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.subtitle}>Your next 7 days, tied into the same reminder engine your assistant already uses.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add something</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor="#9CA3AF" style={styles.input} />
          <TextInput value={time} onChangeText={setTime} placeholder="Time (HH:MM)" placeholderTextColor="#9CA3AF" keyboardType="numbers-and-punctuation" style={styles.input} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable onPress={() => void addEvent()} disabled={busy} style={styles.primary}><Text style={styles.primaryText}>{busy ? 'Saving…' : 'Add to calendar'}</Text></Pressable>
          <View style={styles.switchRow}><Pressable onPress={() => setRangeStart((d) => new Date(d.getTime() - 7 * 24 * 60 * 60 * 1000))}><Text style={styles.link}>← Previous week</Text></Pressable><Pressable onPress={() => setRangeStart(startOfDay(new Date()))}><Text style={styles.link}>This week</Text></Pressable><Pressable onPress={() => setRangeStart((d) => new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000))}><Text style={styles.link}>Next week →</Text></Pressable></View>
        </View>

        {Object.entries(grouped).map(([day, dayEvents]) => (
          <View key={day} style={styles.dayBlock}>
            <Text style={styles.dayTitle}>{new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
            {dayEvents.map((event) => (
              <View key={event.id} style={[styles.event, event.completed && styles.completed]}>
                <View style={styles.eventTime}><Text style={styles.time}>{new Date(event.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text><Text style={styles.type}>{event.type}</Text></View>
                <View style={styles.eventCopy}><Text style={styles.eventTitle}>{event.title}</Text>{event.completed ? <Text style={styles.done}>Completed</Text> : <Pressable onPress={() => void complete(event.id)}><Text style={styles.complete}>Mark complete</Text></Pressable>}</View>
              </View>
            ))}
          </View>
        ))}

        {!events.length ? <View style={styles.card}><Text style={styles.cardTitle}>Your calendar is clear ✨</Text><Text style={styles.subtitle}>Create the first event above and it will also be available to your reminder-aware assistant.</Text></View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:'#F7F8FA'}, center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#F7F8FA'}, content:{padding:20,gap:14,paddingBottom:36}, nav:{flexDirection:'row',justifyContent:'space-between'}, link:{fontWeight:'800',color:'#111827'}, eyebrow:{fontSize:11,letterSpacing:1.5,fontWeight:'900',color:'#6B7280',marginTop:8}, title:{fontSize:31,fontWeight:'900',color:'#111827'}, subtitle:{fontSize:14,lineHeight:20,color:'#6B7280'}, card:{backgroundColor:'#FFF',borderRadius:20,padding:18,gap:10}, cardTitle:{fontSize:18,fontWeight:'900',color:'#111827'}, input:{backgroundColor:'#F3F4F6',borderRadius:12,paddingHorizontal:14,paddingVertical:12,color:'#111827'}, primary:{backgroundColor:'#111827',padding:13,borderRadius:12,alignItems:'center'}, primaryText:{color:'#FFF',fontWeight:'900'}, error:{color:'#B91C1C',fontWeight:'700'}, switchRow:{flexDirection:'row',justifyContent:'space-between'}, dayBlock:{gap:8}, dayTitle:{fontSize:16,fontWeight:'900',color:'#111827',marginTop:8}, event:{backgroundColor:'#FFF',borderRadius:18,padding:16,flexDirection:'row',gap:14}, completed:{opacity:0.55}, eventTime:{width:76}, time:{fontSize:15,fontWeight:'900',color:'#111827'}, type:{fontSize:10,fontWeight:'800',color:'#9CA3AF',marginTop:3,textTransform:'uppercase'}, eventCopy:{flex:1}, eventTitle:{fontSize:16,fontWeight:'800',color:'#111827'}, complete:{fontSize:12,fontWeight:'800',color:'#111827',marginTop:6}, done:{fontSize:12,fontWeight:'800',color:'#6B7280',marginTop:6} });
