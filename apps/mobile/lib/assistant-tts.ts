import * as Speech from 'expo-speech';

export async function speakAssistantText(text: string, language: 'fa' | 'en'): Promise<void> {
  const normalized = text.trim();
  if (!normalized) return;
  await Speech.stop();
  await new Promise<void>((resolve, reject) => {
    Speech.speak(normalized, {
      language: language === 'fa' ? 'fa-IR' : 'en-US',
      rate: 0.96,
      pitch: 1,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: (error) => reject(error),
    });
  });
}
