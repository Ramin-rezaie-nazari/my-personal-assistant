import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getPriceAnalysis, getPriceHistory, getPriceSources, normalizeProductKey, PriceAnalysis, PriceSnapshot, PriceSource } from '../lib/price-api';
import { useAppLocale } from '../lib/i18n';

export default function PriceHistoryScreen() {
  const locale = useAppLocale();
  const rtl = locale === 'fa';
  const copy = locale === 'fa'
    ? {
        back:'برگشت', eyebrow:'هوش قیمت', current:'قیمت فعلی', insufficient:'داده کافی نیست', compared:'نسبت به ۷ روز قبل', chart:'نمودار قیمت', needTwo:'برای نمایش نمودار حداقل دو ثبت قیمت لازم است.', avg7:'میانگین ۷ روز', avg30:'میانگین ۳۰ روز', min:'کمترین', max:'بیشترین', stores:'فروشگاه‌ها', inStock:'موجود', unknown:'وضعیت نامشخص', noPrices:'هنوز قیمتی برای این محصول ثبت نشده.', loadError:'خطا در دریافت تاریخچه قیمت', days:'روز', year:'۱ سال', error: 'خطا'
      }
    : {
        back:'Back', eyebrow:'PRICE INTELLIGENCE', current:'Current price', insufficient:'Not enough data', compared:'vs. the last 7 days', chart:'Price history', needTwo:'At least two price records are needed to show the chart.', avg7:'7-day average', avg30:'30-day average', min:'Lowest', max:'Highest', stores:'Stores', inStock:'In stock', unknown:'Unknown status', noPrices:'No prices have been recorded for this product yet.', loadError:'Unable to load price history', days:'days', year:'1 year', error:'Error'
      };
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
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [h, a, s] = await Promise.all([getPriceHistory(key, days), getPriceAnalysis(key), getPriceSources()]);
        if (alive) { setHistory(h.items); setAnalysis(a); setSources(s); }
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : copy.loadError);
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [key, days, copy.loadError]);

  const points = useMemo(() => {
    const grouped = new Map<string, PriceSnapshot>();
    for (const item of history) grouped.set(item.sourceId, item);
    return [...grouped.values()].sort((a, b) => a.amount - b.amount);
  }, [history]);
  const min = Math.min(...history.map((x) => x.amount), 0);
  const max = Math.max(...history.map((x) => x.amount), 0);
  const range = Math.max(1, max - min);
  const money = (value: number | null) => value === null ? '—' : locale === 'fa' ? `${Math.round(value).toLocaleString('fa-IR')} تومان` : `${Math.round(value).toLocaleString('en-US')}`;
  const shortDate = (value: string) => new Date(value).toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US', { month: 'short', day: 'numeric' });
  const formatChange = () => {
    if (analysis?.changeVs7d === null || analysis?.changeVs7d === undefined) return copy.insufficient;
    const arrow = analysis.changeVs7d > 0 ? '↑' : analysis.changeVs7d < 0 ? '↓' : '→';
    const value = Math.abs(analysis.changeVs7d).toFixed(1);
    return locale === 'fa' ? `${arrow} ${value}٪ ${copy.compared}` : `${arrow} ${value}% ${copy.compared}`;
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>{rtl ? `→ ${copy.back}` : `← ${copy.back}`}</Text></Pressable>
        <Text style={[styles.eyebrow, rtl && styles.rtl]}>{copy.eyebrow}</Text>
        <Text style={[styles.title, rtl && styles.rtl]}>{params.name ?? key.replace(/-/g, ' ')}</Text>
        {error ? <View style={styles.card}><Text style={[styles.error, rtl && styles.rtl]}>{copy.error}: {error}</Text></View> : null}
        <View style={[styles.periods, rtl && styles.rowRtl]}>
          {[7, 30, 90, 365].map((d) => <Pressable key={d} onPress={() => setDays(d)} style={[styles.period, d === days && styles.periodActive]}><Text style={[styles.periodText, d === days && styles.periodTextActive]}>{d === 365 ? copy.year : `${d} ${copy.days}`}</Text></Pressable>)}
        </View>
        {analysis ? <View style={styles.hero}><Text style={[styles.label, rtl && styles.rtl]}>{copy.current}</Text><Text style={[styles.current, rtl && styles.rtl]}>{money(analysis.current)}</Text><Text style={[styles.change, rtl && styles.rtl]}>{formatChange()}</Text></View> : null}
        <View style={styles.card}><Text style={[styles.section, rtl && styles.rtl]}>{copy.chart}</Text>{history.length < 2 ? <Text style={[styles.muted, rtl && styles.rtl]}>{copy.needTwo}</Text> : <View style={styles.chart}>{history.slice(-20).map((p, i) => { const x = (i / Math.max(1, Math.min(history.length, 20) - 1)) * 92 + 4; const y = 90 - ((p.amount - min) / range) * 78; return <View key={`${p.id}-${i}`} style={[styles.point, { left: `${x}%`, top: `${y}%` as any }]}><View style={styles.dot} /></View>; })}</View>}<View style={styles.chartLegend}><Text style={styles.muted}>{money(min)}</Text><Text style={styles.muted}>{money(max)}</Text></View></View>
        {analysis ? <View style={[styles.grid, rtl && styles.gridRtl]}><View style={styles.stat}><Text style={[styles.muted, rtl && styles.rtl]}>{copy.avg7}</Text><Text style={styles.statValue}>{money(analysis.average7d)}</Text></View><View style={styles.stat}><Text style={[styles.muted, rtl && styles.rtl]}>{copy.avg30}</Text><Text style={styles.statValue}>{money(analysis.average30d)}</Text></View><View style={styles.stat}><Text style={[styles.muted, rtl && styles.rtl]}>{copy.min}</Text><Text style={styles.statValue}>{money(analysis.min30d)}</Text></View><View style={styles.stat}><Text style={[styles.muted, rtl && styles.rtl]}>{copy.max}</Text><Text style={styles.statValue}>{money(analysis.max30d)}</Text></View></View> : null}
        <View style={styles.card}><Text style={[styles.section, rtl && styles.rtl]}>{copy.stores}</Text>{points.length ? points.map((p) => <View key={p.id} style={[styles.row, rtl && styles.rowRtl]}><View style={styles.sourceCopy}><Text style={[styles.name, rtl && styles.textRtl]}>{sources.find((s) => s.id === p.sourceId)?.name ?? p.sourceId}</Text><Text style={[styles.muted, rtl && styles.textRtl]}>{p.availability === 'in_stock' ? copy.inStock : copy.unknown} · {shortDate(p.observedAt)}</Text></View><Text style={styles.price}>{money(p.amount)}</Text></View>) : <Text style={[styles.muted, rtl && styles.rtl]}>{copy.noPrices}</Text>}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:'#F7F8FA'}, center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#F7F8FA'}, content:{padding:20,gap:14,paddingBottom:40}, back:{fontWeight:'900',color:'#111827'}, eyebrow:{fontSize:10,letterSpacing:1.5,fontWeight:'900',color:'#6B7280'}, title:{fontSize:28,fontWeight:'900',color:'#111827'}, periods:{flexDirection:'row',gap:7}, rowRtl:{flexDirection:'row-reverse'}, period:{paddingHorizontal:12,paddingVertical:8,borderRadius:18,backgroundColor:'#FFF'}, periodActive:{backgroundColor:'#111827'}, periodText:{fontSize:11,fontWeight:'800',color:'#6B7280'}, periodTextActive:{color:'#FFF'}, hero:{backgroundColor:'#111827',borderRadius:22,padding:20}, label:{fontSize:11,color:'#9CA3AF'}, current:{fontSize:28,fontWeight:'900',color:'#FFF',marginTop:5}, change:{fontSize:12,fontWeight:'800',color:'#D1D5DB',marginTop:6}, card:{backgroundColor:'#FFF',borderRadius:20,padding:17}, section:{fontSize:16,fontWeight:'900',color:'#111827',marginBottom:10}, chart:{height:170,borderLeftWidth:1,borderBottomWidth:1,borderColor:'#E5E7EB',position:'relative',overflow:'hidden'}, point:{position:'absolute',width:7,height:7,marginLeft:-3.5,marginTop:-3.5}, dot:{width:7,height:7,borderRadius:4,backgroundColor:'#111827'}, chartLegend:{flexDirection:'row',justifyContent:'space-between',marginTop:8}, muted:{fontSize:11,color:'#9CA3AF'}, grid:{flexDirection:'row',flexWrap:'wrap',gap:10}, gridRtl:{flexDirection:'row-reverse'}, stat:{backgroundColor:'#FFF',borderRadius:16,padding:14,width:'48%'}, statValue:{fontSize:15,fontWeight:'900',color:'#111827',marginTop:5}, row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#F3F4F6'}, sourceCopy:{flex:1}, name:{fontSize:13,fontWeight:'900',color:'#111827'}, price:{fontSize:13,fontWeight:'900',color:'#111827'}, error:{color:'#B91C1C',fontWeight:'800'}, rtl:{textAlign:'right'}, textRtl:{textAlign:'right'},
});
