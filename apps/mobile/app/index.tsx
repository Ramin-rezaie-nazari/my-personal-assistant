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
  DashboardResponse,
  getMe,
  getTodayDashboard,
  hasAuthSession,
  login,
  logout,
  register,
} from '../lib/api';

function ProgressCard({ label, value, goal, unit }: { label: string; value: number; goal: number; unit: string }) {
  const progress = goal > 0 ? Math.min(value / goal, 1) : 0;
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>
        {value.toLocaleString()} <Text style={styles.unit}>{unit}</Text>
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.muted}>{goal.toLocaleString()} {unit} goal</Text>
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
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    if (mode === 'register' && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    try {
      setBusy(true);
      setError(null);
      const auth = mode === 'login'
        ? await login(email.trim(), password)
        : await register({
            email: email.trim(),
            password,
            firstName: firstName.trim() || undefined,
            lastName: lastName.trim() || undefined,
          });
      onAuthenticated(auth.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to authenticate.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.authContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>MY PERSONAL ASSISTANT</Text>
          <Text style={styles.authTitle}>{mode === 'login' ? 'Welcome back 👋' : 'Let’s get started ✨'}</Text>
          <Text style={styles.authSubtitle}>
            {mode === 'login' ? 'Sign in to continue your day.' : 'Create your personal assistant account.'}
          </Text>

          <View style={styles.authCard}>
            {mode === 'register' && (
              <View style={styles.row}>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  placeholderTextColor="#9CA3AF"
                  style={[styles.input, styles.halfInput]}
                  autoCapitalize="words"
                />
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  placeholderTextColor="#9CA3AF"
                  style={[styles.input, styles.halfInput]}
                  autoCapitalize="words"
                />
              </View>
            )}

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              secureTextEntry
              textContentType={mode === 'login' ? 'password' : 'newPassword'}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={() => void submit()} disabled={busy}>
              {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>}
            </Pressable>

            <Pressable
              style={styles.switchButton}
              onPress={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
              }}
            >
              <Text style={styles.switchText}>
                {mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function HomeScreen() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setDashboardError(null);
      setData(await getTodayDashboard());
    } catch (err) {
      setDashboardError(err instanceof Error ? err.message : 'Unable to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        if (!(await hasAuthSession())) {
          if (mounted) setLoading(false);
          return;
        }

        const currentUser = await getMe();
        if (!mounted) return;
        setUser(currentUser);
        await loadDashboard();
      } catch (err) {
        await logout();
        if (mounted) {
          setAuthError(err instanceof Error ? 'Your session expired. Please sign in again.' : 'Please sign in again.');
          setLoading(false);
        }
      }
    };

    void bootstrap();
    return () => {
      mounted = false;
    };
  }, [loadDashboard]);

  const handleAuthenticated = useCallback(async (authenticatedUser: AuthUser) => {
    setAuthError(null);
    setUser(authenticatedUser);
    setLoading(true);
    await loadDashboard();
  }, [loadDashboard]);

  const handleLogout = useCallback(async () => {
    await logout();
    setUser(null);
    setData(null);
    setDashboardError(null);
  }, []);

  if (loading && !user) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  if (!user) {
    return <AuthScreen onAuthenticated={handleAuthenticated} initialError={authError} />;
  }

  const nutrition = data?.nutrition;
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadDashboard(); }} />}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>MY PERSONAL ASSISTANT</Text>
            <Text style={styles.title}>Good day{user.firstName ? `, ${user.firstName}` : ''} 👋</Text>
            <Text style={styles.subtitle}>{data?.dateKey ?? 'Today'}</Text>
          </View>
          <Pressable onPress={() => void handleLogout()} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>

        {dashboardError ? (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Dashboard unavailable</Text>
            <Text style={styles.warningText}>{dashboardError}</Text>
            <Pressable onPress={() => void loadDashboard()} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F7F8FA' },
  authContainer: { flex: 1 },
  authContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  authTitle: { fontSize: 34, fontWeight: '800', color: '#111827', marginTop: 8 },
  authSubtitle: { color: '#6B7280', fontSize: 15, marginTop: 6, marginBottom: 22 },
  authCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, gap: 12 },
  input: { minHeight: 52, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 15, color: '#111827', backgroundColor: '#FFFFFF' },
  row: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  primaryButton: { minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', marginTop: 4 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  pressed: { opacity: 0.75 },
  switchButton: { alignItems: 'center', paddingVertical: 8 },
  switchText: { color: '#374151', fontWeight: '600', fontSize: 13 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerCopy: { flex: 1, paddingRight: 12 },
  logoutButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#E5E7EB' },
  logoutText: { color: '#374151', fontWeight: '700', fontSize: 12 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: '#6B7280' },
  title: { fontSize: 30, fontWeight: '800', color: '#111827', marginTop: 4 },
  subtitle: { color: '#6B7280', marginTop: 2 },
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
  error: { color: '#B91C1C', textAlign: 'center', fontSize: 13 },
  warningCard: { backgroundColor: '#FEF2F2', borderRadius: 18, padding: 16 },
  warningTitle: { color: '#991B1B', fontWeight: '800' },
  warningText: { color: '#7F1D1D', marginTop: 5, fontSize: 12 },
  retryButton: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#111827' },
  retryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
});
