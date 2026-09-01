import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { DailyCommandCenterResponse, getDailyCommandCenter, getNutritionSummary, hasAuthSession, NutritionSummary } from '../lib/api';
import { AppLocale, getStoredLocale, isRTL } from '../lib/i18n';
import { runQuickCommand } from '../lib/command-actions';

const C = {
  bg: '#FFFDFE',
  white: '#FFFFFF',
  ink: '#766B75',
  muted: '#A79BA7',
  line: '#F4E4EC',
  pink: '#FF78AD',
  pink2: '#FF9FC6',
  pinkSoft: '#FFE4EF',
  lilac: '#C9B7EE',
  lilacSoft: '#F1EBFB',
  blue: '#B9E5F7',
  blueSoft: '#EDF8FD',
  mint: '#BDE9DA',
  mintSoft: '#EAF8F2',
  peach: '#FFD0BC',
  peachSoft: '#FFF0E9',
  yellow: '#F7D993',
  yellowSoft: '#FFF7DF',
};

type Copy = {
  hello: string; sub: string; ai: string; title: string; body: string; talk: string;
  today: string; hint: string; calories: string; protein: string; water: string;
  quick: string; waterQ: string; walkQ: string; trainQ: string; remindQ: string;
  focus: string; focusHint: string; ask: string; empty: string;
};

const COPY: Record<'en' | 'fa', Copy> = {
  en: {
    hello: 'Good evening!', sub: 'Let’s make today a little brighter. ♡', ai: 'YOUR PERSONAL AI',
    title: 'Your life, beautifully in sync.', body: 'Plan your day, log food, set reminders, or simply talk to me.', talk: 'Talk to MYPA',
    today: 'Today at a glance', hint: 'Small progress, happy days.', calories: 'Calories', protein: 'Protein', water: 'Water',
    quick: 'Tiny wins', waterQ: 'Log water', walkQ: 'Take a walk', trainQ: 'Start training', remindQ: 'Set a reminder',
    focus: 'On your radar', focusHint: 'A few things worth your attention', ask: 'Ask MYPA', empty: 'Nothing urgent right now. Take a little breath. ♡',
  },
  fa: {
    hello: 'عصر بخیر!', sub: 'بیا امروز رو یکم روشن‌تر و قشنگ‌تر کنیم. ♡', ai: 'دستیار شخصی تو',
    title: 'زندگیت؛ هماهنگ، زیبا و تحت کنترل.', body: 'روزت رو بچین، غذا ثبت کن، یادآوری بساز یا فقط باهام حرف بزن.', talk: 'با MYPA حرف بزن',
    today: 'نگاهی به امروز', hint: 'قدم‌های کوچیک، روزهای بهتر.', calories: 'کالری', protein: 'پروتئین', water: 'آب',
    quick: 'بردهای کوچیک', waterQ: 'ثبت آب', walkQ: 'یکم قدم بزن', trainQ: 'شروع تمرین', remindQ: 'یادآوری بساز',
    focus: 'روی رادارت', focusHint: 'چند چیز که ارزش توجهت رو دارن', ask: 'از MYPA بپرس', empty: 'فعلاً کار فوری نداری؛ یه نفس راحت بکش. ♡',
  },
};

function Flower({ size = 28, color = C.pink }: { size?: number; color?: string }) {
  return <View pointerEvents="none" style={{ width: size, height: size }}>
    {[0, 60, 120, 180, 240, 300].map(angle => (
      <View key={angle} style={{ position: 'absolute', left: size * .38, top: size * .03, width: size * .24, height: size * .48, borderRadius: size, backgroundColor: color, opacity: .8, transform: [{ rotate: `${angle}deg` }] }} />
    ))}
    <View style={{ position: 'absolute', left: size * .37, top: size * .37, width: size * .26, height: size * .26, borderRadius: size, backgroundColor: C.yellow }} />
  </View>;
}

function MicOrb({ onPress }: { onPress: () => void }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.045, duration: 1200, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return <Pressable accessibilityRole="button" accessibilityLabel="Talk to MYPA" onPress={onPress} style={({ pressed }) => [styles.orbHit, pressed && styles.pressed]}>
    <Animated.View style={[styles.orbAura, { transform: [{ scale: pulse }] }]} />
    <View style={styles.orbOuter}>
      <View style={styles.orbMid}>
        <View style={styles.orbInner}>
          <Ionicons name="mic" size={40} color={C.white} />
        </View>
      </View>
    </View>
    <View style={styles.orbFlowerA}><Flower size={18} color={C.yellow} /></View>
    <View style={styles.orbFlowerB}><Flower size={14} color={C.pink2} /></View>
  </Pressable>;
}

function Stat({ icon, value, label, tone }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string; tone: string }) {
  return <View style={styles.stat}>
    <View style={[styles.statIcon, { backgroundColor: tone }]}><Ionicons name={icon} size={17} color={C.ink} /></View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>;
}

function Progress({ label, value, percent, color }: { label: string; value: string; percent: number; color: string }) {
  return <View style={styles.progress}>
    <View style={styles.progressHead}><Text style={styles.progressLabel}>{label}</Text><Text style={styles.progressValue}>{value}</Text></View>
    <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(3, Math.min(100, percent))}%`, backgroundColor: color }]} /></View>
  </View>;
}

function Quick({ icon, label, bg, onPress, busy }: { icon: keyof typeof Ionicons.glyphMap; label: string; bg: string; onPress: () => void; busy: boolean }) {
  return <Pressable onPress={onPress} disabled={busy} style={({ pressed }) => [styles.quick, { backgroundColor: bg }, pressed && styles.pressed]}>
    <View style={styles.quickIcon}>{busy ? <ActivityIndicator size="small" color={C.pink} /> : <Ionicons name={icon} size={19} color={C.pink} />}</View>
    <Text style={styles.quickText}>{label}</Text>
    <Ionicons name="arrow-up" size={13} color={C.pink} style={{ transform: [{ rotate: '45deg' }] }} />
  </Pressable>;
}

export default function CommandCenterVivid() {
  const { width } = useWindowDimensions();
  const pad = width < 370 ? 18 : 22;
  const [locale, setLocale] = useState<AppLocale>('en');
  const [data, setData] = useState<DailyCommandCenterResponse | null>(null);
  const [nutrition, setNutrition] = useState<NutritionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const reveal = useRef(new Animated.Value(0)).current;
  const rtl = isRTL(locale);
  const t = locale === 'fa' || locale.startsWith('fa-') ? COPY.fa : COPY.en;

  const load = useCallback(async () => {
    try {
      const [daily, summary] = await Promise.all([getDailyCommandCenter(), getNutritionSummary()]);
      setData(daily); setNutrition(summary);
    } catch {
      // Preserve last visible dashboard state when the API is unavailable.
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void Promise.all([getStoredLocale(), hasAuthSession()]).then(async ([stored, auth]) => {
      if (!mounted) return;
      if (stored) setLocale(stored);
      if (!auth) { router.replace('/auth'); return; }
      await load();
      Animated.timing(reveal, { toValue: 1, duration: 650, useNativeDriver: true }).start();
    });
    return () => { mounted = false; };
  }, [load, reveal]);

  const action = useCallback(async (key: 'water' | 'walk' | 'strength' | 'reminder') => {
    try { setBusy(key); setNote(null); const result = await runQuickCommand(key); setNote(result.message); await load(); }
    finally { setBusy(null); }
  }, [load]);

  if (loading) return <View style={styles.loading}><Flower size={76} /><Text style={styles.loadingBrand}>MYPA</Text><Text style={styles.loadingSub}>YOUR LITTLE LIFE STUDIO</Text><ActivityIndicator color={C.pink} style={{ marginTop: 20 }} /></View>;

  const calories = Math.round(nutrition?.meals.calories ?? data?.nutrition.calories ?? 0);
  const protein = Math.round(nutrition?.meals.protein ?? data?.nutrition.protein ?? 0);
  const water = Math.round(data?.nutrition.waterMl ?? 0);
  const cg = nutrition?.goals.calories ?? 0;
  const pg = nutrition?.goals.protein ?? 0;
  const cp = cg ? Math.round(calories / cg * 100) : 0;
  const pp = pg ? Math.round(protein / pg * 100) : 0;
  const wp = Math.round(water / 2000 * 100);
  const priorities = data?.priorities?.length ? data.priorities.slice(0, 3) : [t.empty];

  return <SafeAreaView style={styles.safe}>
    <View pointerEvents="none" style={styles.background}>
      <View style={styles.bgPink} /><View style={styles.bgBlue} /><View style={styles.bgLilac} />
      <View style={styles.floatA}><Flower size={88} /></View><View style={styles.floatB}><Flower size={58} color={C.lilac} /></View>
    </View>
    <Animated.ScrollView showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl tintColor={C.pink} refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      contentContainerStyle={[styles.content, { paddingHorizontal: pad }]}
      style={{ opacity: reveal, transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>

      <View style={[styles.header, rtl && styles.reverse]}>
        <View style={[styles.headerCopy, rtl && styles.alignRight]}>
          <Text style={[styles.kicker, rtl && styles.rtl]}>MYPA · PERSONAL LIFE STUDIO</Text>
          <Text style={[styles.hello, rtl && styles.rtl]}>{t.hello}</Text>
          <Text style={[styles.sub, rtl && styles.rtl]}>{t.sub}</Text>
        </View>
        <Pressable onPress={() => router.push('/settings')} style={styles.settings}><Ionicons name="options-outline" size={20} color={C.pink} /></Pressable>
      </View>

      <View style={styles.hero}>
        <View pointerEvents="none" style={styles.heroGlowPink} /><View pointerEvents="none" style={styles.heroGlowBlue} />
        <View style={[styles.heroCopy, rtl && styles.alignRight]}>
          <View style={[styles.ready, rtl && styles.reverse]}><View style={styles.readyDot} /><Text style={styles.readyText}>READY FOR YOU</Text></View>
          <Text style={[styles.aiKicker, rtl && styles.rtl]}>{t.ai}</Text>
          <Text style={[styles.heroTitle, rtl && styles.rtl]}>{t.title}</Text>
          <Text style={[styles.heroBody, rtl && styles.rtl]}>{t.body}</Text>
          <Pressable onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.talk, pressed && styles.pressed]}>
            <Ionicons name="mic" size={17} color={C.white} /><Text style={styles.talkText}>{t.talk}</Text><Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={16} color={C.white} />
          </Pressable>
        </View>
        <View style={styles.orbPlace}><View style={styles.orbBacking}><MicOrb onPress={() => router.push('/assistant')} /></View></View>
      </View>

      <View style={[styles.section, rtl && styles.reverse]}><View style={rtl && styles.alignRight}><Text style={[styles.sectionTitle, rtl && styles.rtl]}>{t.today}</Text><Text style={[styles.sectionHint, rtl && styles.rtl]}>{t.hint}</Text></View><Flower size={22} /></View>
      <View style={styles.statsCard}><Stat icon="flame-outline" value={`${calories}`} label={t.calories} tone={C.pinkSoft} /><View style={styles.divider} /><Stat icon="barbell-outline" value={`${protein}g`} label={t.protein} tone={C.lilacSoft} /><View style={styles.divider} /><Stat icon="water-outline" value={`${water}ml`} label={t.water} tone={C.mintSoft} /></View>
      <View style={styles.progressGrid}><Progress label={t.calories} value={cg ? `${cp}%` : '—'} percent={cp} color={C.pink} /><Progress label={t.protein} value={pg ? `${pp}%` : '—'} percent={pp} color={C.lilac} /><Progress label={t.water} value={`${wp}%`} percent={wp} color={C.mint} /></View>

      <View style={[styles.section, rtl && styles.reverse, { marginTop: 24 }]}><Text style={[styles.sectionTitle, rtl && styles.rtl]}>{t.quick}</Text><Flower size={20} color={C.pink2} /></View>
      <View style={styles.quickGrid}>
        <Quick icon="water-outline" label={t.waterQ} bg={C.pinkSoft} onPress={() => void action('water')} busy={busy === 'water'} />
        <Quick icon="walk-outline" label={t.walkQ} bg={C.mintSoft} onPress={() => void action('walk')} busy={busy === 'walk'} />
        <Quick icon="barbell-outline" label={t.trainQ} bg={C.lilacSoft} onPress={() => void action('strength')} busy={busy === 'strength'} />
        <Quick icon="notifications-outline" label={t.remindQ} bg={C.peachSoft} onPress={() => void action('reminder')} busy={busy === 'reminder'} />
      </View>
      {note ? <View style={[styles.note, rtl && styles.reverse]}><Ionicons name="sparkles" size={14} color={C.pink} /><Text style={[styles.noteText, rtl && styles.rtl]}>{note}</Text></View> : null}

      <View style={[styles.section, rtl && styles.reverse, { marginTop: 28 }]}><View style={rtl && styles.alignRight}><Text style={[styles.sectionTitle, rtl && styles.rtl]}>{t.focus}</Text><Text style={[styles.sectionHint, rtl && styles.rtl]}>{t.focusHint}</Text></View><Flower size={19} color={C.lilac} /></View>
      <View style={styles.focusStack}>{priorities.map((item, i) => <Pressable key={`${item}-${i}`} onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.focus, pressed && styles.pressed]}><View style={[styles.focusBubble, { backgroundColor: [C.pinkSoft, C.lilacSoft, C.peachSoft][i] || C.pinkSoft }]}><Text style={styles.focusNo}>0{i + 1}</Text></View><Text style={[styles.focusText, rtl && styles.rtl]}>{item}</Text><Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={15} color={C.muted} /></Pressable>)}</View>

      <Pressable onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.ask, pressed && styles.pressed]}><View style={styles.askIcon}><Ionicons name="sparkles" size={18} color={C.pink} /></View><Text style={[styles.askText, rtl && styles.rtl]}>{t.ask}</Text><Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={17} color={C.pink} /></Pressable>
      <Text style={styles.footer}>made for your everyday little wins ♡</Text>
    </Animated.ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  background: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  bgPink: { position: 'absolute', width: 360, height: 360, borderRadius: 180, right: -170, top: -170, backgroundColor: C.pinkSoft, opacity: .95 },
  bgBlue: { position: 'absolute', width: 300, height: 300, borderRadius: 150, left: -190, top: '34%', backgroundColor: C.blueSoft, opacity: .95 },
  bgLilac: { position: 'absolute', width: 330, height: 330, borderRadius: 165, right: -190, bottom: -170, backgroundColor: C.lilacSoft, opacity: .9 },
  floatA: { position: 'absolute', right: 26, top: 118, opacity: .45 },
  floatB: { position: 'absolute', left: 26, bottom: 190, opacity: .34 },
  content: { paddingTop: 14, paddingBottom: 44 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 },
  headerCopy: { flex: 1 },
  kicker: { fontSize: 9, letterSpacing: 1.8, color: C.pink, fontWeight: '800', marginBottom: 7 },
  hello: { fontSize: 29, lineHeight: 34, fontWeight: '800', color: C.ink, letterSpacing: -.5 },
  sub: { fontSize: 13, lineHeight: 19, color: C.muted, marginTop: 5 },
  settings: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  hero: { minHeight: 292, borderRadius: 32, overflow: 'hidden', padding: 20, backgroundColor: '#FFE8F1', borderWidth: 1, borderColor: '#FFD0E1', position: 'relative', flexDirection: 'row' },
  heroGlowPink: { position: 'absolute', width: 230, height: 230, borderRadius: 115, right: -85, top: -70, backgroundColor: '#FFBAD3', opacity: .72 },
  heroGlowBlue: { position: 'absolute', width: 180, height: 180, borderRadius: 90, right: 18, bottom: -95, backgroundColor: '#CDEEFE', opacity: .88 },
  heroCopy: { flex: 1, zIndex: 2, paddingRight: 72 },
  ready: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,.72)', borderRadius: 18, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 13 },
  readyDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#9FD6B8' },
  readyText: { fontSize: 8, letterSpacing: 1.35, color: C.pink, fontWeight: '800' },
  aiKicker: { fontSize: 9, letterSpacing: 1.7, color: C.pink, fontWeight: '800', marginBottom: 6 },
  heroTitle: { fontSize: 28, lineHeight: 32, fontWeight: '800', color: C.ink, letterSpacing: -.5 },
  heroBody: { fontSize: 12, lineHeight: 18, color: '#8D7E88', marginTop: 9, maxWidth: 240 },
  talk: { marginTop: 17, height: 46, alignSelf: 'flex-start', paddingHorizontal: 15, borderRadius: 23, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: C.pink },
  talkText: { color: C.white, fontSize: 12, fontWeight: '800' },
  orbPlace: { position: 'absolute', right: 2, top: 73, width: 146, height: 170, alignItems: 'center', justifyContent: 'center' },
  orbBacking: { width: 142, height: 142, borderRadius: 71, backgroundColor: 'rgba(255,255,255,.30)', alignItems: 'center', justifyContent: 'center' },
  orbHit: { width: 142, height: 142, alignItems: 'center', justifyContent: 'center' },
  orbAura: { position: 'absolute', width: 136, height: 136, borderRadius: 68, backgroundColor: 'rgba(255,120,173,.28)' },
  orbOuter: { width: 112, height: 112, borderRadius: 56, backgroundColor: '#FF78AD', borderWidth: 3, borderColor: '#FF9FC6', alignItems: 'center', justifyContent: 'center', shadowColor: '#FF78AD', shadowOpacity: .30, shadowRadius: 26, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  orbMid: { width: 92, height: 92, borderRadius: 46, backgroundColor: '#FF9FC6', borderWidth: 2, borderColor: '#FFE0EC', alignItems: 'center', justifyContent: 'center' },
  orbInner: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#FF78AD', borderWidth: 2, borderColor: '#FFD1E1', alignItems: 'center', justifyContent: 'center' },
  orbFlowerA: { position: 'absolute', right: 6, top: 3 },
  orbFlowerB: { position: 'absolute', left: 2, bottom: 6 },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 25, marginBottom: 11 },
  sectionTitle: { fontSize: 17, lineHeight: 22, color: C.ink, fontWeight: '800' },
  sectionHint: { fontSize: 10, lineHeight: 15, color: C.muted, marginTop: 2 },
  statsCard: { minHeight: 108, borderRadius: 25, paddingHorizontal: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  stat: { flex: 1, alignItems: 'center' },
  statIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  statValue: { fontSize: 17, fontWeight: '800', color: C.ink },
  statLabel: { fontSize: 9, color: C.muted, marginTop: 2 },
  divider: { width: 1, height: 44, backgroundColor: C.line },
  progressGrid: { gap: 9, marginTop: 10 },
  progress: { backgroundColor: 'rgba(255,255,255,.84)', borderRadius: 16, paddingHorizontal: 13, paddingVertical: 10, borderWidth: 1, borderColor: C.line },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  progressLabel: { fontSize: 10, color: C.muted, fontWeight: '700' },
  progressValue: { fontSize: 10, color: C.ink, fontWeight: '800' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: '#F7EFF3' },
  fill: { height: '100%', borderRadius: 3 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quick: { flexGrow: 1, width: '47%', minHeight: 74, borderRadius: 20, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: '#FFFFFF' },
  quickIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white },
  quickText: { flex: 1, fontSize: 11, lineHeight: 15, fontWeight: '800', color: C.ink },
  note: { marginTop: 10, minHeight: 44, paddingHorizontal: 13, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.pinkSoft, borderWidth: 1, borderColor: '#FFD6E4' },
  noteText: { flex: 1, fontSize: 10, lineHeight: 15, color: C.ink },
  focusStack: { gap: 9 },
  focus: { minHeight: 64, borderRadius: 20, padding: 9, paddingRight: 13, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  focusBubble: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  focusNo: { fontSize: 11, fontWeight: '900', color: C.pink },
  focusText: { flex: 1, fontSize: 11.5, lineHeight: 17, color: C.ink, fontWeight: '700' },
  ask: { marginTop: 18, minHeight: 70, borderRadius: 22, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: C.white, borderWidth: 1, borderColor: '#F2DDE7' },
  askIcon: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: C.pinkSoft },
  askText: { flex: 1, fontSize: 12, color: C.ink, fontWeight: '800' },
  footer: { alignSelf: 'center', marginTop: 19, fontSize: 9, color: C.muted, letterSpacing: .8 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  loadingBrand: { marginTop: 18, fontSize: 28, letterSpacing: 7, fontWeight: '800', color: C.ink },
  loadingSub: { marginTop: 6, fontSize: 10, letterSpacing: 2.2, color: C.muted },
  reverse: { flexDirection: 'row-reverse' },
  alignRight: { alignItems: 'flex-end' },
  rtl: { textAlign: 'right' },
  pressed: { opacity: .8, transform: [{ scale: .985 }] },
});
