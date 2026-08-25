import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Habit, HabitSummary, createHabit, deleteHabit, getHabitSummary, getHabits, completeHabit, hasAuthSession } from '../lib/api';
import { PREMIUM } from '../lib/premium-ui';
import { PremiumGlow } from '../components/PremiumGlow';
import { PremiumResultCard } from '../components/PremiumResultCard';
import { MotionPress } from '../lib/motion-components';

export default function HabitsPremiumScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [summary, setSummary] = useState<HabitSummary | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [items, week] = await Promise.all([getHabits(), getHabitSummary()]);
      setHabits(items);
      setSummary(week);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load habits.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void hasAuthSession().then((ok) => (ok ? load() : router.replace('/')));
  }, [load]);

  const add = async () => {
    if (!name.trim()) return;
    try {
      setBusy('add');
      await createHabit({ name: name.trim(), frequency: 'daily', targetPerWeek: 7 });
      setName('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create habit.');
    } finally {
      setBusy(null);
    }
  };

  const done = async (id: string) => {
    try {
      setBusy(id);
      await completeHabit(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete habit.');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    try {
      setBusy(`delete-${id}`);
      await deleteHabit(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete habit.');
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <PremiumGlow size={260} opacity={0.12} accent="mint" />
        <ActivityIndicator size="large" color={PREMIUM.colors.primaryBright} />
        <Text style={styles.loadingText}>Building your rhythm</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View pointerEvents="none" style={styles.bg}>
        <PremiumGlow size={350} opacity={0.08} accent="mint" />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      >
        <View style={styles.top}>
          <Pressable onPress={() => router.back()} style={styles.icon} accessibilityRole="button" accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={18} color={PREMIUM.colors.inkSoft} />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.kicker}>DAILY RHYTHM</Text>
            <Text style={styles.title}>Habits</Text>
          </View>
          <Pressable onPress={() => router.push('/assistant')} style={styles.icon} accessibilityRole="button" accessibilityLabel="Open MYPA assistant">
            <Ionicons name="sparkles-outline" size={18} color={PREMIUM.colors.primaryBright} />
          </Pressable>
        </View>

        <PremiumResultCard
          eyebrow="7-DAY RHYTHM"
          title="Consistency"
          accent="mint"
          value={`${summary?.completionPercent ?? 0}%`}
          detail={`${summary?.completedCount ?? 0} completions · ${summary?.activeHabits ?? 0} active habits`}
        />

        {error ? (
          <PremiumResultCard
            eyebrow="SYSTEM"
            title="Something needs attention"
            accent="rose"
            detail={error}
            actions={[{ label: 'Retry', icon: 'refresh', onPress: () => void load() }]}
          />
        ) : null}

        <View style={styles.form}>
          <Text style={styles.section}>Start something small</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="A daily habit…"
              placeholderTextColor={PREMIUM.colors.muted}
              style={styles.input}
            />
            <MotionPress disabled={busy === 'add'} onPress={() => void add()} style={styles.add}>
              <Ionicons name="add" size={18} color={PREMIUM.colors.ink} />
            </MotionPress>
          </View>
        </View>

        <Text style={styles.section}>Your rhythm</Text>
        {habits.map((h) => (
          <View key={h.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardCopy}>
                <View style={styles.nameRow}>
                  <View style={styles.dot} />
                  <Text style={styles.name}>{h.name}</Text>
                </View>
                <Text style={styles.meta}>{h.stats.streak} day streak · {h.stats.recentCompletions} recent completions</Text>
              </View>
              <MotionPress disabled={busy === h.id} onPress={() => void done(h.id)} style={styles.done}>
                <Ionicons name="checkmark" size={15} color={PREMIUM.colors.ink} />
                <Text style={styles.doneText}>{busy === h.id ? '…' : 'Done'}</Text>
              </MotionPress>
            </View>
            <MotionPress disabled={busy === `delete-${h.id}`} onPress={() => void remove(h.id)}>
              <Text style={styles.remove}>Remove habit</Text>
            </MotionPress>
          </View>
        ))}

        {!habits.length ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="repeat-outline" size={21} color={PREMIUM.colors.primaryBright} />
            </View>
            <Text style={styles.emptyTitle}>Nothing to repeat yet</Text>
            <Text style={styles.emptyText}>Start with one small action. MYPA will remember the rhythm.</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PREMIUM.colors.canvas },
  bg: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: PREMIUM.colors.canvas },
  loadingText: { color: PREMIUM.colors.ink, fontWeight: '900', marginTop: 12 },
  content: { padding: 18, gap: 14, paddingBottom: 120 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: PREMIUM.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.03)' },
  titleWrap: { flex: 1, alignItems: 'center' },
  kicker: { color: PREMIUM.colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: PREMIUM.colors.ink, fontSize: 18, fontWeight: '900', marginTop: 3 },
  section: { color: PREMIUM.colors.ink, fontSize: 13, fontWeight: '900' },
  form: { padding: 15, borderRadius: 24, borderWidth: 1, borderColor: PREMIUM.colors.border, backgroundColor: PREMIUM.colors.surfaceGlass },
  inputRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  input: { flex: 1, minHeight: 50, borderRadius: 17, borderWidth: 1, borderColor: PREMIUM.colors.border, color: PREMIUM.colors.ink, paddingHorizontal: 14, fontSize: 12 },
  add: { width: 50, height: 50, borderRadius: 17, backgroundColor: PREMIUM.colors.primaryBright, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 22, borderWidth: 1, borderColor: PREMIUM.colors.border, backgroundColor: PREMIUM.colors.surfaceGlass, padding: 16, gap: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardCopy: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: PREMIUM.colors.mint },
  name: { color: PREMIUM.colors.ink, fontSize: 14, fontWeight: '900' },
  meta: { color: PREMIUM.colors.muted, fontSize: 10, marginTop: 5 },
  done: { minHeight: 42, paddingHorizontal: 12, borderRadius: 21, backgroundColor: PREMIUM.colors.primaryBright, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  doneText: { color: PREMIUM.colors.ink, fontWeight: '900', fontSize: 11 },
  remove: { color: PREMIUM.colors.muted, fontSize: 10, fontWeight: '800' },
  empty: { alignItems: 'center', borderRadius: 0 },
  emptyIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(79,229,168,.12)', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: PREMIUM.colors.ink, fontSize: 18, fontWeight: '900', marginTop: 12 },
  emptyText: { color: PREMIUM.colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6, maxWidth: 290 },
});
