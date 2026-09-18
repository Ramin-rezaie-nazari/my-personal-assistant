import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getPriceAnalysis, getPriceHistory, getPriceSources, normalizeProductKey, PriceAnalysis, PriceSnapshot, PriceSource } from '../lib/price-api';
import { isRTL, toIntlLocale, useAppLocale, type AppLocale } from '../lib/i18n';
import { localizedCopy } from '../lib/localized-copy';
import { getOnboardingState } from '../lib/onboarding';

const copy = localizedCopy({
  en: {
    back: 'Back', eyebrow: 'PRICE INTELLIGENCE', currentPrice: 'Current price', enoughData: 'Not enough data', versusPrevious: 'vs previous',
    priceChart: 'Price chart', mixedCurrency: 'Records with a different currency are hidden from the current chart.', minPoints: 'At least two price records are needed to show the chart.',
    average7d: '7-day average', average30d: '30-day average', minimum: 'Minimum', maximum: 'Maximum', stores: 'Stores',
    inStock: 'In stock', unknownStatus: 'Status unknown', noPrices: 'No price has been recorded for this product yet.', days: 'days', oneYear: '1 year', toman: 'Toman', rial: 'Rial', unit: 'unit',
    loadError: 'Unable to load price history.',
  },
  fa: {
    back: 'برگشت', eyebrow: 'هوشمندی قیمت', currentPrice: 'قیمت فعلی', enoughData: 'داده کافی نیست', versusPrevious: 'نسبت به قبل',
    priceChart: 'نمودار قیمت', mixedCurrency: 'ثبت‌های با واحد پول متفاوت از نمودار فعلی نمایش داده نمی‌شوند.', minPoints: 'برای نمایش نمودار حداقل دو ثبت قیمت لازم است.',
    average7d: 'میانگین ۷ روز', average30d: 'میانگین ۳۰ روز', minimum: 'کمترین', maximum: 'بیشترین', stores: 'فروشگاه‌ها',
    inStock: 'موجود', unknownStatus: 'وضعیت نامشخص', noPrices: 'هنوز قیمتی برای این محصول ثبت نشده.', days: 'روز', oneYear: '۱ سال', toman: 'تومان', rial: 'ریال', unit: 'واحد',
    loadError: 'دریافت تاریخچه قیمت انجام نشد.',
  },
});

function currencyLabel(currency: string, text: Record<string, string>) {
  const normalized = currency.trim().toUpperCase();
  if (normalized === 'IRT') return text.toman;
  if (normalized === 'IRR') return text.rial;
  return normalized || text.unit;
}

function money(value: number | null, currency: string, locale: AppLocale, text: Record<string, string>) {
  return value === null ? '—' : `${Math.round(value).toLocaleString(toIntlLocale(locale))} ${currencyLabel(currency, text)}`;
}

function shortDate(value: string, locale: AppLocale) {
  return new Date(value).toLocaleDateString(toIntlLocale(locale), { month: 'short', day: 'numeric' });
}

export default function PriceHistoryScreen() {
  const { locale } = useAppLocale();
  const rtl = isRTL(locale);
  const text = copy[locale];
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
        const onboarding = await getOnboardingState();
        const detected = onboarding.detectedCountryCode?.trim().toUpperCase() ?? '';
        const [h, a, s] = await Promise.all([
          getPriceHistory(key, days, detected || undefined),
          getPriceAnalysis(key, detected || undefined),
          getPriceSources(),
        ]);
        if (alive) {
          setHistory(h.items);
          setAnalysis(a);
          setSources(s);
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : text.loadError);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [key, days, text.loadError]);

  const displayCurrency = useMemo(() => history[0]?.currency ?? 'IRT', [history]);
  const chartHistory = useMemo(() => history.filter((item) => item.currency.toUpperCase() === displayCurrency.toUpperCase()), [history, displayCurrency]);
  const points = useMemo(() => {
    const grouped = new Map<string, PriceSnapshot>();
    for (const item of chartHistory) grouped.set(item.sourceId, item);
    return [...grouped.values()].sort((a, b) => a.amount - b.amount);
  }, [chartHistory]);
  const min = chartHistory.length ? Math.min(...chartHistory.map((x) => x.amount)) : null;
  const max = chartHistory.length ? Math.max(...chartHistory.map((x) => x.amount)) : null;
  const range = min !== null && max !== null ? Math.max(1, max - min) : 1;

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={[styles.content, rtl && styles.rtl]}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>← {text.back}</Text></Pressable>
    <Text style={styles.eyebrow}>{text.eyebrow}</Text><Text style={styles.title}>{params.name ?? key.replace(/-/g, ' ')}</Text>
    {error ? <View style={styles.card}><Text style={styles.error}>{error}</Text></View> : null}
    <View style={styles.periods}>{[7, 30, 90, 365].map((d) => <Pressable key={d} onPress={() => setDays(d)} style={[styles.period, d === days && styles.periodActive]}><Text style={[styles.periodText, d === days && styles.periodTextActive]}>{d === 365 ? text.oneYear : `${d} ${text.days}`}</Text></Pressable>)}</View>
    {analysis ? <View style={styles.hero}><Text style={styles.label}>{text.currentPrice}</Text><Text style={styles.current}>{money(analysis.current, displayCurrency, locale, text)}</Text><Text style={styles.change}>{analysis.changeVs7d === null ? text.enoughData : `${analysis.changeVs7d > 0 ? '↑' : '↓'} ${Math.abs(analysis.changeVs7d).toFixed(1)}٪ ${text.versusPrevious}`}</Text></View> : null}
    <View style={styles.card}>
      <Text style={styles.section}>{text.priceChart}</Text>
      {history.length !== chartHistory.length ? <Text style={styles.muted}>{text.mixedCurrency}</Text> : null}
      {chartHistory.length < 2 ? <Text style={styles.muted}>{text.minPoints}</Text> : <View style={styles.chart}>{chartHistory.slice(-20).map((p, i) => { const x = (i / Math.max(1, Math.min(chartHistory.length, 20) - 1)) * 92 + 4; const y = 90 - ((p.amount - (min ?? p.amount)) / range) * 78; return <View key={`${p.id}-${i}`} style={[styles.point, { left: `${x}%`, top: `${y}%` as any }]}><View style={styles.dot} /></View>; })}</View>}
      <View style={styles.chartLegend}><Text style={styles.muted}>{money(min, displayCurrency, locale, text)}</Text><Text style={styles.muted}>{money(max, displayCurrency, locale, text)}</Text></View>
    </View>
    {analysis ? <View style={styles.grid}><View style={styles.stat}><Text style={styles.muted}>{text.average7d}</Text><Text style={styles.statValue}>{money(analysis.average7d, displayCurrency, locale, text)}</Text></View><View style={styles.stat}><Text style={styles.muted}>{text.average30d}</Text><Text style={styles.statValue}>{money(analysis.average30d, displayCurrency, locale, text)}</Text></View><View style={styles.stat}><Text style={styles.muted}>{text.minimum}</Text><Text style={styles.statValue}>{money(analysis.min30d, displayCurrency, locale, text)}</Text></View><View style={styles.stat}><Text style={styles.muted}>{text.maximum}</Text><Text style={styles.statValue}>{money(analysis.max30d, displayCurrency, locale, text)}</Text></View></View> : null}
    <View style={styles.card}><Text style={styles.section}>{text.stores}</Text>{points.length ? points.map((p) => <View key={p.id} style={styles.row}><View><Text style={styles.name}>{sources.find((s) => s.id === p.sourceId)?.name ?? p.sourceId}</Text><Text style={styles.muted}>{p.availability === 'in_stock' ? text.inStock : text.unknownStatus} · {shortDate(p.observedAt, locale)}</Text></View><Text style={styles.price}>{money(p.amount, p.currency, locale, text)}</Text></View>) : <Text style={styles.muted}>{text.noPrices}</Text>}</View>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F7F8FA'}, center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#F7F8FA'}, content:{padding:20,gap:14,paddingBottom:40}, rtl:{direction:'rtl'}, back:{fontWeight:'900',color:'#111827'}, eyebrow:{fontSize:10,letterSpacing:1.5,fontWeight:'900',color:'#6B7280'}, title:{fontSize:28,fontWeight:'900',color:'#111827'}, periods:{flexDirection:'row',gap:7}, period:{paddingHorizontal:12,paddingVertical:8,borderRadius:18,backgroundColor:'#FFF'}, periodActive:{backgroundColor:'#111827'}, periodText:{fontSize:11,fontWeight:'800',color:'#6B7280'}, periodTextActive:{color:'#FFF'}, hero:{backgroundColor:'#111827',borderRadius:22,padding:20}, label:{fontSize:11,color:'#9CA3AF'}, current:{fontSize:28,fontWeight:'900',color:'#FFF',marginTop:5}, change:{fontSize:12,fontWeight:'800',color:'#D1D5DB',marginTop:6}, card:{backgroundColor:'#FFF',borderRadius:20,padding:17}, section:{fontSize:16,fontWeight:'900',color:'#111827',marginBottom:10}, chart:{height:170,borderLeftWidth:1,borderBottomWidth:1,borderColor:'#E5E7EB',position:'relative',overflow:'hidden'}, point:{position:'absolute',width:7,height:7,marginLeft:-3.5,marginTop:-3.5}, dot:{width:7,height:7,borderRadius:4,backgroundColor:'#111827'}, chartLegend:{flexDirection:'row',justifyContent:'space-between',marginTop:8}, muted:{fontSize:11,color:'#9CA3AF'}, grid:{flexDirection:'row',flexWrap:'wrap',gap:10}, stat:{backgroundColor:'#FFF',borderRadius:16,padding:14,width:'48%'}, statValue:{fontSize:15,fontWeight:'900',color:'#111827',marginTop:5}, row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#F3F4F6'}, name:{fontSize:13,fontWeight:'900',color:'#111827'}, price:{fontSize:13,fontWeight:'900',color:'#111827'}, error:{color:'#B91C1C',fontWeight:'800'},
});
