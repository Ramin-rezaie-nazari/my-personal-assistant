import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Supplement, SupplementStatus, createSupplement, deleteSupplement, getSupplementStatus, hasAuthSession, takeSupplement } from '../lib/api';

export default function SupplementsScreen() {
  const [status, setStatus] = useState<SupplementStatus | null>(null);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('09:00');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setStatus(await getSupplementStatus()); } finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { void hasAuthSession().then((ok) => { if (ok) void load(); else setLoading(false); }); }, [load]);

  async function addSupplement() {
    if (!name.trim()) return;
    await createSupplement({ name: name.trim(), dosage: dosage.trim() || undefined, scheduledTime: time });
    setName(''); setDosage(''); setTime('09:00'); await load();
  }
  async function take(item: Supplement) { await takeSupplement(item.id); await load(); }
  async function remove(item: Supplement) { await deleteSupplement(item.id); await load(); }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
    <Link href="/" asChild><Pressable><Text style={styles.back}>← Home</Text></Pressable></Link>
    <Text style={styles.eyebrow}>HEALTH ROUTINE</Text><Text style={styles.title}>Supplements</Text>
    <Text style={styles.subtitle}>{status?.taken ?? 0} of {status?.total ?? 0} taken today · {status?.completionPercent ?? 0}% complete</Text>
    <View style={styles.card}><Text style={styles.cardTitle}>Add a supplement</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Name (e.g. Vitamin D)" style={styles.input}/>
      <TextInput value={dosage} onChangeText={setDosage} placeholder="Dosage (optional)" style={styles.input}/>
      <TextInput value={time} onChangeText={setTime} placeholder="09:00" style={styles.input}/>
      <Pressable style={styles.primary} onPress={() => void addSupplement()}><Text style={styles.primaryText}>Add supplement</Text></Pressable>
    </View>
    {status?.supplements.map((item) => { const taken = Boolean(item.logs?.length); return <View key={item.id} style={styles.card}>
      <View style={styles.row}><View style={styles.copy}><Text style={styles.cardTitle}>{item.name}</Text><Text style={styles.muted}>{item.dosage ?? 'No dosage'} · {item.scheduledTime} · {item.frequency}</Text></View>
        <Pressable style={taken ? styles.done : styles.take} onPress={() => void take(item)} disabled={taken}><Text style={taken ? styles.doneText : styles.takeText}>{taken ? 'Taken ✓' : 'Take'}</Text></Pressable></View>
      <Pressable onPress={() => void remove(item)}><Text style={styles.delete}>Delete</Text></Pressable>
    </View>; })}
    {status?.supplements.length === 0 ? <View style={styles.card}><Text style={styles.cardTitle}>Your routine is empty</Text><Text style={styles.muted}>Add the supplements you want your assistant to track.</Text></View> : null}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:'#F7F8FA'}, content:{padding:20,gap:14,paddingBottom:36}, center:{flex:1,justifyContent:'center',alignItems:'center'}, back:{fontWeight:'800',color:'#374151',paddingVertical:8}, eyebrow:{fontSize:11,fontWeight:'800',letterSpacing:1.5,color:'#6B7280',marginTop:6}, title:{fontSize:32,fontWeight:'900',color:'#111827'}, subtitle:{fontSize:14,color:'#6B7280',marginBottom:4}, card:{backgroundColor:'#FFF',borderRadius:20,padding:18,gap:10}, cardTitle:{fontSize:17,fontWeight:'800',color:'#111827'}, muted:{fontSize:12,color:'#6B7280',lineHeight:18}, input:{borderWidth:1,borderColor:'#E5E7EB',borderRadius:12,padding:12,color:'#111827'}, primary:{backgroundColor:'#111827',borderRadius:12,padding:13,alignItems:'center'}, primaryText:{color:'#FFF',fontWeight:'800'}, row:{flexDirection:'row',alignItems:'center',gap:12}, copy:{flex:1}, take:{backgroundColor:'#111827',paddingHorizontal:13,paddingVertical:10,borderRadius:11}, takeText:{color:'#FFF',fontWeight:'800'}, done:{backgroundColor:'#E5E7EB',paddingHorizontal:13,paddingVertical:10,borderRadius:11}, doneText:{color:'#374151',fontWeight:'800'}, delete:{fontSize:11,color:'#9CA3AF',fontWeight:'700'} });
