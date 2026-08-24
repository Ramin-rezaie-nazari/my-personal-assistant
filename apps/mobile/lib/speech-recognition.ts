import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

export type SpeechRecognitionResult = {
  transcript: string;
  isFinal: boolean;
};

export type SpeechRecognitionHandle = {
  stop: () => void;
  remove: () => void;
};

export async function startPersianRecognition(
  onResult: (result: SpeechRecognitionResult) => void,
  onEnd: () => void,
  onError: (message: string) => void,
): Promise<SpeechRecognitionHandle | null> {
  const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  if (!permission.granted) {
    onError('برای استفاده از گفت‌وگوی صوتی، اجازهٔ میکروفن و تشخیص گفتار لازمه.');
    return null;
  }

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
      lang: 'fa-IR',
      interimResults: true,
      maxAlternatives: 1,
      continuous: false,
      requiresOnDeviceRecognition: onDevice,
      addsPunctuation: true,
      contextualStrings: [
        'دستیار من',
        'مای پرسنال اسیستنت',
        'صبحانه',
        'ناهار',
        'شام',
        'تمرین',
        'کالری',
        'پروتئین',
        'موجودی خانه',
      ],
    });
  } catch (error) {
    cleanup();
    onError(error instanceof Error ? error.message : 'شروع تشخیص صدا ناموفق بود.');
    return null;
  }

  return {
    stop: () => ExpoSpeechRecognitionModule.stop(),
    remove: cleanup,
  };
}
