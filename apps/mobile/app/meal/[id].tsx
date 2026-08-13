import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getMeals, hasAuthSession, Meal } from '../../lib/api';

export default function MealDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void hasAuthSession().then(async (ok) => {
      if (!ok) { router.replace('/'); return; }
      try { setMeals(await getMeals()); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load meal.'); } finally { setLoading(false); }
    });
  }, []);

  const meal = useMemo(() => meals.find((item) => item.id === id), [meals, id]);
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  if (error || !meal) return <SafeAreaView style={styles.safe}><View style={styles.missing}><Text style={styles.emoji}>🍽️</Text><Text style={styles.title}>{error ? 'Meal unavailable' : 'Meal not found'}</Text><Text style={styles.body}>{error ?? 'This meal may have been removed or is no longer available.'}</Text><Pressable onPress={() => router.replace('/meals')} style={styles.primary}><Text style={styles.primaryText}>Back to meals</Text></Pressable></View></SafeAreaView>;

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.nav}><Pressable onPress={() => router.back()}><Text style={styles.navText}>← Meals</Text></Pressable><Text style={styles.type}>{meal.type}</Text></View>
    <Text style={styles.eyebrow}>MEAL DETAILS</Text><Text style={styles.title}>{meal.name}</Text><Text style={styles.time}>{new Date(meal.eatenAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</Text>
    <View style={styles.hero}><Metric label="Calories" value={`${Math.round(meal.calories)} kcal`} /><Metric label="Protein" value={`${Math.round(meal.protein)} g`} /><Metric label="Carbs" value={`${Math.round(meal.carbs)} g`} /><Metric label="Fat" value={`${Math.round(meal.fat)} g`} /></View>
    <View style={styles.card}><Text style={styles.sectionTitle}>Ingredients</Text>{meal.items.map((item) => <View key={item.id} style={styles.ingredient}><View style={styles.copy}><Text style={styles.foodName}>{item.food.name}</Text><Text style={styles.foodMeta}>{item.quantity} serving{item.quantity === 1 ? '' : 's'}</Text></View><Text style={styles.foodCalories}>{Math.round(item.calories)} kcal</Text></View>)}</View>
    <Pressable onPress={() => router.push('/meal-builder')} style={styles.primary}><Text style={styles.primaryText}>Log another meal</Text></Pressable>
  </ScrollView></SafeAreaView>;
}
function Metric({ label, value }: { label: string; value: string }) { return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>; }
const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:'#F7F8FA'},center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#F7F8FA'},content:{padding:20,gap:14,paddingBottom:40},nav:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},navText:{fontWeight:'900',color:'#111827'},type:{fontSize:11,fontWeight:'900',color:'#6B7280',textTransform:'uppercase'},eyebrow:{fontSize:10,letterSpacing:1.5,fontWeight:'900',color:'#6B7280'},title:{fontSize:30,fontWeight:'900',color:'#111827'},time:{fontSize:12,color:'#9CA3AF',marginTop:-8},hero:{backgroundColor:'#111827',borderRadius:20,padding:17,flexDirection:'row',flexWrap:'wrap',gap:10},metric:{width:'47%',backgroundColor:'#FFFFFF12',borderRadius:14,padding:12},metricLabel:{fontSize:10,color:'#9CA3AF'},metricValue:{fontSize:15,fontWeight:'900',color:'#FFF',marginTop:4},card:{backgroundColor:'#FFF',borderRadius:20,padding:17},sectionTitle:{fontSize:16,fontWeight:'900',color:'#111827',marginBottom:5},ingredient:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#F3F4F6'},copy:{flex:1},foodName:{fontSize:13,fontWeight:'900',color:'#111827'},foodMeta:{fontSize:10,color:'#9CA3AF',marginTop:3},foodCalories:{fontSize:12,fontWeight:'900',color:'#374151'},missing:{flex:1,padding:30,alignItems:'center',justifyContent:'center'},emoji:{fontSize:34},body:{fontSize:13,lineHeight:20,color:'#6B7280',textAlign:'center',marginTop:8},primary:{backgroundColor:'#111827',borderRadius:15,padding:15,marginTop:2},primaryText:{color:'#FFF',fontWeight:'900',textAlign:'center'}});
