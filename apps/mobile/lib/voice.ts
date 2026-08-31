import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { getVoiceLanguage, type LanguageCode } from './voice-language';
import { speakPersianLocally, stopLocalPersianTts } from './local-persian-tts';

export type VoiceGender = 'female' | 'male';

export type VoiceProfile = {
  id: string;
  name: string;
  gender: VoiceGender;
  description: string;
  rate: number;
  pitch: number;
  locale: LanguageCode;
  nativeStyle: 'tehran' | 'native';
};

export type TtsProvider = {
  supports: (locale: LanguageCode) => boolean;
  speak: (text: string, profile: VoiceProfile) => Promise<void>;
  stop: () => Promise<void>;
};

const STORAGE_KEY = 'mypa.voice.profile.v1';
const MIN_TTS_TIMEOUT_MS = 15_000;
const MAX_TTS_TIMEOUT_MS = 60_000;
const TTS_TIMEOUT_PER_CHARACTER_MS = 90;

let voicesPromise: Promise<Speech.Voice[]> | null = null;

/** Voice character presets; the contract is vendor-agnostic. */
export const VOICE_PROFILES: VoiceProfile[] = [
  { id: 'venus', name: 'ونوس', gender: 'female', description: 'گرم، مخملی و صمیمی', rate: 0.96, pitch: 1.08, locale: 'fa-IR', nativeStyle: 'tehran' },
  { id: 'nila', name: 'نیلا', gender: 'female', description: 'نرم، شیک و آرام', rate: 0.94, pitch: 1.03, locale: 'fa-IR', nativeStyle: 'tehran' },
  { id: 'roya', name: 'رویا', gender: 'female', description: 'روشن، بازیگوش و زنده', rate: 1.01, pitch: 1.1, locale: 'fa-IR', nativeStyle: 'tehran' },
  { id: 'mahsa', name: 'مهسا', gender: 'female', description: 'باوقار، گرم و مطمئن', rate: 0.93, pitch: 1, locale: 'fa-IR', nativeStyle: 'tehran' },
  { id: 'darya', name: 'دریا', gender: 'female', description: 'آرام، دلنشین و احساسی', rate: 0.91, pitch: 1.05, locale: 'fa-IR', nativeStyle: 'tehran' },
  { id: 'arman', name: 'آرمان', gender: 'male', description: 'گرم، مطمئن و دوستانه', rate: 0.94, pitch: 0.92, locale: 'fa-IR', nativeStyle: 'tehran' },
  { id: 'shayan', name: 'شایان', gender: 'male', description: 'جوان، پرانرژی و صمیمی', rate: 1, pitch: 0.96, locale: 'fa-IR', nativeStyle: 'tehran' },
  { id: 'rayan', name: 'رایان', gender: 'male', description: 'آرام، شیک و حرفه‌ای', rate: 0.91, pitch: 0.9, locale: 'fa-IR', nativeStyle: 'tehran' },
  { id: 'kian', name: 'کیان', gender: 'male', description: 'محکم، خوش‌بیان و متین', rate: 0.89, pitch: 0.86, locale: 'fa-IR', nativeStyle: 'tehran' },
  { id: 'sina', name: 'سینا', gender: 'male', description: 'خودمانی، نرم و بازیگوش', rate: 0.98, pitch: 0.94, locale: 'fa-IR', nativeStyle: 'tehran' },
];

export const getVoiceProfile = (id: string | null | undefined): VoiceProfile =>
  VOICE_PROFILES.find((voice) => voice.id === id) ?? VOICE_PROFILES[0];

export function getVoiceProfileForLocale(
  id: string | null | undefined,
  locale: string | null | undefined,
): VoiceProfile {
  const profile = getVoiceProfile(id);
  const language = getVoiceLanguage(locale ?? 'en-US');
  return {
    ...profile,
    locale: language.code,
    nativeStyle: language.code === 'fa-IR' ? 'tehran' : 'native',
  };
}

export async function getStoredVoiceProfile(): Promise<VoiceProfile> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return getVoiceProfile(stored);
  } catch {
    return VOICE_PROFILES[0];
  }
}

export async function setStoredVoiceProfile(id: string): Promise<void> {
  const profile = getVoiceProfile(id);
  await AsyncStorage.setItem(STORAGE_KEY, profile.id);
}

async function getAvailableVoices(): Promise<Speech.Voice[]> {
  if (!voicesPromise) {
    voicesPromise = Speech.getAvailableVoicesAsync().catch((error) => {
      voicesPromise = null;
      throw error;
    });
  }
  return voicesPromise;
}

function pickInstalledVoice(voices: Speech.Voice[], locale: string): Speech.Voice | undefined {
  const normalized = locale.toLowerCase();
  const languageOnly = normalized.split('-')[0];
  const candidates = voices.filter((voice) => {
    const voiceLanguage = voice.language?.toLowerCase() ?? '';
    return voiceLanguage === normalized || voiceLanguage.split('-')[0] === languageOnly;
  });
  if (!candidates.length) return undefined;

  const exactMatch = (voice: Speech.Voice) =>
    Number(voice.language?.toLowerCase() === normalized);
  const enhanced = (voice: Speech.Voice) => Number(voice.quality === 'Enhanced');
  const localName = (voice: Speech.Voice) => {
    const value = `${voice.name ?? ''} ${voice.identifier ?? ''}`.toLowerCase();
    return Number(/farsi|persian|فارسی|iran|iranian|prs|pes/.test(value));
  };

  return [...candidates].sort((a, b) =>
    exactMatch(b) - exactMatch(a) ||
    enhanced(b) - enhanced(a) ||
    localName(b) - localName(a),
  )[0];
}

function localeForText(text: string, profile: VoiceProfile): LanguageCode {
  if (/[\u0600-\u06ff]/u.test(text)) return 'fa-IR';
  if (/[\u4e00-\u9fff]/u.test(text)) return 'zh-CN';
  if (/[\u3040-\u30ff]/u.test(text)) return 'ja-JP';
  if (/[\uac00-\ud7af]/u.test(text)) return 'ko-KR';
  return profile.locale;
}

function isPersianLocale(locale: LanguageCode): boolean {
  return locale === 'fa-IR' || locale === 'fa-AF' || locale === 'fa-TJ';
}

async function speakWithSystemTts(
  normalizedText: string,
  profile: VoiceProfile,
  textLocale: LanguageCode,
): Promise<void> {
  await Speech.stop();

  const timeoutMs = Math.min(
    MAX_TTS_TIMEOUT_MS,
    Math.max(MIN_TTS_TIMEOUT_MS, normalizedText.length * TTS_TIMEOUT_PER_CHARACTER_MS),
  );

  let availableVoices: Speech.Voice[] = [];
  let installedVoice: Speech.Voice | undefined;
  try {
    availableVoices = await getAvailableVoices();
    installedVoice = pickInstalledVoice(availableVoices, textLocale);
  } catch {
    // Use platform language routing if the voice list cannot be inspected.
  }

  if (isPersianLocale(textLocale) && !installedVoice) {
    throw new Error('No installed Persian system TTS voice is available.');
  }

  if (__DEV__) {
    const target = textLocale.toLowerCase();
    const matchingVoices = availableVoices
      .filter((voice) => {
        const language = voice.language?.toLowerCase() ?? '';
        return language === target || language.split('-')[0] === target.split('-')[0];
      })
      .map((voice) => ({
        identifier: voice.identifier,
        language: voice.language,
        quality: voice.quality,
        name: voice.name,
      }));

    console.warn('[MYPA][SYSTEM_TTS]', JSON.stringify({
      targetLocale: textLocale,
      matchingVoiceCount: matchingVoices.length,
      selectedVoice: installedVoice
        ? {
            identifier: installedVoice.identifier,
            language: installedVoice.language,
            quality: installedVoice.quality,
            name: installedVoice.name,
          }
        : null,
    }));
  }

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const finish = () => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      resolve();
    };

    const fail = (error?: unknown) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      reject(error instanceof Error ? error : new Error('System TTS failed.'));
    };

    timeout = setTimeout(finish, timeoutMs);

    try {
      Speech.speak(normalizedText, {
        language: installedVoice?.language ?? textLocale,
        voice: installedVoice?.identifier,
        rate: profile.rate,
        pitch: profile.pitch,
        volume: 1,
        onDone: finish,
        onStopped: finish,
        onError: fail,
      });
    } catch (error) {
      fail(error);
    }
  });
}

export async function speakAssistantText(text: string, profile: VoiceProfile): Promise<void> {
  const normalizedText = text.trim();
  if (!normalizedText) return;

  const textLocale = localeForText(normalizedText, profile);

  // Persian deliberately prefers our on-device neural provider. Android's
  // installed system voices are not guaranteed to expose a Persian voice.
  if (isPersianLocale(textLocale)) {
    try {
      const localStarted = await speakPersianLocally(normalizedText, profile.rate);
      if (localStarted) return;
    } catch (error) {
      if (__DEV__) console.warn('[MYPA][LOCAL_TTS]', error);
    }

    try {
      await speakWithSystemTts(normalizedText, profile, textLocale);
      return;
    } catch (error) {
      // Never silently speak Persian through a non-Persian fallback voice.
      if (__DEV__) console.warn('[MYPA][TTS]', 'Persian system fallback unavailable.', error);
      return;
    }
  }

  try {
    await speakWithSystemTts(normalizedText, profile, textLocale);
  } catch (error) {
    if (__DEV__) console.warn('[MYPA][TTS]', 'System TTS failed.', error);
  }
}

export async function stopAssistantSpeech(): Promise<void> {
  try {
    await stopLocalPersianTts();
  } catch {
    // Continue cleanup even if local provider is unavailable.
  }
  try {
    await Speech.stop();
  } catch {
    // Cleanup must never leave the voice state machine stuck.
  }
}
