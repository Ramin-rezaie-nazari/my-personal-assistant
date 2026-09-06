export type LanguageCode = 'fa-IR' | 'fa-AF' | 'fa-TJ' | 'en-US' | 'zh-CN' | 'ja-JP' | 'ko-KR';

export type VoiceLanguage = {
  code: LanguageCode;
  label: string;
};

const LANGUAGES: Record<LanguageCode, VoiceLanguage> = {
  'fa-IR': { code: 'fa-IR', label: 'فارسی' },
  'fa-AF': { code: 'fa-AF', label: 'دری' },
  'fa-TJ': { code: 'fa-TJ', label: 'تاجیکی' },
  'en-US': { code: 'en-US', label: 'English' },
  'zh-CN': { code: 'zh-CN', label: '中文' },
  'ja-JP': { code: 'ja-JP', label: '日本語' },
  'ko-KR': { code: 'ko-KR', label: '한국어' },
};

export function getVoiceLanguage(locale: string | null | undefined): VoiceLanguage {
  const normalized = (locale ?? '').trim().toLowerCase().replace('_', '-');
  if (normalized.startsWith('fa-af')) return LANGUAGES['fa-AF'];
  if (normalized.startsWith('fa-tj')) return LANGUAGES['fa-TJ'];
  if (normalized.startsWith('fa')) return LANGUAGES['fa-IR'];
  if (normalized.startsWith('zh')) return LANGUAGES['zh-CN'];
  if (normalized.startsWith('ja')) return LANGUAGES['ja-JP'];
  if (normalized.startsWith('ko')) return LANGUAGES['ko-KR'];
  return LANGUAGES['en-US'];
}
