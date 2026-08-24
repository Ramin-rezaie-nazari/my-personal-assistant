import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppLocale, getStoredLocale, isRTL } from '../lib/i18n';
import { AssistantHistoryTurn, getAssistantHistory, sendAssistantMessage } from '../lib/assistant-api';
import { AssistantVoiceOrb, VoiceInteractionState } from '../components/AssistantVoiceOrb';
import { startRecognition, SpeechRecognitionHandle } from '../lib/speech-recognition';
import { VOICE_PROFILES, getStoredVoiceProfile, setStoredVoiceProfile, speakAssistantText, stopAssistantSpeech, VoiceProfile } from '../lib/voice';

type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string; meta?: string };

const copy = {
  en: {
    title: 'Your Assistant', subtitle: 'Just talk. I use your context, plans and preferences.', placeholder: 'Or type here as a fallback…', send: 'Send', back: 'Back', voice: 'Voice',
    welcome: 'I’m here. Talk to me naturally. I’ll handle the details and remember what matters.', error: 'I could not reach the assistant right now.', done: 'Done', understood: 'Understood', historyError: 'I could not restore the previous conversation.',
    idle: 'I’m listening whenever you are', listening: 'Listening…', thinking: 'Thinking…', speaking: 'Speaking…', saved: 'Voice saved', voices: 'Choose my voice', micError: 'Voice input is not available right now.',
  },
  fa: {
    title: 'دستیار تو', subtitle: 'فقط حرف بزن؛ من از context، برنامه‌ها و ترجیحاتت استفاده می‌کنم.', placeholder: 'اگر خواستی اینجا تایپ کن…', send: 'ارسال', back: 'برگشت', voice: 'صدا',
    welcome: 'من اینجام. راحت و طبیعی حرف بزن؛ جزئیات کار رو خودم جمع می‌کنم و چیزهای مهم رو یادت نگه می‌دارم.', error: 'الان نتونستم به دستیار وصل بشم. اتصال رو بررسی کن و دوباره امتحان کن.', done: 'انجام شد', understood: 'متوجه شدم', historyError: 'نتونستم گفت‌وگوی قبلی رو بازیابی کنم.',
    idle: 'هر وقت آماده بودی باهام حرف بزن', listening: 'دارم گوش می‌دم…', thinking: 'دارم فکر می‌کنم…', speaking: 'دارم جواب می‌دم…', saved: 'صدا ذخیره شد', voices: 'صدای منو انتخاب کن', micError: 'فعلاً ورودی صوتی در دسترس نیست.',
  },
};

const mapHistory = (turns: AssistantHistoryTurn[]): ChatMessage[] => turns.map((turn) => ({
  id: turn.id,
  role: turn.role,
  text: turn.text,
  meta: turn.role === 'assistant' && turn.action ? turn.action : undefined,
}));

export default function AssistantScreen() {
  const [locale, setLocale] = useState<AppLocale>('en');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyNotice, setHistoryNotice] = useState(false);
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile>(VOICE_PROFILES[0]);
  const [voiceMenuOpen, setVoiceMenuOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceInteractionState>('idle');
  const recognitionRef = useRef<SpeechRecognitionHandle | null>(null);
  const transcriptRef = useRef('');
  const submittedRef = useRef(false);

  useEffect(() => {
    let active = true;
    void Promise.all([getStoredLocale(), getStoredVoiceProfile()]).then(async ([stored, storedVoice]) => {
      const next = stored ?? 'en';
      if (!active) return;
      setLocale(next);
      setVoiceProfile(storedVoice);
      try {
        const history = await getAssistantHistory(40);
        if (!active) return;
        setMessages(history.length ? mapHistory(history) : [{ id: 'welcome', role: 'assistant', text: copy[next].welcome }]);
      } catch {
        if (!active) return;
        setHistoryNotice(true);
        setMessages([{ id: 'welcome', role: 'assistant', text: copy[next].welcome }]);
      } finally {
        if (active) setLoadingHistory(false);
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => () => {
    recognitionRef.current?.remove();
    void stopAssistantSpeech();
  }, []);

  const ui = copy[locale];
  const rtl = useMemo(() => isRTL(locale), [locale]);

  const submitText = async (text: string, fromVoice = false) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    submittedRef.current = true;
    setDraft('');
    transcriptRef.current = '';
    setSending(true);
    setError(null);
    setHistoryNotice(false);
    if (fromVoice) setVoiceState('thinking');
    setMessages((current) => [...current, { id: `u-${Date.now()}`, role: 'user', text: trimmed }]);
    try {
      const response = await sendAssistantMessage(trimmed);
      const executionMeta = response.execution ? (response.execution.executed ? ui.done : ui.understood) : null;
      const meta = [executionMeta, response.intent, typeof response.confidence === 'number' ? `confidence ${Math.round(response.confidence * 100)}%` : null].filter(Boolean).join(' · ');
      setMessages((current) => [...current, { id: `a-${Date.now()}`, role: 'assistant', text: response.message, meta: meta || undefined }]);
      if (fromVoice) {
        setVoiceState('speaking');
        await speakAssistantText(response.message, voiceProfile);
        setVoiceState('done');
        setTimeout(() => setVoiceState('idle'), 600);
      }
    } catch {
      setError(ui.error);
      if (fromVoice) setVoiceState('idle');
    } finally {
      setSending(false);
    }
  };

  const startVoice = async () => {
    if (voiceState === 'listening') {
      recognitionRef.current?.stop();
      return;
    }
    if (sending) return;
    submittedRef.current = false;
    transcriptRef.current = '';
    setError(null);
    setVoiceState('listening');
    recognitionRef.current?.remove();
    recognitionRef.current = await startRecognition(
      voiceProfile.locale,
      ({ transcript, isFinal }) => {
        transcriptRef.current = transcript;
        setDraft(transcript);
        if (isFinal && !submittedRef.current) void submitText(transcript, true);
      },
      () => {
        const transcript = transcriptRef.current.trim();
        recognitionRef.current?.remove();
        recognitionRef.current = null;
        if (transcript && !submittedRef.current && !sending) void submitText(transcript, true);
        else if (!sending && !submittedRef.current) setVoiceState('idle');
      },
      (message) => {
        recognitionRef.current?.remove();
        recognitionRef.current = null;
        setVoiceState('idle');
        setError(message || ui.micError);
      },
    );
    if (!recognitionRef.current) setVoiceState('idle');
  };

  const chooseVoice = async (voice: VoiceProfile) => {
    setVoiceProfile(voice);
    await setStoredVoiceProfile(voice.id);
    setVoiceMenuOpen(false);
    setVoiceState('done');
    setTimeout(() => setVoiceState('idle'), 500);
  };

  const orbLabel = voiceState === 'listening' ? ui.listening : voiceState === 'thinking' ? ui.thinking : voiceState === 'speaking' ? ui.speaking : voiceState === 'done' ? ui.saved : ui.idle;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={12}>
        <View style={[styles.header, rtl && styles.rtl]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>{rtl ? '→' : '←'} {ui.back}</Text></Pressable>
          <View style={styles.headerCenter}><Text style={styles.eyebrow}>PERSONAL BRAIN</Text><Text style={styles.title}>{ui.title}</Text></View>
          <Pressable onPress={() => setVoiceMenuOpen((open) => !open)} style={styles.voiceChip}><Text style={styles.voiceChipText}>◉ {ui.voice}</Text></Pressable>
        </View>

        {voiceMenuOpen ? (
          <View style={styles.voicePanel}>
            <Text style={[styles.voicePanelTitle, rtl && styles.rtlText]}>{ui.voices}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.voiceRow}>
              {VOICE_PROFILES.map((voice) => (
                <Pressable key={voice.id} onPress={() => void chooseVoice(voice)} style={[styles.voiceCard, voice.id === voiceProfile.id && styles.voiceCardSelected]}>
                  <View style={[styles.voiceAvatar, voice.gender === 'female' ? styles.femaleAvatar : styles.maleAvatar]}><Text style={styles.voiceAvatarText}>{voice.name.slice(0, 1)}</Text></View>
                  <Text style={styles.voiceName}>{voice.name}</Text>
                  <Text style={styles.voiceDescription}>{voice.description}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={[styles.subHeader, rtl && styles.rtl]}><Text style={styles.subtitle}>{ui.subtitle}</Text></View>

        <ScrollView contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => void startVoice()} disabled={sending}>
            <AssistantVoiceOrb state={voiceState} label={orbLabel} />
          </Pressable>
          {loadingHistory ? <View style={styles.loadingHistory}><ActivityIndicator size="small" /><Text style={styles.meta}>{locale === 'fa' ? 'در حال بازیابی گفت‌وگو…' : 'Restoring conversation…'}</Text></View> : null}
          {messages.map((message) => (
            <View key={message.id} style={[styles.bubble, message.role === 'user' ? styles.userBubble : styles.assistantBubble, rtl && styles.rtlBubble]}>
              <Text style={[styles.bubbleText, message.role === 'user' ? styles.userText : styles.assistantText, rtl && styles.rtlText]}>{message.text}</Text>
              {message.meta ? <Text style={[styles.meta, rtl && styles.rtlText]}>{message.meta}</Text> : null}
            </View>
          ))}
          {historyNotice ? <View style={styles.noticeCard}><Text style={styles.noticeText}>{ui.historyError}</Text></View> : null}
          {sending ? <View style={[styles.bubble, styles.assistantBubble]}><View style={styles.typing}><ActivityIndicator size="small" /><Text style={styles.meta}>{ui.thinking}</Text></View></View> : null}
          {error ? <View style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></View> : null}
        </ScrollView>

        <View style={[styles.composer, rtl && styles.rtl]}>
          <TextInput value={draft} onChangeText={setDraft} onSubmitEditing={() => void submitText(draft)} placeholder={ui.placeholder} placeholderTextColor="#9CA3AF" style={[styles.input, rtl && styles.rtlInput]} multiline maxLength={1000} />
          <Pressable onPress={() => void startVoice()} style={({ pressed }) => [styles.micButton, voiceState === 'listening' && styles.micButtonActive, pressed && styles.pressed]}><Text style={styles.micText}>⌕</Text></Pressable>
          <Pressable disabled={!draft.trim() || sending} onPress={() => void submitText(draft)} style={({ pressed }) => [styles.sendButton, (!draft.trim() || sending) && styles.disabled, pressed && styles.pressed]}><Text style={styles.sendText}>{sending ? '…' : ui.send}</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' }, flex: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }, rtl: { flexDirection: 'row-reverse' }, backButton: { width: 82, paddingVertical: 8 }, backText: { color: '#374151', fontWeight: '800', fontSize: 13 }, headerCenter: { flex: 1, alignItems: 'center' }, eyebrow: { color: '#9CA3AF', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 }, title: { color: '#111827', fontSize: 18, fontWeight: '900', marginTop: 2 }, voiceChip: { minWidth: 64, paddingHorizontal: 9, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F3E8FF', alignItems: 'center' }, voiceChipText: { color: '#6D28D9', fontSize: 11, fontWeight: '900' }, voicePanel: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 12 }, voicePanelTitle: { color: '#111827', fontSize: 13, fontWeight: '900', paddingHorizontal: 18, paddingTop: 12 }, voiceRow: { gap: 10, paddingHorizontal: 18, paddingTop: 10 }, voiceCard: { width: 104, padding: 10, borderRadius: 18, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' }, voiceCardSelected: { borderColor: '#8B5CF6', backgroundColor: '#F5F3FF' }, voiceAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 7 }, femaleAvatar: { backgroundColor: '#FCE7F3' }, maleAvatar: { backgroundColor: '#DBEAFE' }, voiceAvatarText: { fontSize: 16, fontWeight: '900', color: '#111827' }, voiceName: { color: '#111827', fontSize: 12, fontWeight: '900' }, voiceDescription: { color: '#6B7280', fontSize: 9, lineHeight: 13, marginTop: 3, textAlign: 'center' }, subHeader: { paddingHorizontal: 18, paddingVertical: 13, backgroundColor: '#FFFFFF' }, subtitle: { color: '#6B7280', fontSize: 13, lineHeight: 19, textAlign: 'center' }, messages: { flexGrow: 1, padding: 18, gap: 10, paddingBottom: 22 }, loadingHistory: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 }, bubble: { maxWidth: '88%', borderRadius: 20, padding: 14 }, assistantBubble: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderBottomLeftRadius: 7 }, userBubble: { alignSelf: 'flex-end', backgroundColor: '#111827', borderBottomRightRadius: 7 }, rtlBubble: { borderBottomLeftRadius: 20, borderBottomRightRadius: 7 }, bubbleText: { fontSize: 15, lineHeight: 22 }, userText: { color: '#FFFFFF' }, assistantText: { color: '#111827' }, rtlText: { textAlign: 'right' }, meta: { marginTop: 6, color: '#9CA3AF', fontSize: 10, lineHeight: 14 }, typing: { flexDirection: 'row', alignItems: 'center', gap: 8 }, noticeCard: { backgroundColor: '#FFFBEB', borderRadius: 14, padding: 12 }, noticeText: { color: '#92400E', fontSize: 12, lineHeight: 18 }, errorCard: { backgroundColor: '#FEF2F2', borderRadius: 14, padding: 12 }, errorText: { color: '#B91C1C', fontSize: 12, lineHeight: 18 }, composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' }, input: { flex: 1, minHeight: 48, maxHeight: 120, borderRadius: 16, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#F9FAFB', paddingHorizontal: 14, paddingVertical: 11, color: '#111827', fontSize: 15 }, rtlInput: { textAlign: 'right' }, micButton: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3E8FF' }, micButtonActive: { backgroundColor: '#7C3AED' }, micText: { color: '#6D28D9', fontSize: 20, fontWeight: '900' }, sendButton: { minWidth: 68, minHeight: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', paddingHorizontal: 14 }, sendText: { color: '#FFFFFF', fontWeight: '900' }, disabled: { opacity: 0.4 }, pressed: { opacity: 0.8 },
});
