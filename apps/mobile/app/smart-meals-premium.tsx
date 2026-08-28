import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { buildSmartMealSuggestions, SmartMealSuggestion } from '../lib/meal-intelligence';
import { getFoods, getNutritionSummary, hasAuthSession, NutritionSummary } from '../lib/api';
import { getInventory, InventoryItem } from '../lib/inventory-api';
import { PREMIUM } from '../lib/premium-ui';
import { PremiumGlow } from '../components/PremiumGlow';
import { PremiumResultCard } from '../components/PremiumResultCard';
import { MotionPress } from '../lib/motion-components';

export default function SmartMealsPremiumScreen() {
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [suggestions, setSuggestions] = useState<SmartMealSuggestion[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [nutrition, foods, stock] = await Promise.all([getNutritionSummary(), getFoods(), getInventory()]);
      const availableIds = new Set(stock.filter((item) => item.quantity > 0).map((item) => item.foodId));
      setSummary(nutrition);
      setInventory(stock);
      setSuggestions(buildSmartMealSuggestions(foods.filter((food) => availableIds.has(food.id)), nutrition));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to build meal suggestions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void hasAuthSession().then((ok) => { if (ok) void load(); else router.replace('/'); });
  }, [load]);

  if (loading) return <View style={styles.loading}><PremiumGlow size={280} opacity={0.14} accent="amber"/><ActivityIndicator color={PREMIUM.colors.primaryBright}/><Text style={styles.loadingTitle}>MYPA is finding your next meal</Text><Text style={styles.loadingBody}>Using what you have, what you need, and what fits today.</Text></View>;

  const lowStock = inventory.filter((item) => item.urgency === 'critical' || item.urgency === 'soon');

  return <SafeAreaView style={styles.safe}>
    <View style={styles.bg} pointerEvents="none"><PremiumGlow size={420} opacity={0.09} accent="amber"/><View style={styles.blob}/></View>
    <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />} contentContainerStyle={styles.content}>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.icon}><Ionicons name="arrow-back" size={18} color={PREMIUM.colors.inkSoft}/></Pressable>
        <View style={styles.titleWrap}><Text style={styles.kicker}>PERSONAL FOOD INTELLIGENCE</Text><Text style={styles.title}>What should you eat next?</Text></View>
        <Pressable accessibilityRole="button" onPress={() => router.push('/assistant')} style={styles.icon}><Ionicons name="sparkles-outline" size={18} color={PREMIUM.colors.primaryBright}/></Pressable>
      </View>

      <PremiumResultCard eyebrow="RIGHT NOW" title="Cook with what is already home" value={inventory.filter((item) => item.quantity > 0).length.toString()} detail="available foods matched against your remaining nutrition targets." accent="amber" actions={[{label:'Ask MYPA', icon:'mic-outline', onPress:()=>router.push('/assistant')}, {label:'Open inventory', icon:'cube-outline', onPress:()=>router.push('/inventory')}]} />

      {summary ? <View style={styles.targetPanel}>
        <View style={styles.targetHeader}><View><Text style={styles.targetKicker}>TODAY'S ROOM TO EAT</Text><Text style={styles.targetTitle}>What fits your remaining day</Text></View><Ionicons name="sparkles-outline" size={20} color={PREMIUM.colors.primaryBright}/></View>
        <View style={styles.metricRow}><Target label="Calories" value={summary.remaining.calories} unit="kcal"/><Target label="Protein" value={summary.remaining.protein} unit="g"/></View>
      </View> : null}

      {lowStock.length ? <View style={styles.attention}><View style={styles.attentionIcon}><Ionicons name="warning-outline" size={18} color={PREMIUM.colors.amber}/></View><View style={styles.attentionCopy}><Text style={styles.attentionTitle}>{lowStock.length} household items need attention</Text><Text style={styles.attentionBody}>That signal stays separate from recipe ranking, so recommendations never pretend you have something you are about to run out of.</Text></View><Pressable accessibilityRole="button" onPress={() => router.push('/inventory')}><Ionicons name="arrow-forward" size={17} color={PREMIUM.colors.inkSoft}/></Pressable></View> : null}

      {error ? <PremiumResultCard eyebrow="SYSTEM" title="Meal intelligence unavailable" detail={error} accent="rose" actions={[{label:'Try again', icon:'refresh-outline', onPress:()=>void load()}]} /> : null}

      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Best matches for you</Text><Text style={styles.sectionMeta}>{suggestions.length} options</Text></View>
      {suggestions.length ? suggestions.map((suggestion, index) => <SuggestionCard key={suggestion.id} suggestion={suggestion} rank={index + 1}/>) : <PremiumResultCard eyebrow="PANTRY" title="Not enough signal yet" detail="Add a few foods to Inventory and MYPA can start building grounded meal suggestions from what is really at home." accent="cyan" actions={[{label:'Open inventory', icon:'cube-outline', onPress:()=>router.push('/inventory')}, {label:'Talk to MYPA', icon:'mic-outline', onPress:()=>router.push('/assistant')}]} />}

      <MotionPress onPress={() => router.push('/meals')} style={styles.footerAction}><Text style={styles.footerActionText}>Open all meals</Text><Ionicons name="arrow-forward" size={16} color={PREMIUM.colors.inkSoft}/></MotionPress>
    </ScrollView>
  </SafeAreaView>;
}

function Target({label,value,unit}:{label:string;value:number|null;unit:string}){return <View style={styles.target}><Text style={styles.targetLabel}>{label}</Text><Text style={styles.targetValue}>{value == null ? '—' : Math.max(0,Math.round(value))}<Text style={styles.targetUnit}>{value == null ? '' : ` ${unit}`}</Text></Text></View>}

function SuggestionCard({suggestion,rank}:{suggestion:SmartMealSuggestion;rank:number}){return <View style={styles.card}><View style={styles.cardHead}><View style={styles.rank}><Text style={styles.rankText}>{String(rank).padStart(2,'0')}</Text></View><View style={styles.copy}><Text style={styles.cardTitle}>{suggestion.title}</Text><Text style={styles.cardBody}>{suggestion.description}</Text></View><View style={styles.score}><Text style={styles.scoreValue}>{Math.round(suggestion.score)}</Text><Text style={styles.scoreLabel}>match</Text></View></View><View style={styles.coverage}><View style={[styles.coverageFill,{width:`${Math.max(4,Math.min(100,suggestion.score))}%`}]}/></View><View style={styles.macroRow}><Macro label="Calories" value={`${Math.round(suggestion.calories)} kcal`} tone="primary"/><Macro label="Protein" value={`${Math.round(suggestion.protein)} g`} tone="mint"/><Macro label="Carbs" value={`${Math.round(suggestion.carbs)} g`} tone="cyan"/><Macro label="Fat" value={`${Math.round(suggestion.fat)} g`} tone="amber"/></View><View style={styles.foodRow}>{suggestion.foods.slice(0,5).map(food=><View key={food.id} style={styles.foodChip}><Text style={styles.foodChipText}>{food.name}</Text></View>)}</View><View style={styles.reason}><Ionicons name="sparkles-outline" size={14} color={PREMIUM.colors.primaryBright}/><Text style={styles.reasonText}>{suggestion.reason}</Text></View></View>}
function Macro({label,value,tone}:{label:string;value:string;tone:'primary'|'mint'|'cyan'|'amber'}){return <View style={styles.macro}><Text style={styles.macroLabel}>{label}</Text><Text style={[styles.macroValue,{color:PREMIUM.colors[tone]}]}>{value}</Text></View>}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:PREMIUM.colors.canvas},bg:{...StyleSheet.absoluteFillObject,overflow:'hidden'},blob:{position:'absolute',width:300,height:300,borderRadius:150,right:-150,top:120,backgroundColor:PREMIUM.colors.cyan,opacity:.03},content:{padding:18,gap:15,paddingBottom:120},loading:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:PREMIUM.colors.canvas,padding:30},loadingTitle:{color:PREMIUM.colors.ink,fontSize:18,fontWeight:'900',marginTop:15,textAlign:'center'},loadingBody:{color:PREMIUM.colors.muted,fontSize:12,lineHeight:18,marginTop:6,textAlign:'center',maxWidth:280},top:{flexDirection:'row',alignItems:'center',gap:10},icon:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:PREMIUM.colors.border,backgroundColor:'rgba(255,255,255,0.035)',alignItems:'center',justifyContent:'center'},titleWrap:{flex:1,alignItems:'center'},kicker:{color:PREMIUM.colors.muted,fontSize:8,fontWeight:'900',letterSpacing:1.4},title:{color:PREMIUM.colors.ink,fontSize:19,fontWeight:'900',marginTop:3},targetPanel:{borderRadius:24,padding:17,backgroundColor:PREMIUM.colors.ink},targetHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},targetKicker:{color:PREMIUM.colors.invertedMuted,fontSize:8,fontWeight:'900',letterSpacing:1.2},targetTitle:{color:PREMIUM.colors.white,fontSize:15,fontWeight:'900',marginTop:3},metricRow:{flexDirection:'row',gap:10,marginTop:14},target:{flex:1,borderRadius:16,padding:12,backgroundColor:'rgba(255,255,255,0.06)',borderWidth:1,borderColor:'rgba(255,255,255,0.08)'},targetLabel:{color:PREMIUM.colors.invertedMuted,fontSize:9,fontWeight:'800'},targetValue:{color:PREMIUM.colors.white,fontSize:20,fontWeight:'900',marginTop:4},targetUnit:{color:PREMIUM.colors.invertedMuted,fontSize:10,fontWeight:'800'},attention:{borderRadius:20,padding:14,backgroundColor:'rgba(255,197,107,0.07)',borderWidth:1,borderColor:'rgba(255,197,107,0.15)',flexDirection:'row',alignItems:'center',gap:10},attentionIcon:{width:38,height:38,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,197,107,0.10)'},attentionCopy:{flex:1},attentionTitle:{color:PREMIUM.colors.ink,fontSize:12,fontWeight:'900'},attentionBody:{color:PREMIUM.colors.muted,fontSize:10,lineHeight:15,marginTop:3},sectionHead:{flexDirection:'row',alignItems:'baseline',justifyContent:'space-between'},sectionTitle:{color:PREMIUM.colors.ink,fontSize:18,fontWeight:'900'},sectionMeta:{color:PREMIUM.colors.muted,fontSize:9,fontWeight:'800'},card:{borderRadius:24,padding:16,backgroundColor:PREMIUM.colors.surfaceGlass,borderWidth:1,borderColor:PREMIUM.colors.border},cardHead:{flexDirection:'row',alignItems:'flex-start',gap:10},rank:{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(139,124,255,0.12)',borderWidth:1,borderColor:'rgba(139,124,255,0.20)'},rankText:{color:PREMIUM.colors.primaryBright,fontSize:10,fontWeight:'900'},copy:{flex:1},cardTitle:{color:PREMIUM.colors.ink,fontSize:15,fontWeight:'900'},cardBody:{color:PREMIUM.colors.muted,fontSize:11,lineHeight:17,marginTop:4},score:{width:48,height:48,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,197,107,0.08)',borderWidth:1,borderColor:'rgba(255,197,107,0.16)'},scoreValue:{color:PREMIUM.colors.amber,fontSize:16,fontWeight:'900'},scoreLabel:{color:PREMIUM.colors.muted,fontSize:7,fontWeight:'800'},coverage:{height:7,borderRadius:7,backgroundColor:'rgba(255,255,255,0.05)',overflow:'hidden',marginTop:14},coverageFill:{height:7,borderRadius:7,backgroundColor:PREMIUM.colors.primaryBright},macroRow:{flexDirection:'row',gap:14,marginTop:13},macro:{minWidth:56},macroLabel:{color:PREMIUM.colors.muted,fontSize:8,fontWeight:'800'},macroValue:{fontSize:11,fontWeight:'900',marginTop:3},foodRow:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:13},foodChip:{paddingHorizontal:9,paddingVertical:6,borderRadius:12,backgroundColor:'rgba(255,255,255,0.04)',borderWidth:1,borderColor:PREMIUM.colors.border},foodChipText:{color:PREMIUM.colors.inkSoft,fontSize:9,fontWeight:'700'},reason:{flexDirection:'row',gap:7,alignItems:'center',marginTop:12},reasonText:{color:PREMIUM.colors.inkSoft,fontSize:10,lineHeight:15,flex:1},footerAction:{minHeight:50,borderRadius:24,borderWidth:1,borderColor:PREMIUM.colors.border,backgroundColor:'rgba(255,255,255,0.02)',paddingHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},footerActionText:{color:PREMIUM.colors.inkSoft,fontSize:12,fontWeight:'900'}});
