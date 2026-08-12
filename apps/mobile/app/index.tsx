import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AuthUser,
  DashboardOverviewResponse,
  addWater,
  createWorkout,
  getDashboardOverview,
  getMe,
  hasAuthSession,
  login,
  logout,
  register,
} from '../lib/api';

function ProgressBar({ progress }: { progress: number }) {
  return <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(0, Math.min(progress, 100))}%` }]} /></View>;
}

function StatCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return <View style={styles.statCard}><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text>{helper ? <Text style={styles.statHelper}>{helper}</Text> : null}</View>;
}

function NutritionCard({ label, value, goal, remaining, progress, unit }: { label: string; value: number; goal: number; remaining: number; progress: number; unit: string }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}><Text style={styles.cardLabel}>{label}</Text><Text style={styles.cardPercent}>{progress}%</Text></View>
      <Text style={styles.cardValue}>{value.toLocaleString()} <Text style={styles.unit}>{unit}</Text></Text>
      <ProgressBar progress={progress} />
      <Text style={styles.muted}>{goal.toLocaleString()} {unit} goal · {remaining.toLocaleString()} {unit} left</Text>
    </View>
  );
}

function AuthScreen({ onAuthenticated, initialError }: { onAuthenticated: (user: AuthUser) => void; initialError: string | null }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);

  const submit = async () => {
    if (!email.trim() || !password) { setError('Email and password are required.'); return; }
    if (mode === 'register' && password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    try {
      setBusy(true);
      setError(null);
      const auth = mode === 'login'
        ? await login(email.trim(), password)
        : await register({ email: email.trim(), password, firstName: firstName.trim() || undefined, lastName: lastName.trim() || undefined });
      onAuthenticated(auth.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to authenticate.');
    } finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.authContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>MY PERSONAL ASSISTANT</Text>
          <Text style={styles.authTitle}>{mode === 'login' ? 'Welcome back 👋' : 'Let’s get started ✨'}</Text>
          <Text style={styles.authSubtitle}>{mode === 'login' ? 'Sign in to continue your day.' : 'Create your personal assistant account.'}</Text>
          <View style={styles.authCard}>
            {mode === 'register' ? <View style={styles.row}><TextInput value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor="#9CA3AF" style={[styles.input, styles.halfInput]} autoCapitalize="words" /><TextInput value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor="#9CA3AF" style={[styles.input, styles.halfInput]} autoCapitalize="words" /></View> : null}
            <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#9CA3AF" style={styles.input} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
            <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor="#9CA3AF" style={styles.input} secureTextEntry />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={() => void submit()} disabled={busy}>{busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>}</Pressable>
            <Pressable style={styles.switchButton} onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}><Text style={styles.switchText}>{mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Sign in'}</Text></Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function HomeScreen() {
  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try { setDashboardError(null); setData(await getDashboardOverview()); }
    catch (err) { setDashboardError(err instanceof Error ? err.message : 'Unable to load dashboard'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      try {
        if (!(await hasAuthSession())) { if (mounted) setLoading(false); return; }
        const currentUser = await getMe();
        if (!mounted) return;
        setUser(currentUser);
        await loadDashboard();
      } catch (err) {
        await logout();
        if (mounted) { setAuthError(err instanceof Error ? 'Your session expired. Please sign in again.' : 'Please sign in again.'); setLoading(false); }
      }
    };
    void bootstrap();
    return () => { mounted = false; };
  }, [loadDashboard]);

  const handleAuthenticated = useCallback(async (authenticatedUser: AuthUser) => {
    setAuthError(null); setUser(authenticatedUser); setLoading(true); await loadDashboard();
  }, [loadDashboard]);

  const handleLogout = useCallback(async () => {
    await logout(); setUser(null); setData(null); setDashboardError(null);
  }, []);

  const runAction = useCallback(async (key: string, action: () => Promise<unknown>) => {
    try { setActionBusy(key); await action(); await loadDashboard(); }
    catch (err) { setDashboardError(err instanceof Error ? err.message : 'Action failed'); }
    finally { setActionBusy(null); }
  }, [loadDashboard]);

  if (loading && !user) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (!user) return <AuthScreen onAuthenticated={handleAuthenticated} initialError={authError} />;

  const today = data?.today;
  const weekly = data?.weekly;
  const workouts = data?.workouts;
  const primaryGoal = today?.profile?.primaryGoal;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadDashboard(); }} />}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}><Text style={styles.eyebrow}>MY PERSONAL ASSISTANT</Text><Text style={styles.title}>Good day{user.firstName ? `, ${user.firstName}` : ''} 👋</Text><Text style={styles.subtitle}>{today?.dateKey ?? 'Today'} · your personal command center</Text></View>
          <Pressable onPress={() => void handleLogout()} style={styles.logoutButton}><Text style={styles.logoutText}>Log out</Text></Pressable>
        </View>

        {dashboardError ? <View style={styles.warningCard}><Text style={styles.warningTitle}>Dashboard notice</Text><Text style={styles.warningText}>{dashboardError}</Text><Pressable onPress={() => void loadDashboard()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable></View> : null}

        <View style={styles.hero}><Text style={styles.heroEyebrow}>TODAY</Text><Text style={styles.heroTitle}>{today?.nutrition.caloriesRemaining.toLocaleString() ?? 0} kcal</Text><Text style={styles.heroMuted}>remaining within your daily target</Text>{primaryGoal ? <Text style={styles.goalText}>🎯 {primaryGoal}</Text> : <Text style={styles.goalText}>🎯 Set a primary goal to make your assistant more personal</Text>}</View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Quick actions</Text>
          <Text style={styles.muted}>Log the small things now; your dashboard and Brain update immediately.</Text>
          <View style={styles.actionGrid}>
            {[250, 500, 750].map((amount) => <Pressable key={amount} disabled={!!actionBusy} onPress={() => void runAction(`water-${amount}`, () => addWater(amount, today?.dateKey))} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}><Text style={styles.actionEmoji}>💧</Text><Text style={styles.actionText}>{actionBusy === `water-${amount}` ? '…' : `+${amount} ml`}</Text></Pressable>)}
          </View>
          <View style={styles.actionGrid}>
            {[
              { key: 'walk', label: '20 min walk', duration: 20, calories: 100, type: 'cardio' },
              { key: 'cardio', label: '30 min cardio', duration: 30, calories: 220, type: 'cardio' },
              { key: 'strength', label: '45 min strength', duration: 45, calories: 300, type: 'strength' },
            ].map((preset) => <Pressable key={preset.key} disabled={!!actionBusy} onPress={() => void runAction(`workout-${preset.key}`, () => createWorkout({ name: preset.label, type: preset.type, durationMinutes: preset.duration, caloriesBurned: preset.calories }))} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}><Text style={styles.actionEmoji}>🏋️</Text><Text style={styles.actionText}>{actionBusy === `workout-${preset.key}` ? '…' : preset.label}</Text></Pressable>)}
          </View>
        </View>

        <View style={styles.grid}>
          <StatCard label="7-day consistency" value={`${weekly?.consistencyPercent ?? 0}%`} helper={`${weekly?.loggedDays ?? 0}/7 days logged`} />
          <StatCard label="Current streak" value={`${weekly?.currentStreak ?? 0} days`} helper="daily logging" />
          <StatCard label="Workouts" value={`${workouts?.count ?? 0}`} helper={`${workouts?.totalMinutes ?? 0} min this week`} />
          <StatCard label="Workout calories" value={`${(workouts?.totalCaloriesBurned ?? 0).toLocaleString()}`} helper="burned this week" />
        </View>

        <View style={styles.sectionTitleRow}><Text style={styles.sectionTitle}>Today’s progress</Text><Text style={styles.sectionHint}>live</Text></View>
        <NutritionCard label="Calories" value={today?.nutrition.calories ?? 0} goal={today?.nutrition.calorieGoal ?? 0} remaining={today?.nutrition.caloriesRemaining ?? 0} progress={today?.nutrition.caloriesProgress ?? 0} unit="kcal" />
        <NutritionCard label="Protein" value={today?.nutrition.protein ?? 0} goal={today?.nutrition.proteinGoal ?? 0} remaining={today?.nutrition.proteinRemaining ?? 0} progress={today?.nutrition.proteinProgress ?? 0} unit="g" />
        <NutritionCard label="Water" value={today?.nutrition.waterMl ?? 0} goal={today?.nutrition.waterGoalMl ?? 0} remaining={today?.nutrition.waterRemainingMl ?? 0} progress={today?.nutrition.waterProgress ?? 0} unit="ml" />

        <View style={styles.sectionTitleRow}><Text style={styles.sectionTitle}>This week</Text><Text style={styles.sectionHint}>{data?.range.startKey} → {data?.range.endKey}</Text></View>
        <View style={styles.card}><View style={styles.inlineStats}><View><Text style={styles.cardLabel}>Avg calories</Text><Text style={styles.inlineValue}>{weekly?.averageCalories.toLocaleString() ?? 0}</Text></View><View><Text style={styles.cardLabel}>Avg protein</Text><Text style={styles.inlineValue}>{weekly?.averageProtein ?? 0} g</Text></View></View><View style={styles.divider} /><Text style={styles.muted}>{(weekly?.totalWaterMl ?? 0).toLocaleString()} ml water logged · {(weekly?.totalProtein ?? 0).toLocaleString()} g protein · {(weekly?.totalCalories ?? 0).toLocaleString()} kcal total</Text></View>

        <View style={styles.sectionTitleRow}><Text style={styles.sectionTitle}>Training</Text><Text style={styles.sectionHint}>last 7 days</Text></View>
        <View style={styles.card}>{workouts?.latest ? <><Text style={styles.cardLabel}>Latest workout</Text><Text style={styles.workoutName}>{workouts.latest.name}</Text><Text style={styles.muted}>{workouts.latest.type} · {workouts.latest.durationMinutes} min · {workouts.latest.caloriesBurned} kcal</Text></> : <><Text style={styles.cardLabel}>Ready when you are</Text><Text style={styles.workoutName}>No workout logged this week yet</Text><Text style={styles.muted}>Start tracking your training and your assistant will build the history automatically.</Text></>}<View style={styles.trainingRow}><Text style={styles.trainingMetric}>{workouts?.activeDays ?? 0} active days</Text><Text style={styles.trainingMetric}>{workouts?.totalMinutes ?? 0} min</Text><Text style={styles.trainingMetric}>{workouts?.totalCaloriesBurned ?? 0} kcal</Text></View></View>

        <View style={styles.sectionTitleRow}><Text style={styles.sectionTitle}>Recent meals</Text><Text style={styles.sectionHint}>{today?.mealCount ?? 0} today</Text></View>
        <View style={styles.card}>{today?.meals.length ? today.meals.map((meal) => <View key={meal.id} style={styles.mealRow}><View style={styles.mealCopy}><Text style={styles.mealName}>{meal.name}</Text><Text style={styles.muted}>{meal.type} · {Math.round(meal.protein)} g protein</Text></View><Text style={styles.mealCalories}>{meal.calories} kcal</Text></View>) : <Text style={styles.muted}>No meals logged today yet.</Text>}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  content: { padding: 20, gap: 14, paddingBottom: 34 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F7F8FA' },
  authContainer: { flex: 1 }, authContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  authTitle: { fontSize: 34, fontWeight: '800', color: '#111827', marginTop: 8 }, authSubtitle: { color: '#6B7280', fontSize: 15, marginTop: 6, marginBottom: 22 },
  authCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, gap: 12 }, input: { minHeight: 52, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 15, color: '#111827', backgroundColor: '#FFFFFF' }, row: { flexDirection: 'row', gap: 10 }, halfInput: { flex: 1 },
  primaryButton: { minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', marginTop: 4 }, primaryButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 }, pressed: { opacity: 0.75 }, switchButton: { alignItems: 'center', paddingVertical: 8 }, switchText: { color: '#374151', fontWeight: '600', fontSize: 13 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, headerCopy: { flex: 1, paddingRight: 12 }, logoutButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#E5E7EB' }, logoutText: { color: '#374151', fontWeight: '700', fontSize: 12 }, eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: '#6B7280' }, title: { fontSize: 30, fontWeight: '800', color: '#111827', marginTop: 4 }, subtitle: { color: '#6B7280', marginTop: 2, fontSize: 12 },
  hero: { backgroundColor: '#111827', borderRadius: 26, padding: 22, marginVertical: 4 }, heroEyebrow: { color: '#9CA3AF', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }, heroTitle: { color: '#FFFFFF', fontSize: 38, fontWeight: '800', marginTop: 7 }, heroMuted: { color: '#D1D5DB', marginTop: 2 }, goalText: { color: '#FFFFFF', fontWeight: '600', marginTop: 18, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, statCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16 }, statLabel: { color: '#6B7280', fontSize: 11, fontWeight: '700' }, statValue: { color: '#111827', fontSize: 23, fontWeight: '800', marginTop: 6 }, statHelper: { color: '#6B7280', fontSize: 11, marginTop: 4 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18 }, cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, cardLabel: { color: '#6B7280', fontSize: 13, fontWeight: '700' }, cardPercent: { color: '#111827', fontSize: 12, fontWeight: '800' }, cardValue: { color: '#111827', fontSize: 27, fontWeight: '800', marginTop: 4 }, unit: { fontSize: 13, color: '#6B7280' },
  track: { height: 8, borderRadius: 8, backgroundColor: '#E5E7EB', overflow: 'hidden', marginTop: 12 }, fill: { height: '100%', borderRadius: 8, backgroundColor: '#111827' }, muted: { color: '#6B7280', fontSize: 12, marginTop: 7, lineHeight: 18 },
  actionGrid: { flexDirection: 'row', gap: 8, marginTop: 12 }, actionButton: { flex: 1, minHeight: 58, backgroundColor: '#F3F4F6', borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }, actionEmoji: { fontSize: 19 }, actionText: { color: '#111827', fontSize: 11, fontWeight: '800', textAlign: 'center', marginTop: 4 },
  inlineStats: { flexDirection: 'row', justifyContent: 'space-between' }, inlineValue: { color: '#111827', fontSize: 23, fontWeight: '800', marginTop: 4 }, divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB', marginVertical: 15 },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }, sectionTitle: { color: '#111827', fontSize: 17, fontWeight: '800' }, sectionHint: { color: '#9CA3AF', fontSize: 10, fontWeight: '700' }, workoutName: { color: '#111827', fontSize: 22, fontWeight: '800', marginTop: 5 }, trainingRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 17, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB' }, trainingMetric: { color: '#111827', fontSize: 12, fontWeight: '800' },
  mealRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' }, mealCopy: { flex: 1, paddingRight: 12 }, mealName: { color: '#111827', fontWeight: '700' }, mealCalories: { color: '#111827', fontWeight: '800' }, error: { color: '#B91C1C', textAlign: 'center', fontSize: 13 },
  warningCard: { backgroundColor: '#FEF2F2', borderRadius: 18, padding: 16 }, warningTitle: { color: '#991B1B', fontWeight: '800' }, warningText: { color: '#7F1D1D', marginTop: 5, fontSize: 12 }, retryButton: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#111827' }, retryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
});
