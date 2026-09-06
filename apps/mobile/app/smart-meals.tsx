import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { getNutritionSummary, hasAuthSession, NutritionSummary } from '../lib/api';
import { getInventory, InventoryItem } from '../lib/inventory-api';
import { getFoodRecommendations, FoodRecommendation } from '../lib/recommendation-api';
import { useAppLocale } from '../lib/i18n';

const copy = {
  en: {
    back: 'Meals', inventory: 'Inventory', eyebrow: 'PERSONAL BRAIN · NUTRITION', title: 'What should you eat next?', subtitle: 'Suggestions now come from the Personal Brain recommendation service and your real household stock.', remaining: 'Remaining today', available: 'foods available at home', attention: 'items need attention', attentionHint: 'Open Inventory to see what should be replenished.', unavailable: 'Suggestions unavailable', retry: 'Retry', empty: 'No suitable meal right now', emptyHint: 'The assistant could not find a recipe that satisfies the current nutrition and inventory constraints.', openInventory: 'Open Inventory', how: 'How the assistant decides', howHint: 'The Personal Brain combines nutrition context, household inventory, country context when available, recent meals and deterministic recipe ranking. Low-stock forecasting stays separate.', calories: 'Calories', protein: 'Protein', missing: 'missing', coverage: 'coverage', reason: 'Why this is here',
  },
  fa: {
    back: 'غذاها', inventory: 'موجودی', eyebrow: 'مغز شخصی · تغذیه', title: 'بعدش چی بخوریم؟', subtitle: 'پیشنهادها حالا از سرویس واقعی مغز شخصی و موجودی خانه استفاده می‌کنند.', remaining: 'باقی‌مانده امروز', available: 'غذا در خانه موجود است', attention: 'مورد نیازمند توجه', attentionHint: 'موجودی را باز کن تا ببینی چه چیزهایی باید تهیه شوند.', unavailable: 'پیشنهادها در دسترس نیستند', retry: 'تلاش دوباره', empty: 'الان وعده مناسبی پیدا نشد', emptyHint: 'دستیار نتوانست رسپی‌ای پیدا کند که با محدودیت‌های فعلی تغذیه و موجودی هماهنگ باشد.', openInventory: 'باز کردن موجودی', how: 'دستیار چطور تصمیم می‌گیرد؟', howHint: 'مغز شخصی، وضعیت تغذیه، موجودی واقعی خانه، زمینه کشور در صورت وجود، وعده‌های اخیر و رتبه‌بندی قطعی رسپی‌ها را کنار هم می‌گذارد. پیش‌بینی کمبود جداست.', calories: 'کالری', protein: 'پروتئین', missing: 'کمبود', coverage: 'پوشش', reason: 'چرا این گزینه؟',
  },
} as const;
type SmartMealCopy = typeof copy.en;

export default function SmartMealsScreen() {
  const locale = useAppLocale();
  const text = copy[locale] as SmartMealCopy;
  const rtl = locale === 'fa';
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [recommendations, setRecommendations] = useState<FoodRecommendation[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [nutrition, stock, brainRecommendations] = await Promise.all([
        getNutritionSummary(),
        getInventory(),
        getFoodRecommendations({ targetServings: 1, maxMissingIngredients: 2 }),
      ]);
      setSummary(nutrition);
      setInventory(stock);
      setRecommendations(brainRecommendations.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : (locale === 'fa' ? 'ساخت پیشنهاد غذا ناموفق بود.' : 'Unable to build meal suggestions.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locale]);

  useEffect(() => {
    void hasAuthSession().then((ok) => {
      if (ok) void load();
      else router.replace('/');
    });
  }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" accessibilityLabel={locale === 'fa' ? 'در حال بارگذاری' : 'Loading'} /></View>;
  const lowStock = inventory.filter((item) => item.urgency === 'critical' || item.urgency === 'soon');

  return (
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
      <View style={[styles.nav, rtl ? styles.rtl : undefined]}>
        <Pressable onPress={() => router.back()}><Text style={styles.navText}>{rtl ? '→' : '←'} {text.back}</Text></Pressable>
        <Pressable onPress={() => router.push('/inventory')}><Text style={styles.navText}>{text.inventory}</Text></Pressable>
      </View>
      <Text style={[styles.eyebrow, rtl ? styles.textRtl : undefined]}>{text.eyebrow}</Text>
      <Text style={[styles.title, rtl ? styles.textRtl : undefined]}>{text.title}</Text>
      <Text style={[styles.subtitle, rtl ? styles.textRtl : undefined]}>{text.subtitle}</Text>

      {summary ? <View style={styles.targetCard}>
        <Text style={[styles.targetTitle, rtl ? styles.textRtl : undefined]}>{text.remaining}</Text>
        <View style={styles.targetRow}>
          <Target label={text.calories} value={summary.remaining.calories} unit="kcal" />
          <Target label={text.protein} value={summary.remaining.protein} unit="g" />
        </View>
        <Text style={[styles.stockHint, rtl ? styles.textRtl : undefined]}>{inventory.filter((item) => item.quantity > 0).length} {text.available}</Text>
      </View> : null}

      {lowStock.length ? <Pressable onPress={() => router.push('/inventory')} style={[styles.alert, rtl ? styles.rtl : undefined]}>
        <View style={styles.copyBlock}>
          <Text style={[styles.alertTitle, rtl ? styles.textRtl : undefined]}>{lowStock.length} {text.attention}</Text>
          <Text style={[styles.body, rtl ? styles.textRtl : undefined]}>{text.attentionHint}</Text>
        </View>
        <Text style={styles.alertArrow}>{rtl ? '←' : '→'}</Text>
      </Pressable> : null}

      {error ? <View style={styles.card}>
        <Text style={[styles.cardTitle, rtl ? styles.textRtl : undefined]}>{text.unavailable}</Text>
        <Text style={[styles.body, rtl ? styles.textRtl : undefined]}>{error}</Text>
        <Pressable onPress={() => void load()} style={styles.button}><Text style={styles.buttonText}>{text.retry}</Text></Pressable>
      </View> : null}

      {!error && recommendations.length ? recommendations.map((recommendation, index) => <RecommendationCard key={recommendation.recipeId} recommendation={recommendation} rank={index + 1} text={text} rtl={rtl} />) : null}

      {!error && !recommendations.length ? <View style={styles.card}>
        <Text style={[styles.cardTitle, rtl ? styles.textRtl : undefined]}>{text.empty}</Text>
        <Text style={[styles.body, rtl ? styles.textRtl : undefined]}>{text.emptyHint}</Text>
        <Pressable onPress={() => router.push('/inventory')} style={styles.button}><Text style={styles.buttonText}>{text.openInventory}</Text></Pressable>
      </View> : null}

      <View style={styles.note}>
        <Text style={[styles.noteTitle, rtl ? styles.textRtl : undefined]}>{text.how}</Text>
        <Text style={[styles.body, rtl ? styles.textRtl : undefined]}>{text.howHint}</Text>
      </View>
    </ScrollView>
  );
}

function Target({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return <View style={styles.target}><Text style={styles.targetLabel}>{label}</Text><Text style={styles.targetValue}>{value == null ? '—' : `${Math.max(0, Math.round(value))} ${unit}`}</Text></View>;
}

function RecommendationCard({ recommendation, rank, text, rtl }: { recommendation: FoodRecommendation; rank: number; text: SmartMealCopy; rtl: boolean }) {
  return <Pressable onPress={() => router.push(`/recipe/${recommendation.recipeId}`)} style={styles.card} accessibilityRole="button">
    <View style={[styles.cardTop, rtl ? styles.rtl : undefined]}>
      <View style={styles.rank}><Text style={styles.rankText}>#{rank}</Text></View>
      <View style={styles.copyBlock}>
        <Text style={[styles.cardTitle, rtl ? styles.textRtl : undefined]}>{recommendation.name}</Text>
        <Text style={[styles.body, rtl ? styles.textRtl : undefined]}>{text.calories}: {Math.round(recommendation.caloriesPerServing)} kcal · {text.protein}: {Math.round(recommendation.proteinPerServing)}g</Text>
      </View>
      <Text style={styles.score}>{Math.round(recommendation.score)}%</Text>
    </View>
    <View style={styles.macroRow}>
      <Macro label={text.coverage} value={`${Math.round(recommendation.coveragePercent)}%`} />
      <Macro label={text.missing} value={String(recommendation.missingCount)} />
      <Macro label={text.calories} value={`${Math.round(recommendation.caloriesPerServing)} kcal`} />
      <Macro label={text.protein} value={`${Math.round(recommendation.proteinPerServing)}g`} />
    </View>
    <Text style={[styles.reason, rtl ? styles.textRtl : undefined]}>💡 {recommendation.reasons.join(' · ') || text.reason}</Text>
  </Pressable>;
}

function Macro({ label, value }: { label: string; value: string }) { return <View><Text style={styles.macroLabel}>{label}</Text><Text style={styles.macroValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, gap: 14, paddingBottom: 40, backgroundColor: '#F7F8FA', minHeight: '100%' },
  rtl: { direction: 'rtl' }, textRtl: { textAlign: 'right' }, nav: { flexDirection: 'row', justifyContent: 'space-between' }, navText: { fontWeight: '900', color: '#111827' },
  eyebrow: { fontSize: 10, letterSpacing: 1.5, fontWeight: '900', color: '#6B7280' }, title: { fontSize: 30, fontWeight: '900', color: '#111827' }, subtitle: { fontSize: 14, lineHeight: 21, color: '#6B7280' },
  targetCard: { backgroundColor: '#111827', borderRadius: 20, padding: 18 }, targetTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' }, targetRow: { flexDirection: 'row', gap: 10, marginTop: 12 }, target: { flex: 1, backgroundColor: '#FFFFFF12', borderRadius: 14, padding: 12 }, targetLabel: { color: '#9CA3AF', fontSize: 11 }, targetValue: { color: '#FFF', fontSize: 20, fontWeight: '900', marginTop: 4 }, stockHint: { color: '#9CA3AF', fontSize: 10, marginTop: 12 },
  alert: { backgroundColor: '#FEF3C7', borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'center' }, alertArrow: { fontSize: 24, fontWeight: '900', color: '#92400E' }, copyBlock: { flex: 1 }, alertTitle: { fontSize: 13, fontWeight: '900', color: '#92400E' },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 17 }, body: { fontSize: 13, lineHeight: 19, color: '#6B7280', marginTop: 4 }, cardTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' }, rank: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' }, rankText: { color: '#FFF', fontWeight: '900', fontSize: 11 }, cardTitle: { fontSize: 16, fontWeight: '900', color: '#111827' }, score: { fontSize: 14, fontWeight: '900', color: '#111827' },
  macroRow: { flexDirection: 'row', gap: 15, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }, macroLabel: { fontSize: 9, color: '#9CA3AF' }, macroValue: { fontSize: 12, fontWeight: '900', color: '#374151', marginTop: 2 }, reason: { fontSize: 11, lineHeight: 17, color: '#6B7280', marginTop: 10 }, button: { alignSelf: 'flex-start', backgroundColor: '#111827', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginTop: 12 }, buttonText: { color: '#FFF', fontWeight: '900' }, note: { padding: 16, borderRadius: 16, backgroundColor: '#EEF2FF' }, noteTitle: { fontSize: 13, fontWeight: '900', color: '#111827' },
});
