import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { getVoiceLanguage, VOICE_LANGUAGES, type LanguageCode } from './voice-language';

export type SpeechRecognitionResult = {
  transcript: string;
  isFinal: boolean;
};

export type SpeechRecognitionHandle = {
  stop: () => void;
  abort: () => void;
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

const ERROR_COPY: Partial<Record<LanguageCode, { permission: string; recognition: string; start: string }>> = {
  'fa-IR': {
    permission: 'برای استفاده از گفت‌وگوی صوتی، اجازهٔ میکروفن و تشخیص گفتار لازمه.',
    recognition: 'تشخیص صدا با مشکل مواجه شد.',
    start: 'شروع تشخیص صدا ناموفق بود.',
  },
  'en-US': { permission: 'Microphone and speech recognition permission is required.', recognition: 'Speech recognition failed.', start: 'Could not start speech recognition.' },
  'en-GB': { permission: 'Microphone and speech recognition permission is required.', recognition: 'Speech recognition failed.', start: 'Could not start speech recognition.' },
  'es-ES': { permission: 'Se necesita permiso para el micrófono y el reconocimiento de voz.', recognition: 'El reconocimiento de voz ha fallado.', start: 'No se pudo iniciar el reconocimiento de voz.' },
  'fr-FR': { permission: 'L’accès au microphone et à la reconnaissance vocale est requis.', recognition: 'La reconnaissance vocale a échoué.', start: 'Impossible de démarrer la reconnaissance vocale.' },
  'de-DE': { permission: 'Mikrofon- und Spracherkennungsberechtigung ist erforderlich.', recognition: 'Die Spracherkennung ist fehlgeschlagen.', start: 'Die Spracherkennung konnte nicht gestartet werden.' },
  'it-IT': { permission: 'È necessario il permesso per microfono e riconoscimento vocale.', recognition: 'Il riconoscimento vocale non è riuscito.', start: 'Impossibile avviare il riconoscimento vocale.' },
  'pt-BR': { permission: 'É necessária a permissão do microfone e do reconhecimento de fala.', recognition: 'O reconhecimento de fala falhou.', start: 'Não foi possível iniciar o reconhecimento de fala.' },
  'ru-RU': { permission: 'Требуется доступ к микрофону и распознаванию речи.', recognition: 'Не удалось распознать речь.', start: 'Не удалось запустить распознавание речи.' },
  'tr-TR': { permission: 'Mikrofon ve konuşma tanıma izni gerekli.', recognition: 'Konuşma tanıma başarısız oldu.', start: 'Konuşma tanıma başlatılamadı.' },
  'ja-JP': { permission: 'マイクと音声認識の権限が必要です。', recognition: '音声認識に失敗しました。', start: '音声認識を開始できませんでした。' },
  'zh-CN': { permission: '需要麦克风和语音识别权限。', recognition: '语音识别失败。', start: '无法启动语音识别。' },
  'ar-SA': { permission: 'يلزم السماح بالميكروفون والتعرف على الكلام.', recognition: 'فشل التعرف على الكلام.', start: 'تعذر بدء التعرف على الكلام.' },
};

function getErrorCopy(locale: string) {
  return ERROR_COPY[locale as LanguageCode] ?? ERROR_COPY['en-US']!;
}

export function getSpeechContextualTerms(locale: string): readonly string[] {
  return CONTEXTUAL_TERMS[locale as LanguageCode] ?? DEFAULT_CONTEXTUAL_TERMS;
}

export function supportsOnDeviceSpeech(locale: string): boolean {
  if (!VOICE_LANGUAGES.some((item) => item.code === locale)) return false;
  return ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
}

export async function startRecognition(
  locale: string,
  onResult: (result: SpeechRecognitionResult) => void,
  onEnd: () => void,
  onError: (message: string) => void,
): Promise<SpeechRecognitionHandle | null> {
  const messages = getErrorCopy(locale);
  let cleaned = false;
  let ended = false;

  let resultListener: { remove: () => void } | null = null;
  let endListener: { remove: () => void } | null = null;
  let errorListener: { remove: () => void } | null = null;

  const removeListeners = () => {
    if (cleaned) return;
    cleaned = true;
    resultListener?.remove();
    endListener?.remove();
    errorListener?.remove();
  };

  try {
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      onError(messages.permission);
      return null;
    }

    const language = getVoiceLanguage(locale);
    resultListener = ExpoSpeechRecognitionModule.addListener('result', (event) => {
      const first = event.results?.[0];
      if (first?.transcript) onResult({ transcript: first.transcript, isFinal: Boolean(event.isFinal) });
    });

    endListener = ExpoSpeechRecognitionModule.addListener('end', () => {
      ended = true;
      removeListeners();
      onEnd();
    });

    errorListener = ExpoSpeechRecognitionModule.addListener('error', (event) => {
      if (event.error === 'aborted') return;
      removeListeners();
      onError(event.message || messages.recognition);
    });

    const stop = () => ExpoSpeechRecognitionModule.stop();
    const abort = () => {
      if (ended) return;
      removeListeners();
      ExpoSpeechRecognitionModule.abort();
    };
    const remove = () => removeListeners();

    try {
      ExpoSpeechRecognitionModule.start({
        lang: language.speechRecognitionLocale,
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
        contextualStrings: getSpeechContextualTerms(locale) as string[],
      });
    } catch (error) {
      abort();
      onError(error instanceof Error ? error.message : messages.start);
      return null;
    }

    return { stop, abort, remove };
  } catch (error) {
    removeListeners();
    onError(error instanceof Error ? error.message : messages.start);
    return null;
  }
}

export async function startPersianRecognition(
  onResult: (result: SpeechRecognitionResult) => void,
  onEnd: () => void,
  onError: (message: string) => void,
): Promise<SpeechRecognitionHandle | null> {
  return startRecognition('fa-IR', onResult, onEnd, onError);
}
