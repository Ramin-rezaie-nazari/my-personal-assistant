import type { AppLocale } from './languages';

export type VoiceLanguage = {
  code: string;
  label: string;
};

const VOICE_CODES: Record<AppLocale, string> = {
  en: 'en-US',
  fa: 'fa-IR',
  ar: 'ar-SA',
  bn: 'bn-BD',
  bg: 'bg-BG',
  ca: 'ca-ES',
  cs: 'cs-CZ',
  da: 'da-DK',
  de: 'de-DE',
  el: 'el-GR',
  es: 'es-ES',
  et: 'et-EE',
  fi: 'fi-FI',
  fr: 'fr-FR',
  gu: 'gu-IN',
  he: 'he-IL',
  hi: 'hi-IN',
  hr: 'hr-HR',
  hu: 'hu-HU',
  id: 'id-ID',
  it: 'it-IT',
  ja: 'ja-JP',
  ka: 'ka-GE',
  kn: 'kn-IN',
  ko: 'ko-KR',
  lt: 'lt-LT',
  lv: 'lv-LV',
  mk: 'mk-MK',
  mr: 'mr-IN',
  ms: 'ms-MY',
  mt: 'mt-MT',
  nl: 'nl-NL',
  no: 'no-NO',
  pl: 'pl-PL',
  pt: 'pt-BR',
  ro: 'ro-RO',
  ru: 'ru-RU',
  sk: 'sk-SK',
  sl: 'sl-SI',
  sq: 'sq-AL',
  sv: 'sv-SE',
  sw: 'sw-KE',
  ta: 'ta-IN',
  te: 'te-IN',
  th: 'th-TH',
  tl: 'fil-PH',
  tr: 'tr-TR',
  uk: 'uk-UA',
  ur: 'ur-PK',
  vi: 'vi-VN',
  zh: 'zh-CN',
  'az-IR': 'az-AZ',
};

const VOICE_LABELS: Record<AppLocale, string> = {
  en: 'English', fa: 'Persian', ar: 'Arabic', bn: 'Bengali', bg: 'Bulgarian', ca: 'Catalan', cs: 'Czech', da: 'Danish', de: 'German',
  el: 'Greek', es: 'Spanish', et: 'Estonian', fi: 'Finnish', fr: 'French', gu: 'Gujarati', he: 'Hebrew', hi: 'Hindi', hr: 'Croatian', hu: 'Hungarian',
  id: 'Indonesian', it: 'Italian', ja: 'Japanese', ka: 'Georgian', kn: 'Kannada', ko: 'Korean', lt: 'Lithuanian', lv: 'Latvian', mk: 'Macedonian',
  mr: 'Marathi', ms: 'Malay', mt: 'Maltese', nl: 'Dutch', no: 'Norwegian', pl: 'Polish', pt: 'Portuguese', ro: 'Romanian', ru: 'Russian',
  sk: 'Slovak', sl: 'Slovenian', sq: 'Albanian', sv: 'Swedish', sw: 'Swahili', ta: 'Tamil', te: 'Telugu', th: 'Thai', tl: 'Filipino',
  tr: 'Turkish (Türkiye)', uk: 'Ukrainian', ur: 'Urdu', vi: 'Vietnamese', zh: 'Chinese', 'az-IR': 'Azerbaijani Turkish (Iran)',
};

export function getVoiceLanguage(locale: AppLocale): VoiceLanguage {
  return { code: VOICE_CODES[locale] ?? VOICE_CODES.en, label: VOICE_LABELS[locale] ?? VOICE_LABELS.en };
}
