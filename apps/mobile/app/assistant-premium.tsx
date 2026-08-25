import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppLocale, getStoredLocale, isRTL } from '../lib/i18n';
import { AssistantHistoryTurn, getAssistantHistory, sendAssistantMessage } from '../lib/assistant-api';
import { AssistantVoiceOrb, VoiceInteractionState } from '../components/AssistantVoiceOrb';
import { startRecognition, SpeechRecognitionHandle } from '../lib/speech-recognition';
import { VOICE_PROFILES, getStoredVoiceProfile, speakAssistantText, stopAssistantSpeech, VoiceProfile } from '../lib/voice';
import { PremiumGlow } from '../components/PremiumGlow';
import { PREMIUM } from '../lib/premium-ui';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  meta?: string;
  executed?: boolean;
  nextAction?: string | null;
};

const copy = {
  en: {
    title: 'MYPA',
    welcome: 'Tell me what you need.',
    sub: 'Your context, plans and preferences are already here.',
    input: 'Speak naturally or type…',
    listening: 'Listening',
    thinking: 'Thinking',
    acting: 'On it',
    speaking: 'Speaking',
    idle: 'Ready when you are',
    saved: 'Voice saved',
    choose: 'Choose voice',
    send: 'Send',
    back: 'Back',
    error: 'I could not reach MYPA right now.',
    mic: 'Microphone unavailable.',
    done: 'Done',
    next: 'Next',
    suggestions: ['What should I eat?', 'Plan my day', 'Remind me tonight'],
  },
  fa: {
    title: 'MYPA',
    welcome: 'بگو چی لازم داری.',
    sub: 'context، برنامه‌ها و ترجیحاتت از قبل اینجاست.',
    input: 'طبیعی حرف بزن یا تایپ کن…',
    listening: 'دارم گوش می‌دم',
    thinking: 'دارم فکر می‌کنم',
    acting: 'دارم انجامش می‌دم',
    speaking: 'دارم جواب می‌دم',
    idle: 'هر وقت آماده بودی',
    saved: 'صدا ذخیره شد',
    choose: 'انتخاب صدا',
    send: 'ارسال',
    back: 'برگشت',
    error: 'الان نتونستم به MYPA وصل بشم.',
    mic: 'میکروفون فعلاً در دسترس نیست.',
    done: 'انجام شد',
    next: 'بعدش',
    suggestions: ['برای شام چی بخورم؟', 'روزمو برنامه‌ریزی کن', 'امشب یادم بنداز'],
  },
} as const;

export default function AssistantPremiumScreen() {
  const [locale, setLocale] = useState<AppLocale>('en');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voice, setVoice] = useState<VoiceProfile>(VOICE_PROFILES[0]);
  const [voiceMenu, setVoiceMenu] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceInteractionState>('idle');
  const recognitionRef = useRef<SpeechRecognitionHandle | null>(null);
  const transcriptRef = useRef('');
  const submittedRef = useRef(false);
  const ui = copy[locale === 'fa' || locale.startsWith('fa-') ? 'fa' : 'en'];
  const rtl = useMemo(() => isRTL(locale), [locale]);

  useEffect(() => {
    let mounted = true;
    void Promise.all([getStoredLocale(), getStoredVoiceProfile()]).then(async ([stored, storedVoice]) => {
      if (!mounted) return;
      setLocale(stored ?? 'en');
      setVoice(storedVoice);
      try {
        const history = await getAssistantHistory(40);
        if (!mounted) return;
        setMessages(history.length
          ? history.map((turn: AssistantHistoryTurn) => ({
            id: turn.id,
            role: turn.role,
            text: turn.text,
            meta: turn.role === 'assistant' && turn.action ? turn.action : undefined,
            executed: turn.role === 'assistant' && Boolean(turn.executionId),
          }))
          : []);
      } catch {
        if (mounted) setError('Unable to restore your conversation.');
      } finally {
        if (mounted) setLoading(false);
      }
    });
    return () => {
      mounted = false;
      void stopAssistantSpeech();
      recognitionRef.current?.remove();
    };
  }, []);

  const submit = async (raw: string, fromVoice = false) => {
    const text = raw.trim();
    if (!text || sending) return;
    submittedRef.current = true;
    transcriptRef.current = '';
    setDraft('');
    setSending(true);
    setError(null);
    if (fromVoice) setVoiceState('thinking');
    setMessages((current) => [...current, { id: `u-${Date.now()}`, role: 'user', text }]);

    try {
      const response = await sendAssistantMessage(text);
      const executed = Boolean(response.execution?.executed);
      const meta = [response.intent, executed ? ui.done : null].filter(Boolean).join(' · ');
      setMessages((current) => [...current, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: response.message,
        meta: meta || undefined,
        executed,
        nextAction: response.nextAction ?? null,
      }]);

      if (fromVoice) {
        if (executed) {
          setVoiceState('acting');
          await new Promise((resolve) => setTimeout(resolve, 240));
        }
        setVoiceState('speaking');
        await speakAssistantText(response.message, voice);
        setVoiceState('done');
        setTimeout(() => setVoiceState('idle'), 650);
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
      voice.locale,
      ({ transcript, isFinal }) => {
        transcriptRef.current = transcript;
        setDraft(transcript);
        if (isFinal && !submittedRef.current) void submit(transcript, true);
      },
      () => {
        const transcript = transcriptRef.current.trim();
        recognitionRef.current?.remove();
        recognitionRef.current = null;
        if (transcript && !submittedRef.current) void submit(transcript, true);
        else setVoiceState('idle');
      },
      (message) => {
        recognitionRef.current?.remove();
        recognitionRef.current = null;
        setVoiceState('idle');
        setError(message || ui.mic);
      },
    );
    if (!recognitionRef.current) setVoiceState('idle');
  };

  const chooseVoice = async (next: VoiceProfile) => {
    setVoice(next);
    const { setStoredVoiceProfile } = await import('../lib/voice');
    await setStoredVoiceProfile(next.id);
    setVoiceMenu(false);
    setVoiceState('done');
    setTimeout(() => setVoiceState('idle'), 450);
  };

  const stateLabel = voiceState === 'listening'
    ? ui.listening
    : voiceState === 'thinking'
      ? ui.thinking
      : voiceState === 'acting'
        ? ui.acting
        : voiceState === 'speaking'
          ? ui.speaking
          : voiceState === 'done'
            ? ui.saved
            : ui.idle;

  if (loading) {
    return <View style={styles.loading}><PremiumGlow size={260} opacity={0.15}/><AssistantVoiceOrb state="idle" label=""/><Text style={styles.loadingText}>MYPA</Text><ActivityIndicator color={PREMIUM.colors.primaryBright} style={{ marginTop: 10 }}/></View>;
  }

  return <SafeAreaView style={styles.safe}>
    <View style={styles.bg} pointerEvents="none"><PremiumGlow size={330} opacity={0.14}/><View style={styles.bgBlob}/></View>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
      <View style={[styles.header, rtl && styles.rtlRow]}>
        <Pressable accessibilityRole="button" accessibilityLabel={ui.back} onPress={() => router.back()} style={styles.headerButton}><Ionicons name={rtl ? 'arrow-forward' : 'arrow-back'} color={PREMIUM.colors.inkSoft} size={20}/></Pressable>
        <View style={styles.headerCenter}><Text style={styles.headerKicker}>PERSONAL BRAIN</Text><Text style={styles.headerTitle}>{ui.title}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={ui.choose} onPress={() => setVoiceMenu((value) => !value)} style={styles.headerButton}><Ionicons name="options-outline" color={PREMIUM.colors.primaryBright} size={21}/></Pressable>
      </View>

      {voiceMenu ? <View style={styles.voicePanel}><Text style={[styles.voicePanelTitle, rtl && styles.rtlText]}>{ui.choose}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.voiceList}>{VOICE_PROFILES.map((item) => <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ selected: item.id === voice.id }} onPress={() => void chooseVoice(item)} style={[styles.voiceCard, item.id === voice.id && styles.voiceCardActive]}><View style={styles.voiceAvatar}><Text style={styles.voiceAvatarText}>{item.name.slice(0,1)}</Text></View><Text style={styles.voiceName}>{item.name}</Text></Pressable>)}</ScrollView></View> : null}

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.coreStage}><AssistantVoiceOrb state={voiceState} label={stateLabel} onPress={() => void startVoice()} /></View>

        {!messages.length ? <View style={styles.welcome}>
          <Text style={[styles.welcomeTitle, rtl && styles.rtlText]}>{ui.welcome}</Text>
          <Text style={[styles.welcomeSub, rtl && styles.rtlText]}>{ui.sub}</Text>
          <View style={styles.suggestionWrap}>{ui.suggestions.map((suggestion) => <Pressable key={suggestion} onPress={() => void submit(suggestion)} style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}><Text style={styles.suggestionText}>{suggestion}</Text></Pressable>)}</View>
        </View> : null}

        {messages.map((message) => <View key={message.id} style={[styles.messageBlock, message.role === 'user' ? styles.userBlock : styles.assistantBlock]}>
          <View style={[styles.message, message.role === 'user' ? styles.userMessage : styles.assistantMessage, rtl && styles.messageRTL]}>
            <Text style={[styles.messageText, rtl && styles.rtlText]}>{message.text}</Text>
            {message.meta ? <Text style={[styles.messageMeta, rtl && styles.rtlText]}>{message.meta}</Text> : null}
          </View>
          {message.role === 'assistant' && message.executed ? <View style={[styles.actionCard, rtl && styles.actionCardRTL]}>
            <View style={styles.actionIcon}><Ionicons name="checkmark" size={18} color={PREMIUM.colors.mint} /></View>
            <View style={styles.actionCopy}><Text style={[styles.actionLabel, rtl && styles.rtlText]}>{ui.done}</Text><Text style={[styles.actionBody, rtl && styles.rtlText]}>{message.text}</Text></View>
          </View> : null}
          {message.role === 'assistant' && message.nextAction ? <Pressable onPress={() => void submit(message.nextAction ?? '')} style={({ pressed }) => [styles.nextCard, pressed && styles.pressed]}><Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={15} color={PREMIUM.colors.primaryBright}/><Text style={[styles.nextText, rtl && styles.rtlText]}>{ui.next} · {message.nextAction}</Text></Pressable> : null}
        </View>)}

        {sending ? <View style={styles.thinkingRow}><ActivityIndicator size="small" color={PREMIUM.colors.primaryBright}/><Text style={styles.thinkingText}>{voiceState === 'acting' ? ui.acting : ui.thinking}</Text></View> : null}
        {error ? <View style={styles.errorCard}><Ionicons name="alert-circle-outline" color={PREMIUM.colors.rose} size={18}/><Text style={styles.errorText}>{error}</Text></View> : null}
      </ScrollView>

      <View style={styles.composerShell}><View style={[styles.composer, rtl && styles.rtlRow]}><TextInput value={draft} onChangeText={setDraft} onSubmitEditing={() => void submit(draft)} placeholder={ui.input} placeholderTextColor={PREMIUM.colors.muted} style={[styles.input, rtl && styles.rtlInput]} multiline maxLength={1000}/><Pressable accessibilityRole="button" accessibilityLabel="Voice input" onPress={() => void startVoice()} style={({ pressed }) => [styles.micButton, voiceState === 'listening' && styles.micActive, pressed && styles.pressed]}><Ionicons name={voiceState === 'listening' ? 'stop' : 'mic'} size={20} color={PREMIUM.colors.ink}/></Pressable><Pressable accessibilityRole="button" accessibilityLabel={ui.send} disabled={!draft.trim() || sending} onPress={() => void submit(draft)} style={({ pressed }) => [styles.sendButton, (!draft.trim() || sending) && styles.disabled, pressed && styles.pressed]}><Ionicons name="arrow-up" size={18} color={PREMIUM.colors.ink}/></Pressable></View></View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PREMIUM.colors.canvas }, flex: { flex: 1 }, bg: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', backgroundColor: PREMIUM.colors.canvas }, bgBlob: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: PREMIUM.colors.cyan, opacity: 0.035, right: -100, top: 120 },
  loading: { flex: 1, backgroundColor: PREMIUM.colors.canvas, alignItems: 'center', justifyContent: 'center' }, loadingText: { color: PREMIUM.colors.ink, fontSize: 17, fontWeight: '900', letterSpacing: 1 },
  header: { minHeight: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: PREMIUM.colors.border }, rtlRow: { flexDirection: 'row-reverse' }, headerButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: PREMIUM.colors.border, alignItems: 'center', justifyContent: 'center' }, headerCenter: { flex: 1, alignItems: 'center' }, headerKicker: { color: PREMIUM.colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 }, headerTitle: { color: PREMIUM.colors.ink, fontSize: 16, fontWeight: '900', marginTop: 3 },
  voicePanel: { backgroundColor: 'rgba(16,22,37,0.98)', borderBottomWidth: 1, borderBottomColor: PREMIUM.colors.border, paddingVertical: 12 }, voicePanelTitle: { color: PREMIUM.colors.ink, fontSize: 11, fontWeight: '900', paddingHorizontal: 16 }, voiceList: { gap: 9, paddingHorizontal: 16, paddingTop: 9 }, voiceCard: { width: 74, height: 76, borderRadius: 18, borderWidth: 1, borderColor: PREMIUM.colors.border, backgroundColor: 'rgba(255,255,255,0.025)', alignItems: 'center', justifyContent: 'center' }, voiceCardActive: { borderColor: PREMIUM.colors.primary, backgroundColor: 'rgba(139,124,255,0.10)' }, voiceAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(139,124,255,0.18)', alignItems: 'center', justifyContent: 'center' }, voiceAvatarText: { color: PREMIUM.colors.primaryBright, fontWeight: '900' }, voiceName: { color: PREMIUM.colors.inkSoft, fontSize: 9, fontWeight: '800', marginTop: 5 },
  body: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 24, gap: 10 }, coreStage: { alignItems: 'center', marginTop: -4 }, welcome: { alignItems: 'center', paddingHorizontal: 18, marginTop: -4, marginBottom: 8 }, welcomeTitle: { color: PREMIUM.colors.ink, fontSize: 28, lineHeight: 34, fontWeight: '900', textAlign: 'center' }, welcomeSub: { color: PREMIUM.colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8 }, suggestionWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 }, suggestion: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: PREMIUM.colors.border, backgroundColor: 'rgba(255,255,255,0.035)' }, suggestionText: { color: PREMIUM.colors.inkSoft, fontSize: 11, fontWeight: '800' },
  messageBlock: { gap: 7 }, message: { maxWidth: '88%', padding: 14, borderRadius: 20 }, messageRTL: { alignSelf: 'flex-end' }, userBlock: { alignItems: 'flex-end' }, assistantBlock: { alignItems: 'flex-start' }, userMessage: { alignSelf: 'flex-end', backgroundColor: 'rgba(139,124,255,0.13)', borderWidth: 1, borderColor: 'rgba(139,124,255,0.18)', borderBottomRightRadius: 7 }, assistantMessage: { alignSelf: 'flex-start', backgroundColor: PREMIUM.colors.surfaceGlass, borderWidth: 1, borderColor: PREMIUM.colors.border, borderBottomLeftRadius: 7 }, messageText: { color: PREMIUM.colors.ink, fontSize: 14, lineHeight: 21 }, messageMeta: { color: PREMIUM.colors.muted, fontSize: 9, marginTop: 8 }, actionCard: { maxWidth: '88%', alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, padding: 12, backgroundColor: 'rgba(65,212,154,0.08)', borderWidth: 1, borderColor: 'rgba(65,212,154,0.20)' }, actionCardRTL: { alignSelf: 'flex-end', flexDirection: 'row-reverse' }, actionIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(65,212,154,0.12)', alignItems: 'center', justifyContent: 'center' }, actionCopy: { flex: 1 }, actionLabel: { color: PREMIUM.colors.mint, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }, actionBody: { color: PREMIUM.colors.inkSoft, fontSize: 11, lineHeight: 17, marginTop: 3 }, nextCard: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 9, backgroundColor: 'rgba(139,124,255,0.08)', borderWidth: 1, borderColor: 'rgba(139,124,255,0.18)' }, nextText: { color: PREMIUM.colors.primaryBright, fontSize: 10, fontWeight: '900', flex: 1 },
  thinkingRow: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 6 }, thinkingText: { color: PREMIUM.colors.muted, fontSize: 11 }, errorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 18, padding: 12, backgroundColor: 'rgba(255,125,154,0.08)', borderWidth: 1, borderColor: 'rgba(255,125,154,0.18)' }, errorText: { color: PREMIUM.colors.rose, fontSize: 11, flex: 1 },
  composerShell: { paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: PREMIUM.colors.border, backgroundColor: 'rgba(7,10,18,0.96)' }, composer: { minHeight: 56, borderRadius: 20, backgroundColor: PREMIUM.colors.surfaceElevated, borderWidth: 1, borderColor: PREMIUM.colors.border, flexDirection: 'row', alignItems: 'flex-end', padding: 7, gap: 7 }, input: { flex: 1, maxHeight: 94, color: PREMIUM.colors.ink, fontSize: 14, lineHeight: 20, paddingHorizontal: 10, paddingVertical: 8 }, rtlInput: { textAlign: 'right' }, micButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }, micActive: { backgroundColor: 'rgba(95,232,255,0.18)' }, sendButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: PREMIUM.colors.primary, alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: 0.35 }, pressed: { opacity: 0.82, transform: [{ scale: 0.97 }] }, rtlText: { textAlign: 'right' },
});