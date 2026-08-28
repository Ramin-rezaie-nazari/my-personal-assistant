import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getRecipeMatches, RecipeMatch } from '../lib/recipe-api';
import { hasAuthSession } from '../lib/api';
import { PREMIUM } from '../lib/premium-ui';
import { PremiumGlow } from '../components/PremiumGlow';
import { PremiumResultCard } from '../components/PremiumResultCard';
import { MotionPress } from '../lib/motion-components';

export default function RecipeMatchPremiumScreen() {
  const [recipes, setRecipes] = useState<RecipeMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setRecipes(await getRecipeMatches());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to match recipes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void hasAuthSession().then((ok) => {
      if (ok) void load();
      else router.replace('/');
    });
  }, [load]);

  const addMissingToBasket = async (recipe: RecipeMatch) => {
    if (!recipe.missing.length || added[recipe.recipeId]) return;
    try {
      setAdding(recipe.recipeId);
      setError(null);
      const { addRecipeMissingToBasket } = await import('../lib/recipe-api');
      await addRecipeMissingToBasket(recipe.recipeId, recipe.missing);
      setAdded((current) => ({ ...current, [recipe.recipeId]: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add missing ingredients.');
    } finally {
      setAdding(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <PremiumGlow size={280} opacity={0.12} accent="amber" />
        <ActivityIndicator color={PREMIUM.colors.primaryBright} />
        <Text style={styles.loadingText}>Recipe intelligence</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View pointerEvents="none" style={styles.bg}><PremiumGlow size={360} opacity={0.08} accent="amber" /></View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={PREMIUM.colors.primaryBright} />}
        contentContainerStyle={styles.content}
      >
        <View style={styles.top}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.icon}><Ionicons name="arrow-back" size={18} color={PREMIUM.colors.inkSoft} /></Pressable>
          <View style={styles.titleWrap}><Text style={styles.kicker}>RECIPE INTELLIGENCE</Text><Text style={styles.title}>Cook smarter</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Open assistant" onPress={() => router.push('/assistant')} style={styles.icon}><Ionicons name="sparkles-outline" size={18} color={PREMIUM.colors.primaryBright} /></Pressable>
        </View>

        <PremiumResultCard
          eyebrow="PERSONALIZED"
          title="Use what you already have"
          accent="amber"
          detail="Recipes are ranked by pantry coverage, so MYPA can help you cook with less friction."
          actions={[
            { label: 'Ask MYPA', icon: 'mic-outline', onPress: () => router.push('/assistant') },
            { label: 'Open basket', icon: 'cart-outline', onPress: () => router.push('/shopping') },
          ]}
        />

        {error ? <PremiumResultCard eyebrow="SYSTEM" title="Recipe matching unavailable" detail={error} accent="rose" actions={[{ label: 'Retry', icon: 'refresh', onPress: () => void load() }]} /> : null}

        {recipes.length ? recipes.map((recipe) => {
          const isAdding = adding === recipe.recipeId;
          const isAdded = Boolean(added[recipe.recipeId]);
          return (
            <View key={recipe.recipeId} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.copy}>
                  <Text style={styles.name}>{recipe.name}</Text>
                  <Text style={styles.meta}>{recipe.calories} kcal · {Math.round(recipe.protein)}g protein</Text>
                </View>
                <View style={styles.score}><Text style={styles.scoreValue}>{recipe.score}</Text><Text style={styles.scoreLabel}>match</Text></View>
              </View>

              <View style={styles.coverage}><View style={[styles.coverageFill, { width: `${recipe.coveragePercent}%` }]} /></View>
              <View style={styles.coverageRow}>
                <Text style={styles.coverageText}>{recipe.coveragePercent}% in stock</Text>
                <Text style={styles.coverageText}>{recipe.missingCount ? `${recipe.missingCount} missing` : 'Ready to cook'}</Text>
              </View>

              {recipe.missing.length ? (
                <>
                  <Text style={styles.missingLabel}>NEEDS</Text>
                  {recipe.missing.map((item) => (
                    <View key={item.foodId} style={styles.item}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemQty}>{item.quantity} {item.unit}</Text>
                    </View>
                  ))}
                  <MotionPress
                    disabled={isAdding || isAdded}
                    onPress={() => void addMissingToBasket(recipe)}
                    style={[styles.basketButton, (isAdding || isAdded) && styles.disabled]}
                  >
                    <Ionicons name={isAdded ? 'checkmark' : 'cart-outline'} size={16} color={PREMIUM.colors.ink} />
                    <Text style={styles.basketText}>{isAdding ? 'Adding…' : isAdded ? 'Added to basket' : 'Add missing ingredients'}</Text>
                  </MotionPress>
                </>
              ) : (
                <View style={styles.ready}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={PREMIUM.colors.mint} />
                  <Text style={styles.readyText}>Everything is already at home.</Text>
                </View>
              )}

              <View style={styles.macros}>
                <Macro label="Protein" value={`${Math.round(recipe.protein)}g`} tone="mint" />
                <Macro label="Carbs" value={`${Math.round(recipe.carbs)}g`} tone="amber" />
                <Macro label="Fat" value={`${Math.round(recipe.fat)}g`} tone="cyan" />
              </View>
            </View>
          );
        }) : (
          <View style={styles.empty}>
            <Ionicons name="restaurant-outline" size={28} color={PREMIUM.colors.primaryBright} />
            <Text style={styles.emptyTitle}>No recipe matches yet</Text>
            <Text style={styles.emptyBody}>Once your pantry has ingredients, MYPA can turn them into ideas for tonight.</Text>
          </View>
        )}

        <MotionPress onPress={() => router.push('/inventory')} style={styles.backButton}>
          <Text style={styles.backText}>Open household inventory</Text>
          <Ionicons name="arrow-forward" size={17} color={PREMIUM.colors.inkSoft} />
        </MotionPress>
      </ScrollView>
    </SafeAreaView>
  );
}

function Macro({ label, value, tone }: { label: string; value: string; tone: 'mint' | 'amber' | 'cyan' }) {
  return <View><Text style={styles.macroLabel}>{label}</Text><Text style={[styles.macroValue, { color: PREMIUM.colors[tone] }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PREMIUM.colors.canvas },
  bg: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  content: { padding: 18, gap: 15, paddingBottom: 120 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: PREMIUM.colors.canvas },
  loadingText: { color: PREMIUM.colors.ink, fontSize: 14, fontWeight: '900', marginTop: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: PREMIUM.colors.border, backgroundColor: 'rgba(255,255,255,0.035)', alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, alignItems: 'center' },
  kicker: { color: PREMIUM.colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: PREMIUM.colors.ink, fontSize: 18, fontWeight: '900', marginTop: 3 },
  card: { borderRadius: 24, borderWidth: 1, borderColor: PREMIUM.colors.border, backgroundColor: PREMIUM.colors.surfaceGlass, padding: 16 },
  cardTop: { flexDirection: 'row', gap: 10 },
  copy: { flex: 1 },
  name: { color: PREMIUM.colors.ink, fontSize: 16, fontWeight: '900' },
  meta: { color: PREMIUM.colors.muted, fontSize: 10, marginTop: 4 },
  score: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,197,107,0.10)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,197,107,0.18)' },
  scoreValue: { color: PREMIUM.colors.amber, fontSize: 17, fontWeight: '900' },
  scoreLabel: { color: PREMIUM.colors.muted, fontSize: 7, fontWeight: '800' },
  coverage: { height: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginTop: 15 },
  coverageFill: { height: 8, borderRadius: 8, backgroundColor: PREMIUM.colors.amber },
  coverageRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  coverageText: { color: PREMIUM.colors.muted, fontSize: 9, fontWeight: '700' },
  missingLabel: { color: PREMIUM.colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.3, marginTop: 14 },
  item: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: PREMIUM.colors.border },
  itemName: { color: PREMIUM.colors.inkSoft, fontSize: 11, fontWeight: '700' },
  itemQty: { color: PREMIUM.colors.muted, fontSize: 10, fontWeight: '800' },
  basketButton: { marginTop: 12, minHeight: 44, borderRadius: 22, backgroundColor: PREMIUM.colors.primaryBright, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  basketText: { color: PREMIUM.colors.ink, fontSize: 11, fontWeight: '900' },
  disabled: { opacity: 0.55 },
  ready: { marginTop: 12, minHeight: 42, borderRadius: 21, backgroundColor: 'rgba(98,230,181,0.08)', borderWidth: 1, borderColor: 'rgba(98,230,181,0.18)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  readyText: { color: PREMIUM.colors.mint, fontSize: 11, fontWeight: '800' },
  macros: { flexDirection: 'row', gap: 20, marginTop: 14 },
  macroLabel: { color: PREMIUM.colors.muted, fontSize: 9, fontWeight: '800' },
  macroValue: { fontSize: 12, fontWeight: '900', marginTop: 3 },
  empty: { borderRadius: 24, borderWidth: 1, borderColor: PREMIUM.colors.border, backgroundColor: PREMIUM.colors.surfaceGlass, padding: 30, alignItems: 'center' },
  emptyTitle: { color: PREMIUM.colors.ink, fontSize: 17, fontWeight: '900', marginTop: 10 },
  emptyBody: { color: PREMIUM.colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6, maxWidth: 300 },
  backButton: { minHeight: 50, borderRadius: 22, borderWidth: 1, borderColor: PREMIUM.colors.border, backgroundColor: 'rgba(255,255,255,0.025)', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backText: { color: PREMIUM.colors.inkSoft, fontSize: 12, fontWeight: '900' },
});
