import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTodayDashboard, DashboardResponse } from '../lib/api';

function ProgressCard({ label, value, goal, unit }: { label: string; value: number; goal: number; unit: string }) {
  const progress = goal > 0 ? Math.min(value / goal, 1) : 0;
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value.toLocaleString()} <Text style={styles.unit}>{unit}</Text></Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.muted}>{goal.toLocaleString()} {unit} goal</Text>
    </View>
  );
}

export default function HomeScreen() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await getTodayDashboard());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  if (error) {
    return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;
  }

  const nutrition = data?.nutrition;
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      >
        <Text style={styles.eyebrow}>MY PERSONAL ASSISTANT</Text>
        <Text style={styles.title}>Good day 👋</Text>
        <Text style={styles.subtitle}>{data?.dateKey}</Text>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Today at a glance</Text>
          <Text style={styles.heroValue}>{nutrition?.caloriesRemaining.toLocaleString() ?? 0} kcal</Text>
          <Text style={styles.heroMuted}>remaining today</Text>
        </View>

        <ProgressCard label="Calories" value={nutrition?.calories ?? 0} goal={nutrition?.calorieGoal ?? 0} unit="kcal" />
        <ProgressCard label="Protein" value={nutrition?.protein ?? 0} goal={nutrition?.proteinGoal ?? 0} unit="g" />
        <ProgressCard label="Water" value={nutrition?.waterMl ?? 0} goal={nutrition?.waterGoalMl ?? 0} unit="ml" />

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Meals</Text>
          <Text style={styles.cardValue}>{data?.mealCount ?? 0}</Text>
          {data?.meals.map((meal) => (
            <View key={meal.id} style={styles.mealRow}>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.muted}>{meal.calories} kcal</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  content: { padding: 20, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: '#6B7280' },
  title: { fontSize: 34, fontWeight: '800', color: '#111827' },
  subtitle: { color: '#6B7280', marginTop: -8 },
  hero: { backgroundColor: '#111827', borderRadius: 24, padding: 22, marginVertical: 4 },
  heroTitle: { color: '#D1D5DB', fontSize: 14, fontWeight: '600' },
  heroValue: { color: '#FFFFFF', fontSize: 36, fontWeight: '800', marginTop: 8 },
  heroMuted: { color: '#9CA3AF', marginTop: 2 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18 },
  cardLabel: { color: '#6B7280', fontSize: 13, fontWeight: '700' },
  cardValue: { color: '#111827', fontSize: 26, fontWeight: '800', marginTop: 4 },
  unit: { fontSize: 13, color: '#6B7280' },
  track: { height: 8, borderRadius: 8, backgroundColor: '#E5E7EB', overflow: 'hidden', marginTop: 12 },
  fill: { height: '100%', borderRadius: 8, backgroundColor: '#111827' },
  muted: { color: '#6B7280', fontSize: 12, marginTop: 7 },
  mealRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 14, marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB' },
  mealName: { color: '#111827', fontWeight: '600' },
  error: { color: '#B91C1C', textAlign: 'center' },
});
