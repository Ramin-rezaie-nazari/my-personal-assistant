import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AppLocale, getStoredLocale, isRTL, t } from '../../lib/i18n';
import { getMeals, hasAuthSession, Meal } from '../../lib/api';

export default function MealDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [locale, setLocale] = useState<AppLocale>('en');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getStoredLocale().then((stored) => { if (active && stored) setLocale(stored); });
    void hasAuthSession().then(async (ok) => {
      if (!ok) { router.replace('/'); return; }
      try { setMeals(await getMeals()); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load meal.'); } finally { setLoading(false); }
    });
    return () => { active = false; };
  }, []);

  const meal = useMemo(() => meals.find((item) => item.id === id), [meals, id]);
  const rtl = isRTL(locale);
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  if (error || !meal) return <SafeAreaView style={styles.safe}><View style={styles.missing}><Text style={styles.emoji}>🍽️</Text><Text style={[styles.title, rtl && styles.rtlText]}>{error ? t(locale, 'mealUnavailable') : t(locale, 'mealNotFound')}</Text><Text style={[styles.body, rtl && styles.rtlText]}>{error ?? (locale === 'fa' ? 'این غذا ممکن است حذف شده باشد یا دیگر در دسترس نباشد.' : 'This meal may have been removed or is no longer available.')}</Text><Pressable onPress={() => router.replace('/meals')} style={styles.primary}><Text style={styles.primaryText}>{t(locale, 'backToMeals')}</Text></Pressable></View></SafeAreaView>;

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <View style={[styles.nav, rtl && styles.rtl]}><Pressable onPress={() => router.back()}><Text style={styles.navText}>{rtl ? '→' : '←'} {t(locale, 'meals')}</Text></Pressable><Text style={styles.type}>{meal.type}</Text></View>
    <Text style={[styles.eyebrow, rtl && styles.rtlText]}>{t(locale, 'mealDetails')}</Text><Text style={[styles.title, rtl && styles.rtlText]}>{meal.name}</Text><Text style={[styles.time, rtl && styles.rtlText]}>{new Date(meal.eatenAt).toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}</Text>
    <View style={[styles.hero, rtl && styles.rtlWrap]}><Metric label={t(locale, 'calories')} value={`${Math.round(meal.calories)} kcal`} /><Metric label={t(locale, 'protein')} value={`${Math.round(meal.protein)} g`} /><Metric label={locale === 'fa' ? 'کربوهیدرات' : 'Carbs'} value={`${Math.round(meal.carbs)} g`} /><Metric label={locale === 'fa' ? 'چربی' : 'Fat'} value={`${Math.round(meal.fat)} g`} /></View>
    <View style={styles.card}><Text style={[styles.sectionTitle, rtl && styles.rtlText]}>{t(locale, 'ingredients')}</Text>{meal.items.map((item) => <View key={item.id} style={[styles.ingredient, rtl && styles.rtl]}><View style={styles.copy}><Text style={[styles.foodName, rtl && styles.rtlText]}>{item.food.name}</Text><Text style={[styles.foodMeta, rtl && styles.rtlText]}>{item.quantity} {item.quantity === 1 ? t(locale, 'serving') : t(locale, 'servings')}</Text></View><Text style={styles.foodCalories}>{Math.round(item.calories)} kcal</Text></View>)}</View>
    <Pressable onPress={() => router.push('/meal-builder')} style={styles.primary}><Text style={styles.primaryText}>{t(locale, 'logAnotherMeal')}</Text></Pressable>
  </ScrollView></SafeAreaView>;
}
function Metric({ label, value }: { label: string; value: string }) { return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>; }
const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:'#F7F8FA'},center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#F7F8FA'},content:{padding:20,gap:14,paddingBottom:40},nav:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},rtl:{flexDirection:'row-reverse'},rtlWrap:{flexDirection:'row-reverse'},rtlText:{textAlign:'right'},navText:{fontWeight:'900',color:'#111827'},type:{fontSize:11,fontWeight:'900',color:'#6B7280',textTransform:'uppercase'},eyebrow:{fontSize:10,letterSpacing:1.5,fontWeight:'900',color:'#6B7280'},title:{fontSize:30,fontWeight:'900',color:'#111827'},time:{fontSize:12,color:'#9CA3AF',marginTop:-8},hero:{backgroundColor:'#111827',borderRadius:20,padding:17,flexDirection:'row',flexWrap:'wrap',gap:10},metric:{width:'47%',backgroundColor:'#FFFFFF12',borderRadius:14,padding:12},metricLabel:{fontSize:10,color:'#9CA3AF'},metricValue:{fontSize:15,fontWeight:'900',color:'#FFF',marginTop:4},card:{backgroundColor:'#FFF',borderRadius:20,padding:17},sectionTitle:{fontSize:16,fontWeight:'900',color:'#111827',marginBottom:5},ingredient:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#F3F4F6'},copy:{flex:1},foodName:{fontSize:13,fontWeight:'900',color:'#111827'},foodMeta:{fontSize:10,color:'#9CA3AF',marginTop:3},foodCalories:{fontSize:12,fontWeight:'900',color:'#374151'},missing:{flex:1,padding:30,alignItems:'center',justifyContent:'center'},emoji:{fontSize:34},body:{fontSize:13,lineHeight:20,color:'#6B7280',textAlign:'center',marginTop:8},primary:{backgroundColor:'#111827',borderRadius:15,padding:15,marginTop:2},primaryText:{color:'#FFF',fontWeight:'900',textAlign:'center'}});
