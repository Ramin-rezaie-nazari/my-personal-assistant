import { VoiceLanguageService } from './voice-language.service';

describe('VoiceLanguageService', () => {
  const service = new VoiceLanguageService();

  it('supports the complete first-generation multilingual voice set', () => {
    expect(service.list().map((profile) => profile.id)).toEqual([
      'fa-IR',
      'en-US',
      'en-GB',
      'es-MX',
      'fr-FR',
      'de-DE',
      'zh-CN',
      'ja-JP',
      'it-IT',
      'pt-BR',
      'ko-KR',
      'ar-SA',
      'ar-AE',
      'ar-EG',
      'hi-IN',
      'tr-TR',
      'ru-RU',
    ]);
  });

  it('keeps accent and RTL metadata explicit', () => {
    expect(service.get('fa-IR')).toMatchObject({ accent: 'tehran', direction: 'rtl' });
    expect(service.get('es-MX')).toMatchObject({ accent: 'mexican', direction: 'ltr' });
    expect(service.get('zh-CN')).toMatchObject({ accent: 'mandarin', direction: 'ltr' });
    expect(service.get('ar-EG')).toMatchObject({ accent: 'egyptian', direction: 'rtl' });
  });

  it('falls back to American English for an unknown voice profile', () => {
    expect(service.get('xx-XX')).toMatchObject({
      id: 'en-US',
      languageCode: 'en',
      countryCode: 'US',
      accent: 'american',
    });
  });

  it('marks every first-generation voice profile as offline-capable', () => {
    expect(service.list().every((profile) => profile.offlineVoice)).toBe(true);
  });
});
