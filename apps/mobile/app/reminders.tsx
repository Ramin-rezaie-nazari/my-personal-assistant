import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { Reminder, completeReminder, createReminder, deleteReminder, getReminders } from '../lib/api';

export default function RemindersScreen() {
  const [items, setItems] = useState<Reminder[]>([]);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00');
  const [type, setType] = useState('general');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await getReminders());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load reminders');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    if (!title.trim()) { setError('Add a title first.'); return; }
    try {
      setBusy(true);
      setError(null);
      await createReminder({ title: title.trim(), time: time.trim(), type: type.trim() || 'general' });
      setTitle('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create reminder');
    } finally {
      setBusy(false);
    }
  };

  const complete = async (id: string) => {
    try { await completeReminder(id); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to complete reminder'); }
  };

  const remove = async (id: string) => {
    try { await deleteReminder(id); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to delete reminder'); }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>MY PERSONAL ASSISTANT</Text>
          <Text style={styles.title}>Reminders ⏰</Text>
          <Text style={styles.subtitle}>Keep the things that matter from falling through the cracks.</Text>
        </View>
        <Link href="/" asChild><Pressable style={styles.back}><Text style={styles.backText}>Home</Text></Pressable></Link>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Add a reminder</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Drink water" placeholderTextColor="#9CA3AF" style={styles.input} />
        <View style={styles.row}>
          <TextInput value={time} onChangeText={setTime} placeholder="09:00" placeholderTextColor="#9CA3AF" style={[styles.input, styles.half]} />
          <TextInput value={type} onChangeText={setType} placeholder="general" placeholderTextColor="#9CA3AF" style={[styles.input, styles.half]} />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable onPress={() => void add()} disabled={busy} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Create reminder</Text>}
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming</Text>
        <Pressable onPress={() => void load()}><Text style={styles.refresh}>Refresh</Text></Pressable>
      </View>

      <View style={styles.card}>
        {items.length === 0 ? <Text style={styles.muted}>Nothing pending. You are all caught up. ✨</Text> : items.map((item) => (
          <View key={item.id} style={styles.reminderRow}>
            <View style={styles.reminderCopy}>
              <Text style={styles.reminderTitle}>{item.title}</Text>
              <Text style={styles.muted}>{item.type} · {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <View style={styles.actions}>
              <Pressable onPress={() => void complete(item.id)} style={styles.smallButton}><Text style={styles.smallButtonText}>Done</Text></Pressable>
              <Pressable onPress={() => void remove(item.id)} style={styles.deleteButton}><Text style={styles.deleteText}>×</Text></Pressable>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14, paddingTop: 40, paddingBottom: 40, backgroundColor: '#F7F8FA', minHeight: '100%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: '#6B7280' },
  title: { fontSize: 32, fontWeight: '800', color: '#111827', marginTop: 5 },
  subtitle: { color: '#6B7280', marginTop: 4, maxWidth: 290, lineHeight: 19 },
  back: { paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#E5E7EB', borderRadius: 12 },
  backText: { color: '#374151', fontWeight: '800', fontSize: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, gap: 11 },
  sectionTitle: { color: '#111827', fontSize: 18, fontWeight: '800' },
  input: { minHeight: 50, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 14, color: '#111827', backgroundColor: '#FFFFFF' },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  primary: { minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', marginTop: 3 },
  primaryText: { color: '#FFFFFF', fontWeight: '800' },
  pressed: { opacity: 0.75 },
  error: { color: '#B91C1C', fontSize: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  refresh: { color: '#374151', fontWeight: '700', fontSize: 12 },
  muted: { color: '#6B7280', fontSize: 12, lineHeight: 18 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  reminderCopy: { flex: 1, paddingRight: 12 },
  reminderTitle: { color: '#111827', fontWeight: '800', fontSize: 15 },
  actions: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  smallButton: { backgroundColor: '#111827', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  smallButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 11 },
  deleteButton: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: '#6B7280', fontSize: 18, lineHeight: 18 },
});
