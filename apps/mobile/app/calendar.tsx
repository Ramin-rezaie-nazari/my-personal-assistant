import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import {
  CalendarEvent,
  completeCalendarEvent,
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents,
  reopenCalendarEvent,
  updateCalendarEvent,
} from '../lib/calendar-api';
import { getStoredLocale, isRTL, type AppLocale } from '../lib/i18n';
import { colors, components, radius, spacing, typography } from '../lib/design-system';

const startOfDay = (value: Date) => { const d = new Date(value); d.setHours(0, 0, 0, 0); return d; };
const dayKey = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
const parseTime = (value: string) => { const match = /^(\d{2}):(\d{2})$/.exec(value); if (!match) return null; const hours = Number(match[1]); const minutes = Number(match[2]); if (hours > 23 || minutes > 59) return null; return { hours, minutes }; };
const toLocalDate = (base: Date, time: string) => { const parsed = parseTime(time); if (!parsed) return null; const d = new Date(base); d.setHours(parsed.hours, parsed.minutes, 0, 0); return d; };
const formatTime = (value: string) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const formatDay = (value: Date, locale: AppLocale) => value.toLocaleDateString(locale === 'fa' ? 'fa-IR' : undefined, { weekday: 'long', month: 'short', day: 'numeric' });

export default function CalendarScreen() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locale, setLocale] = useState<AppLocale>('en');
  const [rangeStart, setRangeStart] = useState(() => startOfDay(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const rtl = isRTL(locale);
  const rangeEnd = useMemo(() => new Date(rangeStart.getTime() + 7 * 24 * 60 * 60 * 1000), [rangeStart]);

  const load = useCallback(async () => {
    try {
      setError(null);
      setEvents(await getCalendarEvents(rangeStart.toISOString(), rangeEnd.toISOString()));
    } catch (err) {
      setError(err instanceof Error ? err.message : (locale === 'fa' ? 'تقویم بارگذاری نشد.' : 'Unable to load calendar.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locale, rangeEnd, rangeStart]);

  useEffect(() => { void getStoredLocale().then((value) => { if (value) setLocale(value); }); }, []);
  useEffect(() => { void load(); }, [load]);

  const resetEditor = () => { setEditingId(null); setTitle(''); setStartTime(''); setEndTime(''); };
  const selectDay = (day: Date) => { setSelectedDay(day); if (!editingId) { setStartTime(''); setEndTime(''); } };

  const saveEvent = async () => {
    const normalizedTitle = title.trim();
    const start = toLocalDate(selectedDay, startTime);
    const end = endTime.trim() ? toLocalDate(selectedDay, endTime) : null;
    if (!normalizedTitle || !start) { setError(locale === 'fa' ? 'عنوان و ساعت شروع را وارد کن.' : 'Add a title and a valid start time.'); return; }
    if (endTime.trim() && !end) { setError(locale === 'fa' ? 'ساعت پایان معتبر نیست.' : 'End time is invalid.'); return; }
    if (end && end <= start) { setError(locale === 'fa' ? 'ساعت پایان باید بعد از شروع باشد.' : 'End time must be after the start time.'); return; }
    try {
      setBusy(true); setError(null);
      if (editingId) await updateCalendarEvent(editingId, { title: normalizedTitle, type: 'calendar', startsAt: start.toISOString(), endsAt: end?.toISOString() ?? null });
      else await createCalendarEvent({ title: normalizedTitle, type: 'calendar', startsAt: start.toISOString(), ...(end ? { endsAt: end.toISOString() } : {}) });
      resetEditor(); await load();
    } catch (err) { setError(err instanceof Error ? err.message : (locale === 'fa' ? 'ذخیره نشد.' : 'Unable to save event.')); }
    finally { setBusy(false); }
  };

  const editEvent = (event: CalendarEvent) => { const start = new Date(event.startsAt); setSelectedDay(startOfDay(start)); setTitle(event.title); setStartTime(formatTime(event.startsAt)); setEndTime(event.endsAt ? formatTime(event.endsAt) : ''); setEditingId(event.id); setError(null); };
  const toggleComplete = async (event: CalendarEvent) => { try { setBusy(true); setError(null); if (event.completed) await reopenCalendarEvent(event.id); else await completeCalendarEvent(event.id); await load(); } catch (err) { setError(err instanceof Error ? err.message : (locale === 'fa' ? 'وضعیت رو نتونستم تغییر بدم.' : 'Unable to change event status.')); } finally { setBusy(false); } };
  const removeEvent = async (id: string) => { try { setBusy(true); setError(null); await deleteCalendarEvent(id); if (editingId === id) resetEditor(); await load(); } catch (err) { setError(err instanceof Error ? err.message : (locale === 'fa' ? 'حذف نشد.' : 'Unable to delete event.')); } finally { setBusy(false); } };

  const grouped = events.reduce<Record<string, CalendarEvent[]>>((acc, event) => { const key = dayKey(new Date(event.startsAt)); (acc[key] ??= []).push(event); return acc; }, {});
  const days = Array.from({ length: 7 }, (_, index) => new Date(rangeStart.getTime() + index * 24 * 60 * 60 * 1000));

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.content, rtl && styles.rtl]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <View style={styles.nav}><Link href="/" asChild><Pressable><Text style={styles.link}>{locale === 'fa' ? 'خانه' : 'Home'}</Text></Pressable></Link><Link href="/daily" asChild><Pressable><Text style={styles.link}>{locale === 'fa' ? 'امروز' : 'Today'}</Text></Pressable></Link></View>
        <Text style={styles.eyebrow}>MY PERSONAL ASSISTANT</Text>
        <Text style={styles.title}>{locale === 'fa' ? 'تقویم' : 'Calendar'}</Text>
        <Text style={styles.subtitle}>{locale === 'fa' ? 'برنامه روزهایت را کنار یادآوری‌ها و دستیار شخصی نگه دار.' : 'Keep your schedule connected to reminders and the assistant.'}</Text>

        <View style={styles.weekRow}>{days.map((day) => { const active = dayKey(day) === dayKey(selectedDay); return <Pressable key={dayKey(day)} onPress={() => selectDay(day)} style={[styles.dayChip, active && styles.dayChipActive]}><Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{day.toLocaleDateString(locale === 'fa' ? 'fa-IR' : undefined, { weekday: 'short' })}</Text><Text style={[styles.dayNumber, active && styles.dayChipTextActive]}>{day.getDate()}</Text></Pressable>; })}</View>

        <View style={[styles.card, components.card]}>
          <View style={styles.editorHeader}><Text style={styles.cardTitle}>{editingId ? (locale === 'fa' ? 'ویرایش رویداد' : 'Edit event') : (locale === 'fa' ? 'افزودن رویداد' : 'Add event')}</Text>{editingId ? <Pressable onPress={resetEditor}><Text style={styles.link}>{locale === 'fa' ? 'لغو' : 'Cancel'}</Text></Pressable> : null}</View>
          <TextInput value={title} onChangeText={setTitle} placeholder={locale === 'fa' ? 'عنوان' : 'Title'} placeholderTextColor={colors.textMuted} style={styles.input} />
          <View style={styles.row}><TextInput value={startTime} onChangeText={setStartTime} placeholder={locale === 'fa' ? 'شروع 18:30' : 'Start 18:30'} placeholderTextColor={colors.textMuted} keyboardType="numbers-and-punctuation" style={[styles.input, styles.half]} /><TextInput value={endTime} onChangeText={setEndTime} placeholder={locale === 'fa' ? 'پایان 19:30' : 'End 19:30'} placeholderTextColor={colors.textMuted} keyboardType="numbers-and-punctuation" style={[styles.input, styles.half]} /></View>
          <Text style={styles.selectedHint}>{formatDay(selectedDay, locale)}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable onPress={() => void saveEvent()} disabled={busy} style={styles.primary}><Text style={styles.primaryText}>{busy ? (locale === 'fa' ? 'در حال ذخیره…' : 'Saving…') : editingId ? (locale === 'fa' ? 'ذخیره تغییرات' : 'Save changes') : (locale === 'fa' ? 'افزودن به تقویم' : 'Add to calendar')}</Text></Pressable>
        </View>

        <View style={styles.switchRow}><Pressable onPress={() => { const next = new Date(rangeStart.getTime() - 7 * 24 * 60 * 60 * 1000); setRangeStart(startOfDay(next)); setSelectedDay(startOfDay(next)); }}><Text style={styles.link}>← {locale === 'fa' ? 'هفته قبل' : 'Previous'}</Text></Pressable><Pressable onPress={() => { const today = startOfDay(new Date()); setRangeStart(today); setSelectedDay(today); }}><Text style={styles.link}>{locale === 'fa' ? 'این هفته' : 'This week'}</Text></Pressable><Pressable onPress={() => { const next = new Date(rangeStart.getTime() + 7 * 24 * 60 * 60 * 1000); setRangeStart(startOfDay(next)); setSelectedDay(startOfDay(next)); }}><Text style={styles.link}>{locale === 'fa' ? 'هفته بعد' : 'Next'} →</Text></Pressable></View>

        {Object.entries(grouped).map(([day, dayEvents]) => <View key={day} style={styles.dayBlock}><Text style={styles.dayTitle}>{formatDay(new Date(`${day}T00:00:00`), locale)}</Text>{dayEvents.map((event) => <View key={event.id} style={[styles.event, event.completed && styles.completed]}><View style={styles.eventTime}><Text style={styles.time}>{formatTime(event.startsAt)}</Text>{event.endsAt ? <Text style={styles.type}>{formatTime(event.endsAt)}</Text> : null}</View><View style={styles.eventCopy}><Text style={styles.eventTitle}>{event.title}</Text><Text style={styles.type}>{event.type}</Text><View style={styles.actions}><Pressable onPress={() => void toggleComplete(event)}><Text style={styles.link}>{event.completed ? (locale === 'fa' ? 'بازکردن' : 'Reopen') : (locale === 'fa' ? 'انجام شد' : 'Complete')}</Text></Pressable><Pressable onPress={() => editEvent(event)}><Text style={styles.link}>{locale === 'fa' ? 'ویرایش' : 'Edit'}</Text></Pressable><Pressable onPress={() => void removeEvent(event.id)}><Text style={styles.delete}>{locale === 'fa' ? 'حذف' : 'Delete'}</Text></Pressable></View></View></View>)}</View>)}
        {!events.length ? <View style={styles.card}><Text style={styles.cardTitle}>{locale === 'fa' ? 'تقویمت خالیه ✨' : 'Your calendar is clear ✨'}</Text><Text style={styles.subtitle}>{locale === 'fa' ? 'برای شروع اولین رویدادت را اضافه کن.' : 'Add your first event above to get started.'}</Text></View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:colors.paper}, center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.paper}, content:{padding:spacing.xl,gap:spacing.md,paddingBottom:spacing.xxxl,backgroundColor:colors.paper}, rtl:{direction:'rtl'}, nav:{flexDirection:'row',justifyContent:'space-between'}, link:{fontWeight:'800',color:colors.text}, eyebrow:{...typography.eyebrow,color:colors.textMuted,marginTop:8}, title:{...typography.title1,color:colors.text}, subtitle:{...typography.body,color:colors.textMuted}, weekRow:{flexDirection:'row',gap:6}, dayChip:{flex:1,alignItems:'center',paddingVertical:10,borderRadius:radius.md,backgroundColor:colors.surfaceWarm,borderWidth:1,borderColor:colors.border}, dayChipActive:{backgroundColor:colors.ink,borderColor:colors.ink}, dayChipText:{fontSize:10,fontWeight:'800',color:colors.textMuted}, dayNumber:{fontSize:15,fontWeight:'900',color:colors.text,marginTop:2}, dayChipTextActive:{color:colors.surface}, card:{gap:10}, editorHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, cardTitle:{fontSize:18,fontWeight:'900',color:colors.text}, input:{minHeight:50,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,paddingHorizontal:14,color:colors.text,backgroundColor:colors.surface}, row:{flexDirection:'row',gap:10}, half:{flex:1}, selectedHint:{...typography.caption,color:colors.textMuted}, primary:{minHeight:52,borderRadius:radius.md,backgroundColor:colors.ink,alignItems:'center',justifyContent:'center'}, primaryText:{color:colors.surface,fontWeight:'900'}, error:{color:colors.dangerText,fontWeight:'700'}, switchRow:{flexDirection:'row',justifyContent:'space-between'}, dayBlock:{gap:8}, dayTitle:{fontSize:16,fontWeight:'900',color:colors.text,marginTop:8}, event:{backgroundColor:colors.surface,borderRadius:radius.lg,padding:16,flexDirection:'row',gap:14,borderWidth:1,borderColor:colors.border}, completed:{opacity:0.55}, eventTime:{width:70}, time:{fontSize:15,fontWeight:'900',color:colors.text}, type:{fontSize:11,fontWeight:'800',color:colors.textMuted,marginTop:3,textTransform:'uppercase'}, eventCopy:{flex:1}, eventTitle:{fontSize:16,fontWeight:'800',color:colors.text}, actions:{flexDirection:'row',gap:14,marginTop:9,flexWrap:'wrap'}, delete:{fontSize:12,fontWeight:'800',color:colors.dangerText} });
