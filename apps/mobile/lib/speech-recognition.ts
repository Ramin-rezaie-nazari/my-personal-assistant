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

const CONTEXTUAL_TERMS: Partial<Record<LanguageCode, readonly string[]>> = {
  'fa-IR': ['یادآوری', 'یادم بنداز', 'شام', 'ناهار', 'صبحانه', 'غذا', 'کالری', 'پروتئین', 'سبد خرید', 'موجودی خانه', 'تمرین'],
  'en-US': ['reminder', 'dinner', 'lunch', 'breakfast', 'meal', 'nutrition', 'protein', 'calories', 'shopping cart', 'workout'],
  'en-GB': ['reminder', 'dinner', 'lunch', 'breakfast', 'meal', 'nutrition', 'protein', 'calories', 'shopping basket', 'workout'],
  'es-ES': ['recordatorio', 'cena', 'almuerzo', 'desayuno', 'comida', 'nutrición', 'proteína', 'calorías', 'carrito', 'entrenamiento'],
  'es-MX': ['recordatorio', 'cena', 'comida', 'desayuno', 'nutrición', 'proteína', 'calorías', 'carrito', 'entrenamiento'],
  'fr-FR': ['rappel', 'dîner', 'déjeuner', 'petit-déjeuner', 'repas', 'nutrition', 'protéines', 'calories', 'panier', 'entraînement'],
  'de-DE': ['Erinnerung', 'Abendessen', 'Mittagessen', 'Frühstück', 'Essen', 'Ernährung', 'Protein', 'Kalorien', 'Warenkorb', 'Training'],
  'it-IT': ['promemoria', 'cena', 'pranzo', 'colazione', 'pasto', 'nutrizione', 'proteine', 'calorie', 'carrello', 'allenamento'],
  'pt-BR': ['lembrete', 'jantar', 'almoço', 'café da manhã', 'refeição', 'nutrição', 'proteína', 'calorias', 'carrinho', 'treino'],
  'ru-RU': ['напоминание', 'ужин', 'обед', 'завтрак', 'еда', 'питание', 'белок', 'калории', 'корзина', 'тренировка'],
  'tr-TR': ['hatırlatıcı', 'akşam yemeği', 'öğle yemeği', 'kahvaltı', 'yemek', 'beslenme', 'protein', 'kalori', 'sepet', 'antrenman'],
  'ja-JP': ['リマインダー', '夕食', '昼食', '朝食', '食事', '栄養', 'タンパク質', 'カロリー', 'カート', 'トレーニング'],
  'zh-CN': ['提醒', '晚饭', '午饭', '早餐', '食物', '营养', '蛋白质', '卡路里', '购物车', '训练'],
  'ar-SA': ['تذكير', 'عشاء', 'غداء', 'فطور', 'وجبة', 'تغذية', 'بروتين', 'سعرات', 'سلة التسوق', 'تمرين'],
};

const DEFAULT_CONTEXTUAL_TERMS = [
  'My Personal Assistant', 'Personal Brain', 'breakfast', 'lunch', 'dinner',
  'nutrition', 'protein', 'calories', 'reminder', 'shopping cart', 'workout',
  'موجودی خانه', 'تمرین', 'کالری', 'پروتئین',
] as const;

export function getSpeechContextualTerms(locale: string): readonly string[] {
  return CONTEXTUAL_TERMS[locale as LanguageCode] ?? DEFAULT_CONTEXTUAL_TERMS;
}

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
      contextualStrings: getSpeechContextualTerms(locale) as string[],
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
