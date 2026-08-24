export type LanguageCode =
  | 'fa-IR' | 'en-US' | 'en-GB' | 'es-ES' | 'es-MX' | 'fr-FR' | 'de-DE' | 'it-IT' | 'pt-BR' | 'pt-PT'
  | 'ru-RU' | 'uk-UA' | 'pl-PL' | 'nl-NL' | 'tr-TR' | 'ar-SA' | 'he-IL' | 'hi-IN' | 'bn-IN' | 'ur-PK'
  | 'pa-IN' | 'gu-IN' | 'mr-IN' | 'ta-IN' | 'te-IN' | 'ja-JP' | 'ko-KR' | 'zh-CN' | 'zh-TW' | 'vi-VN'
  | 'th-TH' | 'id-ID' | 'ms-MY' | 'fil-PH' | 'sv-SE' | 'no-NO' | 'da-DK' | 'fi-FI' | 'cs-CZ' | 'sk-SK'
  | 'hu-HU' | 'ro-RO' | 'bg-BG' | 'el-GR' | 'sr-RS' | 'hr-HR' | 'sl-SI' | 'sw-KE' | 'am-ET' | 'fa-AF' | 'fa-TJ';

export type VoiceLanguage = {
  code: LanguageCode;
  language: string;
  region: string;
  rtl: boolean;
  speechRecognitionLocale: string;
  ttsLocale: string;
};

export const VOICE_LANGUAGES: readonly VoiceLanguage[] = ([
  ['fa-IR', 'فارسی', 'Iran', true], ['en-US', 'English', 'United States', false], ['en-GB', 'English', 'United Kingdom', false],
  ['es-ES', 'Español', 'Spain', false], ['es-MX', 'Español', 'Mexico', false], ['fr-FR', 'Français', 'France', false],
  ['de-DE', 'Deutsch', 'Germany', false], ['it-IT', 'Italiano', 'Italy', false], ['pt-BR', 'Português', 'Brazil', false],
  ['pt-PT', 'Português', 'Portugal', false], ['ru-RU', 'Русский', 'Russia', false], ['uk-UA', 'Українська', 'Ukraine', false],
  ['pl-PL', 'Polski', 'Poland', false], ['nl-NL', 'Nederlands', 'Netherlands', false], ['tr-TR', 'Türkçe', 'Türkiye', false],
  ['ar-SA', 'العربية', 'Saudi Arabia', true], ['he-IL', 'עברית', 'Israel', true], ['hi-IN', 'हिन्दी', 'India', false],
  ['bn-IN', 'বাংলা', 'India', false], ['ur-PK', 'اردو', 'Pakistan', true], ['pa-IN', 'ਪੰਜਾਬੀ', 'India', false],
  ['gu-IN', 'ગુજરાતી', 'India', false], ['mr-IN', 'मराठी', 'India', false], ['ta-IN', 'தமிழ்', 'India', false],
  ['te-IN', 'తెలుగు', 'India', false], ['ja-JP', '日本語', 'Japan', false], ['ko-KR', '한국어', 'South Korea', false],
  ['zh-CN', '简体中文', 'China', false], ['zh-TW', '繁體中文', 'Taiwan', false], ['vi-VN', 'Tiếng Việt', 'Vietnam', false],
  ['th-TH', 'ไทย', 'Thailand', false], ['id-ID', 'Bahasa Indonesia', 'Indonesia', false], ['ms-MY', 'Bahasa Melayu', 'Malaysia', false],
  ['fil-PH', 'Filipino', 'Philippines', false], ['sv-SE', 'Svenska', 'Sweden', false], ['no-NO', 'Norsk', 'Norway', false],
  ['da-DK', 'Dansk', 'Denmark', false], ['fi-FI', 'Suomi', 'Finland', false], ['cs-CZ', 'Čeština', 'Czechia', false],
  ['sk-SK', 'Slovenčina', 'Slovakia', false], ['hu-HU', 'Magyar', 'Hungary', false], ['ro-RO', 'Română', 'Romania', false],
  ['bg-BG', 'Български', 'Bulgaria', false], ['el-GR', 'Ελληνικά', 'Greece', false], ['sr-RS', 'Српски', 'Serbia', false],
  ['hr-HR', 'Hrvatski', 'Croatia', false], ['sl-SI', 'Slovenščina', 'Slovenia', false], ['sw-KE', 'Kiswahili', 'Kenya', false],
  ['am-ET', 'አማርኛ', 'Ethiopia', false], ['fa-AF', 'دری', 'Afghanistan', true], ['fa-TJ', 'Тоҷикӣ', 'Tajikistan', false],
] as const).map(([code, language, region, rtl]) => ({
  code: code as LanguageCode,
  language,
  region,
  rtl,
  speechRecognitionLocale: code,
  ttsLocale: code,
}));

export function getVoiceLanguage(code: string): VoiceLanguage {
  return VOICE_LANGUAGES.find((item) => item.code === code) ?? VOICE_LANGUAGES[0];
}

export function isVoiceLocaleRTL(code: string): boolean {
  return getVoiceLanguage(code).rtl;
}
