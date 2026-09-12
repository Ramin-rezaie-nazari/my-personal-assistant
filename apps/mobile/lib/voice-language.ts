export type LanguageCode =
  | 'fa-IR'
  | 'fa-AF'
  | 'fa-TJ'
  | 'en-US'
  | 'en-GB'
  | 'de-DE'
  | 'fr-FR'
  | 'es-ES'
  | 'it-IT'
  | 'tr-TR'
  | 'ar-SA'
  | 'zh-CN'
  | 'ja-JP'
  | 'ko-KR';

export type VoiceLanguage = {
  code: LanguageCode;
  label: string;
};

const LANGUAGES: VoiceLanguage[] = [
  { code: 'fa-IR', label: 'Persian' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'de-DE', label: 'German' },
  { code: 'fr-FR', label: 'French' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'it-IT', label: 'Italian' },
  { code: 'tr-TR', label: 'Turkish' },
  { code: 'ar-SA', label: 'Arabic' },
  { code: 'zh-CN', label: 'Chinese' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'ko-KR', label: 'Korean' },
];

export function getVoiceLanguage(locale: string): VoiceLanguage {
  const normalized = locale.trim().replace('_', '-').toLowerCase();
  const exact = LANGUAGES.find((language) => language.code.toLowerCase() === normalized);
  if (exact) return exact;

  const language = normalized.split('-')[0];
  if (language === 'fa') return LANGUAGES[0];
  if (language === 'en') return normalized.startsWith('en-gb') ? LANGUAGES[2] : LANGUAGES[1];
  const match = LANGUAGES.find((item) => item.code.toLowerCase().startsWith(`${language}-`));
  return match ?? LANGUAGES[1];
}
