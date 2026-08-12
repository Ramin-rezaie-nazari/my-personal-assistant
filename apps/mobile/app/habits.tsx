import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Habit, HabitSummary, createHabit, deleteHabit, getHabitSummary, getHabits, completeHabit, hasAuthSession } from '../lib/api';

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [summary, setSummary] = useState<HabitSummary | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setError(null); const [items, week] = await Promise.all([getHabits(), getHabitSummary()]); setHabits(items); setSummary(week); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to load habits'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { void hasAuthSession().then((ok) => ok ? load() : setLoading(false)); }, [load]);

  const add = async () => {
    if (!name.trim()) return;
    try { setBusy('add'); await createHabit({ name: name.trim(), frequency: 'daily', targetPerWeek: 7 }); setName(''); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to create habit'); }
    finally { setBusy(null); }
  };

  const complete = async (id: string) => { try { setBusy(id); await completeHabit(id); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to complete habit'); } finally { setBusy(null); } };
  const remove = async (id: string) => { try { setBusy(`delete-${id}`); await deleteHabit(id); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to delete habit'); } finally { setBusy(null); } };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
    <Link href="/" asChild><Pressable style={styles.back}><Text style={styles.backText}>← Home</Text></Pressable></Link>
    <Text style={styles.eyebrow}>HABITS</Text><Text style={styles.title}>Build your rhythm</Text><Text style={styles.subtitle}>Small actions become easier when your assistant remembers the streak.</Text>
    {summary ? <View style={styles.hero}><Text style={styles.heroLabel}>7-DAY COMPLETION</Text><Text style={styles.heroValue}>{summary.completionPercent}%</Text><Text style={styles.heroHint}>{summary.completedCount} completions across {summary.activeHabits} active habits</Text></View> : null}
    <View style={styles.addCard}><TextInput value={name} onChangeText={setName} placeholder="Add a daily habit" placeholderTextColor="#9CA3AF" style={styles.input}/><Pressable disabled={busy === 'add'} onPress={() => void add()} style={styles.addButton}><Text style={styles.addText}>{busy === 'add' ? '…' : 'Add habit'}</Text></Pressable></View>
    {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
    {habits.map((habit) => <View key={habit.id} style={styles.card}><View style={styles.row}><View style={styles.copy}><Text style={styles.name}>{habit.name}</Text><Text style={styles.meta}>{habit.stats.streak} day streak · {habit.stats.recentCompletions} recent completions</Text></View><Pressable disabled={busy === habit.id} onPress={() => void complete(habit.id)} style={styles.done}><Text style={styles.doneText}>{busy === habit.id ? '…' : 'Done'}</Text></Pressable></View><Pressable disabled={busy === `delete-${habit.id}`} onPress={() => void remove(habit.id)}><Text style={styles.delete}>{busy === `delete-${habit.id}` ? 'Deleting…' : 'Remove habit'}</Text></Pressable></View>)}
    {!habits.length ? <View style={styles.card}><Text style={styles.name}>No habits yet</Text><Text style={styles.meta}>Start with one small thing you can repeat every day.</Text></View> : null}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:'#F7F8FA'}, content:{padding:20,gap:14,paddingBottom:34}, center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#F7F8FA'}, back:{alignSelf:'flex-start',paddingVertical:8}, backText:{fontWeight:'800',color:'#374151'}, eyebrow:{fontSize:11,fontWeight:'800',letterSpacing:1.5,color:'#6B7280'}, title:{fontSize:31,fontWeight:'900',color:'#111827'}, subtitle:{fontSize:14,color:'#6B7280',lineHeight:20}, hero:{backgroundColor:'#111827',borderRadius:24,padding:20}, heroLabel:{color:'#9CA3AF',fontSize:11,fontWeight:'800',letterSpacing:1.3}, heroValue:{fontSize:40,fontWeight:'900',color:'#FFFFFF',marginTop:5}, heroHint:{color:'#D1D5DB',fontSize:12,marginTop:4}, addCard:{backgroundColor:'#FFFFFF',borderRadius:20,padding:14,flexDirection:'row',gap:10}, input:{flex:1,minHeight:48,borderWidth:1,borderColor:'#E5E7EB',borderRadius:12,paddingHorizontal:14,color:'#111827'}, addButton:{backgroundColor:'#111827',borderRadius:12,paddingHorizontal:16,justifyContent:'center'}, addText:{color:'#FFFFFF',fontWeight:'800'}, card:{backgroundColor:'#FFFFFF',borderRadius:20,padding:18}, row:{flexDirection:'row',alignItems:'center',gap:12}, copy:{flex:1}, name:{fontSize:17,fontWeight:'800',color:'#111827'}, meta:{fontSize:12,color:'#6B7280',marginTop:5}, done:{backgroundColor:'#E5E7EB',borderRadius:12,paddingHorizontal:14,paddingVertical:10}, doneText:{fontWeight:'800',color:'#111827'}, delete:{fontSize:11,color:'#B91C1C',fontWeight:'700',marginTop:14}, error:{backgroundColor:'#FEF2F2',borderRadius:14,padding:12}, errorText:{color:'#991B1B',fontSize:12,fontWeight:'700'} });
