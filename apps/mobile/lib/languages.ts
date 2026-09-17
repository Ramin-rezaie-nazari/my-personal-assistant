export type AppLocale =
  | 'en'
  | 'fa'
  | 'ar'
  | 'tr'
  | 'az'
  | 'ru'
  | 'fr'
  | 'es'
  | 'de'
  | 'it'
  | 'pt'
  | 'nl'
  | 'pl'
  | 'uk'
  | 'ro'
  | 'el'
  | 'sv'
  | 'nb'
  | 'da'
  | 'fi'
  | 'cs'
  | 'sk'
  | 'hu'
  | 'bg'
  | 'hr'
  | 'sr'
  | 'he'
  | 'hi'
  | 'ur'
  | 'bn'
  | 'pa'
  | 'gu'
  | 'ta'
  | 'te'
  | 'mr'
  | 'id'
  | 'ms'
  | 'th'
  | 'vi'
  | 'zh-CN'
  | 'zh-TW'
  | 'ja'
  | 'ko'
  | 'fil'
  | 'sw'
  | 'am'
  | 'so'
  | 'kk'
  | 'uz'
  | 'hy'
  | 'ku';

export type AppLanguage = {
  code: AppLocale;
  englishName: string;
  nativeName: string;
  rtl?: boolean;
};

export const SUPPORTED_LANGUAGES: readonly AppLanguage[] = [
  { code: 'en', englishName: 'English', nativeName: 'English' },
  { code: 'fa', englishName: 'Persian', nativeName: 'فارسی', rtl: true },
  { code: 'ar', englishName: 'Arabic', nativeName: 'العربية', rtl: true },
  { code: 'tr', englishName: 'Turkish', nativeName: 'Türkçe' },
  { code: 'az', englishName: 'Azerbaijani', nativeName: 'Azərbaycan dili' },
  { code: 'ru', englishName: 'Russian', nativeName: 'Русский' },
  { code: 'fr', englishName: 'French', nativeName: 'Français' },
  { code: 'es', englishName: 'Spanish', nativeName: 'Español' },
  { code: 'de', englishName: 'German', nativeName: 'Deutsch' },
  { code: 'it', englishName: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', englishName: 'Portuguese', nativeName: 'Português' },
  { code: 'nl', englishName: 'Dutch', nativeName: 'Nederlands' },
  { code: 'pl', englishName: 'Polish', nativeName: 'Polski' },
  { code: 'uk', englishName: 'Ukrainian', nativeName: 'Українська' },
  { code: 'ro', englishName: 'Romanian', nativeName: 'Română' },
  { code: 'el', englishName: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'sv', englishName: 'Swedish', nativeName: 'Svenska' },
  { code: 'nb', englishName: 'Norwegian', nativeName: 'Norsk bokmål' },
  { code: 'da', englishName: 'Danish', nativeName: 'Dansk' },
  { code: 'fi', englishName: 'Finnish', nativeName: 'Suomi' },
  { code: 'cs', englishName: 'Czech', nativeName: 'Čeština' },
  { code: 'sk', englishName: 'Slovak', nativeName: 'Slovenčina' },
  { code: 'hu', englishName: 'Hungarian', nativeName: 'Magyar' },
  { code: 'bg', englishName: 'Bulgarian', nativeName: 'Български' },
  { code: 'hr', englishName: 'Croatian', nativeName: 'Hrvatski' },
  { code: 'sr', englishName: 'Serbian', nativeName: 'Српски' },
  { code: 'he', englishName: 'Hebrew', nativeName: 'עברית', rtl: true },
  { code: 'hi', englishName: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ur', englishName: 'Urdu', nativeName: 'اردو', rtl: true },
  { code: 'bn', englishName: 'Bengali', nativeName: 'বাংলা' },
  { code: 'pa', englishName: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'gu', englishName: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'ta', englishName: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', englishName: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', englishName: 'Marathi', nativeName: 'मराठी' },
  { code: 'id', englishName: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ms', englishName: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'th', englishName: 'Thai', nativeName: 'ไทย' },
  { code: 'vi', englishName: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'zh-CN', englishName: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'zh-TW', englishName: 'Chinese (Traditional)', nativeName: '繁體中文' },
  { code: 'ja', englishName: 'Japanese', nativeName: '日本語' },
  { code: 'ko', englishName: 'Korean', nativeName: '한국어' },
  { code: 'fil', englishName: 'Filipino', nativeName: 'Filipino' },
  { code: 'sw', englishName: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'am', englishName: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'so', englishName: 'Somali', nativeName: 'Soomaali' },
  { code: 'kk', englishName: 'Kazakh', nativeName: 'Қазақша' },
  { code: 'uz', englishName: 'Uzbek', nativeName: 'O‘zbekcha' },
  { code: 'hy', englishName: 'Armenian', nativeName: 'Հայերեն' },
  { code: 'ku', englishName: 'Kurdish', nativeName: 'Kurdî', rtl: true },
] as const;

export const DEFAULT_LOCALE: AppLocale = 'en';

const SUPPORTED_CODES = new Set<AppLocale>(SUPPORTED_LANGUAGES.map((language) => language.code));

export function isSupportedLocale(value?: string | null): value is AppLocale {
  return Boolean(value && SUPPORTED_CODES.has(value as AppLocale));
}

export function getLanguage(code: AppLocale): AppLanguage {
  return SUPPORTED_LANGUAGES.find((language) => language.code === code) ?? SUPPORTED_LANGUAGES[0];
}

export function isRTL(code: AppLocale): boolean {
  return getLanguage(code).rtl === true;
}
