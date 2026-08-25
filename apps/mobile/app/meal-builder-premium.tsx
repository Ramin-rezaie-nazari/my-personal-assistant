import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { createMeal, FoodItem, getFoods, hasAuthSession } from '../lib/api';
import { BRAND } from '../lib/branding';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
type MealType = typeof MEAL_TYPES[number];
type SelectedFood = FoodItem & { quantity: number };

export default function MealBuilderPremiumScreen() {
  const [name, setName] = useState('');
  const [type, setType] = useState<MealType>('lunch');
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [selected, setSelected] = useState<SelectedFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFoods = useCallback(async (value = '') => {
    try { setError(null); setFoods(await getFoods(value.trim() || undefined)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to load foods.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void hasAuthSession().then((ok) => { if (!ok) router.replace('/auth'); else void loadFoods(); }); }, [loadFoods]);
  useEffect(() => { const timer = setTimeout(() => { if (query.trim()) void loadFoods(query); }, 240); return () => clearTimeout(timer); }, [query, loadFoods]);

  const totals = useMemo(() => selected.reduce((sum, food) => ({
    calories: sum.calories + food.calories * food.quantity,
    protein: sum.protein + food.protein * food.quantity,
    carbs: sum.carbs + food.carbs * food.quantity,
    fat: sum.fat + food.fat * food.quantity,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }), [selected]);

  const addFood = (food: FoodItem) => setSelected((current) => current.some((item) => item.id === food.id)
    ? current.map((item) => item.id === food.id ? { ...item, quantity: item.quantity + 1 } : item)
    : [...current, { ...food, quantity: 1 }]);
  const changeQuantity = (id: string, delta: number) => setSelected((current) => current.flatMap((item) => item.id !== id ? [item] : item.quantity + delta > 0 ? [{ ...item, quantity: item.quantity + delta }] : []));

  const save = async () => {
    if (!name.trim() || !selected.length) { setError('Give the meal a name and add at least one food.'); return; }
    try {
      setSaving(true); setError(null);
      const now = new Date();
      await createMeal({ name: name.trim(), type, eatenAt: now.toISOString(), dateKey: now.toISOString().slice(0, 10), items: selected.map((food) => ({ foodId: food.id, quantity: food.quantity })) });
      router.replace('/meals');
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save meal.'); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={styles.center}><View style={styles.loaderOrb}><Text style={styles.loaderMark}>M</Text></View><ActivityIndicator color={BRAND.colors.primary} style={styles.spinner} /></View>;

  return <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.nav}><Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>←</Text></Pressable><View><Text style={styles.eyebrow}>NUTRITION</Text><Text style={styles.navTitle}>Build a meal</Text></View><View style={styles.stepPill}><Text style={styles.stepText}>{selected.length} foods</Text></View></View>

      <View style={styles.hero}><View style={styles.heroGlow} /><Text style={styles.heroEyebrow}>MAKE IT YOURS</Text><Text style={styles.heroTitle}>A meal that fits your day.</Text><Text style={styles.heroText}>Choose foods, adjust portions, and MYPA will calculate the nutrition for you.</Text></View>

      <Text style={styles.label}>Name</Text><TextInput value={name} onChangeText={setName} placeholder="Chicken & rice bowl" placeholderTextColor={BRAND.colors.muted} style={styles.input} />
      <Text style={styles.label}>Moment</Text><View style={styles.types}>{MEAL_TYPES.map((item) => <Pressable key={item} onPress={() => setType(item)} style={[styles.type, type === item && styles.typeActive]}><Text style={[styles.typeText, type === item && styles.typeTextActive]}>{item}</Text></Pressable>)}</View>

      <View style={styles.searchHeader}><Text style={styles.label}>Add food</Text><Text style={styles.selectedHint}>{selected.length ? `${selected.length} selected` : 'Nothing yet'}</Text></View>
      <TextInput value={query} onChangeText={setQuery} placeholder="Search eggs, rice, chicken…" placeholderTextColor={BRAND.colors.muted} style={styles.input} />
      <View style={styles.foodList}>{foods.slice(0, 6).map((food) => <Pressable key={food.id} onPress={() => addFood(food)} style={({ pressed }) => [styles.foodRow, pressed && styles.pressed]}><View style={styles.foodOrb}><Text style={styles.foodOrbText}>{food.name.slice(0, 1).toUpperCase()}</Text></View><View style={styles.foodCopy}><Text style={styles.foodName}>{food.name}</Text><Text style={styles.foodMeta}>{Math.round(food.calories)} kcal · {Math.round(food.protein)}g protein</Text></View><View style={styles.addPill}><Text style={styles.addText}>+ Add</Text></View></Pressable>)}</View>

      <View style={styles.selectedCard}><View style={styles.cardHeader}><View><Text style={styles.cardTitle}>Your meal</Text><Text style={styles.cardSubtitle}>{selected.length ? 'Fine-tune the portions.' : 'Add something above to get started.'}</Text></View><View style={styles.totalBadge}><Text style={styles.totalBadgeValue}>{Math.round(totals.calories)}</Text><Text style={styles.totalBadgeLabel}>kcal</Text></View></View>
        {selected.length ? selected.map((food) => <View key={food.id} style={styles.selectedRow}><View style={styles.selectedCopy}><Text style={styles.foodName}>{food.name}</Text><Text style={styles.foodMeta}>{Math.round(food.calories * food.quantity)} kcal</Text></View><View style={styles.stepper}><Pressable onPress={() => changeQuantity(food.id, -1)} style={styles.step}><Text style={styles.stepText}>−</Text></Pressable><Text style={styles.quantity}>{food.quantity}</Text><Pressable onPress={() => changeQuantity(food.id, 1)} style={styles.step}><Text style={styles.stepText}>+</Text></Pressable></View></View>) : <View style={styles.empty}><Text style={styles.emptyMark}>＋</Text><Text style={styles.emptyTitle}>Your plate is waiting.</Text><Text style={styles.emptyText}>Pick a food and the nutrition story will appear here.</Text></View>}
      </View>

      <View style={styles.nutritionCard}><Text style={styles.nutritionTitle}>Nutrition snapshot</Text><View style={styles.nutritionGrid}><Total label="Calories" value={`${Math.round(totals.calories)} kcal`} /><Total label="Protein" value={`${Math.round(totals.protein)} g`} /><Total label="Carbs" value={`${Math.round(totals.carbs)} g`} /><Total label="Fat" value={`${Math.round(totals.fat)} g`} /></View></View>
      {error ? <View style={styles.error}><Text style={styles.errorTitle}>Couldn’t save this yet</Text><Text style={styles.errorText}>{error}</Text></View> : null}
      <Pressable disabled={saving} onPress={() => void save()} style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed, saving && styles.disabled]}><Text style={styles.primaryText}>{saving ? 'Saving your meal…' : 'Save this meal  →'}</Text></Pressable>
      <Text style={styles.footer}>Your saved foods and nutrition data stay the source of truth.</Text>
    </ScrollView>
  </SafeAreaView>;
}

function Total({ label, value }: { label: string; value: string }) { return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:BRAND.colors.canvas}, content:{padding:20,gap:12,paddingBottom:40}, center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:BRAND.colors.canvas}, loaderOrb:{width:64,height:64,borderRadius:22,backgroundColor:BRAND.colors.ink,alignItems:'center',justifyContent:'center'}, loaderMark:{fontSize:25,fontWeight:'900',color:BRAND.colors.white}, spinner:{marginTop:14}, nav:{flexDirection:'row',alignItems:'center',gap:10}, back:{width:42,height:42,borderRadius:21,backgroundColor:BRAND.colors.surface,alignItems:'center',justifyContent:'center'}, backText:{fontSize:19,fontWeight:'900',color:BRAND.colors.ink}, eyebrow:{fontSize:9,letterSpacing:1.5,fontWeight:'900',color:BRAND.colors.primary}, navTitle:{fontSize:16,fontWeight:'900',color:BRAND.colors.ink,marginTop:2}, stepPill:{marginLeft:'auto',backgroundColor:BRAND.colors.primarySoft,paddingHorizontal:10,paddingVertical:8,borderRadius:14}, stepText:{fontSize:10,fontWeight:'900',color:BRAND.colors.primaryStrong}, hero:{overflow:'hidden',backgroundColor:BRAND.colors.ink,borderRadius:25,padding:20}, heroGlow:{position:'absolute',right:-50,top:-60,width:170,height:170,borderRadius:85,backgroundColor:BRAND.colors.primary,opacity:.22}, heroEyebrow:{fontSize:9,letterSpacing:1.5,fontWeight:'900',color:'#BEB3FF'}, heroTitle:{fontSize:26,lineHeight:32,fontWeight:'900',color:BRAND.colors.white,marginTop:6}, heroText:{fontSize:12,lineHeight:18,color:BRAND.colors.invertedMuted,marginTop:7,maxWidth:310}, label:{fontSize:11,fontWeight:'900',color:BRAND.colors.inkSoft,marginTop:3}, input:{minHeight:50,backgroundColor:BRAND.colors.surface,borderWidth:1,borderColor:BRAND.colors.border,borderRadius:15,paddingHorizontal:14,color:BRAND.colors.ink}, types:{flexDirection:'row',gap:7}, type:{paddingHorizontal:12,paddingVertical:9,borderRadius:12,backgroundColor:BRAND.colors.surfaceWarm}, typeActive:{backgroundColor:BRAND.colors.ink}, typeText:{fontSize:10,fontWeight:'900',color:BRAND.colors.muted,textTransform:'capitalize'}, typeTextActive:{color:BRAND.colors.white}, searchHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, selectedHint:{fontSize:10,fontWeight:'800',color:BRAND.colors.muted}, foodList:{backgroundColor:BRAND.colors.surface,borderRadius:20,borderWidth:1,borderColor:BRAND.colors.border,overflow:'hidden'}, foodRow:{minHeight:66,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:10,borderBottomWidth:1,borderBottomColor:BRAND.colors.border}, foodOrb:{width:38,height:38,borderRadius:13,backgroundColor:BRAND.colors.surfaceWarm,alignItems:'center',justifyContent:'center'}, foodOrbText:{fontSize:13,fontWeight:'900',color:BRAND.colors.primaryStrong}, foodCopy:{flex:1}, foodName:{fontSize:13,fontWeight:'900',color:BRAND.colors.ink}, foodMeta:{fontSize:10,color:BRAND.colors.muted,marginTop:3}, addPill:{paddingHorizontal:9,paddingVertical:7,borderRadius:10,backgroundColor:BRAND.colors.primarySoft}, addText:{fontSize:10,fontWeight:'900',color:BRAND.colors.primaryStrong}, selectedCard:{backgroundColor:BRAND.colors.surface,borderRadius:22,padding:16,borderWidth:1,borderColor:BRAND.colors.border}, cardHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingBottom:10}, cardTitle:{fontSize:16,fontWeight:'900',color:BRAND.colors.ink}, cardSubtitle:{fontSize:10,color:BRAND.colors.muted,marginTop:3}, totalBadge:{width:54,height:54,borderRadius:18,backgroundColor:BRAND.colors.ink,alignItems:'center',justifyContent:'center'}, totalBadgeValue:{fontSize:16,fontWeight:'900',color:BRAND.colors.white}, totalBadgeLabel:{fontSize:8,color:BRAND.colors.invertedMuted}, selectedRow:{flexDirection:'row',alignItems:'center',paddingVertical:11,borderTopWidth:1,borderTopColor:BRAND.colors.border}, selectedCopy:{flex:1}, stepper:{flexDirection:'row',alignItems:'center',gap:8}, step:{width:30,height:30,borderRadius:10,backgroundColor:BRAND.colors.surfaceWarm,alignItems:'center',justifyContent:'center'}, stepText:{fontSize:17,fontWeight:'900',color:BRAND.colors.ink}, quantity:{minWidth:14,textAlign:'center',fontSize:12,fontWeight:'900',color:BRAND.colors.ink}, empty:{paddingVertical:18,alignItems:'center'}, emptyMark:{fontSize:24,color:BRAND.colors.primaryStrong}, emptyTitle:{fontSize:14,fontWeight:'900',color:BRAND.colors.ink,marginTop:5}, emptyText:{fontSize:11,color:BRAND.colors.muted,marginTop:3,textAlign:'center'}, nutritionCard:{backgroundColor:BRAND.colors.ink,borderRadius:21,padding:17}, nutritionTitle:{fontSize:14,fontWeight:'900',color:BRAND.colors.white,marginBottom:12}, nutritionGrid:{flexDirection:'row',justifyContent:'space-between'}, metricLabel:{fontSize:9,color:BRAND.colors.invertedMuted}, metricValue:{fontSize:13,fontWeight:'900',color:BRAND.colors.white,marginTop:3}, error:{backgroundColor:'#FFF3F3',borderRadius:16,padding:13,borderWidth:1,borderColor:'#F0CACA'}, errorTitle:{fontSize:12,fontWeight:'900',color:'#9F2F2F'}, errorText:{fontSize:11,lineHeight:17,color:'#884646',marginTop:4}, primary:{minHeight:56,borderRadius:17,backgroundColor:BRAND.colors.primary,alignItems:'center',justifyContent:'center'}, primaryPressed:{opacity:.88,transform:[{scale:.99}]}, disabled:{opacity:.55}, primaryText:{fontSize:14,fontWeight:'900',color:BRAND.colors.white}, footer:{fontSize:9,color:BRAND.colors.muted,textAlign:'center',lineHeight:14}, pressed:{opacity:.9,transform:[{scale:.995}]}
});
