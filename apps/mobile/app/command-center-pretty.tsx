import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { DailyCommandCenterResponse, getDailyCommandCenter, getNutritionSummary, hasAuthSession, NutritionSummary } from '../lib/api';
import { AppLocale, getStoredLocale, isRTL } from '../lib/i18n';

const C = {
  bg: '#FFF9FC', white: '#FFFFFF', ink: '#6F5D69', muted: '#B49CAA',
  pink: '#FF6FAE', pink2: '#FF9CC4', pink3: '#FFD0E2', pinkSoft: '#FFEAF3',
  lilac: '#CDB9F3', lilacSoft: '#F3EEFC', blue: '#BDE9FA', blueSoft: '#EFFAFE',
  mint: '#BDEBD8', mintSoft: '#ECFAF4', peach: '#FFD5C2', peachSoft: '#FFF2EC',
  butter: '#FFE7A8', gold: '#F7C95C', shadow: '#EFC7D8',
};

const T = {
  en: { hello: 'Good evening ✨', sub: 'Let’s make today feel a little prettier.', kicker: 'MYPA · YOUR PERSONAL LIFE STUDIO', badge: 'READY FOR YOU', ai: 'Your personal assistant', title: 'Your life, beautifully in sync.', body: 'Food, water, movement, reminders — all the little things, together in one lovely place.', talk: 'Talk to MYPA', today: 'Today, softly organized', hint: 'A quick little look at your day', calories: 'Calories', protein: 'Protein', water: 'Water', wins: 'Tiny wins', waterQ: 'Log water', walkQ: 'Take a walk', trainQ: 'Start training', remindQ: 'Set reminder', radar: 'On your radar', radarHint: 'A few things worth your attention', ask: 'Ask MYPA anything', empty: 'Nothing urgent right now. 💕' },
  fa: { hello: 'عصر بخیر ✨', sub: 'بیا امروز رو یکم قشنگ‌تر و دلنشین‌تر کنیم.', kicker: 'MYPA · استودیوی شخصی زندگی تو', badge: 'آماده برای تو', ai: 'دستیار شخصی تو', title: 'زندگیت؛ هماهنگ، زیبا و تحت کنترل.', body: 'غذا، آب، حرکت، یادآوری و همه‌ی ریزه‌کاری‌های روزت، یکجا و دوست‌داشتنی.', talk: 'با MYPA حرف بزن', today: 'امروز، مرتب و دوست‌داشتنی', hint: 'یک نگاه سریع به حال و هوای امروز', calories: 'کالری', protein: 'پروتئین', water: 'آب', wins: 'بردهای کوچیک', waterQ: 'ثبت آب', walkQ: 'کمی قدم بزن', trainQ: 'شروع تمرین', remindQ: 'یادآوری بساز', radar: 'روی رادارت', radarHint: 'چند چیز که ارزش توجه دارن', ask: 'هر چیزی از MYPA بپرس', empty: 'فعلاً چیز فوری‌ای نداری. 💕' },
} as const;

function Petal({ size = 28, color = C.pink }: { size?: number; color?: string }) {
  return <View pointerEvents="none" style={{ width: size, height: size }}>
    {[0, 60, 120, 180, 240, 300].map((angle) => <View key={angle} style={{ position: 'absolute', left: size * .39, top: 0, width: size * .22, height: size * .52, borderRadius: size, backgroundColor: color, transform: [{ rotate: `${angle}deg` }], opacity: .86 }} />)}
    <View style={{ position: 'absolute', left: size * .37, top: size * .37, width: size * .27, height: size * .27, borderRadius: size, backgroundColor: C.butter }} />
  </View>;
}

function Spark({ size = 24, color = C.gold }: { size?: number; color?: string }) {
  return <Text pointerEvents="none" style={{ color, fontSize: size, lineHeight: size }}>✦</Text>;
}

function MicOrb({ onPress }: { onPress: () => void }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => { const loop = Animated.loop(Animated.sequence([
    Animated.timing(pulse, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
    Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
  ])); loop.start(); return () => loop.stop(); }, [pulse]);
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Talk to MYPA" style={({ pressed }) => [styles.orbHit, pressed && styles.pressed]}>
    <View style={styles.orbStars}><Spark size={20} color={C.gold} /><Spark size={14} color={C.pink2} /></View>
    <Animated.View style={[styles.orbAura, { transform: [{ scale: pulse }] }]} />
    <View style={styles.orbRingOuter}><View style={styles.orbRingMid}><View style={styles.orbCore}><Ionicons name="mic" size={42} color={C.white} /></View></View></View>
    <View style={styles.orbFlower}><Petal size={25} color={C.pink2} /></View>
  </Pressable>;
}

function MiniStat({ icon, value, label, tone }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string; tone: string }) {
  return <View style={styles.miniStat}><View style={[styles.miniIcon, { backgroundColor: tone }]}><Ionicons name={icon} size={17} color={C.pink} /></View><Text style={styles.miniValue}>{value}</Text><Text style={styles.miniLabel}>{label}</Text></View>;
}

function ActionCard({ icon, label, bg, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; bg: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.actionCard, { backgroundColor: bg }, pressed && styles.pressed]}><View style={styles.actionIcon}><Ionicons name={icon} size={19} color={C.pink} /></View><Text style={styles.actionText}>{label}</Text><View style={styles.actionArrow}><Ionicons name="arrow-forward" size={13} color={C.pink} /></View></Pressable>;
}

export default function CommandCenterPretty() {
  const { width } = useWindowDimensions();
  const [locale, setLocale] = useState<AppLocale>('en');
  const [data, setData] = useState<DailyCommandCenterResponse | null>(null);
  const [nutrition, setNutrition] = useState<NutritionSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const reveal = useRef(new Animated.Value(0)).current;
  const rtl = isRTL(locale);
  const t = locale === 'fa' || locale.startsWith('fa-') ? T.fa : T.en;
  const pad = width < 370 ? 18 : 22;

  const load = useCallback(async () => {
    try {
      const [daily, summary] = await Promise.all([getDailyCommandCenter(), getNutritionSummary()]);
      setData(daily); setNutrition(summary);
    } finally { setRefreshing(false); }
  }, []);

  useEffect(() => {
    let mounted = true;
    void Promise.all([getStoredLocale(), hasAuthSession()]).then(([stored, auth]) => {
      if (!mounted) return;
      if (stored) setLocale(stored);
      if (!auth) { router.replace('/auth'); return; }
      setRefreshing(true);
      void load();
      Animated.timing(reveal, { toValue: 1, duration: 650, useNativeDriver: true }).start();
    });
    return () => { mounted = false; };
  }, [load, reveal]);

  const calories = Math.round(nutrition?.meals.calories ?? data?.nutrition.calories ?? 0);
  const protein = Math.round(nutrition?.meals.protein ?? data?.nutrition.protein ?? 0);
  const water = Math.round(data?.nutrition.waterMl ?? 0);
  const calorieGoal = nutrition?.goals.calories ?? 0;
  const proteinGoal = nutrition?.goals.protein ?? 0;
  const cp = calorieGoal ? Math.min(100, Math.round(calories / calorieGoal * 100)) : 0;
  const pp = proteinGoal ? Math.min(100, Math.round(protein / proteinGoal * 100)) : 0;
  const wp = Math.min(100, Math.round(water / 2000 * 100));
  const priorities = data?.priorities?.length ? data.priorities.slice(0, 3) : [t.empty];

  return <SafeAreaView style={styles.safe}>
    <View pointerEvents="none" style={styles.background}><View style={styles.blobPink} /><View style={styles.blobLilac} /><View style={styles.blobBlue} /><View style={styles.floatingA}><Petal size={92} /></View><View style={styles.floatingB}><Petal size={58} color={C.lilac} /></View><View style={styles.floatingC}><Spark size={18} color={C.pink} /></View></View>
    <Animated.ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl tintColor={C.pink} refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />} contentContainerStyle={[styles.content, { paddingHorizontal: pad }]} style={{ opacity: reveal, transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
      <View style={[styles.top, rtl && styles.reverse]}>
        <View style={[styles.topCopy, rtl && styles.alignRight]}><Text style={[styles.kicker, rtl && styles.rtl]}>{t.kicker}</Text><Text style={[styles.hello, rtl && styles.rtl]}>{t.hello}</Text><Text style={[styles.sub, rtl && styles.rtl]}>{t.sub}</Text></View>
        <Pressable onPress={() => router.push('/settings')} style={styles.settings}><Ionicons name="options-outline" size={20} color={C.pink} /></Pressable>
      </View>

      <View style={styles.hero}>
        <View pointerEvents="none" style={styles.heroPinkWash} /><View pointerEvents="none" style={styles.heroBlueWash} /><View pointerEvents="none" style={styles.heroLace}><Petal size={72} color={C.pink3} /></View>
        <View style={[styles.heroCopy, rtl && styles.alignRight]}>
          <View style={[styles.badge, rtl && styles.reverse]}><View style={styles.badgeDot} /><Text style={styles.badgeText}>{t.badge}</Text><Spark size={15} color={C.gold} /></View>
          <Text style={[styles.ai, rtl && styles.rtl]}>{t.ai}</Text>
          <Text style={[styles.heroTitle, rtl && styles.rtl]}>{t.title}</Text>
          <Text style={[styles.heroBody, rtl && styles.rtl]}>{t.body}</Text>
          <Pressable onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.talk, pressed && styles.pressed]}><View style={styles.talkIcon}><Ionicons name="mic" size={15} color={C.pink} /></View><Text style={styles.talkText}>{t.talk}</Text><Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={16} color={C.white} /></Pressable>
        </View>
        <View style={styles.orbWrap}><MicOrb onPress={() => router.push('/assistant')} /></View>
      </View>

      <View style={[styles.sectionHead, rtl && styles.reverse]}><View style={rtl && styles.alignRight}><Text style={[styles.sectionTitle, rtl && styles.rtl]}>{t.today}</Text><Text style={[styles.sectionHint, rtl && styles.rtl]}>{t.hint}</Text></View><Petal size={25} color={C.pink2} /></View>
      <View style={styles.statsRow}><MiniStat icon="flame-outline" value={`${calories}`} label={t.calories} tone={C.pinkSoft} /><View style={styles.vDivider} /><MiniStat icon="barbell-outline" value={`${protein}g`} label={t.protein} tone={C.lilacSoft} /><View style={styles.vDivider} /><MiniStat icon="water-outline" value={`${water}ml`} label={t.water} tone={C.mintSoft} /></View>

      <View style={styles.progressCard}><View style={styles.progressTitle}><Text style={styles.progressHeading}>{t.today}</Text><Spark size={16} color={C.gold} /></View><View style={styles.progressLine}><Text style={styles.progressLabel}>{t.calories}</Text><View style={styles.track}><View style={[styles.fill, { width: `${Math.max(4, cp)}%`, backgroundColor: C.pink }]} /></View><Text style={styles.progressPct}>{cp}%</Text></View><View style={styles.progressLine}><Text style={styles.progressLabel}>{t.protein}</Text><View style={styles.track}><View style={[styles.fill, { width: `${Math.max(4, pp)}%`, backgroundColor: C.lilac }]} /></View><Text style={styles.progressPct}>{pp}%</Text></View><View style={styles.progressLine}><Text style={styles.progressLabel}>{t.water}</Text><View style={styles.track}><View style={[styles.fill, { width: `${Math.max(4, wp)}%`, backgroundColor: C.mint }]} /></View><Text style={styles.progressPct}>{wp}%</Text></View></View>

      <View style={[styles.sectionHead, rtl && styles.reverse, { marginTop: 24 }]}><Text style={[styles.sectionTitle, rtl && styles.rtl]}>{t.wins}</Text><Petal size={21} color={C.lilac} /></View>
      <View style={styles.actionsGrid}><ActionCard icon="water-outline" label={t.waterQ} bg={C.pinkSoft} onPress={() => router.push('/assistant')} /><ActionCard icon="walk-outline" label={t.walkQ} bg={C.mintSoft} onPress={() => router.push('/assistant')} /><ActionCard icon="barbell-outline" label={t.trainQ} bg={C.lilacSoft} onPress={() => router.push('/assistant')} /><ActionCard icon="notifications-outline" label={t.remindQ} bg={C.peachSoft} onPress={() => router.push('/assistant')} /></View>

      <View style={[styles.sectionHead, rtl && styles.reverse, { marginTop: 27 }]}><View style={rtl && styles.alignRight}><Text style={[styles.sectionTitle, rtl && styles.rtl]}>{t.radar}</Text><Text style={[styles.sectionHint, rtl && styles.rtl]}>{t.radarHint}</Text></View><Petal size={20} color={C.pink} /></View>
      <View style={styles.radarStack}>{priorities.map((item, index) => <Pressable key={`${item}-${index}`} onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.radar, pressed && styles.pressed]}><View style={[styles.radarBadge, { backgroundColor: [C.pinkSoft, C.lilacSoft, C.peachSoft][index] || C.pinkSoft }]}><Text style={styles.radarNumber}>0{index + 1}</Text></View><Text style={[styles.radarText, rtl && styles.rtl]}>{item}</Text><Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={16} color={C.muted} /></Pressable>)}</View>

      <Pressable onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.askCard, pressed && styles.pressed]}><View style={styles.askOrb}><Ionicons name="sparkles" size={18} color={C.pink} /></View><View style={[styles.askCopy, rtl && styles.alignRight]}><Text style={[styles.askTitle, rtl && styles.rtl]}>{t.ask}</Text><Text style={[styles.askHint, rtl && styles.rtl]}>MYPA is always just one tap away ♡</Text></View><Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={17} color={C.pink} /></Pressable>
      <View style={{ height: 32 }} />
    </Animated.ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, background: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' }, blobPink: { position: 'absolute', width: 280, height: 280, borderRadius: 180, backgroundColor: '#FFE0EC', top: -150, right: -120 }, blobLilac: { position: 'absolute', width: 240, height: 240, borderRadius: 160, backgroundColor: '#EEE7FB', top: 310, left: -160 }, blobBlue: { position: 'absolute', width: 220, height: 220, borderRadius: 150, backgroundColor: '#E6F7FD', bottom: 80, right: -130 }, floatingA: { position: 'absolute', top: 88, right: 18 }, floatingB: { position: 'absolute', top: 470, left: 8 }, floatingC: { position: 'absolute', top: 220, left: 18 },
  content: { paddingTop: 18 }, top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }, topCopy: { flex: 1 }, kicker: { fontSize: 10, letterSpacing: 1.6, color: C.pink, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 }, hello: { fontSize: 28, lineHeight: 32, color: C.ink, fontWeight: '800' }, sub: { marginTop: 5, color: C.muted, fontSize: 13, lineHeight: 19 }, settings: { width: 42, height: 42, borderRadius: 15, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', shadowColor: C.shadow, shadowOpacity: .22, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  hero: { minHeight: 335, borderRadius: 32, backgroundColor: C.white, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: '#F8DCE8', shadowColor: C.shadow, shadowOpacity: .28, shadowRadius: 22, shadowOffset: { width: 0, height: 9 }, elevation: 5 }, heroPinkWash: { position: 'absolute', width: 330, height: 260, borderRadius: 220, backgroundColor: '#FFE4EF', top: -90, left: -120 }, heroBlueWash: { position: 'absolute', width: 250, height: 250, borderRadius: 190, backgroundColor: '#E9F8FD', bottom: -120, right: -80 }, heroLace: { position: 'absolute', right: 10, top: 12, opacity: .8 }, heroCopy: { paddingTop: 24, paddingLeft: 22, paddingRight: 26, width: '64%', zIndex: 2 }, badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#FFF5FA', borderWidth: 1, borderColor: '#FFD4E5' }, badgeDot: { width: 7, height: 7, borderRadius: 7, backgroundColor: C.pink }, badgeText: { color: C.pink, fontSize: 9, fontWeight: '900', letterSpacing: .7 }, ai: { marginTop: 18, color: C.pink, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 }, heroTitle: { marginTop: 6, color: C.ink, fontSize: 27, lineHeight: 33, fontWeight: '900' }, heroBody: { marginTop: 9, color: C.muted, fontSize: 13, lineHeight: 19 }, talk: { marginTop: 18, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.pink, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 15 }, talkIcon: { width: 25, height: 25, borderRadius: 12.5, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }, talkText: { color: C.white, fontSize: 12, fontWeight: '800' }, orbWrap: { position: 'absolute', right: -5, bottom: 28, width: 170, height: 170, alignItems: 'center', justifyContent: 'center' }, orbHit: { width: 170, height: 170, alignItems: 'center', justifyContent: 'center' }, orbAura: { position: 'absolute', width: 154, height: 154, borderRadius: 100, backgroundColor: '#FFE1ED', opacity: .92 }, orbRingOuter: { width: 132, height: 132, borderRadius: 80, backgroundColor: '#FFBCD4', alignItems: 'center', justifyContent: 'center', shadowColor: '#FF92BA', shadowOpacity: .25, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5 }, orbRingMid: { width: 104, height: 104, borderRadius: 70, backgroundColor: '#FF8FBB', alignItems: 'center', justifyContent: 'center' }, orbCore: { width: 76, height: 76, borderRadius: 50, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFD8E7' }, orbStars: { position: 'absolute', top: 2, left: 8, zIndex: 5, flexDirection: 'row', gap: 3 }, orbFlower: { position: 'absolute', bottom: 0, right: 0 },
  sectionHead: { marginTop: 22, marginBottom: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { color: C.ink, fontSize: 18, fontWeight: '900' }, sectionHint: { color: C.muted, fontSize: 12, marginTop: 3 }, statsRow: { backgroundColor: C.white, borderRadius: 24, paddingVertical: 17, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', shadowColor: C.shadow, shadowOpacity: .16, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 2 }, miniStat: { flex: 1, alignItems: 'center' }, miniIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }, miniValue: { color: C.ink, fontSize: 16, fontWeight: '900' }, miniLabel: { color: C.muted, fontSize: 10, marginTop: 2 }, vDivider: { width: 1, height: 44, backgroundColor: '#F5E8EE' },
  progressCard: { marginTop: 12, backgroundColor: C.white, borderRadius: 24, padding: 17, shadowColor: C.shadow, shadowOpacity: .12, shadowRadius: 13, shadowOffset: { width: 0, height: 5 }, elevation: 2 }, progressTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }, progressHeading: { color: C.ink, fontSize: 13, fontWeight: '900' }, progressLine: { flexDirection: 'row', alignItems: 'center', marginTop: 9, gap: 8 }, progressLabel: { width: 58, fontSize: 10, color: C.muted }, track: { flex: 1, height: 8, borderRadius: 10, backgroundColor: '#F7F0F4', overflow: 'hidden' }, fill: { height: '100%', borderRadius: 10 }, progressPct: { width: 28, textAlign: 'right', fontSize: 10, color: C.ink, fontWeight: '800' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, actionCard: { width: '48.2%', minHeight: 74, borderRadius: 20, padding: 12, justifyContent: 'space-between', shadowColor: C.shadow, shadowOpacity: .1, shadowRadius: 9, shadowOffset: { width: 0, height: 4 }, elevation: 1 }, actionIcon: { width: 32, height: 32, borderRadius: 12, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }, actionText: { color: C.ink, fontSize: 12, fontWeight: '800', marginTop: 7 }, actionArrow: { position: 'absolute', right: 11, top: 11, width: 23, height: 23, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.7)', alignItems: 'center', justifyContent: 'center' },
  radarStack: { gap: 9 }, radar: { minHeight: 66, backgroundColor: C.white, borderRadius: 20, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 11, shadowColor: C.shadow, shadowOpacity: .09, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 }, radarBadge: { width: 40, height: 40, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, radarNumber: { color: C.pink, fontSize: 11, fontWeight: '900' }, radarText: { flex: 1, color: C.ink, fontSize: 12, lineHeight: 18, fontWeight: '700' }, askCard: { marginTop: 15, minHeight: 74, borderRadius: 23, backgroundColor: '#FFF0F6', borderWidth: 1, borderColor: '#FFD5E5', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, askOrb: { width: 42, height: 42, borderRadius: 16, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }, askCopy: { flex: 1 }, askTitle: { color: C.ink, fontSize: 13, fontWeight: '900' }, askHint: { color: C.muted, fontSize: 10, marginTop: 3 }, alignRight: { alignItems: 'flex-end' }, rtl: { textAlign: 'right' }, reverse: { flexDirection: 'row-reverse' }, pressed: { opacity: .78, transform: [{ scale: .985 }] }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }, loadingBrand: { marginTop: 15, color: C.ink, fontSize: 28, fontWeight: '900', letterSpacing: 3 }, loadingSub: { color: C.muted, marginTop: 4, fontSize: 9, letterSpacing: 1.5, fontWeight: '800' },
});
