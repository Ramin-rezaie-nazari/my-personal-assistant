export type SupportedAppLocale =
  | 'en' | 'fa' | 'ar' | 'bn' | 'bg' | 'ca' | 'cs' | 'da' | 'de' | 'el' | 'es' | 'et' | 'fi' | 'fr' | 'gu'
  | 'he' | 'hi' | 'hr' | 'hu' | 'id' | 'it' | 'ja' | 'ka' | 'kn' | 'ko' | 'lt' | 'lv' | 'mk' | 'mr' | 'ms' | 'mt'
  | 'nl' | 'no' | 'pl' | 'pt' | 'ro' | 'ru' | 'sk' | 'sl' | 'sq' | 'sv' | 'sw' | 'ta' | 'te' | 'th' | 'tl' | 'tr'
  | 'uk' | 'ur' | 'vi' | 'zh';

/** Regional locale used for Azerbaijani Turkish in Iran. Turkish (Türkiye) remains `tr`. */
export type RegionalAppLocale = 'az';
/** Legacy codes remain type-compatible for historical source files but are never selectable/persisted. */
export type LegacyAppLocale = 'sr' | 'pa' | 'zh-CN' | 'zh-TW' | 'fil' | 'am' | 'so' | 'kk' | 'uz' | 'hy' | 'ku' | 'nb';
export type AppLocale = SupportedAppLocale | RegionalAppLocale | LegacyAppLocale;

export type AppLanguage = {
  code: AppLocale;
  englishName: string;
  nativeName: string;
  rtl?: boolean;
  regional?: boolean;
};

export const SUPPORTED_LANGUAGES: readonly AppLanguage[] = [
  { code: 'en', englishName: 'English', nativeName: 'English' },
  { code: 'fa', englishName: 'Persian', nativeName: 'فارسی', rtl: true },
  { code: 'ar', englishName: 'Arabic', nativeName: 'العربية', rtl: true },
  { code: 'bn', englishName: 'Bengali', nativeName: 'বাংলা' },
  { code: 'bg', englishName: 'Bulgarian', nativeName: 'Български' },
  { code: 'ca', englishName: 'Catalan', nativeName: 'Català' },
  { code: 'cs', englishName: 'Czech', nativeName: 'Čeština' },
  { code: 'da', englishName: 'Danish', nativeName: 'Dansk' },
  { code: 'de', englishName: 'German', nativeName: 'Deutsch' },
  { code: 'el', englishName: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'es', englishName: 'Spanish', nativeName: 'Español' },
  { code: 'et', englishName: 'Estonian', nativeName: 'Eesti' },
  { code: 'fi', englishName: 'Finnish', nativeName: 'Suomi' },
  { code: 'fr', englishName: 'French', nativeName: 'Français' },
  { code: 'gu', englishName: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'he', englishName: 'Hebrew', nativeName: 'עברית', rtl: true },
  { code: 'hi', englishName: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'hr', englishName: 'Croatian', nativeName: 'Hrvatski' },
  { code: 'hu', englishName: 'Hungarian', nativeName: 'Magyar' },
  { code: 'id', englishName: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'it', englishName: 'Italian', nativeName: 'Italiano' },
  { code: 'ja', englishName: 'Japanese', nativeName: '日本語' },
  { code: 'ka', englishName: 'Georgian', nativeName: 'ქართული' },
  { code: 'kn', englishName: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ko', englishName: 'Korean', nativeName: '한국어' },
  { code: 'lt', englishName: 'Lithuanian', nativeName: 'Lietuvių' },
  { code: 'lv', englishName: 'Latvian', nativeName: 'Latviešu' },
  { code: 'mk', englishName: 'Macedonian', nativeName: 'Македонски' },
  { code: 'mr', englishName: 'Marathi', nativeName: 'मराठी' },
  { code: 'ms', englishName: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'mt', englishName: 'Maltese', nativeName: 'Malti' },
  { code: 'nl', englishName: 'Dutch', nativeName: 'Nederlands' },
  { code: 'no', englishName: 'Norwegian', nativeName: 'Norsk' },
  { code: 'pl', englishName: 'Polish', nativeName: 'Polski' },
  { code: 'pt', englishName: 'Portuguese', nativeName: 'Português' },
  { code: 'ro', englishName: 'Romanian', nativeName: 'Română' },
  { code: 'ru', englishName: 'Russian', nativeName: 'Русский' },
  { code: 'sk', englishName: 'Slovak', nativeName: 'Slovenčina' },
  { code: 'sl', englishName: 'Slovenian', nativeName: 'Slovenščina' },
  { code: 'sq', englishName: 'Albanian', nativeName: 'Shqip' },
  { code: 'sv', englishName: 'Swedish', nativeName: 'Svenska' },
  { code: 'sw', englishName: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'ta', englishName: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', englishName: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'th', englishName: 'Thai', nativeName: 'ไทย' },
  { code: 'tl', englishName: 'Filipino', nativeName: 'Filipino' },
  { code: 'tr', englishName: 'Turkish (Türkiye)', nativeName: 'Türkçe (Türkiye)' },
  { code: 'uk', englishName: 'Ukrainian', nativeName: 'Українська' },
  { code: 'ur', englishName: 'Urdu', nativeName: 'اردو', rtl: true },
  { code: 'vi', englishName: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'zh', englishName: 'Chinese', nativeName: '中文' },
] as const;

export const REGIONAL_LANGUAGE_VARIANTS: readonly AppLanguage[] = [
  { code: 'az', englishName: 'Azerbaijani Turkish (Iran)', nativeName: 'Türki (ایران)', regional: true },
] as const;

export const LANGUAGE_OPTIONS: readonly AppLanguage[] = [...SUPPORTED_LANGUAGES, ...REGIONAL_LANGUAGE_VARIANTS];
export const SUPPORTED_LANGUAGE_COUNT = SUPPORTED_LANGUAGES.length;

export const DEFAULT_LOCALE: AppLocale = 'en';
const SUPPORTED_CODES = new Set<AppLocale>(LANGUAGE_OPTIONS.map((language) => language.code));

export function isSupportedLocale(value?: string | null): value is AppLocale {
  return Boolean(value && SUPPORTED_CODES.has(value as AppLocale));
}

export function getLanguage(code: AppLocale): AppLanguage {
  return LANGUAGE_OPTIONS.find((language) => language.code === code) ?? SUPPORTED_LANGUAGES[0];
}

export function isRTL(code: AppLocale): boolean {
  return code === 'ku' || getLanguage(code).rtl === true;
}

export function getTranslationLocaleCode(locale: AppLocale): string {
  if (locale === 'zh-CN' || locale === 'zh-TW') return 'zh';
  if (locale === 'fil') return 'fil';
  return locale;
}
