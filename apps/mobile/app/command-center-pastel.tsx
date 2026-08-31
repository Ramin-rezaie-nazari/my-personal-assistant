import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { DailyCommandCenterResponse, getDailyCommandCenter, getNutritionSummary, hasAuthSession, NutritionSummary } from '../lib/api';
import { AppLocale, getStoredLocale, isRTL } from '../lib/i18n';
import { runQuickCommand } from '../lib/command-actions';
import { AssistantVoiceOrb } from '../components/AssistantVoiceOrb';

const P = {
  canvas: '#FFFDFE',
  white: '#FFFFFF',
  ink: '#5B5560',
  muted: '#9B949F',
  line: '#F2E9EE',
  pink: '#EFAFC5',
  pinkSoft: '#FCECF3',
  lilac: '#C6B9E6',
  lilacSoft: '#F1ECFA',
  blue: '#AED8E7',
  blueSoft: '#EEF8FC',
  mint: '#B9DDD2',
  mintSoft: '#EEF8F4',
  peach: '#F3C8B4',
  peachSoft: '#FFF1EB',
  gold: '#E6CC92',
  goldSoft: '#FBF6E8',
};

type Copy = {
  hello: string; subHello: string; aiEyebrow: string; aiTitle: string; aiBody: string; talk: string;
  today: string; todayHint: string; calories: string; protein: string; water: string;
  quick: string; waterQuick: string; walkQuick: string; trainQuick: string; reminderQuick: string;
  focus: string; focusHint: string; empty: string; ask: string;
};

const COPY: Record<'en' | 'fa', Copy> = {
  en: {
    hello: 'Good evening.', subHello: 'Let’s make today feel a little lighter.', aiEyebrow: 'YOUR PERSONAL AI',
    aiTitle: 'I’m here. What do you need?', aiBody: 'Plan your day, log food, remember something, or just talk.', talk: 'Talk to MYPA',
    today: 'Today, gently on track', todayHint: 'Little steps count.', calories: 'Calories', protein: 'Protein', water: 'Water',
    quick: 'Tiny wins', waterQuick: 'Log water', walkQuick: 'Take a walk', trainQuick: 'Start training', reminderQuick: 'Set a reminder',
    focus: 'On your radar', focusHint: 'What deserves your attention next', empty: 'Nothing urgent right now. You have some breathing room. ♡', ask: 'Ask MYPA',
  },
  fa: {
    hello: 'عصر بخیر.', subHello: 'بیا امروز رو یکم سبک‌تر و قشنگ‌تر جلو ببریم.', aiEyebrow: 'دستیار شخصی تو',
    aiTitle: 'من هستم؛ چی لازم داری؟', aiBody: 'برنامه‌ریزی، غذا، یادآوری یا فقط چند دقیقه گپ.', talk: 'با MYPA حرف بزن',
    today: 'امروز، آروم ولی رو مسیر', todayHint: 'قدم‌های کوچیک هم مهمن.', calories: 'کالری', protein: 'پروتئین', water: 'آب',
    quick: 'بردهای کوچیک', waterQuick: 'ثبت آب', walkQuick: 'یکم قدم بزن', trainQuick: 'شروع تمرین', reminderQuick: 'یادآوری بساز',
    focus: 'روی رادارت', focusHint: 'چیزی که بهتره بعدی حواست بهش باشه', empty: 'فعلاً کار فوری نداری؛ یه نفس راحت بکش. ♡', ask: 'از MYPA بپرس',
  },
};

function Petal({ size = 18, tone = P.pink }: { size?: number; tone?: string }) {
  return <View pointerEvents="none" style={{ width: size, height: size }}>
    {[0, 45, 90, 135].map(a => <View key={a} style={{ position: 'absolute', left: size * .4, top: 0, width: size * .2, height: size * .52, borderRadius: size, backgroundColor: tone, opacity: .72, transform: [{ rotate: `${a}deg` }] }} />)}
    <View style={{ position: 'absolute', left: size * .36, top: size * .36, width: size * .28, height: size * .28, borderRadius: size, backgroundColor: P.gold }} />
  </View>;
}

function Stat({ icon, value, label, tone }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string; tone: string }) {
  return <View style={styles.stat}>
    <View style={[styles.statIcon, { backgroundColor: tone }]}><Ionicons name={icon} size={16} color={P.ink} /></View>
    <Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text>
  </View>;
}

function Progress({ label, value, percent, color }: { label: string; value: string; percent: number; color: string }) {
  return <View style={styles.progress}>
    <View style={styles.progressHeader}><Text style={styles.progressLabel}>{label}</Text><Text style={styles.progressValue}>{value}</Text></View>
    <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(4, Math.min(100, percent))}%`, backgroundColor: color }]} /></View>
  </View>;
}

function Quick({ icon, label, tone, onPress, busy }: { icon: keyof typeof Ionicons.glyphMap; label: string; tone: string; onPress: () => void; busy: boolean }) {
  return <Pressable onPress={onPress} disabled={busy} style={({ pressed }) => [styles.quick, { backgroundColor: tone }, pressed && styles.pressed]}>
    <View style={styles.quickIcon}>{busy ? <ActivityIndicator size="small" color={P.ink} /> : <Ionicons name={icon} size={18} color={P.ink} />}</View>
    <Text style={styles.quickText}>{label}</Text><Ionicons name="arrow-up" size={13} color={P.ink} style={{ transform: [{ rotate: '45deg' }] }} />
  </Pressable>;
}

export default function CommandCenterPastelScreen() {
  const { width } = useWindowDimensions(); const pad = width < 370 ? 18 : 22;
  const [locale, setLocale] = useState<AppLocale>('en'); const [data, setData] = useState<DailyCommandCenterResponse | null>(null);
  const [nutrition, setNutrition] = useState<NutritionSummary | null>(null); const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); const [busy, setBusy] = useState<string | null>(null); const [note, setNote] = useState<string | null>(null);
  const reveal = useRef(new Animated.Value(0)).current; const rtl = isRTL(locale); const t = locale === 'fa' || locale.startsWith('fa-') ? COPY.fa : COPY.en;

  const load = useCallback(async () => {
    try { const [daily, summary] = await Promise.all([getDailyCommandCenter(), getNutritionSummary()]); setData(daily); setNutrition(summary); }
    catch { /* Keep the existing view when the API is unavailable. */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    let mounted = true;
    void Promise.all([getStoredLocale(), hasAuthSession()]).then(async ([stored, auth]) => {
      if (!mounted) return; if (stored) setLocale(stored); if (!auth) { router.replace('/auth'); return; }
      await load(); Animated.timing(reveal, { toValue: 1, duration: 650, useNativeDriver: true }).start();
    });
    return () => { mounted = false; };
  }, [load, reveal]);

  const action = useCallback(async (key: 'water' | 'walk' | 'strength' | 'reminder') => {
    try { setBusy(key); setNote(null); const result = await runQuickCommand(key); setNote(result.message); await load(); }
    finally { setBusy(null); }
  }, [load]);

  if (loading) return <View style={styles.loading}><Petal size={72} /><Text style={styles.loadingBrand}>MYPA</Text><Text style={styles.loadingCaption}>YOUR LITTLE LIFE STUDIO</Text><ActivityIndicator color={P.pink} style={{ marginTop: 20 }} /></View>;

  const calories = Math.round(nutrition?.meals.calories ?? data?.nutrition.calories ?? 0);
  const protein = Math.round(nutrition?.meals.protein ?? data?.nutrition.protein ?? 0);
  const water = Math.round(data?.nutrition.waterMl ?? 0); const calorieGoal = nutrition?.goals.calories ?? 0; const proteinGoal = nutrition?.goals.protein ?? 0;
  const caloriePercent = calorieGoal ? Math.round(calories / calorieGoal * 100) : 0; const proteinPercent = proteinGoal ? Math.round(protein / proteinGoal * 100) : 0;
  const waterPercent = Math.round(water / 2000 * 100); const priorities = data?.priorities?.length ? data.priorities.slice(0, 3) : [t.empty];

  return <SafeAreaView style={styles.safe}>
    <View pointerEvents="none" style={styles.background}><View style={styles.glowPink} /><View style={styles.glowLilac} /><View style={styles.glowBlue} /><View style={styles.floatA}><Petal size={72} /></View><View style={styles.floatB}><Petal size={44} tone={P.lilac} /></View></View>
    <Animated.ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl tintColor={P.pink} refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />} contentContainerStyle={[styles.content, { paddingHorizontal: pad }]} style={{ opacity: reveal, transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }}>
      <View style={[styles.header, rtl && styles.reverse]}>
        <View style={[styles.headerCopy, rtl && styles.alignRight]}><Text style={[styles.eyebrow, rtl && styles.rtl]}>MYPA · PERSONAL LIFE STUDIO</Text><Text style={[styles.hello, rtl && styles.rtl]}>{t.hello}</Text><Text style={[styles.sub, rtl && styles.rtl]}>{t.subHello}</Text></View>
        <Pressable onPress={() => router.push('/settings')} style={({ pressed }) => [styles.settings, pressed && styles.pressed]}><Ionicons name="options-outline" size={19} color={P.ink} /></Pressable>
      </View>

      <View style={[styles.aiCard, rtl && styles.reverse]}>
        <View style={styles.aiBlobPink} /><View style={styles.aiBlobLilac} />
        <View style={[styles.aiCopy, rtl && styles.alignRight]}>
          <View style={[styles.live, rtl && styles.reverse]}><View style={styles.liveDot} /><Text style={styles.liveText}>READY FOR YOU</Text></View>
          <Text style={[styles.aiEyebrow, rtl && styles.rtl]}>{t.aiEyebrow}</Text><Text style={[styles.aiTitle, rtl && styles.rtl]}>{t.aiTitle}</Text><Text style={[styles.aiBody, rtl && styles.rtl]}>{t.aiBody}</Text>
          <Pressable onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.talk, pressed && styles.pressed]}><View style={styles.talkIcon}><Ionicons name="mic" size={16} color={P.ink} /></View><Text style={styles.talkText}>{t.talk}</Text><Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={16} color={P.ink} /></Pressable>
        </View>
        <View style={styles.orb}><View style={styles.orbHaloOne} /><View style={styles.orbHaloTwo} /><Petal size={18} tone={P.gold} /><View style={styles.orbPetalTwo}><Petal size={12} tone={P.pink} /></View><View style={styles.voiceOrb}><AssistantVoiceOrb state="idle" label="" /></View></View>
      </View>

      <View style={[styles.section, rtl && styles.reverse]}><View style={rtl && styles.alignRight}><Text style={[styles.sectionTitle, rtl && styles.rtl]}>{t.today}</Text><Text style={[styles.sectionHint, rtl && styles.rtl]}>{t.todayHint}</Text></View><Petal size={22} /></View>
      <View style={styles.statsCard}><Stat icon="flame-outline" value={`${calories}`} label={t.calories} tone={P.pinkSoft} /><View style={styles.divider} /><Stat icon="barbell-outline" value={`${protein}g`} label={t.protein} tone={P.lilacSoft} /><View style={styles.divider} /><Stat icon="water-outline" value={`${water}ml`} label={t.water} tone={P.mintSoft} /></View>
      <View style={styles.progressGrid}><Progress label={t.calories} value={calorieGoal ? `${caloriePercent}%` : '—'} percent={caloriePercent} color={P.pink} /><Progress label={t.protein} value={proteinGoal ? `${proteinPercent}%` : '—'} percent={proteinPercent} color={P.lilac} /><Progress label={t.water} value={`${waterPercent}%`} percent={waterPercent} color={P.mint} /></View>

      <View style={[styles.section, rtl && styles.reverse, { marginTop: 24 }]}><View><Text style={[styles.sectionTitle, rtl && styles.rtl]}>{t.quick}</Text></View><View style={styles.heart}><Ionicons name="heart" size={11} color={P.ink} /></View></View>
      <View style={styles.quickGrid}><Quick icon="water-outline" label={t.waterQuick} tone={P.pinkSoft} onPress={() => void action('water')} busy={busy === 'water'} /><Quick icon="walk-outline" label={t.walkQuick} tone={P.mintSoft} onPress={() => void action('walk')} busy={busy === 'walk'} /><Quick icon="barbell-outline" label={t.trainQuick} tone={P.lilacSoft} onPress={() => void action('strength')} busy={busy === 'strength'} /><Quick icon="notifications-outline" label={t.reminderQuick} tone={P.peachSoft} onPress={() => void action('reminder')} busy={busy === 'reminder'} /></View>
      {note ? <View style={[styles.note, rtl && styles.reverse]}><Ionicons name="sparkles" size={14} color={P.ink} /><Text style={[styles.noteText, rtl && styles.rtl]}>{note}</Text></View> : null}

      <View style={[styles.section, rtl && styles.reverse, { marginTop: 28 }]}><View style={rtl && styles.alignRight}><Text style={[styles.sectionTitle, rtl && styles.rtl]}>{t.focus}</Text><Text style={[styles.sectionHint, rtl && styles.rtl]}>{t.focusHint}</Text></View><Petal size={20} tone={P.lilac} /></View>
      <View style={styles.focusStack}>{priorities.map((item, index) => <Pressable key={`${item}-${index}`} onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.focus, pressed && styles.pressed]}><View style={[styles.focusBubble, { backgroundColor: [P.pinkSoft, P.lilacSoft, P.peachSoft][index] ?? P.pinkSoft }]}><Text style={styles.focusNo}>0{index + 1}</Text></View><Text style={[styles.focusText, rtl && styles.rtl]}>{item}</Text><Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={15} color={P.muted} /></Pressable>)}</View>
      <Pressable onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.ask, pressed && styles.pressed]}><View style={styles.askIcon}><Ionicons name="sparkles" size={16} color={P.ink} /></View><Text style={[styles.askText, rtl && styles.rtl]}>{t.ask}</Text><Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={16} color={P.ink} /></Pressable>
      <Text style={styles.footer}>made for your everyday little wins ♡</Text>
    </Animated.ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: P.canvas }, background: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  glowPink: { position: 'absolute', width: 310, height: 310, borderRadius: 155, right: -150, top: -150, backgroundColor: P.pinkSoft, opacity: .8 },
  glowLilac: { position: 'absolute', width: 240, height: 240, borderRadius: 120, left: -150, top: '35%', backgroundColor: P.lilacSoft, opacity: .78 },
  glowBlue: { position: 'absolute', width: 280, height: 280, borderRadius: 140, right: -150, bottom: -150, backgroundColor: P.blueSoft, opacity: .9 },
  floatA: { position: 'absolute', right: 30, top: 115, opacity: .36 }, floatB: { position: 'absolute', left: 26, bottom: 190, opacity: .28 },
  content: { paddingTop: 14, paddingBottom: 46 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: P.canvas },
  loadingBrand: { marginTop: 16, fontSize: 28, letterSpacing: 6, fontWeight: '700', color: P.ink }, loadingCaption: { marginTop: 5, fontSize: 10, letterSpacing: 2.1, color: P.muted },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 18 }, headerCopy: { flex: 1 },
  eyebrow: { fontSize: 9, letterSpacing: 1.9, color: P.ink, opacity: .62, fontWeight: '700', marginBottom: 7 }, hello: { fontSize: 29, lineHeight: 34, color: P.ink, fontWeight: '700', letterSpacing: -.7 }, sub: { marginTop: 5, fontSize: 13, lineHeight: 19, color: P.muted },
  settings: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: P.white, borderWidth: 1, borderColor: P.line },
  aiCard: { minHeight: 270, borderRadius: 31, overflow: 'hidden', position: 'relative', flexDirection: 'row', backgroundColor: '#FBEAF1', borderWidth: 1, borderColor: '#F3DCE5', padding: 20, marginBottom: 2 },
  aiBlobPink: { position: 'absolute', width: 220, height: 220, borderRadius: 110, right: -90, top: -86, backgroundColor: '#FFF8FB', opacity: .88 }, aiBlobLilac: { position: 'absolute', width: 150, height: 150, borderRadius: 75, right: 15, bottom: -82, backgroundColor: '#F3EFFB', opacity: .9 },
  aiCopy: { flex: 1, paddingRight: 82, zIndex: 2 }, live: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 17, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,.72)', marginBottom: 12 }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: P.mint }, liveText: { fontSize: 8, letterSpacing: 1.2, color: P.ink, opacity: .7, fontWeight: '700' },
  aiEyebrow: { fontSize: 9, letterSpacing: 1.5, color: P.ink, opacity: .62, fontWeight: '700', marginBottom: 6 }, aiTitle: { fontSize: 27, lineHeight: 31, color: P.ink, fontWeight: '700', letterSpacing: -.5 }, aiBody: { fontSize: 12, lineHeight: 18, color: '#817982', marginTop: 8, maxWidth: 245 },
  talk: { height: 45, alignSelf: 'flex-start', paddingHorizontal: 13, borderRadius: 23, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#FFF8FB', borderWidth: 1, borderColor: '#F1D7E2', marginTop: 17 }, talkIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: P.pinkSoft }, talkText: { fontSize: 12, color: P.ink, fontWeight: '700' },
  orb: { position: 'absolute', width: 128, height: 138, right: 0, top: 67, alignItems: 'center', justifyContent: 'center' }, orbHaloOne: { position: 'absolute', width: 116, height: 116, borderRadius: 58, backgroundColor: 'rgba(255,255,255,.46)' }, orbHaloTwo: { position: 'absolute', width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,.66)' }, orbPetalTwo: { position: 'absolute', left: 9, bottom: 10 }, voiceOrb: { position: 'absolute', transform: [{ scale: .76 }] },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 25, marginBottom: 11 }, sectionTitle: { fontSize: 17, lineHeight: 22, color: P.ink, fontWeight: '700' }, sectionHint: { marginTop: 2, fontSize: 10, lineHeight: 15, color: P.muted },
  statsCard: { minHeight: 108, borderRadius: 25, paddingHorizontal: 11, backgroundColor: P.white, borderWidth: 1, borderColor: P.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' }, stat: { flex: 1, alignItems: 'center' }, statIcon: { width: 33, height: 33, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 7 }, statValue: { fontSize: 17, fontWeight: '700', color: P.ink }, statLabel: { fontSize: 9, color: P.muted, marginTop: 2 }, divider: { width: 1, height: 44, backgroundColor: P.line },
  progressGrid: { gap: 9, marginTop: 10 }, progress: { borderRadius: 16, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,.78)', borderWidth: 1, borderColor: P.line }, progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }, progressLabel: { fontSize: 10, color: P.muted, fontWeight: '600' }, progressValue: { fontSize: 10, color: P.ink, fontWeight: '700' }, track: { height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: '#F3EEF1' }, fill: { height: '100%', borderRadius: 3 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, quick: { flexGrow: 1, width: '47%', minHeight: 74, borderRadius: 21, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,.92)' }, quickIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: P.white }, quickText: { flex: 1, fontSize: 11, fontWeight: '700', color: P.ink }, heart: { width: 24, height: 24, borderRadius: 12, backgroundColor: P.pinkSoft, alignItems: 'center', justifyContent: 'center' },
  note: { marginTop: 10, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: P.goldSoft, borderWidth: 1, borderColor: '#F4E8BE' }, noteText: { flex: 1, fontSize: 10, lineHeight: 15, color: P.ink },
  focusStack: { gap: 9 }, focus: { minHeight: 64, borderRadius: 20, padding: 9, paddingRight: 13, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: P.white, borderWidth: 1, borderColor: P.line }, focusBubble: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, focusNo: { fontSize: 11, color: P.ink, fontWeight: '800' }, focusText: { flex: 1, fontSize: 11.5, lineHeight: 17, color: P.ink, fontWeight: '600' },
  ask: { marginTop: 18, minHeight: 68, borderRadius: 22, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: P.white, borderWidth: 1, borderColor: P.line }, askIcon: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: P.lilacSoft }, askText: { flex: 1, fontSize: 12, color: P.ink, fontWeight: '700' }, footer: { alignSelf: 'center', marginTop: 19, fontSize: 9, color: P.muted, letterSpacing: .8 },
  reverse: { flexDirection: 'row-reverse' }, alignRight: { alignItems: 'flex-end' }, rtl: { textAlign: 'right' }, pressed: { opacity: .78, transform: [{ scale: .985 }] },
});
