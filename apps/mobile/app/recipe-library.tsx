import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppLocale } from '../lib/i18n';
import { hasAuthSession } from '../lib/api';
import { getRecipeLibrary, RecipeLibraryItem } from '../lib/recipe-library-api';

const copy = {
  en: { back:'Back', title:'Recipe library', subtitle:'Browse the recipes available to you.', search:'Search recipes…', verified:'Verified', servings:'servings', kcal:'kcal', protein:'protein', loadMore:'Load more', empty:'No recipes match your search.', error:'Could not load recipes.', retry:'Retry', done:'Showing all matching recipes' },
  fa: { back:'برگشت', title:'کتابخانه دستورها', subtitle:'همه دستورهایی که در اختیار توست.', search:'دستور غذا را جست‌وجو کن…', verified:'تأییدشده', servings:'نفر', kcal:'کالری', protein:'پروتئین', loadMore:'نمایش بیشتر', empty:'دستوری مطابق جست‌وجو پیدا نشد.', error:'دستورها بارگذاری نشدند.', retry:'تلاش دوباره', done:'همه موارد مطابق نمایش داده شد' },
} as const;

export default function RecipeLibraryScreen() {
  const locale = useAppLocale(); const text = copy[locale]; const rtl = locale === 'fa';
  const [items, setItems] = useState<RecipeLibraryItem[]>([]); const [page, setPage] = useState(1); const [hasNext, setHasNext] = useState(false); const [query, setQuery] = useState(''); const [loading, setLoading] = useState(true); const [moreLoading, setMoreLoading] = useState(false); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (reset: boolean) => {
    try {
      setError(null);
      if (reset) setRefreshing(true); else setMoreLoading(true);
      const nextPage = reset ? 1 : page + 1;
      const response = await getRecipeLibrary(nextPage, 24, query);
      setItems((current) => reset ? response.items : [...current, ...response.items]);
      setPage(response.page); setHasNext(response.hasNextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : text.error);
    } finally {
      setLoading(false); setMoreLoading(false); setRefreshing(false);
    }
  }, [page, query, text.error]);

  useEffect(() => { void hasAuthSession().then((ok) => { if (!ok) router.replace('/auth'); else void load(true); }); }, [load]);
  useEffect(() => { const timer = setTimeout(() => { if (!loading) void load(true); }, 300); return () => clearTimeout(timer); }, [query]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large"/></View>;
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)}/>}>
    <View style={[styles.nav, rtl && styles.rtl]}><Pressable onPress={() => router.back()}><Text style={styles.back}>{rtl ? '→' : '←'} {text.back}</Text></Pressable><Text style={styles.count}>{items.length}</Text></View>
    <Text style={[styles.title, rtl && styles.textRtl]}>{text.title}</Text><Text style={[styles.subtitle, rtl && styles.textRtl]}>{text.subtitle}</Text>
    <TextInput value={query} onChangeText={setQuery} placeholder={text.search} placeholderTextColor="#9CA3AF" style={[styles.search, rtl && styles.textRtl]}/>
    {error ? <View style={styles.error}><Text style={styles.errorTitle}>{text.error}</Text><Text style={styles.errorBody}>{error}</Text><Pressable onPress={() => void load(true)} style={styles.retry}><Text style={styles.retryText}>{text.retry}</Text></Pressable></View> : null}
    {items.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} locale={locale} text={text} rtl={rtl}/>) }
    {hasNext ? <Pressable disabled={moreLoading} onPress={() => void load(false)} style={styles.loadMore}><Text style={styles.loadMoreText}>{moreLoading ? '…' : text.loadMore}</Text></Pressable> : <Text style={styles.done}>{text.done}</Text>}
  </ScrollView></SafeAreaView>;
}

function RecipeCard({ recipe, locale, text, rtl }: { recipe: RecipeLibraryItem; locale: 'fa'|'en'; text: typeof copy['en']; rtl: boolean }) {
  return <Pressable onPress={() => router.push(`/recipe/${recipe.id}`)} style={({pressed}) => [styles.card, pressed && styles.pressed]}>
    {recipe.imageUrl ? <Image source={{ uri: recipe.imageUrl }} style={styles.image} resizeMode="cover"/> : <View style={styles.imagePlaceholder}><Text style={styles.placeholderEmoji}>🍲</Text></View>}
    <View style={styles.cardBody}><View style={[styles.cardTop, rtl && styles.rtl]}><Text style={[styles.recipeName, rtl && styles.textRtl]}>{recipe.name}</Text>{recipe.verified ? <View style={styles.badge}><Text style={styles.badgeText}>{text.verified}</Text></View> : null}</View>
      {recipe.description ? <Text numberOfLines={2} style={[styles.description, rtl && styles.textRtl]}>{recipe.description}</Text> : null}
      <View style={[styles.metrics, rtl && styles.rtl]}><Metric label={text.kcal} value={`${Math.round(recipe.calories)}`}/><Metric label={text.protein} value={`${Math.round(recipe.protein)}g`}/><Metric label={text.servings} value={`${recipe.servings}`}/></View>
    </View>
  </Pressable>;
}
function Metric({label,value}:{label:string;value:string}){return <View><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>}

const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:'#F7F8FA'}, center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#F7F8FA'}, content:{padding:20,gap:12,paddingBottom:40}, nav:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, rtl:{direction:'rtl'}, textRtl:{textAlign:'right'}, back:{fontWeight:'900',color:'#111827'}, count:{fontSize:11,fontWeight:'800',color:'#6B7280'}, title:{fontSize:32,fontWeight:'900',color:'#111827',marginTop:4}, subtitle:{fontSize:14,color:'#6B7280',lineHeight:21}, search:{backgroundColor:'#FFF',borderRadius:16,paddingHorizontal:15,paddingVertical:13,color:'#111827',fontSize:14,marginTop:4}, card:{backgroundColor:'#FFF',borderRadius:20,overflow:'hidden',borderWidth:1,borderColor:'#F0F1F4'}, pressed:{opacity:0.86}, image:{width:'100%',height:150}, imagePlaceholder:{width:'100%',height:150,backgroundColor:'#E5E7EB',alignItems:'center',justifyContent:'center'}, placeholderEmoji:{fontSize:34}, cardBody:{padding:16}, cardTop:{flexDirection:'row',alignItems:'flex-start',gap:10}, recipeName:{flex:1,fontSize:18,fontWeight:'900',color:'#111827'}, badge:{backgroundColor:'#ECFDF3',paddingHorizontal:8,paddingVertical:5,borderRadius:10}, badgeText:{fontSize:9,fontWeight:'900',color:'#067647'}, description:{fontSize:12,color:'#6B7280',lineHeight:18,marginTop:7}, metrics:{flexDirection:'row',gap:22,marginTop:13,paddingTop:11,borderTopWidth:1,borderTopColor:'#F3F4F6'}, metricLabel:{fontSize:9,color:'#9CA3AF'}, metricValue:{fontSize:13,fontWeight:'900',color:'#111827',marginTop:2}, error:{backgroundColor:'#FFF',borderRadius:18,padding:16,borderWidth:1,borderColor:'#FEE2E2'}, errorTitle:{fontSize:15,fontWeight:'900',color:'#991B1B'}, errorBody:{fontSize:12,color:'#6B7280',marginTop:5}, retry:{alignSelf:'flex-start',backgroundColor:'#111827',borderRadius:10,paddingHorizontal:12,paddingVertical:9,marginTop:10}, retryText:{color:'#FFF',fontWeight:'900',fontSize:11}, loadMore:{backgroundColor:'#111827',borderRadius:15,paddingVertical:14,alignItems:'center',marginTop:2}, loadMoreText:{color:'#FFF',fontWeight:'900'}, done:{textAlign:'center',fontSize:11,color:'#9CA3AF',paddingVertical:12} });
