import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { getVoiceLanguage, type LanguageCode } from './voice-language';

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

export async function speakAssistantText(text: string, profile: VoiceProfile): Promise<void> {
  const normalizedText = text.trim();
  if (!normalizedText) return;

  await Speech.stop();

  const timeoutMs = Math.min(
    MAX_TTS_TIMEOUT_MS,
    Math.max(MIN_TTS_TIMEOUT_MS, normalizedText.length * TTS_TIMEOUT_PER_CHARACTER_MS),
  );

  await new Promise<void>((resolve) => {
    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const finish = () => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      resolve();
    };

    timeout = setTimeout(finish, timeoutMs);

    try {
      Speech.speak(normalizedText, {
        language: profile.locale,
        rate: profile.rate,
        pitch: profile.pitch,
        onDone: finish,
        onStopped: finish,
        onError: finish,
      });
    } catch {
      finish();
    }
  });
}

export async function stopAssistantSpeech(): Promise<void> {
  try {
    await Speech.stop();
  } catch {
    // Cleanup must never leave the voice state machine stuck.
  }
}
