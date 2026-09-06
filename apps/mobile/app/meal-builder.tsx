import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { createMeal, FoodItem, getFoods, hasAuthSession } from '../lib/api';
import { useAppLocale } from '../lib/i18n';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type SelectedFood = FoodItem & { quantity: number };

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function MealBuilderScreen() {
  const locale = useAppLocale();
  const rtl = locale === 'fa';
  const copy = locale === 'fa'
    ? {
        back: 'غذاها', eyebrow: 'ثبت وعده', title: 'وعده‌ات را بساز', subtitle: 'غذاها و مقدارشان را انتخاب کن. مجموع تغذیه‌ای از اطلاعات ذخیره‌شده غذاها محاسبه می‌شود.',
        mealName: 'نام وعده', namePlaceholder: 'مثلاً کاسه مرغ و برنج', type: 'نوع وعده', search: 'پیدا کردن غذا', searchPlaceholder: 'غذا را جستجو کن...', selected: 'غذاهای انتخاب‌شده', empty: 'هنوز غذایی به وعده اضافه نکرده‌ای.', nutrition: 'ارزش غذایی وعده', calories: 'کالری', protein: 'پروتئین', carbs: 'کربوهیدرات', fat: 'چربی', add: 'افزودن', saving: 'در حال ذخیره…', save: 'ذخیره وعده', invalid: 'نام وعده و حداقل یک غذا را وارد کن.', loadError: 'بارگذاری غذاها ممکن نشد.', saveError: 'ذخیره وعده ممکن نشد.', serving: 'پرس',
      }
    : {
        back: 'Meals', eyebrow: 'LOG A MEAL', title: 'Build your meal', subtitle: 'Pick foods and quantities. Nutrition totals come from your saved food data.',
        mealName: 'Meal name', namePlaceholder: 'e.g. Chicken & rice bowl', type: 'Type', search: 'Find a food', searchPlaceholder: 'Search foods...', selected: 'Selected foods', empty: 'Your meal is empty. Add a food above.', nutrition: 'Meal nutrition', calories: 'Calories', protein: 'Protein', carbs: 'Carbs', fat: 'Fat', add: 'Add', saving: 'Saving…', save: 'Save meal', invalid: 'Add a meal name and at least one food.', loadError: 'Unable to load foods.', saveError: 'Unable to save meal.', serving: 'serving',
      };
  const typeLabels: Record<MealType, string> = locale === 'fa'
    ? { breakfast: 'صبحانه', lunch: 'ناهار', dinner: 'شام', snack: 'میان‌وعده' }
    : { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

  const [name, setName] = useState('');
  const [type, setType] = useState<MealType>('lunch');
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [selected, setSelected] = useState<SelectedFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFoods = useCallback(async (value = '') => {
    try {
      setError(null);
      setFoods(await getFoods(value.trim() || undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.loadError);
    } finally {
      setLoading(false);
    }
  }, [copy.loadError]);

  useEffect(() => {
    void hasAuthSession().then((ok) => {
      if (!ok) router.replace('/');
      else void loadFoods();
    });
  }, [loadFoods]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) void loadFoods(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, loadFoods]);

  const totals = useMemo(
    () => selected.reduce(
      (sum, food) => ({
        calories: sum.calories + food.calories * food.quantity,
        protein: sum.protein + food.protein * food.quantity,
        carbs: sum.carbs + food.carbs * food.quantity,
        fat: sum.fat + food.fat * food.quantity,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    ),
    [selected],
  );

  const addFood = (food: FoodItem) => setSelected((current) => current.some((item) => item.id === food.id)
    ? current.map((item) => item.id === food.id ? { ...item, quantity: item.quantity + 1 } : item)
    : [...current, { ...food, quantity: 1 }]);

  const changeQuantity = (id: string, delta: number) => setSelected((current) => current.flatMap((item) => item.id !== id
    ? [item]
    : item.quantity + delta > 0 ? [{ ...item, quantity: item.quantity + delta }] : []));

  const save = async () => {
    if (!name.trim() || !selected.length) {
      setError(copy.invalid);
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const now = new Date();
      await createMeal({
        name: name.trim(),
        type,
        eatenAt: now.toISOString(),
        dateKey: now.toISOString().slice(0, 10),
        items: selected.map((food) => ({ foodId: food.id, quantity: food.quantity })),
      });
      router.replace('/meals');
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.saveError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()}><Text style={styles.navText}>{rtl ? `→ ${copy.back}` : `← ${copy.back}`}</Text></Pressable>
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
        </View>
        <Text style={[styles.title, rtl && styles.rtl]}>{copy.title}</Text>
        <Text style={[styles.subtitle, rtl && styles.rtl]}>{copy.subtitle}</Text>

        <Text style={[styles.label, rtl && styles.rtl]}>{copy.mealName}</Text>
        <TextInput value={name} onChangeText={setName} placeholder={copy.namePlaceholder} placeholderTextColor="#9CA3AF" style={[styles.input, rtl && styles.inputRtl]} textAlign={rtl ? 'right' : 'left'} />

        <Text style={[styles.label, rtl && styles.rtl]}>{copy.type}</Text>
        <View style={[styles.types, rtl && styles.rowRtl]}>{MEAL_TYPES.map((item) => (
          <Pressable key={item} onPress={() => setType(item)} style={[styles.type, type === item && styles.typeActive]}>
            <Text style={[styles.typeText, type === item && styles.typeTextActive]}>{typeLabels[item]}</Text>
          </Pressable>
        ))}</View>

        <Text style={[styles.label, rtl && styles.rtl]}>{copy.search}</Text>
        <TextInput value={query} onChangeText={setQuery} placeholder={copy.searchPlaceholder} placeholderTextColor="#9CA3AF" style={[styles.input, rtl && styles.inputRtl]} textAlign={rtl ? 'right' : 'left'} />
        <View style={styles.foodList}>{foods.slice(0, 8).map((food) => (
          <Pressable key={food.id} onPress={() => addFood(food)} style={[styles.foodRow, rtl && styles.rowRtl]}>
            <View style={styles.foodCopy}><Text style={[styles.foodName, rtl && styles.textRtl]}>{food.name}</Text><Text style={[styles.foodMeta, rtl && styles.textRtl]}>{Math.round(food.calories)} kcal · {Math.round(food.protein)}g protein</Text></View>
            <Text style={[styles.add, rtl && styles.addRtl]}>{rtl ? `+ ${copy.add}` : `+ ${copy.add}`}</Text>
          </Pressable>
        ))}</View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, rtl && styles.rtl]}>{copy.selected}</Text>
          {selected.length ? selected.map((food) => (
            <View key={food.id} style={[styles.selectedRow, rtl && styles.rowRtl]}>
              <View style={styles.foodCopy}><Text style={[styles.foodName, rtl && styles.textRtl]}>{food.name}</Text><Text style={[styles.foodMeta, rtl && styles.textRtl]}>{Math.round(food.calories * food.quantity)} kcal</Text></View>
              <View style={styles.stepper}>
                <Pressable onPress={() => changeQuantity(food.id, -1)} style={styles.step}><Text style={styles.stepText}>−</Text></Pressable>
                <Text style={styles.quantity}>{food.quantity}</Text>
                <Pressable onPress={() => changeQuantity(food.id, 1)} style={styles.step}><Text style={styles.stepText}>+</Text></Pressable>
              </View>
            </View>
          )) : <Text style={[styles.empty, rtl && styles.textRtl]}>{copy.empty}</Text>}
        </View>

        <View style={styles.totalCard}>
          <Text style={[styles.sectionTitleLight, rtl && styles.rtl]}>{copy.nutrition}</Text>
          <View style={[styles.totalGrid, rtl && styles.rowRtl]}>
            <Total label={copy.calories} value={`${Math.round(totals.calories)} kcal`} />
            <Total label={copy.protein} value={`${Math.round(totals.protein)} g`} />
            <Total label={copy.carbs} value={`${Math.round(totals.carbs)} g`} />
            <Total label={copy.fat} value={`${Math.round(totals.fat)} g`} />
          </View>
        </View>

        {error ? <Text style={[styles.error, rtl && styles.textRtl]}>{error}</Text> : null}
        <Pressable disabled={saving} onPress={() => void save()} style={[styles.primary, saving && styles.disabled]}>
          <Text style={styles.primaryText}>{saving ? copy.saving : copy.save}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Total({ label, value }: { label: string; value: string }) {
  return <View style={styles.total}><Text style={styles.totalLabel}>{label}</Text><Text style={styles.totalValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F7F8FA'}, center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#F7F8FA'}, content:{padding:20,gap:12,paddingBottom:40}, nav:{flexDirection:'row',justifyContent:'space-between'}, navText:{fontWeight:'900',color:'#111827'}, eyebrow:{fontSize:10,letterSpacing:1.4,fontWeight:'900',color:'#6B7280'}, title:{fontSize:30,fontWeight:'900',color:'#111827'}, subtitle:{fontSize:14,lineHeight:21,color:'#6B7280'}, label:{fontSize:12,fontWeight:'900',color:'#374151',marginTop:3}, input:{backgroundColor:'#FFF',borderRadius:15,paddingHorizontal:15,paddingVertical:13,fontSize:14,color:'#111827'}, inputRtl:{textAlign:'right'}, types:{flexDirection:'row',gap:8}, rowRtl:{flexDirection:'row-reverse'}, type:{paddingHorizontal:13,paddingVertical:9,borderRadius:12,backgroundColor:'#E5E7EB'}, typeActive:{backgroundColor:'#111827'}, typeText:{fontSize:11,fontWeight:'800',color:'#4B5563',textTransform:'capitalize'}, typeTextActive:{color:'#FFF'}, foodList:{backgroundColor:'#FFF',borderRadius:18,overflow:'hidden'}, foodRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:14,borderBottomWidth:1,borderBottomColor:'#F3F4F6'}, foodCopy:{flex:1}, foodName:{fontSize:14,fontWeight:'900',color:'#111827'}, foodMeta:{fontSize:10,color:'#9CA3AF',marginTop:3}, add:{fontSize:12,fontWeight:'900',color:'#111827'}, addRtl:{marginLeft:0}, card:{backgroundColor:'#FFF',borderRadius:18,padding:16}, sectionTitle:{fontSize:15,fontWeight:'900',color:'#111827',marginBottom:10}, selectedRow:{flexDirection:'row',alignItems:'center',paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#F3F4F6'}, stepper:{flexDirection:'row',alignItems:'center',gap:9}, step:{width:28,height:28,borderRadius:9,backgroundColor:'#F3F4F6',alignItems:'center',justifyContent:'center'}, stepText:{fontSize:17,fontWeight:'900'}, quantity:{fontSize:13,fontWeight:'900',minWidth:14,textAlign:'center'}, empty:{fontSize:12,color:'#9CA3AF'}, totalCard:{backgroundColor:'#111827',borderRadius:20,padding:17}, sectionTitleLight:{fontSize:15,fontWeight:'900',color:'#FFF',marginBottom:12}, totalGrid:{flexDirection:'row',justifyContent:'space-between',gap:7}, total:{flex:1}, totalLabel:{fontSize:10,color:'#9CA3AF'}, totalValue:{fontSize:14,fontWeight:'900',color:'#FFF',marginTop:4}, error:{fontSize:12,lineHeight:18,color:'#991B1B',backgroundColor:'#FEE2E2',padding:12,borderRadius:12}, primary:{backgroundColor:'#111827',borderRadius:15,padding:15}, disabled:{opacity:.55}, primaryText:{color:'#FFF',fontWeight:'900',textAlign:'center'}, rtl:{textAlign:'right'}, textRtl:{textAlign:'right'},
});
