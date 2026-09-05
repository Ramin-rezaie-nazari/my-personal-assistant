import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getMeals, hasAuthSession, Meal } from '../../lib/api';
import { useAppLocale } from '../../lib/i18n';

export default function MealDetailsScreen() {
  const locale = useAppLocale();
  const rtl = locale === 'fa';
  const copy = locale === 'fa'
    ? { back: 'غذاها', eyebrow: 'جزئیات وعده', missing: 'وعده پیدا نشد', unavailable: 'وعده در دسترس نیست', removed: 'این وعده ممکن است حذف شده باشد یا دیگر در دسترس نباشد.', backToMeals: 'بازگشت به غذاها', logAnother: 'ثبت یک وعده دیگر', ingredients: 'مواد غذایی', calories: 'کالری', protein: 'پروتئین', carbs: 'کربوهیدرات', fat: 'چربی', serving: 'پرس', loadError: 'بارگذاری وعده ممکن نشد.' }
    : { back: 'Meals', eyebrow: 'MEAL DETAILS', missing: 'Meal not found', unavailable: 'Meal unavailable', removed: 'This meal may have been removed or is no longer available.', backToMeals: 'Back to meals', logAnother: 'Log another meal', ingredients: 'Ingredients', calories: 'Calories', protein: 'Protein', carbs: 'Carbs', fat: 'Fat', serving: 'serving', loadError: 'Unable to load meal.' };
  const { id } = useLocalSearchParams<{ id: string }>();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void hasAuthSession().then(async (ok) => {
      if (!ok) { router.replace('/'); return; }
      try { setMeals(await getMeals()); }
      catch (err) { setError(err instanceof Error ? err.message : copy.loadError); }
      finally { setLoading(false); }
    });
  }, [copy.loadError]);

  const meal = useMemo(() => meals.find((item) => item.id === id), [meals, id]);
  const numberLocale = locale === 'fa' ? 'fa-IR' : 'en-US';
  const dateLocale = locale === 'fa' ? 'fa-IR' : 'en-US';

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  if (error || !meal) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.missing}>
          <Text style={styles.emoji}>🍽️</Text>
          <Text style={[styles.title, rtl && styles.rtl]}>{error ? copy.unavailable : copy.missing}</Text>
          <Text style={[styles.body, rtl && styles.rtl]}>{error ?? copy.removed}</Text>
          <Pressable onPress={() => router.replace('/meals')} style={styles.primary}><Text style={styles.primaryText}>{copy.backToMeals}</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const formatNumber = (value: number) => Math.round(value).toLocaleString(numberLocale);
  const formatDate = (value: string) => new Date(value).toLocaleString(dateLocale, { dateStyle: 'medium', timeStyle: 'short' });
  const quantityLabel = (quantity: number) => locale === 'fa' ? `${formatNumber(quantity)} ${copy.serving}` : `${quantity} ${copy.serving}${quantity === 1 ? '' : 's'}`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()}><Text style={styles.navText}>{rtl ? `→ ${copy.back}` : `← ${copy.back}`}</Text></Pressable>
          <Text style={styles.type}>{meal.type}</Text>
        </View>
        <Text style={[styles.eyebrow, rtl && styles.rtl]}>{copy.eyebrow}</Text>
        <Text style={[styles.title, rtl && styles.rtl]}>{meal.name}</Text>
        <Text style={[styles.time, rtl && styles.rtl]}>{formatDate(meal.eatenAt)}</Text>

        <View style={styles.hero}>
          <Metric label={copy.calories} value={`${formatNumber(meal.calories)} kcal`} />
          <Metric label={copy.protein} value={`${formatNumber(meal.protein)} g`} />
          <Metric label={copy.carbs} value={`${formatNumber(meal.carbs)} g`} />
          <Metric label={copy.fat} value={`${formatNumber(meal.fat)} g`} />
        </View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, rtl && styles.rtl]}>{copy.ingredients}</Text>
          {meal.items.map((item) => (
            <View key={item.id} style={[styles.ingredient, rtl && styles.rowRtl]}>
              <View style={styles.copyBlock}><Text style={[styles.foodName, rtl && styles.textRtl]}>{item.food.name}</Text><Text style={[styles.foodMeta, rtl && styles.textRtl]}>{quantityLabel(item.quantity)}</Text></View>
              <Text style={styles.foodCalories}>{formatNumber(item.calories)} kcal</Text>
            </View>
          ))}
        </View>
        <Pressable onPress={() => router.push('/meal-builder')} style={styles.primary}><Text style={styles.primaryText}>{copy.logAnother}</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F7F8FA'}, center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#F7F8FA'}, content:{padding:20,gap:14,paddingBottom:40}, nav:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, navText:{fontWeight:'900',color:'#111827'}, type:{fontSize:11,fontWeight:'900',color:'#6B7280',textTransform:'uppercase'}, eyebrow:{fontSize:10,letterSpacing:1.5,fontWeight:'900',color:'#6B7280'}, title:{fontSize:30,fontWeight:'900',color:'#111827'}, time:{fontSize:12,color:'#9CA3AF',marginTop:-8}, hero:{backgroundColor:'#111827',borderRadius:20,padding:17,flexDirection:'row',flexWrap:'wrap',gap:10}, metric:{width:'47%',backgroundColor:'#FFFFFF12',borderRadius:14,padding:12}, metricLabel:{fontSize:10,color:'#9CA3AF'}, metricValue:{fontSize:15,fontWeight:'900',color:'#FFF',marginTop:4}, card:{backgroundColor:'#FFF',borderRadius:20,padding:17}, sectionTitle:{fontSize:16,fontWeight:'900',color:'#111827',marginBottom:5}, ingredient:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#F3F4F6'}, rowRtl:{flexDirection:'row-reverse'}, copyBlock:{flex:1}, foodName:{fontSize:13,fontWeight:'900',color:'#111827'}, foodMeta:{fontSize:10,color:'#9CA3AF',marginTop:3}, foodCalories:{fontSize:12,fontWeight:'900',color:'#374151'}, missing:{flex:1,padding:30,alignItems:'center',justifyContent:'center'}, emoji:{fontSize:34}, body:{fontSize:13,lineHeight:20,color:'#6B7280',textAlign:'center',marginTop:8}, primary:{backgroundColor:'#111827',borderRadius:15,padding:15,marginTop:2}, primaryText:{color:'#FFF',fontWeight:'900',textAlign:'center'}, rtl:{textAlign:'right'}, textRtl:{textAlign:'right'},
});
