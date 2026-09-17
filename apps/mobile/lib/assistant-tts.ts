import * as Speech from 'expo-speech';
import type { AppLocale } from './languages';
import { getVoiceLanguage } from './voice-language';

export async function speakAssistantText(text: string, locale: AppLocale): Promise<void> {
  const normalized = text.trim();
  if (!normalized) return;
  await Speech.stop();
  const language = getVoiceLanguage(locale).code;
  await new Promise<void>((resolve, reject) => {
    Speech.speak(normalized, {
      language,
      rate: 0.96,
      pitch: 1,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: (error) => reject(error),
    });
  });
}
