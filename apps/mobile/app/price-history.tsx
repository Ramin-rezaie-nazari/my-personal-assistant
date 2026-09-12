import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getPriceAnalysis, getPriceHistory, getPriceSources, normalizeProductKey, PriceAnalysis, PriceSnapshot, PriceSource } from '../lib/price-api';

function currencyLabel(currency: string) {
  const code = String(currency || '').toUpperCase();
  if (code === 'IRT' || code === 'IRR') return 'تومان';
  if (code === 'USD') return '$';
  if (code === 'EUR') return '€';
  if (code === 'GBP') return '£';
  return code || '';
}
function money(value:number|null, currency='IRT') {
  if (value === null) return '—';
  const code = String(currency || 'IRT').toUpperCase();
  const locale = code === 'IRT' || code === 'IRR' ? 'fa-IR' : 'en-US';
  const formatted = Math.round(value).toLocaleString(locale);
  return `${formatted} ${currencyLabel(code)}`.trim();
}
function shortDate(value:string){return new Date(value).toLocaleDateString('fa-IR',{month:'short',day:'numeric'})}

export default function PriceHistoryScreen(){
  const params=useLocalSearchParams<{productKey?:string;name?:string}>();
  const key=useMemo(()=>normalizeProductKey(String(params.productKey??params.name??'')),[params.productKey,params.name]);
  const [history,setHistory]=useState<PriceSnapshot[]>([]); const [analysis,setAnalysis]=useState<PriceAnalysis|null>(null); const [sources,setSources]=useState<PriceSource[]>([]); const [days,setDays]=useState(30); const [loading,setLoading]=useState(true); const [error,setError]=useState<string|null>(null);
  useEffect(()=>{let alive=true;(async()=>{try{setLoading(true);setError(null);const [h,a,s]=await Promise.all([getPriceHistory(key,days),getPriceAnalysis(key),getPriceSources()]);if(alive){setHistory(h.items);setAnalysis(a);setSources(s)}}catch(e){if(alive)setError(e instanceof Error?e.message:'خطا در دریافت تاریخچه قیمت')}finally{if(alive)setLoading(false)}})();return()=>{alive=false}},[key,days]);
  const points=useMemo(()=>{const grouped=new Map<string,PriceSnapshot>();for(const item of history)grouped.set(item.sourceId,item);return [...grouped.values()].sort((a,b)=>a.amount-b.amount)},[history]);
  const chartValues = history.length ? history.map(x=>x.amount) : [];
  const min = chartValues.length ? Math.min(...chartValues) : 0;
  const max = chartValues.length ? Math.max(...chartValues) : 0;
  const range=Math.max(1,max-min);
  const chartCurrency = history[history.length - 1]?.currency ?? 'IRT';
  if(loading)return <View style={styles.center}><ActivityIndicator size="large"/></View>;
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <Pressable onPress={()=>router.back()}><Text style={styles.back}>← برگشت</Text></Pressable>
    <Text style={styles.eyebrow}>PRICE INTELLIGENCE</Text><Text style={styles.title}>{params.name??key.replace(/-/g,' ')}</Text>
    {error?<View style={styles.card}><Text style={styles.error}>{error}</Text></View>:null}
    <View style={styles.periods}>{[7,30,90,365].map(d=><Pressable key={d} onPress={()=>setDays(d)} style={[styles.period,d===days&&styles.periodActive]}><Text style={[styles.periodText,d===days&&styles.periodTextActive]}>{d===365?'۱ سال':`${d} روز`}</Text></Pressable>)}</View>
    {analysis?<View style={styles.hero}><Text style={styles.label}>قیمت فعلی</Text><Text style={styles.current}>{money(analysis.current, chartCurrency)}</Text><Text style={styles.change}>{analysis.changeVs7d===null?'داده کافی نیست':`${analysis.changeVs7d>0?'↑':'↓'} ${Math.abs(analysis.changeVs7d).toFixed(1)}٪ نسبت به قبل`}</Text></View>:null}
    <View style={styles.card}><Text style={styles.section}>نمودار قیمت</Text>{history.length<2?<Text style={styles.muted}>برای نمایش نمودار حداقل دو ثبت قیمت لازم است.</Text>:<View style={styles.chart}>{history.slice(-20).map((p,i)=>{const displayed=history.slice(-20);const values=displayed.map(item=>item.amount);const localMin=Math.min(...values);const localMax=Math.max(...values);const localRange=Math.max(1,localMax-localMin);const x=(i/Math.max(1,displayed.length-1))*92+4;const y=90-((p.amount-localMin)/localRange)*78;return <View key={`${p.id}-${i}`} style={[styles.point,{left:`${x}%`,top:`${y}%` as any}]}><View style={styles.dot}/></View>})}</View>}<View style={styles.chartLegend}><Text style={styles.muted}>{money(min,chartCurrency)}</Text><Text style={styles.muted}>{money(max,chartCurrency)}</Text></View></View>
    {analysis?<View style={styles.grid}><View style={styles.stat}><Text style={styles.muted}>میانگین ۷ روز</Text><Text style={styles.statValue}>{money(analysis.average7d,chartCurrency)}</Text></View><View style={styles.stat}><Text style={styles.muted}>میانگین ۳۰ روز</Text><Text style={styles.statValue}>{money(analysis.average30d,chartCurrency)}</Text></View><View style={styles.stat}><Text style={styles.muted}>کمترین</Text><Text style={styles.statValue}>{money(analysis.min30d,chartCurrency)}</Text></View><View style={styles.stat}><Text style={styles.muted}>بیشترین</Text><Text style={styles.statValue}>{money(analysis.max30d,chartCurrency)}</Text></View></View>:null}
    <View style={styles.card}><Text style={styles.section}>فروشگاه‌ها</Text>{points.length?points.map(p=><View key={p.id} style={styles.row}><View><Text style={styles.name}>{sources.find(s=>s.id===p.sourceId)?.name??p.sourceId}</Text><Text style={styles.muted}>{p.availability==='in_stock'?'موجود':'وضعیت نامشخص'} · {shortDate(p.observedAt)}</Text></View><Text style={styles.price}>{money(p.amount,p.currency)}</Text></View>):<Text style={styles.muted}>هنوز قیمتی برای این محصول ثبت نشده.</Text>}</View>
  </ScrollView></SafeAreaView>
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#F7F8FA'},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#F7F8FA'},content:{padding:20,gap:14,paddingBottom:40},back:{fontWeight:'900',color:'#111827'},eyebrow:{fontSize:10,letterSpacing:1.5,fontWeight:'900',color:'#6B7280'},title:{fontSize:28,fontWeight:'900',color:'#111827'},periods:{flexDirection:'row',gap:7},period:{paddingHorizontal:12,paddingVertical:8,borderRadius:18,backgroundColor:'#FFF'},periodActive:{backgroundColor:'#111827'},periodText:{fontSize:11,fontWeight:'800',color:'#6B7280'},periodTextActive:{color:'#FFF'},hero:{backgroundColor:'#111827',borderRadius:22,padding:20},label:{fontSize:11,color:'#9CA3AF'},current:{fontSize:28,fontWeight:'900',color:'#FFF',marginTop:5},change:{fontSize:12,fontWeight:'800',color:'#D1D5DB',marginTop:6},card:{backgroundColor:'#FFF',borderRadius:20,padding:17},section:{fontSize:16,fontWeight:'900',color:'#111827',marginBottom:10},chart:{height:170,borderLeftWidth:1,borderBottomWidth:1,borderColor:'#E5E7EB',position:'relative',overflow:'hidden'},point:{position:'absolute',width:7,height:7,marginLeft:-3.5,marginTop:-3.5},dot:{width:7,height:7,borderRadius:4,backgroundColor:'#111827'},chartLegend:{flexDirection:'row',justifyContent:'space-between',marginTop:8},muted:{fontSize:11,color:'#9CA3AF'},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},stat:{backgroundColor:'#FFF',borderRadius:16,padding:14,width:'48%'},statValue:{fontSize:15,fontWeight:'900',color:'#111827',marginTop:5},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#F3F4F6'},name:{fontSize:13,fontWeight:'900',color:'#111827'},price:{fontSize:13,fontWeight:'900',color:'#111827'},error:{color:'#B91C1C',fontWeight:'800'}});