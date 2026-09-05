import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppLocale } from '../lib/i18n';
import { hasAuthSession } from '../lib/api';
import { FitnessDiscipline, FitnessItem, getFitnessLibrary } from '../lib/fitness-api';

const copy = {
  en: { back:'Back', title:'Fitness', subtitle:'Choose a branch, a level, and train at your pace.', gym:'Gym', calisthenics:'Calisthenics', yoga:'Yoga', level:'Skill level', search:'Search exercises…', start:'Start session', details:'View exercise', more:'Load more', empty:'No exercises found.', media:'images', complete:'complete', refresh:'Refresh' },
  fa: { back:'برگشت', title:'تمرین و ورزش', subtitle:'رشته، سطح و تمرین مناسب خودت را انتخاب کن.', gym:'جیم', calisthenics:'کالیستنیکس', yoga:'یوگا', level:'سطح مهارت', search:'حرکت را جست‌وجو کن…', start:'شروع جلسه', details:'مشاهده حرکت', more:'نمایش بیشتر', empty:'حرکتی پیدا نشد.', media:'تصویر', complete:'کامل', refresh:'به‌روزرسانی' },
} as const;

const levelNames = ['Beginner','Beginner+','Foundation','Foundation+','Intermediate','Intermediate+','Advanced','Advanced+','Expert','Elite'];
const levelMap: Record<FitnessDiscipline, string[]> = {
  gym:['beginner','beginner','foundation','foundation','intermediate','intermediate','advanced','advanced','expert','expert'],
  calisthenics:['beginner','beginner','foundation','foundation','intermediate','intermediate','advanced','advanced','expert','elite'],
  yoga:['beginner','beginner','foundation','foundation','intermediate','intermediate','advanced','advanced','expert','expert'],
};

export default function FitnessScreen() {
  const locale = useAppLocale(); const text = copy[locale]; const rtl = locale === 'fa';
  const [discipline,setDiscipline]=useState<FitnessDiscipline>('gym'); const [level,setLevel]=useState(5); const [query,setQuery]=useState(''); const [items,setItems]=useState<FitnessItem[]>([]); const [page,setPage]=useState(1); const [hasNext,setHasNext]=useState(false); const [loading,setLoading]=useState(true); const [loadingMore,setLoadingMore]=useState(false); const [refreshing,setRefreshing]=useState(false); const [error,setError]=useState<string|null>(null);
  const load=useCallback(async(reset=true)=>{try{setError(null);if(reset)setRefreshing(true);else setLoadingMore(true);const nextPage=reset?1:page+1;const response=await getFitnessLibrary(discipline,level,nextPage,24,query);setItems(current=>reset?response.items:[...current,...response.items]);setPage(response.page);setHasNext(response.hasNextPage);}catch(err){setError(err instanceof Error?err.message:'Unable to load fitness catalog.');}finally{setLoading(false);setLoadingMore(false);setRefreshing(false);}},[discipline,level,page,query]);
  useEffect(()=>{void hasAuthSession().then(ok=>{if(!ok)router.replace('/auth');else void load(true);});},[discipline,level]);
  useEffect(()=>{if(loading)return;const timer=setTimeout(()=>void load(true),300);return()=>clearTimeout(timer);},[query]);
  if(loading)return <View style={styles.center}><ActivityIndicator size="large"/></View>;
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>void load(true)}/>}>
    <View style={[styles.nav,rtl&&styles.rtl]}><Pressable onPress={()=>router.back()}><Text style={styles.back}>{rtl?'→':'←'} {text.back}</Text></Pressable><Text style={styles.count}>{items.length}</Text></View>
    <Text style={[styles.title,rtl&&styles.textRtl]}>{text.title}</Text><Text style={[styles.subtitle,rtl&&styles.textRtl]}>{text.subtitle}</Text>
    <View style={styles.branchRow}>{(['gym','calisthenics','yoga'] as FitnessDiscipline[]).map(key=><Pressable key={key} onPress={()=>{setDiscipline(key);setPage(1);}} style={[styles.branch,discipline===key&&styles.branchActive]}><Text style={[styles.branchText,discipline===key&&styles.branchTextActive]}>{text[key]}</Text></Pressable>)}</View>
    <Text style={[styles.sectionLabel,rtl&&styles.textRtl]}>{text.level}: {level} · {levelNames[level-1]}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levelRow}>{levelNames.map((name,index)=><Pressable key={name} onPress={()=>{setLevel(index+1);setPage(1);}} style={[styles.levelChip,level===index+1&&styles.levelChipActive]}><Text style={[styles.levelText,level===index+1&&styles.levelTextActive]}>{index+1}</Text></Pressable>)}</ScrollView>
    <TextInput value={query} onChangeText={setQuery} placeholder={text.search} placeholderTextColor="#9CA3AF" style={[styles.search,rtl&&styles.textRtl]}/>
    <Pressable onPress={()=>discipline==='yoga'?router.push('/yoga'):router.push({pathname:'/fitness-session',params:{discipline,level:String(level)}})} style={styles.startButton}><Text style={styles.startText}>{text.start} · {levelNames[level-1]}</Text></Pressable>
    {error?<Text style={styles.error}>{error}</Text>:null}
    {items.length?items.map(item=><ExerciseCard key={`${discipline}:${item.id}`} item={item} text={text} rtl={rtl}/>):<Text style={styles.empty}>{text.empty}</Text>}
    {hasNext?<Pressable disabled={loadingMore} onPress={()=>void load(false)} style={styles.more}><Text style={styles.moreText}>{loadingMore?'…':text.more}</Text></Pressable>:null}
  </ScrollView></SafeAreaView>;
}

function ExerciseCard({item,text,rtl}:{item:FitnessItem;text:typeof copy['en'];rtl:boolean}){
  const media=item.media[0];
  return <Pressable onPress={()=>router.push({pathname:'/exercise',params:{discipline:item.discipline,id:item.id}})} style={styles.card}>
    {media?<Image source={{uri:media.webpUrl}} style={styles.image} resizeMode="cover"/>:<View style={styles.placeholder}><Text style={styles.placeholderText}>M</Text></View>}
    <View style={styles.cardBody}><View style={[styles.cardTop,rtl&&styles.rtl]}><Text style={[styles.name,rtl&&styles.textRtl]}>{item.name}</Text><Text style={styles.levelBadge}>{item.difficultyLevel}/10</Text></View><Text style={[styles.focus,rtl&&styles.textRtl]} numberOfLines={1}>{item.focus.slice(0,3).join(' · ')}</Text><View style={[styles.footer,rtl&&styles.rtl]}><Text style={styles.meta}>{item.mediaActual}/{item.mediaRequired} {text.media}</Text><Text style={[styles.meta,item.mediaComplete&&styles.complete]}>{item.mediaComplete?text.complete:''}</Text><Text style={styles.link}>{text.details} →</Text></View></View>
  </Pressable>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#F7F8FA'},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#F7F8FA'},content:{padding:20,gap:12,paddingBottom:40},nav:{flexDirection:'row',justifyContent:'space-between'},rtl:{direction:'rtl'},textRtl:{textAlign:'right'},back:{fontWeight:'900',color:'#111827'},count:{fontSize:11,fontWeight:'800',color:'#6B7280'},title:{fontSize:32,fontWeight:'900',color:'#111827',marginTop:2},subtitle:{fontSize:14,color:'#6B7280',lineHeight:21},branchRow:{flexDirection:'row',gap:8,marginTop:5},branch:{flex:1,backgroundColor:'#FFF',borderRadius:14,paddingVertical:12,alignItems:'center',borderWidth:1,borderColor:'#E5E7EB'},branchActive:{backgroundColor:'#111827',borderColor:'#111827'},branchText:{fontSize:11,fontWeight:'900',color:'#374151'},branchTextActive:{color:'#FFF'},sectionLabel:{fontSize:12,fontWeight:'900',color:'#111827',marginTop:3},levelRow:{gap:8,paddingVertical:2},levelChip:{width:38,height:38,borderRadius:19,backgroundColor:'#FFF',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#E5E7EB'},levelChipActive:{backgroundColor:'#111827',borderColor:'#111827'},levelText:{fontSize:12,fontWeight:'900',color:'#6B7280'},levelTextActive:{color:'#FFF'},search:{backgroundColor:'#FFF',borderRadius:16,paddingHorizontal:15,paddingVertical:13,fontSize:14,color:'#111827'},startButton:{backgroundColor:'#0F766E',borderRadius:16,paddingVertical:14,alignItems:'center'},startText:{color:'#FFF',fontWeight:'900'},error:{backgroundColor:'#FEF2F2',color:'#991B1B',padding:12,borderRadius:12,fontSize:12},empty:{textAlign:'center',color:'#6B7280',paddingVertical:30},card:{backgroundColor:'#FFF',borderRadius:20,overflow:'hidden',borderWidth:1,borderColor:'#F0F1F4'},image:{height:150,width:'100%'},placeholder:{height:150,backgroundColor:'#E5E7EB',alignItems:'center',justifyContent:'center'},placeholderText:{fontSize:28,fontWeight:'900',color:'#9CA3AF'},cardBody:{padding:15},cardTop:{flexDirection:'row',alignItems:'flex-start',gap:10},name:{flex:1,fontSize:17,fontWeight:'900',color:'#111827'},levelBadge:{backgroundColor:'#EEF2FF',color:'#4338CA',paddingHorizontal:8,paddingVertical:5,borderRadius:10,fontSize:10,fontWeight:'900'},focus:{fontSize:11,color:'#6B7280',marginTop:6},footer:{flexDirection:'row',alignItems:'center',gap:10,marginTop:12,paddingTop:10,borderTopWidth:1,borderTopColor:'#F3F4F6'},meta:{fontSize:9,color:'#9CA3AF'},complete:{color:'#047857'},link:{marginLeft:'auto',fontSize:10,fontWeight:'900',color:'#111827'},more:{backgroundColor:'#111827',borderRadius:15,alignItems:'center',paddingVertical:14},moreText:{color:'#FFF',fontWeight:'900'}});
