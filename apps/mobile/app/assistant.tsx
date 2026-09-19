import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { type AppLocale, useAppLocale } from '../lib/i18n';
import { localizedCopy } from '../lib/localized-copy';
import { AssistantHistoryTurn, getAssistantHistory, sendAssistantMessage } from '../lib/assistant-api';
import { speakAssistantText } from '../lib/assistant-tts';
import { translateTextBetweenLocales } from '../lib/runtime-translator';

type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string; meta?: string };

const copy = localizedCopy({
  en: {
    title: 'Your Assistant', subtitle: 'Tell me what you need. I will use your context, plans and preferences.', placeholder: 'What should we do?', send: 'Send', back: 'Back',
    welcome: 'I’m here. Ask me to plan your day, adjust a workout, track something, or help with a decision.', error: 'I could not reach the assistant right now. Check your connection and try again.', voiceError: 'Voice playback is unavailable on this device.', done: 'Done', understood: 'Understood', historyError: 'I could not restore the previous conversation. You can still start a new message.', speak: 'Speak', loadingHistory: 'Restoring conversation…', thinking: 'Thinking…',
  },
  fa: {
    title: 'دستیار تو', subtitle: 'هر چیزی لازم داری بگو؛ از برنامه و عادت‌ها تا تصمیم‌های روزمره.', placeholder: 'چی کار کنیم؟', send: 'ارسال', back: 'برگشت',
    welcome: 'من اینجام. برای برنامه‌ریزی روز، ورزش، یادآوری یا هر تصمیمی که داری ازم کمک بگیر.', error: 'الان نتونستم به دستیار وصل بشم. اتصال اینترنت رو بررسی کن و دوباره امتحان کن.', voiceError: 'پخش صدای دستیار روی این دستگاه در دسترس نیست.', done: 'انجام شد', understood: 'متوجه شدم', historyError: 'نتونستم گفت‌وگوی قبلی رو بازیابی کنم؛ ولی می‌تونی همین الان ادامه بدی.', speak: 'پخش صدا', loadingHistory: 'در حال بازیابی گفت‌وگو…', thinking: 'دارم فکر می‌کنم…',
  },
});

function containsPersianScript(text: string): boolean {
  return /[\u0600-\u06FF]/u.test(text);
}

async function localizeAssistantText(text: string, locale: AppLocale): Promise<string> {
  if (!text.trim() || locale === 'en') return text;
  const source: AppLocale = containsPersianScript(text) ? 'fa' : 'en';
  if (source === locale) return text;
  try { return await translateTextBetweenLocales(text, source, locale); } catch { return text; }
}

const mapUserHistory = (turns: AssistantHistoryTurn[]): ChatMessage[] => turns.filter((turn) => turn.role === 'user').map((turn) => ({
  id: turn.id,
  role: 'user',
  text: turn.text,
}));

export default function AssistantScreen() {
  const { locale, rtl } = useAppLocale();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyNotice, setHistoryNotice] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const next = locale;
      try {
        const history = await getAssistantHistory(40);
        if (!active) return;
        const userTurns = mapUserHistory(history);
        const assistantTurns = history.filter((turn) => turn.role === 'assistant');
        const localizedAssistantTurns = await Promise.all(assistantTurns.map(async (turn) => ({ id: turn.id, role: 'assistant' as const, text: await localizeAssistantText(turn.text, next), meta: turn.action })));
        if (!active) return;
        const restored = [...userTurns, ...localizedAssistantTurns].sort((a, b) => a.id.localeCompare(b.id));
        setMessages(restored.length ? restored : [{ id: 'welcome', role: 'assistant', text: copy[next].welcome }]);
      } catch {
        if (!active) return;
        setHistoryNotice(true);
        setMessages([{ id: 'welcome', role: 'assistant', text: copy[next].welcome }]);
      } finally {
        if (active) setLoadingHistory(false);
      }
    });
    return () => { active = false; };
  }, [locale]);

  const ui = copy[locale];

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft(''); setError(null); setHistoryNotice(false); setSending(true);
    setMessages((current) => [...current, { id: `u-${Date.now()}`, role: 'user', text }]);
    try {
      const canonicalInput = locale === 'en' ? text : await translateTextBetweenLocales(text, locale, 'en');
      const response = await sendAssistantMessage(canonicalInput);
      const localizedResponse = await localizeAssistantText(response.message, locale);
      const executionMeta = response.execution ? (response.execution.executed ? ui.done : ui.understood) : null;
      setMessages((current) => [...current, { id: `a-${Date.now()}`, role: 'assistant', text: localizedResponse, meta: executionMeta || undefined }]);
    } catch { setError(ui.error); }
    finally { setSending(false); }
  };

  const speak = async (message: ChatMessage) => {
    if (message.role !== 'assistant' || speakingId) return;
    setSpeakingId(message.id);
    try { await speakAssistantText(message.text, locale); }
    catch { setError(ui.voiceError); }
    finally { setSpeakingId(null); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={12}>
        <View style={[styles.header, rtl && styles.rtl]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>{rtl ? '→' : '←'} {ui.back}</Text></Pressable>
          <View style={styles.headerCenter}><Text style={styles.title}>{ui.title}</Text></View>
          <View style={styles.brainBadge}><Text style={styles.brainEmoji}>🧠</Text></View>
        </View>
        <View style={[styles.subHeader, rtl && styles.rtl]}><Text style={[styles.subtitle, rtl && styles.rtlText]}>{ui.subtitle}</Text></View>
        <ScrollView contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
          {loadingHistory ? <View style={styles.loadingHistory}><ActivityIndicator size="small" /><Text style={[styles.meta, rtl && styles.rtlText]}>{ui.loadingHistory}</Text></View> : null}
          {messages.map((message) => (
            <View key={message.id} style={[styles.bubble, message.role === 'user' ? styles.userBubble : styles.assistantBubble, rtl && styles.rtlBubble]}>
              <Text style={[styles.bubbleText, message.role === 'user' ? styles.userText : styles.assistantText, rtl && styles.rtlText]}>{message.text}</Text>
              {message.role === 'assistant' ? <Pressable onPress={() => void speak(message)} disabled={Boolean(speakingId)} style={styles.speakButton}><Text style={styles.speakText}>{speakingId === message.id ? '…' : `🔊 ${ui.speak}`}</Text></Pressable> : null}
              {message.meta ? <Text style={[styles.meta, rtl && styles.rtlText]}>{message.meta}</Text> : null}
            </View>
          ))}
          {historyNotice ? <View style={styles.noticeCard}><Text style={[styles.noticeText, rtl && styles.rtlText]}>{ui.historyError}</Text></View> : null}
          {sending ? <View style={[styles.bubble, styles.assistantBubble]}><View style={styles.typing}><ActivityIndicator size="small" /><Text style={[styles.meta, rtl && styles.rtlText]}>{ui.thinking}</Text></View></View> : null}
          {error ? <View style={styles.errorCard}><Text style={[styles.errorText, rtl && styles.rtlText]}>{error}</Text></View> : null}
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
  safe: { flex: 1, backgroundColor: '#F7F8FA' }, flex: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }, rtl: { flexDirection: 'row-reverse' }, backButton: { width: 82, paddingVertical: 8 }, backText: { color: '#374151', fontWeight: '800', fontSize: 13 }, headerCenter: { flex: 1, alignItems: 'center' }, title: { color: '#111827', fontSize: 18, fontWeight: '900', marginTop: 2 }, brainBadge: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' }, brainEmoji: { fontSize: 20 }, subHeader: { paddingHorizontal: 18, paddingVertical: 13, backgroundColor: '#FFFFFF' }, subtitle: { color: '#6B7280', fontSize: 13, lineHeight: 19, textAlign: 'center' }, messages: { flexGrow: 1, padding: 18, gap: 10, paddingBottom: 22 }, loadingHistory: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 }, bubble: { maxWidth: '88%', borderRadius: 20, padding: 14 }, assistantBubble: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderBottomLeftRadius: 7 }, userBubble: { alignSelf: 'flex-end', backgroundColor: '#111827', borderBottomRightRadius: 7 }, rtlBubble: { borderBottomLeftRadius: 20, borderBottomRightRadius: 7 }, bubbleText: { fontSize: 15, lineHeight: 22 }, userText: { color: '#FFFFFF' }, assistantText: { color: '#111827' }, rtlText: { textAlign: 'right', writingDirection: 'rtl' }, meta: { marginTop: 6, color: '#9CA3AF', fontSize: 10, lineHeight: 14 }, typing: { flexDirection: 'row', alignItems: 'center', gap: 8 }, speakButton: { marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: '#F3F4F6' }, speakText: { color: '#374151', fontSize: 11, fontWeight: '800' }, noticeCard: { backgroundColor: '#FFFBEB', borderRadius: 14, padding: 12 }, noticeText: { color: '#92400E', fontSize: 12, lineHeight: 18 }, errorCard: { backgroundColor: '#FEF2F2', borderRadius: 14, padding: 12 }, errorText: { color: '#B91C1C', fontSize: 12, lineHeight: 18 }, composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' }, input: { flex: 1, minHeight: 48, maxHeight: 120, borderRadius: 16, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#F9FAFB', paddingHorizontal: 14, paddingVertical: 11, color: '#111827', fontSize: 15 }, rtlInput: { textAlign: 'right', writingDirection: 'rtl' }, sendButton: { minWidth: 70, minHeight: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', paddingHorizontal: 14 }, sendText: { color: '#FFFFFF', fontWeight: '900' }, disabled: { opacity: 0.4 }, pressed: { opacity: 0.8 },
});
