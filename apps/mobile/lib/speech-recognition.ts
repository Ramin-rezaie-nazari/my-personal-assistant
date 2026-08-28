import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { getVoiceLanguage, VOICE_LANGUAGES, type LanguageCode } from './voice-language';

export type SpeechRecognitionResult = {
  transcript: string;
  isFinal: boolean;
};

export type SpeechRecognitionHandle = {
  stop: () => void;
  remove: () => void;
};

export type SpeechRecognitionProvider = {
  supports: (locale: LanguageCode) => boolean;
  start: (
    locale: LanguageCode,
    onResult: (result: SpeechRecognitionResult) => void,
    onEnd: () => void,
    onError: (message: string) => void,
  ) => Promise<SpeechRecognitionHandle | null>;
};

export function supportsOnDeviceSpeech(locale: string): boolean {
  return VOICE_LANGUAGES.some((item) => item.code === locale);
}

export async function startRecognition(
  locale: string,
  onResult: (result: SpeechRecognitionResult) => void,
  onEnd: () => void,
  onError: (message: string) => void,
): Promise<SpeechRecognitionHandle | null> {
  const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  if (!permission.granted) {
    onError('برای استفاده از گفت‌وگوی صوتی، اجازهٔ میکروفن و تشخیص گفتار لازمه.');
    return null;
  }

  const language = getVoiceLanguage(locale);
  const resultListener = ExpoSpeechRecognitionModule.addListener('result', (event) => {
    const first = event.results?.[0];
    if (first?.transcript) {
      onResult({ transcript: first.transcript, isFinal: Boolean(event.isFinal) });
    }
  });

  const endListener = ExpoSpeechRecognitionModule.addListener('end', onEnd);
  const errorListener = ExpoSpeechRecognitionModule.addListener('error', (event) => {
    onError(event.message || 'تشخیص صدا با مشکل مواجه شد.');
  });

  const cleanup = () => {
    resultListener.remove();
    endListener.remove();
    errorListener.remove();
  };

  try {
    const onDevice = ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
    ExpoSpeechRecognitionModule.start({
      lang: language.speechRecognitionLocale,
      interimResults: true,
      maxAlternatives: 1,
      continuous: false,
      requiresOnDeviceRecognition: onDevice,
      addsPunctuation: true,
      contextualStrings: [
        'My Personal Assistant', 'Personal Brain', 'breakfast', 'lunch', 'dinner',
        'nutrition', 'protein', 'calories', 'reminder', 'shopping cart', 'workout',
        'موجودی خانه', 'تمرین', 'کالری', 'پروتئین',
      ],
    });
  } catch (error) {
    cleanup();
    onError(error instanceof Error ? error.message : 'شروع تشخیص صدا ناموفق بود.');
    return null;
  }

  return { stop: () => ExpoSpeechRecognitionModule.stop(), remove: cleanup };
}

export async function startPersianRecognition(
  onResult: (result: SpeechRecognitionResult) => void,
  onEnd: () => void,
  onError: (message: string) => void,
): Promise<SpeechRecognitionHandle | null> {
  return startRecognition('fa-IR', onResult, onEnd, onError);
}
