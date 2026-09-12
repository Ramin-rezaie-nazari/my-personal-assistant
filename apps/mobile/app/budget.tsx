import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getMe, hasAuthSession, getRecipeFoodBudget, addBudgetQualifiedRecipeShopping, RecipeBudgetPlanResponse } from '../lib/api';
import { useAppLocale, t, tx } from '../lib/i18n';
import { budgetActionCopy, BudgetPlanWithActions, getBudgetCacheKey, loadBudgetPlanCache, saveBudgetPlanCache } from '../lib/budget-plan';

const statusLabel = (status: RecipeBudgetPlanResponse['budget']['items'][number]['status'], locale: 'en' | 'fa') => {
  const labels = {
    priced: ['Verified price', 'قیمت معتبر'],
    price_unavailable: ['Price unavailable', 'قیمت در دسترس نیست'],
    currency_mismatch: ['Currency mismatch', 'ارز قیمت ناسازگار است'],
    unit_mismatch: ['Unit mismatch', 'واحد قیمت ناسازگار است'],
    stale_price: ['Price is stale', 'قیمت قدیمی است'],
    over_budget: ['Over budget', 'بیش از بودجه'],
  } as const;
  return labels[status][locale === 'fa' ? 1 : 0];
};

export default function BudgetScreen() {
  const { locale, rtl } = useAppLocale();
  const params = useLocalSearchParams<{ recipeId?: string; name?: string }>();
  const recipeId = typeof params.recipeId === 'string' ? params.recipeId : '';
  const recipeName = typeof params.name === 'string' ? params.name : '';
  const [servings, setServings] = useState('2');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('IRT');
  const [plan, setPlan] = useState<BudgetPlanWithActions | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [offline, setOffline] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const title = recipeName || tx(locale, 'Recipe budget', 'بودجه دستور غذا');
  const parsePositiveInteger = (value: string) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  };
  const parseNonNegative = (value: string) => {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  };

  const cacheKey = useMemo(() => {
    const servingCount = parsePositiveInteger(servings);
    const budgetAmount = parseNonNegative(budget);
    if (!userId || !recipeId || servingCount === null || budgetAmount === null || !currency.trim()) return null;
    return getBudgetCacheKey(userId, recipeId, servingCount, budgetAmount, currency);
  }, [budget, currency, recipeId, servings, userId]);

  const load = useCallback(async () => {
    const servingCount = parsePositiveInteger(servings);
    const budgetAmount = parseNonNegative(budget);
    if (!recipeId) return setError(tx(locale, 'Recipe context is missing.', 'اطلاعات دستور غذا موجود نیست.'));
    if (servingCount === null) return setError(tx(locale, 'Servings must be a positive integer.', 'تعداد نفرات باید عدد صحیح مثبت باشد.'));
    if (budgetAmount === null) return setError(tx(locale, 'Enter a valid budget.', 'یک بودجه معتبر وارد کن.'));
    if (!currency.trim()) return setError(tx(locale, 'Currency is required.', 'ارز الزامی است.'));
    try {
      setLoading(true); setError(null); setAdded(false); setOffline(false); setCachedAt(null);
      const fresh = await getRecipeFoodBudget(recipeId, servingCount, budgetAmount, currency);
      const nextPlan = fresh as BudgetPlanWithActions;
      setPlan(nextPlan);
      if (cacheKey) await saveBudgetPlanCache(cacheKey, nextPlan);
    } catch (e) {
      if (cacheKey) {
        const cached = await loadBudgetPlanCache(cacheKey);
        if (cached) {
          setPlan(cached.plan); setOffline(true); setCachedAt(cached.savedAt); setError(null);
          return;
        }
      }
      setError(e instanceof Error ? e.message : tx(locale, 'Unable to build budget plan.', 'ساخت برنامه بودجه ممکن نیست.'));
    } finally { setLoading(false); }
  }, [budget, cacheKey, currency, locale, recipeId, servings]);

  useEffect(() => {
    void hasAuthSession().then(async (ok) => {
      if (!ok) { router.replace('/'); return; }
      try {
        const me = await getMe();
        setUserId(me.id);
      } catch { setUserId(null); }
    });
  }, []);

  const addToShopping = async () => {
    const servingCount = parsePositiveInteger(servings);
    const budgetAmount = parseNonNegative(budget);
    if (!recipeId || servingCount === null || budgetAmount === null || !currency.trim() || offline) return;
    try {
      setAdding(true); setError(null);
      await addBudgetQualifiedRecipeShopping(recipeId, servingCount, budgetAmount, currency);
      setAdded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : tx(locale, 'Unable to add verified items to shopping.', 'افزودن اقلام معتبر به خرید ممکن نیست.'));
    } finally { setAdding(false); }
  };

  const pricedItems = useMemo(() => plan?.budget.items.filter((item) => item.status === 'priced') ?? [], [plan]);
  const blockedItems = useMemo(() => plan?.budget.items.filter((item) => item.status !== 'priced') ?? [], [plan]);
  const nextActions = useMemo(() => plan?.budget.nextActions ?? [], [plan]);
  const statusText = plan?.budget.status === 'within_budget'
    ? tx(locale, 'Within budget for verified items', 'اقلام دارای قیمت معتبر در بودجه جا می‌شوند')
    : plan?.budget.status === 'over_budget'
      ? tx(locale, 'Some verified requirements exceed the budget', 'بعضی نیازهای دارای قیمت معتبر از بودجه بیشترند')
      : plan?.budget.status === 'no_missing_ingredients'
        ? tx(locale, 'You already have everything needed', 'همه مواد لازم را داری')
        : plan?.budget.status === 'partial_price_evidence'
          ? tx(locale, 'Only part of the price evidence is verified', 'فقط بخشی از شواهد قیمت معتبر است')
          : tx(locale, 'Some price evidence is unavailable', 'برای بعضی مواد، شواهد قیمت کافی نیست');

  return <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.nav, rtl && styles.rtl]}>
        <Pressable onPress={() => router.back()}><Text style={[styles.navText, rtl && styles.rtlText]}>{t(locale, 'back')}</Text></Pressable>
        <Pressable onPress={() => router.push('/shopping')}><Text style={[styles.navText, rtl && styles.rtlText]}>{t(locale, 'smartBasket')}</Text></Pressable>
      </View>
      <Text style={[styles.eyebrow, rtl && styles.rtlText]}>{tx(locale, 'BUDGET', 'بودجه')}</Text>
      <Text style={[styles.title, rtl && styles.rtlText]} numberOfLines={2}>{title}</Text>
      <Text style={[styles.subtitle, rtl && styles.rtlText]}>{tx(locale, 'Scale the recipe, verify missing-item prices, and see the budget impact before adding anything to your basket.', 'دستور را مقیاس کن، قیمت مواد کمبود را بررسی کن و قبل از افزودن به سبد اثر بودجه را ببین.')}</Text>

      {!recipeId ? <View style={styles.error}><Text style={[styles.errorTitle, rtl && styles.rtlText]}>{tx(locale, 'Recipe context is missing', 'اطلاعات دستور موجود نیست')}</Text><Pressable onPress={() => router.push('/recipe-match')} style={styles.retry}><Text style={styles.retryText}>{tx(locale, 'Choose a recipe', 'انتخاب دستور')}</Text></Pressable></View> : null}

      <View style={styles.card}>
        <Text style={[styles.sectionTitle, rtl && styles.rtlText]}>{tx(locale, 'Plan inputs', 'ورودی برنامه')}</Text>
        <Text style={[styles.label, rtl && styles.rtlText]}>{tx(locale, 'Servings', 'تعداد نفرات')}</Text>
        <TextInput value={servings} onChangeText={setServings} keyboardType="number-pad" style={[styles.input, rtl && styles.rtlInput]} placeholder="2" />
        <Text style={[styles.label, rtl && styles.rtlText]}>{tx(locale, 'Budget', 'بودجه')}</Text>
        <TextInput value={budget} onChangeText={setBudget} keyboardType="decimal-pad" style={[styles.input, rtl && styles.rtlInput]} placeholder={locale === 'fa' ? 'مثلاً ۱۵۰۰۰۰۰' : 'e.g. 1500000'} />
        <Text style={[styles.label, rtl && styles.rtlText]}>{tx(locale, 'Currency', 'ارز')}</Text>
        <TextInput value={currency} onChangeText={(value) => setCurrency(value.toUpperCase())} autoCapitalize="characters" style={[styles.input, rtl && styles.rtlInput]} placeholder="IRT" />
        <Pressable onPress={() => void load()} disabled={loading} style={[styles.primary, loading && styles.disabled]}><Text style={styles.primaryText}>{loading ? tx(locale, 'Building…', 'در حال ساخت…') : tx(locale, 'Check budget impact', 'بررسی اثر بودجه')}</Text></Pressable>
      </View>

      {offline ? <View style={styles.offline}><Text style={[styles.offlineTitle, rtl && styles.rtlText]}>{tx(locale, 'Offline — showing last verified plan', 'آفلاین — آخرین برنامه معتبر نمایش داده می‌شود')}</Text><Text style={[styles.body, rtl && styles.rtlText]}>{cachedAt ? `${tx(locale, 'Saved', 'ذخیره شده')}: ${new Date(cachedAt).toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US')}` : tx(locale, 'Reconnect to refresh price evidence.', 'برای به‌روزرسانی شواهد قیمت دوباره آنلاین شو.')}</Text></View> : null}
      {error ? <View style={styles.error}><Text style={[styles.errorTitle, rtl && styles.rtlText]}>{tx(locale, 'Budget plan unavailable', 'برنامه بودجه در دسترس نیست')}</Text><Text style={[styles.body, rtl && styles.rtlText]}>{error}</Text><Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>{t(locale, 'retry')}</Text></Pressable></View> : null}
      {loading ? <View style={styles.loading}><ActivityIndicator size="large" /><Text style={styles.body}>{tx(locale, 'Checking verified price evidence…', 'در حال بررسی شواهد معتبر قیمت…')}</Text></View> : null}

      {plan ? <>
        <View style={[styles.summary, rtl && styles.rtl]}><View><Text style={styles.summaryLabel}>{tx(locale, 'Estimated', 'برآورد')}</Text><Text style={styles.summaryValue}>{plan.budget.totalEstimatedCost} {plan.budget.currency}</Text></View><View><Text style={styles.summaryLabel}>{tx(locale, 'Remaining', 'باقی‌مانده')}</Text><Text style={styles.summaryValue}>{plan.budget.budgetRemaining} {plan.budget.currency}</Text></View></View>
        <View style={styles.notice}><Text style={[styles.noticeTitle, rtl && styles.rtlText]}>{statusText}</Text><Text style={[styles.body, rtl && styles.rtlText]}>{tx(locale, 'Only fresh, compatible price evidence is included. No FX conversion or guessed price is used.', 'فقط شواهد قیمت تازه و سازگار وارد محاسبه شده‌اند؛ تبدیل ارز یا قیمت حدسی استفاده نمی‌شود.')}</Text></View>
        {nextActions.length ? <View style={styles.card}><Text style={[styles.sectionTitle, rtl && styles.rtlText]}>{tx(locale, 'Next actions', 'اقدام بعدی')}</Text><View style={styles.actions}>{nextActions.map((action) => { const copy = budgetActionCopy[action] ?? [action.replaceAll('_', ' '), action.replaceAll('_', ' ')]; return <Pressable key={action} disabled={offline || action !== 'refresh_prices'} onPress={() => action === 'refresh_prices' && void load()} style={[styles.actionChip, (offline || action !== 'refresh_prices') && styles.actionDisabled]}><Text style={[styles.actionText, rtl && styles.rtlText]}>{locale === 'fa' ? copy[1] : copy[0]}</Text></Pressable>; })}</View></View> : null}
        {pricedItems.length ? <View style={styles.card}><Text style={[styles.sectionTitle, rtl && styles.rtlText]}>{tx(locale, 'Verified items', 'اقلام دارای قیمت معتبر')}</Text>{pricedItems.map((item) => <View key={item.foodId} style={[styles.item, rtl && styles.rtl]}><View style={styles.itemCopy}><Text style={[styles.itemName, rtl && styles.rtlText]}>{item.name}</Text><Text style={[styles.meta, rtl && styles.rtlText]}>{item.recommendedQuantity} {item.unit} · {item.reason.replaceAll('_', ' ')}</Text></View><Text style={styles.itemCost}>{item.estimatedCost} {item.currency}</Text></View>)}<Pressable onPress={() => void addToShopping()} disabled={adding || added || offline} style={[styles.primary, (adding || added || offline) && styles.disabled]}><Text style={styles.primaryText}>{adding ? tx(locale, 'Adding…', 'در حال افزودن…') : added ? tx(locale, 'Added to Smart Basket', 'به سبد هوشمند اضافه شد') : offline ? tx(locale, 'Reconnect to edit shopping', 'برای تغییر سبد دوباره آنلاین شو') : tx(locale, 'Add verified items to Smart Basket', 'افزودن اقلام معتبر به سبد هوشمند')}</Text></Pressable></View> : null}
        {blockedItems.length ? <View style={styles.card}><Text style={[styles.sectionTitle, rtl && styles.rtlText]}>{tx(locale, 'Needs review', 'نیازمند بررسی')}</Text>{blockedItems.map((item) => <View key={item.foodId} style={styles.blocked}><Text style={[styles.itemName, rtl && styles.rtlText]}>{item.name}</Text><Text style={[styles.status, rtl && styles.rtlText]}>{statusLabel(item.status, locale)}</Text><Text style={[styles.meta, rtl && styles.rtlText]}>{item.reason.replaceAll('_', ' ')}</Text>{item.priceObservedAt ? <Text style={[styles.meta, rtl && styles.rtlText]}>{tx(locale, 'Observed', 'مشاهده شده')}: {new Date(item.priceObservedAt).toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US')}</Text> : null}</View>)}</View> : null}
        {plan.inventory.missing.length === 0 ? <View style={styles.ready}><Text style={[styles.readyTitle, rtl && styles.rtlText]}>{tx(locale, 'Ready to cook', 'آماده پخت')}</Text><Text style={[styles.body, rtl && styles.rtlText]}>{tx(locale, 'No missing ingredients were found after scaling.', 'بعد از مقیاس‌گذاری، ماده کمبودی پیدا نشد.')}</Text></View> : null}
      </> : null}
    </ScrollView>
  </SafeAreaView>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#F7F8FA'},content:{padding:20,gap:14,paddingBottom:50},nav:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},rtl:{flexDirection:'row-reverse'},rtlText:{textAlign:'right',direction:'rtl'},rtlInput:{textAlign:'right'},navText:{fontWeight:'900',color:'#111827'},eyebrow:{fontSize:10,letterSpacing:1.7,fontWeight:'900',color:'#6B7280'},title:{fontSize:30,fontWeight:'900',color:'#111827'},subtitle:{fontSize:14,lineHeight:21,color:'#6B7280'},card:{backgroundColor:'#FFF',borderRadius:20,padding:17},sectionTitle:{fontSize:16,fontWeight:'900',color:'#111827',marginBottom:12},label:{fontSize:10,fontWeight:'900',color:'#6B7280',marginBottom:6,marginTop:8},input:{backgroundColor:'#F9FAFB',borderRadius:12,paddingHorizontal:13,paddingVertical:11,borderWidth:1,borderColor:'#E5E7EB',fontWeight:'800',color:'#111827'},primary:{backgroundColor:'#111827',borderRadius:13,padding:14,marginTop:13},primaryText:{color:'#FFF',fontWeight:'900',textAlign:'center'},disabled:{opacity:0.55},error:{backgroundColor:'#FFF',borderRadius:16,padding:16},errorTitle:{fontWeight:'900',color:'#991B1B'},body:{fontSize:12,lineHeight:19,color:'#6B7280',marginTop:4},retry:{alignSelf:'flex-start',backgroundColor:'#111827',borderRadius:10,paddingHorizontal:13,paddingVertical:9,marginTop:10},retryText:{color:'#FFF',fontWeight:'900'},loading:{backgroundColor:'#FFF',borderRadius:16,padding:20,alignItems:'center'},offline:{backgroundColor:'#FEF3C7',borderRadius:16,padding:15},offlineTitle:{fontSize:14,fontWeight:'900',color:'#92400E'},summary:{backgroundColor:'#111827',borderRadius:20,padding:18,flexDirection:'row',justifyContent:'space-between',gap:18},summaryLabel:{fontSize:10,color:'#9CA3AF'},summaryValue:{fontSize:18,fontWeight:'900',color:'#FFF',marginTop:5},notice:{backgroundColor:'#F3F4F6',borderRadius:16,padding:15},noticeTitle:{fontSize:14,fontWeight:'900',color:'#111827'},actions:{flexDirection:'row',flexWrap:'wrap',gap:8},actionChip:{backgroundColor:'#E5E7EB',borderRadius:20,paddingHorizontal:12,paddingVertical:9},actionDisabled:{opacity:0.55},actionText:{fontSize:10,fontWeight:'900',color:'#111827'},item:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',paddingVertical:11,borderBottomWidth:1,borderBottomColor:'#F3F4F6',gap:12},itemCopy:{flex:1},itemName:{fontSize:13,fontWeight:'900',color:'#111827'},meta:{fontSize:10,lineHeight:16,color:'#6B7280',marginTop:3},itemCost:{fontSize:12,fontWeight:'900',color:'#111827'},blocked:{paddingVertical:11,borderBottomWidth:1,borderBottomColor:'#F3F4F6'},status:{fontSize:10,fontWeight:'900',color:'#92400E',marginTop:4},ready:{backgroundColor:'#ECFDF5',borderRadius:16,padding:16},readyTitle:{fontSize:15,fontWeight:'900',color:'#065F46'}});