import * as Speech from 'expo-speech';

import {
  VOICE_LANGUAGES,
  getVoiceLanguage,
  isVoiceLocaleRTL,
} from './voice-language';
import {
  VOICE_PROFILES,
  getVoiceProfile,
  getVoiceProfileForLocale,
  speakAssistantText,
  type VoiceProfile,
} from './voice';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('expo-speech', () => ({
  stop: jest.fn().mockResolvedValue(undefined),
  speak: jest.fn(),
}));

const EXPECTED_LOCALES = [
  'fa-IR', 'en-US', 'en-GB', 'es-ES', 'es-MX', 'fr-FR', 'de-DE', 'it-IT',
  'pt-BR', 'pt-PT', 'ru-RU', 'uk-UA', 'pl-PL', 'nl-NL', 'tr-TR', 'ar-SA',
  'he-IL', 'hi-IN', 'bn-IN', 'ur-PK', 'pa-IN', 'gu-IN', 'mr-IN', 'ta-IN',
  'te-IN', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW', 'vi-VN', 'th-TH', 'id-ID',
  'ms-MY', 'fil-PH', 'sv-SE', 'no-NO', 'da-DK', 'fi-FI', 'cs-CZ', 'sk-SK',
  'hu-HU', 'ro-RO', 'bg-BG', 'el-GR', 'sr-RS', 'hr-HR', 'sl-SI', 'sw-KE',
  'am-ET', 'fa-AF', 'fa-TJ',
] as const;

describe('Multilingual voice quality contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers every supported locale exactly once with aligned STT and TTS locales', () => {
    expect(VOICE_LANGUAGES).toHaveLength(EXPECTED_LOCALES.length);

    const codes = VOICE_LANGUAGES.map((item) => item.code);
    expect(new Set(codes).size).toBe(EXPECTED_LOCALES.length);
    expect(codes.sort()).toEqual([...EXPECTED_LOCALES].sort());

    for (const item of VOICE_LANGUAGES) {
      expect(item.language.trim()).not.toBe('');
      expect(item.region.trim()).not.toBe('');
      expect(item.speechRecognitionLocale).toBe(item.code);
      expect(item.ttsLocale).toBe(item.code);
    }
  });

  it('keeps RTL behavior correct for RTL locales', () => {
    const expectedRtl = new Set(['fa-IR', 'fa-AF', 'ar-SA', 'he-IL', 'ur-PK']);

    for (const locale of EXPECTED_LOCALES) {
      expect(isVoiceLocaleRTL(locale)).toBe(expectedRtl.has(locale));
      expect(getVoiceLanguage(locale).code).toBe(locale);
    }
  });

  it('has exactly ten user-selectable voice profiles with valid voice controls', () => {
    expect(VOICE_PROFILES).toHaveLength(10);
    expect(new Set(VOICE_PROFILES.map((profile) => profile.id)).size).toBe(10);

    const femaleCount = VOICE_PROFILES.filter((profile) => profile.gender === 'female').length;
    const maleCount = VOICE_PROFILES.filter((profile) => profile.gender === 'male').length;
    expect(femaleCount).toBe(5);
    expect(maleCount).toBe(5);

    for (const profile of VOICE_PROFILES) {
      expect(profile.name.trim()).not.toBe('');
      expect(profile.description.trim()).not.toBe('');
      expect(profile.rate).toBeGreaterThan(0);
      expect(profile.rate).toBeLessThanOrEqual(2);
      expect(profile.pitch).toBeGreaterThan(0);
      expect(profile.pitch).toBeLessThanOrEqual(2);
      expect(EXPECTED_LOCALES).toContain(profile.locale);
    }
  });

  it('maps any selected voice to every locale without losing voice identity', () => {
    for (const locale of EXPECTED_LOCALES) {
      const mapped = getVoiceProfileForLocale('venus', locale);
      expect(mapped.id).toBe('venus');
      expect(mapped.locale).toBe(locale);
      expect(mapped.nativeStyle).toBe(locale === 'fa-IR' ? 'tehran' : 'native');
    }
  });

  it('falls back safely for unknown voice IDs and locales', () => {
    const fallbackVoice = getVoiceProfile('does-not-exist');
    expect(fallbackVoice.id).toBe(VOICE_PROFILES[0].id);
    expect(getVoiceLanguage('does-not-exist').code).toBe(VOICE_LANGUAGES[0].code);
  });

  it('passes every supported locale through the TTS adapter with the correct locale', async () => {
    const speech = Speech as jest.Mocked<typeof Speech>;
    const speak = speech.speak as jest.Mock;
    speak.mockImplementation((_text, options) => {
      options?.onDone?.();
    });

    for (const locale of EXPECTED_LOCALES) {
      const profile: VoiceProfile = getVoiceProfileForLocale('venus', locale);
      await expect(speakAssistantText('Hello from My Personal Assistant.', profile)).resolves.toBeUndefined();

      const lastCall = speak.mock.calls.at(-1);
      expect(lastCall?.[1]).toMatchObject({
        language: locale,
        rate: profile.rate,
        pitch: profile.pitch,
      });
    }

    expect(speak).toHaveBeenCalledTimes(EXPECTED_LOCALES.length);
    expect(speech.stop).toHaveBeenCalledTimes(EXPECTED_LOCALES.length);
  });
});
