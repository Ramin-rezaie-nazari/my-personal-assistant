import { Injectable } from '@nestjs/common';

export type VoiceLanguageId =
  | 'fa-IR'
  | 'en-US'
  | 'en-GB'
  | 'es-MX'
  | 'fr-FR'
  | 'de-DE'
  | 'zh-CN'
  | 'ja-JP'
  | 'it-IT'
  | 'pt-BR'
  | 'ko-KR'
  | 'ar-SA'
  | 'ar-AE'
  | 'ar-EG'
  | 'hi-IN'
  | 'tr-TR'
  | 'ru-RU';

export type VoiceLanguageProfile = Readonly<{
  id: VoiceLanguageId;
  languageCode: string;
  languageTag: string;
  countryCode: string;
  accent: string;
  direction: 'ltr' | 'rtl';
  offlineVoice: boolean;
  fallbackLanguage: string;
}>;

const PROFILES: Record<VoiceLanguageId, VoiceLanguageProfile> = {
  'fa-IR': {
    id: 'fa-IR',
    languageCode: 'fa',
    languageTag: 'fa-IR',
    countryCode: 'IR',
    accent: 'tehran',
    direction: 'rtl',
    offlineVoice: true,
    fallbackLanguage: 'fa',
  },
  'en-US': {
    id: 'en-US',
    languageCode: 'en',
    languageTag: 'en-US',
    countryCode: 'US',
    accent: 'american',
    direction: 'ltr',
    offlineVoice: true,
    fallbackLanguage: 'en',
  },
  'en-GB': {
    id: 'en-GB',
    languageCode: 'en',
    languageTag: 'en-GB',
    countryCode: 'GB',
    accent: 'british',
    direction: 'ltr',
    offlineVoice: true,
    fallbackLanguage: 'en',
  },
  'es-MX': {
    id: 'es-MX',
    languageCode: 'es',
    languageTag: 'es-MX',
    countryCode: 'MX',
    accent: 'mexican',
    direction: 'ltr',
    offlineVoice: true,
    fallbackLanguage: 'es',
  },
  'fr-FR': {
    id: 'fr-FR',
    languageCode: 'fr',
    languageTag: 'fr-FR',
    countryCode: 'FR',
    accent: 'france',
    direction: 'ltr',
    offlineVoice: true,
    fallbackLanguage: 'fr',
  },
  'de-DE': {
    id: 'de-DE',
    languageCode: 'de',
    languageTag: 'de-DE',
    countryCode: 'DE',
    accent: 'german',
    direction: 'ltr',
    offlineVoice: true,
    fallbackLanguage: 'de',
  },
  'zh-CN': {
    id: 'zh-CN',
    languageCode: 'zh',
    languageTag: 'zh-CN',
    countryCode: 'CN',
    accent: 'mandarin',
    direction: 'ltr',
    offlineVoice: true,
    fallbackLanguage: 'zh',
  },
  'ja-JP': {
    id: 'ja-JP',
    languageCode: 'ja',
    languageTag: 'ja-JP',
    countryCode: 'JP',
    accent: 'japanese',
    direction: 'ltr',
    offlineVoice: true,
    fallbackLanguage: 'ja',
  },
  'it-IT': {
    id: 'it-IT',
    languageCode: 'it',
    languageTag: 'it-IT',
    countryCode: 'IT',
    accent: 'italian',
    direction: 'ltr',
    offlineVoice: true,
    fallbackLanguage: 'it',
  },
  'pt-BR': {
    id: 'pt-BR',
    languageCode: 'pt',
    languageTag: 'pt-BR',
    countryCode: 'BR',
    accent: 'brazilian',
    direction: 'ltr',
    offlineVoice: true,
    fallbackLanguage: 'pt',
  },
  'ko-KR': {
    id: 'ko-KR',
    languageCode: 'ko',
    languageTag: 'ko-KR',
    countryCode: 'KR',
    accent: 'korean',
    direction: 'ltr',
    offlineVoice: true,
    fallbackLanguage: 'ko',
  },
  'ar-SA': {
    id: 'ar-SA',
    languageCode: 'ar',
    languageTag: 'ar-SA',
    countryCode: 'SA',
    accent: 'gulf-saudi',
    direction: 'rtl',
    offlineVoice: true,
    fallbackLanguage: 'ar',
  },
  'ar-AE': {
    id: 'ar-AE',
    languageCode: 'ar',
    languageTag: 'ar-AE',
    countryCode: 'AE',
    accent: 'emirati',
    direction: 'rtl',
    offlineVoice: true,
    fallbackLanguage: 'ar',
  },
  'ar-EG': {
    id: 'ar-EG',
    languageCode: 'ar',
    languageTag: 'ar-EG',
    countryCode: 'EG',
    accent: 'egyptian',
    direction: 'rtl',
    offlineVoice: true,
    fallbackLanguage: 'ar',
  },
  'hi-IN': {
    id: 'hi-IN',
    languageCode: 'hi',
    languageTag: 'hi-IN',
    countryCode: 'IN',
    accent: 'indian',
    direction: 'ltr',
    offlineVoice: true,
    fallbackLanguage: 'hi',
  },
  'tr-TR': {
    id: 'tr-TR',
    languageCode: 'tr',
    languageTag: 'tr-TR',
    countryCode: 'TR',
    accent: 'turkish',
    direction: 'ltr',
    offlineVoice: true,
    fallbackLanguage: 'tr',
  },
  'ru-RU': {
    id: 'ru-RU',
    languageCode: 'ru',
    languageTag: 'ru-RU',
    countryCode: 'RU',
    accent: 'russian',
    direction: 'ltr',
    offlineVoice: true,
    fallbackLanguage: 'ru',
  },
};

const DEFAULT_PROFILE = PROFILES['en-US'];

@Injectable()
export class VoiceLanguageService {
  list(): readonly VoiceLanguageProfile[] {
    return Object.values(PROFILES);
  }

  get(id?: string): VoiceLanguageProfile {
    if (id && id in PROFILES) {
      return PROFILES[id as VoiceLanguageId];
    }
    return DEFAULT_PROFILE;
  }
}
