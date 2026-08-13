import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { FoodItem, NutritionSummary, createMeal, getFoods, getNutritionSummary, hasAuthSession } from '../lib/api';

export default function NutritionScreen() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Array<{ food: FoodItem; quantity: number }>>([]);
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [foodData, summaryData] = await Promise.all([getFoods(query.trim() || undefined), getNutritionSummary()]);
      setFoods(foodData.slice(0, 30));
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load nutrition');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { void hasAuthSession().then((ok) => { if (ok) void load(); else setLoading(false); }); }, [load]);

  const addFood = (food: FoodItem) => {
    setSelected((current) => {
      const found = current.find((item) => item.food.id === food.id);
      return found ? current.map((item) => item.food.id === food.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { food, quantity: 1 }];
    });
  };

  const saveMeal = async () => {
    if (!selected.length) return;
    setSaving(true);
    try {
      await createMeal({ name: 'Quick meal', type: 'meal', eatenAt: new Date().toISOString(), items: selected.map((item) => ({ foodId: item.food.id, quantity: item.quantity })) });
      setSelected([]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save meal');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} />}>
      <View style={styles.nav}><Link href="/daily" asChild><Pressable><Text style={styles.navText}>← Today</Text></Pressable></Link><Text style={styles.eyebrow}>NUTRITION</Text><Link href="/" asChild><Pressable><Text style={styles.navText}>Home →</Text></Pressable></Link></View>
      <Text style={styles.title}>Eat, log, understand.</Text>
      <Text style={styles.subtitle}>Choose foods from your catalog and I’ll update today’s totals automatically.</Text>
      {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
      <View style={styles.summary}><Text style={styles.summaryLabel}>TODAY</Text><Text style={styles.summaryTitle}>{summary?.meals.count ?? 0} meals logged</Text><View style={styles.summaryRow}><Text style={styles.summaryMetric}>🔥 {summary?.meals.calories ?? 0} kcal</Text><Text style={styles.summaryMetric}>🥩 {summary?.meals.protein ?? 0}g protein</Text></View></View>
      <View style={styles.card}><Text style={styles.cardTitle}>Find a food</Text><TextInput value={query} onChangeText={setQuery} placeholder="Search eggs, rice, chicken..." placeholderTextColor="#9CA3AF" style={styles.input} />
        {foods.map((food) => <Pressable key={food.id} onPress={() => addFood(food)} style={styles.foodRow}><View style={styles.foodCopy}><Text style={styles.foodName}>{food.name}</Text><Text style={styles.foodMeta}>{food.category} · {food.calories} kcal · {food.protein}g protein</Text></View><Text style={styles.add}>+</Text></Pressable>)}
        {!foods.length ? <Text style={styles.body}>No foods found. Add one to your catalog first.</Text> : null}
      </View>
      <View style={styles.card}><Text style={styles.cardTitle}>Quick meal</Text>{selected.length ? selected.map((item) => <View key={item.food.id} style={styles.selectedRow}><Text style={styles.selectedName}>{item.food.name}</Text><Text style={styles.selectedValue}>× {item.quantity}</Text></View>) : <Text style={styles.body}>Tap foods above to build a meal.</Text>}<Pressable disabled={!selected.length || saving} onPress={() => void saveMeal()} style={[styles.button, (!selected.length || saving) && styles.disabled]}><Text style={styles.buttonText}>{saving ? 'Saving…' : 'Save meal'}</Text></Pressable></View>
      <View style={styles.card}><Text style={styles.cardTitle}>Goal progress</Text><Text style={styles.body}>Calories: {summary?.progress.caloriesPercent ?? 0}% · Protein: {summary?.progress.proteinPercent ?? 0}% · Water: {summary?.progress.waterPercent ?? 0}%</Text></View>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({safe:{flex:1,backgroundColor:'#F7F8FA'},center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#F7F8FA'},content:{padding:20,gap:14,paddingBottom:40},nav:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},navText:{fontWeight:'800',color:'#111827'},eyebrow:{fontSize:10,letterSpacing:1.5,fontWeight:'900',color:'#6B7280'},title:{fontSize:30,fontWeight:'900',color:'#111827'},subtitle:{fontSize:14,lineHeight:20,color:'#6B7280'},summary:{backgroundColor:'#111827',borderRadius:22,padding:20,gap:8},summaryLabel:{fontSize:10,letterSpacing:1.4,fontWeight:'900',color:'#9CA3AF'},summaryTitle:{fontSize:23,fontWeight:'900',color:'#FFF'},summaryRow:{flexDirection:'row',justifyContent:'space-between'},summaryMetric:{fontSize:12,fontWeight:'800',color:'#E5E7EB'},card:{backgroundColor:'#FFF',borderRadius:20,padding:18,gap:10},cardTitle:{fontSize:17,fontWeight:'900',color:'#111827'},input:{backgroundColor:'#F3F4F6',borderRadius:14,padding:14,fontSize:14,color:'#111827'},foodRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:10,borderTopWidth:1,borderTopColor:'#F3F4F6'},foodCopy:{flex:1,paddingRight:10},foodName:{fontSize:14,fontWeight:'900',color:'#111827'},foodMeta:{fontSize:11,color:'#6B7280',marginTop:3},add:{fontSize:24,fontWeight:'900',color:'#111827'},selectedRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:6},selectedName:{fontSize:13,fontWeight:'800',color:'#111827'},selectedValue:{fontSize:13,fontWeight:'900',color:'#6B7280'},body:{fontSize:13,lineHeight:20,color:'#4B5563'},button:{backgroundColor:'#111827',padding:14,borderRadius:14,marginTop:4},buttonText:{color:'#FFF',fontWeight:'900',textAlign:'center'},disabled:{opacity:0.45},error:{backgroundColor:'#FEE2E2',borderRadius:14,padding:12},errorText:{fontSize:12,fontWeight:'700',color:'#991B1B'}});
