import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getPriceAnalysis, getPriceHistory, getPriceSources, normalizeProductKey, PriceAnalysis, PriceSnapshot, PriceSource } from '../lib/price-api';
import { BRAND } from '../lib/branding';

const money = (value: number | null) => value === null ? '—' : `${Math.round(value).toLocaleString('fa-IR')} تومان`;
const dateText = (value: string) => new Date(value).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });

export default function PriceHistoryPremiumScreen() {
  const params = useLocalSearchParams<{ productKey?: string; name?: string }>();
  const key = useMemo(() => normalizeProductKey(String(params.productKey ?? params.name ?? '')), [params.productKey, params.name]);
  const [history, setHistory] = useState<PriceSnapshot[]>([]);
  const [analysis, setAnalysis] = useState<PriceAnalysis | null>(null);
  const [sources, setSources] = useState<PriceSource[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        setLoading(true); setError(null);
        const [h, a, s] = await Promise.all([getPriceHistory(key, days), getPriceAnalysis(key), getPriceSources()]);
        if (alive) { setHistory(h.items); setAnalysis(a); setSources(s); }
      } catch (err) { if (alive) setError(err instanceof Error ? err.message : 'خطا در دریافت تاریخچه قیمت'); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [key, days]);

  const points = useMemo(() => history.slice(-24), [history]);
  const min = Math.min(...history.map((item) => item.amount), 0);
  const max = Math.max(...history.map((item) => item.amount), 0);
  const range = Math.max(1, max - min);

  if (loading) return <View style={styles.center}><View style={styles.loaderOrb}><Text style={styles.loaderText}>↗</Text></View><ActivityIndicator color={BRAND.colors.primary} style={{ marginTop: 14 }} /></View>;

  return <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.nav}><Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>←</Text></Pressable><View><Text style={styles.eyebrow}>PRICE INTELLIGENCE</Text><Text style={styles.navTitle}>{params.name ?? key.replace(/-/g, ' ')}</Text></View><View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View></View>
      <View style={styles.hero}><View style={styles.heroGlow} /><Text style={styles.heroLabel}>CURRENT SIGNAL</Text><Text style={styles.heroValue}>{money(analysis?.current ?? null)}</Text><Text style={styles.heroMeta}>{analysis?.changeVs7d === null ? 'داده کافی برای مقایسه نداریم' : `${analysis.changeVs7d > 0 ? '↑' : '↓'} ${Math.abs(analysis.changeVs7d).toFixed(1)}٪ نسبت به ۷ روز قبل`}</Text></View>
      <View style={styles.periods}>{[7, 30, 90, 365].map((item) => <Pressable key={item} onPress={() => setDays(item)} style={[styles.period, item === days && styles.periodActive]}><Text style={[styles.periodText, item === days && styles.periodTextActive]}>{item === 365 ? '۱ سال' : `${item} روز`}</Text></Pressable>)}</View>
      {error ? <View style={styles.error}><Text style={styles.errorTitle}>Price data needs attention</Text><Text style={styles.errorText}>{error}</Text></View> : null}
      <View style={styles.card}><View style={styles.cardHeader}><View><Text style={styles.cardTitle}>Price movement</Text><Text style={styles.cardSubtitle}>Recent observations from available sources.</Text></View><View style={styles.metricBubble}><Text style={styles.metricBubbleText}>{history.length}</Text><Text style={styles.metricBubbleLabel}>points</Text></View></View>
        {points.length < 2 ? <View style={styles.empty}><Text style={styles.emptyMark}>∿</Text><Text style={styles.emptyTitle}>Not enough observations yet.</Text><Text style={styles.emptyText}>The chart becomes useful as more prices arrive.</Text></View> : <View style={styles.chart}>{points.map((point, index) => { const left = (index / Math.max(1, points.length - 1)) * 94 + 3; const top = 92 - ((point.amount - min) / range) * 80; return <View key={`${point.id}-${index}`} style={[styles.point, { left: `${left}%`, top: `${top}%` }]}><View style={styles.dot} /></View>; })}<View style={styles.chartLegend}><Text style={styles.chartLabel}>{money(min)}</Text><Text style={styles.chartLabel}>{money(max)}</Text></View></View>}
      </View>
      <View style={styles.grid}>{[
        ['۷ روز', analysis?.average7d], ['۳۰ روز', analysis?.average30d], ['کمترین', analysis?.min30d], ['بیشترین', analysis?.max30d],
      ].map(([label, value]) => <View key={String(label)} style={styles.stat}><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{money(value as number | null)}</Text></View>)}</View>
      <View style={styles.card}><Text style={styles.cardTitle}>Sources</Text><Text style={styles.cardSubtitle}>The most recent observation from each source.</Text>{history.length ? history.reduce<PriceSnapshot[]>((acc, item) => acc.some((entry) => entry.sourceId === item.sourceId) ? acc : [...acc, item], []).sort((a, b) => a.amount - b.amount).map((point) => <View key={point.id} style={styles.sourceRow}><View style={styles.sourceIcon}><Text style={styles.sourceIconText}>{(sources.find((source) => source.id === point.sourceId)?.name ?? point.sourceId).slice(0, 1).toUpperCase()}</Text></View><View style={styles.sourceCopy}><Text style={styles.sourceName}>{sources.find((source) => source.id === point.sourceId)?.name ?? point.sourceId}</Text><Text style={styles.sourceMeta}>{point.availability === 'in_stock' ? 'موجود' : 'وضعیت نامشخص'} · {dateText(point.observedAt)}</Text></View><Text style={styles.sourcePrice}>{money(point.amount)}</Text></View>) : <Text style={styles.emptySource}>هنوز قیمتی برای این محصول ثبت نشده.</Text>}</View>
      <View style={styles.footerNote}><Text style={styles.footerText}>Price history helps the assistant recommend smarter shopping decisions without changing your business logic.</Text></View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:BRAND.colors.canvas}, center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:BRAND.colors.canvas}, loaderOrb:{width:64,height:64,borderRadius:22,backgroundColor:BRAND.colors.ink,alignItems:'center',justifyContent:'center'}, loaderText:{fontSize:26,fontWeight:'900',color:BRAND.colors.white}, content:{padding:20,gap:13,paddingBottom:40}, nav:{flexDirection:'row',alignItems:'center',gap:10}, back:{width:42,height:42,borderRadius:21,backgroundColor:BRAND.colors.surface,alignItems:'center',justifyContent:'center'}, backText:{fontSize:19,fontWeight:'900',color:BRAND.colors.ink}, eyebrow:{fontSize:9,letterSpacing:1.5,fontWeight:'900',color:BRAND.colors.primary}, navTitle:{fontSize:16,fontWeight:'900',color:BRAND.colors.ink,marginTop:2}, livePill:{marginLeft:'auto',flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:9,paddingVertical:7,borderRadius:16,backgroundColor:BRAND.colors.primarySoft}, liveDot:{width:6,height:6,borderRadius:3,backgroundColor:BRAND.colors.primary}, liveText:{fontSize:8,fontWeight:'900',letterSpacing:1,color:BRAND.colors.primaryStrong}, hero:{overflow:'hidden',backgroundColor:BRAND.colors.ink,borderRadius:25,padding:20}, heroGlow:{position:'absolute',right:-45,top:-55,width:165,height:165,borderRadius:83,backgroundColor:BRAND.colors.primary,opacity:.22}, heroLabel:{fontSize:9,fontWeight:'900',letterSpacing:1.5,color:'#BEB3FF'}, heroValue:{fontSize:31,fontWeight:'900',color:BRAND.colors.white,marginTop:6}, heroMeta:{fontSize:11,fontWeight:'800',color:BRAND.colors.invertedMuted,marginTop:6}, periods:{flexDirection:'row',gap:7}, period:{paddingHorizontal:12,paddingVertical:8,borderRadius:16,backgroundColor:BRAND.colors.surface}, periodActive:{backgroundColor:BRAND.colors.ink}, periodText:{fontSize:10,fontWeight:'900',color:BRAND.colors.muted}, periodTextActive:{color:BRAND.colors.white}, card:{backgroundColor:BRAND.colors.surface,borderRadius:22,padding:17,borderWidth:1,borderColor:BRAND.colors.border}, cardHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}, cardTitle:{fontSize:15,fontWeight:'900',color:BRAND.colors.ink}, cardSubtitle:{fontSize:10,color:BRAND.colors.muted,lineHeight:15,marginTop:3}, metricBubble:{width:48,height:48,borderRadius:16,backgroundColor:BRAND.colors.surfaceWarm,alignItems:'center',justifyContent:'center'}, metricBubbleText:{fontSize:14,fontWeight:'900',color:BRAND.colors.primaryStrong}, metricBubbleLabel:{fontSize:7,color:BRAND.colors.muted}, chart:{height:185,marginTop:13,borderLeftWidth:1,borderBottomWidth:1,borderColor:BRAND.colors.border,position:'relative'}, point:{position:'absolute',width:8,height:8,marginLeft:-4,marginTop:-4}, dot:{width:8,height:8,borderRadius:4,backgroundColor:BRAND.colors.primary}, chartLegend:{position:'absolute',left:0,right:0,bottom:-20,flexDirection:'row',justifyContent:'space-between'}, chartLabel:{fontSize:9,color:BRAND.colors.muted}, empty:{paddingVertical:26,alignItems:'center'}, emptyMark:{fontSize:27,color:BRAND.colors.primaryStrong}, emptyTitle:{fontSize:13,fontWeight:'900',color:BRAND.colors.ink,marginTop:5}, emptyText:{fontSize:10,color:BRAND.colors.muted,marginTop:4,textAlign:'center'}, grid:{flexDirection:'row',flexWrap:'wrap',gap:10}, stat:{width:'48.5%',backgroundColor:BRAND.colors.surface,padding:14,borderRadius:17,borderWidth:1,borderColor:BRAND.colors.border}, statLabel:{fontSize:9,color:BRAND.colors.muted}, statValue:{fontSize:14,fontWeight:'900',color:BRAND.colors.ink,marginTop:5}, sourceRow:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:12,borderTopWidth:1,borderTopColor:BRAND.colors.border}, sourceIcon:{width:36,height:36,borderRadius:12,backgroundColor:BRAND.colors.surfaceWarm,alignItems:'center',justifyContent:'center'}, sourceIconText:{fontSize:12,fontWeight:'900',color:BRAND.colors.primaryStrong}, sourceCopy:{flex:1}, sourceName:{fontSize:12,fontWeight:'900',color:BRAND.colors.ink}, sourceMeta:{fontSize:9,color:BRAND.colors.muted,marginTop:3}, sourcePrice:{fontSize:12,fontWeight:'900',color:BRAND.colors.ink}, emptySource:{fontSize:11,color:BRAND.colors.muted,marginTop:12}, error:{backgroundColor:'#FFF3F3',borderRadius:16,padding:13,borderWidth:1,borderColor:'#F0CACA'}, errorTitle:{fontSize:12,fontWeight:'900',color:'#9F2F2F'}, errorText:{fontSize:11,lineHeight:17,color:'#884646',marginTop:4}, footerNote:{paddingHorizontal:10}, footerText:{fontSize:9,lineHeight:14,textAlign:'center',color:BRAND.colors.muted} });
