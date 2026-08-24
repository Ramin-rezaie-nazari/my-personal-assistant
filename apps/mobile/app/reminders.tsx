import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Reminder, completeReminder, createReminder, deleteReminder, getReminders, hasAuthSession, reopenReminder, updateReminder } from '../lib/api';
import { colors, radius, spacing, typography, shadows } from '../lib/design-system';
import { AnimatedIn, MotionPress } from '../lib/motion-components';
import { AppLocale, getStoredLocale, isRTL } from '../lib/i18n';

const copy = {
  en: {
    eyebrow: 'MY PERSONAL ASSISTANT', title: 'Reminders', subtitle: 'Keep the things that matter from falling through the cracks.', home: 'Home', add: 'Add a reminder', titlePlaceholder: 'e.g. Drink water', timePlaceholder: '09:00', typePlaceholder: 'general', create: 'Create reminder', creating: 'Creating…', upcoming: 'Upcoming', all: 'All', pending: 'Pending', refresh: 'Refresh', nothing: 'Nothing pending. You are all caught up. ✨', noReminders: 'No reminders yet.', done: 'Done', reopen: 'Reopen', edit: 'Edit', save: 'Save changes', saving: 'Saving…', cancel: 'Cancel', delete: 'Delete', invalidTitle: 'Add a title first.', loadError: 'Unable to load reminders.', createError: 'Unable to create reminder.', updateError: 'Unable to update reminder.', completeError: 'Unable to update reminder status.', deleteError: 'Unable to delete reminder.', retry: 'Retry', timezoneHint: 'Times are scheduled in your account timezone.', completed: 'Completed',
  },
  fa: {
    eyebrow: 'دستیار شخصی', title: 'یادآوری‌ها', subtitle: 'کارهای مهمت را طوری ثبت کن که از قلم نیفتند.', home: 'خانه', add: 'افزودن یادآوری', titlePlaceholder: 'مثلاً نوشیدن آب', timePlaceholder: '09:00', typePlaceholder: 'عمومی', create: 'ساخت یادآوری', creating: 'در حال ساخت…', upcoming: 'یادآوری‌ها', all: 'همه', pending: 'در انتظار', refresh: 'تازه‌سازی', nothing: 'هیچ یادآوری در انتظاری نیست. همه‌چیز مرتبه. ✨', noReminders: 'هنوز یادآوری‌ای ثبت نشده.', done: 'انجام شد', reopen: 'بازکردن دوباره', edit: 'ویرایش', save: 'ذخیره تغییرات', saving: 'در حال ذخیره…', cancel: 'لغو', delete: 'حذف', invalidTitle: 'اول یک عنوان وارد کن.', loadError: 'بارگذاری یادآوری‌ها انجام نشد.', createError: 'ساخت یادآوری انجام نشد.', updateError: 'ویرایش یادآوری انجام نشد.', completeError: 'وضعیت یادآوری تغییر نکرد.', deleteError: 'حذف یادآوری انجام نشد.', retry: 'تلاش دوباره', timezoneHint: 'زمان یادآوری با منطقه زمانی حساب تو ثبت می‌شود.', completed: 'انجام‌شده',
  },
} as const;

function formatTime(value: string, locale: AppLocale) {
  return new Date(value).toLocaleTimeString(locale === 'fa' || locale.startsWith('fa-') ? 'fa-IR' : undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function RemindersScreen() {
  const [locale, setLocale] = useState<AppLocale>('en');
  const [items, setItems] = useState<Reminder[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00');
  const [type, setType] = useState('general');
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState('09:00');
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const text = copy[locale === 'fa' || locale.startsWith('fa-') ? 'fa' : 'en'];
  const rtl = isRTL(locale);

  const load = useCallback(async (includeCompleted = showAll) => {
    try {
      setError(null);
      setItems(await getReminders(includeCompleted));
    } catch {
      setError(text.loadError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showAll, text.loadError]);

  useEffect(() => {
    let mounted = true;
    void Promise.all([getStoredLocale(), hasAuthSession()]).then(async ([storedLocale, authenticated]) => {
      if (!mounted) return;
      if (storedLocale) setLocale(storedLocale);
      if (!authenticated) {
        router.replace('/auth');
        return;
      }
      await load(showAll);
    }).catch(() => {
      if (!mounted) return;
      setError(text.loadError);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [load, showAll, text.loadError]);

  const add = async () => {
    if (!title.trim()) { setError(text.invalidTitle); return; }
    try {
      setBusy(true); setError(null);
      await createReminder({ title: title.trim(), time: time.trim(), type: type.trim() || 'general' });
      setTitle(''); setTime('09:00'); setType('general');
      await load(showAll);
    } catch {
      setError(text.createError);
    } finally { setBusy(false); }
  };

  const complete = async (item: Reminder) => {
    try {
      setBusyId(item.id);
      setError(null);
      if (item.completed) await reopenReminder(item.id); else await completeReminder(item.id);
      await load(showAll);
    } catch { setError(text.completeError); } finally { setBusyId(null); }
  };

  const remove = async (id: string) => {
    try {
      setBusyId(id); setError(null);
      await deleteReminder(id);
      await load(showAll);
    } catch { setError(text.deleteError); } finally { setBusyId(null); }
  };

  const openEdit = (item: Reminder) => {
    setEditing(item); setEditTitle(item.title); setEditTime(formatTime(item.scheduledAt, 'en'));
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      setBusy(true); setError(null);
      const updated = await updateReminder(editing.id, { title: editTitle.trim(), time: editTime.trim() });
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
      setEditing(null);
    } catch { setError(text.updateError); } finally { setBusy(false); }
  };

  const pendingCount = items.filter((item) => !item.completed).length;

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.ink} /><Text style={styles.loadingText}>{rtl ? 'در حال بارگذاری…' : 'Loading…'}</Text></View>;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(showAll); }} />}
      >
        <AnimatedIn>
          <View style={[styles.header, rtl && styles.rtl]}>
            <View style={styles.headerCopy}><Text style={styles.eyebrow}>{text.eyebrow}</Text><Text style={styles.title}>{text.title} ⏰</Text><Text style={styles.subtitle}>{text.subtitle}</Text></View>
            <Link href="/" asChild><MotionPress style={styles.back}><Text style={styles.backText}>{text.home}</Text></MotionPress></Link>
          </View>
        </AnimatedIn>

        <AnimatedIn delay={100}>
          <View style={[styles.card, shadows.subtle]}>
            <Text style={[styles.sectionTitle, rtl && styles.textRight]}>{text.add}</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder={text.titlePlaceholder} placeholderTextColor={colors.textMuted} style={[styles.input, rtl && styles.inputRtl]} textAlign={rtl ? 'right' : 'left'} />
            <View style={[styles.row, rtl && styles.rtl]}>
              <TextInput value={time} onChangeText={setTime} placeholder={text.timePlaceholder} placeholderTextColor={colors.textMuted} style={[styles.input, styles.half, rtl && styles.inputRtl]} keyboardType="numbers-and-punctuation" maxLength={5} textAlign={rtl ? 'right' : 'left'} />
              <TextInput value={type} onChangeText={setType} placeholder={text.typePlaceholder} placeholderTextColor={colors.textMuted} style={[styles.input, styles.half, rtl && styles.inputRtl]} textAlign={rtl ? 'right' : 'left'} />
            </View>
            <Text style={[styles.hint, rtl && styles.textRight]}>{text.timezoneHint}</Text>
            {error ? <View style={styles.errorBox}><Text style={[styles.error, rtl && styles.textRight]}>{error}</Text><MotionPress onPress={() => void load(showAll)} style={styles.retry}><Text style={styles.retryText}>{text.retry}</Text></MotionPress></View> : null}
            <MotionPress onPress={() => void add()} disabled={busy} style={styles.primary}>{busy ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryText}>{text.create}</Text>}</MotionPress>
          </View>
        </AnimatedIn>

        <AnimatedIn delay={180}>
          <View style={[styles.sectionHeader, rtl && styles.rtl]}>
            <View><Text style={[styles.sectionTitle, rtl && styles.textRight]}>{text.upcoming}</Text><Text style={[styles.countText, rtl && styles.textRight]}>{showAll ? items.length : pendingCount} {rtl ? 'مورد' : 'items'}</Text></View>
            <View style={styles.filters}>
              <MotionPress onPress={() => { setShowAll(false); setLoading(true); void load(false); }} style={[styles.filter, ...(showAll ? [] : [styles.filterActive])]}><Text style={[styles.filterText, ...(showAll ? [] : [styles.filterTextActive])]}>{text.pending}</Text></MotionPress>
              <MotionPress onPress={() => { setShowAll(true); setLoading(true); void load(true); }} style={[styles.filter, ...(showAll ? [styles.filterActive] : [])]}><Text style={[styles.filterText, ...(showAll ? [styles.filterTextActive] : [])]}>{text.all}</Text></MotionPress>
              <MotionPress onPress={() => void load(showAll)}><Text style={styles.refresh}>{text.refresh}</Text></MotionPress>
            </View>
          </View>
        </AnimatedIn>

        <AnimatedIn delay={240}>
          <View style={[styles.card, shadows.subtle]}>
            {items.length === 0 ? <Text style={[styles.muted, rtl && styles.textRight]}>{showAll ? text.noReminders : text.nothing}</Text> : items.map((item, index) => (
              <AnimatedIn key={item.id} delay={260 + index * 50}>
                <View style={[styles.reminderRow, rtl && styles.rtl, index === items.length - 1 && styles.lastRow]}>
                  <View style={[styles.reminderCopy, rtl && { paddingRight: 0, paddingLeft: 12 }]}>
                    <View style={[styles.titleLine, rtl && styles.rtl]}><Text style={[styles.reminderTitle, item.completed && styles.completedTitle, rtl && styles.textRight]}>{item.title}</Text><View style={[styles.badge, item.completed && styles.completedBadge]}><Text style={styles.badgeText}>{item.completed ? text.completed : text.pending}</Text></View></View>
                    <Text style={[styles.muted, rtl && styles.textRight]}>{item.type} · {formatTime(item.scheduledAt, locale)}</Text>
                  </View>
                  <View style={styles.actions}>
                    <MotionPress onPress={() => openEdit(item)} disabled={busyId === item.id} style={styles.smallButton}><Text style={styles.smallButtonText}>{text.edit}</Text></MotionPress>
                    <MotionPress onPress={() => void complete(item)} disabled={busyId === item.id} style={styles.smallButton}><Text style={styles.smallButtonText}>{item.completed ? text.reopen : text.done}</Text></MotionPress>
                    <MotionPress onPress={() => void remove(item.id)} disabled={busyId === item.id} style={styles.deleteButton}><Text style={styles.deleteText}>×</Text></MotionPress>
                  </View>
                </View>
              </AnimatedIn>
            ))}
          </View>
        </AnimatedIn>
      </ScrollView>

      <Modal visible={Boolean(editing)} animationType="slide" transparent onRequestClose={() => setEditing(null)}>
        <View style={styles.modalBackdrop}><View style={[styles.modalCard, rtl && styles.rtlCard]}>
          <Text style={[styles.sectionTitle, rtl && styles.textRight]}>{text.edit}</Text>
          <TextInput value={editTitle} onChangeText={setEditTitle} style={[styles.input, rtl && styles.inputRtl]} textAlign={rtl ? 'right' : 'left'} />
          <TextInput value={editTime} onChangeText={setEditTime} style={[styles.input, rtl && styles.inputRtl]} keyboardType="numbers-and-punctuation" maxLength={5} textAlign={rtl ? 'right' : 'left'} />
          <View style={[styles.modalActions, rtl && styles.rtl]}>
            <MotionPress onPress={() => setEditing(null)} style={styles.secondary}><Text style={styles.secondaryText}>{text.cancel}</Text></MotionPress>
            <MotionPress onPress={() => void saveEdit()} disabled={busy} style={styles.primaryModal}>{busy ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryText}>{text.save}</Text>}</MotionPress>
          </View>
        </View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.paper}, content:{padding:spacing.xl,gap:spacing.md,paddingTop:40,paddingBottom:40}, center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:colors.paper}, loadingText:{marginTop:10,color:colors.textMuted}, header:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'}, headerCopy:{flex:1,paddingRight:12}, rtl:{flexDirection:'row-reverse'}, rtlCard:{alignItems:'stretch'}, textRight:{textAlign:'right'}, eyebrow:{...typography.eyebrow,color:colors.textMuted}, title:{...typography.title1,color:colors.text,marginTop:5}, subtitle:{color:colors.textMuted,marginTop:4,maxWidth:300,lineHeight:19}, back:{paddingHorizontal:12,paddingVertical:9,backgroundColor:colors.surfaceWarm,borderRadius:radius.md}, backText:{color:colors.text,fontWeight:'800',fontSize:12}, card:{backgroundColor:colors.surface,borderRadius:radius.xl,padding:18,gap:11,borderWidth:1,borderColor:colors.border}, sectionTitle:{color:colors.text,fontSize:18,fontWeight:'800'}, input:{minHeight:50,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,paddingHorizontal:14,color:colors.text,backgroundColor:colors.surface}, inputRtl:{writingDirection:'rtl'}, row:{flexDirection:'row',gap:10}, half:{flex:1}, hint:{fontSize:11,color:colors.textMuted,lineHeight:16}, primary:{minHeight:50,borderRadius:radius.md,alignItems:'center',justifyContent:'center',backgroundColor:colors.ink,marginTop:3}, primaryModal:{flex:1,minHeight:48,borderRadius:radius.md,alignItems:'center',justifyContent:'center',backgroundColor:colors.ink}, primaryText:{color:colors.surface,fontWeight:'800'}, secondary:{flex:1,minHeight:48,borderRadius:radius.md,alignItems:'center',justifyContent:'center',backgroundColor:colors.surfaceWarm}, secondaryText:{color:colors.text,fontWeight:'800'}, errorBox:{backgroundColor:colors.dangerSurface,borderRadius:radius.md,padding:10,gap:8}, error:{color:colors.dangerText,fontSize:12}, retry:{alignSelf:'flex-start',backgroundColor:colors.surface,paddingHorizontal:10,paddingVertical:7,borderRadius:radius.sm}, retryText:{color:colors.text,fontWeight:'800',fontSize:11}, sectionHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:4}, countText:{fontSize:11,color:colors.textMuted,marginTop:2}, filters:{flexDirection:'row',alignItems:'center',gap:7}, filter:{paddingHorizontal:9,paddingVertical:7,borderRadius:radius.pill,backgroundColor:colors.surfaceWarm}, filterActive:{backgroundColor:colors.ink}, filterText:{fontSize:10,fontWeight:'800',color:colors.textMuted}, filterTextActive:{color:colors.surface}, refresh:{color:colors.text,fontWeight:'700',fontSize:12}, muted:{color:colors.textMuted,fontSize:12,lineHeight:18}, reminderRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:12,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:colors.border}, lastRow:{borderBottomWidth:0}, reminderCopy:{flex:1,paddingRight:12}, titleLine:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:4}, reminderTitle:{color:colors.text,fontWeight:'800',fontSize:15,flexShrink:1}, completedTitle:{textDecorationLine:'line-through',color:colors.textMuted}, badge:{paddingHorizontal:7,paddingVertical:4,borderRadius:radius.pill,backgroundColor:colors.surfaceWarm}, completedBadge:{backgroundColor:colors.successSurface}, badgeText:{fontSize:9,fontWeight:'800',color:colors.textMuted}, actions:{flexDirection:'row',gap:6,alignItems:'center'}, smallButton:{backgroundColor:colors.ink,paddingHorizontal:8,paddingVertical:7,borderRadius:radius.sm}, smallButtonText:{color:colors.surface,fontWeight:'800',fontSize:10}, deleteButton:{width:30,height:30,borderRadius:radius.sm,backgroundColor:colors.surfaceWarm,alignItems:'center',justifyContent:'center'}, deleteText:{color:colors.textMuted,fontSize:18,lineHeight:18}, modalBackdrop:{flex:1,backgroundColor:'rgba(0,0,0,0.32)',justifyContent:'flex-end'}, modalCard:{backgroundColor:colors.surface,borderTopLeftRadius:radius.xl,borderTopRightRadius:radius.xl,padding:22,gap:12}, modalActions:{flexDirection:'row',gap:10,marginTop:6}
});
