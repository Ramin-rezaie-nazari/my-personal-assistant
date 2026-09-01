import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppLocale, getStoredLocale, isRTL, normalizeLocale } from '../lib/i18n';
import { AssistantHistoryTurn, getAssistantHistory, sendAssistantMessage } from '../lib/assistant-api';
import { AssistantVoiceOrb, VoiceInteractionState } from '../components/AssistantVoiceOrb';
import { startRecognition, SpeechRecognitionHandle } from '../lib/speech-recognition';
import { VOICE_PROFILES, getStoredVoiceProfile, getVoiceProfileForLocale, speakAssistantText, stopAssistantSpeech, VoiceProfile, setStoredVoiceProfile } from '../lib/voice';

type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string; meta?: string; executed?: boolean; nextAction?: string | null };

const P = {
  bg: '#FFF9FC', surface: '#FFFFFF', surfaceSoft: '#FFF3F8', ink: '#5F5360', muted: '#9D8E9B', border: '#F4D9E6',
  pink: '#FF6FAE', pink2: '#FF9BC4', pink3: '#FFD4E4', pinkSoft: '#FFEAF3', lilac: '#D9C8F7', lilacSoft: '#F4EFFD',
  blue: '#C4ECFB', blueSoft: '#EFFBFF', mint: '#C5EEDC', mintSoft: '#EEFBF5', peach: '#FFD9C8', peachSoft: '#FFF3EE',
  gold: '#F8D77A', white: '#FFFFFF', green: '#65C8A1', danger: '#E97A9A'
} as const;

const copy = {
  en: { title: 'MYPA', welcome: 'Tell me what you need.', sub: 'Your context, plans and preferences are already here.', input: 'Speak naturally or type…', listening: 'Listening', thinking: 'Thinking', acting: 'On it', speaking: 'Speaking', idle: 'Ready when you are', saved: 'Voice saved', choose: 'Choose voice', send: 'Send', back: 'Back', error: 'I could not reach MYPA right now.', mic: 'Microphone unavailable.', done: 'Done', next: 'Next', suggestions: ['What should I eat?', 'Plan my day', 'Remind me tonight'] },
  fa: { title: 'MYPA', welcome: 'بگو چی لازم داری.', sub: 'زمینه، برنامه‌ها و ترجیحاتت از قبل اینجاست.', input: 'طبیعی حرف بزن یا تایپ کن…', listening: 'دارم گوش می‌دم', thinking: 'دارم فکر می‌کنم', acting: 'دارم انجامش می‌دم', speaking: 'دارم جواب می‌دم', idle: 'هر وقت آماده بودی', saved: 'صدا ذخیره شد', choose: 'انتخاب صدا', send: 'ارسال', back: 'برگشت', error: 'الان نتونستم به MYPA وصل بشم.', mic: 'میکروفون فعلاً در دسترس نیست.', done: 'انجام شد', next: 'بعدش', suggestions: ['برای شام چی بخورم؟', 'روزمو برنامه‌ریزی کن', 'امشب یادم بنداز'] },
} as const;

export default function AssistantPastelScreen() {
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
  const sessionRef = useRef(0);
  const fade = useRef(new Animated.Value(0)).current;
  const ui = copy[locale === 'fa' || locale.startsWith('fa-') ? 'fa' : 'en'];
  const rtl = useMemo(() => isRTL(locale), [locale]);

  useEffect(() => {
    let mounted = true;
    void Promise.all([getStoredLocale(), getStoredVoiceProfile()]).then(async ([stored, storedVoice]) => {
      if (!mounted) return;
      const activeLocale = stored ?? 'en';
      setLocale(activeLocale);
      setVoice(getVoiceProfileForLocale(storedVoice.id, normalizeLocale(activeLocale)));
      try {
        const history = await getAssistantHistory(40);
        if (!mounted) return;
        setMessages(history.length ? history.map((turn: AssistantHistoryTurn) => ({ id: turn.id, role: turn.role, text: turn.text, meta: turn.role === 'assistant' && turn.action ? turn.action : undefined, executed: turn.role === 'assistant' && Boolean(turn.executionId) })) : []);
      } catch {
        if (mounted) setError(activeLocale.startsWith('fa') ? 'نتونستم مکالمه‌ات رو بازیابی کنم.' : 'Unable to restore your conversation.');
      } finally {
        if (mounted) setLoading(false);
      }
      Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }).start();
    });
    return () => { mounted = false; sessionRef.current += 1; void stopAssistantSpeech(); recognitionRef.current?.abort(); recognitionRef.current?.remove(); };
  }, [fade]);

  const submit = async (raw: string, fromVoice = false) => {
    const text = raw.trim();
    if (!text || sending) return;
    const session = ++sessionRef.current;
    submittedRef.current = true;
    transcriptRef.current = '';
    setDraft(''); setSending(true); setError(null);
    if (fromVoice) setVoiceState('thinking');
    setMessages((current) => [...current, { id: `u-${Date.now()}`, role: 'user', text }]);
    try {
      const response = await sendAssistantMessage(text);
      if (session !== sessionRef.current) return;
      const executed = Boolean(response.execution?.executed);
      const meta = [response.intent, executed ? ui.done : null].filter(Boolean).join(' · ');
      setMessages((current) => [...current, { id: `a-${Date.now()}`, role: 'assistant', text: response.message, meta: meta || undefined, executed, nextAction: response.nextAction ?? null }]);
      if (fromVoice) {
        if (executed) { setVoiceState('acting'); await new Promise((resolve) => setTimeout(resolve, 220)); }
        if (session !== sessionRef.current) return;
        setVoiceState('speaking');
        await speakAssistantText(response.message, voice);
        if (session !== sessionRef.current) return;
        setVoiceState('done');
        setTimeout(() => { if (session === sessionRef.current) setVoiceState('idle'); }, 650);
      }
    } catch {
      if (session === sessionRef.current) { setError(ui.error); if (fromVoice) setVoiceState('idle'); }
    } finally { if (session === sessionRef.current) setSending(false); }
  };

  const startVoice = async () => {
    if (voiceState === 'listening') { recognitionRef.current?.stop(); return; }
    if (sending) return;
    const session = ++sessionRef.current;
    submittedRef.current = false; transcriptRef.current = ''; setError(null); setVoiceState('listening');
    recognitionRef.current?.abort(); recognitionRef.current?.remove();
    recognitionRef.current = await startRecognition(normalizeLocale(locale), ({ transcript, isFinal }) => {
      if (session !== sessionRef.current) return;
      transcriptRef.current = transcript; setDraft(transcript);
      if (isFinal && !submittedRef.current) void submit(transcript, true);
    }, () => {
      if (session !== sessionRef.current) return;
      const transcript = transcriptRef.current.trim(); recognitionRef.current?.remove(); recognitionRef.current = null;
      if (transcript && !submittedRef.current) void submit(transcript, true); else setVoiceState('idle');
    }, (message) => {
      if (session !== sessionRef.current) return;
      recognitionRef.current?.remove(); recognitionRef.current = null; setVoiceState('idle'); setError(message || ui.mic);
    });
    if (session === sessionRef.current && !recognitionRef.current) setVoiceState('idle');
  };

  const chooseVoice = async (next: VoiceProfile) => {
    const localized = getVoiceProfileForLocale(next.id, normalizeLocale(locale));
    setVoice(localized); await setStoredVoiceProfile(next.id); setVoiceMenu(false); setVoiceState('done');
    setTimeout(() => setVoiceState('idle'), 450);
  };

  const stateLabel = voiceState === 'listening' ? ui.listening : voiceState === 'thinking' ? ui.thinking : voiceState === 'acting' ? ui.acting : voiceState === 'speaking' ? ui.speaking : voiceState === 'done' ? ui.saved : ui.idle;

  if (loading) return <View style={styles.loading}><View style={styles.loadingOrb}><Ionicons name="sparkles" size={28} color={P.pink}/></View><Text style={styles.loadingBrand}>MYPA</Text><ActivityIndicator color={P.pink} /></View>;

  return <SafeAreaView style={styles.safe}>
    <View pointerEvents="none" style={styles.background}><View style={styles.bgPink}/><View style={styles.bgLilac}/><View style={styles.bgBlue}/><Text style={styles.bgSparkA}>✦</Text><Text style={styles.bgSparkB}>✧</Text></View>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
      <View style={[styles.header, rtl && styles.rtlRow]}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}><Ionicons name={rtl ? 'arrow-forward' : 'arrow-back'} color={P.pink} size={19}/></Pressable>
        <View style={styles.headerCenter}><Text style={styles.kicker}>PERSONAL BRAIN</Text><Text style={styles.headerTitle}>{ui.title}</Text></View>
        <Pressable onPress={() => setVoiceMenu((v) => !v)} style={styles.iconButton}><Ionicons name="options-outline" color={P.pink} size={20}/></Pressable>
      </View>
      {voiceMenu ? <View style={styles.voicePanel}>
        <View style={[styles.panelTitleRow, rtl && styles.rtlRow]}><View style={styles.panelFlower}><Text style={styles.panelFlowerText}>✿</Text></View><Text style={[styles.voicePanelTitle, rtl && styles.rtlText]}>{ui.choose}</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.voiceList}>
          {VOICE_PROFILES.map((item, index) => <Pressable key={item.id} onPress={() => void chooseVoice(item)} style={[styles.voiceCard, item.id === voice.id && styles.voiceCardActive]}>
            <View style={[styles.voiceAvatar, { backgroundColor: [P.pinkSoft, P.lilacSoft, P.blueSoft, P.mintSoft, P.peachSoft][index % 5] }]}><Text style={styles.voiceAvatarText}>{item.name.slice(0,1)}</Text></View>
            <Text style={styles.voiceName}>{item.name}</Text><Text style={styles.voiceDesc} numberOfLines={1}>{item.description}</Text>
          </Pressable>)}
        </ScrollView>
      </View> : null}
      <Animated.ScrollView style={{ opacity: fade }} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.heroVoice}><View style={styles.orbHalo}/><AssistantVoiceOrb state={voiceState} label={stateLabel} onPress={() => void startVoice()} /></View>
        {!messages.length ? <View style={styles.welcome}><Text style={[styles.welcomeTitle, rtl && styles.rtlText]}>{ui.welcome}</Text><Text style={[styles.welcomeSub, rtl && styles.rtlText]}>{ui.sub}</Text><View style={styles.suggestionWrap}>{ui.suggestions.map((suggestion) => <Pressable key={suggestion} onPress={() => void submit(suggestion)} style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}><Text style={[styles.suggestionText, rtl && styles.rtlText]}>{suggestion}</Text></Pressable>)}</View></View> : null}
        {messages.map((message) => <View key={message.id} style={[styles.messageBlock, message.role === 'user' ? styles.userBlock : styles.assistantBlock]}>
          <View style={[styles.message, message.role === 'user' ? styles.userMessage : styles.assistantMessage]}><Text style={[styles.messageText, rtl && styles.rtlText]}>{message.text}</Text>{message.meta ? <Text style={[styles.messageMeta, rtl && styles.rtlText]}>{message.meta}</Text> : null}</View>
          {message.role === 'assistant' && message.executed ? <View style={[styles.doneCard, rtl && styles.rtlRow]}><View style={styles.doneIcon}><Ionicons name="checkmark" size={17} color={P.white}/></View><Text style={[styles.doneText, rtl && styles.rtlText]}>{ui.done}</Text></View> : null}
          {message.role === 'assistant' && message.nextAction ? <Pressable onPress={() => void submit(message.nextAction ?? '')} style={styles.nextCard}><Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={15} color={P.pink}/><Text style={[styles.nextText, rtl && styles.rtlText]}>{ui.next} · {message.nextAction}</Text></Pressable> : null}
        </View>)}
        {sending ? <View style={styles.thinkingRow}><View style={styles.thinkingDot}/><Text style={styles.thinkingText}>{voiceState === 'acting' ? ui.acting : ui.thinking}</Text></View> : null}
        {error ? <View style={styles.errorCard}><Ionicons name="alert-circle-outline" color={P.danger} size={18}/><Text style={[styles.errorText, rtl && styles.rtlText]}>{error}</Text></View> : null}
      </Animated.ScrollView>
      <View style={styles.composerShell}><View style={[styles.composer, rtl && styles.rtlRow]}><TextInput value={draft} onChangeText={setDraft} onSubmitEditing={() => void submit(draft)} placeholder={ui.input} placeholderTextColor={P.muted} style={[styles.input, rtl && styles.rtlInput]} multiline maxLength={1000}/><Pressable onPress={() => void startVoice()} style={({ pressed }) => [styles.micButton, voiceState === 'listening' && styles.micActive, pressed && styles.pressed]}><Ionicons name={voiceState === 'listening' ? 'stop' : 'mic'} size={20} color={P.white}/></Pressable><Pressable disabled={!draft.trim() || sending} onPress={() => void submit(draft)} style={({ pressed }) => [styles.sendButton, (!draft.trim() || sending) && styles.disabled, pressed && styles.pressed]}><Ionicons name="arrow-up" size={18} color={P.white}/></Pressable></View><Text style={styles.composerHint}>{voiceState === 'listening' ? ui.listening : 'MYPA is ready whenever you are ✦'}</Text></View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: P.bg }, flex: { flex: 1 }, background: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', backgroundColor: P.bg },
  bgPink: { position: 'absolute', width: 300, height: 300, borderRadius: 220, top: -180, left: -110, backgroundColor: P.pinkSoft }, bgLilac: { position: 'absolute', width: 260, height: 260, borderRadius: 200, top: 240, right: -170, backgroundColor: P.lilacSoft }, bgBlue: { position: 'absolute', width: 220, height: 220, borderRadius: 180, bottom: -130, left: -120, backgroundColor: P.blueSoft }, bgSparkA: { position: 'absolute', top: 90, right: 20, color: P.gold, fontSize: 23 }, bgSparkB: { position: 'absolute', top: 210, left: 22, color: P.pink2, fontSize: 20 },
  loading: { flex: 1, backgroundColor: P.bg, alignItems: 'center', justifyContent: 'center' }, loadingOrb: { width: 76, height: 76, borderRadius: 38, backgroundColor: P.pinkSoft, borderWidth: 2, borderColor: P.pink3, alignItems: 'center', justifyContent: 'center' }, loadingBrand: { marginTop: 14, marginBottom: 12, color: P.ink, fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  header: { minHeight: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: P.border, backgroundColor: 'rgba(255,255,255,0.88)' }, rtlRow: { flexDirection: 'row-reverse' }, iconButton: { width: 42, height: 42, borderRadius: 15, backgroundColor: P.surface, borderWidth: 1, borderColor: P.border, alignItems: 'center', justifyContent: 'center' }, headerCenter: { flex: 1, alignItems: 'center' }, kicker: { color: P.pink, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 }, headerTitle: { color: P.ink, fontSize: 20, fontWeight: '900', marginTop: 2 },
  voicePanel: { padding: 14, borderBottomWidth: 1, borderBottomColor: P.border, backgroundColor: 'rgba(255,255,255,0.98)', shadowColor: P.pink2, shadowOpacity: .18, shadowRadius: 15, shadowOffset: { width: 0, height: 7 }, elevation: 4 }, panelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }, panelFlower: { width: 28, height: 28, borderRadius: 14, backgroundColor: P.pinkSoft, alignItems: 'center', justifyContent: 'center' }, panelFlowerText: { color: P.pink, fontSize: 16 }, voicePanelTitle: { color: P.ink, fontSize: 14, fontWeight: '900' }, voiceList: { gap: 10 }, voiceCard: { width: 126, padding: 10, borderRadius: 18, borderWidth: 1, borderColor: P.border, alignItems: 'center', backgroundColor: P.surface }, voiceCardActive: { borderColor: P.pink2, backgroundColor: P.pinkSoft }, voiceAvatar: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 7, borderWidth: 1, borderColor: P.white }, voiceAvatarText: { color: P.pink, fontSize: 17, fontWeight: '900' }, voiceName: { color: P.ink, fontSize: 12, fontWeight: '900' }, voiceDesc: { color: P.muted, fontSize: 9, marginTop: 2, maxWidth: 108, textAlign: 'center' },
  body: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 22 }, heroVoice: { alignItems: 'center', justifyContent: 'center', minHeight: 220, position: 'relative' }, orbHalo: { position: 'absolute', width: 208, height: 208, borderRadius: 104, backgroundColor: P.pinkSoft, borderWidth: 2, borderColor: P.pink3, opacity: .9 }, welcome: { alignItems: 'center', paddingHorizontal: 12, marginBottom: 18 }, welcomeTitle: { color: P.ink, fontSize: 25, fontWeight: '900', textAlign: 'center' }, welcomeSub: { color: P.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 315, marginTop: 7 }, suggestionWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 15 }, suggestion: { borderWidth: 1, borderColor: P.border, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: P.surface, shadowColor: P.pink2, shadowOpacity: .08, shadowRadius: 7, shadowOffset: { width: 0, height: 3 } }, suggestionText: { color: P.pink, fontSize: 11, fontWeight: '800' },
  messageBlock: { marginBottom: 12 }, userBlock: { alignItems: 'flex-end' }, assistantBlock: { alignItems: 'flex-start' }, message: { maxWidth: '91%', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1 }, userMessage: { backgroundColor: P.pinkSoft, borderColor: P.pink3 }, assistantMessage: { backgroundColor: P.surface, borderColor: P.border }, messageText: { color: P.ink, fontSize: 14, lineHeight: 21 }, messageMeta: { color: P.muted, fontSize: 9, fontWeight: '800', marginTop: 6 }, doneCard: { marginTop: 7, borderRadius: 15, backgroundColor: P.mintSoft, borderWidth: 1, borderColor: P.mint, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', flexDirection: 'row', gap: 8 }, doneIcon: { width: 27, height: 27, borderRadius: 13.5, backgroundColor: P.green, alignItems: 'center', justifyContent: 'center' }, doneText: { color: P.green, fontSize: 10, fontWeight: '900' }, nextCard: { marginTop: 7, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 15, borderWidth: 1, borderColor: P.border, backgroundColor: P.surface, paddingHorizontal: 12, paddingVertical: 10 }, nextText: { color: P.pink, flex: 1, fontSize: 11, fontWeight: '800' }, thinkingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingLeft: 4 }, thinkingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: P.pink2 }, thinkingText: { color: P.muted, fontSize: 12 }, errorCard: { marginTop: 10, borderWidth: 1, borderColor: P.pink3, backgroundColor: P.surface, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }, errorText: { flex: 1, color: P.danger, fontSize: 12 },
  composerShell: { paddingHorizontal: 14, paddingTop: 9, paddingBottom: 9, borderTopWidth: 1, borderTopColor: P.border, backgroundColor: 'rgba(255,255,255,0.96)' }, composer: { minHeight: 56, borderWidth: 1, borderColor: P.border, borderRadius: 21, backgroundColor: P.surface, paddingLeft: 14, paddingRight: 7, flexDirection: 'row', alignItems: 'flex-end', gap: 7, shadowColor: P.pink2, shadowOpacity: .1, shadowRadius: 11, shadowOffset: { width: 0, height: 3 } }, input: { flex: 1, color: P.ink, minHeight: 40, maxHeight: 96, paddingTop: 9, paddingBottom: 9, fontSize: 14 }, rtlInput: { textAlign: 'right' }, micButton: { width: 43, height: 43, borderRadius: 21.5, alignItems: 'center', justifyContent: 'center', backgroundColor: P.pink }, micActive: { backgroundColor: P.danger }, sendButton: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: P.pink2 }, disabled: { opacity: .28 }, composerHint: { color: P.muted, fontSize: 9, textAlign: 'center', marginTop: 5 }, pressed: { opacity: .78, transform: [{ scale: .985 }] }, rtlText: { textAlign: 'right' }
});