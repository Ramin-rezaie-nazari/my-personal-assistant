import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DailyCommandCenterResponse, generateSmartNotifications, getDailyCommandCenter, hasAuthSession } from '../lib/api';
import { PREMIUM } from '../lib/premium-ui';
import { PremiumGlow } from '../components/PremiumGlow';
import { PremiumResultCard } from '../components/PremiumResultCard';
import { AnimatedIn, MotionPress } from '../lib/motion-components';

export default function DailyPremiumScreen() {
  const [data, setData] = useState<DailyCommandCenterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      await generateSmartNotifications();
      setData(await getDailyCommandCenter());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load today');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void hasAuthSession().then((ok) => {
      if (ok) void load();
      else setLoading(false);
    });
  }, [load]);

  if (loading) {
    return <View style={styles.loading}><PremiumGlow size={260} opacity={0.14}/><View style={styles.loadingCore}><Text style={styles.loadingMark}>M</Text></View><Text style={styles.loadingTitle}>Today</Text><ActivityIndicator color={PREMIUM.colors.primaryBright} style={styles.loadingSpinner}/></View>;
  }

  return <SafeAreaView style={styles.safe}>
    <View style={styles.background} pointerEvents="none"><PremiumGlow size={340} opacity={0.10} accent="primary"/><PremiumGlow size={220} opacity={0.07} accent="cyan"/></View>
    <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />} contentContainerStyle={styles.content}>
      <AnimatedIn>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/')} style={styles.iconButton}><Ionicons name="arrow-back" size={19} color={PREMIUM.colors.inkSoft}/></Pressable>
          <View style={styles.titleWrap}><Text style={styles.kicker}>PERSONAL RHYTHM</Text><Text style={styles.title}>Today</Text></View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/assistant')} style={styles.iconButton}><Ionicons name="sparkles" size={18} color={PREMIUM.colors.primaryBright}/></Pressable>
        </View>
      </AnimatedIn>

      <AnimatedIn delay={60}>
        <View style={styles.hero}><Text style={styles.heroGreeting}>{data?.greeting ?? 'Your day, at a glance.'}</Text><Text style={styles.heroDate}>{data?.dateKey ?? ''}</Text><View style={styles.heroOrb}><View style={styles.heroOrbCore}><Text style={styles.heroOrbText}>{Math.min(100, data?.priorities.length ? 76 : 48)}%</Text></View></View><Text style={styles.heroHint}>MYPA is keeping the day simple. Talk whenever you want to change it.</Text></View>
      </AnimatedIn>

      {error ? <AnimatedIn delay={100}><PremiumResultCard eyebrow="SYSTEM" title="Today is unavailable" detail={error} accent="rose" actions={[{ label: 'Try again', icon: 'refresh', onPress: () => void load() }]} /></AnimatedIn> : null}

      <AnimatedIn delay={130}>
        <PremiumResultCard eyebrow="FOCUS" title="Your priorities" accent="primary">
          <View style={styles.priorityList}>{data?.priorities.length ? data.priorities.slice(0, 4).map((item, index) => <View key={`${item}-${index}`} style={styles.priorityRow}><View style={styles.priorityIndex}><Text style={styles.priorityIndexText}>{index + 1}</Text></View><Text style={styles.priorityText}>{item}</Text></View>) : <Text style={styles.empty}>Nothing urgent right now. That is a good thing.</Text>}</View>
        </PremiumResultCard>
      </AnimatedIn>

      <AnimatedIn delay={180}>
        <View style={styles.sectionHeader}><Text style={styles.sectionKicker}>TODAY'S SIGNALS</Text><Text style={styles.sectionHint}>What matters most</Text></View>
        <View style={styles.grid}>
          <Signal icon="flame-outline" label="Calories" value={`${Math.round(data?.nutrition.calories ?? 0)}`} tone="amber"/>
          <Signal icon="fitness-outline" label="Protein" value={`${Math.round(data?.nutrition.protein ?? 0)}g`} tone="mint"/>
          <Signal icon="water-outline" label="Water" value={`${Math.round(data?.nutrition.waterMl ?? 0)}ml`} tone="cyan"/>
          <Signal icon="checkmark-circle-outline" label="Habits" value={`${data?.habits.completed ?? 0}/${data?.habits.total ?? 0}`} tone="primary"/>
        </View>
      </AnimatedIn>

      <AnimatedIn delay={250}>
        <PremiumResultCard eyebrow="NEXT" title={data?.calendar.next?.title ?? data?.reminders.next?.title ?? 'You are clear'} value={data?.calendar.next ? new Date(data.calendar.next.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : data?.reminders.next ? new Date(data.reminders.next.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} detail={data?.calendar.next ? 'Next calendar event' : data?.reminders.next ? 'Next reminder' : 'No immediate pressure'} accent="cyan" actions={[{ label: 'Open calendar', icon: 'calendar-outline', onPress: () => router.push('/calendar') }, { label: 'Open assistant', icon: 'sparkles-outline', onPress: () => router.push('/assistant') }]} />
      </AnimatedIn>

      <AnimatedIn delay={320}>
        <PremiumResultCard eyebrow="MOVEMENT" title={data?.workouts.latest?.name ?? 'Move a little today'} value={data?.workouts.latest ? `${data.workouts.latest.durationMinutes} min` : 'Ready when you are'} detail={data?.workouts.latest ? 'Latest logged training' : 'Your assistant can build the next step from your equipment and goals.'} accent="mint" actions={[{ label: 'Open training', icon: 'fitness-outline', onPress: () => router.push('/fitness') }, { label: 'Ask MYPA', icon: 'mic-outline', onPress: () => router.push('/assistant') }]} />
      </AnimatedIn>

      <AnimatedIn delay={380}>
        <View style={styles.quickRow}>
          <Quick title="Meals" icon="restaurant-outline" onPress={() => router.push('/meals')}/>
          <Quick title="Habits" icon="repeat-outline" onPress={() => router.push('/habits')}/>
          <Quick title="Reminders" icon="notifications-outline" onPress={() => router.push('/reminders')}/>
        </View>
      </AnimatedIn>

      <AnimatedIn delay={430}><MotionPress style={styles.talkButton} onPress={() => router.push('/assistant')}><Ionicons name="mic" size={18} color={PREMIUM.colors.ink}/><Text style={styles.talkText}>Talk to MYPA</Text><Ionicons name="arrow-forward" size={17} color={PREMIUM.colors.ink}/></MotionPress></AnimatedIn>
    </ScrollView>
  </SafeAreaView>;
}

function Signal({ icon, label, value, tone }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; tone: 'primary' | 'cyan' | 'mint' | 'amber' }) {
  return <View style={styles.signal}><View style={[styles.signalIcon, { backgroundColor: `${PREMIUM.colors[tone]}1A` }]}><Ionicons name={icon} size={18} color={PREMIUM.colors[tone]}/></View><Text style={styles.signalLabel}>{label}</Text><Text style={styles.signalValue}>{value}</Text></View>;
}
function Quick({ title, icon, onPress }: { title: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) { return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.quick, pressed && styles.pressed]}><Ionicons name={icon} size={17} color={PREMIUM.colors.inkSoft}/><Text style={styles.quickText}>{title}</Text></Pressable>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PREMIUM.colors.canvas },
  background: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 120, gap: 16 },
  loading: { flex: 1, backgroundColor: PREMIUM.colors.canvas, alignItems: 'center', justifyContent: 'center' }, loadingCore: { width: 78, height: 78, borderRadius: 39, backgroundColor: PREMIUM.colors.surfaceElevated, borderWidth: 1, borderColor: PREMIUM.colors.primary, alignItems: 'center', justifyContent: 'center' }, loadingMark: { color: PREMIUM.colors.primaryBright, fontSize: 28, fontWeight: '900' }, loadingTitle: { color: PREMIUM.colors.ink, fontSize: 18, fontWeight: '900', marginTop: 16 }, loadingSpinner: { marginTop: 12 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10 }, iconButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: PREMIUM.colors.border, backgroundColor: 'rgba(255,255,255,0.035)', alignItems: 'center', justifyContent: 'center' }, titleWrap: { flex: 1, alignItems: 'center' }, kicker: { color: PREMIUM.colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 }, title: { color: PREMIUM.colors.ink, fontSize: 18, fontWeight: '900', marginTop: 3 },
  hero: { borderRadius: 30, padding: 22, backgroundColor: 'rgba(17,24,40,0.88)', borderWidth: 1, borderColor: PREMIUM.colors.border, overflow: 'hidden' }, heroGreeting: { color: PREMIUM.colors.ink, fontSize: 27, lineHeight: 33, fontWeight: '900', maxWidth: '78%' }, heroDate: { color: PREMIUM.colors.muted, fontSize: 11, marginTop: 7 }, heroOrb: { position: 'absolute', right: -28, top: -22, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(139,124,255,0.12)', alignItems: 'center', justifyContent: 'center' }, heroOrbCore: { width: 90, height: 90, borderRadius: 45, backgroundColor: PREMIUM.colors.surfaceElevated, borderWidth: 1, borderColor: 'rgba(184,172,255,0.42)', alignItems: 'center', justifyContent: 'center' }, heroOrbText: { color: PREMIUM.colors.primaryBright, fontSize: 21, fontWeight: '900' }, heroHint: { color: PREMIUM.colors.inkSoft, fontSize: 11, lineHeight: 17, maxWidth: '74%', marginTop: 18 },
  priorityList: { marginTop: 14, gap: 10 }, priorityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, priorityIndex: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(139,124,255,0.12)', borderWidth: 1, borderColor: 'rgba(139,124,255,0.24)', alignItems: 'center', justifyContent: 'center' }, priorityIndexText: { color: PREMIUM.colors.primaryBright, fontSize: 11, fontWeight: '900' }, priorityText: { flex: 1, color: PREMIUM.colors.inkSoft, fontSize: 13, lineHeight: 19, fontWeight: '700' }, empty: { color: PREMIUM.colors.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  sectionHeader: { paddingHorizontal: 3 }, sectionKicker: { color: PREMIUM.colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.4 }, sectionHint: { color: PREMIUM.colors.inkSoft, fontSize: 12, fontWeight: '700', marginTop: 3 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, signal: { width: '48.5%', borderRadius: 22, backgroundColor: PREMIUM.colors.surfaceGlass, borderWidth: 1, borderColor: PREMIUM.colors.border, padding: 14, minHeight: 114 }, signalIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, signalLabel: { color: PREMIUM.colors.muted, fontSize: 10, fontWeight: '800', marginTop: 12 }, signalValue: { color: PREMIUM.colors.ink, fontSize: 20, fontWeight: '900', marginTop: 4 },
  quickRow: { flexDirection: 'row', gap: 8 }, quick: { flex: 1, minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: PREMIUM.colors.border, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', gap: 5 }, quickText: { color: PREMIUM.colors.inkSoft, fontSize: 10, fontWeight: '800' }, talkButton: { minHeight: 54, borderRadius: 27, backgroundColor: PREMIUM.colors.primaryBright, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, talkText: { flex: 1, textAlign: 'center', color: PREMIUM.colors.ink, fontWeight: '900', fontSize: 13 }, pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
});
