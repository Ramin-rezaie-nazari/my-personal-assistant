import { Platform } from 'react-native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { getVoiceLanguage, VOICE_LANGUAGES, type LanguageCode } from './voice-language';

export type SpeechRecognitionResult = { transcript: string; isFinal: boolean };
export type SpeechRecognitionHandle = { stop: () => void; abort: () => void; remove: () => void };
export type SpeechRecognitionProvider = {
  supports: (locale: LanguageCode) => boolean;
  start: (locale: LanguageCode, onResult: (result: SpeechRecognitionResult) => void, onEnd: () => void, onError: (message: string) => void) => Promise<SpeechRecognitionHandle | null>;
};

const ANDROID_SPEECH_SERVICE = 'com.google.android.googlequicksearchbox';

const CONTEXTUAL_TERMS: Partial<Record<LanguageCode, readonly string[]>> = {
  'fa-IR': ['یادآوری','یادم بنداز','شام','ناهار','صبحانه','غذا','کالری','پروتئین','سبد خرید','موجودی خانه','تمرین'],
  'en-US': ['reminder','dinner','lunch','breakfast','meal','nutrition','protein','calories','shopping cart','workout'],
  'en-GB': ['reminder','dinner','lunch','breakfast','meal','nutrition','protein','calories','shopping basket','workout'],
  'es-ES': ['recordatorio','cena','almuerzo','desayuno','comida','nutrición','proteína','calorías','carrito','entrenamiento'],
  'es-MX': ['recordatorio','cena','comida','desayuno','nutrición','proteína','calorías','carrito','entrenamiento'],
  'fr-FR': ['rappel','dîner','déjeuner','petit-déjeuner','repas','nutrition','protéines','calories','panier','entraînement'],
  'de-DE': ['Erinnerung','Abendessen','Mittagessen','Frühstück','Essen','Ernährung','Protein','Kalorien','Warenkorb','Training'],
  'it-IT': ['promemoria','cena','pranzo','colazione','pasto','nutrizione','proteine','calorie','carrello','allenamento'],
  'pt-BR': ['lembrete','jantar','almoço','café da manhã','refeição','nutrição','proteína','calorias','carrinho','treino'],
  'ru-RU': ['напоминание','ужин','обед','завтрак','еда','питание','белок','калории','корзина','тренировка'],
  'tr-TR': ['hatırlatıcı','akşam yemeği','öğle yemeği','kahvaltı','yemek','beslenme','protein','kalori','sepet','antrenman'],
  'ja-JP': ['リマインダー','夕食','昼食','朝食','食事','栄養','タンパク質','カロリー','カート','トレーニング'],
  'zh-CN': ['提醒','晚饭','午饭','早餐','食物','营养','蛋白质','卡路里','购物车','训练'],
  'ar-SA': ['تذكير','عشاء','غداء','فطور','وجبة','تغذية','بروتين','سعرات','سلة التسوق','تمرين'],
};

const DEFAULT_CONTEXTUAL_TERMS = ['My Personal Assistant','Personal Brain','breakfast','lunch','dinner','nutrition','protein','calories','reminder','shopping cart','workout','موجودی خانه','تمرین','کالری','پروتئین'] as const;
const ERROR_COPY: Partial<Record<LanguageCode, { permission: string; unavailable: string; recognition: string; start: string }>> = {
  'fa-IR': { permission: 'برای استفاده از گفت‌وگوی صوتی، اجازهٔ میکروفن لازمه.', unavailable: 'تشخیص گفتار روی این دستگاه در دسترس نیست. سرویس Google Speech را فعال کن و دوباره امتحان کن.', recognition: 'تشخیص صدا با مشکل مواجه شد.', start: 'شروع تشخیص صدا ناموفق بود.' },
  'en-US': { permission: 'Microphone permission is required.', unavailable: 'Speech recognition is not available on this device.', recognition: 'Speech recognition failed.', start: 'Could not start speech recognition.' },
  'en-GB': { permission: 'Microphone permission is required.', unavailable: 'Speech recognition is not available on this device.', recognition: 'Speech recognition failed.', start: 'Could not start speech recognition.' },
};
function getErrorCopy(locale: string) { return ERROR_COPY[locale as LanguageCode] ?? ERROR_COPY['en-US']!; }
export function getSpeechContextualTerms(locale: string): readonly string[] { return CONTEXTUAL_TERMS[locale as LanguageCode] ?? DEFAULT_CONTEXTUAL_TERMS; }
export function supportsOnDeviceSpeech(locale: string): boolean { return VOICE_LANGUAGES.some((item) => item.code === locale) && ExpoSpeechRecognitionModule.supportsOnDeviceRecognition(); }

export async function startRecognition(locale: string, onResult: (result: SpeechRecognitionResult) => void, onEnd: () => void, onError: (message: string) => void): Promise<SpeechRecognitionHandle | null> {
  const messages = getErrorCopy(locale);
  let cleaned = false;
  let ended = false;
  let resultListener: { remove: () => void } | null = null;
  let endListener: { remove: () => void } | null = null;
  let errorListener: { remove: () => void } | null = null;
  const removeListeners = () => { if (cleaned) return; cleaned = true; resultListener?.remove(); endListener?.remove(); errorListener?.remove(); };

  try {
    const permission = Platform.OS === 'android' ? await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync() : await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) { onError(messages.permission); return null; }
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) { onError(messages.unavailable); return null; }

    const language = getVoiceLanguage(locale);
    resultListener = ExpoSpeechRecognitionModule.addListener('result', (event) => { const first = event.results?.[0]; if (first?.transcript) onResult({ transcript: first.transcript, isFinal: Boolean(event.isFinal) }); });
    endListener = ExpoSpeechRecognitionModule.addListener('end', () => { ended = true; removeListeners(); onEnd(); });
    errorListener = ExpoSpeechRecognitionModule.addListener('error', (event) => { if (event.error === 'aborted') return; removeListeners(); onError(event.message || messages.recognition); });

    const stop = () => ExpoSpeechRecognitionModule.stop();
    const abort = () => { if (!ended) ExpoSpeechRecognitionModule.abort(); removeListeners(); };
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
        ...(Platform.OS === 'android' ? { androidRecognitionServicePackage: ANDROID_SPEECH_SERVICE } : {}),
      });
    } catch (error) { abort(); onError(error instanceof Error ? error.message : messages.start); return null; }
    return { stop, abort, remove };
  } catch (error) { removeListeners(); onError(error instanceof Error ? error.message : messages.start); return null; }
}

export async function startPersianRecognition(onResult: (result: SpeechRecognitionResult) => void, onEnd: () => void, onError: (message: string) => void): Promise<SpeechRecognitionHandle | null> {
  return startRecognition('fa-IR', onResult, onEnd, onError);
}
