import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { hasAuthSession } from '../lib/api';
import { getInventory, InventoryItem, setInventoryQuantity } from '../lib/inventory-api';

export default function InventoryScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setError(null); setItems(await getInventory()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to load inventory.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { void hasAuthSession().then((ok) => { if (ok) void load(); else router.replace('/'); }); }, [load]);

  const urgent = useMemo(() => items.filter((item) => item.urgency === 'critical' || item.urgency === 'soon'), [items]);
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  const adjust = async (item: InventoryItem, delta: number) => {
    const quantity = Math.max(0, item.quantity + delta);
    try { const updated = await setInventoryQuantity(item.id, quantity); setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, ...updated } : entry)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to update stock.'); }
  };

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
    <View style={styles.nav}><Pressable onPress={() => router.back()}><Text style={styles.navText}>← Back</Text></Pressable><Pressable onPress={() => router.push('/smart-meals')}><Text style={styles.navText}>Smart Meals</Text></Pressable></View>
    <Text style={styles.eyebrow}>HOUSEHOLD</Text><Text style={styles.title}>Inventory</Text><Text style={styles.subtitle}>Know what you have, what is running low, and what the assistant should buy next.</Text>
    <View style={styles.summary}><View><Text style={styles.summaryLabel}>Items tracked</Text><Text style={styles.summaryValue}>{items.length}</Text></View><View><Text style={styles.summaryLabel}>Need attention</Text><Text style={styles.summaryValue}>{urgent.length}</Text></View><View><Text style={styles.summaryLabel}>Critical</Text><Text style={styles.summaryValue}>{items.filter((item) => item.urgency === 'critical').length}</Text></View></View>
    {error ? <View style={styles.error}><Text style={styles.errorTitle}>Inventory update</Text><Text style={styles.body}>{error}</Text></View> : null}
    {items.length ? items.map((item) => <View key={item.id} style={styles.card}><View style={styles.cardTop}><View style={styles.copy}><Text style={styles.name}>{item.food.name}</Text><Text style={styles.meta}>{item.food.category} · {item.unit}</Text></View><View style={[styles.badge, item.urgency === 'critical' && styles.badgeCritical, item.urgency === 'soon' && styles.badgeSoon]}><Text style={styles.badgeText}>{item.urgency}</Text></View></View><View style={styles.stockRow}><View><Text style={styles.stockLabel}>Stock</Text><Text style={styles.stockValue}>{Math.round(item.quantity * 10) / 10} {item.unit}</Text></View><View><Text style={styles.stockLabel}>Days left</Text><Text style={styles.stockValue}>{item.daysRemaining == null ? '—' : `${Math.max(0, Math.round(item.daysRemaining * 10) / 10)}d`}</Text></View><View><Text style={styles.stockLabel}>Buy</Text><Text style={styles.stockValue}>{item.recommendedQuantity > 0 ? `+${Math.round(item.recommendedQuantity * 10) / 10}` : 'Enough'}</Text></View></View><Text style={styles.reason}>{item.reason.replaceAll('_', ' ')}</Text><View style={styles.actions}><Pressable onPress={() => void adjust(item, -1)} style={styles.adjust}><Text style={styles.adjustText}>−</Text></Pressable><Pressable onPress={() => void adjust(item, 1)} style={styles.adjust}><Text style={styles.adjustText}>+</Text></Pressable></View></View>) : <View style={styles.empty}><Text style={styles.emptyTitle}>Your pantry is empty here</Text><Text style={styles.body}>Start adding foods to inventory and the assistant will forecast when they need replenishing.</Text><Pressable onPress={() => router.push('/meal-builder')} style={styles.button}><Text style={styles.buttonText}>Open Food Catalog</Text></Pressable></View>}
    <View style={styles.note}><Text style={styles.noteTitle}>Assistant connection</Text><Text style={styles.body}>Inventory forecasts already feed the same household intelligence layer used for reorder planning. The next step is turning low-stock items into a shopping basket automatically.</Text></View>
  </ScrollView></SafeAreaView>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#F7F8FA'},center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#F7F8FA'},content:{padding:20,gap:14,paddingBottom:40},nav:{flexDirection:'row',justifyContent:'space-between'},navText:{fontWeight:'900',color:'#111827'},eyebrow:{fontSize:10,letterSpacing:1.5,fontWeight:'900',color:'#6B7280'},title:{fontSize:32,fontWeight:'900',color:'#111827'},subtitle:{fontSize:14,lineHeight:21,color:'#6B7280'},summary:{backgroundColor:'#111827',borderRadius:20,padding:18,flexDirection:'row',justifyContent:'space-between'},summaryLabel:{fontSize:10,color:'#9CA3AF'},summaryValue:{fontSize:22,fontWeight:'900',color:'#FFF',marginTop:4},card:{backgroundColor:'#FFF',borderRadius:20,padding:17},cardTop:{flexDirection:'row',gap:10},copy:{flex:1},name:{fontSize:17,fontWeight:'900',color:'#111827'},meta:{fontSize:11,color:'#9CA3AF',marginTop:4,textTransform:'capitalize'},badge:{backgroundColor:'#ECFDF5',borderRadius:10,paddingHorizontal:9,paddingVertical:6,height:28},badgeSoon:{backgroundColor:'#FEF3C7'},badgeCritical:{backgroundColor:'#FEE2E2'},badgeText:{fontSize:9,fontWeight:'900',color:'#374151',textTransform:'uppercase'},stockRow:{flexDirection:'row',gap:28,marginTop:14,paddingTop:12,borderTopWidth:1,borderTopColor:'#F3F4F6'},stockLabel:{fontSize:9,color:'#9CA3AF'},stockValue:{fontSize:13,fontWeight:'900',color:'#374151',marginTop:3},reason:{fontSize:11,color:'#6B7280',marginTop:12,textTransform:'capitalize'},actions:{flexDirection:'row',gap:8,justifyContent:'flex-end',marginTop:10},adjust:{width:34,height:34,borderRadius:10,backgroundColor:'#F3F4F6',alignItems:'center',justifyContent:'center'},adjustText:{fontSize:20,fontWeight:'900',color:'#111827'},empty:{backgroundColor:'#FFF',borderRadius:20,padding:28,alignItems:'center'},emptyTitle:{fontSize:17,fontWeight:'900',color:'#111827'},body:{fontSize:13,lineHeight:19,color:'#6B7280',marginTop:5},button:{backgroundColor:'#111827',borderRadius:12,paddingHorizontal:14,paddingVertical:10,marginTop:12},buttonText:{color:'#FFF',fontWeight:'900'},error:{backgroundColor:'#FFF',borderRadius:16,padding:14},errorTitle:{fontWeight:'900',color:'#991B1B'},note:{backgroundColor:'#EEF2FF',borderRadius:16,padding:16},noteTitle:{fontWeight:'900',color:'#111827'}});
