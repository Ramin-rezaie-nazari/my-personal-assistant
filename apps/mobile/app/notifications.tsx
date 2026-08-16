import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Notification,
  generateSmartNotifications,
  getNotifications,
  hasAuthSession,
  markAllNotificationsRead,
  markNotificationRead,
} from '../lib/api';
import { AppLocale, getStoredLocale } from '../lib/i18n';
import { BRAND } from '../lib/branding';

const TYPE_MARK: Record<string, string> = {
  hydration: 'H',
  nutrition: 'N',
  workout: 'W',
  habit: 'A',
  supplement: 'S',
  reminder: 'R',
};

const copy = {
  en: {
    eyebrow: 'PERSONAL ASSISTANT', title: 'Notifications', subtitle: 'Useful nudges from your assistant, ranked so the important ones rise to the top.',
    home: 'Home', calendar: 'Calendar', today: 'Today', unread: 'Unread', all: 'All', markAll: 'Mark all as read',
    generate: 'Refresh suggestions', generating: 'Refreshing…', retry: 'Retry', unavailable: 'Inbox unavailable',
    emptyUnreadTitle: 'You’re all caught up', emptyUnreadBody: 'No unread assistant notifications right now.',
    emptyAllTitle: 'No notifications yet', emptyAllBody: 'Your assistant will surface useful nudges here as your day changes.',
    markRead: 'Mark as read', read: 'Read', important: 'Important', helpful: 'Helpful', nice: 'Nice to know',
    generated: (count: number) => count ? `${count} new suggestion${count === 1 ? '' : 's'} added.` : 'No new suggestions right now.',
  },
  fa: {
    eyebrow: 'دستیار شخصی', title: 'اعلان‌ها', subtitle: 'یادآوری‌ها و پیشنهادهای دستیار که مهم‌ترها در اولویت نمایش داده می‌شوند.',
    home: 'خانه', calendar: 'تقویم', today: 'امروز', unread: 'خوانده‌نشده', all: 'همه', markAll: 'همه را خوانده‌شده کن',
    generate: 'به‌روزرسانی پیشنهادها', generating: 'در حال به‌روزرسانی…', retry: 'تلاش دوباره', unavailable: 'صندوق اعلان در دسترس نیست',
    emptyUnreadTitle: 'همه‌چیز مرتبه', emptyUnreadBody: 'فعلاً اعلان خوانده‌نشده‌ای از طرف دستیار نداری.',
    emptyAllTitle: 'هنوز اعلانی نیست', emptyAllBody: 'هر وقت چیزی در روزت نیاز به توجه داشته باشد، اینجا می‌بینی.',
    markRead: 'خوانده‌شده', read: 'خوانده‌شده', important: 'مهم', helpful: 'مفید', nice: 'برای اطلاع',
    generated: (count: number) => count ? `${count} پیشنهاد جدید اضافه شد.` : 'فعلاً پیشنهاد جدیدی وجود ندارد.',
  },
} as const;

function priorityLabel(priority: number, text: any) {
  return priority <= 1 ? text.important : priority === 2 ? text.helpful : text.nice;
}

export default function NotificationsScreen() {
  const [locale, setLocale] = useState<AppLocale>('en');
  const [items, setItems] = useState<Notification[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const text = copy[locale];
  const rtl = locale === 'fa';

  const load = useCallback(async (includeRead = showAll) => {
    try {
      setError(null);
      setItems(await getNotifications(includeRead));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showAll]);

  useEffect(() => {
    let mounted = true;
    void Promise.all([getStoredLocale(), hasAuthSession()]).then(async ([stored, authenticated]) => {
      if (!mounted) return;
      if (stored) setLocale(stored);
      if (!authenticated) {
        router.replace('/auth');
        return;
      }
      await load(showAll);
    }).catch((err) => {
      if (!mounted) return;
      setError(err instanceof Error ? err.message : 'Unable to start notifications.');
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [load, showAll]);

  const unreadCount = useMemo(() => items.filter((item) => !item.readAt).length, [items]);

  const setFilter = useCallback(async (all: boolean) => {
    setShowAll(all);
    setLoading(true);
    await load(all);
  }, [load]);

  const read = async (id: string) => {
    try {
      setBusyId(id);
      await markNotificationRead(id);
      if (showAll) {
        setItems((current) => current.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
      } else {
        setItems((current) => current.filter((item) => item.id !== id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to mark notification as read.');
    } finally {
      setBusyId(null);
    }
  };

  const clearAll = async () => {
    try {
      setClearing(true);
      await markAllNotificationsRead();
      if (showAll) {
        setItems((current) => current.map((item) => ({ ...item, readAt: new Date().toISOString() })));
      } else {
        setItems([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to mark all notifications as read.');
    } finally {
      setClearing(false);
    }
  };

  const generate = async () => {
    try {
      setGenerating(true);
      setMessage(null);
      const result = await generateSmartNotifications();
      setMessage(text.generated(result.created));
      await load(showAll);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to refresh suggestions.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center} accessibilityLabel="Loading notifications">
        <View style={styles.loadingMark}><Text style={styles.loadingMarkText}>N</Text></View>
        <ActivityIndicator color={BRAND.colors.primaryStrong} style={styles.spinner} />
      </View>
    );
  }

  const emptyTitle = showAll ? text.emptyAllTitle : text.emptyUnreadTitle;
  const emptyBody = showAll ? text.emptyAllBody : text.emptyUnreadBody;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(showAll); }} />}
      >
        <View style={[styles.nav, rtl && styles.rtl]}>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/')}><Text style={styles.navText}>{rtl ? '→ ' : '← '}{text.home}</Text></Pressable>
          <View style={styles.navRight}>
            <Pressable accessibilityRole="button" onPress={() => router.push('/calendar')}><Text style={styles.navText}>{text.calendar}</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push('/daily')}><Text style={styles.navText}>{text.today}</Text></Pressable>
          </View>
        </View>

        <View style={[styles.header, rtl && styles.rtl]}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>{text.eyebrow}</Text>
            <Text style={styles.title}>{text.title}</Text>
            <Text style={styles.subtitle}>{text.subtitle}</Text>
          </View>
          <View style={styles.countBadge}><Text style={styles.count}>{unreadCount}</Text><Text style={styles.countLabel}>{text.unread}</Text></View>
        </View>

        <View style={styles.tabs}>
          <Pressable accessibilityRole="button" onPress={() => void setFilter(false)} style={[styles.tab, !showAll && styles.tabActive]}><Text style={[styles.tabText, !showAll && styles.tabTextActive]}>{text.unread}</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => void setFilter(true)} style={[styles.tab, showAll && styles.tabActive]}><Text style={[styles.tabText, showAll && styles.tabTextActive]}>{text.all}</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => void generate()} disabled={generating} style={styles.generateButton}><Text style={styles.generateText}>{generating ? text.generating : text.generate}</Text></Pressable>
        </View>

        {message ? <View style={styles.messageCard}><Text style={styles.messageText}>{message}</Text></View> : null}

        {items.length > 0 && unreadCount > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => void clearAll()} disabled={clearing} style={styles.clearButton}>
            <Text style={styles.clearText}>{clearing ? (locale === 'fa' ? 'در حال انجام…' : 'Working…') : `${text.markAll} · ${unreadCount}`}</Text>
          </Pressable>
        ) : null}

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>{text.unavailable}</Text>
            <Text style={styles.body}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => void load(showAll)} style={styles.button}><Text style={styles.buttonText}>{text.retry}</Text></Pressable>
          </View>
        ) : null}

        {!error && items.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyMark}><Text style={styles.emptyMarkText}>✓</Text></View>
            <Text style={styles.cardTitle}>{emptyTitle}</Text>
            <Text style={styles.body}>{emptyBody}</Text>
          </View>
        ) : null}

        {items.map((item) => {
          const readState = Boolean(item.readAt);
          const mark = TYPE_MARK[item.type] ?? 'M';
          return (
            <View key={item.id} style={[styles.card, readState && styles.readCard]}>
              <View style={[styles.row, rtl && styles.rtl]}>
                <View style={[styles.typeMark, readState && styles.readMark]}><Text style={styles.typeMarkText}>{mark}</Text></View>
                <View style={styles.copy}>
                  <View style={styles.metaRow}>
                    <Text style={styles.priority}>{priorityLabel(item.priority, text)}</Text>
                    <Text style={styles.type}>{item.type}</Text>
                    {readState ? <Text style={styles.readTag}>{text.read}</Text> : null}
                  </View>
                  <Text style={[styles.cardTitle, readState && styles.readTitle]}>{item.title}</Text>
                  {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
                  <Text style={styles.meta}>{new Date(item.scheduledAt ?? item.createdAt).toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US')}</Text>
                </View>
              </View>
              {!readState ? (
                <Pressable accessibilityRole="button" onPress={() => void read(item.id)} disabled={busyId === item.id} style={styles.button}>
                  <Text style={styles.buttonText}>{busyId === item.id ? '…' : text.markRead}</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.colors.canvas },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BRAND.colors.canvas },
  content: { padding: 20, gap: 14, paddingBottom: 36 },
  loadingMark: { width: 68, height: 68, borderRadius: 20, backgroundColor: BRAND.colors.ink, alignItems: 'center', justifyContent: 'center' },
  loadingMarkText: { color: BRAND.colors.white, fontSize: 27, fontWeight: '900' },
  spinner: { marginTop: 14 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navRight: { flexDirection: 'row', gap: 18 },
  rtl: { direction: 'rtl' },
  navText: { fontWeight: '800', color: BRAND.colors.ink, fontSize: 12 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 11, letterSpacing: 1.5, fontWeight: '900', color: BRAND.colors.muted },
  title: { fontSize: 31, fontWeight: '900', color: BRAND.colors.ink, marginTop: 3 },
  subtitle: { fontSize: 14, lineHeight: 20, color: BRAND.colors.muted, marginTop: 4 },
  countBadge: { minWidth: 54, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 15, backgroundColor: BRAND.colors.primarySoft, alignItems: 'center' },
  count: { color: BRAND.colors.primaryStrong, fontSize: 18, fontWeight: '900' },
  countLabel: { color: BRAND.colors.primary, fontSize: 9, fontWeight: '800', marginTop: 1 },
  tabs: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  tab: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: BRAND.colors.surface },
  tabActive: { backgroundColor: BRAND.colors.ink },
  tabText: { color: BRAND.colors.muted, fontWeight: '900', fontSize: 11 },
  tabTextActive: { color: BRAND.colors.white },
  generateButton: { marginLeft: 'auto', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: BRAND.colors.primarySoft },
  generateText: { color: BRAND.colors.primaryStrong, fontWeight: '900', fontSize: 10 },
  messageCard: { backgroundColor: '#ECFDF3', borderRadius: 14, padding: 12 },
  messageText: { color: '#166534', fontSize: 12, fontWeight: '800' },
  clearButton: { alignSelf: 'flex-start', backgroundColor: BRAND.colors.border, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 12 },
  clearText: { fontWeight: '900', color: BRAND.colors.ink, fontSize: 11 },
  errorCard: { backgroundColor: '#FEF2F2', borderRadius: 18, padding: 16, gap: 5 },
  errorTitle: { color: '#991B1B', fontWeight: '900', fontSize: 13 },
  emptyCard: { backgroundColor: BRAND.colors.surface, borderRadius: 20, padding: 24, alignItems: 'flex-start', gap: 8 },
  emptyMark: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#ECFDF3', alignItems: 'center', justifyContent: 'center' },
  emptyMarkText: { color: '#15803D', fontSize: 20, fontWeight: '900' },
  card: { backgroundColor: BRAND.colors.surface, borderRadius: 20, padding: 18, gap: 10 },
  readCard: { opacity: 0.68 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  typeMark: { width: 42, height: 42, borderRadius: 14, backgroundColor: BRAND.colors.primary, alignItems: 'center', justifyContent: 'center' },
  readMark: { backgroundColor: BRAND.colors.border },
  typeMarkText: { color: BRAND.colors.white, fontSize: 13, fontWeight: '900' },
  copy: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
  priority: { fontSize: 10, fontWeight: '900', color: BRAND.colors.ink, textTransform: 'uppercase' },
  type: { fontSize: 10, color: BRAND.colors.muted, fontWeight: '800' },
  readTag: { fontSize: 9, color: '#15803D', fontWeight: '900' },
  cardTitle: { fontSize: 17, fontWeight: '900', color: BRAND.colors.ink },
  readTitle: { color: BRAND.colors.inkSoft },
  body: { fontSize: 13, lineHeight: 20, color: '#4B5563', marginTop: 5 },
  meta: { fontSize: 10, color: '#9CA3AF', fontWeight: '700', marginTop: 8 },
  button: { alignSelf: 'flex-start', backgroundColor: BRAND.colors.ink, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 11 },
  buttonText: { color: BRAND.colors.white, fontWeight: '900', fontSize: 11 },
});
