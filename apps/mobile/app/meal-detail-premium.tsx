import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { getMeals, hasAuthSession, Meal } from '../lib/api';
import { PREMIUM } from '../lib/premium-ui';
import { PremiumGlow } from '../components/PremiumGlow';
import { PremiumResultCard } from '../components/PremiumResultCard';
import { MotionPress } from '../lib/motion-components';

export default function MealDetailPremiumScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void hasAuthSession().then(async (ok) => {
      if (!ok) { router.replace('/'); return; }
      try { setMeals(await getMeals()); }
      catch (err) { setError(err instanceof Error ? err.message : 'Unable to load meal.'); }
      finally { setLoading(false); }
    });
  }, []);

  const meal = useMemo(() => meals.find((item) => item.id === id), [meals, id]);
  if (loading) return <View style={styles.loading}><PremiumGlow size={250} opacity={0.14} accent="cyan"/><ActivityIndicator color={PREMIUM.colors.primaryBright}/><Text style={styles.loadingTitle}>Opening your meal</Text></View>;

  if (error || !meal) return <SafeAreaView style={styles.safe}><View style={styles.missing}><PremiumGlow size={240} opacity={0.10} accent="rose"/><View style={styles.missingIcon}><Ionicons name="restaurant-outline" size={24} color={PREMIUM.colors.rose}/></View><Text style={styles.missingTitle}>{error ? 'Meal unavailable' : 'Meal not found'}</Text><Text style={styles.missingBody}>{error ?? 'This meal may have been removed or is no longer available.'}</Text><MotionPress onPress={() => router.replace('/meals')} style={[styles.primary, styles.missingPrimary]}><Text style={styles.primaryText}>Back to meals</Text></MotionPress></View></SafeAreaView>;

  return <SafeAreaView style={styles.safe}>
    <View style={styles.bg} pointerEvents="none"><PremiumGlow size={420} opacity={0.08} accent="cyan"/><View style={styles.blob}/></View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.top}><Pressable onPress={() => router.back()} style={styles.icon}><Ionicons name="arrow-back" size={18} color={PREMIUM.colors.inkSoft}/></Pressable><View style={styles.titleWrap}><Text style={styles.kicker}>NUTRITION MOMENT</Text><Text style={styles.topType}>{meal.type}</Text></View><Pressable onPress={() => router.push('/assistant')} style={styles.icon}><Ionicons name="mic-outline" size={18} color={PREMIUM.colors.primaryBright}/></Pressable></View>
      <Text style={styles.title}>{meal.name}</Text><Text style={styles.time}>{new Date(meal.eatenAt).toLocaleString([], {dateStyle:'medium',timeStyle:'short'})}</Text>

      <View style={styles.hero}><View style={styles.heroGlow}/><Text style={styles.heroKicker}>MEAL SNAPSHOT</Text><Text style={styles.heroCalories}>{Math.round(meal.calories)}<Text style={styles.heroUnit}> kcal</Text></Text><View style={styles.macroRow}><Metric label="Protein" value={`${Math.round(meal.protein)} g`} tone="mint"/><Metric label="Carbs" value={`${Math.round(meal.carbs)} g`} tone="cyan"/><Metric label="Fat" value={`${Math.round(meal.fat)} g`} tone="amber"/></View></View>

      <PremiumResultCard eyebrow="YOU ATE" title={`${meal.items.length} ingredients in this meal`} detail="Everything below is tied to the food data already stored in MYPA, so the nutrition view stays grounded." accent="primary" />

      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>What went into it</Text><Text style={styles.sectionMeta}>{meal.items.length} items</Text></View>
      <View style={styles.ingredients}>{meal.items.map((item,index)=><View key={item.id} style={[styles.ingredient,index===meal.items.length-1&&styles.lastIngredient]}><View style={styles.number}><Text style={styles.numberText}>{String(index+1).padStart(2,'0')}</Text></View><View style={styles.ingredientCopy}><Text style={styles.foodName}>{item.food.name}</Text><Text style={styles.foodMeta}>{item.quantity} serving{item.quantity === 1 ? '' : 's'}</Text></View><Text style={styles.foodCalories}>{Math.round(item.calories)} kcal</Text></View>)}</View>

      <View style={styles.actions}><MotionPress onPress={() => router.push('/meal-builder')} style={styles.primary}><Ionicons name="add-circle-outline" size={17} color={PREMIUM.colors.ink}/><Text style={styles.primaryText}>Log another meal</Text></MotionPress><MotionPress onPress={() => router.push('/assistant')} style={styles.secondary}><Ionicons name="sparkles-outline" size={16} color={PREMIUM.colors.inkSoft}/><Text style={styles.secondaryText}>Ask MYPA about this meal</Text></MotionPress></View>
    </ScrollView>
  </SafeAreaView>;
}

function Metric({label,value,tone}:{label:string;value:string;tone:'mint'|'cyan'|'amber'}){return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue,{color:PREMIUM.colors[tone]}]}>{value}</Text></View>}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:PREMIUM.colors.canvas},bg:{...StyleSheet.absoluteFillObject,overflow:'hidden'},blob:{position:'absolute',width:250,height:250,borderRadius:125,left:-110,top:180,backgroundColor:PREMIUM.colors.primary,opacity:.025},content:{padding:18,gap:15,paddingBottom:120},loading:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:PREMIUM.colors.canvas},loadingTitle:{color:PREMIUM.colors.ink,fontSize:15,fontWeight:'900',marginTop:14},top:{flexDirection:'row',alignItems:'center',gap:10},icon:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:PREMIUM.colors.border,backgroundColor:'rgba(255,255,255,0.035)',alignItems:'center',justifyContent:'center'},titleWrap:{flex:1,alignItems:'center'},kicker:{color:PREMIUM.colors.muted,fontSize:8,fontWeight:'900',letterSpacing:1.4},topType:{color:PREMIUM.colors.primaryBright,fontSize:10,fontWeight:'900',marginTop:3,textTransform:'uppercase'},title:{color:PREMIUM.colors.ink,fontSize:29,lineHeight:35,fontWeight:'900'},time:{color:PREMIUM.colors.muted,fontSize:11,marginTop:-9},hero:{borderRadius:26,padding:20,backgroundColor:PREMIUM.colors.ink,overflow:'hidden'},heroGlow:{position:'absolute',width:240,height:240,borderRadius:120,right:-120,top:-100,backgroundColor:PREMIUM.colors.cyan,opacity:.10},heroKicker:{color:PREMIUM.colors.invertedMuted,fontSize:8,fontWeight:'900',letterSpacing:1.2},heroCalories:{color:PREMIUM.colors.white,fontSize:42,lineHeight:48,fontWeight:'900',marginTop:7},heroUnit:{fontSize:14,color:PREMIUM.colors.invertedMuted,fontWeight:'800'},macroRow:{flexDirection:'row',gap:22,marginTop:17},metric:{minWidth:72},metricLabel:{color:PREMIUM.colors.invertedMuted,fontSize:9,fontWeight:'800'},metricValue:{fontSize:13,fontWeight:'900',marginTop:4},sectionHead:{flexDirection:'row',alignItems:'baseline',justifyContent:'space-between'},sectionTitle:{color:PREMIUM.colors.ink,fontSize:18,fontWeight:'900'},sectionMeta:{color:PREMIUM.colors.muted,fontSize:9,fontWeight:'800'},ingredients:{borderRadius:24,backgroundColor:PREMIUM.colors.surfaceGlass,borderWidth:1,borderColor:PREMIUM.colors.border,paddingHorizontal:16},ingredient:{minHeight:64,flexDirection:'row',alignItems:'center',gap:10,borderBottomWidth:1,borderBottomColor:PREMIUM.colors.border},lastIngredient:{borderBottomWidth:0},number:{width:32,height:32,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(139,124,255,0.10)',borderWidth:1,borderColor:'rgba(139,124,255,0.18)'},numberText:{color:PREMIUM.colors.primaryBright,fontSize:9,fontWeight:'900'},ingredientCopy:{flex:1},foodName:{color:PREMIUM.colors.ink,fontSize:12,fontWeight:'900'},foodMeta:{color:PREMIUM.colors.muted,fontSize:9,marginTop:3},foodCalories:{color:PREMIUM.colors.inkSoft,fontSize:11,fontWeight:'900'},actions:{gap:9},primary:{minHeight:50,borderRadius:25,paddingHorizontal:16,backgroundColor:PREMIUM.colors.primaryBright,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8},missingPrimary:{marginTop:16,minWidth:160},primaryText:{color:PREMIUM.colors.ink,fontSize:12,fontWeight:'900'},secondary:{minHeight:50,borderRadius:25,paddingHorizontal:16,backgroundColor:'rgba(255,255,255,0.025)',borderWidth:1,borderColor:PREMIUM.colors.border,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8},secondaryText:{color:PREMIUM.colors.inkSoft,fontSize:12,fontWeight:'900'},missing:{flex:1,alignItems:'center',justifyContent:'center',padding:28,backgroundColor:PREMIUM.colors.canvas},missingIcon:{width:64,height:64,borderRadius:24,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,125,154,0.08)',borderWidth:1,borderColor:'rgba(255,125,154,0.18)'},missingTitle:{color:PREMIUM.colors.ink,fontSize:20,fontWeight:'900',marginTop:14},missingBody:{color:PREMIUM.colors.muted,fontSize:12,lineHeight:18,textAlign:'center',marginTop:6,maxWidth:300}}
});
