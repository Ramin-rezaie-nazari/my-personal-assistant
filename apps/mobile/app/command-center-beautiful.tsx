import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { DailyCommandCenterResponse, NutritionSummary, getDailyCommandCenter, getNutritionSummary, hasAuthSession } from '../lib/api';
import { AppLocale, getStoredLocale, isRTL } from '../lib/i18n';

const C = {
  bg: '#FFF9FC', card: '#FFFFFF', ink: '#705F6A', muted: '#AE9EA9',
  pink: '#FF6FAE', pink2: '#FF9CC4', pinkSoft: '#FFE8F2', pinkPale: '#FFF5F9',
  lilac: '#CBB8F0', lilacSoft: '#F2EDFC', blue: '#BFE8F8', blueSoft: '#EFFAFE',
  mint: '#BCE9D8', mintSoft: '#ECFAF4', peach: '#FFD6C4', peachSoft: '#FFF3ED',
  yellow: '#FFD978', line: '#F3DFE8', shadow: '#EEC8D8', white: '#FFFFFF',
};

const T = {
  fa: { hello: 'عصر بخیر ✨', sub: 'بیا امروز رو یکم قشنگ‌تر کنیم.', badge: 'آماده برای تو', ai: 'دستیار شخصی تو', title: 'زندگیت؛ هماهنگ، زیبا و تحت کنترل.', body: 'غذا، آب، حرکت و یادآوری‌ها؛ همه‌چیز یکجا، ساده و دوست‌داشتنی.', talk: 'با MYPA حرف بزن', today: 'امروز', todayHint: 'یک نگاه سریع به حال و هوای امروز', calories: 'کالری', protein: 'پروتئین', water: 'آب', wins: 'بردهای کوچیک', waterQ: 'ثبت آب', walkQ: 'کمی قدم بزن', trainQ: 'شروع تمرین', remindQ: 'یادآوری بساز', radar: 'روی رادارت', radarHint: 'چند چیز که ارزش توجه دارن', ask: 'هر چیزی از MYPA بپرس', empty: 'فعلاً چیز فوری‌ای نداری. 💕' },
  en: { hello: 'Good evening ✨', sub: 'Let’s make today a little prettier.', badge: 'READY FOR YOU', ai: 'Your personal assistant', title: 'Your life, beautifully in sync.', body: 'Food, water, movement and reminders — all together in one lovely place.', talk: 'Talk to MYPA', today: 'Today', todayHint: 'A quick little look at your day', calories: 'Calories', protein: 'Protein', water: 'Water', wins: 'Tiny wins', waterQ: 'Log water', walkQ: 'Take a walk', trainQ: 'Start training', remindQ: 'Set reminder', radar: 'On your radar', radarHint: 'A few things worth your attention', ask: 'Ask MYPA anything', empty: 'Nothing urgent right now. 💕' },
};

function Flower({ size = 24, color = C.pink, center = C.yellow }: { size?: number; color?: string; center?: string }) {
  return <View pointerEvents="none" style={{ width: size, height: size }}>
    {[0, 60, 120, 180, 240, 300].map(a => <View key={a} style={{ position: 'absolute', left: size * .39, top: size * .02, width: size * .22, height: size * .50, borderRadius: size, backgroundColor: color, opacity: .86, transform: [{ rotate: `${a}deg` }] }} />)}
    <View style={{ position: 'absolute', left: size * .37, top: size * .37, width: size * .27, height: size * .27, borderRadius: size, backgroundColor: center }} />
  </View>;
}

function Spark({ size = 18, color = C.yellow }: { size?: number; color?: string }) {
  return <Text pointerEvents="none" style={{ color, fontSize: size, lineHeight: size }}>✦</Text>;
}

function MicOrb({ onPress }: { onPress: () => void }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => { const loop = Animated.loop(Animated.sequence([
    Animated.timing(pulse, { toValue: 1.035, duration: 1200, useNativeDriver: true }),
    Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
  ])); loop.start(); return () => loop.stop(); }, [pulse]);
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.orbHit, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Talk to MYPA">
    <Animated.View style={[styles.orbAura, { transform: [{ scale: pulse }] }]} />
    <View style={styles.orbOuter}>
      <View style={styles.orbMid}>
        <View style={styles.orbCore}><Ionicons name="mic" size={40} color={C.white} /></View>
      </View>
    </View>
    <View style={styles.orbTop}><Spark size={18} color={C.yellow} /></View>
    <View style={styles.orbFlower}><Flower size={25} color={C.pink2} /></View>
  </Pressable>;
}

function MiniStat({ icon, value, label, bg }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string; bg: string }) {
  return <View style={styles.miniStat}><View style={[styles.miniIcon, { backgroundColor: bg }]}><Ionicons name={icon} size={17} color={C.pink} /></View><Text style={styles.miniValue}>{value}</Text><Text style={styles.miniLabel}>{label}</Text></View>;
}

function ActionCard({ icon, label, bg, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; bg: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.actionCard, { backgroundColor: bg }, pressed && styles.pressed]}><View style={styles.actionIcon}><Ionicons name={icon} size={19} color={C.pink} /></View><Text style={styles.actionText}>{label}</Text><View style={styles.arrow}><Ionicons name="arrow-forward" size={13} color={C.pink} /></View></Pressable>;
}

export default function CommandCenterBeautiful() {
  const { width } = useWindowDimensions();
  const rtl = isRTL('fa');
  const pad = width < 370 ? 18 : 22;
  const [locale, setLocale] = useState<AppLocale>('en');
  const [data, setData] = useState<DailyCommandCenterResponse | null>(null);
  const [nutrition, setNutrition] = useState<NutritionSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const reveal = useRef(new Animated.Value(0)).current;
  const t = locale === 'fa' || locale.startsWith('fa-') ? T.fa : T.en;
  const directionRTL = isRTL(locale);

  const load = useCallback(async () => {
    try { const [daily, summary] = await Promise.all([getDailyCommandCenter(), getNutritionSummary()]); setData(daily); setNutrition(summary); }
    catch { /* keep the UI usable even if the network is unavailable */ }
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => { let alive = true; void Promise.all([getStoredLocale(), hasAuthSession()]).then(async ([stored, auth]) => {
    if (!alive) return; if (stored) setLocale(stored); if (!auth) { router.replace('/auth'); return; }
    void load(); Animated.timing(reveal, { toValue: 1, duration: 650, useNativeDriver: true }).start();
  }); return () => { alive = false; }; }, [load, reveal]);

  const calories = Math.round(nutrition?.meals.calories ?? data?.nutrition.calories ?? 0);
  const protein = Math.round(nutrition?.meals.protein ?? data?.nutrition.protein ?? 0);
  const water = Math.round(data?.nutrition.waterMl ?? 0);
  const cg = nutrition?.goals.calories ?? 0, pg = nutrition?.goals.protein ?? 0;
  const cp = cg ? Math.min(100, Math.round(calories / cg * 100)) : 0, pp = pg ? Math.min(100, Math.round(protein / pg * 100)) : 0, wp = Math.min(100, Math.round(water / 2000 * 100));
  const priorities = data?.priorities?.length ? data.priorities.slice(0, 3) : [t.empty];

  return <SafeAreaView style={styles.safe}>
    <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl tintColor={C.pink} refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />} contentContainerStyle={[styles.content, { paddingHorizontal: pad }]}>
      <Animated.View style={{ opacity: reveal, transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
        <View style={[styles.top, directionRTL && styles.reverse]}>
          <View style={[styles.topCopy, directionRTL && styles.alignRight]}><Text style={[styles.kicker, directionRTL && styles.rtl]}>{t.ai}</Text><Text style={[styles.hello, directionRTL && styles.rtl]}>{t.hello}</Text><Text style={[styles.sub, directionRTL && styles.rtl]}>{t.sub}</Text></View>
          <Pressable onPress={() => router.push('/settings')} style={styles.settings}><Ionicons name="options-outline" size={20} color={C.pink} /></Pressable>
        </View>

        <View style={styles.hero}>
          <View pointerEvents="none" style={styles.heroGlowA} /><View pointerEvents="none" style={styles.heroGlowB} />
          <View style={[styles.heroCopy, directionRTL && styles.alignRight]}>
            <View style={[styles.badge, directionRTL && styles.reverse]}><View style={styles.badgeDot} /><Text style={styles.badgeText}>{t.badge}</Text><Spark size={14} /></View>
            <Text style={[styles.ai, directionRTL && styles.rtl]}>{t.ai}</Text>
            <Text style={[styles.heroTitle, directionRTL && styles.rtl]}>{t.title}</Text>
            <Text style={[styles.heroBody, directionRTL && styles.rtl]}>{t.body}</Text>
            <Pressable onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.talk, pressed && styles.pressed]}><View style={styles.talkIcon}><Ionicons name="mic" size={15} color={C.pink} /></View><Text style={styles.talkText}>{t.talk}</Text><Ionicons name={directionRTL ? 'arrow-back' : 'arrow-forward'} size={16} color={C.white} /></Pressable>
          </View>
          <View style={styles.orbZone}><MicOrb onPress={() => router.push('/assistant')} /></View>
          <View pointerEvents="none" style={styles.heroFlower}><Flower size={52} color={C.pink2} /></View>
          <View pointerEvents="none" style={styles.heroSpark}><Spark size={16} color={C.yellow} /></View>
        </View>

        <View style={[styles.sectionHead, directionRTL && styles.reverse]}><View style={directionRTL && styles.alignRight}><Text style={[styles.sectionTitle, directionRTL && styles.rtl]}>{t.today}</Text><Text style={[styles.sectionHint, directionRTL && styles.rtl]}>{t.todayHint}</Text></View><Flower size={24} color={C.pink2} /></View>
        <View style={styles.statsRow}><MiniStat icon="flame-outline" value={`${calories}`} label={t.calories} bg={C.pinkSoft} /><View style={styles.vDivider} /><MiniStat icon="barbell-outline" value={`${protein}g`} label={t.protein} bg={C.lilacSoft} /><View style={styles.vDivider} /><MiniStat icon="water-outline" value={`${water}ml`} label={t.water} bg={C.mintSoft} /></View>

        <View style={styles.progressCard}><View style={styles.progressHead}><Text style={[styles.progressHeading, directionRTL && styles.rtl]}>{t.today}</Text><Spark size={16} /></View>
          {[['calories', cp, C.pink], ['protein', pp, C.lilac], ['water', wp, C.mint]].map(([label, pct, color]) => <View key={String(label)} style={styles.progressLine}><Text style={styles.progressLabel}>{label === 'calories' ? t.calories : label === 'protein' ? t.protein : t.water}</Text><View style={styles.track}><View style={[styles.fill, { width: `${Math.max(4, Number(pct))}%`, backgroundColor: color as string }]} /></View><Text style={styles.progressPct}>{Number(pct)}%</Text></View>)}
        </View>

        <View style={[styles.sectionHead, directionRTL && styles.reverse, { marginTop: 24 }]}><Text style={[styles.sectionTitle, directionRTL && styles.rtl]}>{t.wins}</Text><Flower size={21} color={C.lilac} /></View>
        <View style={styles.actionsGrid}><ActionCard icon="water-outline" label={t.waterQ} bg={C.pinkSoft} onPress={() => router.push('/assistant')} /><ActionCard icon="walk-outline" label={t.walkQ} bg={C.mintSoft} onPress={() => router.push('/assistant')} /><ActionCard icon="barbell-outline" label={t.trainQ} bg={C.lilacSoft} onPress={() => router.push('/assistant')} /><ActionCard icon="notifications-outline" label={t.remindQ} bg={C.peachSoft} onPress={() => router.push('/assistant')} /></View>

        <View style={[styles.sectionHead, directionRTL && styles.reverse, { marginTop: 28 }]}><View style={directionRTL && styles.alignRight}><Text style={[styles.sectionTitle, directionRTL && styles.rtl]}>{t.radar}</Text><Text style={[styles.sectionHint, directionRTL && styles.rtl]}>{t.radarHint}</Text></View><Flower size={20} color={C.pink} /></View>
        <View style={styles.radarStack}>{priorities.map((item, i) => <Pressable key={`${item}-${i}`} onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.radar, pressed && styles.pressed]}><View style={[styles.radarBadge, { backgroundColor: [C.pinkSoft, C.lilacSoft, C.peachSoft][i] || C.pinkSoft }]}><Text style={styles.radarNum}>0{i + 1}</Text></View><Text style={[styles.radarText, directionRTL && styles.rtl]}>{item}</Text><Ionicons name={directionRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={C.muted} /></Pressable>)}</View>

        <Pressable onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.ask, pressed && styles.pressed]}><View style={styles.askIcon}><Ionicons name="sparkles" size={18} color={C.pink} /></View><View style={[styles.askCopy, directionRTL && styles.alignRight]}><Text style={[styles.askTitle, directionRTL && styles.rtl]}>{t.ask}</Text><Text style={[styles.askHint, directionRTL && styles.rtl]}>MYPA is always one tap away ♡</Text></View><Ionicons name={directionRTL ? 'arrow-back' : 'arrow-forward'} size={17} color={C.pink} /></Pressable>
      </Animated.View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { paddingTop: 18, paddingBottom: 34 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  topCopy: { flex: 1 },
  kicker: { fontSize: 10, color: C.pink, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 7 },
  hello: { fontSize: 28, lineHeight: 33, color: C.ink, fontWeight: '900' },
  sub: { marginTop: 5, color: C.muted, fontSize: 13, lineHeight: 19 },
  settings: { width: 42, height: 42, borderRadius: 15, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', shadowColor: C.shadow, shadowOpacity: .18, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  hero: { minHeight: 352, borderRadius: 32, overflow: 'hidden', backgroundColor: C.card, borderWidth: 1, borderColor: '#F7DDE8', shadowColor: C.shadow, shadowOpacity: .24, shadowRadius: 22, shadowOffset: { width: 0, height: 9 }, elevation: 4, position: 'relative' },
  heroGlowA: { position: 'absolute', width: 270, height: 220, borderRadius: 160, backgroundColor: '#FFE5F0', top: -80, left: -100 },
  heroGlowB: { position: 'absolute', width: 220, height: 200, borderRadius: 160, backgroundColor: '#EDF9FD', bottom: -100, right: -70 },
  heroCopy: { width: '66%', paddingTop: 22, paddingLeft: 20, paddingRight: 10, zIndex: 4 },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.pinkPale, borderWidth: 1, borderColor: '#FFD7E6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeDot: { width: 7, height: 7, borderRadius: 7, backgroundColor: C.pink },
  badgeText: { color: C.pink, fontSize: 9, fontWeight: '900', letterSpacing: .7 },
  ai: { marginTop: 16, color: C.pink, fontSize: 11, fontWeight: '900', letterSpacing: 1.0 },
  heroTitle: { marginTop: 5, color: C.ink, fontSize: 25, lineHeight: 31, fontWeight: '900' },
  heroBody: { marginTop: 8, color: C.muted, fontSize: 12.5, lineHeight: 18 },
  talk: { marginTop: 17, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: C.pink, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 15 },
  talkIcon: { width: 25, height: 25, borderRadius: 13, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  talkText: { color: C.white, fontSize: 12, fontWeight: '900' },
  orbZone: { position: 'absolute', width: 176, height: 176, right: -2, bottom: 25, alignItems: 'center', justifyContent: 'center', zIndex: 3 },
  orbHit: { width: 176, height: 176, alignItems: 'center', justifyContent: 'center' },
  orbAura: { position: 'absolute', width: 166, height: 166, borderRadius: 100, backgroundColor: '#FFE8F2', opacity: .95 },
  orbOuter: { width: 136, height: 136, borderRadius: 80, backgroundColor: '#FFB9D1', alignItems: 'center', justifyContent: 'center', shadowColor: '#FF8DB8', shadowOpacity: .22, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  orbMid: { width: 108, height: 108, borderRadius: 65, backgroundColor: '#FF8FBC', alignItems: 'center', justifyContent: 'center' },
  orbCore: { width: 78, height: 78, borderRadius: 45, backgroundColor: C.pink, borderWidth: 4, borderColor: '#FFD9E7', alignItems: 'center', justifyContent: 'center' },
  orbTop: { position: 'absolute', top: 4, left: 18 }, orbFlower: { position: 'absolute', right: 4, bottom: 0 },
  heroFlower: { position: 'absolute', right: 14, top: 10, zIndex: 1 }, heroSpark: { position: 'absolute', left: 14, bottom: 18, zIndex: 1 },
  sectionHead: { marginTop: 22, marginBottom: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: C.ink, fontSize: 18, fontWeight: '900' }, sectionHint: { color: C.muted, fontSize: 12, marginTop: 3 },
  statsRow: { backgroundColor: C.card, borderRadius: 24, paddingVertical: 17, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', shadowColor: C.shadow, shadowOpacity: .13, shadowRadius: 13, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  miniStat: { flex: 1, alignItems: 'center' }, miniIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }, miniValue: { color: C.ink, fontSize: 16, fontWeight: '900' }, miniLabel: { color: C.muted, fontSize: 10, marginTop: 2 }, vDivider: { width: 1, height: 44, backgroundColor: '#F5E9EF' },
  progressCard: { marginTop: 12, backgroundColor: C.card, borderRadius: 24, padding: 17, shadowColor: C.shadow, shadowOpacity: .10, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 }, progressHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }, progressHeading: { color: C.ink, fontSize: 13, fontWeight: '900' },
  progressLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }, progressLabel: { width: 60, color: C.muted, fontSize: 10 }, track: { flex: 1, height: 8, borderRadius: 10, backgroundColor: '#F8F1F5', overflow: 'hidden' }, fill: { height: '100%', borderRadius: 10 }, progressPct: { width: 30, textAlign: 'right', color: C.ink, fontSize: 10, fontWeight: '900' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, actionCard: { width: '48.2%', minHeight: 76, borderRadius: 20, padding: 12, justifyContent: 'space-between', position: 'relative', shadowColor: C.shadow, shadowOpacity: .08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 1 }, actionIcon: { width: 33, height: 33, borderRadius: 12, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }, actionText: { color: C.ink, fontSize: 12, fontWeight: '900', marginTop: 7 }, arrow: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  radarStack: { gap: 9 }, radar: { minHeight: 66, backgroundColor: C.card, borderRadius: 20, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 11, shadowColor: C.shadow, shadowOpacity: .07, shadowRadius: 9, shadowOffset: { width: 0, height: 4 }, elevation: 1 }, radarBadge: { width: 40, height: 40, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, radarNum: { color: C.pink, fontSize: 11, fontWeight: '900' }, radarText: { flex: 1, color: C.ink, fontSize: 12, lineHeight: 18, fontWeight: '800' },
  ask: { marginTop: 15, minHeight: 74, borderRadius: 23, backgroundColor: '#FFF0F6', borderWidth: 1, borderColor: '#FFD6E6', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, askIcon: { width: 42, height: 42, borderRadius: 16, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }, askCopy: { flex: 1 }, askTitle: { color: C.ink, fontSize: 13, fontWeight: '900' }, askHint: { color: C.muted, fontSize: 10, marginTop: 3 },
  alignRight: { alignItems: 'flex-end' }, rtl: { textAlign: 'right' }, reverse: { flexDirection: 'row-reverse' }, pressed: { opacity: .8, transform: [{ scale: .985 }] },
});
