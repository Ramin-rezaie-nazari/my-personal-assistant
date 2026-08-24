import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

export type VoiceGender = 'female' | 'male';

export type VoiceProfile = {
  id: string;
  name: string;
  gender: VoiceGender;
  description: string;
  rate: number;
  pitch: number;
  locale: string;
  nativeStyle: 'tehran';
};

const STORAGE_KEY = 'mypa.voice.profile.v1';

/** Voice character presets; the contract is vendor-agnostic. */
export const VOICE_PROFILES: VoiceProfile[] = [
  { id: 'tehran-venus', name: 'ونوس', gender: 'female', description: 'گرم، مخملی و صمیمی', rate: 0.96, pitch: 1.08, locale: 'fa-IR', nativeStyle: 'tehran' },
  { id: 'tehran-nila', name: 'نیلا', gender: 'female', description: 'نرم، شیک و آرام', rate: 0.94, pitch: 1.03, locale: 'fa-IR', nativeStyle: 'tehran' },
  { id: 'tehran-roya', name: 'رویا', gender: 'female', description: 'روشن، بازیگوش و زنده', rate: 1.01, pitch: 1.1, locale: 'fa-IR', nativeStyle: 'tehran' },
  { id: 'tehran-mahsa', name: 'مهسا', gender: 'female', description: 'باوقار، گرم و مطمئن', rate: 0.93, pitch: 1, locale: 'fa-IR', nativeStyle: 'tehran' },
  { id: 'tehran-darya', name: 'دریا', gender: 'female', description: 'آرام، دلنشین و احساسی', rate: 0.91, pitch: 1.05, locale: 'fa-IR', nativeStyle: 'tehran' },
  { id: 'tehran-arman', name: 'آرمان', gender: 'male', description: 'گرم، مطمئن و دوستانه', rate: 0.94, pitch: 0.92, locale: 'fa-IR', nativeStyle: 'tehran' },
  { id: 'tehran-shayan', name: 'شایان', gender: 'male', description: 'جوان، پرانرژی و صمیمی', rate: 1, pitch: 0.96, locale: 'fa-IR', nativeStyle: 'tehran' },
  { id: 'tehran-rayan', name: 'رایان', gender: 'male', description: 'آرام، شیک و حرفه‌ای', rate: 0.91, pitch: 0.9, locale: 'fa-IR', nativeStyle: 'tehran' },
  { id: 'tehran-kian', name: 'کیان', gender: 'male', description: 'محکم، خوش‌بیان و متین', rate: 0.89, pitch: 0.86, locale: 'fa-IR', nativeStyle: 'tehran' },
  { id: 'tehran-sina', name: 'سینا', gender: 'male', description: 'خودمانی، نرم و بازیگوش', rate: 0.98, pitch: 0.94, locale: 'fa-IR', nativeStyle: 'tehran' },
];

export const getVoiceProfile = (id: string | null | undefined): VoiceProfile =>
  VOICE_PROFILES.find((voice) => voice.id === id) ?? VOICE_PROFILES[0];

export async function getStoredVoiceProfile(): Promise<VoiceProfile> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  return getVoiceProfile(stored);
}

export async function setStoredVoiceProfile(id: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, id);
}

export async function speakAssistantText(text: string, profile: VoiceProfile): Promise<void> {
  await Speech.stop();
  await new Promise<void>((resolve) => {
    Speech.speak(text, {
      language: profile.locale,
      rate: profile.rate,
      pitch: profile.pitch,
      onDone: resolve,
      onStopped: resolve,
      onError: resolve,
    });
  });
}

export async function stopAssistantSpeech(): Promise<void> {
  await Speech.stop();
}
