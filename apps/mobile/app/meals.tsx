import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getMeals, getNutritionSummary, hasAuthSession, Meal, NutritionSummary } from '../lib/api';

export default function MealsScreen() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [mealData, nutrition] = await Promise.all([getMeals(), getNutritionSummary()]);
      setMeals(mealData);
      setSummary(nutrition);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load meals.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void hasAuthSession().then((ok) => { if (ok) void load(); else router.replace('/'); });
  }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  const filtered = meals.filter((meal) => {
    const value = query.trim().toLowerCase();
    return !value || meal.name.toLowerCase().includes(value) || meal.type.toLowerCase().includes(value) || meal.items.some((item) => item.food.name.toLowerCase().includes(value));
  });
  const caloriesGoal = summary?.goals.calories ?? null;
  const calories = summary?.meals.calories ?? 0;
  const proteinGoal = summary?.goals.protein ?? null;
  const protein = summary?.meals.protein ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <View style={styles.nav}><Pressable onPress={() => router.back()}><Text style={styles.navText}>← Back</Text></Pressable><Pressable onPress={() => router.push('/daily')}><Text style={styles.navText}>Today</Text></Pressable></View>
        <Text style={styles.eyebrow}>NUTRITION</Text>
        <Text style={styles.title}>Meals</Text>
        <Text style={styles.subtitle}>Everything you logged today, connected to your nutrition goals.</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today's balance</Text>
          <View style={styles.summaryRow}>
            <SummaryMetric label="Calories" value={`${Math.round(calories)}`} goal={caloriesGoal} unit="kcal" />
            <SummaryMetric label="Protein" value={`${Math.round(protein)}g`} goal={proteinGoal} unit="g" />
            <SummaryMetric label="Meals" value={`${summary?.meals.count ?? meals.length}`} goal={null} unit="" />
          </View>
          <Text style={styles.status}>{summary?.status.calories ?? ''}{summary?.status.protein ? ` · ${summary.status.protein}` : ''}</Text>
        </View>

        <TextInput value={query} onChangeText={setQuery} placeholder="Search meals or foods..." placeholderTextColor="#9CA3AF" style={styles.search} />

        {error ? <View style={styles.error}><Text style={styles.errorTitle}>Meals unavailable</Text><Text style={styles.body}>{error}</Text><Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable></View> : null}

        {filtered.length ? filtered.map((meal) => (
          <View key={meal.id} style={styles.mealCard}>
            <View style={styles.mealHeader}><View style={styles.mealCopy}><Text style={styles.mealName}>{meal.name}</Text><Text style={styles.mealMeta}>{meal.type} · {new Date(meal.eatenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text></View><Text style={styles.calories}>{Math.round(meal.calories)} kcal</Text></View>
            <View style={styles.macroRow}><Macro label="Protein" value={`${Math.round(meal.protein)}g`} /><Macro label="Carbs" value={`${Math.round(meal.carbs)}g`} /><Macro label="Fat" value={`${Math.round(meal.fat)}g`} /></View>
            <Text style={styles.foods}>{meal.items.map((item) => `${item.food.name} × ${item.quantity}`).join(' · ')}</Text>
          </View>
        )) : <View style={styles.empty}><Text style={styles.emptyEmoji}>🍽️</Text><Text style={styles.emptyTitle}>{query ? 'Nothing matches' : 'No meals logged yet'}</Text><Text style={styles.body}>{query ? 'Try another food or meal name.' : 'Once meals are logged, your nutrition balance will appear here.'}</Text></View>}

        <Pressable onPress={() => router.push('/daily')} style={styles.primary}><Text style={styles.primaryText}>Back to Command Center</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryMetric({ label, value, goal, unit }: { label: string; value: string; goal: number | null; unit: string }) {
  const current = Number.parseFloat(value) || 0;
  const percent = goal ? Math.min(100, Math.round((current / goal) * 100)) : null;
  return <View style={styles.summaryMetric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text>{percent !== null ? <Text style={styles.metricGoal}>{percent}% of {Math.round(goal)} {unit}</Text> : <Text style={styles.metricGoal}>today</Text>}</View>;
}
function Macro({ label, value }: { label: string; value: string }) { return <View><Text style={styles.macroLabel}>{label}</Text><Text style={styles.macroValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F7F8FA'}, center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#F7F8FA'}, content:{padding:20,gap:14,paddingBottom:40}, nav:{flexDirection:'row',justifyContent:'space-between'}, navText:{fontWeight:'900',color:'#111827'}, eyebrow:{fontSize:11,letterSpacing:1.6,fontWeight:'900',color:'#6B7280'}, title:{fontSize:32,fontWeight:'900',color:'#111827'}, subtitle:{fontSize:14,lineHeight:21,color:'#6B7280',marginTop:-6}, summaryCard:{backgroundColor:'#111827',borderRadius:22,padding:18}, summaryTitle:{color:'#FFF',fontSize:17,fontWeight:'900'}, summaryRow:{flexDirection:'row',gap:10,marginTop:14}, summaryMetric:{flex:1,backgroundColor:'#FFFFFF12',borderRadius:15,padding:12}, metricLabel:{color:'#D1D5DB',fontSize:11,fontWeight:'700'}, metricValue:{color:'#FFF',fontSize:20,fontWeight:'900',marginTop:5}, metricGoal:{color:'#9CA3AF',fontSize:9,marginTop:3}, status:{color:'#D1D5DB',fontSize:11,marginTop:12}, search:{backgroundColor:'#FFF',borderRadius:16,paddingHorizontal:15,paddingVertical:13,fontSize:14,color:'#111827'}, mealCard:{backgroundColor:'#FFF',borderRadius:20,padding:17}, mealHeader:{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',gap:10}, mealCopy:{flex:1}, mealName:{fontSize:17,fontWeight:'900',color:'#111827'}, mealMeta:{fontSize:11,color:'#9CA3AF',marginTop:4,textTransform:'capitalize'}, calories:{fontSize:13,fontWeight:'900',color:'#111827'}, macroRow:{flexDirection:'row',gap:22,marginTop:14,paddingTop:12,borderTopWidth:1,borderTopColor:'#F3F4F6'}, macroLabel:{fontSize:10,color:'#9CA3AF'}, macroValue:{fontSize:13,fontWeight:'900',color:'#374151',marginTop:2}, foods:{fontSize:11,lineHeight:17,color:'#6B7280',marginTop:12}, empty:{backgroundColor:'#FFF',borderRadius:20,padding:28,alignItems:'center'}, emptyEmoji:{fontSize:30}, emptyTitle:{fontSize:17,fontWeight:'900',color:'#111827',marginTop:10}, body:{fontSize:13,lineHeight:19,color:'#6B7280',textAlign:'center',marginTop:6}, error:{backgroundColor:'#FFF',borderRadius:20,padding:18}, errorTitle:{fontSize:16,fontWeight:'900',color:'#991B1B'}, retry:{alignSelf:'flex-start',backgroundColor:'#111827',paddingHorizontal:14,paddingVertical:9,borderRadius:11,marginTop:12}, retryText:{color:'#FFF',fontWeight:'900'}, primary:{backgroundColor:'#111827',padding:15,borderRadius:15}, primaryText:{color:'#FFF',fontWeight:'900',textAlign:'center'}
});
