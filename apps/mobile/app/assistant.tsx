import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppLocale, getStoredLocale, isRTL } from '../lib/i18n';
import { sendAssistantMessage } from '../lib/assistant-api';

type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string; meta?: string };

const copy = {
  en: {
    title: 'Your Assistant', subtitle: 'Tell me what you need. I will use your context, plans and preferences.', placeholder: 'What should we do?', send: 'Send', back: 'Back',
    welcome: 'I’m here. Ask me to plan your day, adjust a workout, track something, or help with a decision.', error: 'I could not reach the assistant right now. Check your connection and try again.', done: 'Done', understood: 'Understood',
  },
  fa: {
    title: 'دستیار تو', subtitle: 'هر چیزی لازم داری بگو؛ از برنامه و عادت‌ها تا تصمیم‌های روزمره.', placeholder: 'چی کار کنیم؟', send: 'ارسال', back: 'برگشت',
    welcome: 'من اینجام. برای برنامه‌ریزی روز، ورزش، یادآوری یا هر تصمیمی که داری ازم کمک بگیر.', error: 'الان نتونستم به دستیار وصل بشم. اتصال اینترنت رو بررسی کن و دوباره امتحان کن.', done: 'انجام شد', understood: 'متوجه شدم',
  },
};

export default function AssistantScreen() {
  const [locale, setLocale] = useState<AppLocale>('en');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getStoredLocale().then((stored) => {
      const next = stored ?? 'en';
      setLocale(next);
      setMessages([{ id: 'welcome', role: 'assistant', text: copy[next].welcome }]);
    });
  }, []);

  const ui = copy[locale];
  const rtl = useMemo(() => isRTL(locale), [locale]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft('');
    setError(null);
    setSending(true);
    setMessages((current) => [...current, { id: `u-${Date.now()}`, role: 'user', text }]);
    try {
      const response = await sendAssistantMessage(text);
      const executionMeta = response.execution
        ? response.execution.executed ? ui.done : ui.understood
        : null;
      const meta = [executionMeta, response.intent, typeof response.confidence === 'number' ? `confidence ${Math.round(response.confidence * 100)}%` : null].filter(Boolean).join(' · ');
      setMessages((current) => [...current, { id: `a-${Date.now()}`, role: 'assistant', text: response.message, meta: meta || undefined }]);
    } catch {
      setError(ui.error);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={12}>
        <View style={[styles.header, rtl && styles.rtl]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>{rtl ? '→' : '←'} {ui.back}</Text></Pressable>
          <View style={styles.headerCenter}><Text style={styles.eyebrow}>PERSONAL BRAIN</Text><Text style={styles.title}>{ui.title}</Text></View>
          <View style={styles.brainBadge}><Text style={styles.brainEmoji}>🧠</Text></View>
        </View>
        <View style={[styles.subHeader, rtl && styles.rtl]}><Text style={styles.subtitle}>{ui.subtitle}</Text></View>
        <ScrollView contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
          {messages.map((message) => (
            <View key={message.id} style={[styles.bubble, message.role === 'user' ? styles.userBubble : styles.assistantBubble, rtl && styles.rtlBubble]}>
              <Text style={[styles.bubbleText, message.role === 'user' ? styles.userText : styles.assistantText, rtl && styles.rtlText]}>{message.text}</Text>
              {message.meta ? <Text style={[styles.meta, rtl && styles.rtlText]}>{message.meta}</Text> : null}
            </View>
          ))}
          {sending ? <View style={[styles.bubble, styles.assistantBubble]}><View style={styles.typing}><ActivityIndicator size="small" /><Text style={styles.meta}>{locale === 'fa' ? 'دارم فکر می‌کنم…' : 'Thinking…'}</Text></View></View> : null}
          {error ? <View style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></View> : null}
        </ScrollView>
        <View style={[styles.composer, rtl && styles.rtl]}>
          <TextInput value={draft} onChangeText={setDraft} onSubmitEditing={() => void send()} placeholder={ui.placeholder} placeholderTextColor="#9CA3AF" style={[styles.input, rtl && styles.rtlInput]} multiline maxLength={1000} />
          <Pressable disabled={!draft.trim() || sending} onPress={() => void send()} style={({ pressed }) => [styles.sendButton, (!draft.trim() || sending) && styles.disabled, pressed && styles.pressed]}>
            <Text style={styles.sendText}>{sending ? '…' : ui.send}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' }, flex: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }, rtl: { flexDirection: 'row-reverse' }, backButton: { width: 82, paddingVertical: 8 }, backText: { color: '#374151', fontWeight: '800', fontSize: 13 }, headerCenter: { flex: 1, alignItems: 'center' }, eyebrow: { color: '#9CA3AF', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 }, title: { color: '#111827', fontSize: 18, fontWeight: '900', marginTop: 2 }, brainBadge: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' }, brainEmoji: { fontSize: 20 }, subHeader: { paddingHorizontal: 18, paddingVertical: 13, backgroundColor: '#FFFFFF' }, subtitle: { color: '#6B7280', fontSize: 13, lineHeight: 19, textAlign: 'center' }, messages: { flexGrow: 1, padding: 18, gap: 10, paddingBottom: 22 }, bubble: { maxWidth: '88%', borderRadius: 20, padding: 14 }, assistantBubble: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderBottomLeftRadius: 7 }, userBubble: { alignSelf: 'flex-end', backgroundColor: '#111827', borderBottomRightRadius: 7 }, rtlBubble: { borderBottomLeftRadius: 20, borderBottomRightRadius: 7 }, bubbleText: { fontSize: 15, lineHeight: 22 }, userText: { color: '#FFFFFF' }, assistantText: { color: '#111827' }, rtlText: { textAlign: 'right' }, meta: { marginTop: 6, color: '#9CA3AF', fontSize: 10, lineHeight: 14 }, typing: { flexDirection: 'row', alignItems: 'center', gap: 8 }, errorCard: { backgroundColor: '#FEF2F2', borderRadius: 14, padding: 12 }, errorText: { color: '#B91C1C', fontSize: 12, lineHeight: 18 }, composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' }, input: { flex: 1, minHeight: 48, maxHeight: 120, borderRadius: 16, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#F9FAFB', paddingHorizontal: 14, paddingVertical: 11, color: '#111827', fontSize: 15 }, rtlInput: { textAlign: 'right' }, sendButton: { minWidth: 70, minHeight: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', paddingHorizontal: 14 }, sendText: { color: '#FFFFFF', fontWeight: '900' }, disabled: { opacity: 0.4 }, pressed: { opacity: 0.8 },
});
