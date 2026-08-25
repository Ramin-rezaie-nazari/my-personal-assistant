import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AuthUser, clearAuthSession, getMe, hasAuthSession, logout } from '../lib/api';
import { AppLocale, getStoredLocale, getLanguageOptions, isRTL, setStoredLocale } from '../lib/i18n';
import { BRAND } from '../lib/branding';

export default function SettingsScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [locale, setLocale] = useState<AppLocale>('en');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [smartNudges, setSmartNudges] = useState(true);
  const [voiceHints, setVoiceHints] = useState(true);

  const load = useCallback(async () => {
    try {
      const [stored, me] = await Promise.all([getStoredLocale(), getMe()]);
      if (stored) setLocale(stored);
      setUser(me);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void hasAuthSession().then((ok) => { if (ok) void load(); else router.replace('/auth'); }); }, [load]);

  const changeLanguage = async () => {
    const options = getLanguageOptions();
    const currentIndex = Math.max(0, options.findIndex((item) => item.code === locale));
    const next = options[(currentIndex + 1) % options.length]?.code ?? 'en';
    setLocale(next);
    await setStoredLocale(next);
  };

  const signOut = async () => {
    try { setBusy(true); await logout(); await clearAuthSession(); router.replace('/language'); }
    finally { setBusy(false); }
  };

  if (loading) return <View style={styles.center}><View style={styles.loadingMark}><Text style={styles.loadingMarkText}>M</Text></View><ActivityIndicator color={BRAND.colors.primary} style={{ marginTop: 14 }} /></View>;

  const languageLabel = getLanguageOptions().find((item) => item.code === locale)?.label ?? locale;
  const initials = `${user?.firstName?.[0] ?? user?.email?.[0] ?? 'M'}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>←</Text></Pressable>
          <View style={styles.headerCopy}><Text style={styles.eyebrow}>MYPA</Text><Text style={styles.title}>Settings</Text><Text style={styles.subtitle}>Tune the assistant without digging through menus.</Text></View>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileGlow} />
          <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>{initials}</Text></View>
          <View style={styles.profileCopy}><Text style={styles.profileName}>{[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Your MYPA'}</Text><Text style={styles.profileEmail}>{user?.email ?? ''}</Text></View>
          <View style={styles.statusPill}><View style={styles.statusDot} /><Text style={styles.statusText}>ACTIVE</Text></View>
        </View>

        <Text style={styles.sectionLabel}>Experience</Text>
        <View style={styles.card}>
          <SettingRow icon="◉" title="Assistant voice" subtitle="Your voice-first entry point" action={<Text style={styles.value}>MYPA Core</Text>} />
          <SettingRow icon="Aa" title="Language" subtitle="Change the language MYPA speaks" action={<Pressable onPress={() => void changeLanguage()} style={styles.valueButton}><Text style={styles.valueButtonText}>{languageLabel}</Text></Pressable>} />
          <SettingRow icon="✦" title="Smart nudges" subtitle="Let MYPA surface useful moments" action={<Switch value={smartNudges} onValueChange={setSmartNudges} trackColor={{ false: '#D5D9E0', true: BRAND.colors.primarySoft }} thumbColor={smartNudges ? BRAND.colors.primary : '#FFFFFF'} />} />
          <SettingRow icon="◌" title="Voice hints" subtitle="Subtle feedback during voice interactions" action={<Switch value={voiceHints} onValueChange={setVoiceHints} trackColor={{ false: '#D5D9E0', true: BRAND.colors.primarySoft }} thumbColor={voiceHints ? BRAND.colors.primary : '#FFFFFF'} />} last />
        </View>

        <Text style={styles.sectionLabel}>Your world</Text>
        <View style={styles.grid}>
          <QuickLink title="Today" subtitle="Your day" icon="☀" onPress={() => router.push('/daily')} />
          <QuickLink title="Brain" subtitle="What MYPA notices" icon="✦" onPress={() => router.push('/brain-overview')} />
          <QuickLink title="Reminders" subtitle="Things to remember" icon="◷" onPress={() => router.push('/reminders')} />
          <QuickLink title="Notifications" subtitle="Helpful nudges" icon="◈" onPress={() => router.push('/notifications')} />
        </View>

        <View style={styles.privacyCard}><View style={styles.privacyIcon}><Text style={styles.privacyIconText}>⌁</Text></View><View style={styles.privacyCopy}><Text style={styles.privacyTitle}>Private by design</Text><Text style={styles.privacyText}>Your locale, preferences and assistant state stay independent from the business logic that powers your plans.</Text></View></View>

        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void signOut()} style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}><Text style={styles.signOutText}>{busy ? 'Signing out…' : 'Sign out'}</Text></Pressable>
        <Text style={styles.footer}>MYPA · personal, calm, capable</Text>
      </ScrollView>
    </View>
  );
}

function SettingRow({ icon, title, subtitle, action, last }: { icon: string; title: string; subtitle: string; action: React.ReactNode; last?: boolean }) {
  return <View style={[styles.row, !last && styles.rowBorder]}><View style={styles.rowIcon}><Text style={styles.rowIconText}>{icon}</Text></View><View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowSubtitle}>{subtitle}</Text></View>{action}</View>;
}

function QuickLink({ title, subtitle, icon, onPress }: { title: string; subtitle: string; icon: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.quick, pressed && styles.quickPressed]}><View style={styles.quickIcon}><Text style={styles.quickIconText}>{icon}</Text></View><Text style={styles.quickTitle}>{title}</Text><Text style={styles.quickSubtitle}>{subtitle}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.colors.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.colors.canvas },
  loadingMark: { width: 64, height: 64, borderRadius: 20, backgroundColor: BRAND.colors.ink, alignItems: 'center', justifyContent: 'center' },
  loadingMarkText: { color: BRAND.colors.white, fontSize: 26, fontWeight: '900' },
  content: { padding: 20, paddingBottom: 40, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 42, height: 42, borderRadius: 21, backgroundColor: BRAND.colors.surface, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 19, color: BRAND.colors.ink, fontWeight: '900' },
  headerCopy: { flex: 1 },
  eyebrow: { color: BRAND.colors.primary, letterSpacing: 1.5, fontSize: 10, fontWeight: '900' },
  title: { color: BRAND.colors.ink, fontSize: 30, fontWeight: '900', marginTop: 3 },
  subtitle: { color: BRAND.colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: BRAND.colors.ink, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: BRAND.colors.white, fontSize: 14, fontWeight: '900' },
  profileCard: { overflow: 'hidden', borderRadius: 24, padding: 18, backgroundColor: BRAND.colors.ink, flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileGlow: { position: 'absolute', right: -40, top: -50, width: 170, height: 170, borderRadius: 85, backgroundColor: BRAND.colors.primary, opacity: 0.18 },
  profileAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: BRAND.colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  profileAvatarText: { color: BRAND.colors.white, fontSize: 16, fontWeight: '900' },
  profileCopy: { flex: 1 },
  profileName: { color: BRAND.colors.white, fontSize: 17, fontWeight: '900' },
  profileEmail: { color: BRAND.colors.invertedMuted, fontSize: 11, marginTop: 3 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#41D49A' },
  statusText: { color: '#BFEEDD', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  sectionLabel: { color: BRAND.colors.muted, fontSize: 10, letterSpacing: 1.4, fontWeight: '900', marginTop: 4 },
  card: { backgroundColor: BRAND.colors.surface, borderRadius: 22, borderWidth: 1, borderColor: BRAND.colors.border, overflow: 'hidden' },
  row: { minHeight: 78, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 11 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: BRAND.colors.border },
  rowIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: BRAND.colors.surfaceWarm, alignItems: 'center', justifyContent: 'center' },
  rowIconText: { color: BRAND.colors.primaryStrong, fontSize: 14, fontWeight: '900' },
  rowCopy: { flex: 1 },
  rowTitle: { color: BRAND.colors.ink, fontSize: 13, fontWeight: '900' },
  rowSubtitle: { color: BRAND.colors.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  value: { color: BRAND.colors.muted, fontSize: 10, fontWeight: '900' },
  valueButton: { paddingHorizontal: 10, paddingVertical: 8, backgroundColor: BRAND.colors.primarySoft, borderRadius: 10 },
  valueButtonText: { color: BRAND.colors.primaryStrong, fontSize: 10, fontWeight: '900' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quick: { width: '48.6%', minHeight: 112, padding: 14, backgroundColor: BRAND.colors.surface, borderRadius: 20, borderWidth: 1, borderColor: BRAND.colors.border },
  quickPressed: { transform: [{ scale: 0.98 }], opacity: 0.94 },
  quickIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: BRAND.colors.surfaceWarm, alignItems: 'center', justifyContent: 'center' },
  quickIconText: { color: BRAND.colors.primaryStrong, fontSize: 16, fontWeight: '900' },
  quickTitle: { color: BRAND.colors.ink, fontSize: 14, fontWeight: '900', marginTop: 10 },
  quickSubtitle: { color: BRAND.colors.muted, fontSize: 10, marginTop: 3 },
  privacyCard: { padding: 15, borderRadius: 20, backgroundColor: BRAND.colors.primarySoft, flexDirection: 'row', gap: 11 },
  privacyIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: BRAND.colors.surface, alignItems: 'center', justifyContent: 'center' },
  privacyIconText: { color: BRAND.colors.primaryStrong, fontSize: 18 },
  privacyCopy: { flex: 1 },
  privacyTitle: { color: BRAND.colors.primaryStrong, fontSize: 12, fontWeight: '900' },
  privacyText: { color: BRAND.colors.inkSoft, fontSize: 10, lineHeight: 15, marginTop: 3 },
  signOut: { minHeight: 52, borderRadius: 15, borderWidth: 1, borderColor: '#E8B4B4', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF9F9' },
  signOutText: { color: '#A83838', fontWeight: '900' },
  pressed: { opacity: 0.82 },
  footer: { color: BRAND.colors.muted, fontSize: 10, textAlign: 'center', marginTop: 2 },
});
